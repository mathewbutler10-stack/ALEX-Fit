import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/owner/dashboard - Platform owner dashboard
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
    
    // Get platform statistics
    const [
      { count: totalGyms },
      { count: activeGyms },
      { count: totalClients },
      { count: activeClients },
      { count: totalPTs },
      { count: activePTs }
    ] = await Promise.all([
      supabase.from('gyms').select('*', { count: 'exact', head: true }),
      supabase.from('gyms').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('pts').select('*', { count: 'exact', head: true }),
      supabase.from('pts').select('*', { count: 'exact', head: true }).eq('status', 'active')
    ]);
    
    // Get recent gyms (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentGyms } = await supabase
      .from('gyms')
      .select(`
        *,
        owner:users!gyms_owner_id_fkey(id, full_name, email)
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get gyms nearing capacity
    // Since we don't have a subscription table, we'll estimate based on PT max_clients
    const { data: allPTs } = await supabase
      .from('pts')
      .select(`
        max_clients,
        gym_id,
        gym:gyms!pts_gym_id_fkey(name)
      `)
      .eq('status', 'active');
    
    // Calculate capacity for each gym
    const gymCapacityMap = new Map();
    
    if (allPTs) {
      for (const pt of allPTs) {
        if (!pt.gym_id) continue;
        
        // Get client count for this gym
        const { count: gymClientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('gym_id', pt.gym_id)
          .eq('status', 'active');
        
        const capacityPercentage = pt.max_clients > 0 ? 
          Math.round((gymClientCount || 0) / pt.max_clients * 100) : 0;
        
        if (capacityPercentage >= 80) {
          gymCapacityMap.set(pt.gym_id, {
            gymId: pt.gym_id,
            gymName: pt.gym?.name || 'Unknown Gym',
            maxClients: pt.max_clients,
            currentClients: gymClientCount || 0,
            percentage: capacityPercentage,
            status: capacityPercentage >= 100 ? 'critical' : 
                    capacityPercentage >= 90 ? 'warning' : 'notice'
          });
        }
      }
    }
    
    const gymsNearingCapacity = Array.from(gymCapacityMap.values());
    
    // Calculate estimated MRR (Monthly Recurring Revenue)
    // In a real implementation, you'd get this from Stripe or your billing system
    // For now, we'll estimate based on PT max_clients
    let estimatedMRR = 0;
    
    if (allPTs) {
      for (const pt of allPTs) {
        // Estimate subscription tier based on max_clients
        if (pt.max_clients >= 200) {
          estimatedMRR += 1199; // Pro tier
        } else if (pt.max_clients >= 50) {
          estimatedMRR += 599; // Growth tier
        } else {
          estimatedMRR += 299; // Starter tier
        }
      }
    }
    
    // Format response
    const response = {
      overview: {
        totalGyms: totalGyms || 0,
        activeGyms: activeGyms || 0,
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        totalPTs: totalPTs || 0,
        activePTs: activePTs || 0,
        gymActivationRate: totalGyms ? Math.round((activeGyms || 0) / totalGyms * 100) : 0,
        clientRetentionRate: totalClients ? Math.round((activeClients || 0) / totalClients * 100) : 0
      },
      revenue: {
        estimatedMRR,
        estimatedARR: estimatedMRR * 12,
        averageRevenuePerGym: totalGyms ? Math.round(estimatedMRR / totalGyms) : 0,
        // In production, you'd get actual revenue data
        actualMRR: 0, // Placeholder
        actualARR: 0  // Placeholder
      },
      capacity: {
        gymsNearingCapacity: gymsNearingCapacity.length,
        criticalGyms: gymsNearingCapacity.filter(g => g.status === 'critical').length,
        warningGyms: gymsNearingCapacity.filter(g => g.status === 'warning').length,
        noticeGyms: gymsNearingCapacity.filter(g => g.status === 'notice').length
      },
      recentActivity: {
        newGyms: recentGyms?.map(gym => ({
          id: gym.id,
          name: gym.name,
          owner: gym.owner ? {
            id: gym.owner.id,
            name: gym.owner.full_name,
            email: gym.owner.email
          } : null,
          created: gym.created_at,
          status: gym.is_active ? 'active' : 'inactive'
        })) || [],
        // Add other recent activity as needed
      },
      alerts: [
        ...gymsNearingCapacity.map(gym => ({
          type: 'capacity',
          severity: gym.status,
          title: `${gym.gymName} nearing capacity`,
          message: `${gym.currentClients}/${gym.maxClients} clients (${gym.percentage}%)`,
          gymId: gym.gymId
        })),
        // Add other alerts as needed
      ],
      quickMetrics: [
        {
          label: 'Active Gyms',
          value: activeGyms || 0,
          change: '+2', // Example - would calculate from previous period
          trend: 'up'
        },
        {
          label: 'Active Clients',
          value: activeClients || 0,
          change: '+15',
          trend: 'up'
        },
        {
          label: 'Estimated MRR',
          value: `$${estimatedMRR.toLocaleString()}`,
          change: '+$299',
          trend: 'up'
        },
        {
          label: 'Capacity Alerts',
          value: gymsNearingCapacity.length,
          change: gymsNearingCapacity.length > 0 ? `+${gymsNearingCapacity.length}` : '0',
          trend: gymsNearingCapacity.length > 0 ? 'warning' : 'neutral'
        }
      ]
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/owner/dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}