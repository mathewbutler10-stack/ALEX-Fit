'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface, #181c27)',
      border: '1px solid var(--border, #2a3048)',
      borderRadius: '12px',
      padding: '20px',
      borderTop: `3px solid ${color || '#4ade80'}`,
    }}>
      <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.8rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: 'var(--text, #e8ecf4)' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.8rem', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color: color,
    }}>{children}</span>
  )
}

interface AtRiskClient {
  id: string
  name: string
  reason: string
  lastLogin: string
}

interface NewSignup {
  id: string
  name: string
  email: string
  preferredSub: string
  date: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalClients: 0, activePts: 0, mrr: 0, atRiskCount: 0,
  })
  const [atRiskClients, setAtRiskClients] = useState<AtRiskClient[]>([])
  const [newSignups, setNewSignups] = useState<NewSignup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: clients } = await supabase
        .from('clients')
        .select('id, at_risk, last_login_at, user:users(full_name)')

      const { data: pts } = await supabase
        .from('pts')
        .select('id, status')
        .eq('status', 'active')

      const { data: signups } = await supabase
        .from('new_signups')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: subs } = await supabase
        .from('subscriptions')
        .select('id, plan:subscription_plans(monthly_price)')
        .eq('status', 'active')

      type ClientRow = {
        id: string
        at_risk?: boolean
        last_login_at?: string | null
        user?: { full_name?: string | null } | null
      }
      type SubRow = {
        id: string
        plan?: { monthly_price?: number } | null
      }
      type SignupRow = {
        id: string
        name: string
        email: string
        preferred_sub?: string | null
        signup_date?: string
      }

      const clientList: ClientRow[] = (clients || []) as ClientRow[]
      const atRisk = clientList.filter(c => c.at_risk)

      setStats({
        totalClients: clientList.length,
        activePts: (pts || []).length,
        mrr: ((subs || []) as SubRow[]).reduce((sum, s) => sum + (s.plan?.monthly_price || 0), 0),
        atRiskCount: atRisk.length,
      })

      setAtRiskClients(atRisk.slice(0, 5).map(c => ({
        id: c.id,
        name: c.user?.full_name || 'Unknown',
        reason: 'No login in 7+ days',
        lastLogin: c.last_login_at ? new Date(c.last_login_at).toLocaleDateString() : 'Never',
      })))

      setNewSignups(((signups || []) as SignupRow[]).slice(0, 5).map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        preferredSub: s.preferred_sub || 'Not specified',
        date: s.signup_date ? new Date(s.signup_date).toLocaleDateString() : '',
      })))

      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>
          FitLife Studio · {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        <KpiCard label="Total Clients" value={loading ? '—' : stats.totalClients.toString()} sub="Across all PTs" color="#4ade80" />
        <KpiCard label="Active PTs" value={loading ? '—' : stats.activePts.toString()} sub="FitLife Studio" color="#22d3ee" />
        <KpiCard label="Est. MRR" value={loading ? '—' : `$${stats.mrr.toLocaleString()}`} sub="Monthly recurring" color="#a78bfa" />
        <KpiCard label="At-Risk Clients" value={loading ? '—' : stats.atRiskCount.toString()} sub="Need attention" color="#f43f5e" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* At-risk clients */}
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>At-Risk Clients</h2>
            <Badge color="#f43f5e">{stats.atRiskCount} flagged</Badge>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : atRiskClients.length === 0 ? (
            <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>
              No at-risk clients right now
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {atRiskClients.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--surface2, #1e2333)', borderRadius: '8px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #e8ecf4)' }}>{c.name}</div>
                    <div style={{ color: '#f43f5e', fontSize: '0.78rem', marginTop: '2px' }}>{c.reason}</div>
                  </div>
                  <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.78rem' }}>Last: {c.lastLogin}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Sign-ups */}
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>New Sign-ups</h2>
            <a href="/owner/signups" style={{ color: 'var(--accent, #4ade80)', fontSize: '0.8rem', textDecoration: 'none' }}>View all →</a>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : newSignups.length === 0 ? (
            <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No pending sign-ups</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {newSignups.map(s => (
                <div key={s.id} style={{ padding: '12px', background: 'var(--surface2, #1e2333)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text, #e8ecf4)' }}>{s.name}</div>
                  <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.78rem', marginTop: '2px' }}>{s.email}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    <Badge color="#4ade80">{s.preferredSub}</Badge>
                    <span style={{ color: 'var(--text3, #5a6380)', fontSize: '0.75rem' }}>{s.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#22d3ee20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🏋️</div>
          <div>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions This Week</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: 'var(--text, #e8ecf4)' }}>{loading ? '—' : '—'}</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#a78bfa20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>💬</div>
          <div>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Messages Sent</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: 'var(--text, #e8ecf4)' }}>{loading ? '—' : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
