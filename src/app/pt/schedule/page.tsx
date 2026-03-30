/*
-- sessions table needed:
-- CREATE TABLE sessions (
--   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   gym_id uuid REFERENCES gyms(id) ON DELETE CASCADE,
--   pt_id uuid REFERENCES pts(id) ON DELETE SET NULL,
--   client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
--   session_type text NOT NULL,
--   scheduled_at timestamptz NOT NULL,
--   duration_minutes integer DEFAULT 60,
--   status text DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
--   notes text,
--   created_at timestamptz DEFAULT now(),
--   updated_at timestamptz DEFAULT now()
-- );
*/

'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: string
  client_id?: string
  client_name: string
  session_type: string
  scheduled_at: string
  duration_minutes: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string | null
}

interface ClientOption {
  id: string
  full_name: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockSessions: Session[] = [
  { id: '1', client_name: 'Sarah Johnson', session_type: 'Personal Training', scheduled_at: '2026-03-31T09:00:00', duration_minutes: 60, status: 'scheduled' },
  { id: '2', client_name: 'Mike Chen', session_type: 'Nutrition Consult', scheduled_at: '2026-03-31T11:00:00', duration_minutes: 45, status: 'scheduled' },
  { id: '3', client_name: 'Emma Wilson', session_type: 'Personal Training', scheduled_at: '2026-04-01T08:00:00', duration_minutes: 60, status: 'completed' },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6) // 6am–8pm
const SESSION_TYPES = ['Personal Training', 'Nutrition Consult', 'Assessment', 'Group Class']
const DURATIONS = [30, 45, 60, 90]

const SESSION_COLORS: Record<string, string> = {
  'Personal Training': '#4ade80',
  'Nutrition Consult': '#22d3ee',
  'Assessment': '#a78bfa',
  'Group Class': '#f97316',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#4ade80',
  completed: '#22d3ee',
  cancelled: '#f43f5e',
  no_show: '#f97316',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDays(baseDate: Date): Date[] {
  const days: Date[] = []
  const monday = new Date(baseDate)
  const day = monday.getDay()
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(monday.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    days.push(d)
  }
  return days
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12am'
  if (h < 12) return `${h}am`
  if (h === 12) return '12pm'
  return `${h - 12}pm`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getSessionsForSlot(sessions: Session[], day: Date, hour: number): Session[] {
  return sessions.filter(s => {
    const d = new Date(s.scheduled_at)
    return isSameDay(d, day) && d.getHours() === hour
  })
}

// ─── Book Session Modal ───────────────────────────────────────────────────────

interface BookModalProps {
  clients: ClientOption[]
  initialDate?: string
  initialHour?: number
  ptId: string
  gymId: string
  onClose: () => void
  onSaved: (session: Session) => void
  tableAvailable: boolean
}

function BookModal({ clients, initialDate, initialHour, ptId, gymId, onClose, onSaved, tableAvailable }: BookModalProps) {
  const [form, setForm] = useState({
    client_id: '',
    session_type: 'Personal Training',
    date: initialDate || '',
    time: initialHour !== undefined ? `${String(initialHour).padStart(2, '0')}:00` : '',
    duration_minutes: 60,
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.client_id || !form.date || !form.time) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const scheduled_at = `${form.date}T${form.time}:00`
    const client = clients.find(c => c.id === form.client_id)

    const { data, error: dbErr } = await supabase.from('sessions').insert({
      pt_id: ptId,
      gym_id: gymId,
      client_id: form.client_id,
      session_type: form.session_type,
      scheduled_at,
      duration_minutes: form.duration_minutes,
      notes: form.notes || null,
    }).select().single()

    if (dbErr) {
      setError(dbErr.message)
      setSaving(false)
      return
    }

    onSaved({
      ...(data as Session),
      client_name: client?.full_name ?? 'Unknown',
    })
    onClose()
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: '6px', padding: '9px 12px',
    color: 'var(--text)', fontSize: '0.88rem', outline: 'none',
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', width: '460px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', fontFamily: 'var(--font-syne, Syne, sans-serif)' }}>
          Book Session
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Client *</label>
            <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} style={inputStyle}>
              <option value="">Select client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Session Type</label>
            <select value={form.session_type} onChange={e => setForm(f => ({ ...f, session_type: e.target.value }))} style={inputStyle}>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Date *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Time *</label>
              <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Duration</label>
            <select value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} style={inputStyle}>
              {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {error && <div style={{ color: '#f43f5e', fontSize: '0.82rem' }}>{error}</div>}

          {!tableAvailable && (
            <div style={{ background: '#f9731618', border: '1px solid #f9731644', borderRadius: '8px', padding: '10px 14px', color: '#f97316', fontSize: '0.82rem' }}>
              Sessions table not yet migrated — contact support.
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !tableAvailable}
              style={{ flex: 2, padding: '10px', background: tableAvailable ? 'var(--accent)' : 'var(--surface2)', color: tableAvailable ? '#000' : 'var(--text3)', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: tableAvailable ? 'pointer' : 'not-allowed' }}
            >
              {saving ? 'Booking…' : 'Book Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Session Detail Panel ─────────────────────────────────────────────────────

function SessionDetail({ session, onClose }: { session: Session; onClose: () => void }) {
  const d = new Date(session.scheduled_at)
  const color = SESSION_COLORS[session.session_type] || '#4ade80'
  const statusColor = STATUS_COLORS[session.status] || '#9099b2'

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={onClose} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
        width: '320px', maxWidth: '100vw',
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        padding: '24px 20px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
            Session Detail
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: '10px', padding: '16px', borderLeft: `3px solid ${color}` }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '8px' }}>{session.client_name}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <span style={{ background: `${color}22`, color, padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700 }}>
              {session.session_type}
            </span>
            <span style={{ background: `${statusColor}22`, color: statusColor, padding: '2px 10px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
              {session.status}
            </span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '4px' }}>
            📅 {d.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '4px' }}>
            🕐 {d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })} · {session.duration_minutes} min
          </div>
          {session.notes && (
            <div style={{ color: 'var(--text3)', fontSize: '0.82rem', marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
              {session.notes}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTSchedulePage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(true)
  const [tableAvailable, setTableAvailable] = useState(true)
  const [ptId, setPtId] = useState('')
  const [gymId, setGymId] = useState('')
  const [weekBase, setWeekBase] = useState(new Date())
  const [showBookModal, setShowBookModal] = useState(false)
  const [bookSlot, setBookSlot] = useState<{ date: string; hour: number } | undefined>()
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const weekDays = getWeekDays(weekBase)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()
    if (ptData) {
      const pt = ptData as { id: string; gym_id: string }
      setPtId(pt.id)
      setGymId(pt.gym_id)

      // Try to fetch sessions
      const { data: sessData, error: sessErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('pt_id', pt.id)
        .order('scheduled_at', { ascending: true })

      if (sessErr?.message?.includes('does not exist') || sessErr?.code === '42P01') {
        setTableAvailable(false)
        setSessions(mockSessions)
      } else {
        setTableAvailable(true)
        // map client names — sessions table may not have client_name directly
        const rawSessions = (sessData || []) as Record<string, unknown>[]
        const sessionsWithNames: Session[] = rawSessions.map(s => ({
          ...(s as unknown as Session),
          client_name: (s.client_name as string) || 'Client',
        }))
        setSessions(sessionsWithNames.length > 0 ? sessionsWithNames : mockSessions)
      }

      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, users(full_name)')
        .eq('assigned_pt_id', pt.id)
      setClients(((clientsData || []) as Record<string, unknown>[]).map(c => {
        const u = c.users as Record<string, unknown> | null
        return { id: c.id as string, full_name: (u?.full_name as string) ?? 'Unknown' }
      }))
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function prevWeek() {
    const d = new Date(weekBase)
    d.setDate(d.getDate() - 7)
    setWeekBase(d)
  }

  function nextWeek() {
    const d = new Date(weekBase)
    d.setDate(d.getDate() + 7)
    setWeekBase(d)
  }

  function todayWeek() { setWeekBase(new Date()) }

  function openSlot(day: Date, hour: number) {
    const dateStr = day.toISOString().slice(0, 10)
    setBookSlot({ date: dateStr, hour })
    setShowBookModal(true)
  }

  function handleSaved(session: Session) {
    setSessions(prev => [...prev, session])
  }

  const today = new Date()
  const SLOT_HEIGHT = 56 // px per hour slot

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>My Schedule</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '4px' }}>Week view · click any slot to book</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={prevWeek} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>←</button>
          <button onClick={todayWeek} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Today</button>
          <button onClick={nextWeek} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>→</button>
          <button
            onClick={() => { setBookSlot(undefined); setShowBookModal(true) }}
            style={{ background: 'var(--accent)', color: '#000', border: 'none', padding: '9px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem' }}
          >
            + Book Session
          </button>
        </div>
      </div>

      {!tableAvailable && (
        <div style={{ background: '#f9731618', border: '1px solid #f9731644', borderRadius: '8px', padding: '10px 16px', color: '#f97316', fontSize: '0.85rem', marginBottom: '16px' }}>
          Sessions table not yet migrated — contact support. Showing demo data.
        </div>
      )}

      {/* Week range label */}
      <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>
        {weekDays[0].toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-AU', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px 0' }}>Loading schedule…</div>
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ background: 'var(--surface2)' }} />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, today)
              return (
                <div
                  key={i}
                  style={{
                    padding: '10px 4px', textAlign: 'center',
                    borderLeft: '1px solid var(--border)',
                    background: isToday ? '#4ade8010' : 'var(--surface2)',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {day.toLocaleDateString('en-AU', { weekday: 'short' })}
                  </div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 700,
                    color: isToday ? '#4ade80' : 'var(--text)',
                    fontFamily: 'var(--font-syne, Syne, sans-serif)',
                  }}>
                    {day.getDate()}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Time grid */}
          <div style={{ overflowY: 'auto', maxHeight: '600px' }}>
            {HOURS.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '56px repeat(7, 1fr)', height: `${SLOT_HEIGHT}px`, borderBottom: '1px solid var(--border)' }}>
                {/* Hour label */}
                <div style={{
                  padding: '6px 8px', fontSize: '0.65rem', color: 'var(--text3)',
                  background: 'var(--surface2)', display: 'flex', alignItems: 'flex-start',
                  justifyContent: 'flex-end', borderRight: '1px solid var(--border)',
                }}>
                  {formatHour(hour)}
                </div>

                {/* Day cells */}
                {weekDays.map((day, di) => {
                  const slotSessions = getSessionsForSlot(sessions, day, hour)
                  const isToday = isSameDay(day, today)

                  return (
                    <div
                      key={di}
                      onClick={() => slotSessions.length === 0 && openSlot(day, hour)}
                      style={{
                        borderLeft: '1px solid var(--border)',
                        background: isToday ? '#4ade8006' : 'transparent',
                        padding: '2px',
                        cursor: slotSessions.length === 0 ? 'pointer' : 'default',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {slotSessions.length === 0 && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.15s',
                          fontSize: '0.7rem', color: 'var(--text3)',
                        }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                        >
                          + Book
                        </div>
                      )}
                      {slotSessions.map(s => {
                        const color = SESSION_COLORS[s.session_type] || '#4ade80'
                        return (
                          <div
                            key={s.id}
                            onClick={e => { e.stopPropagation(); setSelectedSession(s) }}
                            style={{
                              background: `${color}22`, border: `1px solid ${color}55`,
                              borderLeft: `3px solid ${color}`,
                              borderRadius: '4px', padding: '3px 6px',
                              cursor: 'pointer', height: `${Math.max(24, (s.duration_minutes / 60) * SLOT_HEIGHT - 6)}px`,
                              overflow: 'hidden',
                            }}
                          >
                            <div style={{ fontSize: '0.65rem', fontWeight: 700, color, lineHeight: 1.2 }}>{s.client_name}</div>
                            <div style={{ fontSize: '0.58rem', color: 'var(--text3)', marginTop: '1px' }}>{s.session_type}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session type legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
        {SESSION_TYPES.map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text2)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: SESSION_COLORS[t] }} />
            {t}
          </div>
        ))}
      </div>

      {/* Book Modal */}
      {showBookModal && (
        <BookModal
          clients={clients}
          initialDate={bookSlot?.date}
          initialHour={bookSlot?.hour}
          ptId={ptId}
          gymId={gymId}
          onClose={() => { setShowBookModal(false); setBookSlot(undefined) }}
          onSaved={handleSaved}
          tableAvailable={tableAvailable}
        />
      )}

      {/* Session Detail Panel */}
      {selectedSession && (
        <SessionDetail session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  )
}
