'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'people' | 'revenue' | 'catalog' | 'partners' | 'audit'
type Profile = { id: string; display_name: string | null; city: string | null; account_status: string }
type Role = { user_id: string; role: string }
type Plan = { id: string; name: string; price: number | null; interval: string; active: boolean; provider: string }
type Product = { id: string; name: string; category: string | null; price: number | null; currency: string; active: boolean }
type Partner = { id: string; name: string; specialty?: string | null; city?: string | null; active: boolean }
type Audit = { id: string; event_type: string; entity_type: string | null; created_at: string; metadata: unknown }
const roles = ['user', 'partner', 'professional', 'moderator', 'admin']

export default function AdminGestaoPage() {
  const [tab, setTab] = useState<Tab>('people')
  const [ready, setReady] = useState<boolean | null>(null)
  const [message, setMessage] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [rolesData, setRolesData] = useState<Role[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [professionals, setProfessionals] = useState<Partner[]>([])
  const [gyms, setGyms] = useState<Partner[]>([])
  const [audit, setAudit] = useState<Audit[]>([])
  const [productName, setProductName] = useState('')
  const [productCategory, setProductCategory] = useState('Suplementos')
  const [productPrice, setProductPrice] = useState('')
  const [planName, setPlanName] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planInterval, setPlanInterval] = useState('month')
  const getClient = () => createClient()

  async function load() {
    setMessage('')
    const client = getClient()
    const { data: auth } = await client.auth.getUser()
    if (!auth.user) { setReady(false); return }
    const { data: admin } = await client.rpc('is_admin', { p_user_id: auth.user.id })
    if (!admin) { setReady(false); return }
    setReady(true)
    const results = await Promise.all([
      client.from('profiles').select('id,display_name,city,account_status').order('created_at', { ascending: false }),
      client.from('user_roles').select('user_id,role'),
      client.from('premium_plans').select('id,name,price,interval,active,provider').order('price'),
      client.from('store_products').select('id,name,category,price,currency,active').order('created_at', { ascending: false }),
      client.from('professionals').select('id,name,specialty,city,active').order('created_at', { ascending: false }),
      client.from('gyms').select('id,name,city,active').order('created_at', { ascending: false }),
      client.from('admin_events').select('id,event_type,entity_type,created_at,metadata').order('created_at', { ascending: false }).limit(80),
    ])
    setProfiles((results[0].data || []) as Profile[])
    setRolesData((results[1].data || []) as Role[])
    setPlans((results[2].data || []) as Plan[])
    setProducts((results[3].data || []) as Product[])
    setProfessionals((results[4].data || []) as Partner[])
    setGyms((results[5].data || []) as Partner[])
    setAudit((results[6].data || []) as Audit[])
  }
  useEffect(() => { void load() }, [])

  async function log(eventType: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
    const client = getClient()
    const { data } = await client.auth.getUser()
    if (!data.user) return
    await client.from('admin_events').insert({ admin_user_id: data.user.id, event_type: eventType, entity_type: entityType, entity_id: entityId || null, metadata })
  }
  async function changeRole(id: string, value: string) {
    const client = getClient()
    await client.from('user_roles').delete().eq('user_id', id)
    await client.from('user_roles').insert({ user_id: id, role: value })
    await log('role_changed', 'user_role', id, { role: value }); await load()
  }
  async function changeStatus(id: string, value: string) {
    const client = getClient()
    const { error } = await client.from('profiles').update({ account_status: value }).eq('id', id)
    if (error) { setMessage('Não foi possível actualizar o utilizador.'); return }
    await log('account_status_changed', 'profile', id, { status: value }); await load()
  }
  async function createPlan() {
    if (!planName.trim()) return
    const client = getClient()
    const { error } = await client.from('premium_plans').insert({ name: planName.trim(), price: planPrice === '' ? null : Number(planPrice), currency: 'BRL', interval: planInterval, active: true, provider: 'mercadopago' })
    if (error) { setMessage('Não foi possível criar o plano.'); return }
    setPlanName(''); setPlanPrice(''); await log('plan_created', 'premium_plan'); await load()
  }
  async function togglePlan(plan: Plan) {
    const client = getClient()
    await client.from('premium_plans').update({ active: !plan.active }).eq('id', plan.id)
    await log('plan_status_changed', 'premium_plan', plan.id, { active: !plan.active }); await load()
  }
  async function createProduct() {
    if (!productName.trim()) return
    const client = getClient()
    const { error } = await client.from('store_products').insert({ name: productName.trim(), category: productCategory, price: productPrice === '' ? null : Number(productPrice), currency: 'BRL', active: true })
    if (error) { setMessage('Não foi possível criar o produto.'); return }
    setProductName(''); setProductPrice(''); await log('product_created', 'store_product'); await load()
  }
  async function toggleProduct(product: Product) {
    const client = getClient()
    await client.from('store_products').update({ active: !product.active }).eq('id', product.id)
    await log('product_status_changed', 'store_product', product.id, { active: !product.active }); await load()
  }
  async function togglePartner(table: 'professionals' | 'gyms', partner: Partner) {
    const client = getClient()
    await client.from(table).update({ active: !partner.active }).eq('id', partner.id)
    await log('partner_status_changed', table, partner.id, { active: !partner.active }); await load()
  }

  if (ready === null) return <main className="page"><div className="center">A verificar o centro de comando...</div><style jsx>{styles}</style></main>
  if (!ready) return <main className="page"><div className="denied"><small>PRETREINO ADMIN</small><h1>Acesso reservado.</h1><p>Entre com a conta administrativa.</p><Link href="/login">Entrar →</Link></div><style jsx>{styles}</style></main>

  return <main className="page"><header><Link href="/admin" className="brand"><span>P</span> PRETREINO ADMIN</Link><nav><Link href="/dashboard">Plataforma</Link><Link href="/admin/loja">Loja</Link></nav></header><div className="shell"><section className="hero"><small>PRETREINO · CONTROLO TOTAL</small><h1>Operação <em>central.</em></h1><p>O centro de comando para pessoas, receita, catálogo, parceiros e actividade do PRETREINO.</p></section><div className="tabs">{([['people','Pessoas'],['revenue','Receita'],['catalog','Catálogo'],['partners','Parceiros'],['audit','Auditoria']] as [Tab,string][]).map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</div>{message && <div className="message">{message}</div>}
  {tab === 'people' && <section className="grid"><div className="panel"><div className="head"><div><small>CONTAS</small><h2>Utilizadores</h2></div><b>{profiles.length}</b></div>{profiles.map(profile => <article className="row" key={profile.id}><div><strong>{profile.display_name || 'Sem nome'}</strong><span>{profile.city || 'Sem cidade'}</span></div><div className="controls"><select value={rolesData.find(role => role.user_id === profile.id)?.role || 'user'} onChange={event => void changeRole(profile.id, event.target.value)}>{roles.map(role => <option key={role}>{role}</option>)}</select><select value={profile.account_status} onChange={event => void changeStatus(profile.id, event.target.value)}><option>active</option><option>suspended</option><option>blocked</option><option>pending_deletion</option></select></div></article>)}</div><aside className="panel"><small>RESUMO</small><h2>Controlo</h2><div className="stat"><b>{profiles.length}</b><span>utilizadores</span></div><div className="stat"><b>{rolesData.filter(role => role.role === 'admin').length}</b><span>admins</span></div></aside></section>}
  {tab === 'revenue' && <section className="grid"><div className="panel"><div className="head"><div><small>PLANOS</small><h2>Assinaturas</h2></div><Link href="/assinatura">Checkout →</Link></div>{plans.map(plan => <article className="row" key={plan.id}><div><strong>{plan.name}</strong><span>{plan.interval} · {plan.provider}</span></div><div className="controls"><b>{plan.price == null ? 'Consultar' : `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}</b><button className={plan.active ? 'on' : ''} onClick={() => void togglePlan(plan)}>{plan.active ? 'Activo' : 'Inactivo'}</button></div></article>)}</div><aside className="panel"><small>NOVO PLANO</small><h2>Criar</h2><label>Nome<input value={planName} onChange={event => setPlanName(event.target.value)} placeholder="Pro" /></label><label>Preço<input type="number" value={planPrice} onChange={event => setPlanPrice(event.target.value)} /></label><label>Intervalo<select value={planInterval} onChange={event => setPlanInterval(event.target.value)}><option value="month">Mensal</option><option value="year">Anual</option></select></label><button className="primary" onClick={() => void createPlan()}>Criar plano →</button></aside></section>}
  {tab === 'catalog' && <section className="grid"><div className="panel"><div className="head"><div><small>LOJA</small><h2>Produtos & suplementos</h2></div><Link href="/loja">Loja →</Link></div>{products.map(product => <article className="row" key={product.id}><div><strong>{product.name}</strong><span>{product.category || 'Sem categoria'} · {product.price == null ? 'Consultar' : `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`}</span></div><button className={product.active ? 'on' : ''} onClick={() => void toggleProduct(product)}>{product.active ? 'Publicado' : 'Oculto'}</button></article>)}</div><aside className="panel"><small>CADASTRO RÁPIDO</small><h2>Novo produto</h2><label>Nome<input value={productName} onChange={event => setProductName(event.target.value)} placeholder="Whey Premium" /></label><label>Categoria<input value={productCategory} onChange={event => setProductCategory(event.target.value)} /></label><label>Preço<input type="number" value={productPrice} onChange={event => setProductPrice(event.target.value)} /></label><button className="primary" onClick={() => void createProduct()}>Publicar →</button><Link className="secondary" href="/admin/loja">Gestão completa →</Link></aside></section>}
  {tab === 'partners' && <section className="grid"><div className="panel"><small>PROFISSIONAIS</small><h2>Parceiros profissionais</h2>{professionals.map(partner => <article className="row" key={partner.id}><div><strong>{partner.name}</strong><span>{partner.specialty || 'Especialidade não definida'} · {partner.city || 'Sem cidade'}</span></div><button className={partner.active ? 'on' : ''} onClick={() => void togglePartner('professionals', partner)}>{partner.active ? 'Activo' : 'Inactivo'}</button></article>)}{!professionals.length && <div className="empty">Nenhum profissional cadastrado.</div>}</div><aside className="panel"><small>ACADEMIAS</small><h2>Rede</h2>{gyms.map(partner => <article className="mini" key={partner.id}><strong>{partner.name}</strong><span>{partner.city || 'Sem cidade'}</span><button onClick={() => void togglePartner('gyms', partner)}>{partner.active ? 'Ocultar' : 'Publicar'}</button></article>)}{!gyms.length && <div className="empty">Nenhuma academia cadastrada.</div>}</aside></section>}
  {tab === 'audit' && <section className="panel"><div className="head"><div><small>SEGURANÇA</small><h2>Auditoria administrativa</h2></div><b>{audit.length}</b></div>{audit.map(event => <article className="audit" key={event.id}><div><strong>{event.event_type}</strong><span>{event.entity_type || '—'} · {new Date(event.created_at).toLocaleString('pt-BR')}</span></div><code>{JSON.stringify(event.metadata || {})}</code></article>)}{!audit.length && <div className="empty">Ainda não existem eventos.</div>}</section>}
  </div><style jsx>{styles}</style></main>
}
const styles = `*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(124,58,237,.2),transparent 35%),#070810;color:#fff;font-family:Arial,sans-serif;padding-bottom:80px}.page header{height:78px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:rgba(7,8,16,.9);backdrop-filter:blur(18px);position:sticky;top:0;z-index:5}.page header nav{display:flex;gap:20px}.page header nav a{color:#aeb2c0;font-size:11px}.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5)}.shell{max-width:1180px;margin:auto;padding:55px 24px}.hero small,.panel small{color:#a78bfa;font-size:9px;letter-spacing:.18em;font-weight:900}.hero h1{font-size:clamp(46px,6vw,72px);line-height:.94;letter-spacing:-.06em;margin:12px 0}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:760px;color:#9296a8;line-height:1.7}.tabs{display:flex;gap:6px;margin:34px 0 18px;padding:5px;background:#0c0e17;border:1px solid rgba(255,255,255,.07);border-radius:12px;width:max-content}.tabs button{border:0;background:transparent;color:#777b8e;padding:10px 15px;border-radius:8px;font-size:11px;font-weight:800}.tabs button.active{background:rgba(139,92,246,.2);color:#fff}.message{padding:12px;border:1px solid rgba(251,191,36,.2);color:#d6b45a;background:rgba(251,191,36,.05);border-radius:10px;font-size:11px;margin-bottom:14px}.grid{display:grid;grid-template-columns:1fr 330px;gap:14px}.panel{background:#0c0e17;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:23px}.head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px}.panel h2{font-size:24px;margin:8px 0 18px}.head>b{color:#777b8e;font-size:12px}.head a{color:#c4b5fd;font-size:10px}.row{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:14px 0;border-top:1px solid rgba(255,255,255,.06)}.row strong{display:block;font-size:12px}.row span{display:block;color:#707587;font-size:9px;margin-top:4px}.controls{display:flex;gap:7px;align-items:center}.controls select,.controls button,.row>button,.mini button{border:1px solid rgba(255,255,255,.08);background:#080a11;color:#bfc2ce;border-radius:8px;padding:8px;font-size:9px}.on{color:#86efac!important;border-color:rgba(52,211,153,.2)!important}.stat{padding:14px 0;border-top:1px solid rgba(255,255,255,.06)}.stat b{display:block;font-size:28px}.stat span{color:#707587;font-size:9px}label{display:grid;gap:7px;color:#aeb2bf;font-size:10px;font-weight:800;margin:13px 0}input,select{width:100%;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:#080a11;color:#fff;font:inherit}.primary{width:100%;border:0;border-radius:10px;padding:12px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-weight:900;font-size:11px;margin-top:10px}.secondary{display:block;text-align:center;margin-top:12px;color:#c4b5fd;font-size:10px}.mini{display:grid;grid-template-columns:1fr auto;gap:4px;padding:13px 0;border-top:1px solid rgba(255,255,255,.06)}.mini strong{font-size:11px}.mini span{font-size:9px;color:#707587}.mini button{grid-row:1/3;grid-column:2}.audit{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-top:1px solid rgba(255,255,255,.06)}.audit strong{display:block;font-size:10px}.audit span{display:block;color:#707587;font-size:8px;margin-top:4px}.audit code{max-width:55%;overflow:hidden;color:#777b8e;font-size:8px}.empty,.center,.denied{padding:45px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:18px;color:#7b8090}.denied{max-width:500px;margin:18vh auto;background:#0c0e17}.denied small{color:#a78bfa}.denied h1{color:#fff}@media(max-width:800px){.grid{grid-template-columns:1fr}.tabs{width:100%;overflow:auto}.row{align-items:flex-start;flex-direction:column}.controls{width:100%}.controls select{flex:1}.audit{flex-direction:column}.audit code{max-width:100%}}`
