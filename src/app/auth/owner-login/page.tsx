'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function OwnerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
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

    router.push('/owner/dashboard')
    router.refresh()
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
        {/* Logo */}
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
          <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Owner Portal</div>
        </div>

        {/* Card */}
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
            marginBottom: '24px',
          }}>Sign in to your gym</h1>

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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@gymname.com"
                style={{
                  width: '100%',
                  background: 'var(--surface2, #1e2333)',
                  border: '1px solid var(--border, #2a3048)',
                  borderRadius: '8px',
                  color: 'var(--text, #e8ecf4)',
                  fontSize: '0.9rem',
                  padding: '10px 14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
                style={{
                  width: '100%',
                  background: 'var(--surface2, #1e2333)',
                  border: '1px solid var(--border, #2a3048)',
                  borderRadius: '8px',
                  color: 'var(--text, #e8ecf4)',
                  fontSize: '0.9rem',
                  padding: '10px 14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
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
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text2, #9099b2)', fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: 'var(--text2, #9099b2)' }}>← Back to portal selector</Link>
        </div>
      </div>
    </main>
  )
}
