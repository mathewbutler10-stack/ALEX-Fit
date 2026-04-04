import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/owner/revenue - Revenue oversight dashboard
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
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, quarter, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Calculate date range based on period
    const now = new Date();
    let rangeStart: Date;
    let rangeEnd: Date = now;
    
    switch (period) {
      case 'day':
        rangeStart = new Date(now);
        rangeStart.setDate(rangeStart.getDate() - 1);
        break;
      case 'week':
        rangeStart = new Date(now);
        rangeStart.setDate(rangeStart.getDate() - 7);
        break;
      case 'month':
        rangeStart = new Date(now);
        rangeStart.setMonth(rangeStart.getMonth() - 1);
        break;
      case 'quarter':
        rangeStart = new Date(now);
        rangeStart.setMonth(rangeStart.getMonth() - 3);
        break;
      case 'year':
        rangeStart = new Date(now);
        rangeStart.setFullYear(rangeStart.getFullYear() - 1);
        break;
      default:
        rangeStart = new Date(now);
        rangeStart.setMonth(rangeStart.getMonth() - 1);
    }
    
    // Use custom dates if provided
    if (startDate) {
      rangeStart = new Date(startDate);
    }
    if (endDate) {
      rangeEnd = new Date(endDate);
    }
    
    // Format dates for queries
    const startDateStr = rangeStart.toISOString().split('T')[0];
    const endDateStr = rangeEnd.toISOString().split('T')[0];
    
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
    
    // Get all PTs to estimate revenue
    const { data: allPTs } = await supabase
      .from('pts')
      .select(`
        max_clients,
        gym_id,
        created_at,
        gym:gyms!pts_gym_id_fkey(name, created_at)
      `)
      .eq('status', 'active');
    
    // Calculate estimated revenue
    let estimatedMRR = 0;
    let estimatedARR = 0;
    const revenueByTier = {
      starter: { count: 0, revenue: 0 },
      growth: { count: 0, revenue: 0 },
      pro: { count: 0, revenue: 0 }
    };
    
    if (allPTs) {
      for (const pt of allPTs) {
        // Estimate subscription tier based on max_clients
        let tier: keyof typeof revenueByTier = 'starter';
        let monthlyPrice = 299;
        
        if (pt.max_clients >= 200) {
          tier = 'pro';
          monthlyPrice = 1199;
        } else if (pt.max_clients >= 50) {
          tier = 'growth';
          monthlyPrice = 599;
        }
        
        estimatedMRR += monthlyPrice;
        revenueByTier[tier].count += 1;
        revenueByTier[tier].revenue += monthlyPrice;
      }
      
      estimatedARR = estimatedMRR * 12;
    }
    
    // Get gyms created in date range
    const { data: newGyms } = await supabase
      .from('gyms')
      .select('*')
      .gte('created_at', rangeStart.toISOString())
      .lte('created_at', rangeEnd.toISOString());
    
    // Get clients created in date range
    const { data: newClients } = await supabase
      .from('clients')
      .select('*')
      .gte('created_at', rangeStart.toISOString())
      .lte('created_at', rangeEnd.toISOString());
    
    // Calculate growth metrics
    const newGymsCount = newGyms?.length || 0;
    const newClientsCount = newClients?.length || 0;
    
    // Calculate churn (simplified - in production, track actual cancellations)
    // For now, estimate based on inactive gyms
    const { count: inactiveGyms } = await supabase
      .from('gyms')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);
    
    const churnRate = totalGyms ? (inactiveGyms || 0) / totalGyms : 0;
    
    // Calculate average revenue per gym
    const avgRevenuePerGym = totalGyms ? estimatedMRR / totalGyms : 0;
    
    // Calculate customer lifetime value (simplified)
    const avgCustomerLifetimeMonths = 12; // Assume 1 year average
    const customerLifetimeValue = avgRevenuePerGym * avgCustomerLifetimeMonths;
    
    // Calculate acquisition cost (placeholder - would come from marketing data)
    const customerAcquisitionCost = 150; // Example
    
    // Calculate ROI
    const roi = customerAcquisitionCost > 0 ? 
      (customerLifetimeValue - customerAcquisitionCost) / customerAcquisitionCost : 0;
    
    // Get revenue trends (simplified - would come from actual billing data)
    const revenueTrends = [
      { month: 'Jan', revenue: 4500 },
      { month: 'Feb', revenue: 5200 },
      { month: 'Mar', revenue: 6100 },
      { month: 'Apr', revenue: estimatedMRR }
    ];
    
    // Get top performing gyms (by estimated revenue)
    const gymPerformance = allPTs?.reduce((acc: any[], pt) => {
      if (!pt.gym_id) return acc;
      
      const existing = acc.find(g => g.gymId === pt.gym_id);
      let gymRevenue = 299; // starter
      
      if (pt.max_clients >= 200) {
        gymRevenue = 1199;
      } else if (pt.max_clients >= 50) {
        gymRevenue = 599;
      }
      
      if (existing) {
        existing.revenue += gymRevenue;
        existing.clientCount += 1;
      } else {
        acc.push({
          gymId: pt.gym_id,
          gymName: pt.gym?.name || 'Unknown Gym',
          revenue: gymRevenue,
          clientCount: 1,
          tier: pt.max_clients >= 200 ? 'pro' : pt.max_clients >= 50 ? 'growth' : 'starter'
        });
      }
      
      return acc;
    }, []).sort((a, b) => b.revenue - a.revenue).slice(0, 10) || [];
    
    // Format response
    const response = {
      period: {
        start: startDateStr,
        end: endDateStr,
        label: period
      },
      overview: {
        estimatedMRR: Math.round(estimatedMRR),
        estimatedARR: Math.round(estimatedARR),
        totalGyms: totalGyms || 0,
        activeGyms: activeGyms || 0,
        totalClients: totalClients || 0,
        activeClients: activeClients || 0,
        gymActivationRate: totalGyms ? Math.round((activeGyms || 0) / totalGyms * 100) : 0
      },
      revenueBreakdown: {
        byTier: revenueByTier,
        total: estimatedMRR,
        averagePerGym: Math.round(avgRevenuePerGym),
        topPerformingGyms: gymPerformance
      },
      growthMetrics: {
        newGyms: newGymsCount,
        newClients: newClientsCount,
        growthRate: totalGyms ? newGymsCount / totalGyms : 0,
        churnRate: Math.round(churnRate * 100),
        netGrowth: newGymsCount - (inactiveGyms || 0)
      },
      financialMetrics: {
        customerLifetimeValue: Math.round(customerLifetimeValue),
        customerAcquisitionCost,
        roi: Math.round(roi * 100),
        paybackPeriod: customerAcquisitionCost > 0 ? 
          Math.round(customerAcquisitionCost / avgRevenuePerGym) : 0
      },
      trends: {
        revenue: revenueTrends,
        growth: [
          { month: 'Jan', gyms: 8 },
          { month: 'Feb', gyms: 12 },
          { month: 'Mar', gyms: 18 },
          { month: 'Apr', gyms: totalGyms || 0 }
        ]
      },
      alerts: [
        ...(churnRate > 0.1 ? [{
          type: 'churn',
          severity: 'warning',
          title: 'High churn rate detected',
          message: `${Math.round(churnRate * 100)}% of gyms are inactive`,
          suggestion: 'Review inactive gyms and implement retention strategies'
        }] : []),
        ...(newGymsCount === 0 ? [{
          type: 'growth',
          severity: 'warning',
          title: 'No new gyms this period',
          message: 'Consider increasing marketing efforts',
          suggestion: 'Launch promotional campaign or improve onboarding'
        }] : []),
        ...(avgRevenuePerGym < 200 ? [{
          type: 'revenue',
          severity: 'notice',
          title: 'Low average revenue per gym',
          message: `Average: $${Math.round(avgRevenuePerGym)}/month`,
          suggestion: 'Focus on upselling to higher tiers'
        }] : [])
      ],
      recommendations: [
        {
          priority: 'high',
          title: 'Upsell Growth Tier',
          description: `${revenueByTier.starter.count} gyms on Starter tier could upgrade to Growth`,
          potentialRevenue: revenueByTier.starter.count * 300, // $300 increase per gym
          effort: 'medium'
        },
        {
          priority: 'medium',
          title: 'Reduce Churn',
          description: `${inactiveGyms || 0} inactive gyms identified`,
          potentialRevenue: (inactiveGyms || 0) * avgRevenuePerGym,
          effort: 'high'
        },
        {
          priority: 'low',
          title: 'Expand Pro Tier Features',
          description: 'Add premium features to justify $1,199/month price',
          potentialRevenue: revenueByTier.pro.count * 200, // $200 increase per gym
          effort: 'high'
        }
      ]
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/owner/revenue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/owner/revenue/forecast - Revenue forecasting
export async function GETForecast(request: NextRequest) {
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
    
    // Get current MRR
    const { data: allPTs } = await supabase
      .from('pts')
      .select('max_clients')
      .eq('status', 'active');
    
    let currentMRR = 0;
    if (allPTs) {
      for (const pt of allPTs) {
        if (pt.max_clients >= 200) {
          currentMRR += 1199;
        } else if (pt.max_clients >= 50) {
          currentMRR += 599;
        } else {
          currentMRR += 299;
        }
      }
    }
    
    // Simple forecasting based on growth trends
    const monthlyGrowthRate = 0.15; // 15% monthly growth (conservative)
    const churnRate = 0.05; // 5% monthly churn
    const forecastMonths = 12;
    
    const forecast = [];
    let forecastMRR = currentMRR;
    
    for (let i = 0; i < forecastMonths; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      
      // Apply growth and churn
      const newBusiness = forecastMRR * monthlyGrowthRate;
      const lostBusiness = forecastMRR * churnRate;
      forecastMRR = forecastMRR + newBusiness - lostBusiness;
      
      forecast.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        mrr: Math.round(forecastMRR),
        arr: Math.round(forecastMRR * 12),
        newBusiness: Math.round(newBusiness),
        churn: Math.round(lostBusiness),
        netGrowth: Math.round(newBusiness - lostBusiness)
      });
    }
    
    // Calculate key metrics
    const yearEndMRR = forecast[forecast.length - 1].mrr;
    const totalRevenue = forecast.reduce((sum, month) => sum + month.mrr, 0);
    
    return NextResponse.json({
      currentMRR: Math.round(currentMRR),
      forecast,
      summary: {
        projectedYearEndMRR: yearEndMRR,
        totalProjectedRevenue: Math.round(totalRevenue),
        averageMonthlyGrowth: `${(monthlyGrowthRate * 100).toFixed(1)}%`,
        requiredNewGymsPerMonth: Math.ceil((currentMRR * monthlyGrowthRate) / 299), // Based on starter price
        breakEvenMonths: 6 // Example - would calculate based on costs
      },
      assumptions: {
        monthlyGrowthRate,
        churnRate,
        averageRevenuePerNewGym: 299,
        forecastHorizon: '12 months'
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/owner/revenue/forecast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}