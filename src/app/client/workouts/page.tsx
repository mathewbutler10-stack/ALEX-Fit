'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Workout {
  id: string
  name: string
  focus: string | null
  difficulty: string | null
  exercises: string[]
  is_global: boolean
}

interface ActiveWorkout {
  workout: Workout
  completed: boolean[]
  startedAt: Date
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [library, setLibrary] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<ActiveWorkout | null>(null)
  const [tab, setTab] = useState<'assigned' | 'library'>('assigned')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: clientData }, { data: globalWorkouts }] = await Promise.all([
        supabase
          .from('clients')
          .select('gym_id')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('workouts')
          .select('id, name, focus, difficulty, exercises, is_global')
          .eq('is_global', true)
          .order('name'),
      ])

      type ClientRow = { gym_id?: string }
      const gymId = (clientData as ClientRow | null)?.gym_id

      let assignedList: Workout[] = []
      if (gymId) {
        const { data: assigned } = await supabase
          .from('workouts')
          .select('id, name, focus, difficulty, exercises, is_global')
          .eq('gym_id', gymId)
          .eq('is_global', false)
          .order('name')
        assignedList = (assigned || []) as Workout[]
      }

      setWorkouts(assignedList)
      setLibrary((globalWorkouts || []) as Workout[])
      setLoading(false)
    }
    load()
  }, [])

  function startWorkout(w: Workout) {
    setActive({ workout: w, completed: w.exercises.map(() => false), startedAt: new Date() })
  }

  function toggleExercise(i: number) {
    if (!active) return
    setActive(prev => {
      if (!prev) return prev
      const completed = [...prev.completed]
      completed[i] = !completed[i]
      return { ...prev, completed }
    })
  }

  function finishWorkout() {
    setActive(null)
  }

  const difficultyColor = (d: string | null) => {
    if (d === 'beginner') return 'var(--accent)'
    if (d === 'intermediate') return 'var(--warn)'
    if (d === 'advanced') return 'var(--danger)'
    return 'var(--text3)'
  }

  const displayList = tab === 'assigned' ? workouts : library

  if (active) {
    const done = active.completed.filter(Boolean).length
    const total = active.workout.exercises.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={finishWorkout} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text)' }}>{active.workout.name}</h1>
        </div>

        {/* Progress */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{done}/{total} exercises</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '999px', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Exercise checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {active.workout.exercises.map((ex, i) => (
            <button
              key={i}
              onClick={() => toggleExercise(i)}
              style={{
                background: active.completed[i] ? 'var(--accent)10' : 'var(--surface)',
                border: `1px solid ${active.completed[i] ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: active.completed[i] ? 'var(--accent)' : 'var(--surface2)',
                border: `2px solid ${active.completed[i] ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', color: '#000', fontWeight: 700,
              }}>
                {active.completed[i] ? '✓' : ''}
              </div>
              <span style={{
                fontSize: '0.9rem', fontWeight: 500,
                color: active.completed[i] ? 'var(--text3)' : 'var(--text)',
                textDecoration: active.completed[i] ? 'line-through' : 'none',
              }}>{ex}</span>
            </button>
          ))}
        </div>

        {pct === 100 && (
          <button
            onClick={finishWorkout}
            style={{
              background: 'var(--accent)', color: '#000',
              border: 'none', borderRadius: 'var(--radius)',
              padding: '16px', fontFamily: 'Syne, sans-serif',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
            }}
          >
            Complete Workout 🎉
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Workouts</h1>

      {/* Tab switcher */}
      <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '4px', gap: '4px' }}>
        {(['assigned', 'library'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '8px',
              background: tab === t ? 'var(--accent)' : 'none',
              border: 'none', borderRadius: 'var(--radius-sm)',
              color: tab === t ? '#000' : 'var(--text2)',
              fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', fontSize: '0.85rem',
              textTransform: 'capitalize',
            }}
          >
            {t === 'assigned' ? 'My Workouts' : 'Library'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>Loading…</div>
      ) : displayList.length === 0 ? (
        <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0', fontSize: '0.88rem' }}>
          {tab === 'assigned' ? 'No workouts assigned by your PT yet' : 'No workouts in library'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayList.map(w => (
            <div key={w.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)' }}>{w.name}</div>
                  {w.focus && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '2px' }}>{w.focus}</div>}
                </div>
                {w.difficulty && (
                  <span style={{
                    padding: '2px 8px', borderRadius: '999px', fontSize: '0.68rem',
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: `${difficultyColor(w.difficulty)}20`,
                    color: difficultyColor(w.difficulty),
                  }}>
                    {w.difficulty}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '12px' }}>
                {w.exercises.length} exercises
              </div>
              <button
                onClick={() => startWorkout(w)}
                style={{
                  width: '100%', background: 'var(--accent)', color: '#000',
                  border: 'none', borderRadius: 'var(--radius-sm)',
                  padding: '10px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                }}
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
