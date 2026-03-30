'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const PLANS: Record<string, { name: string; price: number; color: string; features: string[] }> = {
  starter: {
    name: 'Starter',
    price: 99,
    color: '#4ade80',
    features: ['1 PT account', '20 client accounts', 'Lead capture', 'Basic dashboard', 'Email support'],
  },
  growth: {
    name: 'Growth',
    price: 199,
    color: '#22d3ee',
    features: ['5 PT accounts', '100 client accounts', 'Lead capture + Kanban', 'Analytics dashboard', 'Priority support', 'Broadcast messaging'],
  },
  pro: {
    name: 'Pro',
    price: 399,
    color: '#a78bfa',
    features: ['Unlimited PTs', 'Unlimited clients', 'White-label portal', 'All features', 'Dedicated support', 'Custom integrations'],
  },
}

function CheckoutContent() {
  const params = useSearchParams()
  const planKey = params.get('plan') || 'growth'
  const plan = PLANS[planKey] ?? PLANS.growth

  return (
    <div style={{ animation: 'fadeUp 0.4s ease', maxWidth: '520px', margin: '0 auto', paddingTop: '32px' }}>
      {/* Back */}
      <Link
        href="/owner/billing"
        style={{ color: 'var(--text3)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '28px' }}
      >
        ← Back to Billing
      </Link>

      {/* Card */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid ${plan.color}44`,
        borderTop: `3px solid ${plan.color}`,
        borderRadius: '14px',
        padding: '32px',
      }}>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Subscribing to
        </div>
        <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: plan.color, marginBottom: '4px' }}>
          {plan.name}
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '1rem', marginBottom: '28px' }}>
          <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-syne, Syne, sans-serif)', color: 'var(--text)' }}>${plan.price}</span>
          <span style={{ color: 'var(--text3)' }}> / month</span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '24px' }} />

        {/* What's included */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
            What&apos;s included
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plan.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'var(--text2)' }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: `${plan.color}22`, color: plan.color,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: '24px' }} />

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem' }}>{plan.name} plan</div>
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: '2px' }}>Billed monthly · Cancel anytime</div>
          </div>
          <div style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>
            ${plan.price}/mo
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => alert('Stripe Checkout integration coming soon.')}
          style={{
            width: '100%', padding: '14px',
            background: 'var(--accent)', color: '#000',
            border: 'none', borderRadius: '10px',
            fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            fontFamily: 'var(--font-syne, Syne, sans-serif)',
          }}
        >
          Proceed to Payment →
        </button>

        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', textAlign: 'center', marginTop: '12px' }}>
          Secured by Stripe · No card stored on our servers
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text3)', padding: '40px', textAlign: 'center' }}>Loading…</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
