'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Emergency redirect - auth routes 404 on Vercel
    // Redirect to /login which works
    router.replace('/login')
  }, [router])

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
        
        <div style={{
          background: 'var(--surface1)',
          padding: '32px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text)' }}>
            Redirecting to login...
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            APEX auth system is loading. You will be redirected automatically.
          </p>
          <a href="/login" style={{
            background: '#4ade80',
            color: '#0f1117',
            padding: '12px 32px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-block',
            fontSize: '1.1rem'
          }}>
            Click here if not redirected
          </a>
        </div>
        
        <p style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '32px' }}>
          Note: Temporary redirect due to Vercel deployment issue with auth routes.
        </p>
      </div>
    </main>
  )
}