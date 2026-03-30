'use client'
import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; type?: string }>
}) {
  // Next.js 16: searchParams is a Promise — unwrap with React's use()
  const params = use(searchParams)
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // params.token and params.type are available if needed for display/validation
  void params

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/pt/clients')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#1e2333',
    border: '1px solid #2a3048',
    borderRadius: '8px',
    color: '#e8ecf4',
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
            fontFamily: 'Syne, sans-serif',
            fontSize: '2rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px',
          }}>APEX</div>
          <div style={{ color: '#9099b2', fontSize: '0.9rem' }}>Set your password</div>
        </div>

        <div style={{
          background: '#181c27',
          border: '1px solid #2a3048',
          borderRadius: '12px',
          padding: '32px',
        }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#e8ecf4',
            marginBottom: '8px',
          }}>Welcome to APEX</h1>
          <p style={{ color: '#9099b2', fontSize: '0.88rem', marginBottom: '24px', marginTop: 0 }}>
            Set a password for your PT account to get started.
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

          <form onSubmit={handleSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Re-enter password"
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
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {loading ? 'Setting password…' : 'Set password & sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
