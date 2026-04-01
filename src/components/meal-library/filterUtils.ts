import { Meal, MealFilters } from './types'

/**
 * Filter meals based on enhanced filter criteria
 */
export function filterMeals(meals: Meal[], filters: MealFilters): Meal[] {
  return meals.filter(meal => {
    // Search across multiple fields
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch = 
        meal.name.toLowerCase().includes(searchLower) ||
        (meal.ingredients && JSON.stringify(meal.ingredients).toLowerCase().includes(searchLower)) ||
        (meal.instructions && meal.instructions.toLowerCase().includes(searchLower)) ||
        (meal.tags && meal.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      
      if (!matchesSearch) return false
    }

    // Difficulty filter
    if (filters.difficulty.length > 0 && meal.difficulty) {
      if (!filters.difficulty.includes(meal.difficulty)) return false
    }

    // Prep time filter
    if (meal.prep_time_minutes !== null) {
      const [minTime, maxTime] = filters.prepTimeRange
      if (meal.prep_time_minutes < minTime || meal.prep_time_minutes > maxTime) {
        return false
      }
    }

    // Dietary flags filter (meal must have ALL selected dietary flags)
    if (filters.dietaryFlags.length > 0 && meal.dietary_flags) {
      const hasAllFlags = filters.dietaryFlags.every(flag => 
        meal.dietary_flags!.includes(flag)
      )
      if (!hasAllFlags) return false
    }

    // Cuisine filter
    if (filters.cuisine.length > 0 && meal.cuisine) {
      if (!filters.cuisine.includes(meal.cuisine.toLowerCase())) return false
    }

    // Allergens filter (exclude meals that contain ANY selected allergen)
    if (filters.allergens.length > 0 && meal.allergens) {
      const hasExcludedAllergen = filters.allergens.some(allergen =>
        meal.allergens!.includes(allergen)
      )
      if (hasExcludedAllergen) return false
    }

    // Tags filter (meal must have ANY selected tag)
    if (filters.tags.length > 0 && meal.tags) {
      const hasAnyTag = filters.tags.some(tag =>
        meal.tags!.includes(tag)
      )
      if (!hasAnyTag) return false
    }

    return true
  })
}

/**
 * Build Supabase query filter based on meal filters
 */
export function buildSupabaseFilters(filters: MealFilters, gymId?: string) {
  const conditions: string[] = []
  const params: Record<string, any> = {}

  // Base visibility filter
  if (gymId) {
    conditions.push(`(is_global.eq.true,gym_id.eq.${gymId})`)
  } else {
    conditions.push('is_global.eq.true')
  }

  // Difficulty filter
  if (filters.difficulty.length > 0) {
    conditions.push(`difficulty.in.(${filters.difficulty.map(d => `"${d}"`).join(',')})`)
  }

  // Prep time filter
  if (filters.prepTimeRange[0] > 0 || filters.prepTimeRange[1] < 120) {
    conditions.push(`prep_time_minutes.gte.${filters.prepTimeRange[0]}`)
    conditions.push(`prep_time_minutes.lte.${filters.prepTimeRange[1]}`)
  }

  // Dietary flags filter (meal must contain ALL selected flags)
  if (filters.dietaryFlags.length > 0) {
    filters.dietaryFlags.forEach((flag, index) => {
      conditions.push(`dietary_flags.cs.{${flag}}`)
    })
  }

  // Cuisine filter
  if (filters.cuisine.length > 0) {
    conditions.push(`cuisine.in.(${filters.cuisine.map(c => `"${c}"`).join(',')})`)
  }

  // Allergens filter (exclude meals that contain ANY selected allergen)
  if (filters.allergens.length > 0) {
    // This is tricky in Supabase - we'll handle it client-side for now
    // Could use: `not.allergens.ov.{${filters.allergens.join(',')}}`
    // But that requires array overlap operator support
  }

  // Tags filter (meal must contain ANY selected tag)
  if (filters.tags.length > 0) {
    conditions.push(`tags.ov.{${filters.tags.join(',')}}`)
  }

  return {
    filter: conditions.join(','),
    params
  }
}

/**
 * Extract unique values from meals for filter options
 */
export function extractFilterOptions(meals: Meal[]) {
  const difficulties = new Set<string>()
  const dietaryFlags = new Set<string>()
  const cuisines = new Set<string>()
  const allergens = new Set<string>()
  const tags = new Set<string>()

  meals.forEach(meal => {
    if (meal.difficulty) difficulties.add(meal.difficulty)
    if (meal.dietary_flags) meal.dietary_flags.forEach(flag => dietaryFlags.add(flag))
    if (meal.cuisine) cuisines.add(meal.cuisine)
    if (meal.allergens) meal.allergens.forEach(allergen => allergens.add(allergen))
    if (meal.tags) meal.tags.forEach(tag => tags.add(tag))
  })

  return {
    difficulties: Array.from(difficulties).sort(),
    dietaryFlags: Array.from(dietaryFlags).sort(),
    cuisines: Array.from(cuisines).sort(),
    allergens: Array.from(allergens).sort(),
    tags: Array.from(tags).sort()
  }
}