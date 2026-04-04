import React from 'react'

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className,
  style,
  id,
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  id?: string
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        transition: 'border-color 0.2s',
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
        ...style,
      }}
    />
  )
}