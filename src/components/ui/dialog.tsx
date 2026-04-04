import React, { useEffect } from 'react'

interface DialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextType | undefined>(undefined)

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  style,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const [internalOpen, setInternalOpen] = React.useState(open || false)

  const currentOpen = open !== undefined ? open : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  // Close on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && currentOpen) {
        handleOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [currentOpen, handleOpenChange])

  return (
    <DialogContext.Provider value={{ open: currentOpen, setOpen: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export function DialogTrigger({
  children,
  className,
  style,
  asChild = false,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  asChild?: boolean
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogTrigger must be used within Dialog')

  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement;
    const childProps = childElement.props as { className?: string; style?: React.CSSProperties };
    return React.cloneElement(childElement, {
      onClick: () => context.setOpen(true),
      className: `${childProps.className || ''} ${className || ''}`,
      style: { ...childProps.style, ...style },
    } as any)
  }

  return (
    <button
      type="button"
      onClick={() => context.setOpen(true)}
      className={className}
      style={style}
    >
      {children}
    </button>
  )
}

export function DialogContent({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogContent must be used within Dialog')
  if (!context.open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
        onClick={() => context.setOpen(false)}
      />
      
      {/* Dialog */}
      <div
        className={className}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 50,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  )
}

export function DialogHeader({
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
      style={{ marginBottom: '20px', ...style }}
    >
      {children}
    </div>
  )
}

export function DialogTitle({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <h2
      className={className}
      style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '8px',
        color: 'var(--text)',
        ...style,
      }}
    >
      {children}
    </h2>
  )
}

export function DialogDescription({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <p
      className={className}
      style={{
        fontSize: '0.875rem',
        color: 'var(--text2)',
        marginBottom: '16px',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

export function DialogFooter({
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
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function DialogClose({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error('DialogClose must be used within Dialog')

  return (
    <button
      type="button"
      onClick={() => context.setOpen(false)}
      className={className}
      style={style}
    >
      {children}
    </button>
  )
}