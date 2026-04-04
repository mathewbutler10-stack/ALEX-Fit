import React from 'react'

export function Progress({
  value = 0,
  max = 100,
  className,
  style,
}: {
  value?: number
  max?: number
  className?: string
  style?: React.CSSProperties
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '8px',
        background: 'var(--surface2)',
        borderRadius: '4px',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #4ade80, #22d3ee)',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}