import React from 'react'

export function Textarea({
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 4,
  className,
  style,
  id,
}: {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
  rows?: number
  className?: string
  style?: React.CSSProperties
  id?: string
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={className}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: `${rows * 24}px`,
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