'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  clientName: string
  points: number
  calorieGoal: number
  caloriesLogged: number
  todayWorkout: { name: string; exercises: string[] } | null
  streak: boolean[]
}

export default function ClientDashboard() {
  const [data, setData] = useState<DashboardData>({
    clientName: '',
    points: 0,
    calorieGoal: 2000,
    caloriesLogged: 0,
    todayWorkout: null,
    streak: [true, true, true, false, true, true, false],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: client }, { data: workout }] = await Promise.all([
        supabase
          .from('clients')
          .select('calorie_goal, protein_goal, user:users(full_name)')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('workouts')
          .select('name, exercises')
          .eq('is_global', true)
          .limit(1)
          .single(),
      ])

      type ClientRow = { calorie_goal?: number; user?: { full_name?: string | null } | null }
      const c = client as ClientRow | null
      setData(prev => ({
        ...prev,
        clientName: c?.user?.full_name?.split(' ')[0] || 'Athlete',
        calorieGoal: c?.calorie_goal || 2000,
        todayWorkout: workout ? { name: workout.name, exercises: workout.exercises?.slice(0, 3) || [] } : null,
      }))
      setLoading(false)
    }
    load()
  }, [])

  const calPct = Math.min(100, Math.round((data.caloriesLogged / data.calorieGoal) * 100))
  const today = new Date()
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Greeting */}
      <div>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)' }}>
          {loading ? 'Hey!' : `Hey, ${data.clientName}!`}
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: '2px' }}>
          {today.toLocaleDateString('en-AU', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Points Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #4ade8020, #22d3ee15)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ color: 'var(--text2)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Points Balance</div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '3rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
          {loading ? '—' : data.points.toLocaleString()}
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: '4px' }}>pts available to redeem</div>
      </div>

      {/* Weekly Streak */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Weekly Streak</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600 }}>
            🔥 {data.streak.filter(Boolean).length} days
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
            <Link href="/client/workouts" style={{
              display: 'block', textAlign: 'center',
              background: 'var(--accent)', color: '#000',
              padding: '10px', borderRadius: 'var(--radius-sm)',
              fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none',
            }}>
              Start Workout
            </Link>
          </>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center', padding: '8px 0' }}>
            No workout assigned for today
          </div>
        )}
      </div>

      {/* Macro Summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>Today&apos;s Calories</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{data.caloriesLogged}</span> / {data.calorieGoal} kcal
          </div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '999px',
            background: calPct >= 100 ? 'var(--danger)' : 'var(--accent)',
            width: `${calPct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ color: 'var(--text3)', fontSize: '0.75rem', marginTop: '6px' }}>{calPct}% of daily goal</div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {[
          { href: '/client/food', icon: '🥗', label: 'Log Meal', color: '#4ade80' },
          { href: '/client/workouts', icon: '🏋️', label: 'Start Workout', color: '#22d3ee' },
          { href: '/client/chat', icon: '💬', label: 'Chat PT', color: '#a78bfa' },
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
