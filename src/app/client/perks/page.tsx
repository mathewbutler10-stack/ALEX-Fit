'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Perk {
  id: string
  partner_name: string
  category: string | null
  description: string | null
  discount_code: string | null
  price: string | null
}

export default function PerksPage() {
  const [perks, setPerks] = useState<Perk[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<Perk | null>(null)
  const [redeemed, setRedeemed] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: clientData }, { data: perksData }] = await Promise.all([
        supabase
          .from('clients')
          .select('gym_id')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('perks')
          .select('id, partner_name, category, description, discount_code, price')
          .eq('active', true)
          .order('partner_name'),
      ])

      type ClientRow = { gym_id?: string }
      const gymId = (clientData as ClientRow | null)?.gym_id
      if (gymId) {
        const { data: filtered } = await supabase
          .from('perks')
          .select('id, partner_name, category, description, discount_code, price')
          .eq('gym_id', gymId)
          .eq('active', true)
          .order('partner_name')
        setPerks((filtered || []) as Perk[])
      } else {
        setPerks((perksData || []) as Perk[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const categoryColor = (cat: string | null) => {
    const map: Record<string, string> = {
      nutrition: 'var(--accent)',
      fitness: 'var(--accent2)',
      wellness: '#a78bfa',
      retail: 'var(--accent3)',
    }
    return map[cat?.toLowerCase() || ''] || 'var(--text3)'
  }

  function handleRedeem(perk: Perk) {
    setRedeemed(prev => [...prev, perk.id])
    setConfirming(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Rewards</h1>

      {/* Points balance */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface), var(--surface2))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your Points</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1.1 }}>
            {points.toLocaleString()}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '2px' }}>available to redeem</div>
        </div>
        <div style={{ fontSize: '2.5rem' }}>⭐</div>
      </div>

      {/* Perks grid */}
      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>Loading perks…</div>
      ) : perks.length === 0 ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0', fontSize: '0.88rem' }}>
          No perks available yet
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {perks.map(perk => {
            const isRedeemed = redeemed.includes(perk.id)
            const color = categoryColor(perk.category)
            return (
              <div key={perk.id} style={{
                background: 'var(--surface)',
                border: `1px solid ${isRedeemed ? 'var(--border)' : color + '40'}`,
                borderRadius: 'var(--radius)',
                padding: '14px',
                opacity: isRedeemed ? 0.6 : 1,
                display: 'flex', flexDirection: 'column', gap: '8px',
              }}>
                {perk.category && (
                  <span style={{
                    alignSelf: 'flex-start',
                    padding: '2px 8px', borderRadius: '999px',
                    fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: `${color}20`, color,
                  }}>
                    {perk.category}
                  </span>
                )}
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{perk.partner_name}</div>
                {perk.description && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text2)', lineHeight: 1.4 }}>{perk.description}</div>
                )}
                {perk.price && (
                  <div style={{ fontSize: '0.8rem', color: color, fontWeight: 600 }}>{perk.price}</div>
                )}
                <button
                  onClick={() => !isRedeemed && setConfirming(perk)}
                  disabled={isRedeemed}
                  style={{
                    background: isRedeemed ? 'var(--surface2)' : 'var(--accent)',
                    color: isRedeemed ? 'var(--text3)' : '#000',
                    border: 'none', borderRadius: 'var(--radius-sm)',
                    padding: '8px', fontWeight: 600, fontSize: '0.78rem',
                    cursor: isRedeemed ? 'not-allowed' : 'pointer',
                    marginTop: 'auto',
                  }}
                >
                  {isRedeemed ? 'Redeemed' : 'Redeem'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirming && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          zIndex: 100, padding: '0 0 env(safe-area-inset-bottom)',
        }}
          onClick={() => setConfirming(null)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius) var(--radius) 0 0',
              border: '1px solid var(--border)',
              padding: '24px 20px',
              width: '100%', maxWidth: '480px',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, marginBottom: '8px' }}>Redeem Perk</h2>
            <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Redeem <strong style={{ color: 'var(--text)' }}>{confirming.partner_name}</strong>?
              {confirming.discount_code && (
                <><br /><span style={{ color: 'var(--accent)', fontWeight: 600, marginTop: '8px', display: 'block' }}>Code: {confirming.discount_code}</span></>
              )}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setConfirming(null)}
                style={{
                  flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '12px',
                  color: 'var(--text2)', cursor: 'pointer', fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleRedeem(confirming)}
                style={{
                  flex: 1, background: 'var(--accent)', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '12px',
                  color: '#000', fontWeight: 700, cursor: 'pointer',
                }}
              >
                Confirm Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
