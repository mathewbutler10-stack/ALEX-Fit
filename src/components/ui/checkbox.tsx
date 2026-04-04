import React from 'react'

export function Checkbox({
  checked,
  onCheckedChange,
  disabled = false,
  children,
  className,
  style,
  id,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  id?: string
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style,
      }}
    >
      <button
        id={id}
        type="button"
        onClick={() => !disabled && onCheckedChange?.(!checked)}
        style={{
          width: '16px',
          height: '16px',
          border: `2px solid ${checked ? '#4ade80' : 'var(--border)'}`,
          background: checked ? '#4ade80' : 'transparent',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s',
        }}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{ color: 'white' }}
          >
            <path
              d="M8.5 2.5L4 7L1.5 4.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {children && (
        <label htmlFor={id} style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
          {children}
        </label>
      )}
    </div>
  )
}