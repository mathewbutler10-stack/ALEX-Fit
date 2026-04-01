'use client'

import { useState, useEffect } from 'react'
import { formatPrepTime } from './types'

interface PrepTimeFilterProps {
  value: [number, number];
  onChange: (range: [number, number]) => void;
  maxTime?: number;
}

export default function PrepTimeFilter({ 
  value, 
  onChange, 
  maxTime = 120 
}: PrepTimeFilterProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value)

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), localValue[1])
    const newValue: [number, number] = [newMin, localValue[1]]
    setLocalValue(newValue)
    onChange(newValue)
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), localValue[0])
    const newValue: [number, number] = [localValue[0], newMax]
    setLocalValue(newValue)
    onChange(newValue)
  }

  // Calculate slider track background
  const minPercent = (localValue[0] / maxTime) * 100
  const maxPercent = (localValue[1] / maxTime) * 100

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <label style={{
          color: '#9099b2',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          Prep Time
        </label>
        <span style={{
          color: '#4ade80',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {formatPrepTime(localValue[0])} - {formatPrepTime(localValue[1])}
        </span>
      </div>

      {/* Custom slider track */}
      <div style={{
        position: 'relative',
        height: '24px',
        marginBottom: '8px'
      }}>
        {/* Background track */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '4px',
          background: '#2a3048',
          borderRadius: '2px',
          transform: 'translateY(-50%)'
        }} />
        
        {/* Active track */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${minPercent}%`,
          right: `${100 - maxPercent}%`,
          height: '4px',
          background: '#4ade80',
          borderRadius: '2px',
          transform: 'translateY(-50%)'
        }} />
        
        {/* Min thumb */}
        <input
          type="range"
          min="0"
          max={maxTime}
          value={localValue[0]}
          onChange={handleMinChange}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
            transform: 'translateY(-50%)',
            zIndex: 2
          }}
        />
        
        {/* Max thumb */}
        <input
          type="range"
          min="0"
          max={maxTime}
          value={localValue[1]}
          onChange={handleMaxChange}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            margin: 0,
            opacity: 0,
            cursor: 'pointer',
            transform: 'translateY(-50%)',
            zIndex: 2
          }}
        />
        
        {/* Custom thumbs */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${minPercent}%`,
          width: '16px',
          height: '16px',
          background: '#4ade80',
          border: '2px solid #0f1117',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }} />
        
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${maxPercent}%`,
          width: '16px',
          height: '16px',
          background: '#4ade80',
          border: '2px solid #0f1117',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 1,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }} />
      </div>

      {/* Time labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: '#5a6380',
        fontSize: '0.7rem'
      }}>
        <span>0m</span>
        <span>30m</span>
        <span>60m</span>
        <span>90m</span>
        <span>120m</span>
      </div>
    </div>
  )
}