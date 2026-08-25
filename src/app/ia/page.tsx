'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Conversation = { id: string; title: string | null; updated_at: string }
type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string; created_at: string }

export default function IAPage() {
  const [items, setItems] = useState<Conversation[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function loadConversations() {
    const s = createClient()
    const { data: auth } = await s.auth.getUser()
    if (!auth.user) { window.location.href = '/login'; return }
    const { data } = await s.from('ai_conversations').select('id,title,updated_at').eq('user_id', auth.user.id).order('updated_at', { ascending: false }).limit(20)
    const rows = (data || []) as Conversation[]
    setItems(rows)
    if (rows.length && !active) setActive(rows[0].id)
    setLoading(false)
  }

  async function loadMessages(id: string) {
    const { data } = await createClient().from('ai_messages').select('id,role,content,created_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(50)
    setMessages((data || []) as Message[])
  }

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { if (active) loadMessages(active) }, [active])

  async function startConversation() {
    if (!prompt.trim()) return
    setSending(true); setMessage('')
    const s = createClient()
    const { data: auth } = await s.auth.getUser()
    if (!auth.user) { window.location.href = '/login'; return }
    const { data, error } = await s.from('ai_conversations').insert({ user_id: auth.user.id, title: prompt.trim().slice(0, 70), context: { source: 'dashboard', created_by: 'user' } }).select('id,title,updated_at').single()
    if (error || !data) { setMessage('Não foi possível iniciar a conversa.'); setSending(false); return }
    setItems([data as Conversation, ...items]); setActive(data.id); setMessages([])
    await sendMessage(prompt.trim(), data.id)
  }

  async function sendMessage(text = prompt, id = active) {
    if (!text.trim() || !id) return
    setSending(true); setPrompt(''); setMessage('')
    const optimistic: Message = { id: `local-${Date.now()}`, role: 'user', content: text.trim(), created_at: new Date().toISOString() }
    setMessages((current) => [...current, optimistic])
    const response = await fetch('/api/ia/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: id, message: text.trim() }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) { setMessages((current) => current.filter((x) => x.id !== optimistic.id)); setMessage(data.error || 'Não foi possível responder agora.'); setSending(false); return }
    setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: 'assistant', content: data.answer, created_at: new Date().toISOString() }])
    await loadConversations()
    setSending(false)
  }

  return <main className="premium"><header><Link href="/dashboard" className="brand"><span>P</span> PRETREINO</Link><Link href="/dashboard">← Dashboard</Link></header><div className="shell"><aside className="history"><div className="history-head"><small>PRETREINO IA</small><strong>Conversas</strong></div><button className="new" onClick={() => { setActive(null); setMessages([]); setPrompt('') }}>＋ Nova conversa</button>{loading ? <div className="muted">A carregar...</div> : items.map((x) => <button key={x.id} className={active === x.id ? 'history-item active' : 'history-item'} onClick={() => setActive(x.id)}><span>✦</span><div><strong>{x.title || 'Conversa PRETREINO IA'}</strong><small>{new Date(x.updated_at).toLocaleDateString('pt-BR')}</small></div></button>)}</aside><section className="chat"><div className="chat-top"><div><small>INTELIGÊNCIA PERSONALIZADA</small><h1>Seu espaço de <em>inteligência.</em></h1></div><span className="status"><b /> IA online</span></div>{active ? <div className="messages">{messages.length === 0 ? <div className="welcome"><span>✦</span><h2>Como posso ajudar na sua evolução?</h2><p>Treino, alimentação, recuperação, metas e organização. A IA usa o contexto disponível no seu perfil para personalizar as respostas.</p><div className="suggestions"><button onClick={() => setPrompt('Monte uma sugestão de treino para esta semana com base no meu perfil.')}>Planejar meu treino</button><button onClick={() => setPrompt('Analise minha alimentação e dê sugestões práticas para melhorar.')}>Melhorar alimentação</button><button onClick={() => setPrompt('Ajude-me a organizar uma meta realista para os próximos 30 dias.')}>Definir uma meta</button></div></div> : messages.filter((m) => m.role !== 'system').map((m) => <article key={m.id} className={m.role === 'user' ? 'msg user' : 'msg assistant'}><span>{m.role === 'user' ? 'Você' : 'PRETREINO IA'}</span><p>{m.content}</p></article>)}</div> : <div className="messages"><div className="welcome"><span>✦</span><h2>Comece uma nova conversa</h2><p>Escreva abaixo o que você quer resolver hoje.</p></div></div>}{message && <div className="error">{message}</div>}<div className="composer"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (active) sendMessage() } }} placeholder="Escreva para a PRETREINO IA..."/><button disabled={sending || !prompt.trim()} onClick={() => active ? sendMessage() : startConversation()}>{sending ? 'A pensar...' : 'Enviar →'}</button></div><small className="disclaimer">As respostas da IA são orientativas e não substituem avaliação de profissionais de saúde.</small></section></div><style jsx>{`*{box-sizing:border-box}.premium{min-height:100vh;background:radial-gradient(circle at 70% 0%,rgba(124,58,237,.18),transparent 35%),#070810;color:#fff;font-family:Arial,sans-serif}.premium header{height:76px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center;padding:0 6vw}.brand{display:flex;gap:10px;align-items:center;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:35px;height:35px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5)}header>a:last-child{color:#9296a8;font-size:12px}.shell{max-width:1250px;margin:auto;padding:28px 24px;display:grid;grid-template-columns:280px 1fr;gap:18px;min-height:calc(100vh - 76px)}.history,.chat{background:#0c0e17;border:1px solid rgba(255,255,255,.08);border-radius:20px}.history{padding:18px;display:flex;flex-direction:column;gap:8px}.history-head small,.chat-top small{display:block;color:#a78bfa;font-size:9px;font-weight:900;letter-spacing:.18em}.history-head strong{display:block;font-size:20px;margin-top:6px}.new{border:1px solid rgba(167,139,250,.25);background:rgba(124,58,237,.12);color:#fff;border-radius:10px;padding:11px;text-align:left;font-weight:800;cursor:pointer}.history-item{display:flex;gap:9px;align-items:flex-start;text-align:left;border:1px solid transparent;background:transparent;color:#b7bac6;padding:12px;border-radius:10px;cursor:pointer}.history-item:hover,.history-item.active{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);color:#fff}.history-item>span{color:#c084fc}.history-item div{display:grid;gap:4px;min-width:0}.history-item strong{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.history-item small,.muted{color:#6f7385;font-size:9px}.chat{padding:28px;display:flex;flex-direction:column;min-height:700px}.chat-top{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid rgba(255,255,255,.07);padding-bottom:20px}.chat-top h1{font-size:28px;margin:8px 0 0;letter-spacing:-.03em}.chat-top em{font-style:normal;color:#c084fc}.status{font-size:10px;color:#8d91a2;border:1px solid rgba(255,255,255,.08);border-radius:999px;padding:7px 10px}.status b{display:inline-block;width:6px;height:6px;background:#45dc8c;border-radius:50%;margin-right:6px}.messages{flex:1;overflow:auto;padding:25px 4px;display:grid;align-content:start;gap:16px}.welcome{max-width:620px;margin:auto;text-align:center;padding:35px}.welcome>span{font-size:30px;color:#c084fc}.welcome h2{font-size:25px;margin:12px 0}.welcome p{color:#85899a;line-height:1.7;font-size:13px}.suggestions{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}.suggestions button{background:#11131d;border:1px solid rgba(255,255,255,.08);color:#c7c9d2;padding:9px 11px;border-radius:999px;font-size:10px;cursor:pointer}.msg{max-width:78%;padding:14px 16px;border-radius:16px;border:1px solid rgba(255,255,255,.07)}.msg.user{margin-left:auto;background:linear-gradient(145deg,rgba(124,58,237,.28),rgba(79,70,229,.15))}.msg.assistant{background:#11131d}.msg span{font-size:9px;letter-spacing:.1em;color:#a78bfa;font-weight:900}.msg p{white-space:pre-wrap;color:#e5e6eb;font-size:13px;line-height:1.65;margin:7px 0 0}.composer{display:flex;gap:9px;padding-top:15px;border-top:1px solid rgba(255,255,255,.07)}.composer textarea{flex:1;min-height:58px;max-height:160px;background:#080a11;border:1px solid rgba(255,255,255,.09);border-radius:12px;color:#fff;padding:13px;resize:vertical}.composer button{width:105px;border:0;border-radius:11px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-weight:900;cursor:pointer}.composer button:disabled{opacity:.5;cursor:not-allowed}.error{color:#ff8f8f;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.18);border-radius:10px;padding:10px;font-size:11px}.disclaimer{color:#5f6372;font-size:9px;text-align:center;margin-top:10px}@media(max-width:850px){.shell{grid-template-columns:1fr}.history{max-height:220px;overflow:auto}.chat{min-height:620px}.msg{max-width:92%}}`}</style></main>
}
