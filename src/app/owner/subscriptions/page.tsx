'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SubTab = 'Plans' | 'Discount Codes' | 'Offers'

interface Plan {
  id: string
  name: string
  description?: string | null
  monthly_price?: number | null
  quarterly_price?: number | null
  annual_price?: number | null
  setup_fee?: number | null
  features?: string[] | null
  color?: string | null
  active?: boolean
}

interface DiscountCode {
  id: string
  code: string
  description?: string | null
  discount_type?: string | null
  discount_value?: number | null
  frequency?: string | null
  applies_to?: string[] | null
  max_uses?: number | null
  uses_count?: number | null
  expires_at?: string | null
  active?: boolean
}

interface PlanFormData {
  name: string
  description: string
  monthly_price: string
  quarterly_price: string
  annual_price: string
  setup_fee: string
  features: string
  color: string
  active: boolean
}

interface CodeFormData {
  code: string
  description: string
  discount_type: string
  discount_value: string
  frequency: string
  applies_to: string
  max_uses: string
  expires_at: string
  active: boolean
}

const PLAN_COLORS = ['#4ade80', '#22d3ee', '#f97316', '#a78bfa']

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color,
    }}>{children}</span>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    background: 'var(--surface3, #252b3b)', border: '1px solid var(--border, #2a3048)',
    borderRadius: '8px', color: 'var(--text, #e8ecf4)', padding: '10px 14px',
    fontSize: '0.88rem', width: '100%', outline: 'none',
  }
}

function labelStyle(): React.CSSProperties {
  return { color: 'var(--text2, #9099b2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', display: 'block' }
}

function PlanModal({ plan, onClose, onSave }: { plan?: Plan; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<PlanFormData>(plan ? {
    name: plan.name,
    description: plan.description ?? '',
    monthly_price: plan.monthly_price?.toString() ?? '',
    quarterly_price: plan.quarterly_price?.toString() ?? '',
    annual_price: plan.annual_price?.toString() ?? '',
    setup_fee: plan.setup_fee?.toString() ?? '',
    features: (plan.features ?? []).join('\n'),
    color: plan.color ?? '#4ade80',
    active: plan.active ?? true,
  } : { name: '', description: '', monthly_price: '', quarterly_price: '', annual_price: '', setup_fee: '', features: '', color: '#4ade80', active: true })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof PlanFormData>(key: K, val: PlanFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name,
      description: form.description || null,
      monthly_price: form.monthly_price ? parseFloat(form.monthly_price) : null,
      quarterly_price: form.quarterly_price ? parseFloat(form.quarterly_price) : null,
      annual_price: form.annual_price ? parseFloat(form.annual_price) : null,
      setup_fee: form.setup_fee ? parseFloat(form.setup_fee) : null,
      features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
      color: form.color,
      active: form.active,
    }
    if (plan) {
      await supabase.from('subscription_plans').update(payload).eq('id', plan.id)
    } else {
      await supabase.from('subscription_plans').insert(payload)
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '500px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
        borderRadius: '16px', padding: '28px', zIndex: 201, animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #e8ecf4)' }}>{plan ? 'Edit Plan' : 'New Plan'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle()}>Plan Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle()} placeholder="Virtual PT" />
          </div>
          <div>
            <label style={labelStyle()}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ ...inputStyle(), resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {[
              { key: 'monthly_price' as const, label: 'Monthly ($)' },
              { key: 'quarterly_price' as const, label: 'Quarterly ($)' },
              { key: 'annual_price' as const, label: 'Annual ($)' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label style={labelStyle()}>{label}</label>
                <input type="number" value={form[key]} onChange={e => set(key, e.target.value)} style={inputStyle()} placeholder="0.00" min="0" step="0.01" />
              </div>
            ))}
          </div>
          <div>
            <label style={labelStyle()}>Setup Fee ($)</label>
            <input type="number" value={form.setup_fee} onChange={e => set('setup_fee', e.target.value)} style={inputStyle()} placeholder="0.00" min="0" step="0.01" />
          </div>
          <div>
            <label style={labelStyle()}>Features (one per line)</label>
            <textarea value={form.features} onChange={e => set('features', e.target.value)} rows={4} style={{ ...inputStyle(), resize: 'vertical' }} placeholder="Weekly check-in&#10;Nutrition plan&#10;App access" />
          </div>
          <div>
            <label style={labelStyle()}>Accent Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {PLAN_COLORS.map(c => (
                <button key={c} onClick={() => set('color', c)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer',
                }} />
              ))}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#4ade80', width: '16px', height: '16px' }} />
            <span style={{ color: 'var(--text, #e8ecf4)', fontSize: '0.88rem' }}>Plan Active</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#0f1117', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : plan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function CodeModal({ code, onClose, onSave }: { code?: DiscountCode; onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState<CodeFormData>(code ? {
    code: code.code,
    description: code.description ?? '',
    discount_type: code.discount_type ?? 'percent',
    discount_value: code.discount_value?.toString() ?? '',
    frequency: code.frequency ?? 'once',
    applies_to: (code.applies_to ?? []).join(', '),
    max_uses: code.max_uses?.toString() ?? '',
    expires_at: code.expires_at ? code.expires_at.slice(0, 10) : '',
    active: code.active ?? true,
  } : { code: '', description: '', discount_type: 'percent', discount_value: '', frequency: 'once', applies_to: '', max_uses: '', expires_at: '', active: true })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof CodeFormData>(key: K, val: CodeFormData[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit() {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      code: form.code.toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: form.discount_value ? parseFloat(form.discount_value) : null,
      frequency: form.frequency,
      applies_to: form.applies_to.split(',').map(s => s.trim()).filter(Boolean),
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at || null,
      active: form.active,
    }
    if (code) {
      await supabase.from('discount_codes').update(payload).eq('id', code.id)
    } else {
      await supabase.from('discount_codes').insert(payload)
    }
    setSaving(false)
    onSave()
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, animation: 'fadeIn 0.2s ease' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '480px', maxHeight: '90vh', overflowY: 'auto',
        background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
        borderRadius: '16px', padding: '28px', zIndex: 201, animation: 'scaleIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{code ? 'Edit Code' : 'Create Discount Code'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle()}>Code</label>
            <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} style={{ ...inputStyle(), fontFamily: 'monospace', letterSpacing: '0.1em' }} placeholder="SAVE20" />
          </div>
          <div>
            <label style={labelStyle()}>Description</label>
            <input value={form.description} onChange={e => set('description', e.target.value)} style={inputStyle()} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={labelStyle()}>Discount Type</label>
              <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} style={inputStyle()}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed ($)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Value</label>
              <input type="number" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} style={inputStyle()} placeholder="20" min="0" />
            </div>
            <div>
              <label style={labelStyle()}>Frequency</label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} style={inputStyle()}>
                <option value="once">Once</option>
                <option value="monthly">Monthly</option>
                <option value="forever">Forever</option>
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Max Uses</label>
              <input type="number" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} style={inputStyle()} placeholder="Unlimited" min="0" />
            </div>
          </div>
          <div>
            <label style={labelStyle()}>Applies To (comma-separated plans)</label>
            <input value={form.applies_to} onChange={e => set('applies_to', e.target.value)} style={inputStyle()} placeholder="virtual_pt, pt_in_person" />
          </div>
          <div>
            <label style={labelStyle()}>Expires At</label>
            <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} style={inputStyle()} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: '#4ade80', width: '16px', height: '16px' }} />
            <span style={{ color: 'var(--text)', fontSize: '0.88rem' }}>Active</span>
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '11px', border: 'none', borderRadius: '8px', background: '#4ade80', color: '#0f1117', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.88rem', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : code ? 'Save Changes' : 'Create Code'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SubscriptionsPage() {
  const [tab, setTab] = useState<SubTab>('Plans')
  const [plans, setPlans] = useState<Plan[]>([])
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | undefined>(undefined)
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [editingCode, setEditingCode] = useState<DiscountCode | undefined>(undefined)

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const [{ data: plansData }, { data: codesData }] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('monthly_price', { ascending: true }),
      supabase.from('discount_codes').select('*').order('created_at', { ascending: false }),
    ])
    setPlans((plansData || []) as Plan[])
    setCodes((codesData || []) as DiscountCode[])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function deactivateCode(id: string) {
    const supabase = createClient()
    await supabase.from('discount_codes').update({ active: false }).eq('id', id)
    loadData()
  }

  const TABS: SubTab[] = ['Plans', 'Discount Codes', 'Offers']

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>Subscriptions</h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Manage plans, discounts and offers</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border, #2a3048)', marginBottom: '28px', gap: '4px' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? 'var(--accent, #4ade80)' : 'var(--text2, #9099b2)',
            fontSize: '0.9rem', fontWeight: 600,
            borderBottom: tab === t ? '2px solid #4ade80' : '2px solid transparent',
            marginBottom: '-1px', transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'Plans' && (
        <div>
          {loading ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '48px 0' }}>Loading…</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {plans.map(plan => {
                const color = plan.color || '#4ade80'
                const features = plan.features ?? []
                return (
                  <div key={plan.id} style={{
                    background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
                    borderRadius: '14px', overflow: 'hidden',
                  }}>
                    <div style={{ height: '4px', background: color }} />
                    <div style={{ padding: '22px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{plan.name}</div>
                        <Badge color={plan.active ? '#4ade80' : '#9099b2'}>{plan.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      {plan.description && <p style={{ color: 'var(--text2)', fontSize: '0.82rem', marginBottom: '16px', lineHeight: 1.5 }}>{plan.description}</p>}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                        {plan.monthly_price != null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Monthly</span>
                            <span style={{ color, fontWeight: 700, fontSize: '0.95rem' }}>${plan.monthly_price.toFixed(2)}</span>
                          </div>
                        )}
                        {plan.quarterly_price != null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Quarterly</span>
                            <span style={{ color: 'var(--text2)', fontWeight: 600, fontSize: '0.88rem' }}>${plan.quarterly_price.toFixed(2)}</span>
                          </div>
                        )}
                        {plan.annual_price != null && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Annual</span>
                            <span style={{ color: 'var(--text2)', fontWeight: 600, fontSize: '0.88rem' }}>${plan.annual_price.toFixed(2)}</span>
                          </div>
                        )}
                        {plan.setup_fee != null && plan.setup_fee > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>Setup Fee</span>
                            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.85rem' }}>${plan.setup_fee.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {features.length > 0 && (
                        <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {features.map(f => (
                            <li key={f} style={{ color: 'var(--text2)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color, fontSize: '0.7rem' }}>✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button
                        onClick={() => { setEditingPlan(plan); setShowPlanModal(true) }}
                        style={{ width: '100%', padding: '9px', border: '1px solid var(--border)', borderRadius: '8px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s' }}
                      >Edit Plan</button>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => { setEditingPlan(undefined); setShowPlanModal(true) }}
                style={{
                  background: 'none', border: '2px dashed var(--border, #2a3048)', borderRadius: '14px',
                  cursor: 'pointer', color: 'var(--text3)', fontSize: '0.88rem', fontWeight: 600,
                  padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>+</span>
                New Plan
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'Discount Codes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => { setEditingCode(undefined); setShowCodeModal(true) }}
              style={{ background: '#4ade80', color: '#0f1117', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
            >+ Create Code</button>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '48px 0' }}>Loading…</div>
          ) : codes.length === 0 ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '48px 0' }}>No discount codes yet</div>
          ) : (
            <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border, #2a3048)' }}>
                    {['Code', 'Description', 'Discount', 'Frequency', 'Usage', 'Expires', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text3)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border, #2a3048)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontFamily: 'monospace', background: 'var(--surface3)', padding: '3px 8px', borderRadius: '4px', color: '#fbbf24', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.08em' }}>{c.code}</span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: '0.85rem' }}>{c.description || '—'}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)', fontSize: '0.88rem', fontWeight: 600 }}>
                        {c.discount_value}{c.discount_type === 'percent' ? '%' : '$'} off
                      </td>
                      <td style={{ padding: '12px 14px' }}><Badge color="#22d3ee">{c.frequency || '—'}</Badge></td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: '0.85rem' }}>
                        {c.uses_count ?? 0} / {c.max_uses ?? '∞'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text3)', fontSize: '0.82rem' }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge color={c.active ? '#4ade80' : '#9099b2'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => { setEditingCode(c); setShowCodeModal(true) }} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: '6px', background: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.78rem' }}>Edit</button>
                          {c.active && <button onClick={() => deactivateCode(c.id)} style={{ padding: '5px 10px', border: '1px solid #f43f5e30', borderRadius: '6px', background: '#f43f5e10', color: '#f43f5e', cursor: 'pointer', fontSize: '0.78rem' }}>Deactivate</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'Offers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {[
            { title: 'Free Trial', desc: '7-day free trial for new sign-ups. Automatically expires. No credit card required.', color: '#4ade80', icon: '🎉' },
            { title: 'Referral Bundle', desc: 'Refer a friend and both get 1 month at 50% off. Tracked via unique referral codes.', color: '#22d3ee', icon: '👥' },
            { title: 'Seasonal Offer', desc: 'January New Year deal — 3 months for the price of 2 on any plan. Limited spots.', color: '#f97316', icon: '🌟' },
          ].map(offer => (
            <div key={offer.title} style={{
              background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)',
              borderRadius: '14px', overflow: 'hidden',
            }}>
              <div style={{ height: '4px', background: offer.color }} />
              <div style={{ padding: '22px' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>{offer.icon}</div>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{offer.title}</div>
                <p style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '16px' }}>{offer.desc}</p>
                <Badge color={offer.color}>Coming Soon</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPlanModal && (
        <PlanModal plan={editingPlan} onClose={() => { setShowPlanModal(false); setEditingPlan(undefined) }} onSave={loadData} />
      )}
      {showCodeModal && (
        <CodeModal code={editingCode} onClose={() => { setShowCodeModal(false); setEditingCode(undefined) }} onSave={loadData} />
      )}
    </div>
  )
}
