import React from 'react'

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'orange' | 'gray' | 'purple'

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  green: { bg: 'rgba(74,222,128,0.15)', color: '#4ade80' },
  red: { bg: 'rgba(244,63,94,0.15)', color: '#f43f5e' },
  yellow: { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
  blue: { bg: 'rgba(34,211,238,0.15)', color: '#22d3ee' },
  orange: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  gray: { bg: 'rgba(144,153,178,0.15)', color: '#9099b2' },
  purple: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
}

export function Badge({
  children,
  variant = 'gray',
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  const styles = variantStyles[variant]
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: styles.bg,
        color: styles.color,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
