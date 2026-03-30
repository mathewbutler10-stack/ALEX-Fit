'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  clientName: string
  points: number
  calorieGoal: number
  caloriesLogged: number
  proteinLogged: number
  proteinGoal: number
  carbsLogged: number
  carbsGoal: number
  fatLogged: number
  fatGoal: number
  todayWorkout: { name: string; exercises: string[] } | null
  loginStreak: number
  workoutStreak: number
  streak: boolean[]
  nextSession: { ptName: string; day: string; time: string } | null
}

function CalorieRing({ logged, goal }: { logged: number; goal: number }) {
  const pct = Math.min(1, goal > 0 ? logged / goal : 0)
  const r = 60
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)
  return (
    <div style={{ position: 'relative', width: '144px', height: '144px', flexShrink: 0 }}>
      <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="72" cy="72" r={r} fill="none" stroke="var(--surface2)" strokeWidth="14" />
        <circle
          cx="72" cy="72" r={r} fill="none"
          stroke={pct >= 1 ? 'var(--danger)' : 'var(--accent)'}
          strokeWidth="14"
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
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
          {logged.toLocaleString()}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text3)', marginTop: '2px' }}>/ {goal.toLocaleString()} kcal</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>{Math.round(pct * 100)}%</div>
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
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>
        {logged}g
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text3)' }}>/ {goal}g</div>
    </div>
  )
}

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData>({
    clientName: 'Sarah',
    points: 0,
    calorieGoal: 2000,
    caloriesLogged: 1240,
    proteinLogged: 85,
    proteinGoal: 160,
    carbsLogged: 140,
    carbsGoal: 240,
    fatLogged: 42,
    fatGoal: 65,
    todayWorkout: null,
    loginStreak: 5,
    workoutStreak: 3,
    streak: [true, true, true, false, true, true, false],
    nextSession: { ptName: 'Jake Morrison', day: 'Wednesday', time: '10:00 AM' },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const [{ data: client }, { data: workout }] = await Promise.all([
        supabase
          .from('clients')
          .select('calorie_goal, protein_goal, carbs_goal, fat_goal, user:users(full_name)')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('workouts')
          .select('name, exercises')
          .eq('is_global', true)
          .limit(1)
          .single(),
      ])

      type ClientRow = { calorie_goal?: number; protein_goal?: number; carbs_goal?: number; fat_goal?: number; user?: { full_name?: string | null } | null }
      const c = client as ClientRow | null
      setData(prev => ({
        ...prev,
        clientName: c?.user?.full_name?.split(' ')[0] || prev.clientName,
        calorieGoal: c?.calorie_goal || 2000,
        proteinGoal: c?.protein_goal || 160,
        carbsGoal: c?.carbs_goal || 240,
        fatGoal: c?.fat_goal || 65,
        todayWorkout: workout ? { name: workout.name, exercises: workout.exercises?.slice(0, 3) || [] } : null,
      }))
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date()
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>
          {loading ? 'Hey! 👋' : `Hi ${data.clientName}! 👋`}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '2px' }}>
          {today.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Streak badges */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ background: '#4ade8020', border: '1px solid #4ade8040', borderRadius: '999px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#4ade80' }}>
          🔥 Login {data.loginStreak}d
        </div>
        <div style={{ background: '#22d3ee20', border: '1px solid #22d3ee40', borderRadius: '999px', padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#22d3ee' }}>
          💪 Workout {data.workoutStreak}d
        </div>
      </div>

      {/* Calorie Ring + Macros */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '16px' }}>Today&apos;s Nutrition</div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <CalorieRing logged={data.caloriesLogged} goal={data.calorieGoal} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <MacroPill label="Protein" logged={data.proteinLogged} goal={data.proteinGoal} color="var(--accent)" />
          <MacroPill label="Carbs" logged={data.carbsLogged} goal={data.carbsGoal} color="var(--accent2, #22d3ee)" />
          <MacroPill label="Fat" logged={data.fatLogged} goal={data.fatGoal} color="var(--accent3, #f97316)" />
        </div>
      </div>

      {/* Weekly Streak */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Weekly Streak</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
            🔥 {data.streak.filter(Boolean).length} / 7 days
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: data.streak[i] ? 'var(--accent)' : 'var(--surface2)',
                border: `2px solid ${data.streak[i] ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem',
                color: data.streak[i] ? '#000' : 'var(--text3)',
                fontWeight: 700,
              }}>
                {data.streak[i] ? '✓' : ''}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 500 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Workout */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '12px' }}>
          Today&apos;s Workout
        </div>
        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>Loading…</div>
        ) : data.todayWorkout ? (
          <>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>{data.todayWorkout.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
              {data.todayWorkout.exercises.map((ex, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>●</span> {ex}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link href="/client/workouts" style={{
                flex: 1, display: 'block', textAlign: 'center',
                background: 'var(--accent)', color: '#000',
                padding: '10px', borderRadius: 'var(--radius-sm)',
                fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none',
              }}>
                View Details
              </Link>
              <button style={{
                flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', borderRadius: 'var(--radius-sm)',
                padding: '10px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
              }}>
                ✓ Mark Done
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>
            No workout assigned for today
          </div>
        )}
      </div>

      {/* Next Session */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '10px' }}>
          📅 Next Session
        </div>
        {data.nextSession ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text)', fontWeight: 600 }}>
                PT: {data.nextSession.ptName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginTop: '3px' }}>
                📆 {data.nextSession.day} at {data.nextSession.time}
              </div>
            </div>
            <Link href="/client/chat" style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--accent)', borderRadius: 'var(--radius-sm)',
              padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Book Session
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>No session booked</div>
            <Link href="/client/chat" style={{
              background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600,
              textDecoration: 'none',
            }}>
              Book Session
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { href: '/client/food', icon: '🥗', label: 'Log Meal', color: '#4ade80' },
          { href: '/client/workouts', icon: '🏋️', label: 'Start Workout', color: '#22d3ee' },
          { href: '/client/wellness', icon: '🧘', label: 'Wellness', color: '#a78bfa' },
        ].map(action => (
          <Link key={action.href} href={action.href} style={{
            background: 'var(--surface)',
            border: `1px solid ${action.color}40`,
            borderRadius: 'var(--radius-sm)',
            padding: '14px 8px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '6px',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '1.4rem' }}>{action.icon}</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text2)', fontWeight: 500, textAlign: 'center' }}>{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
