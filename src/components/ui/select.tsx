import React, { useState, useRef, useEffect } from 'react'

interface SelectContextType {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  setValue: (value: string) => void
  disabled: boolean
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export function Select({
  value,
  onValueChange,
  disabled = false,
  children,
  className,
  style,
}: {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const [internalValue, setInternalValue] = useState(value || '')
  const [open, setOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const currentValue = value !== undefined ? value : internalValue

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setInternalValue(newValue)
    }
    setOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ open, setOpen, value: currentValue, setValue: handleValueChange, disabled }}>
      <div
        ref={selectRef}
        className={className}
        style={{ position: 'relative', width: '100%', ...style }}
      >
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className,
  style,
  id,
}: {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  id?: string
}) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectTrigger must be used within Select')

  return (
    <button
      id={id}
      type="button"
      onClick={() => !context.disabled && context.setOpen(!context.open)}
      className={className}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        color: 'var(--text)',
        fontSize: '0.875rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: context.disabled ? 'not-allowed' : 'pointer',
        opacity: context.disabled ? 0.5 : 1,
        ...style,
      }}
      disabled={context.disabled}
    >
      {children || <SelectValue />}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{
          transform: context.open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          opacity: context.disabled ? 0.5 : 1,
        }}
      >
        <path
          d="M4 6L8 10L12 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export function SelectValue({
  placeholder = 'Select...',
  className,
  style,
}: {
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectValue must be used within Select')

  return (
    <span className={className} style={{ color: context.value ? 'var(--text)' : 'var(--text2)', ...style }}>
      {context.value || placeholder}
    </span>
  )
}

export function SelectContent({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectContent must be used within Select')
  if (!context.open) return null

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '4px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        maxHeight: '200px',
        overflowY: 'auto',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SelectItem({
  value,
  children,
  className,
  style,
  disabled = false,
}: {
  value: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
}) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error('SelectItem must be used within Select')

  const isSelected = context.value === value
  const isDisabled = disabled || context.disabled

  return (
    <button
      type="button"
      onClick={() => !isDisabled && context.setValue(value)}
      className={className}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: isSelected ? 'var(--surface2)' : 'transparent',
        border: 'none',
        color: isSelected ? 'var(--text)' : 'var(--text2)',
        fontSize: '0.875rem',
        textAlign: 'left',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'background 0.2s',
        ...style,
      }}
      disabled={isDisabled}
    >
      {children}
    </button>
  )
}