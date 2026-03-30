'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string
  client_id: string
  pt_id: string
  title: string
  type: 'virtual' | 'in_person' | string
  date: string
  start_time: string
  end_time: string
  status: 'confirmed' | 'pending' | 'cancelled' | string
  location: string | null
  notes: string | null
  client_name: string
}

interface ClientOption {
  id: string
  full_name: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  return d >= startOfWeek && d <= endOfWeek && !isToday(dateStr)
}

function isNextWeek(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfNextWeek = new Date(now)
  startOfNextWeek.setDate(now.getDate() - now.getDay() + 7)
  startOfNextWeek.setHours(0, 0, 0, 0)
  const endOfNextWeek = new Date(startOfNextWeek)
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)
  endOfNextWeek.setHours(23, 59, 59, 999)
  return d >= startOfNextWeek && d <= endOfNextWeek
}

function isPast(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return d < now && !isToday(dateStr)
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
    }}>{text}</span>
  )
}

function statusColor(s: string) {
  if (s === 'confirmed') return '#4ade80'
  if (s === 'cancelled') return '#f43f5e'
  return '#fbbf24'
}

function typeColor(t: string) {
  return t === 'virtual' ? '#22d3ee' : '#f97316'
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#181c27', border: '1px solid #2a3048', borderRadius: '12px', padding: '20px 24px', flex: 1, minWidth: '120px' }}>
      <div style={{ color, fontSize: '1.8rem', fontWeight: 700 }}>{value}</div>
      <div style={{ color: '#9099b2', fontSize: '0.8rem', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

// ─── Session Card ─────────────────────────────────────────────────────────────

function SessionCard({ appt, highlight, onEdit, onCancel }: {
  appt: Appointment; highlight?: boolean; onEdit: () => void; onCancel: () => void
}) {
  const d = new Date(appt.date)
  return (
    <div style={{
      background: '#181c27',
      border: `1px solid ${highlight ? '#4ade80' : '#2a3048'}`,
      borderLeft: `4px solid ${highlight ? '#4ade80' : '#2a3048'}`,
      borderRadius: '10px',
      padding: '16px 18px',
      display: 'flex',
      gap: '16px',
      alignItems: 'flex-start',
    }}>
      {/* Date block */}
      <div style={{
        width: '52px', flexShrink: 0, background: highlight ? '#4ade8022' : '#252b3b',
        borderRadius: '8px', padding: '8px 4px', textAlign: 'center',
      }}>
        <div style={{ color: highlight ? '#4ade80' : '#e8ecf4', fontSize: '1.3rem', fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
        <div style={{ color: '#9099b2', fontSize: '0.65rem', marginTop: '2px' }}>{d.toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <span style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.95rem' }}>{appt.title}</span>
          <Badge text={appt.status} color={statusColor(appt.status)} />
          <Badge text={appt.type === 'virtual' ? 'Virtual' : 'In-Person'} color={typeColor(appt.type)} />
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Client chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#252b3b', borderRadius: '20px', padding: '3px 10px 3px 6px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 700, color: '#0f1117',
            }}>{initials(appt.client_name)}</div>
            <span style={{ color: '#9099b2', fontSize: '0.78rem' }}>{appt.client_name}</span>
          </div>
          <span style={{ color: '#9099b2', fontSize: '0.8rem' }}>{appt.start_time} – {appt.end_time}</span>
          {appt.location && <span style={{ color: '#5a6380', fontSize: '0.78rem' }}>{appt.location}</span>}
        </div>
        {appt.notes && <div style={{ color: '#5a6380', fontSize: '0.78rem', marginTop: '6px' }}>{appt.notes}</div>}
      </div>

      {/* Actions */}
      {appt.status !== 'cancelled' && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={onEdit} style={{
            background: '#22d3ee22', color: '#22d3ee', border: '1px solid #22d3ee44',
            borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
          }}>Edit</button>
          <button onClick={onCancel} style={{
            background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e44',
            borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
          }}>Cancel</button>
        </div>
      )}
    </div>
  )
}

// ─── Group Section ────────────────────────────────────────────────────────────

function GroupSection({ title, items, highlight, collapsible, onEdit, onCancel }: {
  title: string; items: Appointment[]; highlight?: boolean; collapsible?: boolean;
  onEdit: (a: Appointment) => void; onCancel: (id: string) => void
}) {
  const [open, setOpen] = useState(!collapsible)
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', cursor: collapsible ? 'pointer' : 'default' }}
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <span style={{ color: highlight ? '#4ade80' : '#9099b2', fontWeight: 700, fontSize: '0.85rem' }}>{title}</span>
        <span style={{ background: '#252b3b', color: '#5a6380', borderRadius: '20px', padding: '1px 8px', fontSize: '0.72rem' }}>{items.length}</span>
        {collapsible && <span style={{ color: '#5a6380', fontSize: '0.8rem', marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>}
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map(a => (
            <SessionCard key={a.id} appt={a} highlight={highlight} onEdit={() => onEdit(a)} onCancel={() => onCancel(a.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Schedule Modal ───────────────────────────────────────────────────────────

const EMPTY_FORM = {
  client_id: '', title: '', type: 'virtual' as 'virtual' | 'in_person',
  date: '', start_time: '', end_time: '', location: '', notes: '',
}

function ScheduleModal({ ptId, clients, onClose, onSaved, initial }: {
  ptId: string; clients: ClientOption[]; onClose: () => void;
  onSaved: (appt: Appointment) => void; initial?: Appointment | null
}) {
  const supabase = createClient()
  const [form, setForm] = useState(initial ? {
    client_id: initial.client_id, title: initial.title, type: initial.type as 'virtual' | 'in_person',
    date: initial.date, start_time: initial.start_time, end_time: initial.end_time,
    location: initial.location ?? '', notes: initial.notes ?? '',
  } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.client_id || !form.title || !form.date || !form.start_time || !form.end_time) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    const client = clients.find(c => c.id === form.client_id)
    if (initial) {
      const { data } = await supabase.from('appointments').update({
        title: form.title, type: form.type, date: form.date,
        start_time: form.start_time, end_time: form.end_time,
        location: form.location || null, notes: form.notes || null,
      }).eq('id', initial.id).select().single()
      if (data) onSaved({ ...data, client_name: client?.full_name ?? '' } as Appointment)
    } else {
      const { data } = await supabase.from('appointments').insert({
        pt_id: ptId, client_id: form.client_id, title: form.title, type: form.type,
        date: form.date, start_time: form.start_time, end_time: form.end_time,
        location: form.location || null, notes: form.notes || null, status: 'pending',
      }).select().single()
      if (data) onSaved({ ...data, client_name: client?.full_name ?? '' } as Appointment)
    }
    setSaving(false)
    onClose()
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px',
    padding: '9px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#181c27', border: '1px solid #2a3048', borderRadius: '14px', padding: '28px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ color: '#e8ecf4', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>
          {initial ? 'Edit Session' : 'Schedule New Session'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Client *</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={inputStyle}>
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="e.g. Weekly Check-in" />
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>Type *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['virtual', 'in_person'] as const).map(t => (
                <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#9099b2', fontSize: '0.85rem' }}>
                  <input type="radio" checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
                  {t === 'virtual' ? 'Virtual' : 'In Person'}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Date *</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Start Time *</label>
              <input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>End Time *</label>
              <input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {form.type === 'in_person' && (
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} placeholder="e.g. Studio A" />
            </div>
          )}

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && <div style={{ color: '#f43f5e', fontSize: '0.82rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px', color: '#9099b2', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '10px', background: '#4ade80', color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {saving ? 'Saving...' : initial ? 'Update Session' : 'Schedule Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTSchedulePage() {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [ptId, setPtId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editAppt, setEditAppt] = useState<Appointment | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ptData } = await supabase.from('pts').select('id').eq('user_id', user.id).single()
      if (!ptData) { setLoading(false); return }
      setPtId(ptData.id)

      const { data: apptData } = await supabase
        .from('appointments')
        .select('*, clients(users(full_name))')
        .eq('pt_id', ptData.id)
        .order('date', { ascending: true })

      setAppointments((apptData ?? []).map((a: Record<string, unknown>) => {
        const clientRec = a.clients as Record<string, unknown> | null
        const userRec = clientRec?.users as Record<string, unknown> | null
        return { ...a, client_name: (userRec?.full_name as string) ?? 'Unknown' } as Appointment
      }))

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, users(full_name)')
        .eq('assigned_pt_id', ptData.id)
      setClients((clientsData ?? []).map((c: Record<string, unknown>) => {
        const u = c.users as Record<string, unknown> | null
        return { id: c.id as string, full_name: (u?.full_name as string) ?? 'Unknown' }
      }))

      setLoading(false)
    }
    load()
  }, [])

  async function cancelAppt(id: string) {
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
    setAppointments(as => as.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
  }

  function handleSaved(appt: Appointment) {
    setAppointments(as => {
      const idx = as.findIndex(a => a.id === appt.id)
      if (idx >= 0) { const copy = [...as]; copy[idx] = appt; return copy }
      return [...as, appt]
    })
  }

  const active = appointments.filter(a => a.status !== 'cancelled')
  const cancelled = appointments.filter(a => a.status === 'cancelled')
  const todayAppts = active.filter(a => isToday(a.date))
  const thisWeek = active.filter(a => isThisWeek(a.date))
  const nextWeek = active.filter(a => isNextWeek(a.date))
  const past = active.filter(a => isPast(a.date))
  const upcoming = active.filter(a => !isToday(a.date) && !isPast(a.date))
  const confirmed = active.filter(a => a.status === 'confirmed')
  const virtual = active.filter(a => a.type === 'virtual')
  const inPerson = active.filter(a => a.type === 'in_person')

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#e8ecf4', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Schedule</h1>
          <p style={{ color: '#9099b2', fontSize: '0.88rem', margin: '4px 0 0' }}>Manage your sessions</p>
        </div>
        <button onClick={() => { setEditAppt(null); setShowModal(true) }} style={{
          padding: '10px 22px', background: '#4ade80', color: '#0f1117',
          fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>+ Schedule Session</button>
      </div>

      {/* KPI Strip */}
      {!loading && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <KpiCard label="Upcoming Sessions" value={upcoming.length} color="#e8ecf4" />
          <KpiCard label="Confirmed" value={confirmed.length} color="#4ade80" />
          <KpiCard label="Virtual" value={virtual.length} color="#22d3ee" />
          <KpiCard label="In-Person" value={inPerson.length} color="#f97316" />
        </div>
      )}

      {loading ? (
        <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px' }}>Loading schedule...</div>
      ) : (
        <>
          <GroupSection title="Today" items={todayAppts} highlight onEdit={a => { setEditAppt(a); setShowModal(true) }} onCancel={cancelAppt} />
          <GroupSection title="This Week" items={thisWeek} onEdit={a => { setEditAppt(a); setShowModal(true) }} onCancel={cancelAppt} />
          <GroupSection title="Next Week" items={nextWeek} onEdit={a => { setEditAppt(a); setShowModal(true) }} onCancel={cancelAppt} />
          <GroupSection title="Past" items={past} collapsible onEdit={a => { setEditAppt(a); setShowModal(true) }} onCancel={cancelAppt} />
          <GroupSection title="Cancelled" items={cancelled} collapsible onEdit={a => { setEditAppt(a); setShowModal(true) }} onCancel={cancelAppt} />

          {appointments.length === 0 && (
            <div style={{ color: '#5a6380', textAlign: 'center', padding: '60px' }}>
              No sessions scheduled yet. Click &quot;Schedule Session&quot; to get started.
            </div>
          )}
        </>
      )}

      {showModal && (
        <ScheduleModal
          ptId={ptId}
          clients={clients}
          onClose={() => { setShowModal(false); setEditAppt(null) }}
          onSaved={handleSaved}
          initial={editAppt}
        />
      )}
    </div>
  )
}
