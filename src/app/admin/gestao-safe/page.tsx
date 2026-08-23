'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; display_name: string | null; city: string | null; account_status: string }
type Role = { user_id: string; role: string }
type Plan = { id: string; name: string; price: number | null; interval: string; active: boolean; provider: string }
type Product = { id: string; name: string; category: string | null; price: number | null; currency: string; active: boolean }

type Tab = 'overview' | 'people' | 'revenue' | 'catalog'

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export default function AdminGestaoSafePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [status, setStatus] = useState<'checking' | 'ready' | 'denied' | 'error'>('checking')
  const [message, setMessage] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [products, setProducts] = useState<Product[]>([])

  async function load() {
    setStatus('checking')
    setMessage('')
    try {
      const supabase = createClient()
      let session = (await withTimeout(supabase.auth.getSession())).data.session
      if (!session) {
        await wait(250)
        session = (await withTimeout(supabase.auth.getSession())).data.session
      }
      if (!session?.user) {
        setStatus('denied')
        return
      }

      let isAdmin = false
      try {
        const result = await withTimeout(supabase.rpc('is_admin', { p_user_id: session.user.id }), 5000)
        isAdmin = !result.error && Boolean(result.data)
      } catch {
        const result = await withTimeout(supabase.from('user_roles').select('role').eq('user_id', session.user.id), 5000)
        isAdmin = Boolean(result.data?.some((row: { role: string }) => row.role === 'admin'))
      }

      if (!isAdmin) {
        setStatus('denied')
        return
      }

      const [people, userRoles, premiumPlans, storeProducts] = await withTimeout(Promise.all([
        supabase.from('profiles').select('id,display_name,city,account_status').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id,role'),
        supabase.from('premium_plans').select('id,name,price,interval,active,provider').order('price'),
        supabase.from('store_products').select('id,name,category,price,currency,active').order('created_at', { ascending: false }),
      ]), 10000)

      setProfiles((people.data || []) as Profile[])
      setRoles((userRoles.data || []) as Role[])
      setPlans((premiumPlans.data || []) as Plan[])
      setProducts((storeProducts.data || []) as Product[])
      setStatus('ready')
    } catch (error) {
      console.error('PRETREINO admin command center error', error)
      setMessage('A verificação demorou mais do que o esperado. O painel foi protegido para não ficar preso no carregamento.')
      setStatus('error')
    }
  }

  useEffect(() => { void load() }, [])

  async function togglePlan(plan: Plan) {
    const supabase = createClient()
    await supabase.from('premium_plans').update({ active: !plan.active }).eq('id', plan.id)
    await load()
  }

  async function toggleProduct(product: Product) {
    const supabase = createClient()
    await supabase.from('store_products').update({ active: !product.active }).eq('id', product.id)
    await load()
  }

  async function changeStatus(profile: Profile, value: string) {
    const supabase = createClient()
    await supabase.from('profiles').update({ account_status: value }).eq('id', profile.id)
    await load()
  }

  async function changeRole(profile: Profile, value: string) {
    const supabase = createClient()
    await supabase.from('user_roles').delete().eq('user_id', profile.id)
    await supabase.from('user_roles').insert({ user_id: profile.id, role: value })
    await load()
  }

  if (status === 'checking') return <main className="page"><div className="loading"><div className="orb"/><small>PRETREINO ADMIN</small><h1>A verificar o centro de comando...</h1><p>A validar a sua sessão administrativa.</p></div><style jsx>{styles}</style></main>

  if (status === 'denied') return <main className="page"><div className="card"><small>PRETREINO ADMIN</small><h1>Acesso reservado.</h1><p>Entre com a conta administrativa para abrir o centro de comando.</p><Link href="/login">Entrar →</Link></div><style jsx>{styles}</style></main>

  if (status === 'error') return <main className="page"><div className="card"><small>PRETREINO ADMIN</small><h1>Não foi possível carregar o painel.</h1><p>{message}</p><button onClick={() => void load()}>Tentar novamente →</button></div><style jsx>{styles}</style></main>

  return <main className="page">
    <header><Link href="/admin" className="brand"><span>P</span> PRETREINO ADMIN</Link><nav><Link href="/dashboard">Plataforma</Link><Link href="/admin/loja">Loja</Link></nav></header>
    <div className="shell">
      <section className="hero"><small>PRETREINO · CONTROLO TOTAL</small><h1>Operação <em>central.</em></h1><p>O centro de comando para gerir pessoas, assinaturas, catálogo e a operação do PRETREINO.</p></section>
      <div className="tabs">{([['overview','Visão geral'],['people','Pessoas'],['revenue','Receita'],['catalog','Catálogo']] as [Tab,string][]).map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>

      {tab === 'overview' && <section className="grid four"><article className="panel stat"><small>UTILIZADORES</small><strong>{profiles.length}</strong><span>contas registadas</span></article><article className="panel stat"><small>ADMINS</small><strong>{roles.filter(role => role.role === 'admin').length}</strong><span>acessos administrativos</span></article><article className="panel stat"><small>PLANOS</small><strong>{plans.filter(plan => plan.active).length}</strong><span>planos activos</span></article><article className="panel stat"><small>PRODUTOS</small><strong>{products.filter(product => product.active).length}</strong><span>produtos publicados</span></article><div className="panel wide"><small>ACESSO RÁPIDO</small><h2>Centro de operação</h2><div className="links"><Link href="/admin/loja">Gerir produtos & suplementos →</Link><Link href="/admin/pedidos">Gerir pedidos →</Link><Link href="/premium">Ver experiência Premium →</Link><Link href="/loja">Abrir Loja →</Link></div></div></section>}

      {tab === 'people' && <section className="panel"><div className="head"><div><small>CONTAS</small><h2>Utilizadores</h2></div><b>{profiles.length}</b></div>{profiles.map(profile => <article className="row" key={profile.id}><div><strong>{profile.display_name || 'Sem nome'}</strong><span>{profile.city || 'Sem cidade'}</span></div><div className="controls"><select value={roles.find(role => role.user_id === profile.id)?.role || 'user'} onChange={e => void changeRole(profile, e.target.value)}><option>user</option><option>partner</option><option>professional</option><option>moderator</option><option>admin</option></select><select value={profile.account_status} onChange={e => void changeStatus(profile, e.target.value)}><option>active</option><option>suspended</option><option>blocked</option><option>pending_deletion</option></select></div></article>)}</section>}

      {tab === 'revenue' && <section className="panel"><div className="head"><div><small>ASSINATURAS</small><h2>Planos Premium</h2></div><Link href="/assinatura">Checkout →</Link></div>{plans.map(plan => <article className="row" key={plan.id}><div><strong>{plan.name}</strong><span>{plan.interval} · {plan.provider}</span></div><div className="controls"><b>{plan.price == null ? 'Consultar' : `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}</b><button className={plan.active ? 'on' : ''} onClick={() => void togglePlan(plan)}>{plan.active ? 'Activo' : 'Inactivo'}</button></div></article>)}</section>}

      {tab === 'catalog' && <section className="panel"><div className="head"><div><small>LOJA</small><h2>Produtos & suplementos</h2></div><Link href="/admin/loja">Gestão completa →</Link></div>{products.map(product => <article className="row" key={product.id}><div><strong>{product.name}</strong><span>{product.category || 'Sem categoria'} · {product.price == null ? 'Consultar' : `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`}</span></div><button className={product.active ? 'on' : ''} onClick={() => void toggleProduct(product)}>{product.active ? 'Publicado' : 'Oculto'}</button></article>)}</section>}
    </div>
    <style jsx>{styles}</style>
  </main>
}

const styles = `*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(124,58,237,.2),transparent 35%),#070810;color:#fff;font-family:Arial,sans-serif;padding-bottom:80px}.page header{height:78px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:rgba(7,8,16,.92);backdrop-filter:blur(18px);position:sticky;top:0;z-index:5}.page header nav{display:flex;gap:20px}.page header nav a{color:#aeb2c0;font-size:11px}.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5)}.shell{max-width:1180px;margin:auto;padding:55px 24px}.hero small,.panel small,.card small,.loading small{color:#a78bfa;font-size:9px;letter-spacing:.18em;font-weight:900}.hero h1{font-size:clamp(46px,6vw,72px);line-height:.94;letter-spacing:-.06em;margin:12px 0}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:760px;color:#9296a8;line-height:1.7}.tabs{display:flex;gap:6px;margin:34px 0 18px;padding:5px;background:#0c0e17;border:1px solid rgba(255,255,255,.07);border-radius:12px;width:max-content}.tabs button{border:0;background:transparent;color:#777b8e;padding:10px 15px;border-radius:8px;font-size:11px;font-weight:800}.tabs button.active{background:rgba(139,92,246,.2);color:#fff}.grid{display:grid;grid-template-columns:1.6fr .9fr;gap:16px}.grid.four{grid-template-columns:repeat(4,1fr)}.wide{grid-column:1/-1}.panel{background:rgba(14,16,28,.92);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px}.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:16px}.head h2{margin:6px 0 0;font-size:24px}.head a{color:#c4b5fd;font-size:11px}.stat strong{display:block;font-size:38px;margin:12px 0 4px}.stat span{color:#74798d;font-size:10px}.row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 0;border-top:1px solid rgba(255,255,255,.06)}.row strong{display:block;font-size:13px}.row span{display:block;color:#74798d;font-size:10px;margin-top:5px}.controls{display:flex;align-items:center;gap:8px}.controls select,.controls button,.row>button{background:#0a0c14;color:#d9dbe4;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;font-size:10px}.controls button.on,.row>button.on{border-color:rgba(52,211,153,.3);color:#86efac}.links{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:15px}.links a{padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:10px;color:#c4b5fd;font-size:11px;background:#0a0c14}.loading{min-height:100vh;display:grid;place-content:center;text-align:center;padding:24px}.loading h1{font-size:24px;margin:15px 0 7px}.loading p,.card p{color:#808596;font-size:12px}.orb{width:42px;height:42px;margin:0 auto 22px;border-radius:50%;background:linear-gradient(135deg,#a855f7,#4f46e5);box-shadow:0 0 45px rgba(139,92,246,.45);animation:pulse 1.4s infinite}.card{max-width:540px;margin:18vh auto;padding:45px 28px;text-align:center;background:#0c0e17;border:1px solid rgba(255,255,255,.08);border-radius:20px}.card h1{font-size:36px;margin:14px 0}.card a,.card button{display:inline-block;margin-top:18px;color:#c4b5fd;background:transparent;border:0;font-size:12px;cursor:pointer}@keyframes pulse{50%{transform:scale(1.12);opacity:.7}}@media(max-width:900px){.grid.four{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.shell{padding:35px 15px}.grid,.grid.four{grid-template-columns:1fr}.tabs{width:100%;overflow:auto}.row{align-items:flex-start;flex-direction:column}.controls{width:100%}.controls select{flex:1}.links{grid-template-columns:1fr}}`
