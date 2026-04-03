import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { slot_id, new_meal_id } = body;

    if (!slot_id || !new_meal_id) {
      return NextResponse.json(
        { error: 'Missing required fields: slot_id and new_meal_id' },
        { status: 400 }
      );
    }

    // Verify meal plan exists and user has access
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, pt_id, status, client_id')
      .eq('id', planId)
      .single();

    if (planError || !mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Only PT who created the plan can modify it (when in draft)
    if (mealPlan.pt_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this meal plan' },
        { status: 403 }
      );
    }

    // Can only modify draft plans
    if (mealPlan.status !== 'draft') {
      return NextResponse.json(
        { error: 'Cannot modify a published meal plan' },
        { status: 400 }
      );
    }

    // Verify slot exists and belongs to this plan
    const { data: slot, error: slotError } = await supabase
      .from('meal_plan_slots')
      .select('*')
      .eq('id', slot_id)
      .eq('meal_plan_id', planId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: 'Meal slot not found or does not belong to this plan' },
        { status: 404 }
      );
    }

    // Verify new meal exists and is from the same gym
    const { data: newMeal, error: mealError } = await supabase
      .from('meal_library')
      .select('id, gym_id, meal_type')
      .eq('id', new_meal_id)
      .single();

    if (mealError || !newMeal) {
      return NextResponse.json(
        { error: 'New meal not found' },
        { status: 404 }
      );
    }

    // Get plan's client gym
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('gym_id')
      .eq('id', mealPlan.client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Verify meal belongs to the same gym
    if (newMeal.gym_id !== client.gym_id && !newMeal.is_global) {
      return NextResponse.json(
        { error: 'Meal does not belong to the same gym' },
        { status: 400 }
      );
    }

    // Verify meal type matches (optional but recommended)
    if (newMeal.meal_type !== slot.meal_type) {
      return NextResponse.json(
        { error: `New meal must be of type "${slot.meal_type}"` },
        { status: 400 }
      );
    }

    // Update the slot
    const { data: updatedSlot, error: updateError } = await supabase
      .from('meal_plan_slots')
      .update({
        meal_id: new_meal_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', slot_id)
      .select(`
        *,
        meal:meal_library(*)
      `)
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedSlot);
  } catch (error) {
    console.error('Error swapping meal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}