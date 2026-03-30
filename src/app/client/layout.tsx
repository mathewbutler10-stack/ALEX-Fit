'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/client/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/client/food', icon: '🥗', label: 'Food' },
  { href: '/client/workouts', icon: '💪', label: 'Workouts' },
  { href: '/client/perks', icon: '🎁', label: 'Rewards' },
  { href: '/client/chat', icon: '💬', label: 'Chat' },
]

function BottomNav() {
  const pathname = usePathname()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      height: '64px',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(item => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              color: active ? 'var(--accent)' : 'var(--text3)',
              textDecoration: 'none',
              fontSize: '0.65rem',
              fontWeight: active ? 600 : 400,
              transition: 'color 0.2s',
            }}
          >
            <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const currentPage = navItems.find(n => pathname.startsWith(n.href))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 16px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>APEX</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Client Portal</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <span>★</span>
            <span id="points-balance">— pts</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '16px' }}>
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
