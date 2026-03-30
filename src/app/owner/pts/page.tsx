'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum'

const TIER_COLORS: Record<Tier, string> = {
  Bronze: '#cd7f32',
  Silver: '#9099b2',
  Gold: '#fbbf24',
  Platinum: '#a78bfa',
}

interface PT {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  abn?: string | null
  bio?: string | null
  specialisations?: string[] | null
  max_clients?: number | null
  client_count?: number
  tier?: Tier | null
  rating?: number | null
  status?: string | null
  prefers_virtual?: boolean
  prefers_in_person?: boolean
  prefers_nutrition?: boolean
}

interface PTFormData {
  full_name: string
  email: string
  phone: string
  abn: string
  bio: string
  specialisations: string
  max_clients: string
  prefers_virtual: boolean
  prefers_in_person: boolean
  prefers_nutrition: boolean
  status: string
}

const emptyForm: PTFormData = {
  full_name: '', email: '', phone: '', abn: '', bio: '',
  specialisations: '', max_clients: '20',
  prefers_virtual: false, prefers_in_person: false, prefers_nutrition: false,
  status: 'active',
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color,
    }}>{children}</span>
  )
}

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: 'linear-gradient(135deg, #22d3ee, #a78bfa)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: `${size * 0.3}px`, fontWeight: 700, color: '#0f1117', flexShrink: 0,
    }}>{initials}</div>
  )
}

function Stars({ rating }: { rating: number | null | undefined }) {
  const r = Math.round(rating ?? 0)
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= r ? '#fbbf24' : 'var(--border, #2a3048)', fontSize: '0.85rem' }}>★</span>
      ))}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--surface3, #252b3b)', border: '1px solid var(--border, #2a3048)',
    borderRadius: '8px', color: 'var(--text, #e8ecf4)', padding: '10px 14px',
    fontSize: '0.88rem', width: '100%', outline: 'none',
  }
}

function labelStyle(): React.CSSProperties {
  return { color: 'var(--text2, #9099b2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', display: 'block' }
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '16px', height: '16px', accentColor: '#4ade80', cursor: 'pointer' }}
      />
      <span style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.88rem' }}>{label}</span>
    </label>
  )
}

function PTModal({ pt, onClose, onSave }: { pt?: PT; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<PTFormData>(pt ? {
    full_name: pt.full_name,
    email: pt.email,
    phone: pt.phone ?? '',
    abn: pt.abn ?? '',
    bio: pt.bio ?? '',
    specialisations: (pt.specialisations ?? []).join(', '),
    max_clients: pt.max_clients?.toString() ?? '20',
    prefers_virtual: pt.prefers_virtual ?? false,
    prefers_in_person: pt.prefers_in_person ?? false,
    prefers_nutrition: pt.prefers_nutrition ?? false,
    status: pt.status ?? 'active',
  } : emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof PTFormData, val: string | boolean) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.email.trim()) {
      setError('Name and email are required')
      return
    }
    setSaving(true)
    setError('')
    const supabase = createClient()
    const specs = form.specialisations.split(',').map(s => s.trim()).filter(Boolean)

    if (pt) {
      // Update existing PT
      await supabase.from('pts').update({
        phone: form.phone || null,
        abn: form.abn || null,
        bio: form.bio || null,
        specialisations: specs,
        max_clients: form.max_clients ? parseInt(form.max_clients) : null,
        prefers_virtual: form.prefers_virtual,
        prefers_in_person: form.prefers_in_person,
        prefers_nutrition: form.prefers_nutrition,
        status: form.status,
      }).eq('id', pt.id)
      await supabase.from('users').update({
        full_name: form.full_name,
        email: form.email,
      }).eq('id', pt.user_id)
    } else {
      // Insert new user then pt
      const { data: newUser, error: userErr } = await supabase.from('users').insert({
        full_name: form.full_name,
        email: form.email,
        role: 'pt',
      }).select('id').single()
      if (userErr || !newUser) {
        setError(userErr?.message ?? 'Failed to create user')
        setSaving(false)
        return
      }
      await supabase.from('pts').insert({
        user_id: newUser.id,
        phone: form.phone || null,
        abn: form.abn || null,
        bio: form.bio || null,
        specialisations: specs,
        max_clients: form.max_clients ? parseInt(form.max_clients) : null,
        prefers_virtual: form.prefers_virtual,
        prefers_in_person: form.prefers_in_person,
        prefers_nutrition: form.prefers_nutrition,
        status: 'active',
      })
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '520px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
        borderRadius: '16px', padding: '28px', zIndex: 201,
        animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>
            {pt ? 'Edit PT' : 'Add New PT'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3, #5a6380)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        {error && <div style={{ background: '#f43f5e20', border: '1px solid #f43f5e', borderRadius: '8px', padding: '10px 14px', color: '#f43f5e', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle()}>Full Name *</label>
              <input value={form.full_name} onChange={e => set('full_name', e.target.value)} style={inputStyle()} placeholder="Jane Smith" />
            </div>
            <div>
              <label style={labelStyle()}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle()} placeholder="jane@gym.com" />
            </div>
            <div>
              <label style={labelStyle()}>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} style={inputStyle()} placeholder="+61 4xx xxx xxx" />
            </div>
            <div>
              <label style={labelStyle()}>ABN</label>
              <input value={form.abn} onChange={e => set('abn', e.target.value)} style={inputStyle()} placeholder="12 345 678 901" />
            </div>
          </div>

          <div>
            <label style={labelStyle()}>Bio</label>
            <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Short bio…" />
          </div>

          <div>
            <label style={labelStyle()}>Specialisations (comma-separated)</label>
            <input value={form.specialisations} onChange={e => set('specialisations', e.target.value)} style={inputStyle()} placeholder="Strength, HIIT, Yoga" />
          </div>

          <div>
            <label style={labelStyle()}>Max Clients</label>
            <input type="number" value={form.max_clients} onChange={e => set('max_clients', e.target.value)} style={inputStyle()} min="1" max="100" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={labelStyle()}>Preferences</div>
            <CheckboxRow label="Prefers Virtual Sessions" checked={form.prefers_virtual} onChange={v => set('prefers_virtual', v)} />
            <CheckboxRow label="Prefers In-Person Sessions" checked={form.prefers_in_person} onChange={v => set('prefers_in_person', v)} />
            <CheckboxRow label="Prefers Nutrition Coaching" checked={form.prefers_nutrition} onChange={v => set('prefers_nutrition', v)} />
          </div>

          {pt && (
            <div>
              <label style={labelStyle()}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inputStyle() }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--border, #2a3048)', borderRadius: '8px', background: 'none', color: 'var(--text2, #9099b2)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#0f1117', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : pt ? 'Save Changes' : 'Add PT'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PTsPage() {
  const [pts, setPTs] = useState<PT[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPT, setEditingPT] = useState<PT | undefined>(undefined)

  async function loadPTs() {
    const supabase = createClient()
    const { data } = await supabase
      .from('pts')
      .select(`
        id, user_id, phone, abn, bio, specialisations, max_clients, tier, rating, status,
        prefers_virtual, prefers_in_person, prefers_nutrition,
        user:users(full_name, email),
        clients(id)
      `)
      .order('created_at', { ascending: false })

    type RawPT = {
      id: string
      user_id: string
      phone?: string | null
      abn?: string | null
      bio?: string | null
      specialisations?: string[] | null
      max_clients?: number | null
      tier?: string | null
      rating?: number | null
      status?: string | null
      prefers_virtual?: boolean
      prefers_in_person?: boolean
      prefers_nutrition?: boolean
      user?: { full_name?: string | null; email?: string | null } | null
      clients?: { id: string }[]
    }

    setPTs(((data || []) as RawPT[]).map(p => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.user?.full_name || 'Unknown',
      email: p.user?.email || '',
      phone: p.phone,
      abn: p.abn,
      bio: p.bio,
      specialisations: p.specialisations,
      max_clients: p.max_clients,
      client_count: (p.clients || []).length,
      tier: (p.tier as Tier | null) ?? null,
      rating: p.rating,
      status: p.status,
      prefers_virtual: p.prefers_virtual,
      prefers_in_person: p.prefers_in_person,
      prefers_nutrition: p.prefers_nutrition,
    })))
    setLoading(false)
  }

  useEffect(() => { loadPTs() }, [])

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>PT Management</h1>
          <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>{pts.length} personal trainers</p>
        </div>
        <button
          onClick={() => { setEditingPT(undefined); setShowModal(true) }}
          style={{
            background: '#4ade80', color: '#0f1117', border: 'none', borderRadius: '8px',
            padding: '11px 20px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
          }}
        >+ Add PT</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3, #5a6380)', textAlign: 'center', padding: '48px 0' }}>Loading PTs…</div>
      ) : pts.length === 0 ? (
        <div style={{ color: 'var(--text3, #5a6380)', textAlign: 'center', padding: '48px 0' }}>No PTs yet. Add your first PT above.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {pts.map(pt => {
            const tierColor = pt.tier ? TIER_COLORS[pt.tier] : '#9099b2'
            const isActive = pt.status === 'active'
            const specs = pt.specialisations ?? []
            const clientCount = pt.client_count ?? 0
            const maxClients = pt.max_clients ?? 0
            const utilPct = maxClients > 0 ? Math.min(100, Math.round((clientCount / maxClients) * 100)) : 0

            return (
              <div key={pt.id} style={{
                background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
                borderRadius: '14px', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <Avatar name={pt.full_name} size={52} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontWeight: 700, fontSize: '1rem', color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>{pt.full_name}</div>
                    <Stars rating={pt.rating} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    {pt.tier && <Badge color={tierColor}>{pt.tier}</Badge>}
                    <Badge color={isActive ? '#4ade80' : '#9099b2'}>{isActive ? 'Active' : pt.status ?? 'Inactive'}</Badge>
                  </div>
                </div>

                {/* Client count */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text2, #9099b2)', fontSize: '0.8rem' }}>Clients</span>
                    <span style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.8rem', fontWeight: 600 }}>{clientCount} / {maxClients || '∞'}</span>
                  </div>
                  {maxClients > 0 && (
                    <div style={{ background: 'var(--surface3, #252b3b)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${utilPct}%`, background: utilPct >= 90 ? '#f43f5e' : '#4ade80', borderRadius: '999px', transition: 'width 0.3s' }} />
                    </div>
                  )}
                </div>

                {/* Specialisations */}
                {specs.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {specs.slice(0, 3).map(s => <Badge key={s} color="#22d3ee">{s}</Badge>)}
                    {specs.length > 3 && <span style={{ color: 'var(--text3, #5a6380)', fontSize: '0.75rem', alignSelf: 'center' }}>+{specs.length - 3}</span>}
                  </div>
                )}

                {/* Bio */}
                {pt.bio && (
                  <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.82rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{pt.bio}</p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => { setEditingPT(pt); setShowModal(true) }}
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--border, #2a3048)', borderRadius: '8px', background: 'none', color: 'var(--text2, #9099b2)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                  >Edit</button>
                  <button
                    style={{ flex: 1, padding: '8px', border: '1px solid #22d3ee30', borderRadius: '8px', background: '#22d3ee10', color: '#22d3ee', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                  >Message</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PTModal
          pt={editingPT}
          onClose={() => { setShowModal(false); setEditingPT(undefined) }}
          onSave={loadPTs}
        />
      )}
    </div>
  )
}
