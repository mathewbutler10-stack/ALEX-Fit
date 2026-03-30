import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const navItems = [
  { href: '/owner/dashboard', icon: '📊', label: 'Dashboard' },
  { href: '/owner/leads', icon: '🎯', label: 'Leads' },
  { href: '/owner/signups', icon: '✨', label: 'New Sign-ups' },
  { href: '/owner/clients', icon: '👥', label: 'Clients' },
  { href: '/owner/pts', icon: '🧑‍💼', label: 'PT Management' },
  { href: '/owner/payouts', icon: '💸', label: 'Payouts' },
  { href: '/owner/subscriptions', icon: '💳', label: 'Subscriptions' },
  { href: '/owner/billing', icon: '💰', label: 'Billing' },
  { href: '/owner/perks', icon: '🎁', label: 'Perks' },
  { href: '/owner/broadcast', icon: '📣', label: 'Broadcast' },
]

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/owner-login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg, #0f1117)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        background: 'var(--surface, #181c27)',
        borderRight: '1px solid var(--border, #2a3048)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        padding: '0 0 24px 0',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border, #2a3048)', marginBottom: '8px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'var(--font-syne, Syne, sans-serif)',
              fontSize: '1.5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>APEX</span>
          </Link>
          <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.72rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner Portal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: 'var(--text2, #9099b2)',
                fontSize: '0.88rem',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border, #2a3048)' }}>
          <Link href="/" style={{ color: 'var(--text3, #5a6380)', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Switch Portal
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: '220px',
        padding: '32px',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
