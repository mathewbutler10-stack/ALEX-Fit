import React from 'react'

export function Button({
  children,
  variant = 'default',
  size = 'default',
  onClick,
  disabled = false,
  className,
  style,
  type = 'button',
}: {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  type?: 'button' | 'submit' | 'reset'
}) {
  const variantStyles = {
    default: {
      background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
      color: 'white',
      border: 'none',
    },
    secondary: {
      background: 'var(--surface2)',
      color: 'var(--text)',
      border: 'none',
    },
    outline: {
      background: 'transparent',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text)',
      border: 'none',
    },
    destructive: {
      background: '#ef4444',
      color: 'white',
      border: 'none',
    },
  }

  const sizeStyles = {
    default: {
      padding: '8px 16px',
      fontSize: '0.875rem',
      height: '40px',
    },
    sm: {
      padding: '6px 12px',
      fontSize: '0.75rem',
      height: '32px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: '1rem',
      height: '48px',
    },
    icon: {
      padding: '8px',
      width: '40px',
      height: '40px',
    },
  }

  return (
    <button
      type={type}
      onClick={(e) => onClick?.(e)}
      disabled={disabled}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius)',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  )
}