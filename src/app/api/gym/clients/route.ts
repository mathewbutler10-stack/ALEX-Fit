import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/gym/clients - List gym clients with capacity checking
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'pt' || !profile.gym_id) {
      return NextResponse.json(
        { error: 'Gym manager access required' },
        { status: 403 }
      );
    }
    
    const gymId = profile.gym_id;
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';
    
    // Build query
    let query = supabase
      .from('clients')
      .select(`
        *,
        user:users!clients_user_id_fkey(id, email, full_name, avatar_url, phone),
        assigned_pt:pts!clients_assigned_pt_id_fkey(
          id,
          user:users!pts_user_id_fkey(id, email, full_name)
        )
      `, { count: 'exact' })
      .eq('gym_id', gymId);
    
    // Apply status filter
    if (status) {
      query = query.eq('status', status);
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
    
    // Get gym capacity info from PT record
    const { data: ptRecord } = await supabase
      .from('pts')
      .select('max_clients')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .single();
    
    const maxClients = ptRecord?.max_clients || 20;
    const currentClients = count || 0;
    const capacityPercentage = maxClients > 0 ? Math.round((currentClients / maxClients) * 100) : 0;
    
    // Format response
    const formattedClients = clients?.map(client => ({
      id: client.id,
      userId: client.user_id,
      user: client.user ? {
        id: client.user.id,
        email: client.user.email,
        fullName: client.user.full_name,
        avatar: client.user.avatar_url,
        phone: client.user.phone
      } : null,
      assignedTrainer: client.assigned_pt ? {
        id: client.assigned_pt.id,
        name: client.assigned_pt.user?.full_name,
        email: client.assigned_pt.user?.email
      } : null,
      contact: {
        phone: client.phone,
        mobile: client.mobile,
        address: client.address
      },
      goals: {
        calories: client.calorie_goal,
        protein: client.protein_goal,
        carbs: client.carbs_goal,
        fat: client.fat_goal,
        weeklyWorkouts: client.weekly_workout_goal
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
      capacity: {
        used: currentClients,
        total: maxClients,
        percentage: capacityPercentage,
        available: maxClients - currentClients,
        status: capacityPercentage >= 100 ? 'critical' : 
                capacityPercentage >= 90 ? 'warning' : 
                capacityPercentage >= 80 ? 'notice' : 'good'
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/clients - Add client to gym with capacity check
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, gym_id, full_name')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'pt' || !profile.gym_id) {
      return NextResponse.json(
        { error: 'Gym manager access required' },
        { status: 403 }
      );
    }
    
    const gymId = profile.gym_id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { email, fullName, phone } = body;
    
    if (!email || !fullName) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }
    
    // Check capacity before adding
    const { data: ptRecord } = await supabase
      .from('pts')
      .select('max_clients')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .single();
    
    const maxClients = ptRecord?.max_clients || 20;
    
    // Get current client count
    const { count: currentCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active');
    
    if ((currentCount || 0) >= maxClients) {
      return NextResponse.json(
        { 
          error: 'Gym has reached maximum client capacity',
          capacity: {
            used: currentCount || 0,
            total: maxClients,
            percentage: Math.round((currentCount || 0) / maxClients * 100),
            available: 0
          },
          suggestion: 'Please upgrade your subscription to add more clients'
        },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role, gym_id')
      .eq('email', email)
      .single();
    
    let clientUserId;
    
    if (existingUser) {
      // User exists - check if already in this gym
      if (existingUser.gym_id === gymId) {
        return NextResponse.json(
          { error: 'User is already a client in this gym' },
          { status: 400 }
        );
      }
      
      clientUserId = existingUser.id;
      
      // Update user's gym association
      await supabase
        .from('users')
        .update({
          gym_id: gymId,
          role: 'client'
        })
        .eq('id', clientUserId);
      
    } else {
      // Create new user
      // Note: In production, you'd use proper auth flow
      // For now, we'll create a user record without auth
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          full_name: fullName,
          role: 'client',
          gym_id: gymId,
          phone: phone,
          status: 'active'
        })
        .select('id')
        .single();
      
      if (userError || !newUser) {
        console.error('Error creating user:', userError);
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      clientUserId = newUser.id;
    }
    
    // Create client record
    const clientData = {
      user_id: clientUserId,
      gym_id: gymId,
      phone: phone,
      status: 'active',
      calorie_goal: body.calorieGoal || 2000,
      protein_goal: body.proteinGoal || 150,
      carbs_goal: body.carbsGoal || 200,
      fat_goal: body.fatGoal || 65,
      weekly_workout_goal: body.weeklyWorkoutGoal || 3
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
      return NextResponse.json(
        { error: 'Failed to create client record' },
        { status: 500 }
      );
    }
    
    // Update capacity tracking
    const newCount = (currentCount || 0) + 1;
    const newPercentage = Math.round(newCount / maxClients * 100);
    
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        userId: client.user_id,
        user: client.user ? {
          id: client.user.id,
          email: client.user.email,
          fullName: client.user.full_name
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
      capacity: {
        used: newCount,
        total: maxClients,
        percentage: newPercentage,
        available: maxClients - newCount,
        status: newPercentage >= 100 ? 'critical' : 
                newPercentage >= 90 ? 'warning' : 
                newPercentage >= 80 ? 'notice' : 'good'
      },
      message: existingUser ? 
        'Existing user added as client to your gym' :
        'New client created and added to your gym'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}