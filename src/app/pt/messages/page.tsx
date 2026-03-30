'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientEntry {
  id: string
  full_name: string
  latest_message: string | null
  latest_at: string | null
  unread: boolean
}

interface Message {
  id: string
  sender_id: string
  client_id: string
  content: string
  created_at: string
  is_pt: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PTMessagesPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<ClientEntry[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [ptUserId, setPtUserId] = useState('')
  const [ptId, setPtId] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load PT info + clients
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setPtUserId(user.id)

      const { data: ptData } = await supabase.from('pts').select('id').eq('user_id', user.id).single()
      if (!ptData) { setLoading(false); return }
      setPtId(ptData.id)

      // Load clients assigned to this PT
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, users(full_name)')
        .eq('assigned_pt_id', ptData.id)

      if (!clientsData) { setLoading(false); return }

      // For each client, get the latest message
      const entries: ClientEntry[] = await Promise.all(
        clientsData.map(async (c: Record<string, unknown>) => {
          const u = c.users as Record<string, unknown> | null
          const { data: msgs } = await supabase
            .from('messages')
            .select('content, created_at, is_pt')
            .eq('client_id', c.id as string)
            .order('created_at', { ascending: false })
            .limit(1)

          const latest = msgs?.[0]
          return {
            id: c.id as string,
            full_name: (u?.full_name as string) ?? 'Unknown',
            latest_message: latest?.content ?? null,
            latest_at: latest?.created_at ?? null,
            unread: latest ? !latest.is_pt : false,
          }
        })
      )

      // Sort by latest message
      entries.sort((a, b) => {
        if (!a.latest_at) return 1
        if (!b.latest_at) return -1
        return new Date(b.latest_at).getTime() - new Date(a.latest_at).getTime()
      })

      setClients(entries)
      setLoading(false)

      if (entries.length > 0) setSelectedClientId(entries[0].id)
    }
    load()
  }, [])

  // Load messages for selected client
  useEffect(() => {
    if (!selectedClientId) return
    setLoadingMessages(true)
    setMessages([])

    supabase.from('messages').select('*')
      .eq('client_id', selectedClientId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoadingMessages(false)
        // Mark as read (clear unread dot)
        setClients(cs => cs.map(c => c.id === selectedClientId ? { ...c, unread: false } : c))
      })

    // Real-time subscription
    const channel = supabase.channel(`messages-pt-${selectedClientId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `client_id=eq.${selectedClientId}`,
      }, payload => {
        const msg = payload.new as Message
        setMessages(prev => [...prev, msg])
        // Update latest in client list
        setClients(cs => cs.map(c => c.id === selectedClientId
          ? { ...c, latest_message: msg.content, latest_at: msg.created_at, unread: !msg.is_pt }
          : c
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedClientId])

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage() {
    if (!text.trim() || !selectedClientId) return
    setSending(true)
    const content = text.trim()
    setText('')
    const { data } = await supabase.from('messages').insert({
      client_id: selectedClientId,
      sender_id: ptUserId,
      content,
      is_pt: true,
    }).select().single()
    if (data) {
      // Real-time will handle adding to messages, but add directly for immediacy
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev
        return [...prev, data as Message]
      })
      setClients(cs => cs.map(c => c.id === selectedClientId
        ? { ...c, latest_message: content, latest_at: data.created_at }
        : c
      ))
    }
    setSending(false)
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div>
      <h1 style={{ color: '#e8ecf4', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 20px' }}>Messages</h1>

      <div style={{
        display: 'flex', height: 'calc(100vh - 180px)', minHeight: '500px',
        background: '#181c27', border: '1px solid #2a3048', borderRadius: '14px', overflow: 'hidden',
      }}>
        {/* Left Panel — Client List */}
        <div style={{
          width: '300px', flexShrink: 0,
          borderRight: '1px solid #2a3048',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a3048', color: '#9099b2', fontSize: '0.78rem', fontWeight: 600 }}>
            CONVERSATIONS
          </div>

          {loading ? (
            <div style={{ color: '#5a6380', textAlign: 'center', padding: '32px', fontSize: '0.85rem' }}>Loading...</div>
          ) : clients.length === 0 ? (
            <div style={{ color: '#5a6380', textAlign: 'center', padding: '32px', fontSize: '0.85rem' }}>No clients yet.</div>
          ) : (
            clients.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  background: selectedClientId === c.id ? '#252b3b' : 'transparent',
                  borderBottom: '1px solid #1e2333',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (selectedClientId !== c.id) (e.currentTarget as HTMLDivElement).style.background = '#1e2333' }}
                onMouseLeave={e => { if (selectedClientId !== c.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.78rem', fontWeight: 700, color: '#0f1117',
                  }}>{initials(c.full_name)}</div>
                  {c.unread && (
                    <div style={{
                      position: 'absolute', top: '0', right: '0',
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: '#22d3ee', border: '2px solid #181c27',
                    }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#e8ecf4', fontSize: '0.88rem', fontWeight: c.unread ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.full_name}</span>
                    {c.latest_at && <span style={{ color: '#5a6380', fontSize: '0.68rem', flexShrink: 0, marginLeft: '8px' }}>{formatTime(c.latest_at)}</span>}
                  </div>
                  {c.latest_message && (
                    <div style={{ color: c.unread ? '#9099b2' : '#5a6380', fontSize: '0.78rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.latest_message}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Panel — Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selectedClient ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5a6380', fontSize: '0.9rem' }}>
              Select a client to start messaging
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #2a3048',
                display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4ade80, #22d3ee)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#0f1117',
                }}>{initials(selectedClient.full_name)}</div>
                <span style={{ color: '#e8ecf4', fontWeight: 600, fontSize: '0.95rem' }}>{selectedClient.full_name}</span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loadingMessages ? (
                  <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px', fontSize: '0.85rem' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ color: '#5a6380', textAlign: 'center', padding: '40px', fontSize: '0.85rem' }}>No messages yet. Say hello!</div>
                ) : (
                  messages.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.is_pt ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '68%', padding: '10px 14px', borderRadius: m.is_pt ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: m.is_pt ? '#4ade8022' : '#252b3b',
                        border: `1px solid ${m.is_pt ? '#4ade8044' : '#2a3048'}`,
                      }}>
                        <div style={{ color: '#e8ecf4', fontSize: '0.88rem', lineHeight: 1.55 }}>{m.content}</div>
                        <div style={{ color: '#5a6380', fontSize: '0.68rem', marginTop: '4px', textAlign: m.is_pt ? 'right' : 'left' }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Send Box */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid #2a3048', display: 'flex', gap: '10px', flexShrink: 0 }}>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={`Message ${selectedClient.full_name}...`}
                  style={{
                    flex: 1, background: '#252b3b', border: '1px solid #2a3048', borderRadius: '8px',
                    padding: '10px 14px', color: '#e8ecf4', fontSize: '0.88rem', outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !text.trim()}
                  style={{
                    padding: '10px 22px', background: '#4ade80', color: '#0f1117',
                    fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem',
                    opacity: (!text.trim() || sending) ? 0.5 : 1,
                  }}
                >Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
