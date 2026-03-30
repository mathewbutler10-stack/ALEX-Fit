'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workout {
  id: string
  name: string
  focus: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | string
  description: string | null
  exercises: string[] | null
  gym_id: string | null
  is_global: boolean
}

type FocusFilter = 'All' | 'Full Body' | 'Upper' | 'Lower' | 'Core' | 'Cardio'
type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced'

const FOCUS_OPTIONS: FocusFilter[] = ['All', 'Full Body', 'Upper', 'Lower', 'Core', 'Cardio']

const EMPTY_FORM = {
  name: '', focus: 'Full Body', difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
  description: '', exercises: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diffColor(d: string) {
  if (d === 'beginner') return '#4ade80'
  if (d === 'intermediate') return '#fbbf24'
  return '#f43f5e'
}

function focusColor(f: string) {
  const map: Record<string, string> = {
    'Full Body': '#22d3ee',
    'Upper': '#4ade80',
    'Lower': '#f97316',
    'Core': '#fbbf24',
    'Cardio': '#f43f5e',
  }
  return map[f] ?? '#9099b2'
}

// ─── Workout Card ─────────────────────────────────────────────────────────────

function WorkoutCard({ workout }: { workout: Workout }) {
  const [expanded, setExpanded] = useState(false)
  const exerciseCount = workout.exercises?.length ?? 0

  return (
    <div style={{
      background: '#181c27', border: '1px solid #2a3048', borderRadius: '12px',
      padding: '18px 20px', transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#22d3ee'}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#2a3048'}
    >
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>{workout.name}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: focusColor(workout.focus) + '22',
              color: focusColor(workout.focus),
              border: `1px solid ${focusColor(workout.focus)}44`,
              borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600,
            }}>{workout.focus}</span>
            <span style={{
              background: diffColor(workout.difficulty) + '22',
              color: diffColor(workout.difficulty),
              border: `1px solid ${diffColor(workout.difficulty)}44`,
              borderRadius: '12px', padding: '2px 9px', fontSize: '0.72rem', fontWeight: 600,
            }}>{workout.difficulty}</span>
            <span style={{ color: '#5a6380', fontSize: '0.78rem' }}>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
          </div>
          {workout.description && (
            <div style={{ color: '#9099b2', fontSize: '0.82rem', marginTop: '8px', lineHeight: 1.5 }}>
              {workout.description}
            </div>
          )}
        </div>
        <span style={{ color: '#5a6380', fontSize: '0.8rem', flexShrink: 0, marginTop: '2px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && workout.exercises && workout.exercises.length > 0 && (
        <div style={{ marginTop: '14px', borderTop: '1px solid #2a3048', paddingTop: '14px' }}>
          <div style={{ color: '#9099b2', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>EXERCISES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {workout.exercises.map((ex, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#252b3b', border: '1px solid #2a3048',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#5a6380', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ color: '#e8ecf4', fontSize: '0.85rem' }}>{ex}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Workout Modal ────────────────────────────────────────────────────────

function AddWorkoutModal({ gymId, onClose, onAdded }: {
  gymId: string; onClose: () => void; onAdded: (w: Workout) => void
}) {
  const supabase = createClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Name is required.'); return }
    setSaving(true)
    const exercises = form.exercises.split('\n').map(s => s.trim()).filter(Boolean)
    const { data, error: err } = await supabase.from('workouts').insert({
      name: form.name.trim(),
      focus: form.focus,
      difficulty: form.difficulty,
      description: form.description || null,
      exercises,
      is_global: false,
      gym_id: gymId || null,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) onAdded(data as Workout)
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
      <div style={{ background: '#181c27', border: '1px solid #2a3048', borderRadius: '14px', padding: '28px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ color: '#e8ecf4', fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px' }}>Add Custom Workout</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Workout Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Push Day A" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Focus</label>
              <select value={form.focus} onChange={e => setForm(f => ({ ...f, focus: e.target.value }))} style={inputStyle}>
                {['Full Body', 'Upper', 'Lower', 'Core', 'Cardio'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as typeof form.difficulty }))} style={inputStyle}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Brief description of the workout..."
            />
          </div>

          <div>
            <label style={{ color: '#9099b2', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Exercises (one per line)</label>
            <textarea
              value={form.exercises}
              onChange={e => setForm(f => ({ ...f, exercises: e.target.value }))}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder={`Bench Press 4x8\nIncline Dumbbell Press 3x10\nCable Fly 3x12`}
            />
          </div>

          {error && <div style={{ color: '#f43f5e', fontSize: '0.82rem' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px', color: '#9099b2', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '10px', background: '#4ade80', color: '#0f1117', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
              {saving ? 'Saving...' : 'Add Workout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTWorkoutsPage() {
  const supabase = createClient()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [focusFilter, setFocusFilter] = useState<FocusFilter>('All')
  const [diffFilter, setDiffFilter] = useState<DifficultyFilter>('all')
  const [showModal, setShowModal] = useState(false)
  const [gymId, setGymId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ptData } = await supabase.from('pts').select('id, gym_id').eq('user_id', user.id).single()
      if (ptData?.gym_id) setGymId(ptData.gym_id)

      const { data } = await supabase
        .from('workouts')
        .select('*')
        .or(ptData?.gym_id ? `is_global.eq.true,gym_id.eq.${ptData.gym_id}` : 'is_global.eq.true')
        .order('name', { ascending: true })

      setWorkouts(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = workouts.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase())
    const matchFocus = focusFilter === 'All' || w.focus === focusFilter
    const matchDiff = diffFilter === 'all' || w.difficulty === diffFilter
    return matchSearch && matchFocus && matchDiff
  })

  const pillStyle = (active: boolean, color: string) => ({
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
    background: active ? color + '22' : '#181c27',
    border: `1px solid ${active ? color + '66' : '#2a3048'}`,
    color: active ? color : '#9099b2',
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ color: '#e8ecf4', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Workout Library</h1>
          <p style={{ color: '#9099b2', fontSize: '0.88rem', margin: '4px 0 0' }}>{workouts.length} workouts available</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '10px 22px', background: '#4ade80', color: '#0f1117',
          fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
        }}>+ Add Custom Workout</button>
      </div>

      {/* Search */}
      <input
        placeholder="Search workouts..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box', background: '#181c27', border: '1px solid #2a3048',
          borderRadius: '8px', padding: '10px 14px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
          marginBottom: '14px',
        }}
      />

      {/* Focus Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {FOCUS_OPTIONS.map(f => (
          <button key={f} onClick={() => setFocusFilter(f)} style={pillStyle(focusFilter === f, focusColor(f))}>
            {f}
          </button>
        ))}
      </div>

      {/* Difficulty Filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
          <button key={d} onClick={() => setDiffFilter(d)} style={pillStyle(diffFilter === d, d === 'all' ? '#9099b2' : diffColor(d))}>
            {d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}
      </div>

      {/* Workout Grid */}
      {loading ? (
        <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px' }}>Loading workouts...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px' }}>
          {search || focusFilter !== 'All' || diffFilter !== 'all' ? 'No workouts match your filters.' : 'No workouts in the library yet.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {filtered.map(w => <WorkoutCard key={w.id} workout={w} />)}
        </div>
      )}

      {showModal && (
        <AddWorkoutModal
          gymId={gymId}
          onClose={() => setShowModal(false)}
          onAdded={w => setWorkouts(ws => [w, ...ws])}
        />
      )}
    </div>
  )
}
