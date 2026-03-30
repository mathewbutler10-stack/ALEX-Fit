'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Perk {
  id: string
  partner_name: string
  category?: string | null
  description?: string | null
  discount_code?: string | null
  price?: number | null
  price_description?: string | null
  applicable_subs?: string[] | null
  active?: boolean
  logo_url?: string | null
}

interface PerkFormData {
  partner_name: string
  category: string
  description: string
  discount_code: string
  price: string
  price_description: string
  applicable_subs: string
  active: boolean
}

const emptyForm: PerkFormData = {
  partner_name: '', category: 'Health', description: '', discount_code: '',
  price: '', price_description: '', applicable_subs: '', active: true,
}

const CATEGORIES = ['All', 'Health', 'Nutrition', 'Fitness', 'Recovery', 'Apparel', 'Tech', 'Other']

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#4ade80',
  Nutrition: '#f97316',
  Fitness: '#22d3ee',
  Recovery: '#a78bfa',
  Apparel: '#fbbf24',
  Tech: '#60a5fa',
  Other: '#9099b2',
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color,
    }}>{children}</span>
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

function PerkModal({ perk, onClose, onSave }: { perk?: Perk; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<PerkFormData>(perk ? {
    partner_name: perk.partner_name,
    category: perk.category ?? 'Health',
    description: perk.description ?? '',
    discount_code: perk.discount_code ?? '',
    price: perk.price?.toString() ?? '',
    price_description: perk.price_description ?? '',
    applicable_subs: (perk.applicable_subs ?? []).join(', '),
    active: perk.active ?? true,
  } : emptyForm)
  const [saving, setSaving] = useState(false)

  function set<K extends keyof PerkFormData>(key: K, val: PerkFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    if (!form.partner_name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      partner_name: form.partner_name,
      category: form.category || null,
      description: form.description || null,
      discount_code: form.discount_code || null,
      price: form.price ? parseFloat(form.price) : null,
      price_description: form.price_description || null,
      applicable_subs: form.applicable_subs.split(',').map(s => s.trim()).filter(Boolean),
      active: form.active,
    }
    if (perk) {
      await supabase.from('perks').update(payload).eq('id', perk.id)
    } else {
      await supabase.from('perks').insert(payload)
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
        width: '480px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
        borderRadius: '16px', padding: '28px', zIndex: 201, animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{perk ? 'Edit Perk' : 'Add Perk'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle()}>Partner Name *</label>
              <input value={form.partner_name} onChange={e => set('partner_name', e.target.value)} style={inputStyle()} placeholder="Acme Supplements" />
            </div>
            <div>
              <label style={labelStyle()}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle()}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle()}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle(), resize: 'vertical' }} placeholder="What's included in this perk…" />
          </div>
          <div>
            <label style={labelStyle()}>Discount Code</label>
            <input value={form.discount_code} onChange={e => set('discount_code', e.target.value.toUpperCase())} style={{ ...inputStyle(), fontFamily: 'monospace', letterSpacing: '0.08em' }} placeholder="APEX20" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle()}>Price ($)</label>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle()} placeholder="0.00" min="0" step="0.01" />
            </div>
            <div>
              <label style={labelStyle()}>Price Description</label>
              <input value={form.price_description} onChange={e => set('price_description', e.target.value)} style={inputStyle()} placeholder="e.g. 20% off all orders" />
            </div>
          </div>
          <div>
            <label style={labelStyle()}>Applicable Subscriptions (comma-separated)</label>
            <input value={form.applicable_subs} onChange={e => set('applicable_subs', e.target.value)} style={inputStyle()} placeholder="virtual_pt, pt_in_person, nutrition_only" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#4ade80', width: '16px', height: '16px' }} />
            <span style={{ color: 'var(--text)', fontSize: '0.88rem' }}>Active</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#0f1117', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : perk ? 'Save Changes' : 'Add Perk'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function PerksPage() {
  const [perks, setPerks] = useState<Perk[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [editingPerk, setEditingPerk] = useState<Perk | undefined>(undefined)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  async function loadPerks() {
    const supabase = createClient()
    const { data } = await supabase
      .from('perks')
      .select('*')
      .order('partner_name', { ascending: true })
    setPerks((data || []) as Perk[])
    setLoading(false)
  }

  useEffect(() => { loadPerks() }, [])

  async function deletePerk(id: string) {
    const supabase = createClient()
    await supabase.from('perks').delete().eq('id', id)
    setDeleteConfirm(null)
    loadPerks()
  }

  const filtered = perks.filter(p => categoryFilter === 'All' || p.category === categoryFilter)

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>Perks</h1>
          <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Partner benefits for your clients</p>
        </div>
        <button
          onClick={() => { setEditingPerk(undefined); setShowModal(true) }}
          style={{ background: '#4ade80', color: '#0f1117', border: 'none', borderRadius: '8px', padding: '11px 20px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
        >+ Add Perk</button>
      </div>

      {/* Category filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: categoryFilter === cat ? `1px solid ${CATEGORY_COLORS[cat] || '#4ade80'}` : '1px solid var(--border, #2a3048)',
              background: categoryFilter === cat ? `${(CATEGORY_COLORS[cat] || '#4ade80')}20` : 'var(--surface, #181c27)',
              color: categoryFilter === cat ? (CATEGORY_COLORS[cat] || '#4ade80') : 'var(--text2, #9099b2)',
              transition: 'all 0.2s',
            }}
          >{cat}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '48px 0' }}>Loading perks…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '48px 0' }}>No perks in this category yet</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {filtered.map(perk => {
            const catColor = CATEGORY_COLORS[perk.category ?? ''] || '#9099b2'
            const subs = perk.applicable_subs ?? []
            return (
              <div key={perk.id} style={{
                background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
                borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                opacity: perk.active ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '4px' }}>{perk.partner_name}</div>
                    <Badge color={catColor}>{perk.category || 'Other'}</Badge>
                  </div>
                  <Badge color={perk.active ? '#4ade80' : '#9099b2'}>{perk.active ? 'Active' : 'Off'}</Badge>
                </div>

                {perk.description && (
                  <p style={{ color: 'var(--text2)', fontSize: '0.82rem', lineHeight: 1.5 }}>{perk.description}</p>
                )}

                {perk.discount_code && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>Code:</span>
                    <span style={{ fontFamily: 'monospace', background: 'var(--surface3)', padding: '3px 8px', borderRadius: '4px', color: '#fbbf24', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em' }}>{perk.discount_code}</span>
                  </div>
                )}

                {perk.price_description && (
                  <div style={{ color: catColor, fontSize: '0.88rem', fontWeight: 600 }}>{perk.price_description}</div>
                )}

                {subs.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {subs.map(s => <Badge key={s} color="#22d3ee">{s.replace('_', ' ')}</Badge>)}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    onClick={() => { setEditingPerk(perk); setShowModal(true) }}
                    style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >Edit</button>
                  <button
                    onClick={() => setDeleteConfirm(perk.id)}
                    style={{ padding: '8px 12px', border: '1px solid #f43f5e30', borderRadius: '8px', background: '#f43f5e10', color: '#f43f5e', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <PerkModal
          perk={editingPerk}
          onClose={() => { setShowModal(false); setEditingPerk(undefined) }}
          onSave={loadPerks}
        />
      )}

      {deleteConfirm && (
        <>
          <div onClick={() => setDeleteConfirm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, animation: 'fadeIn 0.2s ease' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '360px', background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '28px', zIndex: 201, animation: 'scaleIn 0.2s ease', textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🗑️</div>
            <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>Delete Perk?</div>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '20px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button onClick={() => deletePerk(deleteConfirm)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#f43f5e', color: 'white', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
