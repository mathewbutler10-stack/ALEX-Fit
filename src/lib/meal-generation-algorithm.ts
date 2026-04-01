// TypeScript Deterministic Scoring Algorithm for APEX Phase 4 Smart Meal Planner
// This implements the same logic as the PostgreSQL functions for consistency

export interface Meal {
  id: string;
  name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  dietary_flags: string[]; // e.g., ['vegetarian', 'gluten-free']
  cuisine: string;
  ingredients: Ingredient[];
  instructions: string;
  allergens: string[]; // e.g., ['gluten', 'dairy', 'nuts']
  ease_rating: number; // 1-5
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface ClientDietaryPreferences {
  client_id: string;
  allergies: string[];
  dislikes: string[];
  dietary_preferences: string[];
  daily_calorie_target?: number;
  protein_preference_percent?: number;
  carb_preference_percent?: number;
  fat_preference_percent?: number;
  meals_per_day: number;
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  available_time_minutes: number;
  has_oven: boolean;
  has_stovetop: boolean;
  has_microwave: boolean;
  has_blender: boolean;
  budget_per_week?: number;
}

export interface MealScoreResult {
  meal_id: string;
  score: number; // 0-100
  match_reasons: string[];
  exclusion_reasons: string[];
}

/**
 * Deterministic scoring algorithm for meal suitability
 * Returns score 0-100 with match/exclusion reasons
 */
export function calculateMealScore(
  meal: Meal,
  preferences: ClientDietaryPreferences
): MealScoreResult {
  let score = 100.0; // Start with perfect score
  const matchReasons: string[] = [];
  const exclusionReasons: string[] = [];

  // 1. Check for allergies (automatic exclusion)
  if (preferences.allergies.length > 0 && meal.allergens.length > 0) {
    const allergyMatches = meal.allergens.filter(allergen => 
      preferences.allergies.includes(allergen)
    );
    if (allergyMatches.length > 0) {
      exclusionReasons.push(`Contains client allergy: ${allergyMatches.join(', ')}`);
      return {
        meal_id: meal.id,
        score: 0,
        match_reasons: [],
        exclusion_reasons: exclusionReasons
      };
    }
  }

  // 2. Check for dislikes (heavy penalty)
  if (preferences.dislikes.length > 0) {
    const dislikedIngredients = meal.ingredients.filter(ingredient =>
      preferences.dislikes.some(dislike => 
        ingredient.name.toLowerCase().includes(dislike.toLowerCase())
      )
    );
    if (dislikedIngredients.length > 0) {
      score -= 50.0; // Heavy penalty for dislikes
      exclusionReasons.push(
        `Contains disliked ingredient: ${dislikedIngredients.map(i => i.name).join(', ')}`
      );
    }
  }

  // 3. Check dietary preferences match (bonus)
  if (preferences.dietary_preferences.length > 0 && meal.dietary_flags.length > 0) {
    const allPreferencesMet = preferences.dietary_preferences.every(pref =>
      meal.dietary_flags.includes(pref)
    );
    const somePreferencesMet = preferences.dietary_preferences.some(pref =>
      meal.dietary_flags.includes(pref)
    );

    if (allPreferencesMet) {
      matchReasons.push('Matches all dietary preferences');
      score += 20.0;
    } else if (somePreferencesMet) {
      matchReasons.push('Matches some dietary preferences');
      score += 10.0;
    } else {
      score -= 10.0; // No dietary preference match
    }
  }

  // 4. Check cooking skill compatibility
  switch (preferences.cooking_skill) {
    case 'beginner':
      if (meal.difficulty === 'easy') {
        matchReasons.push('Perfect for beginner cook');
        score += 15.0;
      } else if (meal.difficulty === 'medium') {
        score -= 5.0;
      } else { // 'hard'
        score -= 20.0;
        exclusionReasons.push('Too difficult for beginner cook');
      }
      break;
    case 'intermediate':
      if (meal.difficulty === 'medium') {
        matchReasons.push('Good match for intermediate cook');
        score += 10.0;
      }
      break;
    case 'advanced':
      // Advanced cooks can handle anything, no penalty
      break;
  }

  // 5. Check prep time vs available time
  if (preferences.available_time_minutes && meal.prep_time_minutes) {
    if (meal.prep_time_minutes <= preferences.available_time_minutes) {
      matchReasons.push('Fits within available time');
      score += 10.0;
    } else {
      score -= 15.0;
      exclusionReasons.push('Prep time exceeds available time');
    }
  }

  // 6. Check equipment availability
  if (!preferences.has_oven && meal.instructions.toLowerCase().includes('oven')) {
    score -= 25.0;
    exclusionReasons.push('Requires oven');
  }

  if (!preferences.has_blender && meal.instructions.toLowerCase().includes('blend')) {
    score -= 15.0;
    exclusionReasons.push('Requires blender');
  }

  // 7. Calorie appropriateness
  if (preferences.daily_calorie_target && meal.calories) {
    const targetPerMeal = preferences.daily_calorie_target / preferences.meals_per_day;
    const calorieDiff = Math.abs(meal.calories - targetPerMeal);
    const percentDiff = (calorieDiff / targetPerMeal) * 100;

    if (percentDiff <= 20) {
      matchReasons.push('Good calorie match');
      score += 10.0;
    } else if (percentDiff <= 40) {
      score -= 5.0;
    } else {
      score -= 15.0;
    }
  }

  // 8. Check macronutrient balance (if preferences specified)
  if (
    preferences.protein_preference_percent &&
    preferences.carb_preference_percent &&
    preferences.fat_preference_percent &&
    meal.calories > 0
  ) {
    const proteinCalories = meal.protein * 4;
    const carbCalories = meal.carbs * 4;
    const fatCalories = meal.fat * 9;
    const totalCalories = proteinCalories + carbCalories + fatCalories;

    if (totalCalories > 0) {
      const proteinPercent = (proteinCalories / totalCalories) * 100;
      const carbPercent = (carbCalories / totalCalories) * 100;
      const fatPercent = (fatCalories / totalCalories) * 100;

      const proteinDiff = Math.abs(proteinPercent - preferences.protein_preference_percent);
      const carbDiff = Math.abs(carbPercent - preferences.carb_preference_percent);
      const fatDiff = Math.abs(fatPercent - preferences.fat_preference_percent);

      const avgDiff = (proteinDiff + carbDiff + fatDiff) / 3;

      if (avgDiff <= 10) {
        matchReasons.push('Good macronutrient match');
        score += 15.0;
      } else if (avgDiff <= 20) {
        score += 5.0;
      } else {
        score -= 10.0;
      }
    }
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  return {
    meal_id: meal.id,
    score: parseFloat(score.toFixed(2)),
    match_reasons: matchReasons,
    exclusion_reasons: exclusionReasons
  };
}

/**
 * Generate meal recommendations for a client
 */
export function generateMealRecommendations(
  meals: Meal[],
  preferences: ClientDietaryPreferences,
  mealType?: string,
  limit: number = 10
): Array<MealScoreResult & { meal: Meal }> {
  const filteredMeals = mealType 
    ? meals.filter(m => m.meal_type === mealType)
    : meals;

  const scoredMeals = filteredMeals.map(meal => ({
    ...calculateMealScore(meal, preferences),
    meal
  }));

  // Sort by score descending, filter out zero scores
  return scoredMeals
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Generate a weekly meal plan
 */
export function generateWeeklyMealPlan(
  meals: Meal[],
  preferences: ClientDietaryPreferences
): Array<{
  day_of_week: number; // 0-6 (Mon-Sun)
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  meal_id: string;
  meal_name: string;
  score: number;
}> {
  const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
  const plan: any[] = [];

  // For each day (0-6 = Mon-Sun) and each meal type
  for (let day = 0; day < 7; day++) {
    for (const mealType of mealTypes) {
      // Get top 3 recommendations for this meal type
      const recommendations = generateMealRecommendations(
        meals,
        preferences,
        mealType,
        3
      );

      if (recommendations.length > 0) {
        // Add some randomness for variety (pick from top 3)
        const randomIndex = Math.floor(Math.random() * Math.min(3, recommendations.length));
        const selectedMeal = recommendations[randomIndex];

        plan.push({
          day_of_week: day,
          meal_type: mealType,
          meal_id: selectedMeal.meal_id,
          meal_name: selectedMeal.meal.name,
          score: selectedMeal.score
        });
      }
    }
  }

  return plan;
}

/**
 * Generate grocery list from meal plan
 */
export function generateGroceryList(
  meals: Meal[],
  mealPlan: Array<{ meal_id: string }>
): Array<{
  ingredient_name: string;
  category: string;
  amount: number;
  unit: string;
  meal_ids: string[];
}> {
  const ingredientMap = new Map<string, {
    ingredient_name: string;
    category: string;
    amount: number;
    unit: string;
    meal_ids: string[];
  }>();

  // Categorize ingredients (simplified logic)
  function categorizeIngredient(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('chicken') || lowerName.includes('beef') || lowerName.includes('fish') || lowerName.includes('tofu')) {
      return 'protein';
    } else if (lowerName.includes('broccoli') || lowerName.includes('spinach') || lowerName.includes('carrot') || lowerName.includes('tomato')) {
      return 'produce';
    } else if (lowerName.includes('milk') || lowerName.includes('yogurt') || lowerName.includes('cheese')) {
      return 'dairy';
    } else if (lowerName.includes('rice') || lowerName.includes('pasta') || lowerName.includes('bread') || lowerName.includes('oats')) {
      return 'grains';
    } else if (lowerName.includes('oil') || lowerName.includes('salt') || lowerName.includes('pepper') || lowerName.includes('spice')) {
      return 'pantry';
    } else {
      return 'other';
    }
  }

  // Aggregate ingredients from all meals in the plan
  for (const planItem of mealPlan) {
    const meal = meals.find(m => m.id === planItem.meal_id);
    if (!meal || !meal.ingredients) continue;

    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.name.toLowerCase()}_${ingredient.unit}`;
      const existing = ingredientMap.get(key);

      if (existing) {
        existing.amount += ingredient.amount;
        if (!existing.meal_ids.includes(meal.id)) {
          existing.meal_ids.push(meal.id);
        }
      } else {
        ingredientMap.set(key, {
          ingredient_name: ingredient.name,
          category: categorizeIngredient(ingredient.name),
          amount: ingredient.amount,
          unit: ingredient.unit,
          meal_ids: [meal.id]
        });
      }
    }
  }

  return Array.from(ingredientMap.values());
}

// Example usage:
/*
const exampleMeal: Meal = {
  id: 'm1',
  name: 'Grilled Chicken Salad',
  meal_type: 'lunch',
  calories: 450,
  protein: 35,
  carbs: 20,
  fat: 25,
  prep_time_minutes: 15,
  difficulty: 'easy',
  dietary_flags: ['gluten-free'],
  cuisine: 'American',
  ingredients: [
    { name: 'Chicken Breast', amount: 150, unit: 'g' },
    { name: 'Mixed Greens', amount: 100, unit: 'g' },
    { name: 'Olive Oil', amount: 1, unit: 'tbsp' }
  ],
  instructions: 'Grill chicken, toss with greens and olive oil.',
  allergens: [],
  ease_rating: 4
};

const examplePreferences: ClientDietaryPreferences = {
  client_id: 'c1',
  allergies: ['shellfish'],
  dislikes: ['mushrooms'],
  dietary_preferences: ['gluten-free'],
  daily_calorie_target: 2000,
  meals_per_day: 3,
  cooking_skill: 'beginner',
  available_time_minutes: 20,
  has_oven: true,
  has_stovetop: true,
  has_microwave: true,
  has_blender: true
};

const score = calculateMealScore(exampleMeal, examplePreferences);
console.log('Meal Score:', score);
*/