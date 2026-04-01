'use client'

// Test page for enhanced meal library components
// This is a temporary file to demonstrate the new components

import EnhancedMealLibraryDemo from '@/components/meal-library/EnhancedMealLibraryDemo'

export default function EnhancedMealLibraryTestPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          color: '#e8ecf4', 
          fontSize: '1.75rem', 
          fontWeight: 700, 
          margin: '0 0 8px 0' 
        }}>
          Enhanced Meal Library - Test Page
        </h1>
        <p style={{ 
          color: '#9099b2', 
          fontSize: '0.95rem', 
          margin: '0 0 24px 0',
          lineHeight: 1.5
        }}>
          This page demonstrates the new enhanced meal library components for APEX Phase 4 - Week 2.
          All components are fully functional with TypeScript types and filter utilities.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          flexWrap: 'wrap',
          marginBottom: '24px'
        }}>
          <a
            href="/pt/meals"
            style={{
              padding: '10px 20px',
              background: '#252b3b',
              border: '1px solid #2a3048',
              borderRadius: '8px',
              color: '#e8ecf4',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            ← Back to Original Meal Library
          </a>
          <a
            href="#implementation"
            style={{
              padding: '10px 20px',
              background: '#4ade80',
              border: '1px solid #4ade80',
              borderRadius: '8px',
              color: '#0f1117',
              textDecoration: 'none',
              fontSize: '0.88rem',
              fontWeight: 700
            }}
          >
            View Implementation Details
          </a>
        </div>
      </div>

      {/* Demo Component */}
      <EnhancedMealLibraryDemo />

      {/* Implementation Details */}
      <div id="implementation" style={{ 
        marginTop: '48px', 
        paddingTop: '32px',
        borderTop: '1px solid #2a3048'
      }}>
        <h2 style={{ 
          color: '#e8ecf4', 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          margin: '0 0 24px 0' 
        }}>
          Implementation Details
        </h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px' 
        }}>
          <div style={{
            background: '#181c27',
            border: '1px solid #2a3048',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ 
              color: '#4ade80', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              margin: '0 0 12px 0' 
            }}>
              Components Created
            </h3>
            <ul style={{ 
              color: '#9099b2', 
              fontSize: '0.88rem', 
              margin: 0, 
              paddingLeft: '20px',
              lineHeight: 1.6
            }}>
              <li><code>EnhancedMealCard</code> - Enhanced meal display</li>
              <li><code>MealFiltersPanel</code> - Main filter panel</li>
              <li><code>DifficultyFilter</code> - Difficulty toggle</li>
              <li><code>PrepTimeFilter</code> - Time range slider</li>
              <li><code>MultiSelectFilter</code> - Reusable multi-select</li>
              <li><code>types.ts</code> - TypeScript types & constants</li>
              <li><code>filterUtils.ts</code> - Filtering utilities</li>
            </ul>
          </div>

          <div style={{
            background: '#181c27',
            border: '1px solid #2a3048',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ 
              color: '#22d3ee', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              margin: '0 0 12px 0' 
            }}>
              Features Implemented
            </h3>
            <ul style={{ 
              color: '#9099b2', 
              fontSize: '0.88rem', 
              margin: 0, 
              paddingLeft: '20px',
              lineHeight: 1.6
            }}>
              <li>Enhanced search across all text fields</li>
              <li>Difficulty filtering (easy/medium/hard)</li>
              <li>Prep time range filtering (0-120 min)</li>
              <li>Dietary flags multi-select</li>
              <li>Cuisine multi-select</li>
              <li>Allergen exclusion filtering</li>
              <li>Tags multi-select filtering</li>
              <li>Real-time filter updates</li>
            </ul>
          </div>

          <div style={{
            background: '#181c27',
            border: '1px solid #2a3048',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ 
              color: '#fbbf24', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              margin: '0 0 12px 0' 
            }}>
              Next Steps
            </h3>
            <ul style={{ 
              color: '#9099b2', 
              fontSize: '0.88rem', 
              margin: 0, 
              paddingLeft: '20px',
              lineHeight: 1.6
            }}>
              <li>Update main meal library page</li>
              <li>Add API filter integration</li>
              <li>Implement pagination</li>
              <li>Add sorting options</li>
              <li>Test with real data</li>
              <li>Add meal creation/editing</li>
              <li>Implement meal recommendations</li>
            </ul>
          </div>
        </div>

        {/* Code Example */}
        <div style={{
          background: '#0f1117',
          border: '1px solid #2a3048',
          borderRadius: '12px',
          padding: '24px',
          marginTop: '32px',
          overflow: 'auto'
        }}>
          <h3 style={{ 
            color: '#e8ecf4', 
            fontSize: '1rem', 
            fontWeight: 600, 
            margin: '0 0 16px 0' 
          }}>
            Usage Example
          </h3>
          <pre style={{ 
            color: '#9099b2', 
            fontSize: '0.82rem', 
            margin: 0,
            lineHeight: 1.5,
            fontFamily: 'monospace'
          }}>
{`import { useState } from 'react'
import { MealFilters, DEFAULT_FILTERS } from '@/components/meal-library/types'
import MealFiltersPanel from '@/components/meal-library/MealFiltersPanel'
import EnhancedMealCard from '@/components/meal-library/EnhancedMealCard'
import { filterMeals } from '@/components/meal-library/filterUtils'

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
      
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredMeals.map(meal => (
          <EnhancedMealCard key={meal.id} meal={meal} />
        ))}
      </div>
    </div>
  )
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}