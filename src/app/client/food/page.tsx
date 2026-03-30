'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type MealSection = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  eaten: boolean
}

interface MacroGoals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealSearchResult {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface PlanMeal {
  id: string
  name: string
  meal_type: string
  calories: number
  protein: number
  carbs: number
  fat: number
  ingredients: Ingredient[]
  instructions: string
  ease_rating: number
  prep_time_minutes: number
  allergens: string[]
}

interface PlanSlot {
  day_of_week: number
  meal_type: string
  meal: PlanMeal
}

const SECTIONS: { key: MealSection; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snacks', label: 'Snacks', icon: '🍎' },
]

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES_ORDERED = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'var(--warn, #fbbf24)',
  lunch: 'var(--accent, #4ade80)',
  dinner: 'var(--accent2, #22d3ee)',
  snack: '#a855f7',
}

// TODO: replace with Supabase query
const MOCK_MEALS: Record<MealSection, Omit<FoodItem, 'eaten'>[]> = {
  breakfast: [
    { id: 'b1', name: 'Oats with Banana', calories: 350, protein: 10, carbs: 60, fat: 6 },
    { id: 'b2', name: 'Scrambled Eggs', calories: 220, protein: 14, carbs: 2, fat: 15 },
  ],
  lunch: [
    { id: 'l1', name: 'Grilled Chicken and Rice', calories: 520, protein: 45, carbs: 55, fat: 8 },
  ],
  dinner: [
    { id: 'd1', name: 'Salmon Bowl', calories: 580, protein: 42, carbs: 30, fat: 28 },
  ],
  snacks: [
    { id: 's1', name: 'Protein Bar', calories: 220, protein: 20, carbs: 22, fat: 8 },
  ],
}

// ─── Calorie Ring ─────────────────────────────────────────────────────────────

function CalorieRing({ logged, goal }: { logged: number; goal: number }) {
  const pct = Math.min(1, goal > 0 ? logged / goal : 0)
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  return (
    <div style={{ position: 'relative', width: '128px', height: '128px', flexShrink: 0 }}>
      <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="64" cy="64" r={r} fill="none" stroke="var(--surface2)" strokeWidth="12" />
        <circle
          cx="64" cy="64" r={r} fill="none"
          stroke={pct >= 1 ? 'var(--danger)' : 'var(--accent)'}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{logged}</div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>/ {goal} kcal</div>
      </div>
    </div>
  )
}

function MacroPill({ label, logged, goal, color }: { label: string; logged: number; goal: number; color: string }) {
  return (
    <div style={{
      flex: 1,
      background: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: '8px',
      padding: '8px 6px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{logged}g</div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>/ {goal}g</div>
    </div>
  )
}

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ meal, onClose }: { meal: PlanMeal; onClose: () => void }) {
  const steps = meal.instructions ? meal.instructions.split('\n').filter(Boolean) : []
  const typeColor = MEAL_TYPE_COLORS[meal.meal_type] ?? 'var(--text3)'
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 12px)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text)', margin: '0 0 6px' }}>{meal.name}</h2>
            <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: '20px', background: `${typeColor}22`, border: `1px solid ${typeColor}55`, color: typeColor, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>{meal.meal_type}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', padding: '2px' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>{meal.calories} kcal</span>
          {[
            { l: 'P', v: meal.protein, c: 'var(--accent)' },
            { l: 'C', v: meal.carbs, c: 'var(--accent2)' },
            { l: 'F', v: meal.fat, c: 'var(--accent3)' },
          ].map(m => (
            <span key={m.l} style={{ padding: '2px 7px', background: `${m.c}18`, border: `1px solid ${m.c}33`, borderRadius: '5px', fontSize: '0.7rem', color: m.c, fontWeight: 600 }}>
              {m.l} {m.v}g
            </span>
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>⏱ {meal.prep_time_minutes} min</span>
        </div>

        {meal.allergens && meal.allergens.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {meal.allergens.map(a => (
              <span key={a} style={{ padding: '1px 6px', borderRadius: '20px', background: 'var(--danger, #f43f5e)18', border: '1px solid var(--danger, #f43f5e)44', color: 'var(--danger, #f43f5e)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize' }}>{a}</span>
            ))}
          </div>
        )}

        {meal.ingredients && meal.ingredients.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Ingredients</div>
            {meal.ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface2)', borderRadius: '5px', marginBottom: '4px', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                <span style={{ color: 'var(--text3)' }}>{ing.amount} {ing.unit}</span>
              </div>
            ))}
          </div>
        )}

        {steps.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Instructions</div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {steps.map((step, i) => <li key={i} style={{ color: 'var(--text2)', fontSize: '0.83rem', lineHeight: 1.5 }}>{step}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── My Plan Tab ──────────────────────────────────────────────────────────────

function MyPlanTab() {
  const [slots, setSlots] = useState<PlanSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [recipeModal, setRecipeModal] = useState<PlanMeal | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: clientRow } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!clientRow) return

        // Get current week's Monday
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(today)
        monday.setDate(diff)
        monday.setHours(0, 0, 0, 0)
        const weekStartStr = monday.toISOString().slice(0, 10)

        const { data: plan } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('client_id', clientRow.id)
          .eq('week_start', weekStartStr)
          .single()

        if (!plan) { setLoading(false); return }

        const { data: slotData } = await supabase
          .from('meal_plan_slots')
          .select('day_of_week, meal_type, meal_library(id, name, meal_type, calories, protein, carbs, fat, ingredients, instructions, ease_rating, prep_time_minutes, allergens)')
          .eq('plan_id', plan.id)
          .order('day_of_week')

        if (slotData) {
          const parsed: PlanSlot[] = slotData.map(s => ({
            day_of_week: s.day_of_week,
            meal_type: s.meal_type,
            meal: s.meal_library as unknown as PlanMeal,
          }))
          setSlots(parsed)
        }
      } catch { /* ignore */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '40px 0' }}>Loading your plan…</div>
  }

  if (slots.length === 0) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🥗</div>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '8px' }}>No plan assigned yet</div>
        <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
          Your PT hasn&apos;t assigned a meal plan yet — ask them to set one up for you.
        </div>
      </div>
    )
  }

  // Group by day
  const byDay: Record<number, PlanSlot[]> = {}
  for (const slot of slots) {
    if (!byDay[slot.day_of_week]) byDay[slot.day_of_week] = []
    byDay[slot.day_of_week].push(slot)
  }

  // Sort each day by meal type order
  for (const day of Object.values(byDay)) {
    day.sort((a, b) => MEAL_TYPES_ORDERED.indexOf(a.meal_type) - MEAL_TYPES_ORDERED.indexOf(b.meal_type))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {DAYS_SHORT.map((dayLabel, di) => {
        const daySlots = byDay[di] ?? []
        if (daySlots.length === 0) return null
        return (
          <div key={di} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text2)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dayLabel}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {daySlots.map((slot, i) => {
                const typeColor = MEAL_TYPE_COLORS[slot.meal_type] ?? 'var(--text3)'
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px',
                    background: `${typeColor}10`, border: `1px solid ${typeColor}30`,
                    borderRadius: 'var(--radius-sm, 8px)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: typeColor, textTransform: 'capitalize', marginBottom: '2px' }}>{slot.meal_type}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{slot.meal.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '2px' }}>
                        {slot.meal.calories} kcal · P {slot.meal.protein}g · C {slot.meal.carbs}g · F {slot.meal.fat}g
                      </div>
                    </div>
                    <button
                      onClick={() => setRecipeModal(slot.meal)}
                      style={{
                        padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: '6px', color: 'var(--text2)', fontSize: '0.75rem', cursor: 'pointer',
                        fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      🍳 Cook This
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {recipeModal && <RecipeModal meal={recipeModal} onClose={() => setRecipeModal(null)} />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FoodPage() {
  const [activeTab, setActiveTab] = useState<'log' | 'plan'>('log')
  const [goals, setGoals] = useState<MacroGoals>({ calories: 2000, protein: 160, carbs: 240, fat: 65 })
  const [entries, setEntries] = useState<Record<MealSection, FoodItem[]>>({
    breakfast: MOCK_MEALS.breakfast.map(m => ({ ...m, eaten: false })),
    lunch: MOCK_MEALS.lunch.map(m => ({ ...m, eaten: false })),
    dinner: MOCK_MEALS.dinner.map(m => ({ ...m, eaten: false })),
    snacks: MOCK_MEALS.snacks.map(m => ({ ...m, eaten: false })),
  })
  const [addingTo, setAddingTo] = useState<MealSection | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MealSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: client } = await supabase
        .from('clients')
        .select('calorie_goal, protein_goal, carbs_goal, fat_goal')
        .eq('user_id', user.id)
        .single()
      if (client) {
        type ClientRow = { calorie_goal?: number; protein_goal?: number; carbs_goal?: number; fat_goal?: number }
        const c = client as ClientRow
        setGoals({
          calories: c.calorie_goal || 2000,
          protein: c.protein_goal || 160,
          carbs: c.carbs_goal || 240,
          fat: c.fat_goal || 65,
        })
      }
    }
    load()
  }, [])

  const totals = Object.values(entries).flat().reduce((acc, item) => {
    if (!item.eaten) return acc
    return {
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  function toggleEaten(section: MealSection, itemId: string) {
    setEntries(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === itemId ? { ...item, eaten: !item.eaten } : item
      ),
    }))
  }

  async function searchMeals(q: string) {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('meal_library')
      .select('id, name, calories, protein, carbs, fat')
      .ilike('name', `%${q}%`)
      .limit(10)
    setSearchResults((data || []) as MealSearchResult[])
    setSearching(false)
  }

  function addEntry(section: MealSection, meal: MealSearchResult) {
    const item: FoodItem = { ...meal, eaten: false }
    setEntries(prev => ({ ...prev, [section]: [...prev[section], item] }))
    setAddingTo(null)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Food</h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px' }}>
        {[
          { key: 'log' as const, label: 'My Log' },
          { key: 'plan' as const, label: 'My Plan' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.85rem', border: 'none', transition: 'all 0.15s',
              ...(activeTab === tab.key
                ? { background: 'var(--accent)', color: '#000' }
                : { background: 'transparent', color: 'var(--text2)' }
              ),
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ── My Log tab ── */}
      {activeTab === 'log' && (
        <>
          {/* Calorie ring + macros */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <CalorieRing logged={totals.calories} goal={goals.calories} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <MacroPill label="Protein" logged={totals.protein} goal={goals.protein} color="var(--accent)" />
              <MacroPill label="Carbs" logged={totals.carbs} goal={goals.carbs} color="var(--accent2, #22d3ee)" />
              <MacroPill label="Fat" logged={totals.fat} goal={goals.fat} color="var(--accent3, #f97316)" />
            </div>
          </div>

          {/* Meal Sections */}
          {SECTIONS.map(section => {
            const sectionItems = entries[section.key]
            const sectionCals = sectionItems.filter(i => i.eaten).reduce((s, e) => s + e.calories, 0)
            return (
              <div key={section.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{section.icon}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{section.label}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {sectionCals} kcal
                  </div>
                </div>

                {sectionItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    {sectionItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleEaten(section.key, item.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', background: item.eaten ? 'var(--accent)10' : 'var(--surface2)',
                          border: `1px solid ${item.eaten ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${item.eaten ? 'var(--accent)' : 'var(--border)'}`,
                          background: item.eaten ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', color: '#000', fontWeight: 700,
                          transition: 'all 0.2s',
                        }}>
                          {item.eaten ? '✓' : ''}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.88rem', color: item.eaten ? 'var(--accent)' : 'var(--text)', fontWeight: 500, textDecoration: item.eaten ? 'line-through' : 'none', opacity: item.eaten ? 0.8 : 1 }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: '2px' }}>
                            P {item.protein}g · C {item.carbs}g · F {item.fat}g
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: item.eaten ? 'var(--accent)' : 'var(--text2)', fontWeight: 600 }}>
                          {item.calories} kcal
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {addingTo === section.key ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Search meals..."
                      value={searchQuery}
                      onChange={e => { setSearchQuery(e.target.value); searchMeals(e.target.value) }}
                      style={{ width: '100%', marginBottom: '8px' }}
                      autoFocus
                    />
                    {searching && <div style={{ color: 'var(--text3)', fontSize: '0.82rem', padding: '8px 0' }}>Searching…</div>}
                    {searchResults.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                        {searchResults.map(r => (
                          <button
                            key={r.id}
                            onClick={() => addEntry(section.key, r)}
                            style={{
                              background: 'var(--surface2)', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                              color: 'var(--text)', cursor: 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              textAlign: 'left',
                            }}
                          >
                            <span style={{ fontSize: '0.85rem' }}>{r.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{r.calories} kcal</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchQuery && searchResults.length === 0 && !searching && (
                      <div style={{ color: 'var(--text3)', fontSize: '0.82rem', padding: '8px 0' }}>No meals found</div>
                    )}
                    <button
                      onClick={() => { setAddingTo(null); setSearchQuery(''); setSearchResults([]) }}
                      style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.8rem', marginTop: '8px' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingTo(section.key)}
                    style={{
                      width: '100%', background: 'none',
                      border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent)', cursor: 'pointer',
                      padding: '8px', fontSize: '0.82rem', fontWeight: 500,
                    }}
                  >
                    + Add Food
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ── My Plan tab ── */}
      {activeTab === 'plan' && <MyPlanTab />}
    </div>
  )
}
