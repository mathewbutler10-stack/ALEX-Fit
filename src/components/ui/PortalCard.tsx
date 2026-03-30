'use client'

import Link from 'next/link'

export function PortalCard({
  href,
  icon,
  title,
  description,
  color,
}: {
  href: string
  icon: string
  title: string
  description: string
  color: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '24px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        textDecoration: 'none',
        transition: 'all 0.2s',
        borderTopColor: color,
        borderTopWidth: '3px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'none'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{icon}</div>
      <div style={{
        fontFamily: 'var(--font-syne), Syne, sans-serif',
        fontWeight: 700,
        fontSize: '1.1rem',
        marginBottom: '8px',
        color: 'var(--text)',
      }}>{title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.5 }}>{description}</div>
    </Link>
  )
}
