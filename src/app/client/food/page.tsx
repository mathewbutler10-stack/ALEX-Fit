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

const SECTIONS: { key: MealSection; label: string; icon: string }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { key: 'lunch', label: 'Lunch', icon: '☀️' },
  { key: 'dinner', label: 'Dinner', icon: '🌙' },
  { key: 'snacks', label: 'Snacks', icon: '🍎' },
]

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

export default function FoodPage() {
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

  // Running totals from eaten items only
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
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Food Log</h1>

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
                    {/* Checkbox */}
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
    </div>
  )
}
