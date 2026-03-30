'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type LeadStatus = 'new' | 'contacted' | 'trial_booked' | 'converted' | 'lost'
type LeadSource = 'website' | 'instagram' | 'facebook' | 'referral' | 'walk_in' | 'other'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: LeadSource
  status: LeadStatus
  notes: string | null
  assigned_pt_id: string | null
  created_at: string
}

interface PT {
  id: string
  user_id: string
  name: string
}

const COLUMNS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: '#4ade80' },
  { key: 'contacted', label: 'Contacted', color: '#22d3ee' },
  { key: 'trial_booked', label: 'Trial Booked', color: '#a78bfa' },
  { key: 'converted', label: 'Converted', color: '#f97316' },
]

const SOURCE_COLORS: Record<LeadSource, string> = {
  website: '#4ade80',
  instagram: '#e1306c',
  facebook: '#1877f2',
  referral: '#a78bfa',
  walk_in: '#f97316',
  other: '#9099b2',
}

const SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  instagram: 'Instagram',
  facebook: 'Facebook',
  referral: 'Referral',
  walk_in: 'Walk-in',
  other: 'Other',
}

function daysSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  return Math.floor(diff / 86400000)
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [pts, setPts] = useState<PT[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterSource, setFilterSource] = useState<LeadSource | ''>('')
  const [filterPt, setFilterPt] = useState('')

  // Add lead form state
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website' as LeadSource })
  const [saving, setSaving] = useState(false)

  // Detail panel edits
  const [detailNotes, setDetailNotes] = useState('')
  const [detailStatus, setDetailStatus] = useState<LeadStatus>('new')
  const [detailPt, setDetailPt] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const supabase = createClient()
    const [{ data: leadsData }, { data: ptsData }] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('pts').select('id, user_id, user:users(full_name)').eq('status', 'active'),
    ])

    setLeads((leadsData || []) as Lead[])

    type PtRow = { id: string; user_id: string; user?: { full_name?: string | null } | null }
    setPts(((ptsData || []) as PtRow[]).map(p => ({
      id: p.id,
      user_id: p.user_id,
      name: p.user?.full_name || 'PT',
    })))
    setLoading(false)
  }

  async function addLead() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    // Get gym_id from current user's profile
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data: userData } = await supabase
      .from('users')
      .select('gym_id')
      .eq('id', user.id)
      .single()

    type UserRow = { gym_id?: string }
    const gymId = (userData as UserRow | null)?.gym_id

    const { data: newLead } = await supabase
      .from('leads')
      .insert({ ...form, gym_id: gymId, status: 'new' })
      .select('*')
      .single()

    if (newLead) setLeads(prev => [newLead as Lead, ...prev])
    setForm({ name: '', email: '', phone: '', source: 'website' })
    setShowAddModal(false)
    setSaving(false)
  }

  async function updateLead() {
    if (!selected) return
    const supabase = createClient()
    const updates: Partial<Lead> = { notes: detailNotes, status: detailStatus, assigned_pt_id: detailPt || null }
    await supabase.from('leads').update(updates).eq('id', selected.id)
    setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, ...updates } : l))
    setSelected(prev => prev ? { ...prev, ...updates } : prev)
  }

  async function convertToClient(lead: Lead) {
    const supabase = createClient()
    await supabase.from('leads').update({ status: 'converted' }).eq('id', lead.id)
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'converted' } : l))
    setSelected(null)
  }

  function openDetail(lead: Lead) {
    setSelected(lead)
    setDetailNotes(lead.notes || '')
    setDetailStatus(lead.status)
    setDetailPt(lead.assigned_pt_id || '')
  }

  const filtered = leads.filter(l => {
    if (filterSource && l.source !== filterSource) return false
    if (filterPt && l.assigned_pt_id !== filterPt) return false
    return true
  })

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)' }}>Leads</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: '2px' }}>Track and convert prospects into clients</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: 'var(--radius-sm)',
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
          }}
        >
          + Add Lead
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value as LeadSource | '')}
          style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', minWidth: '130px' }}
        >
          <option value="">All Sources</option>
          {(Object.keys(SOURCE_LABELS) as LeadSource[]).map(s => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterPt}
          onChange={e => setFilterPt(e.target.value)}
          style={{ borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', minWidth: '130px' }}
        >
          <option value="">All PTs</option>
          {pts.map(pt => <option key={pt.id} value={pt.user_id}>{pt.name}</option>)}
        </select>
        <div style={{ color: 'var(--text3)', fontSize: '0.82rem', display: 'flex', alignItems: 'center' }}>
          {filtered.length} leads
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Loading leads…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', overflowX: 'auto' }}>
          {COLUMNS.map(col => {
            const colLeads = filtered.filter(l => l.status === col.key)
            return (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text3)', background: 'var(--surface2)', padding: '1px 8px', borderRadius: '999px' }}>
                    {colLeads.length}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
                  {colLeads.map(lead => (
                    <button
                      key={lead.id}
                      onClick={() => openDetail(lead)}
                      style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)', padding: '12px',
                        textAlign: 'left', cursor: 'pointer', width: '100%',
                        borderTop: `3px solid ${col.color}`,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '6px' }}>{lead.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{
                          padding: '2px 7px', borderRadius: '999px',
                          fontSize: '0.65rem', fontWeight: 600,
                          background: `${SOURCE_COLORS[lead.source]}20`,
                          color: SOURCE_COLORS[lead.source],
                        }}>
                          {SOURCE_LABELS[lead.source]}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{daysSince(lead.created_at)}d ago</span>
                      </div>
                      {lead.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{lead.phone}</div>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail slide-out panel */}
      {selected && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={() => setSelected(null)} />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
            width: '360px', maxWidth: '100vw',
            background: 'var(--surface)', borderLeft: '1px solid var(--border)',
            padding: '24px 20px',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)' }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Contact info */}
            <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selected.email && <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>✉ {selected.email}</div>}
              {selected.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>📞 {selected.phone}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  padding: '2px 8px', borderRadius: '999px',
                  fontSize: '0.68rem', fontWeight: 600,
                  background: `${SOURCE_COLORS[selected.source]}20`,
                  color: SOURCE_COLORS[selected.source],
                }}>
                  {SOURCE_LABELS[selected.source]}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Added {daysSince(selected.created_at)}d ago</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text2)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Status</label>
              <select
                value={detailStatus}
                onChange={e => setDetailStatus(e.target.value as LeadStatus)}
                style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
              >
                {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* Assign PT */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text2)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Assign PT</label>
              <select
                value={detailPt}
                onChange={e => setDetailPt(e.target.value)}
                style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="">Unassigned</option>
                {pts.map(pt => <option key={pt.id} value={pt.user_id}>{pt.name}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text2)', display: 'block', marginBottom: '6px', fontWeight: 500 }}>Notes</label>
              <textarea
                value={detailNotes}
                onChange={e => setDetailNotes(e.target.value)}
                rows={4}
                placeholder="Add notes about this lead..."
                style={{ width: '100%', resize: 'vertical', borderRadius: 'var(--radius-sm)' }}
              />
            </div>

            {/* Actions */}
            <button
              onClick={updateLead}
              style={{
                background: 'var(--accent)', color: '#000',
                border: 'none', borderRadius: 'var(--radius-sm)',
                padding: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Save Changes
            </button>

            {selected.status !== 'converted' && (
              <button
                onClick={() => convertToClient(selected)}
                style={{
                  background: 'var(--surface2)', color: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-sm)', padding: '12px',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem',
                }}
              >
                Convert to Client →
              </button>
            )}
          </div>
        </>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }} onClick={() => setShowAddModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 100, width: '420px', maxWidth: 'calc(100vw - 32px)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '24px',
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text)' }}>Add New Lead</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                placeholder="Full Name *"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%' }}
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={{ width: '100%' }}
              />
              <input
                placeholder="Phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                style={{ width: '100%' }}
              />
              <select
                value={form.source}
                onChange={e => setForm(p => ({ ...p, source: e.target.value as LeadSource }))}
                style={{ width: '100%' }}
              >
                {(Object.keys(SOURCE_LABELS) as LeadSource[]).map(s => (
                  <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '10px',
                  color: 'var(--text2)', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={addLead}
                disabled={saving || !form.name.trim()}
                style={{
                  flex: 1, background: form.name.trim() ? 'var(--accent)' : 'var(--surface2)',
                  color: form.name.trim() ? '#000' : 'var(--text3)',
                  border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px',
                  fontWeight: 600, cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {saving ? 'Adding…' : 'Add Lead'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
