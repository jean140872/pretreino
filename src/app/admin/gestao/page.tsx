import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Tab = 'people' | 'revenue' | 'catalog' | 'partners' | 'audit'
type Profile = { id: string; display_name: string | null; city: string | null; account_status: string }
type Role = { user_id: string; role: string }
type Plan = { id: string; name: string; price: number | null; interval: string; active: boolean; provider: string }
type Product = { id: string; name: string; category: string | null; price: number | null; currency: string; active: boolean }
type Partner = { id: string; name: string; specialty?: string | null; city?: string | null; active: boolean }
type Audit = { id: string; event_type: string; entity_type: string | null; created_at: string; metadata: unknown }
const roles = ['user', 'partner', 'professional', 'moderator', 'admin'] as const

async function adminClient() {
  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')
  const { data: isAdmin, error } = await supabase.rpc('is_admin', { p_user_id: auth.user.id })
  if (error || !isAdmin) redirect('/admin')
  return { supabase, userId: auth.user.id }
}

async function auditLog(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, eventType: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
  await supabase.from('admin_events').insert({ admin_user_id: userId, event_type: eventType, entity_type: entityType, entity_id: entityId || null, metadata })
}

async function changeRole(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const role = String(formData.get('role') || 'user')
  if (!id || !roles.includes(role as (typeof roles)[number])) return
  const { supabase, userId } = await adminClient()
  await supabase.from('user_roles').delete().eq('user_id', id)
  await supabase.from('user_roles').insert({ user_id: id, role })
  await auditLog(supabase, userId, 'role_changed', 'user_role', id, { role })
  revalidatePath('/admin/gestao')
}

async function changeStatus(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const status = String(formData.get('status') || 'active')
  if (!id || !['active', 'suspended', 'blocked', 'pending_deletion'].includes(status)) return
  const { supabase, userId } = await adminClient()
  await supabase.from('profiles').update({ account_status: status }).eq('id', id)
  await auditLog(supabase, userId, 'account_status_changed', 'profile', id, { status })
  revalidatePath('/admin/gestao')
}

async function togglePlan(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const active = String(formData.get('active')) === 'true'
  const { supabase, userId } = await adminClient()
  await supabase.from('premium_plans').update({ active: !active }).eq('id', id)
  await auditLog(supabase, userId, 'plan_status_changed', 'premium_plan', id, { active: !active })
  revalidatePath('/admin/gestao')
}

async function createPlan(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const priceRaw = String(formData.get('price') || '').trim()
  const interval = String(formData.get('interval') || 'month')
  if (!name || !['month', 'year'].includes(interval)) return
  const { supabase, userId } = await adminClient()
  const { data } = await supabase.from('premium_plans').insert({ name, price: priceRaw ? Number(priceRaw) : null, currency: 'BRL', interval, active: true, provider: 'mercadopago' }).select('id').single()
  await auditLog(supabase, userId, 'plan_created', 'premium_plan', data?.id, { name, price: priceRaw || null, interval })
  revalidatePath('/admin/gestao')
}

async function toggleProduct(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const active = String(formData.get('active')) === 'true'
  const { supabase, userId } = await adminClient()
  await supabase.from('store_products').update({ active: !active }).eq('id', id)
  await auditLog(supabase, userId, 'product_status_changed', 'store_product', id, { active: !active })
  revalidatePath('/admin/gestao')
  revalidatePath('/loja')
}

async function createProduct(formData: FormData) {
  'use server'
  const name = String(formData.get('name') || '').trim()
  const category = String(formData.get('category') || 'Suplementos').trim()
  const priceRaw = String(formData.get('price') || '').trim()
  if (!name) return
  const { supabase, userId } = await adminClient()
  const { data } = await supabase.from('store_products').insert({ name, category, price: priceRaw ? Number(priceRaw) : null, currency: 'BRL', active: true }).select('id').single()
  await auditLog(supabase, userId, 'product_created', 'store_product', data?.id, { name, category, price: priceRaw || null })
  revalidatePath('/admin/gestao')
  revalidatePath('/loja')
}

async function togglePartner(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const table = String(formData.get('table') || '')
  const active = String(formData.get('active')) === 'true'
  if (!id || !['professionals', 'gyms'].includes(table)) return
  const { supabase, userId } = await adminClient()
  await supabase.from(table).update({ active: !active }).eq('id', id)
  await auditLog(supabase, userId, 'partner_status_changed', table, id, { active: !active })
  revalidatePath('/admin/gestao')
}

export default async function AdminGestaoPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams
  const tab = (['people', 'revenue', 'catalog', 'partners', 'audit'].includes(params.tab || '') ? params.tab : 'people') as Tab
  const { supabase } = await adminClient()
  const [profilesResult, rolesResult, plansResult, productsResult, professionalsResult, gymsResult, auditResult] = await Promise.all([
    supabase.from('profiles').select('id,display_name,city,account_status').order('created_at', { ascending: false }),
    supabase.from('user_roles').select('user_id,role'),
    supabase.from('premium_plans').select('id,name,price,interval,active,provider').order('price'),
    supabase.from('store_products').select('id,name,category,price,currency,active').order('created_at', { ascending: false }),
    supabase.from('professionals').select('id,name,specialty,city,active').order('created_at', { ascending: false }),
    supabase.from('gyms').select('id,name,city,active').order('created_at', { ascending: false }),
    supabase.from('admin_events').select('id,event_type,entity_type,created_at,metadata').order('created_at', { ascending: false }).limit(80),
  ])
  const profiles = (profilesResult.data || []) as Profile[]
  const rolesData = (rolesResult.data || []) as Role[]
  const plans = (plansResult.data || []) as Plan[]
  const products = (productsResult.data || []) as Product[]
  const professionals = (professionalsResult.data || []) as Partner[]
  const gyms = (gymsResult.data || []) as Partner[]
  const audit = (auditResult.data || []) as Audit[]
  return <main className="page">
    <header><Link href="/admin" className="brand"><span>P</span> PRETREINO ADMIN</Link><nav><Link href="/dashboard">Plataforma</Link><Link href="/admin/loja">Loja</Link><Link href="/admin/pedidos">Pedidos</Link></nav></header>
    <div className="shell">
      <section className="hero"><small>PRETREINO · CONTROLO TOTAL</small><h1>Operação <em>central.</em></h1><p>Centro de comando do PRETREINO. A autenticação acontece no servidor para que o painel não fique preso no carregamento.</p></section>
      <nav className="tabs">{([['people','Pessoas'],['revenue','Receita'],['catalog','Catálogo'],['partners','Parceiros'],['audit','Auditoria']] as [Tab,string][]).map(([key,label]) => <Link key={key} className={tab === key ? 'active' : ''} href={`/admin/gestao?tab=${key}`}>{label}</Link>)}</nav>
      {tab === 'people' && <section className="grid"><div className="panel"><div className="head"><div><small>CONTAS</small><h2>Utilizadores</h2></div><b>{profiles.length}</b></div>{profiles.map(profile => <article className="row" key={profile.id}><div><strong>{profile.display_name || 'Sem nome'}</strong><span>{profile.city || 'Sem cidade'}</span></div><div className="controls"><form action={changeRole}><input type="hidden" name="id" value={profile.id}/><select name="role" defaultValue={rolesData.find(r => r.user_id === profile.id)?.role || 'user'}><option>user</option><option>partner</option><option>professional</option><option>moderator</option><option>admin</option></select><button>Guardar</button></form><form action={changeStatus}><input type="hidden" name="id" value={profile.id}/><select name="status" defaultValue={profile.account_status}><option>active</option><option>suspended</option><option>blocked</option><option>pending_deletion</option></select><button>Actualizar</button></form></div></article>)}</div><aside className="panel"><small>RESUMO</small><h2>Controlo</h2><div className="stat"><b>{profiles.length}</b><span>utilizadores</span></div><div className="stat"><b>{rolesData.filter(r => r.role === 'admin').length}</b><span>admins</span></div><Link className="quick" href="/admin">Centro administrativo →</Link></aside></section>}
      {tab === 'revenue' && <section className="grid"><div className="panel"><div className="head"><div><small>PLANOS</small><h2>Assinaturas</h2></div><Link href="/assinatura">Checkout →</Link></div>{plans.map(plan => <article className="row" key={plan.id}><div><strong>{plan.name}</strong><span>{plan.interval} · {plan.provider}</span></div><div className="controls"><b>{plan.price == null ? 'Consultar' : `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}</b><form action={togglePlan}><input type="hidden" name="id" value={plan.id}/><input type="hidden" name="active" value={String(plan.active)}/><button className={plan.active ? 'on' : ''}>{plan.active ? 'Activo' : 'Inactivo'}</button></form></div></article>)}</div><aside className="panel"><small>NOVO PLANO</small><h2>Criar</h2><form action={createPlan}><label>Nome<input name="name" placeholder="Pro" required/></label><label>Preço<input name="price" type="number" step="0.01"/></label><label>Intervalo<select name="interval" defaultValue="month"><option value="month">Mensal</option><option value="year">Anual</option></select></label><button className="primary">Criar plano →</button></form></aside></section>}
      {tab === 'catalog' && <section className="grid"><div className="panel"><div className="head"><div><small>LOJA</small><h2>Produtos & suplementos</h2></div><Link href="/loja">Loja →</Link></div>{products.map(product => <article className="row" key={product.id}><div><strong>{product.name}</strong><span>{product.category || 'Sem categoria'} · {product.price == null ? 'Consultar' : `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`}</span></div><form action={toggleProduct}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="active" value={String(product.active)}/><button className={product.active ? 'on' : ''}>{product.active ? 'Publicado' : 'Oculto'}</button></form></article>)}</div><aside className="panel"><small>CADASTRO RÁPIDO</small><h2>Novo produto</h2><form action={createProduct}><label>Nome<input name="name" placeholder="Whey Premium" required/></label><label>Categoria<input name="category" defaultValue="Suplementos"/></label><label>Preço<input name="price" type="number" step="0.01"/></label><button className="primary">Publicar →</button></form><Link className="secondary" href="/admin/loja">Gestão completa →</Link></aside></section>}
      {tab === 'partners' && <section className="grid"><div className="panel"><small>PROFISSIONAIS</small><h2>Parceiros profissionais</h2>{professionals.map(partner => <article className="row" key={partner.id}><div><strong>{partner.name}</strong><span>{partner.specialty || 'Especialidade não definida'} · {partner.city || 'Sem cidade'}</span></div><form action={togglePartner}><input type="hidden" name="id" value={partner.id}/><input type="hidden" name="table" value="professionals"/><input type="hidden" name="active" value={String(partner.active)}/><button className={partner.active ? 'on' : ''}>{partner.active ? 'Activo' : 'Inactivo'}</button></form></article>)}{!professionals.length && <div className="empty">Nenhum profissional cadastrado.</div>}</div><aside className="panel"><small>ACADEMIAS</small><h2>Rede</h2>{gyms.map(partner => <article className="mini" key={partner.id}><div><strong>{partner.name}</strong><span>{partner.city || 'Sem cidade'}</span></div><form action={togglePartner}><input type="hidden" name="id" value={partner.id}/><input type="hidden" name="table" value="gyms"/><input type="hidden" name="active" value={String(partner.active)}/><button>{partner.active ? 'Ocultar' : 'Publicar'}</button></form></article>)}{!gyms.length && <div className="empty">Nenhuma academia cadastrada.</div>}</aside></section>}
      {tab === 'audit' && <section className="panel"><div className="head"><div><small>SEGURANÇA</small><h2>Auditoria administrativa</h2></div><b>{audit.length}</b></div>{audit.map(event => <article className="audit" key={event.id}><div><strong>{event.event_type}</strong><span>{event.entity_type || '—'} · {new Date(event.created_at).toLocaleString('pt-BR')}</span></div><code>{JSON.stringify(event.metadata || {})}</code></article>)}{!audit.length && <div className="empty">Ainda não existem eventos.</div>}</section>}
    </div><style>{styles}</style>
  </main>
}
const styles=`*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(124,58,237,.2),transparent 35%),#070810;color:#fff;font-family:Arial,sans-serif;padding-bottom:80px}.page header{height:78px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:rgba(7,8,16,.92);backdrop-filter:blur(18px);position:sticky;top:0;z-index:5}.page header nav{display:flex;gap:20px}.page header nav a{color:#aeb2c0;font-size:11px}.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5)}.shell{max-width:1180px;margin:auto;padding:55px 24px}.hero small,.panel small{color:#a78bfa;font-size:9px;letter-spacing:.18em;font-weight:900}.hero h1{font-size:clamp(46px,6vw,72px);line-height:.94;letter-spacing:-.06em;margin:12px 0}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:760px;color:#9296a8;line-height:1.7}.tabs{display:flex;gap:6px;margin:34px 0 18px;padding:5px;background:#0c0e17;border:1px solid rgba(255,255,255,.07);border-radius:12px;width:max-content}.tabs a{color:#777b8e;padding:10px 15px;border-radius:8px;font-size:11px;font-weight:800}.tabs a.active{background:rgba(139,92,246,.2);color:#fff}.grid{display:grid;grid-template-columns:1.6fr .9fr;gap:16px}.panel{background:rgba(14,16,28,.92);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px}.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:16px}.head h2{margin:6px 0 0;font-size:24px}.head a{color:#c4b5fd;font-size:11px}.row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:15px 0;border-top:1px solid rgba(255,255,255,.06)}.row strong{display:block;font-size:13px}.row span,.mini span{display:block;color:#74798d;font-size:10px;margin-top:5px}.controls{display:flex;align-items:center;gap:8px}.controls form{display:flex;gap:6px}.controls select,.controls button,.row>form button,.mini button{background:#0a0c14;color:#d9dbe4;border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:8px;font-size:10px}.controls button.on,.row>form button.on{border-color:rgba(52,211,153,.3);color:#86efac}.stat{padding:14px 0;border-top:1px solid rgba(255,255,255,.06)}.stat b{display:block;font-size:28px}.stat span{color:#707587;font-size:9px}.quick,.secondary{display:block;margin-top:18px;color:#c4b5fd;font-size:10px}.primary{width:100%;border:0;border-radius:10px;padding:12px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-weight:900;font-size:11px;margin-top:10px}label{display:grid;gap:7px;color:#aeb2bf;font-size:10px;font-weight:800;margin:13px 0}input,select{width:100%;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:#080a11;color:#fff;font:inherit}.mini{display:flex;justify-content:space-between;gap:10px;padding:13px 0;border-top:1px solid rgba(255,255,255,.06)}.audit{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-top:1px solid rgba(255,255,255,.06)}.audit strong{display:block;font-size:10px}.audit span{display:block;color:#707587;font-size:8px;margin-top:4px}.audit code{max-width:55%;overflow:hidden;color:#777b8e;font-size:8px}.empty{padding:35px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:14px;color:#7b8090}@media(max-width:800px){.grid{grid-template-columns:1fr}.tabs{width:100%;overflow:auto}.row{align-items:flex-start;flex-direction:column}.controls,.controls form{width:100%}.controls select{flex:1}.audit{flex-direction:column}.audit code{max-width:100%}}`