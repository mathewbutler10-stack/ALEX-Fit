import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'default' | 'sm' | 'xs'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#0f1117',
    border: 'none',
  },
  secondary: {
    background: 'var(--surface3)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text2)',
    border: 'none',
  },
  danger: {
    background: 'rgba(244,63,94,0.1)',
    color: 'var(--danger)',
    border: '1px solid rgba(244,63,94,0.3)',
  },
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  default: { padding: '10px 20px', fontSize: '0.88rem' },
  sm: { padding: '6px 12px', fontSize: '0.8rem' },
  xs: { padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' },
}

export function Button({
  variant = 'secondary',
  size = 'default',
  children,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
