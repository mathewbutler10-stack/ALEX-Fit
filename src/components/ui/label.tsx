import React from 'react'

export function Label({
  children,
  htmlFor,
  className,
  style,
}: {
  children: React.ReactNode
  htmlFor?: string
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={className}
      style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        color: 'var(--text)',
        marginBottom: '4px',
        display: 'block',
        ...style,
      }}
    >
      {children}
    </label>
  )
}