'use client'
import { useState, useEffect } from 'react'

interface DayEntry {
  date: string
  mood: number
  energy: number
  sleep: number
  water: number
}

const MOODS = ['😞', '😔', '😐', '🙂', '😄']
const MOOD_LABELS = ['Rough', 'Low', 'Okay', 'Good', 'Great']

function recoveryScore(e: DayEntry): number {
  if (!e.mood) return 0
  const sleepNorm = Math.min(1, e.sleep / 8)
  const moodNorm = (e.mood - 1) / 4
  const energyNorm = (e.energy - 1) / 4
  const waterNorm = Math.min(1, e.water / 8)
  return Math.round((sleepNorm * 0.4 + moodNorm * 0.2 + energyNorm * 0.2 + waterNorm * 0.2) * 100)
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function last7Keys(): string[] {
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

function shortDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'short' }).slice(0, 2)
}

export default function WellnessPage() {
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(3)
  const [sleep, setSleep] = useState(7)
  const [water, setWater] = useState(4)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<Record<string, DayEntry>>({})

  useEffect(() => {
    const raw = localStorage.getItem('apex_wellness')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, DayEntry>
        setHistory(parsed)
        const today = parsed[todayKey()]
        if (today) {
          setMood(today.mood)
          setEnergy(today.energy)
          setSleep(today.sleep)
          setWater(today.water)
        }
      } catch { /* ignore */ }
    }
  }, [])

  function handleSave() {
    const entry: DayEntry = { date: todayKey(), mood, energy, sleep, water }
    const updated = { ...history, [todayKey()]: entry }
    setHistory(updated)
    localStorage.setItem('apex_wellness', JSON.stringify(updated))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const todayEntry: DayEntry = { date: todayKey(), mood, energy, sleep, water }
  const score = recoveryScore(todayEntry)
  const days = last7Keys()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>Wellness</h1>
        {mood > 0 && (
          <div style={{
            background: score >= 70 ? 'var(--accent)20' : score >= 40 ? '#f9731620' : '#f43f5e20',
            border: `1px solid ${score >= 70 ? 'var(--accent)' : score >= 40 ? '#f97316' : '#f43f5e'}40`,
            borderRadius: '999px', padding: '5px 14px',
            fontSize: '0.8rem', fontWeight: 700,
            color: score >= 70 ? 'var(--accent)' : score >= 40 ? '#f97316' : '#f43f5e',
          }}>
            Recovery {score}%
          </div>
        )}
      </div>

      {/* Mood Check-in */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '14px' }}>
          How are you feeling today?
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {MOODS.map((emoji, i) => (
            <button
              key={i}
              onClick={() => setMood(i + 1)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                padding: '10px 4px', borderRadius: 'var(--radius-sm)',
                background: mood === i + 1 ? 'var(--accent)20' : 'var(--surface2)',
                border: `2px solid ${mood === i + 1 ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
              <span style={{ fontSize: '0.6rem', color: mood === i + 1 ? 'var(--accent)' : 'var(--text3)', fontWeight: 600 }}>{MOOD_LABELS[i]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Energy Level */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '14px' }}>
          ⚡ Energy Level
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setEnergy(n)}
              style={{
                flex: 1, height: '40px', borderRadius: 'var(--radius-sm)',
                background: energy >= n ? 'var(--accent2, #22d3ee)' : 'var(--surface2)',
                border: `1px solid ${energy >= n ? 'var(--accent2, #22d3ee)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                fontSize: '0.8rem', fontWeight: 700,
                color: energy >= n ? '#000' : 'var(--text3)',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text3)' }}>
          {energy === 1 ? 'Very low' : energy === 2 ? 'Low' : energy === 3 ? 'Moderate' : energy === 4 ? 'High' : 'Peak energy'}
        </div>
      </div>

      {/* Sleep */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>😴 Sleep</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>{sleep}h</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSleep(s => Math.max(4, +(s - 0.5).toFixed(1)))}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >−</button>
          <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((sleep - 4) / 6) * 100}%`, background: 'var(--accent)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
          </div>
          <button
            onClick={() => setSleep(s => Math.min(10, +(s + 0.5).toFixed(1)))}
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text3)' }}>4 – 10 hours</div>
      </div>

      {/* Water */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>💧 Water Intake</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#22d3ee' }}>{water} glasses</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
          {Array.from({ length: 12 }, (_, i) => (
            <button
              key={i}
              onClick={() => setWater(i + 1)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px', fontSize: '1rem',
                background: water > i ? '#22d3ee22' : 'var(--surface2)',
                border: `1px solid ${water > i ? '#22d3ee' : 'var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              💧
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={() => setWater(w => Math.max(0, w - 1))}
            style={{ padding: '8px 20px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
          >−</button>
          <button
            onClick={() => setWater(w => Math.min(12, w + 1))}
            style={{ padding: '8px 20px', background: '#22d3ee20', border: '1px solid #22d3ee40', borderRadius: 'var(--radius-sm)', color: '#22d3ee', cursor: 'pointer', fontWeight: 600 }}
          >+</button>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={mood === 0}
        style={{
          width: '100%', padding: '14px',
          background: saved ? '#4ade8044' : mood === 0 ? 'var(--surface2)' : 'var(--accent)',
          color: saved ? 'var(--accent)' : mood === 0 ? 'var(--text3)' : '#000',
          border: 'none', borderRadius: 'var(--radius)',
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem',
          cursor: mood === 0 ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {saved ? '✓ Check-in Saved!' : mood === 0 ? 'Select your mood to save' : 'Save Check-in'}
      </button>

      {/* 7-day History */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '14px' }}>
          Last 7 Days
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
          {days.map(day => {
            const entry = history[day]
            const isToday = day === todayKey()
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: entry ? 'var(--accent)20' : 'var(--surface2)',
                  border: `2px solid ${isToday ? 'var(--accent)' : entry ? 'var(--accent)40' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  {entry ? MOODS[entry.mood - 1] : '·'}
                </div>
                <div style={{ fontSize: '0.6rem', color: isToday ? 'var(--accent)' : 'var(--text3)', fontWeight: isToday ? 700 : 400 }}>
                  {shortDay(day)}
                </div>
                {entry && (
                  <div style={{ fontSize: '0.55rem', color: 'var(--text3)' }}>
                    {recoveryScore(entry)}%
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
