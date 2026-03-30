'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type MessageType = 'Promotion' | 'Announcement' | 'Wellness'
type Audience = 'all' | 'virtual_pt' | 'pt_in_person' | 'nutrition_only'

interface BroadcastMessage {
  id: string
  type?: string | null
  subject?: string | null
  body?: string | null
  audience?: string[] | null
  sent_at?: string | null
  recipient_count?: number | null
}

const TYPE_COLORS: Record<MessageType, string> = {
  Promotion: '#f97316',
  Announcement: '#22d3ee',
  Wellness: '#4ade80',
}

const AUDIENCE_OPTIONS: { value: Audience; label: string }[] = [
  { value: 'all', label: 'All Clients' },
  { value: 'virtual_pt', label: 'Virtual PT Only' },
  { value: 'pt_in_person', label: 'In-Person Only' },
  { value: 'nutrition_only', label: 'Nutrition Only' },
]

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '999px',
      fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em',
      background: `${color}20`, color,
    }}>{children}</span>
  )
}

export default function BroadcastPage() {
  const [msgType, setMsgType] = useState<MessageType>('Announcement')
  const [audiences, setAudiences] = useState<Audience[]>(['all'])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<BroadcastMessage[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  async function loadHistory() {
    const supabase = createClient()
    const { data } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(20)
    setHistory((data || []) as BroadcastMessage[])
    setHistoryLoading(false)
  }

  useEffect(() => { loadHistory() }, [])

  function toggleAudience(val: Audience) {
    if (val === 'all') {
      setAudiences(['all'])
      return
    }
    setAudiences(prev => {
      const withoutAll = prev.filter(a => a !== 'all')
      if (withoutAll.includes(val)) {
        const next = withoutAll.filter(a => a !== val)
        return next.length === 0 ? ['all'] : next
      }
      return [...withoutAll, val]
    })
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('broadcast_messages').insert({
      type: msgType,
      subject: subject.trim(),
      body: body.trim(),
      audience: audiences,
      sent_at: new Date().toISOString(),
      recipient_count: null,
    })
    setSending(false)
    setSent(true)
    setSubject('')
    setBody('')
    setAudiences(['all'])
    setMsgType('Announcement')
    loadHistory()
    setTimeout(() => setSent(false), 3000)
  }

  const inputBase: React.CSSProperties = {
    background: 'var(--surface3, #252b3b)', border: '1px solid var(--border, #2a3048)',
    borderRadius: '8px', color: 'var(--text, #e8ecf4)', padding: '10px 14px',
    fontSize: '0.88rem', width: '100%', outline: 'none',
  }

  const labelBase: React.CSSProperties = {
    color: 'var(--text2, #9099b2)', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', display: 'block',
  }

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-syne, Syne, sans-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--text, #e8ecf4)', marginBottom: '4px' }}>Broadcast</h1>
        <p style={{ color: 'var(--text2, #9099b2)', fontSize: '0.9rem' }}>Send messages to your client base</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>
        {/* Compose */}
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Compose Message</h2>

          {/* Type selector */}
          <div>
            <div style={labelBase}>Message Type</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['Announcement', 'Promotion', 'Wellness'] as MessageType[]).map(t => {
                const color = TYPE_COLORS[t]
                const isActive = msgType === t
                return (
                  <button
                    key={t}
                    onClick={() => setMsgType(t)}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                      border: isActive ? `1px solid ${color}` : '1px solid var(--border, #2a3048)',
                      background: isActive ? `${color}15` : 'var(--surface2, #1e2333)',
                      color: isActive ? color : 'var(--text2)',
                      fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s', textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '3px' }}>
                      {t === 'Announcement' ? '📣' : t === 'Promotion' ? '🎁' : '💚'}
                    </div>
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Audience */}
          <div>
            <div style={labelBase}>Audience</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {AUDIENCE_OPTIONS.map(opt => {
                const checked = audiences.includes(opt.value)
                return (
                  <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAudience(opt.value)}
                      style={{ accentColor: '#4ade80', width: '15px', height: '15px', cursor: 'pointer' }}
                    />
                    <span style={{ color: checked ? 'var(--text)' : 'var(--text2)', fontSize: '0.88rem', fontWeight: checked ? 600 : 400 }}>{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label style={labelBase}>Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Your message subject…"
              style={inputBase}
            />
          </div>

          {/* Body */}
          <div>
            <label style={labelBase}>Message Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message here…"
              rows={7}
              style={{ ...inputBase, resize: 'vertical' }}
            />
          </div>

          {/* Send button */}
          {sent && (
            <div style={{ background: '#4ade8020', border: '1px solid #4ade80', borderRadius: '8px', padding: '10px 14px', color: '#4ade80', fontSize: '0.85rem', fontWeight: 600 }}>
              Message sent successfully!
            </div>
          )}
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !body.trim()}
            style={{
              padding: '12px', border: 'none', borderRadius: '8px',
              background: sending || !subject.trim() || !body.trim() ? 'var(--surface3)' : '#4ade80',
              color: sending || !subject.trim() || !body.trim() ? 'var(--text3)' : '#0f1117',
              cursor: sending || !subject.trim() || !body.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', fontWeight: 700, transition: 'all 0.2s',
            }}
          >{sending ? 'Sending…' : 'Send Broadcast'}</button>
        </div>

        {/* History */}
        <div style={{ background: 'var(--surface, #181c27)', border: '1px solid var(--border, #2a3048)', borderRadius: '14px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-syne)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Broadcast History</h2>
          {historyLoading ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>Loading…</div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0' }}>No broadcasts yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {history.map((msg, idx) => {
                const typeColor = TYPE_COLORS[(msg.type as MessageType) ?? 'Announcement'] ?? '#22d3ee'
                const audiences = msg.audience ?? []
                return (
                  <div
                    key={msg.id}
                    style={{
                      padding: '14px 0',
                      borderBottom: idx < history.length - 1 ? '1px solid var(--border, #2a3048)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <Badge color={typeColor}>{msg.type || 'Broadcast'}</Badge>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{msg.subject || 'Untitled'}</span>
                      </div>
                      <span style={{ color: 'var(--text3)', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {audiences.slice(0, 2).map(a => (
                        <Badge key={a} color="#9099b2">{a === 'all' ? 'All Clients' : a.replace('_', ' ')}</Badge>
                      ))}
                      {msg.recipient_count != null && (
                        <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>{msg.recipient_count} recipients</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
