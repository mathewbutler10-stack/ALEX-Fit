import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWeeklyMealPlan } from '@/lib/meal-generation-algorithm';
import { ClientDietaryPreferences, GenerateMealPlanRequest, GenerateMealPlanResponse } from '@/types/meal-plan';

export async function POST(request: NextRequest) {
  try {
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
    const body: GenerateMealPlanRequest = await request.json();
    const { client_id, preferences } = body;

    if (!client_id || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields: client_id and preferences' },
        { status: 400 }
      );
    }

    // Verify PT has access to this client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('assigned_pt_id, gym_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    if (client.assigned_pt_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have access to this client' },
        { status: 403 }
      );
    }

    // Fetch meals from the gym's library
    const { data: meals, error: mealsError } = await supabase
      .from('meal_library')
      .select('*')
      .eq('gym_id', client.gym_id)
      .eq('is_global', false);

    if (mealsError) {
      console.error('Error fetching meals:', mealsError);
      return NextResponse.json(
        { error: 'Failed to fetch meals' },
        { status: 500 }
      );
    }

    if (!meals || meals.length === 0) {
      return NextResponse.json(
        { error: 'No meals found in the gym library' },
        { status: 400 }
      );
    }

    // Format meals for algorithm
    const formattedMeals = meals.map(meal => ({
      id: meal.id,
      name: meal.name,
      meal_type: meal.meal_type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      prep_time_minutes: meal.prep_time_minutes || 0,
      difficulty: meal.difficulty as 'easy' | 'medium' | 'hard',
      dietary_flags: meal.dietary_flags || [],
      cuisine: meal.cuisine || '',
      ingredients: meal.ingredients || [],
      instructions: meal.instructions || '',
      allergens: meal.allergens || [],
      ease_rating: meal.ease_rating || 3,
    }));

    // Generate meal plan using algorithm
    // Convert preferences to algorithm-compatible format
    const algorithmPreferences = {
      client_id: preferences.client_id,
      allergies: preferences.allergies || [],
      dislikes: preferences.dislikes || [],
      dietary_preferences: preferences.dietary_preferences || [],
      daily_calorie_target: preferences.daily_calorie_target || undefined,
      protein_preference_percent: preferences.protein_preference_percent || undefined,
      carb_preference_percent: preferences.carb_preference_percent || undefined,
      fat_preference_percent: preferences.fat_preference_percent || undefined,
      meals_per_day: preferences.meals_per_day,
      cooking_skill: preferences.cooking_skill,
      available_time_minutes: preferences.available_time_minutes,
      has_oven: preferences.has_oven,
      has_stovetop: preferences.has_stovetop,
      has_microwave: preferences.has_microwave,
      has_blender: preferences.has_blender,
      budget_per_week: preferences.budget_per_week || undefined,
    };
    const plan = generateWeeklyMealPlan(formattedMeals, algorithmPreferences);

    // Start a transaction to create the meal plan
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .insert({
        client_id,
        pt_id: user.id,
        status: 'draft',
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating meal plan:', planError);
      return NextResponse.json(
        { error: 'Failed to create meal plan' },
        { status: 500 }
      );
    }

    // Create meal plan slots
    const slots = plan.map((slot, index) => ({
      meal_plan_id: mealPlan.id,
      day_number: slot.day_of_week + 1, // Convert 0-6 to 1-7
      meal_type: slot.meal_type,
      meal_id: slot.meal_id,
      order_index: index,
    }));

    const { error: slotsError } = await supabase
      .from('meal_plan_slots')
      .insert(slots);

    if (slotsError) {
      console.error('Error creating meal plan slots:', slotsError);
      
      // Rollback: delete the meal plan if slots creation fails
      await supabase.from('meal_plans').delete().eq('id', mealPlan.id);
      
      return NextResponse.json(
        { error: 'Failed to create meal plan slots' },
        { status: 500 }
      );
    }

    // Fetch the created slots with meal details
    const { data: createdSlots, error: fetchSlotsError } = await supabase
      .from('meal_plan_slots')
      .select(`
        *,
        meal:meal_library(*)
      `)
      .eq('meal_plan_id', mealPlan.id)
      .order('day_number', { ascending: true })
      .order('order_index', { ascending: true });

    if (fetchSlotsError) {
      console.error('Error fetching created slots:', fetchSlotsError);
    }

    // Calculate nutritional summary
    const nutritionalSummary = {
      total_calories: plan.reduce((sum, slot) => {
        const meal = formattedMeals.find(m => m.id === slot.meal_id);
        return sum + (meal?.calories || 0);
      }, 0),
      total_protein: plan.reduce((sum, slot) => {
        const meal = formattedMeals.find(m => m.id === slot.meal_id);
        return sum + (meal?.protein || 0);
      }, 0),
      total_carbs: plan.reduce((sum, slot) => {
        const meal = formattedMeals.find(m => m.id === slot.meal_id);
        return sum + (meal?.carbs || 0);
      }, 0),
      total_fat: plan.reduce((sum, slot) => {
        const meal = formattedMeals.find(m => m.id === slot.meal_id);
        return sum + (meal?.fat || 0);
      }, 0),
      daily_average_calories: 0,
      meets_calorie_target: false,
      calorie_deviation_percent: 0,
    };

    nutritionalSummary.daily_average_calories = nutritionalSummary.total_calories / 7;

    if (preferences.daily_calorie_target) {
      const deviation = Math.abs(
        (nutritionalSummary.daily_average_calories - preferences.daily_calorie_target) / 
        preferences.daily_calorie_target * 100
      );
      nutritionalSummary.calorie_deviation_percent = deviation;
      nutritionalSummary.meets_calorie_target = deviation <= 10;
    }

    // Create response
    const response: GenerateMealPlanResponse = {
      plan_id: mealPlan.id,
      slots: createdSlots || [],
      nutritional_summary: nutritionalSummary,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}