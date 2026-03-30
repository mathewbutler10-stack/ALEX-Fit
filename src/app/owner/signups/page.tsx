'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SignupStatus = 'pending' | 'converted' | 'all'
type SubType = 'virtual_pt' | 'pt_in_person' | 'nutrition_only'

interface Signup {
  id: string
  name: string
  email: string
  phone?: string | null
  preferred_sub?: SubType | null
  signup_date?: string | null
  assigned_pt_id?: string | null
  assigned_pt_name?: string | null
  status?: string | null
  notes?: string | null
}

interface PTOption {
  id: string
  full_name: string
}

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

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color,
    }}>{children}</span>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #4ade80, #f97316)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.72rem', fontWeight: 700, color: '#0f1117', flexShrink: 0,
    }}>{initials}</div>
  )
}

export default function SignupsPage() {
  const [signups, setSignups] = useState<Signup[]>([])
  const [pts, setPTs] = useState<PTOption[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<SignupStatus>('pending')
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function loadData() {
    const supabase = createClient()

    const signupQuery = supabase
      .from('new_signups')
      .select('id, name, email, phone, preferred_sub, signup_date, assigned_pt_id, status, notes')
      .order('signup_date', { ascending: false })

    if (statusFilter !== 'all') {
      signupQuery.eq('status', statusFilter)
    }

    const [{ data: signupsData }, { data: ptsData }] = await Promise.all([
      signupQuery,
      supabase.from('pts').select('id, user:users(full_name)').eq('status', 'active'),
    ])

    type RawSignup = {
      id: string
      name: string
      email: string
      phone?: string | null
      preferred_sub?: string | null
      signup_date?: string | null
      assigned_pt_id?: string | null
      status?: string | null
      notes?: string | null
    }
    type RawPT = {
      id: string
      user?: { full_name?: string | null } | null
    }

    const ptList: PTOption[] = ((ptsData || []) as RawPT[]).map(p => ({
      id: p.id,
      full_name: p.user?.full_name || 'Unknown PT',
    }))
    setPTs(ptList)

    const ptMap = Object.fromEntries(ptList.map(p => [p.id, p.full_name]))

    setSignups(((signupsData || []) as RawSignup[]).map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      preferred_sub: (s.preferred_sub as SubType | null) ?? null,
      signup_date: s.signup_date,
      assigned_pt_id: s.assigned_pt_id,
      assigned_pt_name: s.assigned_pt_id ? (ptMap[s.assigned_pt_id] ?? null) : null,
      status: s.status,
      notes: s.notes,
    })))
    setLoading(false)
  }

  useEffect(() => { loadData() }, [statusFilter])

  async function assignPT(signupId: string, ptId: string) {
    setAssigningId(signupId)
    const supabase = createClient()
    await supabase.from('new_signups').update({ assigned_pt_id: ptId || null }).eq('id', signupId)
    await loadData()
    setAssigningId(null)
    showToast('PT assigned successfully')
  }

  async function convertToClient(signup: Signup) {
    if (!signup.assigned_pt_id) {
      showToast('Please assign a PT before converting')
      return
    }
    setConvertingId(signup.id)
    const supabase = createClient()

    // Create user record
    const { data: newUser, error: userErr } = await supabase.from('users').insert({
      full_name: signup.name,
      email: signup.email,
      phone: signup.phone || null,
      role: 'client',
    }).select('id').single()

    if (userErr || !newUser) {
      setConvertingId(null)
      showToast(`Error: ${userErr?.message ?? 'Failed to create user'}`)
      return
    }

    // Create client record
    const { error: clientErr } = await supabase.from('clients').insert({
      user_id: newUser.id,
      pt_id: signup.assigned_pt_id,
      subscription_type: signup.preferred_sub || null,
      join_date: new Date().toISOString().slice(0, 10),
      at_risk: false,
    })

    if (clientErr) {
      setConvertingId(null)
      showToast(`Error: ${clientErr.message}`)
      return
    }

    // Update signup status
    await supabase.from('new_signups').update({ status: 'converted' }).eq('id', signup.id)

    setConvertingId(null)
    showToast(`${signup.name} converted to client!`)
    loadData()
  }

  const STATUS_FILTERS: { value: SignupStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'converted', label: 'Converted' },
  ]

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>New Sign-ups</h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Review and onboard incoming clients</p>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              border: statusFilter === f.value ? '1px solid #4ade80' : '1px solid var(--border, #2a3048)',
              background: statusFilter === f.value ? '#4ade8020' : 'var(--surface, #181c27)',
              color: statusFilter === f.value ? '#4ade80' : 'var(--text2, #9099b2)',
              transition: 'all 0.2s',
            }}
          >{f.label}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, #2a3048)' }}>
              {['Sign-up', 'Preferred Plan', 'Date', 'Assign PT', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>Loading sign-ups…</td></tr>
            ) : signups.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)' }}>
                {statusFilter === 'pending' ? 'No pending sign-ups' : `No ${statusFilter} sign-ups`}
              </td></tr>
            ) : signups.map(s => {
              const isConverted = s.status === 'converted'
              const subColor = s.preferred_sub ? SUB_COLORS[s.preferred_sub] : '#9099b2'
              const subLabel = s.preferred_sub ? SUB_LABELS[s.preferred_sub] : 'Not specified'
              const isConverting = convertingId === s.id
              const isAssigning = assigningId === s.id

              return (
                <tr
                  key={s.id}
                  style={{ borderBottom: '1px solid var(--border, #2a3048)', opacity: isConverted ? 0.65 : 1 }}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={s.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{s.name}</div>
                        <div style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>{s.email}</div>
                        {s.phone && <div style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>{s.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge color={subColor}>{subLabel}</Badge>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text3)', fontSize: '0.82rem' }}>
                    {s.signup_date ? new Date(s.signup_date).toLocaleDateString('en-AU') : '—'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isConverted ? (
                      <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>{s.assigned_pt_name || '—'}</span>
                    ) : (
                      <select
                        value={s.assigned_pt_id ?? ''}
                        onChange={e => assignPT(s.id, e.target.value)}
                        disabled={isAssigning}
                        style={{
                          background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: '6px',
                          color: s.assigned_pt_id ? 'var(--text)' : 'var(--text3)',
                          padding: '6px 10px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer',
                          width: '160px', opacity: isAssigning ? 0.6 : 1,
                        }}
                      >
                        <option value="">Select PT…</option>
                        {pts.map(pt => (
                          <option key={pt.id} value={pt.id}>{pt.full_name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <Badge color={isConverted ? '#9099b2' : '#fbbf24'}>
                      {isConverted ? 'Converted' : 'Pending'}
                    </Badge>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {!isConverted && (
                      <button
                        onClick={() => convertToClient(s)}
                        disabled={isConverting || !s.assigned_pt_id}
                        title={!s.assigned_pt_id ? 'Assign a PT first' : ''}
                        style={{
                          padding: '7px 14px', border: 'none', borderRadius: '7px',
                          background: !s.assigned_pt_id ? 'var(--surface3)' : '#4ade80',
                          color: !s.assigned_pt_id ? 'var(--text3)' : '#0f1117',
                          cursor: !s.assigned_pt_id || isConverting ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
                          opacity: isConverting ? 0.6 : 1, transition: 'all 0.2s',
                        }}
                      >{isConverting ? 'Converting…' : 'Convert to Client'}</button>
                    )}
                    {isConverted && (
                      <span style={{ color: 'var(--text3)', fontSize: '0.82rem' }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: '10px',
          padding: '12px 24px', color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600,
          zIndex: 300, animation: 'fadeUp 0.3s ease', boxShadow: 'var(--shadow)',
        }}>{toast}</div>
      )}
    </div>
  )
}
