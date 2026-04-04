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

// Placeholder components to fix TypeScript errors
export function CardContent({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={{ padding: '16px', ...style }}>{children}</div>
}

export function CardDescription({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <p className={className} style={{ color: 'var(--text2)', fontSize: '0.875rem', marginBottom: '8px', ...style }}>{children}</p>
}

export function CardHeader({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={{ padding: '24px 24px 0', ...style }}>{children}</div>
}

export function CardTitle({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <h3 className={className} style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px', ...style }}>{children}</h3>
}