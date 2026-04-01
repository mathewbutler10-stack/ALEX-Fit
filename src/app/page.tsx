'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // EMERGENCY: Vercel deployment broken, auth routes 404
    // Redirect to static emergency login page
    window.location.href = '/emergency-login-redirect.html'
  }, [])

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
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', color: 'var(--text)' }}>
            Emergency Redirect Active
          </h2>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
            Vercel deployment issue detected. Redirecting to emergency login page...
          </p>
          <a href="/emergency-login-redirect.html" style={{
            background: '#4ade80',
            color: '#0f1117',
            padding: '12px 32px',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-block',
            fontSize: '1.1rem'
          }}>
            Click here for emergency login
          </a>
        </div>
        
        <p style={{ color: 'var(--text3)', fontSize: '0.9rem', marginTop: '32px' }}>
          Issue: Vercel returning 404 for /auth/* routes. Static emergency page bypasses this.
        </p>
      </div>
    </main>
  )
}