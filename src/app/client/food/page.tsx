'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type MealSection = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

interface FoodEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
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

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? Math.round((value / goal) * 100) : 0)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>{value}g / {goal}g</span>
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '999px', background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
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

export default function FoodPage() {
  const [goals, setGoals] = useState<MacroGoals>({ calories: 2000, protein: 150, carbs: 200, fat: 65 })
  const [logged, setLogged] = useState<MacroGoals>({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [entries, setEntries] = useState<Record<MealSection, FoodEntry[]>>({
    breakfast: [], lunch: [], dinner: [], snacks: [],
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
          protein: c.protein_goal || 150,
          carbs: c.carbs_goal || 200,
          fat: c.fat_goal || 65,
        })
      }
    }
    load()
  }, [])

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
    const entry: FoodEntry = { ...meal }
    setEntries(prev => ({ ...prev, [section]: [...prev[section], entry] }))
    setLogged(prev => ({
      calories: prev.calories + meal.calories,
      protein: prev.protein + meal.protein,
      carbs: prev.carbs + meal.carbs,
      fat: prev.fat + meal.fat,
    }))
    setAddingTo(null)
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Food Log</h1>

      {/* Macro overview */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <CalorieRing logged={logged.calories} goal={goals.calories} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MacroBar label="Protein" value={logged.protein} goal={goals.protein} color="var(--accent)" />
            <MacroBar label="Carbs" value={logged.carbs} goal={goals.carbs} color="var(--accent2)" />
            <MacroBar label="Fat" value={logged.fat} goal={goals.fat} color="var(--accent3)" />
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      {SECTIONS.map(section => (
        <div key={section.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{section.icon}</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{section.label}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              {entries[section.key].reduce((s, e) => s + e.calories, 0)} kcal
            </div>
          </div>

          {entries[section.key].length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {entries[section.key].map((entry, i) => (
                <div key={`${entry.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{entry.name}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{entry.calories} kcal</span>
                </div>
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
      ))}
    </div>
  )
}
