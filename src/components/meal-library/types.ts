// Enhanced Meal types for APEX Phase 4 - Smart Meal Planner

// Base Meal interface matching the updated database schema
export interface Meal {
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
  ingredients: any[] | null; // jsonb array
  instructions: string | null;
  ease_rating: number | null;
  allergens: string[] | null;
  equipment_required: string[] | null;
  tags: string[] | null;
  is_global: boolean;
  gym_id: string | null;
}

// Filter types for enhanced filtering
export interface MealFilters {
  search: string;
  difficulty: ('easy' | 'medium' | 'hard')[];
  prepTimeRange: [number, number]; // [min, max] in minutes
  dietaryFlags: string[]; // vegetarian, vegan, gluten-free, dairy-free, nut-free
  cuisine: string[];
  allergens: string[]; // allergens to exclude
  tags: string[]; // quick, healthy, kid-friendly, meal-prep
}

// Default filter values
export const DEFAULT_FILTERS: MealFilters = {
  search: '',
  difficulty: [],
  prepTimeRange: [0, 120],
  dietaryFlags: [],
  cuisine: [],
  allergens: [],
  tags: []
};

// Available options for filter dropdowns
export const DIFFICULTY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

export const DIETARY_FLAG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' }
];

export const CUISINE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'italian', label: 'Italian' },
  { value: 'mexican', label: 'Mexican' },
  { value: 'asian', label: 'Asian' },
  { value: 'american', label: 'American' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'indian', label: 'Indian' },
  { value: 'thai', label: 'Thai' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'greek', label: 'Greek' }
];

export const ALLERGEN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'shellfish', label: 'Shellfish' },
  { value: 'soy', label: 'Soy' },
  { value: 'eggs', label: 'Eggs' }
];

export const TAG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'quick', label: 'Quick' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'kid-friendly', label: 'Kid-Friendly' },
  { value: 'meal-prep', label: 'Meal Prep' },
  { value: 'high-protein', label: 'High Protein' },
  { value: 'low-carb', label: 'Low Carb' },
  { value: 'budget-friendly', label: 'Budget Friendly' },
  { value: 'one-pot', label: 'One Pot' }
];

// Helper functions
export function getDifficultyColor(difficulty: Meal['difficulty']): string {
  switch (difficulty) {
    case 'easy': return '#4ade80'; // green
    case 'medium': return '#fbbf24'; // yellow
    case 'hard': return '#f43f5e'; // red
    default: return '#5a6380'; // gray
  }
}

export function getDifficultyLabel(difficulty: Meal['difficulty']): string {
  switch (difficulty) {
    case 'easy': return 'Easy';
    case 'medium': return 'Medium';
    case 'hard': return 'Hard';
    default: return 'Unknown';
  }
}

export function formatPrepTime(minutes: number | null): string {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}