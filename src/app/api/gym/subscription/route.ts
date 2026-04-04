import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory subscription store (in production, use a proper database)
// This is a temporary solution to avoid database migrations
const subscriptionPlans = {
  starter: {
    name: 'Starter',
    maxClients: 20,
    maxTrainers: 2,
    monthlyPrice: 299,
    annualPrice: 2990,
    features: ['meal_tracking', 'basic_analytics', 'client_messaging']
  },
  growth: {
    name: 'Growth',
    maxClients: 50,
    maxTrainers: 5,
    monthlyPrice: 599,
    annualPrice: 5990,
    features: ['meal_tracking', 'workout_plans', 'advanced_analytics', 'client_groups']
  },
  pro: {
    name: 'Pro',
    maxClients: 200,
    maxTrainers: 20,
    monthlyPrice: 1199,
    annualPrice: 11990,
    features: ['meal_tracking', 'workout_plans', 'white_label', 'custom_branding', 'priority_support']
  }
};

// GET /api/gym/subscription - Get gym subscription info
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
    
    // Get gym details
    const { data: gym } = await supabase
      .from('gyms')
      .select('name')
      .eq('id', gymId)
      .single();
    
    // Get PT record for capacity
    const { data: ptRecord } = await supabase
      .from('pts')
      .select('max_clients')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .single();
    
    // Determine subscription tier based on max_clients
    const maxClients = ptRecord?.max_clients || 20;
    let tier = 'starter';
    
    if (maxClients >= 200) {
      tier = 'pro';
    } else if (maxClients >= 50) {
      tier = 'growth';
    }
    
    const plan = subscriptionPlans[tier as keyof typeof subscriptionPlans];
    
    // Get current client count
    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', gymId)
      .eq('status', 'active');
    
    // Calculate next billing date (30 days from now as example)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 30);
    
    // In a real implementation, you'd store subscription data properly
    // For now, we'll use a simple approach
    const subscriptionData = {
      gymId,
      gymName: gym?.name || 'Your Gym',
      tier,
      plan: {
        name: plan.name,
        maxClients: plan.maxClients,
        maxTrainers: plan.maxTrainers,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        features: plan.features
      },
      billing: {
        cycle: 'monthly', // Default
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        status: 'active'
      },
      usage: {
        clients: {
          current: clientCount || 0,
          max: maxClients,
          percentage: maxClients > 0 ? Math.round((clientCount || 0) / maxClients * 100) : 0
        },
        // Add other usage metrics as needed
      },
      payment: {
        method: 'credit_card', // Example
        lastPayment: new Date().toISOString().split('T')[0],
        amount: plan.monthlyPrice
      }
    };
    
    return NextResponse.json(subscriptionData);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/subscription/upgrade - Upgrade subscription
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
    
    // Parse request body
    const body = await request.json();
    const { newTier } = body;
    
    if (!newTier || !subscriptionPlans[newTier as keyof typeof subscriptionPlans]) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }
    
    const newPlan = subscriptionPlans[newTier as keyof typeof subscriptionPlans];
    
    // Get current PT record
    const { data: ptRecord } = await supabase
      .from('pts')
      .select('max_clients')
      .eq('user_id', user.id)
      .eq('gym_id', gymId)
      .single();
    
    const currentMaxClients = ptRecord?.max_clients || 20;
    
    // Check if upgrade is needed
    if (newPlan.maxClients <= currentMaxClients) {
      return NextResponse.json(
        { error: 'Selected plan does not provide additional capacity' },
        { status: 400 }
      );
    }
    
    // Update PT max_clients (this is our capacity field)
    const { error: updateError } = await supabase
      .from('pts')
      .update({
        max_clients: newPlan.maxClients,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('gym_id', gymId);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }
    
    // In a real implementation, you would:
    // 1. Create Stripe subscription
    // 2. Store subscription details in database
    // 3. Send confirmation email
    // 4. Update billing records
    
    // For now, return success
    return NextResponse.json({
      success: true,
      message: `Subscription upgraded to ${newPlan.name}`,
      newPlan: {
        tier: newTier,
        name: newPlan.name,
        maxClients: newPlan.maxClients,
        monthlyPrice: newPlan.monthlyPrice,
        features: newPlan.features
      },
      nextSteps: [
        'Your capacity has been increased',
        'You can now add more clients',
        'Billing will be updated on your next cycle'
      ]
    });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/subscription/upgrade:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/gym/subscription/plans - Get available subscription plans
export async function GETPlans(request: NextRequest) {
  try {
    // Return all available plans
    const plans = Object.entries(subscriptionPlans).map(([key, plan]) => ({
      id: key,
      name: plan.name,
      maxClients: plan.maxClients,
      maxTrainers: plan.maxTrainers,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      annualSavings: plan.monthlyPrice * 12 - plan.annualPrice,
      features: plan.features,
      highlightFeatures: [
        `${plan.maxClients} client capacity`,
        `${plan.maxTrainers} trainer accounts`,
        plan.features.includes('advanced_analytics') ? 'Advanced analytics' : 'Basic analytics'
      ]
    }));
    
    return NextResponse.json({ plans });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/subscription/plans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}