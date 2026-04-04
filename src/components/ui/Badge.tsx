import React from 'react'

export function Badge({
  children,
  variant = 'default',
  className,
  style,
}: {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  className?: string
  style?: React.CSSProperties
}) {
  const variantStyles = {
    default: {
      background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'var(--surface2)',
      color: 'var(--text2)',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    destructive: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
    },
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 500,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}