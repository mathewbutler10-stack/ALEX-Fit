'use client'

import { useState } from 'react'
import DifficultyFilter from './DifficultyFilter'
import PrepTimeFilter from './PrepTimeFilter'
import MultiSelectFilter from './MultiSelectFilter'
import { 
  MealFilters, 
  DEFAULT_FILTERS, 
  DIETARY_FLAG_OPTIONS, 
  CUISINE_OPTIONS, 
  ALLERGEN_OPTIONS, 
  TAG_OPTIONS 
} from './types'

interface MealFiltersPanelProps {
  filters: MealFilters;
  onChange: (filters: MealFilters) => void;
  onReset?: () => void;
}

export default function MealFiltersPanel({ 
  filters, 
  onChange, 
  onReset 
}: MealFiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilters = (updates: Partial<MealFilters>) => {
    onChange({ ...filters, ...updates })
  }

  const hasActiveFilters = () => {
    return (
      filters.difficulty.length > 0 ||
      filters.prepTimeRange[0] > DEFAULT_FILTERS.prepTimeRange[0] ||
      filters.prepTimeRange[1] < DEFAULT_FILTERS.prepTimeRange[1] ||
      filters.dietaryFlags.length > 0 ||
      filters.cuisine.length > 0 ||
      filters.allergens.length > 0 ||
      filters.tags.length > 0
    )
  }

  const handleReset = () => {
    onChange(DEFAULT_FILTERS)
    if (onReset) onReset()
  }

  return (
    <div style={{
      background: '#181c27',
      border: '1px solid #2a3048',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '20px' : '0',
        cursor: 'pointer'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            color: '#e8ecf4', 
            fontSize: '1rem', 
            fontWeight: 600 
          }}>
            Filters
          </span>
          {hasActiveFilters() && (
            <span style={{
              background: '#4ade80',
              color: '#0f1117',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              Active
            </span>
          )}
        </div>
        <span style={{ 
          color: '#5a6380', 
          fontSize: '0.8rem',
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </span>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Search */}
          <div>
            <label style={{
              color: '#9099b2',
              fontSize: '0.75rem',
              display: 'block',
              marginBottom: '8px',
              fontWeight: 600
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search by name, ingredients, instructions, or tags..."
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
              style={{
                width: '100%',
                background: '#252b3b',
                border: '1px solid #2a3048',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#e8ecf4',
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#4ade80')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a3048')}
            />
          </div>

          {/* Difficulty and Prep Time in one row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px' 
          }}>
            <DifficultyFilter
              selected={filters.difficulty}
              onChange={(difficulty) => updateFilters({ difficulty })}
            />
            <PrepTimeFilter
              value={filters.prepTimeRange}
              onChange={(prepTimeRange) => updateFilters({ prepTimeRange })}
            />
          </div>

          {/* Dietary Flags and Cuisine in one row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px' 
          }}>
            <MultiSelectFilter
              label="Dietary Flags"
              options={DIETARY_FLAG_OPTIONS}
              selected={filters.dietaryFlags}
              onChange={(dietaryFlags) => updateFilters({ dietaryFlags })}
              placeholder="Select dietary flags..."
            />
            <MultiSelectFilter
              label="Cuisine"
              options={CUISINE_OPTIONS}
              selected={filters.cuisine}
              onChange={(cuisine) => updateFilters({ cuisine })}
              placeholder="Select cuisines..."
            />
          </div>

          {/* Allergens and Tags in one row */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px' 
          }}>
            <MultiSelectFilter
              label="Exclude Allergens"
              options={ALLERGEN_OPTIONS}
              selected={filters.allergens}
              onChange={(allergens) => updateFilters({ allergens })}
              placeholder="Select allergens to exclude..."
            />
            <MultiSelectFilter
              label="Tags"
              options={TAG_OPTIONS}
              selected={filters.tags}
              onChange={(tags) => updateFilters({ tags })}
              placeholder="Select tags..."
            />
          </div>

          {/* Action buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '10px',
            borderTop: '1px solid #2a3048'
          }}>
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasActiveFilters()}
              style={{
                padding: '8px 16px',
                background: hasActiveFilters() ? '#252b3b' : '#181c27',
                border: `1px solid ${hasActiveFilters() ? '#2a3048' : '#181c27'}`,
                borderRadius: '8px',
                color: hasActiveFilters() ? '#9099b2' : '#5a6380',
                fontSize: '0.82rem',
                cursor: hasActiveFilters() ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                if (hasActiveFilters()) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#f43f5e'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'
                }
              }}
              onMouseLeave={e => {
                if (hasActiveFilters()) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3048'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#9099b2'
                }
              }}
            >
              Reset Filters
            </button>
            
            <div style={{ 
              color: '#5a6380', 
              fontSize: '0.75rem',
              fontStyle: 'italic'
            }}>
              {hasActiveFilters() ? 'Filters applied' : 'No filters active'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}