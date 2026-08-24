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
    <header><Link href="/admin" className="brand"><img src="/pretreino-logo.svg" alt="PRETREINO"/><span>ADMIN</span></Link><nav><Link href="/dashboard">Plataforma</Link><Link href="/admin/loja">Loja</Link><Link href="/admin/pedidos">Pedidos</Link></nav></header>
    <div className="shell">
      <section className="hero"><div className="eyebrow"><i/> PRETREINO · CENTRO DE COMANDO <b>ONLINE</b></div><h1>Operação <em>central.</em></h1><p>O controlo total do PRETREINO, organizado para decisões rápidas, dados claros e uma experiência administrativa premium.</p><div className="hero-actions"><Link className="primary hero-button" href="/admin/loja">Abrir loja →</Link><Link className="secondary hero-button" href="/dashboard">Ver plataforma</Link></div></section>
      <nav className="tabs">{([['people','Pessoas'],['revenue','Receita'],['catalog','Catálogo'],['partners','Parceiros'],['audit','Auditoria']] as [Tab,string][]).map(([key,label]) => <Link key={key} className={tab === key ? 'active' : ''} href={`/admin/gestao?tab=${key}`}>{label}</Link>)}</nav>
      {tab === 'people' && <section className="grid"><div className="panel"><div className="head"><div><small>UTILIZADORES</small><h2>Controlo de pessoas</h2><span className="muted">Permissões, estado e acesso num só lugar.</span></div><b className="big-number">{profiles.length}</b></div>{profiles.map(profile => <article className="row" key={profile.id}><div className="identity"><span className="avatar">{(profile.display_name || 'S').slice(0,1).toUpperCase()}</span><div><strong>{profile.display_name || 'Sem nome'}</strong><span>{profile.city || 'Sem cidade'}</span></div></div><div className="controls"><form action={changeRole}><input type="hidden" name="id" value={profile.id}/><select name="role" defaultValue={rolesData.find(r => r.user_id === profile.id)?.role || 'user'}><option>user</option><option>partner</option><option>professional</option><option>moderator</option><option>admin</option></select><button>Guardar</button></form><form action={changeStatus}><input type="hidden" name="id" value={profile.id}/><select name="status" defaultValue={profile.account_status}><option>active</option><option>suspended</option><option>blocked</option><option>pending_deletion</option></select><button>Actualizar</button></form></div></article>)}</div><aside className="panel metrics-panel"><div><small>VISÃO GERAL</small><h2>Centro de comando</h2></div><div className="metric-grid"><div><b>{profiles.length}</b><span>utilizadores</span></div><div><b>{rolesData.filter(r => r.role === 'admin').length}</b><span>admins</span></div><div><b>{plans.filter(p => p.active).length}</b><span>planos activos</span></div><div><b>{products.filter(p => p.active).length}</b><span>produtos publicados</span></div></div><Link className="quick" href="/admin">Dashboard administrativo →</Link></aside></section>}
      {tab === 'revenue' && <section className="grid"><div className="panel"><div className="head"><div><small>ASSINATURAS</small><h2>Planos premium</h2><span className="muted">Estrutura de valor do PRETREINO.</span></div><Link href="/assinatura">Checkout →</Link></div><div className="plan-grid">{plans.map((plan, index) => <article className={`plan-card ${index === 1 ? 'featured' : ''}`} key={plan.id}>{index === 1 && <span className="popular">MAIS POPULAR</span>}<small>{plan.name.toUpperCase()}</small><strong>{plan.price == null ? 'Consultar' : `R$ ${Number(plan.price).toFixed(2).replace('.', ',')}`}</strong><span>/{plan.interval === 'year' ? 'ano' : 'mês'} · {plan.provider}</span><div className="check">✓ Gestão pelo administrador</div><form action={togglePlan}><input type="hidden" name="id" value={plan.id}/><input type="hidden" name="active" value={String(plan.active)}/><button className={plan.active ? 'success' : ''}>{plan.active ? 'Activo ✓' : 'Inactivo'}</button></form></article>)}</div></div><aside className="panel"><small>NOVO PLANO</small><h2>Criar</h2><form action={createPlan}><label>Nome<input name="name" placeholder="Premium" required/></label><label>Preço<input name="price" type="number" step="0.01"/></label><label>Intervalo<select name="interval" defaultValue="month"><option value="month">Mensal</option><option value="year">Anual</option></select></label><button className="primary">Criar plano →</button></form></aside></section>}
      {tab === 'catalog' && <section className="grid"><div className="panel"><div className="head"><div><small>LOJA PREMIUM</small><h2>Produtos & suplementos</h2><span className="muted">O que publicares aqui aparece na experiência da loja.</span></div><Link href="/loja">Ver loja →</Link></div><div className="product-grid">{products.map(product => <article className="product-card" key={product.id}><div className="product-image"><span>PRETREINO</span><b>+</b></div><div className="product-body"><small>{product.category || 'Suplementos'}</small><strong>{product.name}</strong><span>{product.price == null ? 'Consultar' : `R$ ${Number(product.price).toFixed(2).replace('.', ',')}`}</span><form action={toggleProduct}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="active" value={String(product.active)}/><button className={product.active ? 'success' : ''}>{product.active ? 'Publicado ✓' : 'Oculto'}</button></form></div></article>)}</div></div><aside className="panel"><small>CADASTRO RÁPIDO</small><h2>Novo produto</h2><form action={createProduct}><label>Nome<input name="name" placeholder="Whey Premium" required/></label><label>Categoria<input name="category" defaultValue="Suplementos"/></label><label>Preço<input name="price" type="number" step="0.01"/></label><button className="primary">Publicar →</button></form><Link className="secondary" href="/admin/loja">Gestão completa →</Link></aside></section>}
      {tab === 'partners' && <section className="grid"><div className="panel"><small>REDE</small><h2>Parceiros profissionais</h2>{professionals.map(partner => <article className="row" key={partner.id}><div className="identity"><span className="avatar">{partner.name.slice(0,1).toUpperCase()}</span><div><strong>{partner.name}</strong><span>{partner.specialty || 'Especialidade não definida'} · {partner.city || 'Sem cidade'}</span></div></div><form action={togglePartner}><input type="hidden" name="id" value={partner.id}/><input type="hidden" name="table" value="professionals"/><input type="hidden" name="active" value={String(partner.active)}/><button className={partner.active ? 'success' : ''}>{partner.active ? 'Activo ✓' : 'Inactivo'}</button></form></article>)}{!professionals.length && <div className="empty">Nenhum profissional cadastrado.</div>}</div><aside className="panel"><small>ACADEMIAS</small><h2>Rede PRETREINO</h2>{gyms.map(partner => <article className="mini" key={partner.id}><div><strong>{partner.name}</strong><span>{partner.city || 'Sem cidade'}</span></div><form action={togglePartner}><input type="hidden" name="id" value={partner.id}/><input type="hidden" name="table" value="gyms"/><input type="hidden" name="active" value={String(partner.active)}/><button className={partner.active ? 'success' : ''}>{partner.active ? 'Activo ✓' : 'Publicar'}</button></form></article>)}{!gyms.length && <div className="empty">Nenhuma academia cadastrada.</div>}</aside></section>}
      {tab === 'audit' && <section className="panel"><div className="head"><div><small>SEGURANÇA</small><h2>Auditoria administrativa</h2><span className="muted">Histórico de alterações e decisões.</span></div><b className="big-number">{audit.length}</b></div>{audit.map(event => <article className="audit" key={event.id}><div><strong>{event.event_type}</strong><span>{event.entity_type || '—'} · {new Date(event.created_at).toLocaleString('pt-BR')}</span></div><code>{JSON.stringify(event.metadata || {})}</code></article>)}{!audit.length && <div className="empty">Ainda não existem eventos.</div>}</section>}
    </div><style>{styles}</style>
  </main>
}
const styles=`*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 80% 0%,rgba(124,58,237,.24),transparent 30%),radial-gradient(circle at 15% 35%,rgba(59,130,246,.08),transparent 25%),#060710;color:#fff;font-family:Inter,Arial,sans-serif;padding-bottom:90px}.page header{height:82px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 5vw;display:flex;align-items:center;justify-content:space-between;background:rgba(6,7,16,.84);backdrop-filter:blur(22px);position:sticky;top:0;z-index:5}.page header nav{display:flex;gap:10px}.page header nav a{color:#a9adbd;font-size:11px;padding:10px 13px;border-radius:9px}.page header nav a:hover{background:rgba(124,58,237,.12);color:#fff}.brand{display:flex;align-items:center;gap:12px;color:#fff;font-weight:900;letter-spacing:.08em}.brand img{width:168px;height:auto;display:block}.brand span{font-size:9px;color:#a78bfa;letter-spacing:.2em;border:1px solid rgba(167,139,250,.25);padding:6px 8px;border-radius:999px}.shell{max-width:1220px;margin:auto;padding:54px 24px}.hero{padding:42px 42px 38px;border:1px solid rgba(255,255,255,.08);border-radius:24px;background:linear-gradient(135deg,rgba(17,19,34,.95),rgba(9,10,20,.94));box-shadow:0 30px 90px rgba(0,0,0,.28);position:relative;overflow:hidden}.hero:after{content:'';position:absolute;right:-120px;top:-180px;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(124,58,237,.24),transparent 68%);pointer-events:none}.eyebrow{display:flex;align-items:center;gap:9px;color:#a78bfa;font-size:9px;letter-spacing:.17em;font-weight:900}.eyebrow i{width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 14px #34d399}.eyebrow b{color:#86efac;font-size:8px;letter-spacing:.12em}.hero h1{font-size:clamp(48px,7vw,82px);line-height:.92;letter-spacing:-.065em;margin:16px 0 14px}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:720px;color:#9296a8;line-height:1.75;font-size:14px}.hero-actions{display:flex;gap:10px;margin-top:24px}.hero-button{display:inline-flex!important;width:auto!important;text-decoration:none}.tabs{display:flex;gap:6px;margin:26px 0 18px;padding:5px;background:#0c0e17;border:1px solid rgba(255,255,255,.07);border-radius:13px;width:max-content;box-shadow:0 15px 40px rgba(0,0,0,.2)}.tabs a{color:#777b8e;padding:11px 17px;border-radius:9px;font-size:10px;font-weight:900}.tabs a.active{background:linear-gradient(90deg,rgba(124,58,237,.34),rgba(79,70,229,.24));color:#fff;box-shadow:inset 0 0 0 1px rgba(167,139,250,.18)}.grid{display:grid;grid-template-columns:1.6fr .9fr;gap:16px}.panel{background:linear-gradient(145deg,rgba(15,17,30,.96),rgba(9,10,19,.96));border:1px solid rgba(255,255,255,.075);border-radius:20px;padding:24px;box-shadow:0 18px 55px rgba(0,0,0,.18)}.head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px}.head h2{margin:7px 0 0;font-size:25px;letter-spacing:-.035em}.head a{color:#c4b5fd;font-size:10px;font-weight:800}.panel small,.hero small{color:#a78bfa;font-size:8px;letter-spacing:.18em;font-weight:900}.muted{display:block;color:#6f7486;font-size:9px;margin-top:6px}.big-number{font-size:28px;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.row{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:14px 0;border-top:1px solid rgba(255,255,255,.055)}.identity{display:flex;align-items:center;gap:11px}.avatar{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,rgba(124,58,237,.32),rgba(59,130,246,.18));border:1px solid rgba(167,139,250,.2);color:#ddd6fe;font-size:11px;font-weight:900}.row strong,.mini strong{display:block;font-size:11px}.row span,.mini span{display:block;color:#74798d;font-size:9px;margin-top:5px}.controls{display:flex;align-items:center;gap:7px}.controls form{display:flex;gap:5px}.controls select,.controls button,.row>form button,.mini button{background:#080a12;color:#d9dbe4;border:1px solid rgba(255,255,255,.1);border-radius:9px;padding:8px 9px;font-size:9px}.controls button:hover,.row>form button:hover,.mini button:hover{border-color:rgba(167,139,250,.5);box-shadow:0 0 18px rgba(124,58,237,.14)}.success{border-color:rgba(52,211,153,.28)!important;color:#86efac!important;background:rgba(16,185,129,.07)!important}.metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.metric-grid div{padding:17px;border:1px solid rgba(255,255,255,.06);border-radius:13px;background:rgba(255,255,255,.018)}.metric-grid b{display:block;font-size:25px}.metric-grid span{display:block;color:#6f7486;font-size:8px;margin-top:5px}.quick,.secondary{display:block;margin-top:18px;color:#c4b5fd;font-size:9px;font-weight:800}.primary{border:0;border-radius:10px;padding:12px 16px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-weight:900;font-size:10px;box-shadow:0 10px 30px rgba(109,40,217,.25);text-align:center}.primary:hover{filter:brightness(1.1);transform:translateY(-1px)}label{display:grid;gap:7px;color:#aeb2bf;font-size:9px;font-weight:800;margin:13px 0}input,select{width:100%;padding:10px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:#080a11;color:#fff;font:inherit}.plan-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.plan-card{position:relative;padding:20px;border-radius:15px;border:1px solid rgba(255,255,255,.08);background:#090b14;min-height:220px}.plan-card.featured{border-color:rgba(139,92,246,.6);box-shadow:0 0 35px rgba(124,58,237,.13)}.plan-card .popular{position:absolute;top:-9px;right:12px;background:linear-gradient(90deg,#a855f7,#4f46e5);padding:5px 8px;border-radius:999px;font-size:7px;font-weight:900}.plan-card>strong{display:block;font-size:29px;margin:16px 0 2px}.plan-card>span{color:#707587;font-size:9px}.check{color:#9ca3af;font-size:8px;margin:18px 0}.plan-card button{width:100%;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:#101321;color:#b9bdc9;padding:10px;font-size:9px;font-weight:800}.plan-card button:hover{border-color:#8b5cf6}.product-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px}.product-card{overflow:hidden;border:1px solid rgba(255,255,255,.07);border-radius:15px;background:#090b14}.product-image{height:130px;background:radial-gradient(circle at 50% 30%,rgba(124,58,237,.26),transparent 50%),linear-gradient(145deg,#111526,#070810);display:grid;place-items:center;position:relative}.product-image span{font-size:12px;font-weight:900;letter-spacing:.18em;color:#ddd6fe}.product-image b{position:absolute;right:10px;top:10px;width:27px;height:27px;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.05);color:#c4b5fd}.product-body{padding:15px}.product-body small{font-size:7px}.product-body strong{display:block;font-size:12px;margin:6px 0}.product-body>span{display:block;font-size:16px;font-weight:900;margin-bottom:12px}.product-body button{width:100%;padding:9px;border-radius:9px;background:#0c0f19;border:1px solid rgba(255,255,255,.08);color:#bfc3d0;font-size:8px;font-weight:900}.mini{display:flex;justify-content:space-between;gap:10px;padding:13px 0;border-top:1px solid rgba(255,255,255,.055)}.audit{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-top:1px solid rgba(255,255,255,.055)}.audit strong{display:block;font-size:10px}.audit span{display:block;color:#707587;font-size:8px;margin-top:4px}.audit code{max-width:55%;overflow:hidden;color:#777b8e;font-size:8px}.empty{padding:35px;text-align:center;border:1px dashed rgba(255,255,255,.12);border-radius:14px;color:#7b8090}@media(max-width:800px){.brand img{width:140px}.brand span{display:none}.page header nav{gap:2px}.page header nav a{font-size:9px;padding:8px}.shell{padding:28px 14px}.hero{padding:30px 22px}.grid{grid-template-columns:1fr}.tabs{width:100%;overflow:auto}.row{align-items:flex-start;flex-direction:column}.controls,.controls form{width:100%}.controls select{flex:1}.plan-grid,.product-grid{grid-template-columns:1fr}.audit{flex-direction:column}.audit code{max-width:100%}.hero-actions{flex-direction:column}.hero-button{width:100%!important;justify-content:center}}`