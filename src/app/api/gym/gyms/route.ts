import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/gym/gyms - List gyms (filtered by user role)
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('gyms')
      .select(`
        *,
        owner:users!gyms_owner_id_fkey(id, email, full_name)
      `, { count: 'exact' });
    
    // Apply filters based on user role
    switch (profile.role) {
      case 'owner':
        // Owners can see all gyms
        break;
        
      case 'gym_manager':
        // Gym managers can only see their gym
        query = query.eq('id', profile.gym_id);
        break;
        
      case 'personal_trainer':
        // Trainers can see their gym
        query = query.eq('id', profile.gym_id);
        break;
        
      default:
        // Clients and others cannot see gyms
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
    }
    
    // Apply search filter
    const search = searchParams.get('search');
    if (search) {
      query = query.or(`name.ilike.%${search}%,abn.ilike.%${search}%`);
    }
    
    // Apply status filter
    const status = searchParams.get('status');
    if (status) {
      // Assuming gyms have an is_active field or similar
      query = query.eq('is_active', status === 'active');
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
    // Execute query
    const { data: gyms, error, count } = await query;
    
    if (error) {
      console.error('Error fetching gyms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gyms' },
        { status: 500 }
      );
    }
    
    // Calculate capacity percentages
    const gymsWithCapacity = gyms?.map(gym => ({
      ...gym,
      capacity: {
        clients: {
          used: gym.current_clients || 0,
          total: gym.max_clients || 20,
          percentage: gym.max_clients ? Math.round((gym.current_clients || 0) / gym.max_clients * 100) : 0
        },
        trainers: {
          used: gym.current_trainers || 0,
          total: gym.max_trainers || 2,
          percentage: gym.max_trainers ? Math.round((gym.current_trainers || 0) / gym.max_trainers * 100) : 0
        }
      }
    })) || [];
    
    return NextResponse.json({
      gyms: gymsWithCapacity,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: count ? Math.ceil(count / limit) : 0
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/gyms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/gyms - Create a new gym (owner only)
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
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { name, subscriptionTier, managerUserId } = body;
    
    if (!name || !subscriptionTier) {
      return NextResponse.json(
        { error: 'Name and subscription tier are required' },
        { status: 400 }
      );
    }
    
    // Get subscription plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', subscriptionTier)
      .single();
    
    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    // Create gym
    const gymData = {
      name,
      subscription_tier: subscriptionTier,
      max_clients: plan.max_clients,
      max_trainers: plan.max_trainers,
      monthly_fee: plan.monthly_price,
      owner_id: managerUserId || null,
      is_active: true,
      is_verified: false,
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30-day trial
    };
    
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert(gymData)
      .select()
      .single();
    
    if (gymError) {
      console.error('Error creating gym:', gymError);
      return NextResponse.json(
        { error: 'Failed to create gym' },
        { status: 500 }
      );
    }
    
    // If manager user ID provided, update user role and gym association
    if (managerUserId) {
      const { error: userError } = await supabase
        .from('users')
        .update({
          role: 'gym_manager',
          gym_id: gym.id
        })
        .eq('id', managerUserId);
      
      if (userError) {
        console.error('Error updating manager:', userError);
        // Continue anyway - gym created but manager not assigned
      }
    }
    
    // Create default gym features based on plan
    const planFeatures = plan.features || [];
    const featureInserts = planFeatures.map((featureKey: string) => ({
      gym_id: gym.id,
      feature_key: featureKey,
      is_enabled: true
    }));
    
    if (featureInserts.length > 0) {
      await supabase
        .from('gym_features')
        .insert(featureInserts);
    }
    
    // Create initial subscription record
    const subscriptionData = {
      gym_id: gym.id,
      plan_id: plan.id,
      status: 'trialing',
      monthly_amount: plan.monthly_price,
      billing_cycle: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    };
    
    await supabase
      .from('gym_subscriptions')
      .insert(subscriptionData);
    
    return NextResponse.json({
      success: true,
      gym: {
        ...gym,
        capacity: {
          clients: {
            used: 0,
            total: plan.max_clients,
            percentage: 0
          },
          trainers: {
            used: 0,
            total: plan.max_trainers,
            percentage: 0
          }
        }
      },
      message: 'Gym created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/gyms:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}