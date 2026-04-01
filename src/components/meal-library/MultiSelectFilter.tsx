'use client'

import { useState, useRef, useEffect } from 'react'

interface MultiSelectFilterProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export default function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Select options...'
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const selectedLabels = selected
    .map(value => options.find(opt => opt.value === value)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{
        color: '#9099b2',
        fontSize: '0.75rem',
        display: 'block',
        marginBottom: '4px',
        fontWeight: 600
      }}>
        {label}
      </label>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#181c27',
          border: '1px solid #2a3048',
          borderRadius: '8px',
          padding: '10px 14px',
          color: selected.length > 0 ? '#e8ecf4' : '#9099b2',
          fontSize: '0.88rem',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'border-color 0.2s'
        }}
        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#4ade80'}
        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3048'}
      >
        <span style={{ 
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1
        }}>
          {selected.length > 0 ? selectedLabels : placeholder}
        </span>
        <span style={{ 
          color: '#5a6380',
          fontSize: '0.8rem',
          marginLeft: '8px',
          flexShrink: 0
        }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: '#181c27',
          border: '1px solid #2a3048',
          borderRadius: '8px',
          marginTop: '4px',
          padding: '8px 0',
          zIndex: 100,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {options.map(option => {
            const isSelected = selected.includes(option.value)
            return (
              <div
                key={option.value}
                onClick={() => toggleOption(option.value)}
                style={{
                  padding: '8px 14px',
                  color: isSelected ? '#4ade80' : '#e8ecf4',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#252b3b'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: `2px solid ${isSelected ? '#4ade80' : '#5a6380'}`,
                  borderRadius: '4px',
                  background: isSelected ? '#4ade80' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isSelected && (
                    <span style={{ color: '#0f1117', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}