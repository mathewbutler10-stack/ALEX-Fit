'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
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
          }}>
            APEX
          </div>
          <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>
            Owner Portal Login
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface1, #1a1d29)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid var(--border, #2a2e3e)',
        }}>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: 'var(--text2, #9099b2)',
              fontSize: '0.875rem',
              marginBottom: '8px',
              fontWeight: 600,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@example.com"
              required
              style={{
                width: '100%',
                background: 'var(--bg, #0f1117)',
                border: '1px solid var(--border, #2a2e3e)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--text, #ffffff)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4ade80'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border, #2a2e3e)'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: 'var(--text2, #9099b2)',
              fontSize: '0.875rem',
              marginBottom: '8px',
              fontWeight: 600,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                background: 'var(--bg, #0f1117)',
                border: '1px solid var(--border, #2a2e3e)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'var(--text, #ffffff)',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#4ade80'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border, #2a2e3e)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#4ade80',
              color: '#0f1117',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#22c55e')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#4ade80')}
          >
            {loading ? 'Signing in...' : 'Sign in as Owner'}
          </button>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.875rem' }}>
              Need a different portal?{' '}
              <Link href="/" style={{ color: '#22d3ee', textDecoration: 'none' }}>
                Go back to portal selection
              </Link>
            </p>
          </div>
        </form>

        {/* Test Credentials */}
        <div style={{
          marginTop: '24px',
          background: 'rgba(34, 211, 238, 0.1)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '0.875rem',
        }}>
          <p style={{ color: '#22d3ee', fontWeight: 600, marginBottom: '8px' }}>
            Test Credentials (Owner):
          </p>
          <p style={{ color: 'var(--text2, #9099b2)', marginBottom: '4px' }}>
            Email: <span style={{ color: 'var(--text, #ffffff)' }}>mathewbutler10@gmail.com</span>
          </p>
          <p style={{ color: 'var(--text2, #9099b2)' }}>
            Password: <span style={{ color: 'var(--text, #ffffff)' }}>Oliver12</span>
          </p>
        </div>
      </div>
    </main>
  )
}