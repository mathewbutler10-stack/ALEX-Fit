import React, { createContext, useContext, useState } from 'react'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  style,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const currentValue = value !== undefined ? value : internalValue
  const handleValueChange = onValueChange || setInternalValue

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className} style={{ width: '100%', ...style }}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: '4px',
        padding: '4px',
        background: 'var(--surface2)',
        borderRadius: 'var(--radius)',
        marginBottom: '16px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className,
  style,
}: {
  value: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const context = useContext(TabsContext)
  const isActive = context?.value === value

  return (
    <button
      className={className}
      onClick={() => context?.onValueChange(value)}
      style={{
        flex: 1,
        padding: '8px 16px',
        background: isActive ? 'var(--surface)' : 'transparent',
        border: 'none',
        borderRadius: 'calc(var(--radius) - 2px)',
        color: isActive ? 'var(--text)' : 'var(--text2)',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        fontSize: '0.875rem',
        transition: 'all 0.2s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className,
  style,
}: {
  value: string
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const context = useContext(TabsContext)
  if (context?.value !== value) return null

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}