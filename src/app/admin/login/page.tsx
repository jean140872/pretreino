'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setError('E-mail ou palavra-passe inválidos.')
      setLoading(false)
      return
    }
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_admin', { p_user_id: data.user.id })
    if (roleError || !isAdmin) {
      await supabase.auth.signOut()
      setError('Esta conta não possui acesso ao Centro de Comando.')
      setLoading(false)
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <main className="page">
      <div className="glow one" />
      <div className="glow two" />
      <section className="card">
        <div className="brand"><span>P</span><div>PRETREINO<small>OWNER COMMAND CENTER</small></div></div>
        <div className="eyebrow"><i /> ACESSO EXCLUSIVO DO PROPRIETÁRIO</div>
        <h1>Centro de <em>Comando.</em></h1>
        <p>Entre com a tua conta administrativa para aceder ao controlo geral da plataforma.</p>
        <form onSubmit={submit}>
          <label>E-mail<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="admin@exemplo.com" required /></label>
          <label>Palavra-passe<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="••••••••" required /></label>
          {error && <div className="error">{error}</div>}
          <button disabled={loading}>{loading ? 'A verificar acesso...' : 'Entrar no Centro de Comando →'}</button>
        </form>
        <Link className="back" href="/login">Voltar ao login da plataforma</Link>
      </section>
      <style jsx>{`*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 78% 0%,rgba(124,58,237,.24),transparent 36%),radial-gradient(circle at 8% 60%,rgba(59,130,246,.08),transparent 32%),#070810;color:#fff;font-family:Arial,sans-serif;display:grid;place-items:center;padding:24px;position:relative;overflow:hidden}.glow{position:absolute;width:420px;height:420px;border-radius:50%;filter:blur(100px);opacity:.12}.one{background:#7c3aed;top:-180px;right:-100px}.two{background:#2563eb;bottom:-220px;left:-120px}.card{width:min(100%,480px);padding:42px;border:1px solid rgba(255,255,255,.09);border-radius:24px;background:rgba(12,14,23,.88);box-shadow:0 30px 100px rgba(0,0,0,.45);backdrop-filter:blur(20px);position:relative}.brand{display:flex;align-items:center;gap:12px;font-weight:900;letter-spacing:.08em;margin-bottom:38px}.brand>span{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5);box-shadow:0 8px 28px rgba(124,58,237,.35)}.brand small{display:block;color:#777b8d;font-size:7px;letter-spacing:.18em;margin-top:4px}.eyebrow{font-size:8px;letter-spacing:.16em;color:#a78bfa;font-weight:900}.eyebrow i{display:inline-block;width:6px;height:6px;border-radius:50%;background:#34d399;box-shadow:0 0 12px #34d399;margin-right:7px}.card h1{font-size:44px;letter-spacing:-.06em;margin:14px 0 10px}.card h1 em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.card>p{color:#85899a;font-size:12px;line-height:1.7;margin-bottom:28px}.card form{display:grid;gap:17px}.card label{font-size:9px;color:#9b9fad;letter-spacing:.08em;font-weight:900}.card input{display:block;width:100%;margin-top:8px;padding:14px 15px;border-radius:11px;border:1px solid rgba(255,255,255,.09);background:#080a12;color:#fff;outline:none;font-size:13px}.card input:focus{border-color:rgba(167,139,250,.65);box-shadow:0 0 0 3px rgba(124,58,237,.12)}.card button{border:0;border-radius:11px;padding:15px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-weight:900;cursor:pointer}.card button:disabled{opacity:.65;cursor:wait}.error{padding:12px;border-radius:10px;background:rgba(239,68,68,.09);border:1px solid rgba(239,68,68,.2);color:#fca5a5;font-size:10px}.back{display:block;text-align:center;color:#777b8d;font-size:9px;margin-top:22px}.back:hover{color:#c4b5fd}@media(max-width:520px){.card{padding:28px}.card h1{font-size:38px}}`}</style>
    </main>
  )
}
