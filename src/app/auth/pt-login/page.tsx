'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function PTLoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/pt/clients')
    router.refresh()
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/pt/clients` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface2, #1e2333)',
    border: '1px solid var(--border, #2a3048)',
    borderRadius: '8px',
    color: 'var(--text, #e8ecf4)',
    fontSize: '0.9rem',
    padding: '10px 14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg, #0f1117)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'var(--font-syne, Syne, sans-serif)',
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}>APEX</div>
          <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>PT Portal</div>
        </div>

        <div style={{
          background: 'var(--surface, #181c27)',
          border: '1px solid var(--border, #2a3048)',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-syne, Syne, sans-serif)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text, #e8ecf4)',
            marginBottom: '20px',
          }}>PT Sign in</h1>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--surface2, #1e2333)',
            borderRadius: '8px',
            padding: '4px',
            marginBottom: '24px',
          }}>
            {(['password', 'magic'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSent(false) }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: tab === t ? 'var(--surface3, #252b3b)' : 'transparent',
                  color: tab === t ? 'var(--text, #e8ecf4)' : 'var(--text2, #9099b2)',
                  transition: 'all 0.2s',
                }}
              >
                {t === 'password' ? 'Password' : 'Magic Link'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{
              background: 'rgba(244,63,94,0.1)',
              border: '1px solid rgba(244,63,94,0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#f43f5e',
              fontSize: '0.88rem',
            }}>{error}</div>
          )}

          {sent ? (
            <div style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.3)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              color: '#4ade80',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✉️</div>
              <div style={{ fontWeight: 600 }}>Magic link sent!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2, #9099b2)', marginTop: '8px' }}>Check your email for the sign-in link.</div>
            </div>
          ) : tab === 'password' ? (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#4ade80',
                  color: '#0f1117',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  marginTop: '8px',
                  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
                }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
                  style={inputStyle}
                />
              </div>
              <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', margin: 0 }}>
                We'll send a magic link to your email — no password needed.
              </p>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#22d3ee',
                  color: '#0f1117',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
                }}
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link href="/" style={{ color: 'var(--text2, #9099b2)', fontSize: '0.8rem' }}>← Back to portal selector</Link>
        </div>
      </div>
    </main>
  )
}
