'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  name: string
  amount: string
  unit: string
}

interface MealItem {
  id: string
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
  ease_rating: number
  prep_time_minutes: number
  allergens: string[]
  ingredients: Ingredient[]
  instructions: string
  cuisine?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEALS: MealItem[] = [
  {
    id: 'm1', name: 'Overnight Oats', meal_type: 'breakfast', calories: 380, protein: 18, carbs: 52, fat: 10,
    ease_rating: 5, prep_time_minutes: 5,
    allergens: ['gluten', 'dairy'],
    ingredients: [
      { name: 'Rolled oats', amount: '80', unit: 'g' },
      { name: 'Greek yoghurt', amount: '120', unit: 'g' },
      { name: 'Banana', amount: '1', unit: 'medium' },
      { name: 'Honey', amount: '1', unit: 'tsp' },
      { name: 'Chia seeds', amount: '1', unit: 'tbsp' },
    ],
    instructions: 'Mix oats and chia seeds in a jar.\nAdd yoghurt and honey.\nSlice banana on top.\nRefrigerate overnight.\nGrab and go in the morning.',
  },
  {
    id: 'm2', name: 'Grilled Chicken & Rice', meal_type: 'lunch', calories: 520, protein: 45, carbs: 55, fat: 8,
    ease_rating: 3, prep_time_minutes: 25,
    allergens: [],
    ingredients: [
      { name: 'Chicken breast', amount: '180', unit: 'g' },
      { name: 'Brown rice', amount: '100', unit: 'g dry' },
      { name: 'Olive oil', amount: '1', unit: 'tbsp' },
      { name: 'Garlic', amount: '2', unit: 'cloves' },
      { name: 'Lemon', amount: '0.5', unit: 'whole' },
    ],
    instructions: 'Cook rice per packet instructions.\nSeason chicken with salt, pepper, garlic.\nGrill on medium-high 6 mins each side.\nRest 3 mins, slice.\nServe over rice with lemon.',
  },
  {
    id: 'm3', name: 'Salmon Bowl', meal_type: 'dinner', calories: 580, protein: 42, carbs: 30, fat: 28,
    ease_rating: 3, prep_time_minutes: 20,
    allergens: ['shellfish'],
    ingredients: [
      { name: 'Salmon fillet', amount: '180', unit: 'g' },
      { name: 'Brown rice', amount: '80', unit: 'g dry' },
      { name: 'Cucumber', amount: '0.5', unit: 'whole' },
      { name: 'Avocado', amount: '0.5', unit: 'whole' },
      { name: 'Soy sauce', amount: '2', unit: 'tbsp' },
      { name: 'Sesame seeds', amount: '1', unit: 'tsp' },
    ],
    instructions: 'Cook rice.\nSeason salmon, pan-fry skin-side down 4 mins, flip 2 mins.\nSlice cucumber and avocado.\nAssemble bowl: rice base, salmon, cucumber, avocado.\nDrizzle soy sauce, top with sesame seeds.',
  },
  {
    id: 'm4', name: 'Protein Smoothie', meal_type: 'snack', calories: 280, protein: 28, carbs: 32, fat: 5,
    ease_rating: 5, prep_time_minutes: 3,
    allergens: ['dairy', 'nuts'],
    ingredients: [
      { name: 'Whey protein', amount: '30', unit: 'g' },
      { name: 'Banana', amount: '1', unit: 'frozen' },
      { name: 'Almond milk', amount: '250', unit: 'ml' },
      { name: 'Peanut butter', amount: '1', unit: 'tbsp' },
    ],
    instructions: 'Add all ingredients to blender.\nBlend 30 seconds until smooth.\nDrink immediately.',
  },
  {
    id: 'm5', name: 'Greek Yoghurt Parfait', meal_type: 'breakfast', calories: 320, protein: 22, carbs: 38, fat: 8,
    ease_rating: 5, prep_time_minutes: 5,
    allergens: ['dairy', 'gluten'],
    ingredients: [
      { name: 'Greek yoghurt', amount: '200', unit: 'g' },
      { name: 'Granola', amount: '40', unit: 'g' },
      { name: 'Mixed berries', amount: '80', unit: 'g' },
      { name: 'Honey', amount: '1', unit: 'tsp' },
    ],
    instructions: 'Layer yoghurt in a bowl.\nTop with granola.\nAdd berries.\nDrizzle honey.',
  },
  {
    id: 'm6', name: 'Turkey & Veggie Wrap', meal_type: 'lunch', calories: 420, protein: 35, carbs: 42, fat: 10,
    ease_rating: 4, prep_time_minutes: 10,
    allergens: ['gluten'],
    ingredients: [
      { name: 'Wholegrain wrap', amount: '1', unit: 'large' },
      { name: 'Turkey breast', amount: '120', unit: 'g' },
      { name: 'Spinach', amount: '30', unit: 'g' },
      { name: 'Tomato', amount: '1', unit: 'medium' },
      { name: 'Hummus', amount: '2', unit: 'tbsp' },
    ],
    instructions: 'Lay wrap flat.\nSpread hummus.\nLayer turkey, spinach, sliced tomato.\nRoll tightly, slice diagonally.',
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'var(--warn, #fbbf24)',
  lunch: 'var(--accent, #4ade80)',
  dinner: 'var(--accent2, #22d3ee)',
  snack: '#a855f7',
}

const ALLERGEN_OPTIONS = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish']

type SortKey = 'ease_rating' | 'calories' | 'prep_time_minutes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ForkRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill={i <= rating ? 'var(--accent)' : 'var(--surface3, #252b3b)'}>
          <path d="M11 3H9v5H7V3H5v5a4 4 0 0 0 3 3.87V21h2v-9.13A4 4 0 0 0 13 8V3h-2zm8 0h-1v8h2V9h1V3h-1V7h-1V3h-1v4h-1V3z" />
        </svg>
      ))}
    </div>
  )
}

function SmallCalorieRing({ calories, protein, carbs, fat }: { calories: number; protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9 || 1
  const pPct = (protein * 4) / total
  const cPct = (carbs * 4) / total
  const r = 34
  const circ = 2 * Math.PI * r
  const pDash = circ * pPct
  const cDash = circ * cPct
  const fDash = circ - pDash - cDash

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <svg width="80" height="80" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface3, #252b3b)" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke="var(--accent)" strokeWidth="8"
          strokeDasharray={`${pDash} ${circ - pDash}`} strokeDashoffset={0} />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke="var(--accent2)" strokeWidth="8"
          strokeDasharray={`${cDash} ${circ - cDash}`} strokeDashoffset={-pDash} />
        <circle cx="40" cy="40" r={r} fill="none"
          stroke="var(--accent3)" strokeWidth="8"
          strokeDasharray={`${fDash} ${circ - fDash}`} strokeDashoffset={-(pDash + cDash)} />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '1.1rem', fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--text)' }}>{calories} kcal</div>
        {[
          { label: 'Protein', val: protein, color: 'var(--accent)' },
          { label: 'Carbs', val: carbs, color: 'var(--accent2)' },
          { label: 'Fat', val: fat, color: 'var(--accent3)' },
        ].map(m => (
          <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{m.label}: <strong style={{ color: 'var(--text)' }}>{m.val}g</strong></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Recipe Modal ─────────────────────────────────────────────────────────────

function RecipeModal({ meal, onClose }: { meal: MealItem; onClose: () => void }) {
  const steps = meal.instructions ? meal.instructions.split('\n').filter(Boolean) : []
  const typeColor = MEAL_TYPE_COLORS[meal.meal_type] ?? 'var(--text3)'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 12px)',
          width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)', margin: '0 0 8px' }}>{meal.name}</h2>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
              background: `${typeColor}22`, border: `1px solid ${typeColor}55`,
              color: typeColor, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            }}>{meal.meal_type}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: '4px' }}>✕</button>
        </div>

        {/* Calorie ring */}
        <div style={{ marginBottom: '24px' }}>
          <SmallCalorieRing calories={meal.calories} protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          <ForkRating rating={meal.ease_rating} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>⏱ {meal.prep_time_minutes} min</span>
        </div>

        {/* Allergens */}
        {meal.allergens && meal.allergens.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {meal.allergens.map(a => (
              <span key={a} style={{
                padding: '2px 8px', borderRadius: '20px',
                background: 'var(--danger, #f43f5e)22', border: '1px solid var(--danger, #f43f5e)55',
                color: 'var(--danger, #f43f5e)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'capitalize',
              }}>{a}</span>
            ))}
          </div>
        )}

        {/* Ingredients */}
        {meal.ingredients && meal.ingredients.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Ingredients</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {meal.ingredients.map((ing, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '7px 12px', background: 'var(--surface2, #1e2333)',
                  borderRadius: '6px', fontSize: '0.84rem',
                }}>
                  <span style={{ color: 'var(--text)' }}>{ing.name}</span>
                  <span style={{ color: 'var(--text3)' }}>{ing.amount} {ing.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {steps.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' }}>Instructions</div>
            <ol style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {steps.map((step, i) => (
                <li key={i} style={{ color: 'var(--text2)', fontSize: '0.85rem', lineHeight: 1.5 }}>{step}</li>
              ))}
            </ol>
          </div>
        )}

        {/* CTA */}
        <button style={{
          width: '100%', padding: '12px', background: 'var(--accent)', color: '#000',
          fontWeight: 700, border: 'none', borderRadius: 'var(--radius-sm, 8px)',
          cursor: 'pointer', fontSize: '0.95rem',
        }}>Add to Plan</button>
      </div>
    </div>
  )
}

// ─── Meal Card ────────────────────────────────────────────────────────────────

function MealCard({ meal, onViewRecipe }: { meal: MealItem; onViewRecipe: () => void }) {
  const typeColor = MEAL_TYPE_COLORS[meal.meal_type] ?? 'var(--text3)'

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('mealId', meal.id)
    e.dataTransfer.setData('mealJson', JSON.stringify(meal))
    e.dataTransfer.effectAllowed = 'copy'
    const el = e.currentTarget
    setTimeout(() => { el.style.opacity = '0.5' }, 0)
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    e.currentTarget.style.opacity = '1'
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius, 12px)',
        padding: '16px', position: 'relative', cursor: 'grab',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)33'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Drag handle */}
      <div style={{
        position: 'absolute', top: '12px', right: '12px',
        color: 'var(--text3)', fontSize: '0.9rem', cursor: 'grab', userSelect: 'none',
      }} title="Drag to plan">⠿</div>

      {/* Type badge */}
      <span style={{
        display: 'inline-block', padding: '2px 9px', borderRadius: '20px',
        background: `${typeColor}22`, border: `1px solid ${typeColor}44`,
        color: typeColor, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
        marginBottom: '8px',
      }}>{meal.meal_type}</span>

      {/* Name */}
      <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text)', marginBottom: '10px', paddingRight: '24px' }}>
        {meal.name}
      </div>

      {/* Calories + macros */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', marginRight: '2px' }}>{meal.calories} kcal</span>
        {[
          { label: 'P', val: meal.protein, color: 'var(--accent)' },
          { label: 'C', val: meal.carbs, color: 'var(--accent2)' },
          { label: 'F', val: meal.fat, color: 'var(--accent3)' },
        ].map(m => (
          <span key={m.label} style={{
            padding: '2px 7px', background: `${m.color}18`, border: `1px solid ${m.color}33`,
            borderRadius: '5px', fontSize: '0.7rem', color: m.color, fontWeight: 600,
          }}>{m.label} {m.val}g</span>
        ))}
      </div>

      {/* Ease + prep */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
        <ForkRating rating={meal.ease_rating} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>⏱ {meal.prep_time_minutes} min</span>
      </div>

      {/* Allergens */}
      {meal.allergens && meal.allergens.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {meal.allergens.map(a => (
            <span key={a} style={{
              padding: '1px 6px', borderRadius: '20px',
              background: 'var(--danger, #f43f5e)18', border: '1px solid var(--danger, #f43f5e)44',
              color: 'var(--danger, #f43f5e)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize',
            }}>{a}</span>
          ))}
        </div>
      )}

      <button
        onClick={onViewRecipe}
        style={{
          width: '100%', padding: '8px', background: 'var(--surface2, #1e2333)',
          border: '1px solid var(--border)', borderRadius: '6px',
          color: 'var(--text2)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        View Recipe
      </button>
    </div>
  )
}

// ─── Allergy Dropdown ─────────────────────────────────────────────────────────

function AllergyDropdown({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(allergen: string) {
    onChange(selected.includes(allergen) ? selected.filter(a => a !== allergen) : [...selected, allergen])
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '8px 14px', background: selected.length ? 'var(--danger, #f43f5e)18' : 'var(--surface2, #1e2333)',
          border: `1px solid ${selected.length ? 'var(--danger, #f43f5e)55' : 'var(--border)'}`,
          borderRadius: '20px', color: selected.length ? 'var(--danger, #f43f5e)' : 'var(--text2)',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
        }}
      >
        Allergens {selected.length ? `(${selected.length})` : '▾'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
          padding: '8px', minWidth: '160px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {ALLERGEN_OPTIONS.map(a => (
            <label key={a} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '7px 10px', cursor: 'pointer', borderRadius: '6px',
              fontSize: '0.82rem', color: 'var(--text2)',
              background: selected.includes(a) ? 'var(--danger, #f43f5e)12' : 'transparent',
            }}>
              <input
                type="checkbox"
                checked={selected.includes(a)}
                onChange={() => toggle(a)}
                style={{ accentColor: 'var(--danger, #f43f5e)', cursor: 'pointer' }}
              />
              <span style={{ textTransform: 'capitalize' }}>{a}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MealLibraryPage() {
  const [meals, setMeals] = useState<MealItem[]>(MOCK_MEALS)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('ease_rating')
  const [sortDesc, setSortDesc] = useState(true)
  const [allergyFilter, setAllergyFilter] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [recipeModal, setRecipeModal] = useState<MealItem | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: ptData } = await supabase.from('pts').select('gym_id').eq('user_id', user.id).single()

        const { data } = await supabase
          .from('meal_library')
          .select('id, name, meal_type, calories, protein, carbs, fat, ease_rating, prep_time_minutes, allergens, ingredients, instructions, cuisine')
          .or(ptData?.gym_id ? `gym_id.eq.${ptData.gym_id},is_global.eq.true` : 'is_global.eq.true')
          .order('name')

        if (data && data.length > 0) {
          setMeals(data.map(m => ({
            ...m,
            ease_rating: m.ease_rating ?? 3,
            prep_time_minutes: m.prep_time_minutes ?? 20,
            allergens: m.allergens ?? [],
            ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
            instructions: m.instructions ?? '',
          })) as MealItem[])
        }
      } catch {
        // fallback to mock
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter + sort
  const filtered = meals
    .filter(m => typeFilter === 'all' || m.meal_type === typeFilter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => allergyFilter.length === 0 || !allergyFilter.some(a => m.allergens?.includes(a)))
    .sort((a, b) => {
      const av = a[sortKey] ?? 0
      const bv = b[sortKey] ?? 0
      return sortDesc ? (bv as number) - (av as number) : (av as number) - (bv as number)
    })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(true) }
  }

  const typeOptions = [
    { key: 'all', label: 'All' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snack' },
  ]

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'ease_rating', label: 'Rating' },
    { key: 'calories', label: 'Calories' },
    { key: 'prep_time_minutes', label: 'Prep Time' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'var(--text)', margin: '0 0 4px' }}>
          Meal Library
        </h1>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem', margin: 0 }}>
          {filtered.length} meals — drag any card onto the planner to assign it
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        position: 'sticky', top: '60px', zIndex: 20,
        background: 'var(--bg, #0f1117)',
        paddingBottom: '16px', marginBottom: '20px',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Type tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {typeOptions.map(t => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              style={{
                padding: '6px 16px', borderRadius: '20px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.8rem', border: '1px solid',
                transition: 'all 0.15s',
                ...(typeFilter === t.key
                  ? { background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' }
                  : { background: 'transparent', color: 'var(--text2)', borderColor: 'var(--border)' }
                ),
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* Sort + Allergy + Search row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Sort buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {sortOptions.map(s => (
              <button
                key={s.key}
                onClick={() => toggleSort(s.key)}
                style={{
                  padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 500, border: '1px solid',
                  transition: 'all 0.15s',
                  ...(sortKey === s.key
                    ? { background: 'var(--surface2)', color: 'var(--text)', borderColor: 'var(--accent)' }
                    : { background: 'transparent', color: 'var(--text3)', borderColor: 'var(--border)' }
                  ),
                }}
              >
                {s.label} {sortKey === s.key ? (sortDesc ? '↓' : '↑') : '↕'}
              </button>
            ))}
          </div>

          <AllergyDropdown selected={allergyFilter} onChange={setAllergyFilter} />

          {/* Search */}
          <input
            placeholder="Search meals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: '180px', padding: '7px 14px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)', fontSize: '0.84rem', outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px 0' }}>Loading meals…</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px 0' }}>No meals match your filters.</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filtered.map(m => (
            <MealCard key={m.id} meal={m} onViewRecipe={() => setRecipeModal(m)} />
          ))}
        </div>
      )}

      {recipeModal && <RecipeModal meal={recipeModal} onClose={() => setRecipeModal(null)} />}
    </div>
  )
}
