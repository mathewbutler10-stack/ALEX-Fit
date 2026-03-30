import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function PTLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/pt-login')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0f1117)' }}>
      {/* Top Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface, #181c27)',
        borderBottom: '1px solid var(--border, #2a3048)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        gap: '0',
      }}>
        <Link href="/" style={{ marginRight: '32px', textDecoration: 'none' }}>
          <span style={{
            fontFamily: 'var(--font-syne, Syne, sans-serif)',
            fontSize: '1.3rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>APEX</span>
        </Link>
        {[
          { href: '/pt/clients', label: 'My Clients' },
          { href: '/pt/schedule', label: 'My Schedule' },
          { href: '/pt/workouts', label: 'Workout Library' },
          { href: '/pt/meal-library', label: 'Meal Library' },
          { href: '/pt/meal-planner', label: '🥗 Meal Planner' },
          { href: '/pt/messages', label: 'Messages' },
        ].map(item => (
          <Link key={item.href} href={item.href} style={{
            padding: '8px 16px',
            color: 'var(--text2, #9099b2)',
            fontSize: '0.88rem',
            fontWeight: 500,
            textDecoration: 'none',
            borderRadius: '6px',
            transition: 'all 0.2s',
          }}>
            {item.label}
          </Link>
        ))}
        <div style={{ flex: 1 }} />
        <Link href="/" style={{ color: 'var(--text3, #5a6380)', fontSize: '0.8rem', textDecoration: 'none' }}>← Switch Portal</Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}
