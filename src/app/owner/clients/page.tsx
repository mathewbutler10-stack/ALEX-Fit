'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SubType = 'virtual_pt' | 'pt_in_person' | 'nutrition_only'

const SUB_COLORS: Record<SubType, string> = {
  virtual_pt: '#4ade80',
  pt_in_person: '#22d3ee',
  nutrition_only: '#f97316',
}

const SUB_LABELS: Record<SubType, string> = {
  virtual_pt: 'Virtual PT',
  pt_in_person: 'In-Person PT',
  nutrition_only: 'Nutrition Only',
}

interface Client {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string | null
  mobile?: string | null
  address?: string | null
  dob?: string | null
  preferred_contact?: string[] | null
  emergency_contact?: string | null
  subscription_type?: SubType | null
  pt_name?: string | null
  pt_id?: string | null
  at_risk?: boolean
  last_login_at?: string | null
  join_date?: string | null
  goals?: string | null
  context?: string | null
  motivation?: string | null
  calorie_goal?: number | null
  protein_goal?: number | null
  carbs_goal?: number | null
  fat_goal?: number | null
}

interface Appointment {
  id: string
  date: string
  time: string
  type: string
  notes?: string | null
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

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.75rem', fontWeight: 700, color: '#0f1117', flexShrink: 0,
    }}>{initials}</div>
  )
}

function inputStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'var(--surface3, #252b3b)',
    border: '1px solid var(--border, #2a3048)',
    borderRadius: '8px',
    color: 'var(--text, #e8ecf4)',
    padding: '10px 14px',
    fontSize: '0.88rem',
    width: '100%',
    outline: 'none',
    ...extra,
  }
}

function labelStyle(): React.CSSProperties {
  return { color: 'var(--text2, #9099b2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', display: 'block' }
}

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        background: '#4ade80', color: '#0f1117', border: 'none', borderRadius: '8px',
        padding: '10px 20px', fontSize: '0.88rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.6 : 1,
      }}
    >{saving ? 'Saving…' : 'Save Changes'}</button>
  )
}

function DrawerTabs({ tabs, active, onSelect }: { tabs: string[]; active: string; onSelect: (t: string) => void }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #2a3048)', marginBottom: '20px' }}>
      {tabs.map(t => (
        <button
          key={t}
          onClick={() => onSelect(t)}
          style={{
            padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: active === t ? 'var(--accent, #4ade80)' : 'var(--text2, #9099b2)',
            fontSize: '0.85rem', fontWeight: 600,
            borderBottom: active === t ? '2px solid #4ade80' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.2s',
          }}
        >{t}</button>
      ))}
    </div>
  )
}

interface NutritionDraft {
  calorie_goal: string
  protein_goal: string
  carbs_goal: string
  fat_goal: string
}

interface GoalsDraft {
  goals: string
  context: string
  motivation: string
}

function ClientDrawer({ client, onClose, onUpdate }: { client: Client; onClose: () => void; onUpdate: (c: Client) => void }) {
  const [tab, setTab] = useState('Overview')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [aptsLoading, setAptsLoading] = useState(false)
  const [nutrition, setNutrition] = useState<NutritionDraft>({
    calorie_goal: client.calorie_goal?.toString() ?? '',
    protein_goal: client.protein_goal?.toString() ?? '',
    carbs_goal: client.carbs_goal?.toString() ?? '',
    fat_goal: client.fat_goal?.toString() ?? '',
  })
  const [goals, setGoals] = useState<GoalsDraft>({
    goals: client.goals ?? '',
    context: client.context ?? '',
    motivation: client.motivation ?? '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (tab === 'Schedule') {
      setAptsLoading(true)
      const supabase = createClient()
      supabase
        .from('appointments')
        .select('id, date, time, type, notes')
        .eq('client_id', client.id)
        .order('date', { ascending: true })
        .then(({ data }) => {
          setAppointments((data || []) as Appointment[])
          setAptsLoading(false)
        })
    }
  }, [tab, client.id])

  async function saveNutrition() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('clients').update({
      calorie_goal: nutrition.calorie_goal ? parseInt(nutrition.calorie_goal) : null,
      protein_goal: nutrition.protein_goal ? parseInt(nutrition.protein_goal) : null,
      carbs_goal: nutrition.carbs_goal ? parseInt(nutrition.carbs_goal) : null,
      fat_goal: nutrition.fat_goal ? parseInt(nutrition.fat_goal) : null,
    }).eq('id', client.id)
    onUpdate({
      ...client,
      calorie_goal: nutrition.calorie_goal ? parseInt(nutrition.calorie_goal) : null,
      protein_goal: nutrition.protein_goal ? parseInt(nutrition.protein_goal) : null,
      carbs_goal: nutrition.carbs_goal ? parseInt(nutrition.carbs_goal) : null,
      fat_goal: nutrition.fat_goal ? parseInt(nutrition.fat_goal) : null,
    })
    setSaving(false)
  }

  async function saveGoals() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('clients').update({
      goals: goals.goals,
      context: goals.context,
      motivation: goals.motivation,
    }).eq('id', client.id)
    onUpdate({ ...client, goals: goals.goals, context: goals.context, motivation: goals.motivation })
    setSaving(false)
  }

  const subColor = client.subscription_type ? SUB_COLORS[client.subscription_type] : '#9099b2'
  const subLabel = client.subscription_type ? SUB_LABELS[client.subscription_type] : 'Unknown'

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px',
        background: 'var(--surface, #181c27)', borderLeft: '1px solid var(--border, #2a3048)',
        zIndex: 101, display: 'flex', flexDirection: 'column',
        animation: 'slideLeft 0.3s ease', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border, #2a3048)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Avatar name={client.full_name} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>{client.full_name}</div>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.82rem', marginTop: '2px' }}>{client.email}</div>
          </div>
          {client.at_risk && <Badge color="#f43f5e">At-Risk</Badge>}
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text3, #5a6380)', cursor: 'pointer', fontSize: '1.3rem', padding: '4px' }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>
          <DrawerTabs tabs={['Overview', 'Contact', 'Schedule', 'Nutrition', 'Goals']} active={tab} onSelect={setTab} />

          {tab === 'Overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={labelStyle()}>Subscription</div>
                  <Badge color={subColor}>{subLabel}</Badge>
                </div>
                <div>
                  <div style={labelStyle()}>Assigned PT</div>
                  <div style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.88rem' }}>{client.pt_name || '—'}</div>
                </div>
                <div>
                  <div style={labelStyle()}>Join Date</div>
                  <div style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.88rem' }}>
                    {client.join_date ? new Date(client.join_date).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div>
                  <div style={labelStyle()}>At-Risk Status</div>
                  <Badge color={client.at_risk ? '#f43f5e' : '#4ade80'}>{client.at_risk ? 'At Risk' : 'Healthy'}</Badge>
                </div>
              </div>
              {client.goals && (
                <div>
                  <div style={labelStyle()}>Goals</div>
                  <div style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.88rem', lineHeight: 1.6 }}>{client.goals}</div>
                </div>
              )}
            </div>
          )}

          {tab === 'Contact' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Phone', value: client.phone },
                { label: 'Mobile', value: client.mobile },
                { label: 'Address', value: client.address },
                { label: 'Date of Birth', value: client.dob ? new Date(client.dob).toLocaleDateString() : null },
                { label: 'Emergency Contact', value: client.emergency_contact },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={labelStyle()}>{label}</div>
                  <div style={{ color: value ? 'var(--text, #e8ecf4)' : 'var(--text3, #5a6380)', fontSize: '0.88rem' }}>{value || 'Not provided'}</div>
                </div>
              ))}
              {client.preferred_contact && client.preferred_contact.length > 0 && (
                <div>
                  <div style={labelStyle()}>Preferred Contact</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {client.preferred_contact.map(c => (
                      <Badge key={c} color="#22d3ee">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Schedule' && (
            <div>
              {aptsLoading ? (
                <div style={{ color: 'var(--text3, #5a6380)', textAlign: 'center', padding: '20px 0' }}>Loading…</div>
              ) : appointments.length === 0 ? (
                <div style={{ color: 'var(--text3, #5a6380)', textAlign: 'center', padding: '20px 0' }}>No upcoming appointments</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointments.map(apt => (
                    <div key={apt.id} style={{ padding: '14px', background: 'var(--surface2, #1e2333)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #e8ecf4)' }}>{apt.type}</div>
                        <Badge color="#22d3ee">{new Date(apt.date).toLocaleDateString()}</Badge>
                      </div>
                      <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.82rem', marginTop: '4px' }}>{apt.time}</div>
                      {apt.notes && <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.8rem', marginTop: '6px' }}>{apt.notes}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'Nutrition' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {([
                { key: 'calorie_goal', label: 'Daily Calorie Goal (kcal)' },
                { key: 'protein_goal', label: 'Protein Goal (g)' },
                { key: 'carbs_goal', label: 'Carbs Goal (g)' },
                { key: 'fat_goal', label: 'Fat Goal (g)' },
              ] as { key: keyof NutritionDraft; label: string }[]).map(({ key, label }) => (
                <div key={key}>
                  <label style={labelStyle()}>{label}</label>
                  <input
                    type="number"
                    value={nutrition[key]}
                    onChange={e => setNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                    style={inputStyle()}
                    placeholder="—"
                  />
                </div>
              ))}
              <SaveBtn onClick={saveNutrition} saving={saving} />
            </div>
          )}

          {tab === 'Goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle()}>Goals</label>
                <textarea
                  value={goals.goals}
                  onChange={e => setGoals(prev => ({ ...prev, goals: e.target.value }))}
                  rows={3}
                  style={inputStyle({ resize: 'vertical' })}
                  placeholder="Client's fitness goals…"
                />
              </div>
              <div>
                <label style={labelStyle()}>Context</label>
                <textarea
                  value={goals.context}
                  onChange={e => setGoals(prev => ({ ...prev, context: e.target.value }))}
                  rows={3}
                  style={inputStyle({ resize: 'vertical' })}
                  placeholder="Background context…"
                />
              </div>
              <div>
                <label style={labelStyle()}>Motivation</label>
                <textarea
                  value={goals.motivation}
                  onChange={e => setGoals(prev => ({ ...prev, motivation: e.target.value }))}
                  rows={3}
                  style={inputStyle({ resize: 'vertical' })}
                  placeholder="What motivates this client…"
                />
              </div>
              <SaveBtn onClick={saveGoals} saving={saving} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subFilter, setSubFilter] = useState<'all' | SubType>('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('clients')
        .select(`
          id, user_id, at_risk, last_login_at, join_date,
          goals, context, motivation,
          calorie_goal, protein_goal, carbs_goal, fat_goal,
          subscription_type, pt_id,
          user:users(full_name, email, phone, mobile, address, dob, preferred_contact, emergency_contact),
          pt:pts(user:users(full_name))
        `)
        .order('join_date', { ascending: false })

      type RawClient = {
        id: string
        user_id: string
        at_risk?: boolean
        last_login_at?: string | null
        join_date?: string | null
        goals?: string | null
        context?: string | null
        motivation?: string | null
        calorie_goal?: number | null
        protein_goal?: number | null
        carbs_goal?: number | null
        fat_goal?: number | null
        subscription_type?: string | null
        pt_id?: string | null
        user?: { full_name?: string | null; email?: string | null; phone?: string | null; mobile?: string | null; address?: string | null; dob?: string | null; preferred_contact?: string[] | null; emergency_contact?: string | null } | null
        pt?: { user?: { full_name?: string | null } | null } | null
      }

      setClients(((data || []) as RawClient[]).map(c => ({
        id: c.id,
        user_id: c.user_id,
        full_name: c.user?.full_name || 'Unknown',
        email: c.user?.email || '',
        phone: c.user?.phone,
        mobile: c.user?.mobile,
        address: c.user?.address,
        dob: c.user?.dob,
        preferred_contact: c.user?.preferred_contact,
        emergency_contact: c.user?.emergency_contact,
        subscription_type: (c.subscription_type as SubType | null) ?? null,
        pt_name: c.pt?.user?.full_name ?? null,
        pt_id: c.pt_id,
        at_risk: c.at_risk,
        last_login_at: c.last_login_at,
        join_date: c.join_date,
        goals: c.goals,
        context: c.context,
        motivation: c.motivation,
        calorie_goal: c.calorie_goal,
        protein_goal: c.protein_goal,
        carbs_goal: c.carbs_goal,
        fat_goal: c.fat_goal,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const filtered = clients.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
    const matchSub = subFilter === 'all' || c.subscription_type === subFilter
    return matchSearch && matchSub
  })

  function handleUpdate(updated: Client) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelectedClient(updated)
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>Clients</h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>{clients.length} total clients</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search clients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
            borderRadius: '8px', color: 'var(--text, #e8ecf4)', padding: '10px 14px',
            fontSize: '0.88rem', width: '260px', outline: 'none',
          }}
        />
        {(['all', 'virtual_pt', 'pt_in_person', 'nutrition_only'] as const).map(val => (
          <button
            key={val}
            onClick={() => setSubFilter(val)}
            style={{
              padding: '10px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              border: subFilter === val ? '1px solid #4ade80' : '1px solid var(--border, #2a3048)',
              background: subFilter === val ? '#4ade8020' : 'var(--surface, #181c27)',
              color: subFilter === val ? '#4ade80' : 'var(--text2, #9099b2)',
              transition: 'all 0.2s',
            }}
          >
            {val === 'all' ? 'All' : SUB_LABELS[val]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, #2a3048)' }}>
              {['Client', 'Subscription', 'PT', 'Status', 'Last Login'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text3, #5a6380)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3, #5a6380)' }}>Loading clients…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3, #5a6380)' }}>No clients found</td></tr>
            ) : filtered.map(c => (
              <tr
                key={c.id}
                onClick={() => setSelectedClient(c)}
                style={{ borderBottom: '1px solid var(--border, #2a3048)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2, #1e2333)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Avatar name={c.full_name} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #e8ecf4)' }}>{c.full_name}</div>
                      <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.78rem' }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {c.subscription_type ? (
                    <Badge color={SUB_COLORS[c.subscription_type]}>{SUB_LABELS[c.subscription_type]}</Badge>
                  ) : <span style={{ color: 'var(--text3, #5a6380)', fontSize: '0.82rem' }}>—</span>}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text2, #9099b2)', fontSize: '0.88rem' }}>{c.pt_name || '—'}</td>
                <td style={{ padding: '14px 16px' }}>
                  {c.at_risk ? <Badge color="#f43f5e">At Risk</Badge> : <Badge color="#4ade80">Active</Badge>}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--text3, #5a6380)', fontSize: '0.82rem' }}>
                  {c.last_login_at ? new Date(c.last_login_at).toLocaleDateString() : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedClient && (
        <ClientDrawer
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
