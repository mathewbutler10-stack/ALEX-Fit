'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type SubscriptionType = 'virtual_pt' | 'pt_in_person' | 'nutrition_only' | string

interface Client {
  id: string
  user_id: string
  assigned_pt_id: string
  subscription_type: SubscriptionType
  at_risk: boolean
  at_risk_reasons: string | null
  goals: string | null
  motivation: string | null
  context: string | null
  calorie_goal: number | null
  protein_goal: number | null
  carbs_goal: number | null
  fat_goal: number | null
  pt_notes: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  dob: string | null
  preferred_contact: string[] | null
  contact_notes: string | null
  emergency_name: string | null
  emergency_phone: string | null
  emergency_rel: string | null
  full_name: string
  email: string
  last_login: string | null
  login_streak: number | null
}

interface Appointment {
  id: string
  client_id: string
  pt_id: string
  title: string
  type: string
  date: string
  start_time: string
  end_time: string
  status: string
  location: string | null
  notes: string | null
}

interface WeeklyMealPlan {
  id: string
  client_id: string
  week_start: string
  day: number
  meal_slot: number
  meal_id: string | null
  meal_name: string | null
}

interface ClientWorkout {
  id: string
  client_id: string
  workout_id: string
  assigned_at: string
  workout_name: string
  workout_focus: string
  workout_difficulty: string
  workout_description: string | null
  exercise_count: number
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  client_id: string
  content: string
  created_at: string
  is_pt: boolean
}

interface MealLibraryItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface WorkoutLibraryItem {
  id: string
  name: string
  focus: string
  difficulty: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function subColor(type: SubscriptionType) {
  if (type === 'virtual_pt') return '#4ade80'
  if (type === 'pt_in_person') return '#22d3ee'
  if (type === 'nutrition_only') return '#f97316'
  return '#9099b2'
}

function subLabel(type: SubscriptionType) {
  if (type === 'virtual_pt') return 'Virtual PT'
  if (type === 'pt_in_person') return 'In-Person PT'
  if (type === 'nutrition_only') return 'Nutrition Only'
  return type
}

function daysSince(dateStr: string | null) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / 86400000)
}

const TABS = ['Overview', 'Contact', 'Schedule', 'Nutrition', 'Meal Planner', 'Workouts', 'Goals', 'Messages']

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

// ─── ClientCard ───────────────────────────────────────────────────────────────

function ClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const days = daysSince(client.last_login)
  return (
    <div
      onClick={onClick}
      style={{
        background: '#181c27',
        border: '1px solid #2a3048',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#4ade80'
        ;(e.currentTarget as HTMLDivElement).style.background = '#1e2333'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3048'
        ;(e.currentTarget as HTMLDivElement).style.background = '#181c27'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Avatar */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, color: '#0f1117', flexShrink: 0,
        }}>
          {initials(client.full_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.95rem' }}>{client.full_name}</span>
            {client.at_risk && (
              <span style={{ background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e44', borderRadius: '4px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 600 }}>AT RISK</span>
            )}
          </div>
          <div style={{ marginTop: '4px' }}>
            <span style={{
              background: subColor(client.subscription_type) + '22',
              color: subColor(client.subscription_type),
              border: `1px solid ${subColor(client.subscription_type)}44`,
              borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
            }}>
              {subLabel(client.subscription_type)}
            </span>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#9099b2', fontSize: '0.7rem' }}>Last Login</div>
              <div style={{ color: '#e8ecf4', fontSize: '0.82rem', fontWeight: 600 }}>
                {days === null ? '—' : days === 0 ? 'Today' : `${days}d ago`}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#9099b2', fontSize: '0.7rem' }}>Streak</div>
              <div style={{ color: '#4ade80', fontSize: '0.82rem', fontWeight: 600 }}>{client.login_streak ?? 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Tab components ───────────────────────────────────────────────────────────

function OverviewTab({ client }: { client: Client }) {
  const days = daysSince(client.last_login)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{
          background: subColor(client.subscription_type) + '22',
          color: subColor(client.subscription_type),
          border: `1px solid ${subColor(client.subscription_type)}44`,
          borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600,
        }}>{subLabel(client.subscription_type)}</span>
        {client.at_risk && (
          <span style={{ background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e44', borderRadius: '6px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600 }}>AT RISK</span>
        )}
      </div>
      {client.at_risk_reasons && (
        <InfoCard label="At-Risk Reasons" value={client.at_risk_reasons} />
      )}
      {client.goals && <InfoCard label="Goals" value={client.goals} />}
      {client.context && <InfoCard label="Context" value={client.context} />}
      <div style={{ display: 'flex', gap: '16px' }}>
        <StatBlock label="Last Login" value={days === null ? '—' : days === 0 ? 'Today' : `${days}d ago`} />
        <StatBlock label="Login Streak" value={`${client.login_streak ?? 0} days`} color="#4ade80" />
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#252b3b', borderRadius: '8px', padding: '12px 16px' }}>
      <div style={{ color: '#9099b2', fontSize: '0.75rem', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#e8ecf4', fontSize: '0.88rem', lineHeight: 1.5 }}>{value}</div>
    </div>
  )
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#252b3b', borderRadius: '8px', padding: '12px 16px', flex: 1 }}>
      <div style={{ color: '#9099b2', fontSize: '0.75rem' }}>{label}</div>
      <div style={{ color: color ?? '#e8ecf4', fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{value}</div>
    </div>
  )
}

function ContactTab({ client }: { client: Client }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    phone: client.phone ?? '',
    mobile: client.mobile ?? '',
    address: client.address ?? '',
    dob: client.dob ?? '',
    preferred_contact: (client.preferred_contact ?? []).join(', '),
    contact_notes: client.contact_notes ?? '',
    emergency_name: client.emergency_name ?? '',
    emergency_phone: client.emergency_phone ?? '',
    emergency_rel: client.emergency_rel ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({
      phone: form.phone || null,
      mobile: form.mobile || null,
      address: form.address || null,
      dob: form.dob || null,
      preferred_contact: form.preferred_contact.split(',').map(s => s.trim()).filter(Boolean),
      contact_notes: form.contact_notes || null,
      emergency_name: form.emergency_name || null,
      emergency_phone: form.emergency_phone || null,
      emergency_rel: form.emergency_rel || null,
    }).eq('id', client.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const contactOptions = ['Phone', 'WhatsApp', 'SMS', 'Email', 'Video']
  const selected = form.preferred_contact.split(',').map(s => s.trim()).filter(Boolean)

  function toggleContact(opt: string) {
    const current = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
    setForm(f => ({ ...f, preferred_contact: current.join(', ') }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Field label="Phone" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
        <Field label="Mobile" value={form.mobile} onChange={v => setForm(f => ({ ...f, mobile: v }))} />
      </div>
      <Field label="Address" value={form.address} onChange={v => setForm(f => ({ ...f, address: v }))} />
      <Field label="Date of Birth" value={form.dob} onChange={v => setForm(f => ({ ...f, dob: v }))} type="date" />
      <div>
        <div style={{ color: '#9099b2', fontSize: '0.75rem', marginBottom: '8px' }}>Preferred Contact</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {contactOptions.map(opt => (
            <button key={opt} onClick={() => toggleContact(opt)} style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer',
              border: selected.includes(opt) ? '1px solid #4ade80' : '1px solid #2a3048',
              background: selected.includes(opt) ? '#4ade8022' : '#252b3b',
              color: selected.includes(opt) ? '#4ade80' : '#9099b2',
            }}>{opt}</button>
          ))}
        </div>
      </div>
      <Field label="Contact Notes" value={form.contact_notes} onChange={v => setForm(f => ({ ...f, contact_notes: v }))} textarea />
      <div style={{ color: '#e8ecf4', fontSize: '0.82rem', fontWeight: 600, marginTop: '4px' }}>Emergency Contact</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <Field label="Name" value={form.emergency_name} onChange={v => setForm(f => ({ ...f, emergency_name: v }))} />
        <Field label="Phone" value={form.emergency_phone} onChange={v => setForm(f => ({ ...f, emergency_phone: v }))} />
        <Field label="Relationship" value={form.emergency_rel} onChange={v => setForm(f => ({ ...f, emergency_rel: v }))} />
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        marginTop: '8px', padding: '10px 24px', background: saved ? '#4ade8044' : '#4ade80',
        color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
      }}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}

function Field({ label, value, onChange, type, textarea }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean
}) {
  const style = {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px',
    padding: '8px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
    resize: 'vertical' as const,
  }
  return (
    <div>
      <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={style} />
        : <input type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  )
}

function ScheduleTab({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [appts, setAppts] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('appointments').select('*').eq('client_id', clientId).order('date', { ascending: true })
      .then(({ data }) => { setAppts(data ?? []); setLoading(false) })
  }, [clientId])

  if (loading) return <LoadingState />
  if (!appts.length) return <EmptyState message="No appointments scheduled." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {appts.map(a => (
        <div key={a.id} style={{ background: '#252b3b', borderRadius: '8px', padding: '14px 16px', display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div style={{
            width: '48px', height: '48px', background: '#1e2333', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: '#e8ecf4', fontSize: '1.1rem', fontWeight: 700 }}>{new Date(a.date).getDate()}</span>
            <span style={{ color: '#9099b2', fontSize: '0.65rem' }}>{new Date(a.date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
            <div style={{ color: '#9099b2', fontSize: '0.8rem', marginTop: '2px' }}>{a.start_time} – {a.end_time}</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Badge text={a.status} color={a.status === 'confirmed' ? '#4ade80' : a.status === 'cancelled' ? '#f43f5e' : '#fbbf24'} />
            <Badge text={a.type} color={a.type === 'virtual' ? '#22d3ee' : '#f97316'} />
          </div>
        </div>
      ))}
    </div>
  )
}

function NutritionTab({ client }: { client: Client }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    calorie_goal: client.calorie_goal ?? 0,
    protein_goal: client.protein_goal ?? 0,
    carbs_goal: client.carbs_goal ?? 0,
    fat_goal: client.fat_goal ?? 0,
    pt_notes: client.pt_notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({
      calorie_goal: form.calorie_goal,
      protein_goal: form.protein_goal,
      carbs_goal: form.carbs_goal,
      fat_goal: form.fat_goal,
      pt_notes: form.pt_notes || null,
    }).eq('id', client.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const macros = [
    { key: 'calorie_goal', label: 'Calories', unit: 'kcal', color: '#f97316' },
    { key: 'protein_goal', label: 'Protein', unit: 'g', color: '#4ade80' },
    { key: 'carbs_goal', label: 'Carbs', unit: 'g', color: '#22d3ee' },
    { key: 'fat_goal', label: 'Fat', unit: 'g', color: '#fbbf24' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Macro rings visual */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {macros.map(m => (
          <div key={m.key} style={{ background: '#252b3b', borderRadius: '10px', padding: '14px 18px', flex: 1, minWidth: '100px', textAlign: 'center' }}>
            <div style={{ color: m.color, fontSize: '1.4rem', fontWeight: 700 }}>{form[m.key]}</div>
            <div style={{ color: '#9099b2', fontSize: '0.72rem' }}>{m.label}</div>
            <div style={{ color: '#5a6380', fontSize: '0.65rem' }}>{m.unit}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {macros.map(m => (
          <div key={m.key}>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>{m.label} ({m.unit})</label>
            <input
              type="number"
              value={form[m.key]}
              onChange={e => setForm(f => ({ ...f, [m.key]: Number(e.target.value) }))}
              style={{ width: '100%', boxSizing: 'border-box', background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px', padding: '8px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none' }}
            />
          </div>
        ))}
      </div>
      <Field label="PT Notes" value={form.pt_notes} onChange={v => setForm(f => ({ ...f, pt_notes: v }))} textarea />
      <button onClick={handleSave} disabled={saving} style={{
        padding: '10px 24px', background: saved ? '#4ade8044' : '#4ade80',
        color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
      }}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}

function MealPlanTab({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [plans, setPlans] = useState<WeeklyMealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState('')
  const [meals, setMeals] = useState<MealLibraryItem[]>([])
  const [picker, setPicker] = useState<{ day: number; slot: number } | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: planData } = await supabase
        .from('weekly_meal_plans')
        .select('*, meal_library(name)')
        .eq('client_id', clientId)
        .order('week_start', { ascending: false })

      if (planData && planData.length > 0) {
        setWeekStart(planData[0].week_start)
        setPlans(planData.map((p: Record<string, unknown>) => ({
          ...p,
          meal_name: (p.meal_library as { name: string } | null)?.name ?? null,
        })) as WeeklyMealPlan[])
      }

      const { data: mealData } = await supabase.from('meal_library').select('id, name, calories, protein, carbs, fat')
      setMeals(mealData ?? [])
      setLoading(false)
    }
    load()
  }, [clientId])

  function getMeal(day: number, slot: number) {
    return plans.find(p => p.day === day && p.meal_slot === slot)
  }

  async function assignMeal(mealId: string, mealName: string) {
    if (!picker) return
    const existing = getMeal(picker.day, picker.slot)
    if (existing) {
      await supabase.from('weekly_meal_plans').update({ meal_id: mealId }).eq('id', existing.id)
      setPlans(ps => ps.map(p => p.id === existing.id ? { ...p, meal_id: mealId, meal_name: mealName } : p))
    } else {
      const { data } = await supabase.from('weekly_meal_plans').insert({
        client_id: clientId, week_start: weekStart || new Date().toISOString().split('T')[0],
        day: picker.day, meal_slot: picker.slot, meal_id: mealId,
      }).select().single()
      if (data) setPlans(ps => [...ps, { ...data, meal_name: mealName }])
    }
    setPicker(null)
  }

  if (loading) return <LoadingState />

  const filtered = meals.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      {weekStart && <div style={{ color: '#9099b2', fontSize: '0.8rem', marginBottom: '12px' }}>Week of {weekStart}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
          <thead>
            <tr>
              <th style={{ color: '#5a6380', fontSize: '0.72rem', padding: '6px 8px', textAlign: 'left', width: '80px' }}>Meal</th>
              {DAY_LABELS.map(d => (
                <th key={d} style={{ color: '#9099b2', fontSize: '0.72rem', padding: '6px 8px', textAlign: 'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_LABELS.map((meal, slotIdx) => (
              <tr key={meal}>
                <td style={{ color: '#9099b2', fontSize: '0.75rem', padding: '6px 8px', fontWeight: 500 }}>{meal}</td>
                {DAY_LABELS.map((_, dayIdx) => {
                  const entry = getMeal(dayIdx, slotIdx)
                  return (
                    <td key={dayIdx} style={{ padding: '4px' }}>
                      <button
                        onClick={() => setPicker({ day: dayIdx, slot: slotIdx })}
                        style={{
                          width: '100%', minHeight: '40px', background: entry ? '#1e2333' : '#252b3b',
                          border: `1px solid ${entry ? '#2a3048' : '#1e2333'}`,
                          borderRadius: '6px', color: entry ? '#e8ecf4' : '#5a6380',
                          fontSize: '0.7rem', cursor: 'pointer', padding: '4px 6px', textAlign: 'center',
                        }}
                      >
                        {entry?.meal_name ?? '+ Add'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meal Picker Modal */}
      {picker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPicker(null)}>
          <div style={{
            background: '#181c27', border: '1px solid #2a3048', borderRadius: '12px',
            padding: '24px', width: '400px', maxHeight: '480px', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#e8ecf4', fontWeight: 700, marginBottom: '12px' }}>
              Pick Meal — {DAY_LABELS[picker.day]} {MEAL_LABELS[picker.slot]}
            </div>
            <input
              placeholder="Search meals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px', padding: '8px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none', marginBottom: '12px' }}
            />
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(m => (
                <button key={m.id} onClick={() => assignMeal(m.id, m.name)} style={{
                  background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px',
                  padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ color: '#e8ecf4', fontSize: '0.88rem' }}>{m.name}</span>
                  <span style={{ color: '#9099b2', fontSize: '0.72rem' }}>{m.calories} kcal</span>
                </button>
              ))}
              {filtered.length === 0 && <div style={{ color: '#5a6380', textAlign: 'center', padding: '20px' }}>No meals found</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function WorkoutsTab({ clientId }: { clientId: string }) {
  const supabase = createClient()
  const [clientWorkouts, setClientWorkouts] = useState<ClientWorkout[]>([])
  const [library, setLibrary] = useState<WorkoutLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data: cwData } = await supabase
        .from('client_workouts')
        .select('id, client_id, workout_id, assigned_at, workouts(name, focus, difficulty, description, exercises)')
        .eq('client_id', clientId)

      setClientWorkouts((cwData ?? []).map((cw: Record<string, unknown>) => {
        const w = cw.workouts as Record<string, unknown> | null
        return {
          id: cw.id as string,
          client_id: cw.client_id as string,
          workout_id: cw.workout_id as string,
          assigned_at: cw.assigned_at as string,
          workout_name: (w?.name as string) ?? '',
          workout_focus: (w?.focus as string) ?? '',
          workout_difficulty: (w?.difficulty as string) ?? '',
          workout_description: (w?.description as string) ?? null,
          exercise_count: Array.isArray(w?.exercises) ? w.exercises.length : 0,
        }
      }))

      const { data: libData } = await supabase.from('workouts').select('id, name, focus, difficulty')
      setLibrary(libData ?? [])
      setLoading(false)
    }
    load()
  }, [clientId])

  async function addWorkout(workoutId: string) {
    const { data } = await supabase.from('client_workouts').insert({ client_id: clientId, workout_id: workoutId }).select('id, client_id, workout_id, assigned_at, workouts(name, focus, difficulty, description, exercises)').single()
    if (data) {
      const w = (data.workouts as unknown) as Record<string, unknown> | null
      setClientWorkouts(cws => [...cws, {
        id: data.id,
        client_id: data.client_id,
        workout_id: data.workout_id,
        assigned_at: data.assigned_at,
        workout_name: (w?.name as string) ?? '',
        workout_focus: (w?.focus as string) ?? '',
        workout_difficulty: (w?.difficulty as string) ?? '',
        workout_description: (w?.description as string) ?? null,
        exercise_count: Array.isArray(w?.exercises) ? w.exercises.length : 0,
      }])
    }
    setShowPicker(false)
  }

  async function removeWorkout(id: string) {
    await supabase.from('client_workouts').delete().eq('id', id)
    setClientWorkouts(cws => cws.filter(c => c.id !== id))
  }

  if (loading) return <LoadingState />

  const diffColor = (d: string) => d === 'beginner' ? '#4ade80' : d === 'intermediate' ? '#fbbf24' : '#f43f5e'
  const filtered = library.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <button onClick={() => setShowPicker(true)} style={{
        padding: '8px 18px', background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8044',
        borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, alignSelf: 'flex-start',
      }}>+ Add from Library</button>

      {clientWorkouts.length === 0
        ? <EmptyState message="No workouts assigned yet." />
        : clientWorkouts.map(cw => (
          <div key={cw.id} style={{ background: '#252b3b', borderRadius: '8px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.9rem' }}>{cw.workout_name}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '5px' }}>
                <Badge text={cw.workout_focus} color="#22d3ee" />
                <Badge text={cw.workout_difficulty} color={diffColor(cw.workout_difficulty)} />
                <span style={{ color: '#5a6380', fontSize: '0.72rem' }}>{cw.exercise_count} exercises</span>
              </div>
            </div>
            <button onClick={() => removeWorkout(cw.id)} style={{
              background: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e44',
              borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '0.78rem',
            }}>Remove</button>
          </div>
        ))
      }

      {showPicker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowPicker(false)}>
          <div style={{
            background: '#181c27', border: '1px solid #2a3048', borderRadius: '12px',
            padding: '24px', width: '420px', maxHeight: '500px', display: 'flex', flexDirection: 'column',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ color: '#e8ecf4', fontWeight: 700, marginBottom: '12px' }}>Add Workout</div>
            <input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px', padding: '8px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none', marginBottom: '12px' }}
            />
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filtered.map(w => (
                <button key={w.id} onClick={() => addWorkout(w.id)} style={{
                  background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px',
                  padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <span style={{ color: '#e8ecf4', fontSize: '0.88rem' }}>{w.name}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Badge text={w.focus} color="#22d3ee" />
                    <Badge text={w.difficulty} color={diffColor(w.difficulty)} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalsTab({ client }: { client: Client }) {
  const supabase = createClient()
  const [form, setForm] = useState({
    goals: client.goals ?? '',
    motivation: client.motivation ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({ goals: form.goals || null, motivation: form.motivation || null }).eq('id', client.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Field label="Goals" value={form.goals} onChange={v => setForm(f => ({ ...f, goals: v }))} textarea />
      <Field label="Motivation" value={form.motivation} onChange={v => setForm(f => ({ ...f, motivation: v }))} textarea />
      <button onClick={handleSave} disabled={saving} style={{
        padding: '10px 24px', background: saved ? '#4ade8044' : '#4ade80',
        color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
      }}>
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}

function MessagesTab({ clientId, ptUserId }: { clientId: string; ptUserId: string }) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true })
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })

    const channel = supabase.channel(`messages-client-${clientId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        payload => setMessages(prev => [...prev, payload.new as Message])
      ).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!text.trim()) return
    setSending(true)
    await supabase.from('messages').insert({ client_id: clientId, sender_id: ptUserId, content: text.trim(), is_pt: true })
    setText('')
    setSending(false)
  }

  if (loading) return <LoadingState />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0', marginBottom: '12px' }}>
        {messages.length === 0 && <EmptyState message="No messages yet." />}
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.is_pt ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '70%', padding: '10px 14px', borderRadius: '12px',
              background: m.is_pt ? '#4ade8022' : '#252b3b',
              border: `1px solid ${m.is_pt ? '#4ade8044' : '#2a3048'}`,
            }}>
              <div style={{ color: '#e8ecf4', fontSize: '0.88rem', lineHeight: 1.5 }}>{m.content}</div>
              <div style={{ color: '#5a6380', fontSize: '0.68rem', marginTop: '4px', textAlign: m.is_pt ? 'right' : 'left' }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px', padding: '10px 14px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none' }}
        />
        <button onClick={sendMessage} disabled={sending || !text.trim()} style={{
          padding: '10px 20px', background: '#4ade80', color: '#0f1117',
          fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>Send</button>
      </div>
    </div>
  )
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: '4px', padding: '2px 7px', fontSize: '0.72rem', fontWeight: 600,
    }}>{text}</span>
  )
}

function LoadingState() {
  return <div style={{ color: '#5a6380', textAlign: 'center', padding: '32px' }}>Loading...</div>
}

function EmptyState({ message }: { message: string }) {
  return <div style={{ color: '#5a6380', textAlign: 'center', padding: '32px' }}>{message}</div>
}

// ─── ClientDrawer ─────────────────────────────────────────────────────────────

function ClientDrawer({ client, ptUserId, onClose }: { client: Client; ptUserId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('Overview')

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px', maxWidth: '100vw',
        background: '#181c27', borderLeft: '1px solid #2a3048', zIndex: 101,
        display: 'flex', flexDirection: 'column', overflowY: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a3048', display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700, color: '#0f1117',
          }}>
            {initials(client.full_name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#e8ecf4', fontWeight: 700, fontSize: '1.05rem' }}>{client.full_name}</div>
            <div style={{ color: '#9099b2', fontSize: '0.8rem' }}>{client.email}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9099b2', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #2a3048', overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 14px', background: 'none', border: 'none',
              borderBottom: activeTab === tab ? '2px solid #4ade80' : '2px solid transparent',
              color: activeTab === tab ? '#4ade80' : '#9099b2',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{tab}</button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'Overview' && <OverviewTab client={client} />}
          {activeTab === 'Contact' && <ContactTab client={client} />}
          {activeTab === 'Schedule' && <ScheduleTab clientId={client.id} />}
          {activeTab === 'Nutrition' && <NutritionTab client={client} />}
          {activeTab === 'Meal Planner' && <MealPlanTab clientId={client.id} />}
          {activeTab === 'Workouts' && <WorkoutsTab clientId={client.id} />}
          {activeTab === 'Goals' && <GoalsTab client={client} />}
          {activeTab === 'Messages' && <MessagesTab clientId={client.id} ptUserId={ptUserId} />}
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Client | null>(null)
  const [ptId, setPtId] = useState<string>('')
  const [ptUserId, setPtUserId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'at_risk'>('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setPtUserId(user.id)

      const { data: ptData } = await supabase.from('pts').select('id').eq('user_id', user.id).single()
      if (!ptData) { setLoading(false); return }

      setPtId(ptData.id)

      const { data } = await supabase
        .from('clients')
        .select('*, users!clients_user_id_fkey(full_name, email, last_login)')
        .eq('assigned_pt_id', ptData.id)

      setClients((data ?? []).map((c: Record<string, unknown>) => {
        const u = c.users as Record<string, unknown> | null
        return {
          ...c,
          full_name: (u?.full_name as string) ?? 'Unknown',
          email: (u?.email as string) ?? '',
          last_login: (u?.last_login as string) ?? null,
        } as Client
      }))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'at_risk' && c.at_risk)
    return matchSearch && matchFilter
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#e8ecf4', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>My Clients</h1>
          <p style={{ color: '#9099b2', fontSize: '0.88rem', margin: '4px 0 0' }}>{clients.length} clients assigned</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', background: '#181c27', border: '1px solid #2a3048',
            borderRadius: '8px', padding: '10px 14px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
          }}
        />
        {(['all', 'at_risk'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            background: filter === f ? (f === 'at_risk' ? '#f43f5e22' : '#4ade8022') : '#181c27',
            border: `1px solid ${filter === f ? (f === 'at_risk' ? '#f43f5e44' : '#4ade8044') : '#2a3048'}`,
            color: filter === f ? (f === 'at_risk' ? '#f43f5e' : '#4ade80') : '#9099b2',
          }}>
            {f === 'all' ? 'All Clients' : 'At Risk'}
          </button>
        ))}
      </div>

      {/* Client Grid */}
      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState message={search || filter !== 'all' ? 'No clients match your filters.' : 'No clients assigned yet.'} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(c => (
            <ClientCard key={c.id} client={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      {/* Drawer */}
      {selected && (
        <ClientDrawer client={selected} ptUserId={ptUserId} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
