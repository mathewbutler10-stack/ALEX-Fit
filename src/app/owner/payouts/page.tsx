'use client'
import { useState } from 'react'

// TODO: replace with Supabase query
const MOCK_PTS = [
  { id: '1', name: 'Jake Morrison', clients: 8, sessions: 24, rate: 65, rateType: 'session' as const, paid: false },
  { id: '2', name: 'Mia Thompson', clients: 5, sessions: 16, rate: 55, rateType: 'session' as const, paid: false },
]

// TODO: replace with Supabase query
const MOCK_HISTORY = [
  { id: 'h1', date: '2026-02-28', ptName: 'Jake Morrison', amount: 1430, method: 'Bank Transfer', status: 'Paid' },
  { id: 'h2', date: '2026-02-28', ptName: 'Mia Thompson', amount: 770, method: 'Bank Transfer', status: 'Paid' },
  { id: 'h3', date: '2026-01-31', ptName: 'Jake Morrison', amount: 1300, method: 'Cash', status: 'Paid' },
  { id: 'h4', date: '2026-01-31', ptName: 'Mia Thompson', amount: 660, method: 'Bank Transfer', status: 'Paid' },
]

function owed(pt: typeof MOCK_PTS[0]) {
  return pt.rate * pt.sessions
}

export default function PayoutsPage() {
  const now = new Date()
  const monthYear = now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

  const [pts, setPts] = useState(MOCK_PTS)

  const totalOwed = pts.filter(p => !p.paid).reduce((s, p) => s + owed(p), 0)
  const totalPaid = pts.filter(p => p.paid).reduce((s, p) => s + owed(p), 0)
  const totalEarned = pts.reduce((s, p) => s + owed(p), 0)

  function markPaid(id: string) {
    setPts(prev => prev.map(p => p.id === id ? { ...p, paid: true } : p))
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>
          PT Payouts
        </h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>{monthYear}</p>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Earned', value: `$${totalEarned.toLocaleString()}`, color: '#4ade80' },
          { label: 'Paid Out', value: `$${totalPaid.toLocaleString()}`, color: '#22d3ee' },
          { label: 'Outstanding', value: `$${totalOwed.toLocaleString()}`, color: totalOwed > 0 ? '#f97316' : '#4ade80' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--surface, #181c27)',
            border: '1px solid var(--border, #2a3048)',
            borderRadius: '12px',
            padding: '20px',
            borderTop: `3px solid ${card.color}`,
          }}>
            <div style={{ color: 'var(--text2, #9099b2)', fontSize: '0.78rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{card.label}</div>
            <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* PT Payout List */}
      <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)', marginBottom: '16px', marginTop: 0 }}>
          This Month
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pts.map(pt => (
            <div key={pt.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px', background: 'var(--surface2, #1e2333)', borderRadius: '8px',
              flexWrap: 'wrap',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 700, color: '#0f1117',
              }}>
                {pt.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text, #e8ecf4)' }}>{pt.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text2, #9099b2)', marginTop: '3px' }}>
                  {pt.clients} clients · {pt.sessions} sessions · ${pt.rate}/{pt.rateType}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: pt.paid ? '#4ade80' : '#f97316' }}>
                  ${owed(pt).toLocaleString()}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3, #5a6380)' }}>owed</div>
              </div>
              <button
                onClick={() => !pt.paid && markPaid(pt.id)}
                disabled={pt.paid}
                style={{
                  padding: '8px 18px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
                  background: pt.paid ? '#4ade8022' : '#4ade80',
                  color: pt.paid ? '#4ade80' : '#0f1117',
                  border: pt.paid ? '1px solid #4ade8044' : 'none',
                  cursor: pt.paid ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {pt.paid ? '✓ Paid' : 'Mark Paid'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)', marginBottom: '16px', marginTop: 0 }}>
          Payment History
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr>
                {['Date', 'PT Name', 'Amount', 'Method', 'Status'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left', padding: '10px 12px',
                    color: 'var(--text2, #9099b2)', fontSize: '0.75rem',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border, #2a3048)',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map(h => (
                <tr key={h.id}>
                  <td style={{ padding: '12px', color: 'var(--text2, #9099b2)', borderBottom: '1px solid var(--border, #2a3048)' }}>
                    {new Date(h.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--text, #e8ecf4)', fontWeight: 500, borderBottom: '1px solid var(--border, #2a3048)' }}>{h.ptName}</td>
                  <td style={{ padding: '12px', color: '#4ade80', fontWeight: 700, borderBottom: '1px solid var(--border, #2a3048)' }}>${h.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px', color: 'var(--text2, #9099b2)', borderBottom: '1px solid var(--border, #2a3048)' }}>{h.method}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid var(--border, #2a3048)' }}>
                    <span style={{
                      background: h.status === 'Paid' ? '#4ade8022' : '#f9731622',
                      color: h.status === 'Paid' ? '#4ade80' : '#f97316',
                      border: `1px solid ${h.status === 'Paid' ? '#4ade8044' : '#f9731644'}`,
                      borderRadius: '4px', padding: '2px 8px',
                      fontSize: '0.72rem', fontWeight: 600,
                    }}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
