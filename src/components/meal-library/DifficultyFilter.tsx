'use client'

import { DIFFICULTY_OPTIONS, getDifficultyColor } from './types'

interface DifficultyFilterProps {
  selected: ('easy' | 'medium' | 'hard')[];
  onChange: (selected: ('easy' | 'medium' | 'hard')[]) => void;
}

export default function DifficultyFilter({ selected, onChange }: DifficultyFilterProps) {
  const toggleDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    const newSelected = selected.includes(difficulty)
      ? selected.filter(d => d !== difficulty)
      : [...selected, difficulty]
    onChange(newSelected)
  }

  return (
    <div>
      <label style={{
        color: '#9099b2',
        fontSize: '0.75rem',
        display: 'block',
        marginBottom: '8px',
        fontWeight: 600
      }}>
        Difficulty
      </label>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {DIFFICULTY_OPTIONS.map(option => {
          const difficulty = option.value as 'easy' | 'medium' | 'hard'
          const isSelected = selected.includes(difficulty)
          const color = getDifficultyColor(difficulty)
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleDifficulty(difficulty)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: isSelected ? color + '20' : '#181c27',
                border: `1px solid ${isSelected ? color : '#2a3048'}`,
                borderRadius: '6px',
                color: isSelected ? color : '#9099b2',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = color
                  ;(e.currentTarget as HTMLButtonElement).style.color = color
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3048'
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#9099b2'
                }
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: color
              }} />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}