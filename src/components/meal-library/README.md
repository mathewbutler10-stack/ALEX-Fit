# Enhanced Meal Library Components

This directory contains the enhanced meal library UI components for APEX Phase 4 - Week 2 implementation.

## Components

### 1. Types (`types.ts`)
- Enhanced `Meal` interface with all new database fields
- `MealFilters` interface for filter state management
- Default filter values and filter option constants
- Helper functions for formatting and styling

### 2. EnhancedMealCard (`EnhancedMealCard.tsx`)
- Displays all meal metadata in a visually rich card
- Shows prep time, difficulty, dietary flags, cuisine, allergens, and tags
- Expandable section for ingredients and instructions
- Color-coded difficulty indicators
- Dietary flag and allergen warning icons

### 3. MealFiltersPanel (`MealFiltersPanel.tsx`)
- Main filter panel that combines all filter components
- Collapsible design with active filter indicator
- Includes search, difficulty, prep time, dietary flags, cuisine, allergens, and tags filters
- Reset filters functionality

### 4. Individual Filter Components
- `DifficultyFilter.tsx` - Difficulty level toggle buttons
- `PrepTimeFilter.tsx` - Dual-range slider for prep time
- `MultiSelectFilter.tsx` - Reusable multi-select dropdown for dietary flags, cuisine, allergens, and tags

### 5. Filter Utilities (`filterUtils.ts`)
- `filterMeals()` - Client-side meal filtering function
- `buildSupabaseFilters()` - Builds Supabase query filters from filter state
- `extractFilterOptions()` - Extracts unique filter options from meal data

### 6. Demo Component (`EnhancedMealLibraryDemo.tsx`)
- Example implementation showing how to integrate all components
- Demonstrates data fetching, filtering, and display

## Usage

### Basic Integration

```tsx
import { useState } from 'react'
import { MealFilters, DEFAULT_FILTERS, filterMeals } from './types'
import MealFiltersPanel from './MealFiltersPanel'
import EnhancedMealCard from './EnhancedMealCard'

function MealLibraryPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [filters, setFilters] = useState<MealFilters>(DEFAULT_FILTERS)
  
  const filteredMeals = filterMeals(meals, filters)
  
  return (
    <div>
      <MealFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {filteredMeals.map(meal => (
          <EnhancedMealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  )
}
```

### API Integration

When fetching meals from Supabase, use the enhanced `Meal` type:

```tsx
import { createClient } from '@/lib/supabase/client'
import { Meal } from '@/lib/types' // Updated type

async function fetchMeals() {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_library')
    .select('*')
    .order('name', { ascending: true })
  
  return data as Meal[]
}
```

### Filter Implementation

The filter system supports:
1. **Search**: Across name, ingredients, instructions, and tags
2. **Difficulty**: Easy/Medium/Hard (multi-select)
3. **Prep Time**: 0-120 minute range slider
4. **Dietary Flags**: Vegetarian, Vegan, Gluten-Free, etc. (multi-select)
5. **Cuisine**: Italian, Mexican, Asian, etc. (multi-select)
6. **Allergens**: Exclude meals containing selected allergens
7. **Tags**: Quick, Healthy, Kid-Friendly, etc. (multi-select)

## Styling

All components use inline styles with the ALEX-Fit design system:
- Primary background: `#181c27`
- Secondary background: `#252b3b`
- Border color: `#2a3048`
- Text colors: `#e8ecf4` (primary), `#9099b2` (secondary), `#5a6380` (tertiary)
- Accent colors: `#4ade80` (green), `#22d3ee` (blue), `#fbbf24` (yellow), `#f43f5e` (red)

## Database Schema Requirements

These components require the enhanced `meal_library` table schema from Week 1 migrations:

```sql
-- Required columns:
- prep_time_minutes (integer)
- difficulty (text: 'easy', 'medium', 'hard')
- dietary_flags (text[])
- cuisine (text)
- ingredients (jsonb)
- instructions (text)
- ease_rating (integer)
- allergens (text[])
- equipment_required (text[])
- tags (text[])
```

## Next Steps for Integration

1. **Update the existing meal library page** (`src/app/pt/meals/page.tsx`) to use these components
2. **Update API calls** to include filter parameters in Supabase queries
3. **Add real-time updates** for filter changes
4. **Implement pagination** for large meal libraries
5. **Add sorting options** (by name, prep time, difficulty, etc.)

## Testing

Test the components by:
1. Running the demo component to verify all filters work
2. Testing with sample meal data that includes all new fields
3. Verifying search works across all text fields
4. Testing edge cases (empty arrays, null values, etc.)