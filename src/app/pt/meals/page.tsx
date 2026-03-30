'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  tags: string[] | null
  ingredients: string[] | null
  is_global: boolean
  gym_id: string | null
}

const EMPTY_FORM = {
  name: '', calories: 0, protein: 0, carbs: 0, fat: 0, tags: '', ingredients: '',
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({ meal }: { meal: Meal }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      background: '#181c27', border: '1px solid #2a3048', borderRadius: '12px',
      padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#4ade80'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3048'}
      onClick={() => setExpanded(v => !v)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>{meal.name}</div>
          {/* Macro strip */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <MacroPill label="Cal" value={meal.calories} unit="kcal" color="#f97316" />
            <MacroPill label="P" value={meal.protein} unit="g" color="#4ade80" />
            <MacroPill label="C" value={meal.carbs} unit="g" color="#22d3ee" />
            <MacroPill label="F" value={meal.fat} unit="g" color="#fbbf24" />
          </div>
          {/* Tags */}
          {meal.tags && meal.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {meal.tags.map(tag => (
                <span key={tag} style={{
                  background: '#252b3b', border: '1px solid #2a3048',
                  borderRadius: '12px', padding: '2px 10px',
                  color: '#9099b2', fontSize: '0.72rem',
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>
        <span style={{ color: '#5a6380', fontSize: '0.8rem', flexShrink: 0, marginTop: '2px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && meal.ingredients && meal.ingredients.length > 0 && (
        <div style={{ marginTop: '14px', borderTop: '1px solid #2a3048', paddingTop: '12px' }}>
          <div style={{ color: '#9099b2', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>INGREDIENTS</div>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            {meal.ingredients.map((ing, i) => (
              <li key={i} style={{ color: '#9099b2', fontSize: '0.82rem', marginBottom: '3px' }}>{ing}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{ background: color + '15', border: `1px solid ${color}33`, borderRadius: '6px', padding: '3px 8px', display: 'flex', gap: '4px', alignItems: 'baseline' }}>
      <span style={{ color, fontSize: '0.7rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#e8ecf4', fontSize: '0.82rem', fontWeight: 700 }}>{value}</span>
      <span style={{ color: '#5a6380', fontSize: '0.65rem' }}>{unit}</span>
    </div>
  )
}

// ─── Add Meal Modal ───────────────────────────────────────────────────────────

function AddMealModal({ gymId, onClose, onAdded }: {
  gymId: string; onClose: () => void; onAdded: (meal: Meal) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    const { data, error: err } = await supabase.from('meal_library').insert({
      name: form.name.trim(),
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      ingredients: form.ingredients.split(',').map(s => s.trim()).filter(Boolean),
      is_global: false,
      gym_id: gymId || null,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) onAdded(data as Meal)
    onClose()
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#252b3b', border: '1px solid #2a3048', borderRadius: '6px',
    padding: '9px 12px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#181c27', border: '1px solid #2a3048', borderRadius: '14px', padding: '28px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ color: '#e8ecf4', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Add Custom Meal</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Meal Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Grilled Chicken Bowl" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
              <div key={key}>
                <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} {key === 'calories' ? '(kcal)' : '(g)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Tags (comma-separated)</label>
            <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} style={inputStyle} placeholder="e.g. high-protein, gluten-free" />
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Ingredients (comma-separated)</label>
            <textarea
              value={form.ingredients}
              onChange={e => setForm(f => ({ ...f, ingredients: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="e.g. 150g chicken breast, 100g rice, broccoli"
            />
          </div>

          {error && <div style={{ color: '#f43f5e', fontSize: '0.82rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px', color: '#9099b2', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '10px', background: '#4ade80', color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {saving ? 'Saving...' : 'Add Meal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTMealsPage() {
  const supabase = createClient()
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [gymId, setGymId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()
      if (ptData?.gym_id) setGymId(ptData.gym_id)

      const { data } = await supabase
        .from('meal_library')
        .select('*')
        .or(ptData?.gym_id ? `is_global.eq.true,gym_id.eq.${ptData.gym_id}` : 'is_global.eq.true')
        .order('name', { ascending: true })

      setMeals(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Collect all unique tags
  const allTags = Array.from(new Set(meals.flatMap(m => m.tags ?? []))).sort()

  const filtered = meals.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase())
    const matchTag = !tagFilter || (m.tags ?? []).includes(tagFilter)
    return matchSearch && matchTag
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#e8ecf4', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Meal Library</h1>
          <p style={{ color: '#9099b2', fontSize: '0.88rem', margin: '4px 0 0' }}>{meals.length} meals available</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '10px 22px', background: '#4ade80', color: '#0f1117',
          fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>+ Add Custom Meal</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search meals..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: '200px', background: '#181c27', border: '1px solid #2a3048',
            borderRadius: '8px', padding: '10px 14px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
          }}
        />
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{
            background: '#181c27', border: '1px solid #2a3048', borderRadius: '8px',
            padding: '10px 14px', color: tagFilter ? '#e8ecf4' : '#9099b2', fontSize: '0.88rem', outline: 'none', cursor: 'pointer',
          }}>
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Meals Grid */}
      {loading ? (
        <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px' }}>Loading meals...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px' }}>
          {search || tagFilter ? 'No meals match your filters.' : 'No meals in the library yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {filtered.map(m => <MealCard key={m.id} meal={m} />)}
        </div>
      )}

      {showModal && (
        <AddMealModal
          gymId={gymId}
          onClose={() => setShowModal(false)}
          onAdded={meal => setMeals(ms => [meal, ...ms])}
        />
      )}
    </div>
  )
}
