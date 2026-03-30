'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  sender_id: string
  sender_role: string
  text: string
  created_at: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: client } = await supabase
        .from('clients')
        .select('id, gym_id')
        .eq('user_id', user.id)
        .single()

      type ClientRow = { id?: string; gym_id?: string }
      const c = client as ClientRow | null
      if (!c?.id) { setLoading(false); return }
      setClientId(c.id)

      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_id, sender_role, text, created_at')
        .eq('client_id', c.id)
        .order('created_at', { ascending: true })

      setMessages((msgs || []) as Message[])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !clientId || !userId) return
    setSending(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSending(false); return }

    const { data: client } = await supabase
      .from('clients')
      .select('gym_id')
      .eq('user_id', user.id)
      .single()

    type ClientRow = { gym_id?: string }
    const gymId = (client as ClientRow | null)?.gym_id

    const msg = {
      client_id: clientId,
      gym_id: gymId || '',
      sender_id: userId,
      sender_role: 'client',
      text: text.trim(),
    }

    const { data: newMsg } = await supabase
      .from('messages')
      .insert(msg)
      .select('id, sender_id, sender_role, text, created_at')
      .single()

    if (newMsg) {
      setMessages(prev => [...prev, newMsg as Message])
    }
    setText('')
    setSending(false)
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = []
  messages.forEach(msg => {
    const date = formatDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) {
      last.messages.push(msg)
    } else {
      grouped.push({ date, messages: [msg] })
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 64px - 32px)' }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '12px', flexShrink: 0 }}>
        Chat with PT
      </h1>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px' }}>
        {loading ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0', fontSize: '0.85rem' }}>Loading messages…</div>
        ) : messages.length === 0 ? (
          <div style={{ color: 'var(--text3)', textAlign: 'center', padding: '32px 0', fontSize: '0.85rem' }}>
            No messages yet. Say hi to your PT!
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.date}>
              <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 10px', borderRadius: '999px' }}>
                  {group.date}
                </span>
              </div>
              {group.messages.map(msg => {
                const isMe = msg.sender_role === 'client'
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                    <div style={{
                      maxWidth: '78%',
                      background: isMe ? 'var(--accent)' : 'var(--surface)',
                      color: isMe ? '#000' : 'var(--text)',
                      border: isMe ? 'none' : '1px solid var(--border)',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--accent2)', marginBottom: '2px', textTransform: 'capitalize' }}>
                          PT
                        </div>
                      )}
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{msg.text}</div>
                      <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>{formatTime(msg.created_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px', paddingTop: '8px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Message your PT..."
          style={{ flex: 1, borderRadius: '999px', padding: '10px 16px' }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? 'var(--accent)' : 'var(--surface2)',
            color: text.trim() ? '#000' : 'var(--text3)',
            border: 'none', borderRadius: '50%',
            width: '44px', height: '44px', flexShrink: 0,
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          ↑
        </button>
      </form>
    </div>
  )
}
