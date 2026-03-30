import React from 'react'

export function Card({
  children,
  accentColor,
  className,
  style,
}: {
  children: React.ReactNode
  accentColor?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
