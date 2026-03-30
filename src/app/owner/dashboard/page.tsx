'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  const [leadStats, setLeadStats] = useState({ newThisWeek: 0, conversionRate: 0 })
  const [leadFunnel, setLeadFunnel] = useState({ new: 0, contacted: 0, trial: 0, converted: 0 })
  const [topPts, setTopPts] = useState<{ name: string; clientCount: number }[]>([])
  const [retentionPct, setRetentionPct] = useState<number | null>(null)
  const [atRiskClients, setAtRiskClients] = useState<AtRiskClient[]>([])
  const [newSignups, setNewSignups] = useState<NewSignup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const { data: clients } = await supabase
        .from('clients')
        .select('id, at_risk, last_login_at, assigned_pt_id, user:users(full_name)')

      const { data: pts } = await supabase
        .from('pts')
        .select('id, user_id, status, user:users(full_name)')
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

      // Leads stats
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const { data: allLeads } = await supabase.from('leads').select('status, created_at')
      const leadsArr = (allLeads || []) as { status: string; created_at: string }[]
      const newThisWeek = leadsArr.filter(l => l.created_at >= weekAgo).length
      const total = leadsArr.length
      const converted = leadsArr.filter(l => l.status === 'converted').length
      setLeadStats({ newThisWeek, conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0 })

      // Lead funnel counts
      setLeadFunnel({
        new: leadsArr.filter(l => l.status === 'new').length,
        contacted: leadsArr.filter(l => l.status === 'contacted').length,
        trial: leadsArr.filter(l => l.status === 'trial_booked').length,
        converted,
      })

      type ClientRow = {
        id: string
        at_risk?: boolean
        last_login_at?: string | null
        assigned_pt_id?: string | null
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

      // Top PTs by client count
      type PtWithName = { id: string; user_id: string; name: string }
      const ptList: PtWithName[] = ((pts || []) as { id: string; user_id: string; user?: { full_name?: string | null } | null }[]).map(p => ({
        id: p.id,
        user_id: p.user_id,
        name: p.user?.full_name || 'PT',
      }))
      const ptClientCounts = ptList.map(pt => ({
        name: pt.name,
        clientCount: clientList.filter(c => c.assigned_pt_id === pt.id).length,
      })).sort((a, b) => b.clientCount - a.clientCount).slice(0, 3)
      setTopPts(ptClientCounts)

      // Retention: clients with at_risk = false (proxy for active)
      const activeClients = clientList.filter(c => !c.at_risk).length
      setRetentionPct(clientList.length > 0 ? Math.round((activeClients / clientList.length) * 100) : null)

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

      {/* Leads Widget */}
      <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px', marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>Leads Pipeline</h2>
          <Link href="/owner/leads" style={{ color: 'var(--accent, #4ade80)', fontSize: '0.8rem', textDecoration: 'none' }}>View board →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ background: 'var(--surface2, #1e2333)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>New This Week</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: '#4ade80' }}>
              {loading ? '—' : leadStats.newThisWeek}
            </div>
          </div>
          <div style={{ background: 'var(--surface2, #1e2333)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Conversion Rate</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: '#22d3ee' }}>
              {loading ? '—' : `${leadStats.conversionRate}%`}
            </div>
          </div>
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

      {/* ── Analytics Widgets ── */}
      <div style={{ marginTop: '32px', marginBottom: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>Analytics</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Leads Funnel */}
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text, #e8ecf4)', marginBottom: '16px' }}>Leads Funnel</div>
          {loading ? (
            <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'New', count: leadFunnel.new, color: '#4ade80' },
                { label: 'Contacted', count: leadFunnel.contacted, color: '#22d3ee' },
                { label: 'Trial Booked', count: leadFunnel.trial, color: '#a78bfa' },
                { label: 'Converted', count: leadFunnel.converted, color: '#f97316' },
              ].map(({ label, count, color }) => {
                const funnelTotal = leadFunnel.new + leadFunnel.contacted + leadFunnel.trial + leadFunnel.converted
                const pct = funnelTotal > 0 ? (count / funnelTotal) * 100 : 0
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text2, #9099b2)' }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text, #e8ecf4)' }}>{count}</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '999px', background: 'var(--surface2, #1e2333)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: Top PTs + Revenue + Retention */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Top PTs */}
          <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text, #e8ecf4)', marginBottom: '14px' }}>Top PTs by Clients</div>
            {loading ? (
              <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>Loading…</div>
            ) : topPts.length === 0 ? (
              <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.85rem' }}>No PTs assigned yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topPts.map((pt, i) => (
                  <div key={pt.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px', height: '22px', borderRadius: '50%',
                      background: ['#4ade80', '#22d3ee', '#a78bfa'][i] + '30',
                      color: ['#4ade80', '#22d3ee', '#a78bfa'][i],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                    }}>{i + 1}</span>
                    <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text, #e8ecf4)', fontWeight: 500 }}>{pt.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text2, #9099b2)' }}>{pt.clientCount} clients</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue this month */}
          <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Revenue This Month</div>
              <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text, #e8ecf4)' }}>$0</div>
              <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.75rem', marginTop: '2px' }}>Connect Stripe to see revenue</div>
            </div>
            <div style={{ fontSize: '1.8rem' }}>💳</div>
          </div>

          {/* Client retention */}
          <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Client Retention</div>
              <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.6rem', fontWeight: 800, color: '#4ade80' }}>
                {loading ? '—' : retentionPct !== null ? `${retentionPct}%` : 'N/A'}
              </div>
              <div style={{ color: 'var(--text3, #5a6380)', fontSize: '0.75rem', marginTop: '2px' }}>Active clients this month</div>
            </div>
            <div style={{ fontSize: '1.8rem' }}>📈</div>
          </div>
        </div>
      </div>
    </div>
  )
}
