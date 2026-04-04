import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/gym/dashboard - Gym manager dashboard using existing schema
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
      .select('role, gym_id, full_name')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 403 }
      );
    }
    
    // Only 'pt' (personal trainer) role can access gym dashboard
    // In our system, gym managers will be 'pt' role with gym_id
    if (profile.role !== 'pt' || !profile.gym_id) {
      return NextResponse.json(
        { error: 'Gym manager access required' },
        { status: 403 }
      );
    }
    
    const gymId = profile.gym_id;
    
    // Get gym details
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();
    
    if (gymError || !gym) {
      return NextResponse.json(
        { error: 'Gym not found' },
        { status: 404 }
      );
    }
    
    // Get PT record for this gym (contains max_clients field)
    const { data: ptRecord, error: ptError } = await supabase
      .from('pts')
      .select('max_clients, status, joined_date')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .single();
    
    // Get current client count
    const { count: clientCount, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active');
    
    if (countError) {
      console.error('Error counting clients:', countError);
    }
    
    // Get recent clients (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentClients, error: recentError } = await supabase
      .from('clients')
      .select(`
        id,
        created_at,
        user:users!clients_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('gym_id', gymId)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    // Get all PTs in this gym
    const { data: gymPTs, error: ptsError } = await supabase
      .from('pts')
      .select(`
        id,
        max_clients,
        status,
        user:users!pts_user_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('gym_id', gymId)
      .eq('status', 'active');
    
    // Calculate capacity
    const maxClients = ptRecord?.max_clients || 20; // Default from pts table
    const currentClients = clientCount || 0;
    const capacityPercentage = maxClients > 0 ? Math.round((currentClients / maxClients) * 100) : 0;
    
    // Determine capacity status
    let capacityStatus = 'good';
    if (capacityPercentage >= 100) {
      capacityStatus = 'critical';
    } else if (capacityPercentage >= 90) {
      capacityStatus = 'warning';
    } else if (capacityPercentage >= 80) {
      capacityStatus = 'notice';
    }
    
    // Get subscription status from application state
    // Since we don't have subscription table, we'll use a simple approach
    const subscriptionStatus = 'active'; // Default - in real app, get from your state management
    
    // Format response
    const response = {
      gym: {
        id: gym.id,
        name: gym.name,
        logo: gym.logo_url,
        contact: {
          abn: gym.abn
        }
      },
      manager: {
        id: user.id,
        name: profile.full_name,
        email: user.email,
        role: profile.role,
        maxClients: maxClients,
        joinedDate: ptRecord?.joined_date
      },
      capacity: {
        current: currentClients,
        max: maxClients,
        percentage: capacityPercentage,
        status: capacityStatus,
        available: maxClients - currentClients
      },
      subscription: {
        status: subscriptionStatus,
        // In a real implementation, you'd store this elsewhere
        tier: 'starter', // starter, growth, pro
        monthlyFee: 299, // Default starter price
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      },
      stats: {
        totalClients: currentClients,
        activePTs: gymPTs?.filter(pt => pt.status === 'active').length || 0,
        newClientsThisWeek: recentClients?.length || 0,
        clientRetention: 95 // Example - would calculate from real data
      },
      recentActivity: {
        newClients: recentClients?.map(client => ({
          id: client.id,
          userId: client.user?.id,
          name: client.user?.full_name,
          email: client.user?.email,
          joined: client.created_at
        })) || [],
        lastUpdated: gym.updated_at
      },
      team: {
        pts: gymPTs?.map(pt => ({
          id: pt.id,
          userId: pt.user?.id,
          name: pt.user?.full_name,
          email: pt.user?.email,
          avatar: pt.user?.avatar_url,
          maxClients: pt.max_clients,
          status: pt.status
        })) || []
      },
      quickActions: [
        {
          id: 'add-client',
          label: 'Add New Client',
          description: 'Add a client to your gym',
          icon: 'user-plus',
          path: '/gym/clients/add'
        },
        {
          id: 'view-clients',
          label: 'View All Clients',
          description: 'Manage your gym clients',
          icon: 'users',
          path: '/gym/clients'
        },
        {
          id: 'manage-team',
          label: 'Manage Team',
          description: 'Add or remove personal trainers',
          icon: 'user-cog',
          path: '/gym/team'
        },
        {
          id: 'billing',
          label: 'Billing & Subscription',
          description: 'View and manage your subscription',
          icon: 'credit-card',
          path: '/gym/billing'
        }
      ]
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}