'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to owner login
    router.replace('/auth/owner-login')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg, #0f1117)',
      color: 'var(--text, #ffffff)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Redirecting to APEX Login...</h1>
        <p style={{ color: 'var(--text2, #9099b2)' }}>
          If you are not redirected automatically, <a href="/auth/owner-login" style={{ color: '#4ade80' }}>click here</a>.
        </p>
      </div>
    </div>
  )
}