import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/gym/gyms/[id]/clients - List gym clients
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const gymId = params.id;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      );
    }
    
    // Check permissions
    if (profile.role === 'client') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    if (profile.role === 'gym_manager' && profile.gym_id !== gymId) {
      return NextResponse.json(
        { error: 'Access to this gym denied' },
        { status: 403 }
      );
    }
    
    if (profile.role === 'personal_trainer') {
      // Check if trainer is assigned to this gym
      const { data: trainerAssignment } = await supabase
        .from('gym_trainers')
        .select('id, permissions')
        .eq('gym_id', gymId)
        .eq('trainer_user_id', user.id)
        .single();
      
      if (!trainerAssignment) {
        return NextResponse.json(
          { error: 'Not assigned to this gym' },
          { status: 403 }
        );
      }
      
      // Check if trainer can view all clients
      const permissions = trainerAssignment.permissions || {};
      if (!permissions.can_view_all_clients) {
        // Trainer can only see their assigned clients
        // This will be handled in the query below
      }
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    const status = searchParams.get('status') || 'active';
    const trainerId = searchParams.get('trainerId');
    const groupId = searchParams.get('groupId');
    const search = searchParams.get('search');
    
    // Build query
    let query = supabase
      .from('clients')
      .select(`
        *,
        user:users!clients_user_id_fkey(id, email, full_name, avatar_url, phone, timezone),
        assigned_pt:pts!clients_assigned_pt_id_fkey(
          id,
          user:users!pts_user_id_fkey(id, email, full_name)
        ),
        client_group:client_groups(*)
      `, { count: 'exact' })
      .eq('gym_id', gymId);
    
    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply trainer filter
    if (trainerId) {
      query = query.eq('assigned_pt_id', trainerId);
    } else if (profile.role === 'personal_trainer') {
      // Trainer can only see their assigned clients
      const { data: trainer } = await supabase
        .from('pts')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (trainer) {
        query = query.eq('assigned_pt_id', trainer.id);
      }
    }
    
    // Apply group filter
    if (groupId) {
      query = query.eq('client_group_id', groupId);
    }
    
    // Apply search filter
    if (search) {
      query = query.or(`
        users.full_name.ilike.%${search}%,
        users.email.ilike.%${search}%,
        clients.phone.ilike.%${search}%
      `);
    }
    
    // Apply pagination
    query = query.order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
    
    // Execute query
    const { data: clients, error, count } = await query;
    
    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }
    
    // Get gym capacity info
    const { data: gym } = await supabase
      .from('gyms')
      .select('max_clients, current_clients')
      .eq('id', gymId)
      .single();
    
    // Format response
    const formattedClients = clients?.map(client => ({
      id: client.id,
      userId: client.user_id,
      user: client.user ? {
        id: client.user.id,
        email: client.user.email,
        fullName: client.user.full_name,
        avatar: client.user.avatar_url,
        phone: client.user.phone,
        timezone: client.user.timezone
      } : null,
      gymId: client.gym_id,
      assignedTrainer: client.assigned_pt ? {
        id: client.assigned_pt.id,
        user: client.assigned_pt.user
      } : null,
      clientGroup: client.client_group ? {
        id: client.client_group.id,
        name: client.client_group.name,
        color: client.client_group.color_code
      } : null,
      subscription: {
        type: client.subscription_type,
        id: client.subscription_id
      },
      contact: {
        phone: client.phone,
        mobile: client.mobile,
        address: client.address,
        preferredContact: client.preferred_contact,
        preferredContactDetail: client.preferred_contact_detail
      },
      emergency: {
        name: client.emergency_name,
        phone: client.emergency_phone,
        relationship: client.emergency_rel
      },
      goals: {
        calories: client.calorie_goal,
        protein: client.protein_goal,
        carbs: client.carbs_goal,
        fat: client.fat_goal,
        weeklyWorkouts: client.weekly_workout_goal,
        notes: client.goals,
        context: client.context,
        motivation: client.motivation
      },
      status: client.status,
      isAtRisk: client.at_risk,
      lastLogin: client.last_login_at,
      notes: client.pt_notes,
      metadata: {
        dateOfBirth: client.date_of_birth,
        joined: client.created_at,
        updated: client.updated_at
      }
    })) || [];
    
    return NextResponse.json({
      clients: formattedClients,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      },
      capacity: gym ? {
        used: gym.current_clients || 0,
        total: gym.max_clients || 20,
        percentage: gym.max_clients ? Math.round((gym.current_clients || 0) / gym.max_clients * 100) : 0,
        status: gym.max_clients ? 
          (gym.current_clients || 0) >= gym.max_clients ? 'critical' :
          (gym.current_clients || 0) >= gym.max_clients * 0.9 ? 'warning' :
          (gym.current_clients || 0) >= gym.max_clients * 0.8 ? 'notice' : 'good'
          : 'good'
      } : null
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/gyms/[id]/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/gyms/[id]/clients - Add client to gym
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const gymId = params.id;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      );
    }
    
    // Check permissions - only owners and gym managers can add clients
    const canAddClients = profile.role === 'owner' || 
                         (profile.role === 'gym_manager' && profile.gym_id === gymId);
    
    if (!canAddClients) {
      // Check if trainer has permission to add clients
      if (profile.role === 'personal_trainer') {
        const { data: trainer } = await supabase
          .from('gym_trainers')
          .select('permissions')
          .eq('gym_id', gymId)
          .eq('trainer_user_id', user.id)
          .single();
        
        if (!trainer || !trainer.permissions?.can_add_clients) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }
    
    // Parse request body
    const body = await request.json();
    
    // Check if adding by userId or by email (new user)
    let clientUserId = body.userId;
    let newUserData = null;
    
    if (!clientUserId && body.email) {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password || 'TempPassword123!', // Should generate a secure temp password
        email_confirm: true,
        user_metadata: {
          full_name: body.fullName || '',
          phone: body.phone || ''
        }
      });
      
      if (authError) {
        console.error('Error creating user:', authError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      clientUserId = authData.user.id;
      newUserData = {
        id: authData.user.id,
        email: authData.user.email,
        role: 'client',
        full_name: body.fullName || '',
        phone: body.phone || '',
        gym_id: gymId
      };
    }
    
    if (!clientUserId) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists in this gym
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('gym_id', gymId)
      .eq('user_id', clientUserId)
      .single();
    
    if (existingClient) {
      return NextResponse.json(
        { error: 'Client already exists in this gym' },
        { status: 400 }
      );
    }
    
    // Check gym capacity
    const { data: gym } = await supabase
      .from('gyms')
      .select('max_clients, current_clients')
      .eq('id', gymId)
      .single();
    
    if (gym && gym.current_clients >= gym.max_clients) {
      return NextResponse.json(
        { 
          error: 'Gym has reached maximum client capacity',
          capacity: {
            used: gym.current_clients,
            total: gym.max_clients,
            percentage: Math.round(gym.current_clients / gym.max_clients * 100)
          }
        },
        { status: 400 }
      );
    }
    
    // Create or update user record
    if (newUserData) {
      await supabase
        .from('users')
        .insert(newUserData);
    } else {
      // Update existing user's gym association
      await supabase
        .from('users')
        .update({
          gym_id: gymId,
          role: 'client'
        })
        .eq('id', clientUserId);
    }
    
    // Create client record
    const clientData = {
      user_id: clientUserId,
      gym_id: gymId,
      assigned_pt_id: body.trainerUserId ? 
        (await supabase
          .from('pts')
          .select('id')
          .eq('user_id', body.trainerUserId)
          .single()
        ).data?.id : null,
      client_group_id: body.groupId,
      phone: body.phone,
      mobile: body.mobile,
      address: body.address,
      date_of_birth: body.dateOfBirth,
      preferred_contact: body.preferredContact,
      preferred_contact_detail: body.preferredContactDetail,
      contact_notes: body.contactNotes,
      emergency_name: body.emergencyName,
      emergency_phone: body.emergencyPhone,
      emergency_rel: body.emergencyRelationship,
      calorie_goal: body.calorieGoal || 2000,
      protein_goal: body.proteinGoal || 150,
      carbs_goal: body.carbsGoal || 200,
      fat_goal: body.fatGoal || 65,
      weekly_workout_goal: body.weeklyWorkoutGoal || 3,
      goals: body.goals,
      context: body.context,
      motivation: body.motivation,
      pt_notes: body.ptNotes,
      status: 'active'
    };
    
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select(`
        *,
        user:users!clients_user_id_fkey(id, email, full_name, avatar_url)
      `)
      .single();
    
    if (clientError) {
      console.error('Error creating client:', clientError);
      
      // Clean up user if we created it
      if (newUserData) {
        await supabase.auth.admin.deleteUser(clientUserId);
      }
      
      return NextResponse.json(
        { error: 'Failed to create client' },
        { status: 500 }
      );
    }
    
    // Send welcome email if requested
    if (body.sendWelcomeEmail && body.email) {
      // In production, you would integrate with your email service
      console.log('Welcome email would be sent to:', body.email);
    }
    
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        userId: client.user_id,
        user: client.user ? {
          id: client.user.id,
          email: client.user.email,
          fullName: client.user.full_name,
          avatar: client.user.avatar_url
        } : null,
        gymId: client.gym_id,
        status: client.status,
        goals: {
          calories: client.calorie_goal,
          protein: client.protein_goal,
          carbs: client.carbs_goal,
          fat: client.fat_goal,
          weeklyWorkouts: client.weekly_workout_goal
        },
        metadata: {
          joined: client.created_at
        }
      },
      message: newUserData ? 
        'Client account created and added to gym successfully' :
        'Client added to gym successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/gyms/[id]/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}