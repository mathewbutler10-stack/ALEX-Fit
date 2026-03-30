'use client'
import { useState, useEffect } from 'react'
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
}

interface SlotEntry {
  mealId: string
  meal: MealItem
}

type PlanSlots = Record<string, SlotEntry>  // key: `${dayIndex}-${mealType}`

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_MEALS: MealItem[] = [
  {
    id: 'm1', name: 'Overnight Oats', meal_type: 'breakfast', calories: 380, protein: 18, carbs: 52, fat: 10,
    ease_rating: 5, prep_time_minutes: 5, allergens: ['gluten', 'dairy'],
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
    ease_rating: 3, prep_time_minutes: 25, allergens: [],
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
    ease_rating: 3, prep_time_minutes: 20, allergens: ['shellfish'],
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
    ease_rating: 5, prep_time_minutes: 3, allergens: ['dairy', 'nuts'],
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
    ease_rating: 5, prep_time_minutes: 5, allergens: ['dairy', 'gluten'],
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
    ease_rating: 4, prep_time_minutes: 10, allergens: ['gluten'],
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

const MOCK_CLIENTS = [
  { id: 'c1', name: 'Sarah Chen' },
  { id: 'c2', name: 'James Okafor' },
  { id: 'c3', name: 'Amy Zhang' },
  { id: 'c4', name: 'Priya Sharma' },
  { id: 'c5', name: 'Tom Whitfield' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealTypeVal = typeof MEAL_TYPES[number]

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'var(--warn, #fbbf24)',
  lunch: 'var(--accent, #4ade80)',
  dinner: 'var(--accent2, #22d3ee)',
  snack: '#a855f7',
}

const ALLERGEN_OPTIONS = ['gluten', 'dairy', 'nuts', 'eggs', 'soy', 'shellfish']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeek(monday: Date): string {
  const end = new Date(monday)
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(end)}`
}

function ForkRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= rating ? 'var(--accent)' : 'var(--surface3, #252b3b)'}>
          <path d="M11 3H9v5H7V3H5v5a4 4 0 0 0 3 3.87V21h2v-9.13A4 4 0 0 0 13 8V3h-2zm8 0h-1v8h2V9h1V3h-1V7h-1V3h-1v4h-1V3z" />
        </svg>
      ))}
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

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{meal.calories} kcal</span>
          {[{ l: 'P', v: meal.protein, c: 'var(--accent)' }, { l: 'C', v: meal.carbs, c: 'var(--accent2)' }, { l: 'F', v: meal.fat, c: 'var(--accent3)' }].map(m => (
            <span key={m.l} style={{ padding: '2px 7px', background: `${m.c}18`, border: `1px solid ${m.c}33`, borderRadius: '5px', fontSize: '0.7rem', color: m.c, fontWeight: 600 }}>{m.l} {m.v}g</span>
          ))}
          <ForkRating rating={meal.ease_rating} />
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
          <div>
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

// ─── Left Panel Meal Card (mini) ──────────────────────────────────────────────

function LibraryMealCard({ meal }: { meal: MealItem }) {
  const typeColor = MEAL_TYPE_COLORS[meal.meal_type] ?? 'var(--text3)'

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('mealId', meal.id)
    e.dataTransfer.setData('mealJson', JSON.stringify(meal))
    e.dataTransfer.effectAllowed = 'copy'
    setTimeout(() => { e.currentTarget.style.opacity = '0.5' }, 0)
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
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
        padding: '10px 12px', cursor: 'grab', display: 'flex', alignItems: 'center', gap: '8px',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ fontSize: '0.9rem', color: 'var(--text3)', cursor: 'grab', userSelect: 'none', flexShrink: 0 }}>⠿</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: typeColor, textTransform: 'capitalize' }}>{meal.meal_type}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{meal.calories} kcal</span>
        </div>
      </div>
    </div>
  )
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({
  dayIndex, mealType, slot, onDrop, onRemove, onViewRecipe,
}: {
  dayIndex: number
  mealType: MealTypeVal
  slot: SlotEntry | undefined
  onDrop: (dayIndex: number, mealType: MealTypeVal, meal: MealItem) => void
  onRemove: (key: string) => void
  onViewRecipe: (meal: MealItem) => void
}) {
  const [over, setOver] = useState(false)
  const key = `${dayIndex}-${mealType}`
  const typeColor = MEAL_TYPE_COLORS[mealType] ?? 'var(--text3)'

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setOver(true)
  }

  function handleDragLeave() { setOver(false) }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setOver(false)
    try {
      const meal = JSON.parse(e.dataTransfer.getData('mealJson')) as MealItem
      onDrop(dayIndex, mealType, meal)
    } catch { /* ignore */ }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '60px', borderRadius: '6px', padding: '4px',
        border: `1px ${over ? 'solid' : 'dashed'} ${over ? 'var(--accent)' : 'var(--border)'}`,
        background: over ? 'var(--accent)0a' : 'var(--surface2, #1e2333)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {slot ? (
        <div
          style={{
            background: `${typeColor}14`, border: `1px solid ${typeColor}44`,
            borderRadius: '5px', padding: '5px 7px', cursor: 'pointer',
            position: 'relative',
          }}
          onClick={() => onViewRecipe(slot.meal)}
        >
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text)', paddingRight: '16px', lineHeight: 1.3 }}>
            {slot.meal.name}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text3)', marginTop: '2px' }}>
            {slot.meal.calories} kcal
          </div>
          <button
            onClick={e => { e.stopPropagation(); onRemove(key) }}
            style={{
              position: 'absolute', top: '3px', right: '3px',
              background: 'none', border: 'none', color: 'var(--text3)',
              cursor: 'pointer', fontSize: '0.7rem', lineHeight: 1, padding: '1px 3px',
            }}
            title="Remove"
          >✕</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '52px', color: 'var(--text3)', fontSize: '0.65rem' }}>
          drop here
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MealPlannerPage() {
  const [meals, setMeals] = useState<MealItem[]>(MOCK_MEALS)
  const [clients, setClients] = useState(MOCK_CLIENTS)
  const [selectedClientId, setSelectedClientId] = useState(MOCK_CLIENTS[0].id)
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()))
  const [slots, setSlots] = useState<PlanSlots>({})
  const [recipeModal, setRecipeModal] = useState<MealItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Left panel filters
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [allergyFilter, setAllergyFilter] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()

        // Load meals
        const { data: mealData } = await supabase
          .from('meal_library')
          .select('id, name, meal_type, calories, protein, carbs, fat, ease_rating, prep_time_minutes, allergens, ingredients, instructions')
          .or(ptData?.gym_id ? `gym_id.eq.${ptData.gym_id},is_global.eq.true` : 'is_global.eq.true')
          .order('name')

        if (mealData && mealData.length > 0) {
          setMeals(mealData.map(m => ({
            ...m,
            ease_rating: m.ease_rating ?? 3,
            prep_time_minutes: m.prep_time_minutes ?? 20,
            allergens: m.allergens ?? [],
            ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
            instructions: m.instructions ?? '',
          })) as MealItem[])
        }

        // Load clients
        if (ptData?.id) {
          const { data: clientData } = await supabase
            .from('clients')
            .select('id, name')
            .eq('pt_id', ptData.id)
            .order('name')
          if (clientData && clientData.length > 0) {
            setClients(clientData as typeof MOCK_CLIENTS)
            setSelectedClientId(clientData[0].id)
          }
        }
      } catch { /* fallback to mock */ }
    }
    load()
  }, [])

  function prevWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })
    setSlots({})
  }

  function nextWeek() {
    setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })
    setSlots({})
  }

  function handleDrop(dayIndex: number, mealType: MealTypeVal, meal: MealItem) {
    setSlots(prev => ({
      ...prev,
      [`${dayIndex}-${mealType}`]: { mealId: meal.id, meal },
    }))
  }

  function removeSlot(key: string) {
    setSlots(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function savePlan() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()
      if (!ptData) throw new Error('PT not found')

      const weekStartStr = weekStart.toISOString().slice(0, 10)

      // Upsert plan
      const { data: plan, error: planErr } = await supabase.from('meal_plans').upsert({
        gym_id: ptData.gym_id,
        client_id: selectedClientId,
        pt_id: ptData.id,
        week_start: weekStartStr,
        name: 'Weekly Meal Plan',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id,week_start' }).select().single()

      if (planErr || !plan) throw planErr ?? new Error('Failed to save plan')

      // Delete existing slots for this plan
      await supabase.from('meal_plan_slots').delete().eq('plan_id', plan.id)

      // Insert new slots
      const slotRows = Object.entries(slots).map(([key, entry]) => {
        const [dayStr, ...typeParts] = key.split('-')
        return {
          plan_id: plan.id,
          meal_id: entry.mealId,
          day_of_week: parseInt(dayStr),
          meal_type: typeParts.join('-'),
        }
      })

      if (slotRows.length > 0) {
        await supabase.from('meal_plan_slots').insert(slotRows)
      }

      setSaveMsg('Plan saved!')
    } catch {
      setSaveMsg('Failed to save — check console')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  async function loadTemplate() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Find latest plan for this client
      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('client_id', selectedClientId)
        .order('week_start', { ascending: false })
        .limit(1)
        .single()

      if (!plan) { setSaveMsg('No previous plan found'); setTimeout(() => setSaveMsg(''), 2500); return }

      const { data: slotData } = await supabase
        .from('meal_plan_slots')
        .select('meal_id, day_of_week, meal_type, meal_library(id, name, meal_type, calories, protein, carbs, fat, ease_rating, prep_time_minutes, allergens, ingredients, instructions)')
        .eq('plan_id', plan.id)

      if (!slotData) return

      const newSlots: PlanSlots = {}
      for (const s of slotData) {
        const m = s.meal_library as unknown as MealItem
        if (m) {
          newSlots[`${s.day_of_week}-${s.meal_type}`] = { mealId: s.meal_id, meal: m }
        }
      }
      setSlots(newSlots)
      setSaveMsg('Template loaded!')
      setTimeout(() => setSaveMsg(''), 2500)
    } catch {
      setSaveMsg('No template available')
      setTimeout(() => setSaveMsg(''), 2500)
    }
  }

  const filteredMeals = meals
    .filter(m => typeFilter === 'all' || m.meal_type === typeFilter)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))
    .filter(m => allergyFilter.length === 0 || !allergyFilter.some(a => m.allergens?.includes(a)))

  const typeOptions = [
    { key: 'all', label: 'All' },
    { key: 'breakfast', label: 'B' },
    { key: 'lunch', label: 'L' },
    { key: 'dinner', label: 'D' },
    { key: 'snack', label: 'S' },
  ]

  return (
    <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 60px)', overflow: 'hidden', margin: '-32px -24px' }}>

      {/* ── Left Panel ── */}
      <div style={{
        width: '300px', flexShrink: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '12px' }}>Meal Library</div>

          {/* Type filter pills */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {typeOptions.map(t => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)} style={{
                padding: '4px 10px', borderRadius: '20px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.72rem', border: '1px solid',
                transition: 'all 0.15s',
                ...(typeFilter === t.key
                  ? { background: 'var(--accent)', color: '#000', borderColor: 'var(--accent)' }
                  : { background: 'transparent', color: 'var(--text2)', borderColor: 'var(--border)' }
                ),
              }}>{t.label}</button>
            ))}
          </div>

          {/* Allergy filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {ALLERGEN_OPTIONS.map(a => (
              <button key={a} onClick={() => setAllergyFilter(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])} style={{
                padding: '2px 7px', borderRadius: '20px', cursor: 'pointer',
                fontSize: '0.62rem', fontWeight: 600, border: '1px solid', textTransform: 'capitalize', transition: 'all 0.15s',
                ...(allergyFilter.includes(a)
                  ? { background: 'var(--danger, #f43f5e)22', color: 'var(--danger, #f43f5e)', borderColor: 'var(--danger, #f43f5e)55' }
                  : { background: 'transparent', color: 'var(--text3)', borderColor: 'var(--border)' }
                ),
              }}>{a}</button>
            ))}
          </div>

          {/* Search */}
          <input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '6px 10px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text)', fontSize: '0.8rem', outline: 'none',
            }}
          />
        </div>

        {/* Meal list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filteredMeals.length === 0
            ? <div style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>No meals</div>
            : filteredMeals.map(m => <LibraryMealCard key={m.id} meal={m} />)
          }
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          padding: '12px 20px', background: 'var(--bg, #0f1117)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Client selector */}
          <select
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '7px 12px', color: 'var(--text)', fontSize: '0.84rem', cursor: 'pointer', outline: 'none',
            }}
          >
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Week nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={prevWeek} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.8rem' }}>‹</button>
            <span style={{ fontSize: '0.84rem', color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              Week of {formatWeek(weekStart)}
            </span>
            <button onClick={nextWeek} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.8rem' }}>›</button>
          </div>

          <div style={{ flex: 1 }} />

          {saveMsg && <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>{saveMsg}</span>}

          <button onClick={loadTemplate} style={{ padding: '7px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
            Use Template
          </button>
          <button onClick={savePlan} disabled={saving} style={{ padding: '7px 16px', background: 'var(--accent)', color: '#000', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
            {saving ? 'Saving…' : 'Save Plan'}
          </button>
        </div>

        {/* Week grid */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '16px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '80px', padding: '6px 8px', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Meal</th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: '6px 4px', textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text2)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mt => {
                const typeColor = MEAL_TYPE_COLORS[mt]
                return (
                  <tr key={mt}>
                    <td style={{ padding: '4px 8px 4px 0', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: typeColor, textTransform: 'capitalize', paddingTop: '8px' }}>{mt}</div>
                    </td>
                    {DAYS.map((_, di) => (
                      <td key={di} style={{ padding: '2px', verticalAlign: 'top' }}>
                        <DropZone
                          dayIndex={di}
                          mealType={mt}
                          slot={slots[`${di}-${mt}`]}
                          onDrop={handleDrop}
                          onRemove={removeSlot}
                          onViewRecipe={setRecipeModal}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {recipeModal && <RecipeModal meal={recipeModal} onClose={() => setRecipeModal(null)} />}
    </div>
  )
}
