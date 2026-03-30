'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'

type LeadSource = 'website' | 'instagram' | 'facebook' | 'referral' | 'walk_in' | 'other'

interface Gym {
  id: string
  name: string
}

interface PageProps {
  params: Promise<{ gymSlug: string }>
}

export default function LeadCapturePage({ params }: PageProps) {
  const { gymSlug } = use(params)
  const [gym, setGym] = useState<Gym | null>(null)
  const [loadingGym, setLoadingGym] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website' as LeadSource })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadGym() {
      const supabase = createClient()
      const { data } = await supabase
        .from('gyms')
        .select('id, name')
        .eq('slug', gymSlug)
        .single()

      setGym(data as Gym | null)
      setLoadingGym(false)
    }
    loadGym()
  }, [gymSlug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !gym) return
    setSubmitting(true)
    setError('')

    const supabase = createClient()
    const { error: insertErr } = await supabase
      .from('leads')
      .insert({
        gym_id: gym.id,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        source: form.source,
        status: 'new',
      })

    if (insertErr) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  if (loadingGym) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text3)' }}>Loading…</div>
      </div>
    )
  }

  if (!gym) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🤷</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }}>Gym not found</div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '360px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px' }}>
            You&apos;re on the list!
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '1rem', lineHeight: 1.6 }}>
            Thanks for your interest in <strong style={{ color: 'var(--text)' }}>{gym.name}</strong>.
            We&apos;ll be in touch soon!
          </p>
          <div style={{
            marginTop: '24px', padding: '16px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text2)', fontSize: '0.88rem',
          }}>
            Keep an eye on your phone and inbox 📱
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '8px',
          }}>
            APEX
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '6px' }}>
            {gym.name}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Interested in joining? Fill in your details and we&apos;ll reach out.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '6px', fontWeight: 500 }}>
              Full Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Jane Smith"
              required
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '6px', fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="jane@example.com"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '6px', fontWeight: 500 }}>
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="0400 000 000"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '6px', fontWeight: 500 }}>
              How did you hear about us?
            </label>
            <select
              value={form.source}
              onChange={e => setForm(p => ({ ...p, source: e.target.value as LeadSource }))}
              style={{ width: '100%' }}
            >
              <option value="website">Website</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="other">Other</option>
            </select>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.82rem', padding: '8px', background: '#f43f5e10', borderRadius: 'var(--radius-sm)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            style={{
              background: form.name.trim() ? 'var(--accent)' : 'var(--surface2)',
              color: form.name.trim() ? '#000' : 'var(--text3)',
              border: 'none', borderRadius: 'var(--radius-sm)',
              padding: '14px', fontFamily: 'Syne, sans-serif',
              fontWeight: 800, fontSize: '1rem', cursor: form.name.trim() ? 'pointer' : 'not-allowed',
              marginTop: '4px',
            }}
          >
            {submitting ? 'Sending…' : "Get in Touch"}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '0.75rem', marginTop: '16px' }}>
          Powered by APEX Fit
        </p>
      </div>
    </div>
  )
}
