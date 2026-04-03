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

    // Verify meal plan exists and user has access
    const { data: mealPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, pt_id, client_id, status')
      .eq('id', planId)
      .single();

    if (planError || !mealPlan) {
      return NextResponse.json(
        { error: 'Meal plan not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    let hasPermission = false;

    if (userProfile.role === 'pt' && user.id === mealPlan.pt_id) {
      // PT who created the plan
      hasPermission = true;
    } else if (userProfile.role === 'owner') {
      // Owner of the gym
      hasPermission = true;
    } else if (userProfile.role === 'client' && user.id === mealPlan.client_id) {
      // Client who owns the plan
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to generate a grocery list for this plan' },
        { status: 403 }
      );
    }

    // Check if grocery list already exists
    const { data: existingList, error: listError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('meal_plan_id', planId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let groceryListId;

    if (listError && listError.code !== 'PGRST116') {
      // Error other than "not found"
      throw listError;
    }

    if (existingList) {
      // Use existing list
      groceryListId = existingList.id;
    } else {
      // Generate new grocery list using the database function
      const { data: result, error: generateError } = await supabase
        .rpc('generate_grocery_list_from_meal_plan', {
          p_meal_plan_id: planId
        });

      if (generateError) {
        console.error('Error generating grocery list:', generateError);
        
        // Fallback: manual generation
        const { data: manualList, error: manualError } = await generateGroceryListManually(supabase, planId);
        
        if (manualError) throw manualError;
        groceryListId = manualList.id;
      } else {
        groceryListId = result;
      }
    }

    return NextResponse.json({
      grocery_list_id: groceryListId,
      message: existingList ? 'Existing grocery list found' : 'Grocery list generated successfully',
    });
  } catch (error) {
    console.error('Error generating grocery list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Fallback function if the database function doesn't exist
async function generateGroceryListManually(supabase: any, planId: string) {
  // Get all meals from the plan
  const { data: slots, error: slotsError } = await supabase
    .from('meal_plan_slots')
    .select(`
      meal:meal_library(
        id,
        ingredients
      )
    `)
    .eq('meal_plan_id', planId);

  if (slotsError) throw slotsError;

  // Aggregate ingredients
  const ingredientMap = new Map();
  
  slots.forEach((slot: any) => {
    if (slot.meal?.ingredients) {
      try {
        const ingredients = Array.isArray(slot.meal.ingredients) 
          ? slot.meal.ingredients 
          : JSON.parse(slot.meal.ingredients);
        
        ingredients.forEach((ingredient: any) => {
          if (!ingredient?.name || !ingredient?.amount || !ingredient?.unit) return;
          
          const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;
          const existing = ingredientMap.get(key);
          
          if (existing) {
            existing.amount += parseFloat(ingredient.amount) || 0;
          } else {
            ingredientMap.set(key, {
              ingredient_name: ingredient.name,
              category: categorizeIngredient(ingredient.name),
              amount: parseFloat(ingredient.amount) || 0,
              unit: ingredient.unit,
            });
          }
        });
      } catch (e) {
        console.error('Error parsing ingredients:', e);
      }
    }
  });

  // Convert to array
  const items = Array.from(ingredientMap.values());

  // Get client ID from meal plan
  const { data: mealPlan, error: planError } = await supabase
    .from('meal_plans')
    .select('client_id')
    .eq('id', planId)
    .single();

  if (planError) throw planError;

  // Create grocery list
  const { data: groceryList, error: createError } = await supabase
    .from('grocery_lists')
    .insert({
      meal_plan_id: planId,
      client_id: mealPlan.client_id,
      items: items,
      status: 'pending',
    })
    .select()
    .single();

  if (createError) throw createError;

  // Create individual items
  const itemPromises = items.map((item: any) =>
    supabase.from('grocery_list_items').insert({
      grocery_list_id: groceryList.id,
      ingredient_name: item.ingredient_name,
      category: item.category,
      amount: item.amount,
      unit: item.unit,
      purchased: false,
    })
  );

  await Promise.all(itemPromises);

  return { id: groceryList.id };
}

function categorizeIngredient(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('chicken') || lowerName.includes('beef') || 
      lowerName.includes('fish') || lowerName.includes('tofu') ||
      lowerName.includes('pork') || lowerName.includes('lamb') ||
      lowerName.includes('turkey') || lowerName.includes('egg')) {
    return 'protein';
  } else if (lowerName.includes('broccoli') || lowerName.includes('spinach') || 
             lowerName.includes('carrot') || lowerName.includes('tomato') ||
             lowerName.includes('lettuce') || lowerName.includes('onion') ||
             lowerName.includes('garlic') || lowerName.includes('potato') ||
             lowerName.includes('apple') || lowerName.includes('banana') ||
             lowerName.includes('berry') || lowerName.includes('fruit')) {
    return 'produce';
  } else if (lowerName.includes('milk') || lowerName.includes('yogurt') || 
             lowerName.includes('cheese') || lowerName.includes('cream') ||
             lowerName.includes('butter')) {
    return 'dairy';
  } else if (lowerName.includes('rice') || lowerName.includes('pasta') || 
             lowerName.includes('bread') || lowerName.includes('oats') ||
             lowerName.includes('flour') || lowerName.includes('cereal') ||
             lowerName.includes('quinoa')) {
    return 'grains';
  } else if (lowerName.includes('oil') || lowerName.includes('salt') || 
             lowerName.includes('pepper') || lowerName.includes('spice') ||
             lowerName.includes('sugar') || lowerName.includes('vinegar') ||
             lowerName.includes('sauce') || lowerName.includes('herb')) {
    return 'pantry';
  } else {
    return 'other';
  }
}