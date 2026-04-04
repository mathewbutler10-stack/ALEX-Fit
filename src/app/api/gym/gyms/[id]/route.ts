import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/gym/gyms/[id] - Get gym details
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
        .select('id')
        .eq('gym_id', gymId)
        .eq('trainer_user_id', user.id)
        .single();
      
      if (!trainerAssignment) {
        return NextResponse.json(
          { error: 'Not assigned to this gym' },
          { status: 403 }
        );
      }
    }
    
    // Fetch gym details with related data
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select(`
        *,
        owner:users!gyms_owner_id_fkey(id, email, full_name, avatar_url),
        subscription:gym_subscriptions!gym_subscriptions_gym_id_fkey(
          *,
          plan:subscription_plans(*)
        ),
        features:gym_features(*),
        client_groups(*),
        trainers:gym_trainers(
          *,
          trainer:users!gym_trainers_trainer_user_id_fkey(id, email, full_name, avatar_url)
        )
      `)
      .eq('id', gymId)
      .single();
    
    if (gymError || !gym) {
      return NextResponse.json(
        { error: 'Gym not found' },
        { status: 404 }
      );
    }
    
    // Fetch usage statistics
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const { data: monthlyUsage } = await supabase
      .from('gym_monthly_usage')
      .select('*')
      .eq('gym_id', gymId)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single();
    
    // Fetch client count
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active');
    
    // Fetch recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentClients } = await supabase
      .from('clients')
      .select('id, user_id, created_at, users!clients_user_id_fkey(full_name)')
      .eq('gym_id', gymId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Format response
    const response = {
      id: gym.id,
      name: gym.name,
      slug: gym.slug || gym.name.toLowerCase().replace(/\s+/g, '-'),
      description: gym.description,
      contact: {
        phone: gym.phone,
        email: gym.email,
        address: gym.address,
        city: gym.city,
        state: gym.state,
        postcode: gym.postcode,
        country: gym.country || 'Australia'
      },
      subscription: {
        tier: gym.subscription_tier,
        plan: gym.subscription?.[0]?.plan || null,
        status: gym.subscription?.[0]?.status || 'active',
        billingCycle: gym.billing_cycle,
        monthlyFee: gym.monthly_fee,
        nextBillingDate: gym.next_billing_date,
        stripeCustomerId: gym.stripe_customer_id
      },
      capacity: {
        clients: {
          used: clientCount || 0,
          total: gym.max_clients,
          percentage: gym.max_clients ? Math.round((clientCount || 0) / gym.max_clients * 100) : 0,
          status: gym.max_clients ? 
            (clientCount || 0) >= gym.max_clients ? 'critical' :
            (clientCount || 0) >= gym.max_clients * 0.9 ? 'warning' :
            (clientCount || 0) >= gym.max_clients * 0.8 ? 'notice' : 'good'
            : 'good'
        },
        trainers: {
          used: gym.current_trainers || 0,
          total: gym.max_trainers,
          percentage: gym.max_trainers ? Math.round((gym.current_trainers || 0) / gym.max_trainers * 100) : 0
        }
      },
      features: gym.features?.map((f: any) => ({
        key: f.feature_key,
        enabled: f.is_enabled,
        limits: f.limits
      })) || [],
      groups: gym.client_groups?.map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        color: g.color_code,
        clientCount: 0 // Would need to query separately
      })) || [],
      trainers: gym.trainers?.map((t: any) => ({
        id: t.id,
        userId: t.trainer_user_id,
        name: t.trainer?.full_name,
        email: t.trainer?.email,
        avatar: t.trainer?.avatar_url,
        role: t.role,
        permissions: t.permissions,
        isActive: t.is_active,
        maxClients: t.max_clients,
        currentClients: t.current_clients,
        joinedDate: t.joined_date
      })) || [],
      usage: monthlyUsage ? {
        month: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
        clientCount: monthlyUsage.client_count,
        trainerCount: monthlyUsage.trainer_count,
        mealsAssigned: monthlyUsage.meals_assigned,
        workoutsAssigned: monthlyUsage.workouts_assigned,
        baseFee: monthlyUsage.base_fee,
        overageFee: monthlyUsage.overage_fee,
        totalFee: monthlyUsage.total_fee,
        isBilled: monthlyUsage.is_billed
      } : null,
      recentActivity: {
        newClients: recentClients?.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          name: c.users?.full_name,
          joined: c.created_at
        })) || [],
        lastUpdated: gym.updated_at
      },
      metadata: {
        isActive: gym.is_active,
        isVerified: gym.is_verified,
        trialEnds: gym.trial_ends_at,
        createdAt: gym.created_at,
        updatedAt: gym.updated_at
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/gyms/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/gym/gyms/[id] - Update gym
export async function PUT(
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
    
    // Check permissions - only owners and gym managers of this gym can update
    const canUpdate = profile.role === 'owner' || 
                     (profile.role === 'gym_manager' && profile.gym_id === gymId);
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Build update data
    const updateData: any = {};
    
    // Basic info (all roles can update)
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.state !== undefined) updateData.state = body.state;
    if (body.postcode !== undefined) updateData.postcode = body.postcode;
    
    // Only owners can update these fields
    if (profile.role === 'owner') {
      if (body.subscriptionTier !== undefined) {
        updateData.subscription_tier = body.subscriptionTier;
        
        // Get new plan limits
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('max_clients, max_trainers, monthly_price')
          .eq('slug', body.subscriptionTier)
          .single();
        
        if (plan) {
          updateData.max_clients = plan.max_clients;
          updateData.max_trainers = plan.max_trainers;
          updateData.monthly_fee = plan.monthly_price;
        }
      }
      
      if (body.managerUserId !== undefined) updateData.owner_id = body.managerUserId;
      if (body.isActive !== undefined) updateData.is_active = body.isActive;
      if (body.isVerified !== undefined) updateData.is_verified = body.isVerified;
    }
    
    // Update gym
    const { data: gym, error: updateError } = await supabase
      .from('gyms')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', gymId)
      .select()
      .single();
    
    if (updateError || !gym) {
      console.error('Error updating gym:', updateError);
      return NextResponse.json(
        { error: 'Failed to update gym' },
        { status: 500 }
      );
    }
    
    // If manager changed, update user role
    if (profile.role === 'owner' && body.managerUserId !== undefined) {
      // Remove gym_manager role from previous manager if any
      const { data: previousManager } = await supabase
        .from('users')
        .select('id')
        .eq('gym_id', gymId)
        .eq('role', 'gym_manager')
        .neq('id', body.managerUserId)
        .single();
      
      if (previousManager) {
        await supabase
          .from('users')
          .update({
            role: 'personal_trainer',
            gym_id: null
          })
          .eq('id', previousManager.id);
      }
      
      // Update new manager
      await supabase
        .from('users')
        .update({
          role: 'gym_manager',
          gym_id: gymId
        })
        .eq('id', body.managerUserId);
    }
    
    return NextResponse.json({
      success: true,
      gym,
      message: 'Gym updated successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/gym/gyms/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/gym/gyms/[id] - Delete gym (owner only)
export async function DELETE(
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
    
    // Check if user is owner
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }
    
    // Check if gym exists
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id, name')
      .eq('id', gymId)
      .single();
    
    if (gymError || !gym) {
      return NextResponse.json(
        { error: 'Gym not found' },
        { status: 404 }
      );
    }
    
    // Parse query parameters for deletion options
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hardDelete') === 'true';
    const deleteClients = searchParams.get('deleteClients') === 'true';
    
    if (hardDelete) {
      // Hard delete - remove all related data
      // Note: This is dangerous and should have additional safeguards
      // In production, you might want to archive instead of delete
      
      // First, update all users associated with this gym
      await supabase
        .from('users')
        .update({
          gym_id: null,
          role: 'client' // Or whatever default role
        })
        .eq('gym_id', gymId);
      
      // Delete gym (cascade should handle related tables)
      const { error: deleteError } = await supabase
        .from('gyms')
        .delete()
        .eq('id', gymId);
      
      if (deleteError) {
        console.error('Error deleting gym:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete gym' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Gym "${gym.name}" and all associated data deleted permanently`
      });
      
    } else {
      // Soft delete - mark as inactive
      const { error: updateError } = await supabase
        .from('gyms')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', gymId);
      
      if (updateError) {
        console.error('Error deactivating gym:', updateError);
        return NextResponse.json(
          { error: 'Failed to deactivate gym' },
          { status: 500 }
        );
      }
      
      // Cancel subscription if exists
      await supabase
        .from('gym_subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('gym_id', gymId)
        .eq('status', 'active');
      
      return NextResponse.json({
        success: true,
        message: `Gym "${gym.name}" deactivated successfully`
      });
    }
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/gym/gyms/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}