// Meal Plan TypeScript Types

export interface Client {
  id: string;
  user_id: string;
  assigned_pt_id: string | null;
  gym_id: string;
  calorie_goal: number | null;
  protein_goal: number | null;
  carb_goal: number | null;
  fat_goal: number | null;
  dietary_restrictions: string[] | null;
  allergies: string[] | null;
  preferred_cuisines: string[] | null;
  cooking_skill_level: 'beginner' | 'intermediate' | 'advanced' | null;
  equipment_available: string[] | null;
  time_constraints: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export interface MealPlan {
  id: string;
  client_id: string;
  pt_id: string;
  status: 'active' | 'archived' | 'draft';
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface MealPlanSlot {
  id: string;
  meal_plan_id: string;
  day_number: number; // 1-7
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  order_index: number;
  created_at: string;
  meal?: {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    prep_time_minutes: number | null;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    dietary_flags: string[] | null;
    cuisine: string | null;
    ingredients: any[] | null;
    instructions: string | null;
    ease_rating: number | null;
    allergens: string[] | null;
    equipment_required: string[] | null;
    tags: string[] | null;
    meal_type?: string | null;
    gym_id?: string | null;
    average_rating?: number;
    rating_count?: number;
  };
}

export interface ClientDietaryPreferences {
  id: string;
  client_id: string;
  gym_id: string;
  allergies: string[];
  dislikes: string[];
  dietary_preferences: string[];
  daily_calorie_target: number | null;
  protein_preference_percent: number | null;
  carb_preference_percent: number | null;
  fat_preference_percent: number | null;
  meals_per_day: number;
  cooking_skill: 'beginner' | 'intermediate' | 'advanced';
  available_time_minutes: number;
  has_oven: boolean;
  has_stovetop: boolean;
  has_microwave: boolean;
  has_blender: boolean;
  budget_per_week: number | null;
  created_at: string;
  updated_at: string;
}

export interface MealRating {
  id: string;
  client_id: string;
  meal_id: string;
  rating: number; // 1-5
  feedback: string | null;
  quick_feedback: 'loved' | 'too_spicy' | 'will_make_again' | 'too_complicated' | null;
  created_at: string;
  updated_at: string;
  client?: {
    id: string;
    user?: {
      full_name: string;
    };
  };
  meal?: {
    id: string;
    name: string;
  };
}

export interface GroceryList {
  id: string;
  meal_plan_id: string;
  client_id: string;
  items: GroceryListItem[];
  status: 'pending' | 'shopped' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface GroceryListItem {
  id: string;
  grocery_list_id: string;
  ingredient_name: string;
  category: string;
  amount: number;
  unit: string;
  purchased: boolean;
  created_at: string;
}

export interface MealInsight {
  meal_id: string;
  meal_name: string;
  average_rating: number;
  rating_count: number;
  total_servings: number;
  quick_feedback_counts: {
    loved: number;
    too_spicy: number;
    will_make_again: number;
    too_complicated: number;
  };
  common_feedback_themes: string[];
  meal_type: string;
  cuisine: string;
  difficulty: string;
}

export interface GenerateMealPlanRequest {
  client_id: string;
  preferences: ClientDietaryPreferences;
  start_date?: string;
}

export interface GenerateMealPlanResponse {
  plan_id: string;
  slots: MealPlanSlot[];
  nutritional_summary: {
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    daily_average_calories: number;
    meets_calorie_target: boolean;
    calorie_deviation_percent: number;
  };
}

export interface MealSwapRequest {
  slot_id: string;
  new_meal_id: string;
}

export interface PublishPlanRequest {
  plan_id: string;
  notify_client: boolean;
  generate_grocery_list: boolean;
}