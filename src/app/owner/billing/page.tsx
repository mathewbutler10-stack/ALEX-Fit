'use client'
import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 99,
    features: ['1 PT account', '20 client accounts', 'Lead capture', 'Basic dashboard', 'Email support'],
    color: '#4ade80',
  },
  {
    key: 'growth',
    name: 'Growth',
    price: 199,
    features: ['5 PT accounts', '100 client accounts', 'Lead capture + Kanban', 'Analytics dashboard', 'Priority support', 'Broadcast messaging'],
    color: '#22d3ee',
    popular: true,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 399,
    features: ['Unlimited PTs', 'Unlimited clients', 'White-label portal', 'All features', 'Dedicated support', 'Custom integrations'],
    color: '#a78bfa',
  },
]

const MOCK_HISTORY = [
  { date: 'Mar 1, 2026', amount: '$199.00', status: 'Paid', invoice: '#INV-2026-03' },
  { date: 'Feb 1, 2026', amount: '$199.00', status: 'Paid', invoice: '#INV-2026-02' },
  { date: 'Jan 1, 2026', amount: '$199.00', status: 'Paid', invoice: '#INV-2026-01' },
  { date: 'Dec 1, 2025', amount: '$99.00', status: 'Paid', invoice: '#INV-2025-12' },
]

export default function BillingPage() {
  const [currentPlan] = useState('growth')
  const [showCancelModal, setShowCancelModal] = useState(false)

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', maxWidth: '960px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
          Billing & Subscription
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Manage your APEX plan and payment details</p>
      </div>

      {/* Current plan banner */}
      <div style={{
        background: 'linear-gradient(135deg, #22d3ee18, #4ade8012)',
        border: '1px solid #22d3ee44',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Current Plan</div>
          <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.4rem', fontWeight: 800, color: '#22d3ee' }}>Growth — $199/mo</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '4px' }}>Next billing date: April 1, 2026</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href="/owner/billing/checkout?plan=pro"
            style={{
              background: 'var(--accent)', color: '#000', padding: '10px 20px',
              borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            Upgrade to Pro
          </a>
          <button
            onClick={() => setShowCancelModal(true)}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text3)', padding: '10px 16px',
              borderRadius: '8px', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Cancel plan
          </button>
        </div>
      </div>

      {/* Pricing tiers */}
      <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
        All Plans
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {PLANS.map(plan => {
          const isActive = plan.key === currentPlan
          return (
            <div
              key={plan.key}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isActive ? plan.color : 'var(--border)'}`,
                borderTop: `3px solid ${plan.color}`,
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
              }}
            >
              {plan.popular && !isActive && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: '#22d3ee', color: '#000', fontSize: '0.65rem', fontWeight: 700,
                  padding: '3px 12px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Most Popular
                </div>
              )}
              {isActive && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                  background: plan.color, color: '#000', fontSize: '0.65rem', fontWeight: 700,
                  padding: '3px 12px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  Current Plan
                </div>
              )}

              <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: plan.color }}>${plan.price}</span>
                <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>/mo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text2)' }}>
                    <span style={{ color: plan.color, fontWeight: 700 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>

              {isActive ? (
                <div style={{
                  textAlign: 'center', padding: '10px', borderRadius: '8px',
                  background: `${plan.color}18`, color: plan.color, fontWeight: 600, fontSize: '0.85rem',
                }}>
                  Active Plan
                </div>
              ) : (
                <Link
                  href={`/owner/billing/checkout?plan=${plan.key}`}
                  style={{
                    display: 'block', textAlign: 'center', padding: '10px',
                    borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem',
                    textDecoration: 'none',
                    background: plan.key === 'pro' ? 'var(--accent)' : 'var(--surface2)',
                    color: plan.key === 'pro' ? '#000' : 'var(--text2)',
                    border: plan.key !== 'pro' ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {plan.key === 'starter' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Billing history */}
      <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
        Billing History
      </h2>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Date', 'Amount', 'Status', 'Invoice'].map(h => (
                <th key={h} style={{
                  padding: '12px 20px', textAlign: 'left',
                  fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text3)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_HISTORY.map((row, i) => (
              <tr key={i} style={{ borderBottom: i < MOCK_HISTORY.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <td style={{ padding: '14px 20px', fontSize: '0.88rem', color: 'var(--text2)' }}>{row.date}</td>
                <td style={{ padding: '14px 20px', fontSize: '0.88rem', color: 'var(--text)', fontWeight: 600 }}>{row.amount}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    background: '#4ade8022', color: '#4ade80',
                    padding: '2px 10px', borderRadius: '999px',
                    fontSize: '0.72rem', fontWeight: 600,
                  }}>{row.status}</span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--accent)' }}>
                  <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>{row.invoice} ↓</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99 }}
            onClick={() => setShowCancelModal(false)}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 100, width: '420px', maxWidth: 'calc(100vw - 32px)',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '14px', padding: '28px',
          }}>
            <h2 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '12px' }}>
              Cancel Subscription?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Your plan will remain active until April 1, 2026. After that, your gym&apos;s access will be restricted to the free tier.
              All data will be retained for 30 days.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '11px', background: 'var(--accent)',
                  color: '#000', border: 'none', borderRadius: '8px',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Keep My Plan
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '11px', background: 'transparent',
                  color: '#f43f5e', border: '1px solid #f43f5e44',
                  borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
