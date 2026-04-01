'use client'

import { useState } from 'react'
import { Meal, getDifficultyColor, getDifficultyLabel, formatPrepTime } from './types'

interface EnhancedMealCardProps {
  meal: Meal;
  onClick?: () => void;
}

export default function EnhancedMealCard({ meal, onClick }: EnhancedMealCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handleClick = () => {
    setExpanded(!expanded)
    if (onClick) onClick()
  }

  // Helper to get dietary flag icon
  const getDietaryIcon = (flag: string) => {
    switch (flag.toLowerCase()) {
      case 'vegetarian': return '🌱'
      case 'vegan': return '🌿'
      case 'gluten-free': return '🌾'
      case 'dairy-free': return '🥛'
      case 'nut-free': return '🥜'
      default: return '✓'
    }
  }

  // Helper to get allergen warning icon
  const getAllergenIcon = (allergen: string) => {
    switch (allergen.toLowerCase()) {
      case 'gluten': return '⚠️🌾'
      case 'dairy': return '⚠️🥛'
      case 'nuts': return '⚠️🥜'
      case 'shellfish': return '⚠️🦐'
      case 'soy': return '⚠️🥢'
      case 'eggs': return '⚠️🥚'
      default: return '⚠️'
    }
  }

  return (
    <div
      style={{
        background: '#181c27',
        border: '1px solid #2a3048',
        borderRadius: '12px',
        padding: '18px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, transform 0.2s',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#4ade80'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3048'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        }
      }}
      onClick={handleClick}
    >
      {/* Header with name and metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            color: '#e8ecf4', 
            fontWeight: 700, 
            fontSize: '1rem', 
            marginBottom: '8px',
            lineHeight: 1.3
          }}>
            {meal.name}
          </div>

          {/* Metadata badges */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {/* Prep time badge */}
            {meal.prep_time_minutes && (
              <div style={{
                background: '#252b3b',
                border: '1px solid #2a3048',
                borderRadius: '12px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}>
                <span style={{ color: '#22d3ee' }}>⏱️</span>
                <span style={{ color: '#e8ecf4' }}>{formatPrepTime(meal.prep_time_minutes)}</span>
              </div>
            )}

            {/* Difficulty badge */}
            {meal.difficulty && (
              <div style={{
                background: '#252b3b',
                border: `1px solid ${getDifficultyColor(meal.difficulty)}`,
                borderRadius: '12px',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getDifficultyColor(meal.difficulty)
                }} />
                <span style={{ color: getDifficultyColor(meal.difficulty) }}>
                  {getDifficultyLabel(meal.difficulty)}
                </span>
              </div>
            )}

            {/* Cuisine tag */}
            {meal.cuisine && (
              <div style={{
                background: '#252b3b',
                border: '1px solid #2a3048',
                borderRadius: '12px',
                padding: '4px 10px',
                fontSize: '0.72rem'
              }}>
                <span style={{ color: '#fbbf24' }}>🌍</span>
                <span style={{ color: '#e8ecf4', marginLeft: '4px' }}>{meal.cuisine}</span>
              </div>
            )}
          </div>

          {/* Macro strip */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <MacroPill label="Cal" value={meal.calories} unit="kcal" color="#f97316" />
            <MacroPill label="P" value={meal.protein} unit="g" color="#4ade80" />
            <MacroPill label="C" value={meal.carbs} unit="g" color="#22d3ee" />
            <MacroPill label="F" value={meal.fat} unit="g" color="#fbbf24" />
          </div>

          {/* Dietary flags */}
          {meal.dietary_flags && meal.dietary_flags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {meal.dietary_flags.map(flag => (
                <div
                  key={flag}
                  style={{
                    background: '#252b3b',
                    border: '1px solid #2a3048',
                    borderRadius: '12px',
                    padding: '3px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.65rem'
                  }}
                  title={flag}
                >
                  <span style={{ fontSize: '0.8rem' }}>{getDietaryIcon(flag)}</span>
                  <span style={{ color: '#9099b2' }}>{flag}</span>
                </div>
              ))}
            </div>
          )}

          {/* Allergen warnings */}
          {meal.allergens && meal.allergens.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {meal.allergens.map(allergen => (
                <div
                  key={allergen}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    borderRadius: '12px',
                    padding: '3px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.65rem'
                  }}
                  title={`Contains ${allergen}`}
                >
                  <span style={{ fontSize: '0.8rem' }}>{getAllergenIcon(allergen)}</span>
                  <span style={{ color: '#f43f5e' }}>{allergen}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {meal.tags.map(tag => (
                <span
                  key={tag}
                  style={{
                    background: '#252b3b',
                    border: '1px solid #2a3048',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    color: '#9099b2',
                    fontSize: '0.72rem'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand/collapse indicator */}
        {onClick && (
          <span style={{ 
            color: '#5a6380', 
            fontSize: '0.8rem', 
            flexShrink: 0, 
            marginTop: '2px' 
          }}>
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ 
          marginTop: '16px', 
          borderTop: '1px solid #2a3048', 
          paddingTop: '16px' 
        }}>
          {/* Ingredients */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                color: '#9099b2', 
                fontSize: '0.75rem', 
                marginBottom: '8px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>📝</span>
                INGREDIENTS
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {meal.ingredients.map((ingredient, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      color: '#e8ecf4', 
                      fontSize: '0.82rem', 
                      marginBottom: '4px',
                      lineHeight: 1.4
                    }}
                  >
                    {typeof ingredient === 'string' ? ingredient : 
                     ingredient.name ? `${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.name}`.trim() : 
                     JSON.stringify(ingredient)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {meal.instructions && (
            <div>
              <div style={{ 
                color: '#9099b2', 
                fontSize: '0.75rem', 
                marginBottom: '8px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>👨‍🍳</span>
                INSTRUCTIONS
              </div>
              <div style={{ 
                color: '#e8ecf4', 
                fontSize: '0.82rem', 
                lineHeight: 1.5,
                whiteSpace: 'pre-line'
              }}>
                {meal.instructions}
              </div>
            </div>
          )}

          {/* Equipment */}
          {meal.equipment_required && meal.equipment_required.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ 
                color: '#9099b2', 
                fontSize: '0.75rem', 
                marginBottom: '8px', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>🔧</span>
                EQUIPMENT NEEDED
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {meal.equipment_required.map(equipment => (
                  <span
                    key={equipment}
                    style={{
                      background: '#252b3b',
                      border: '1px solid #2a3048',
                      borderRadius: '12px',
                      padding: '4px 10px',
                      color: '#9099b2',
                      fontSize: '0.72rem'
                    }}
                  >
                    {equipment}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Macro pill component (reused from original)
function MacroPill({ label, value, unit, color }: { 
  label: string; 
  value: number; 
  unit: string; 
  color: string 
}) {
  return (
    <div style={{ 
      background: color + '15', 
      border: `1px solid ${color}33`, 
      borderRadius: '6px', 
      padding: '4px 10px', 
      display: 'flex', 
      gap: '4px', 
      alignItems: 'baseline' 
    }}>
      <span style={{ color, fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#e8ecf4', fontSize: '0.82rem', fontWeight: 700 }}>{value}</span>
      <span style={{ color: '#5a6380', fontSize: '0.65rem' }}>{unit}</span>
    </div>
  )
}