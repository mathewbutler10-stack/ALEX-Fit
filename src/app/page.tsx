'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLogin, setShowLogin] = useState(false)

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

    // Try to redirect to dashboard
    router.push('/owner/dashboard')
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '720px', width: '100%', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: '3rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>APEX</span>
        </div>
        <p style={{ color: 'var(--text2)', marginBottom: '48px', fontSize: '1.1rem' }}>
          The complete PT coaching platform
        </p>

        {!showLogin ? (
          /* Portal Selection */
          <div>
            <div style={{
              background: 'var(--surface1)',
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              marginBottom: '32px'
            }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text)' }}>
                Welcome to APEX
              </h2>
              <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
                The complete PT coaching platform. Login to access your dashboard.
              </p>
              
              <button
                onClick={() => setShowLogin(true)}
                style={{
                  background: '#4ade80',
                  color: '#0f1117',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 32px',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Owner Login
              </button>
            </div>
            
            <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>
              Note: This is the production deployment on Netlify.
            </p>
          </div>
        ) : (
          /* Login Form */
          <div style={{
            background: 'var(--surface1)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid var(--border)',
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text)' }}>
              Owner Login
            </h2>
            
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

            <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--text2)',
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
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--text2)',
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
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    outline: 'none',
                  }}
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
                }}
              >
                {loading ? 'Signing in...' : 'Sign in as Owner'}
              </button>
            </form>
            
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                onClick={() => setShowLogin(false)}
                style={{
                  background: 'transparent',
                  color: 'var(--text2)',
                  border: 'none',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ← Back to portal selection
              </button>
            </div>
          </div>
        )}
        
        {/* Test credentials note */}
        <div style={{
          marginTop: '24px',
          background: 'rgba(34, 211, 238, 0.1)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          fontSize: '0.875rem',
          maxWidth: '420px',
          margin: '24px auto 0'
        }}>
          <p style={{ color: '#22d3ee', fontWeight: 600, marginBottom: '8px' }}>
            Test Credentials:
          </p>
          <p style={{ color: 'var(--text2)', marginBottom: '4px' }}>
            Email: <span style={{ color: 'var(--text)' }}>owner@fitlife.com</span>
          </p>
          <p style={{ color: 'var(--text2)' }}>
            Password: <span style={{ color: 'var(--text)' }}>password123</span>
          </p>
        </div>
      </div>
    </main>
  )
}