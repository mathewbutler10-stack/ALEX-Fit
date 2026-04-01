'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MealFilters, DEFAULT_FILTERS } from './types'
// filterMeals import removed temporarily for build
import MealFiltersPanel from './MealFiltersPanel'
import EnhancedMealCard from './EnhancedMealCard'
import { Meal as LibMeal } from '@/lib/types'

// Convert lib Meal type to our enhanced Meal type
function convertToEnhancedMeal(meal: LibMeal): any {
  return {
    ...meal,
    // Ensure arrays are properly typed
    dietary_flags: meal.dietary_flags || [],
    allergens: meal.allergens || [],
    equipment_required: meal.equipment_required || [],
    tags: meal.tags || [],
    // Handle ingredients conversion
    ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : []
  }
}

export default function EnhancedMealLibraryDemo() {
  const supabase = createClient()
  const [meals, setMeals] = useState<LibMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MealFilters>(DEFAULT_FILTERS)
  const [gymId, setGymId] = useState('')

  useEffect(() => {
    async function loadMeals() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()
      if (ptData?.gym_id) setGymId(ptData.gym_id)

      const { data } = await supabase
        .from('meal_library')
        .select('*')
        .or(ptData?.gym_id ? `is_global.eq.true,gym_id.eq.${ptData.gym_id}` : 'is_global.eq.true')
        .order('name', { ascending: true })

      setMeals(data ?? [])
      setLoading(false)
    }
    loadMeals()
  }, [])

  // Filter meals based on current filters
  // TODO: Implement proper filterMeals function
  const filteredMeals = meals.map(convertToEnhancedMeal).filter(meal => {
    // Simple filtering logic for now
    if (filters.cuisine.length > 0 && meal.cuisine && !filters.cuisine.includes(meal.cuisine)) return false
    if (filters.difficulty.length > 0 && meal.difficulty && !filters.difficulty.includes(meal.difficulty)) return false
    if (meal.prep_time && meal.prep_time > filters.prepTimeRange[1]) return false
    return true
  })

  return (
    <div>
      <div style={{ 
        background: 'linear-gradient(135deg, #0f1117 0%, #181c27 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #2a3048'
      }}>
        <h2 style={{ 
          color: '#e8ecf4', 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          margin: '0 0 8px 0' 
        }}>
          Enhanced Meal Library
        </h2>
        <p style={{ 
          color: '#9099b2', 
          fontSize: '0.88rem', 
          margin: '0 0 16px 0',
          lineHeight: 1.5
        }}>
          Browse and filter meals with enhanced search capabilities. Use the filters below to find meals 
          by difficulty, prep time, dietary requirements, cuisine, allergens, and tags.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          <div style={{
            background: '#4ade8020',
            border: '1px solid #4ade80',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            color: '#4ade80'
          }}>
            {meals.length} total meals
          </div>
          <div style={{
            background: '#22d3ee20',
            border: '1px solid #22d3ee',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            color: '#22d3ee'
          }}>
            {filteredMeals.length} filtered meals
          </div>
          <div style={{
            background: '#fbbf2420',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.75rem',
            color: '#fbbf24'
          }}>
            New enhanced filters
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <MealFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Search Stats */}
      {filters.search && (
        <div style={{
          background: '#252b3b',
          border: '1px solid #2a3048',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ color: '#4ade80', fontSize: '0.9rem' }}>🔍</span>
          <span style={{ color: '#e8ecf4', fontSize: '0.88rem' }}>
            Searching for: <strong>{filters.search}</strong>
          </span>
          <button
            onClick={() => setFilters({ ...filters, search: '' })}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: '1px solid #2a3048',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#9099b2',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Meals Grid */}
      {loading ? (
        <div style={{ 
          color: '#5a6380', 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#181c27',
          border: '1px solid #2a3048',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading meals...</div>
          <div style={{ fontSize: '0.82rem', color: '#5a6380', marginTop: '8px' }}>
            Fetching from database with enhanced filters
          </div>
        </div>
      ) : filteredMeals.length === 0 ? (
        <div style={{ 
          color: '#5a6380', 
          textAlign: 'center', 
          padding: '60px 20px',
          background: '#181c27',
          border: '1px solid #2a3048',
          borderRadius: '12px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🍽️</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e8ecf4' }}>
            No meals match your filters
          </div>
          <div style={{ fontSize: '0.82rem', color: '#9099b2', marginTop: '8px', maxWidth: '400px', margin: '8px auto 0' }}>
            Try adjusting your filters or search term to see more results
          </div>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            style={{
              marginTop: '20px',
              padding: '8px 20px',
              background: '#252b3b',
              border: '1px solid #2a3048',
              borderRadius: '8px',
              color: '#e8ecf4',
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredMeals.map(meal => (
            <EnhancedMealCard
              key={meal.id}
              meal={meal}
              onClick={() => console.log('Meal clicked:', meal.name)}
            />
          ))}
        </div>
      )}

      {/* Footer note */}
      {!loading && filteredMeals.length > 0 && (
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid #2a3048',
          color: '#5a6380',
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          Showing {filteredMeals.length} of {meals.length} meals
          {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : v !== DEFAULT_FILTERS.search) && 
            ' (filters applied)'}
        </div>
      )}
    </div>
  )
}