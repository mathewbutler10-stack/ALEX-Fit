'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ClientLoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/client/dashboard` },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
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
            background: 'linear-gradient(135deg, #22d3ee, #4ade80)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}>APEX</div>
          <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Client Portal</div>
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
            marginBottom: '8px',
          }}>Sign in</h1>
          <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.88rem', marginBottom: '24px', marginTop: 0 }}>
            Enter your email and we'll send you a magic link to sign in instantly.
          </p>

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
              background: 'rgba(34,211,238,0.1)',
              border: '1px solid rgba(34,211,238,0.3)',
              borderRadius: '8px',
              padding: '24px 20px',
              textAlign: 'center',
              color: '#22d3ee',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✉️</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '8px' }}>Magic link sent!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text2, #9099b2)' }}>
                Check your email at <strong style={{ color: 'var(--text, #e8ecf4)' }}>{email}</strong> for your sign-in link.
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{
                  marginTop: '16px',
                  background: 'transparent',
                  border: '1px solid rgba(34,211,238,0.3)',
                  borderRadius: '6px',
                  color: '#22d3ee',
                  fontSize: '0.82rem',
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ color: 'var(--text2, #9099b2)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@email.com"
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
