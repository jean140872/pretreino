'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Metrics = {
  total_users: number
  fitness_profiles: number
  measurements: number
  training_plans: number
  workout_sessions: number
  nutrition_plans: number
  ai_conversations: number
  community_posts: number
  active_products: number
  active_subscriptions: number
}

type Module = { title: string; eyebrow: string; description: string; href: string; metric?: keyof Metrics; value?: string; tone?: string }

export default function AdminPage() {
  const [m, setM] = useState<Metrics | null>(null)
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const supabase = createClient()
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) { setAllowed(false); return }
      const { data: a } = await supabase.rpc('is_admin', { p_user_id: u.user.id })
      if (!a) { setAllowed(false); return }
      setAllowed(true)
      const { data } = await supabase.from('admin_platform_metrics').select('*').single()
      setM(data as Metrics)
    })()
  }, [])

  if (allowed === null) return <main className="page"><div className="empty">A verificar acesso administrativo...</div><style jsx>{css}</style></main>
  if (!allowed) return <main className="page"><div className="empty"><small>PRETREINO ADMIN</small><strong>Acesso reservado.</strong><p>Esta área está disponível apenas para administradores autorizados.</p><Link href="/dashboard">Voltar para Dashboard →</Link></div><style jsx>{css}</style></main>

  const modules: Module[] = [
    { title: 'Utilizadores', eyebrow: 'PESSOAS', description: 'Visão dos utilizadores, perfis e actividade geral da plataforma.', href: '#utilizadores', metric: 'total_users' },
    { title: 'Assinaturas & pagamentos', eyebrow: 'RECEITA', description: 'Planos, estado das assinaturas e entrada para o fluxo de checkout.', href: '/assinatura', metric: 'active_subscriptions' },
    { title: 'Loja & suplementos', eyebrow: 'COMERCIAL', description: 'Catálogo, produtos publicados, preços e links de afiliados.', href: '/admin/loja', metric: 'active_products' },
    { title: 'Treino', eyebrow: 'PRODUTO', description: 'Aceda à experiência de treino e acompanhe a operação dos planos.', href: '/treino', metric: 'training_plans' },
    { title: 'Nutrição', eyebrow: 'PRODUTO', description: 'Área de alimentação e planos nutricionais dos utilizadores.', href: '/nutricao', metric: 'nutrition_plans' },
    { title: 'PRETREINO IA', eyebrow: 'INTELIGÊNCIA', description: 'Experiência de IA e conversas persistidas da plataforma.', href: '/ia', metric: 'ai_conversations' },
    { title: 'Comunidade', eyebrow: 'ENGAGEMENT', description: 'Feed e publicações da comunidade PRETREINO.', href: '/comunidade', metric: 'community_posts' },
    { title: 'Evolução & medições', eyebrow: 'RESULTADOS', description: 'Histórico de evolução e medições registadas pelos utilizadores.', href: '/evolucao', metric: 'measurements' },
    { title: 'Perfil fitness', eyebrow: 'PERSONALIZAÇÃO', description: 'Perfis, objectivos e dados base para personalização.', href: '/perfil-fitness', metric: 'fitness_profiles' },
    { title: 'Identidade visual', eyebrow: 'MARCA', description: 'Personalização visual da experiência do utilizador.', href: '/identidade-visual' },
    { title: 'Academias', eyebrow: 'PARCEIROS', description: 'Directório de academias e oportunidades locais.', href: '/academias' },
    { title: 'Profissionais', eyebrow: 'PARCEIROS', description: 'Directório de profissionais e oportunidades comerciais.', href: '/profissionais' },
  ]

  return <main className="page">
    <header className="topbar">
      <Link href="/dashboard" className="brand"><span>P</span> PRETREINO</Link>
      <div className="top-actions"><small>PAINEL ADMINISTRATIVO · CONTROLO CENTRAL</small><Link href="/dashboard">Abrir plataforma →</Link></div>
    </header>

    <div className="shell">
      <section className="hero">
        <div><small className="eyebrow">PRETREINO ADMIN · CENTRO DE COMANDO</small><h1>O teu <em>painel.</em><br/>A tua plataforma.</h1><p>Todos os principais módulos do PRETREINO reunidos num único centro de operação. Da receita aos produtos, utilizadores, IA, treino, nutrição e comunidade.</p></div>
        <div className="hero-status"><i/>Sistema online<strong>Controlo administrativo activo</strong><span>Sem alterar as experiências aprovadas do utilizador.</span></div>
      </section>

      <section className="kpis" id="utilizadores">
        {m && <>
          <article><small>UTILIZADORES</small><strong>{m.total_users}</strong><span>contas na plataforma</span></article>
          <article><small>ASSINATURAS ACTIVAS</small><strong>{m.active_subscriptions}</strong><span>subscrições em curso</span></article>
          <article><small>PRODUTOS ACTIVOS</small><strong>{m.active_products}</strong><span>itens na Loja</span></article>
          <article><small>CONVERSAS IA</small><strong>{m.ai_conversations}</strong><span>conversas registadas</span></article>
        </>}
      </section>

      <section className="section-head"><div><small className="eyebrow">CONTROLO DA PLATAFORMA</small><h2>Tudo o que já construímos, num só lugar.</h2><p>Os módulos abaixo preservam as páginas e fluxos que já foram aprovados. O painel passa a ser a porta central para gerir e acompanhar cada frente do produto.</p></div><Link className="primary" href="/admin/loja">Gerir Loja →</Link></section>

      <section className="modules">
        {modules.map((mod) => <Link href={mod.href} className="module" key={mod.title}>
          <div className="module-icon">✦</div><div className="module-body"><small>{mod.eyebrow}</small><h3>{mod.title}</h3><p>{mod.description}</p></div>
          <div className="module-side">{mod.metric && m ? <><strong>{m[mod.metric]}</strong><span>registos</span></> : <span className="open">Abrir</span>}<b>→</b></div>
        </Link>)}
      </section>

      <section className="commerce">
        <div><small className="eyebrow">ÁREA COMERCIAL</small><h2>Receita sempre à vista.</h2><p>Os caminhos de compra ficam acessíveis no painel para que a operação do PRETREINO não fique separada do produto.</p></div>
        <div className="commerce-links"><Link href="/assinatura">Planos & assinatura →</Link><Link href="/admin/loja">Produtos & suplementos →</Link><Link href="/loja">Ver Loja →</Link></div>
      </section>

      <footer><span>PRETREINO ADMIN</span><Link href="/dashboard">Voltar à plataforma</Link></footer>
    </div>
    <style jsx>{css}</style>
  </main>
}

const css = `*{box-sizing:border-box}.page{min-height:100vh;background:radial-gradient(circle at 78% 0%,rgba(124,58,237,.18),transparent 32%),radial-gradient(circle at 8% 35%,rgba(59,130,246,.06),transparent 28%),#070810;color:#fff;font-family:Arial,sans-serif;padding-bottom:80px}.topbar{height:78px;border-bottom:1px solid rgba(255,255,255,.07);padding:0 5vw;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:5;background:rgba(7,8,16,.88);backdrop-filter:blur(18px)}.brand{display:flex;align-items:center;gap:10px;color:#fff;font-weight:900;letter-spacing:.08em}.brand span{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5);box-shadow:0 8px 25px rgba(124,58,237,.3)}.top-actions{display:flex;align-items:center;gap:22px}.top-actions small{color:#777b8e;font-size:9px;letter-spacing:.14em;font-weight:900}.top-actions a{color:#c4b5fd;font-size:11px;font-weight:800}.shell{max-width:1180px;margin:auto;padding:54px 24px}.hero{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;padding:25px 0 45px}.eyebrow{color:#a78bfa;font-size:9px;letter-spacing:.18em;font-weight:900}.hero h1{font-size:clamp(44px,6vw,72px);line-height:.94;letter-spacing:-.065em;margin:14px 0}.hero em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;color:transparent}.hero p{max-width:680px;color:#9296a8;line-height:1.75;font-size:14px}.hero-status{min-width:270px;padding:20px;border:1px solid rgba(255,255,255,.08);border-radius:18px;background:linear-gradient(145deg,rgba(124,58,237,.12),#0c0e17);color:#a5a9b8;font-size:11px}.hero-status i{display:inline-block;width:7px;height:7px;background:#34d399;border-radius:50%;margin-right:8px;box-shadow:0 0 14px #34d399}.hero-status strong{display:block;color:#fff;margin:12px 0 6px;font-size:14px}.hero-status span{color:#666b7c;font-size:10px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:55px}.kpis article{padding:20px;border:1px solid rgba(255,255,255,.08);border-radius:16px;background:rgba(12,14,23,.9)}.kpis small{color:#8f93a5;font-size:8px;letter-spacing:.14em;font-weight:900}.kpis strong{display:block;font-size:32px;margin:10px 0 5px}.kpis span{color:#666b7c;font-size:10px}.section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:18px}.section-head h2,.commerce h2{font-size:28px;letter-spacing:-.04em;margin:9px 0}.section-head p,.commerce p{max-width:700px;color:#777b8e;font-size:12px;line-height:1.7}.primary{white-space:nowrap;padding:12px 16px;border-radius:10px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-size:11px;font-weight:900}.modules{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.module{display:flex;align-items:center;gap:15px;padding:18px;border:1px solid rgba(255,255,255,.07);border-radius:16px;background:linear-gradient(145deg,rgba(255,255,255,.025),rgba(255,255,255,.012));transition:.18s}.module:hover{transform:translateY(-2px);border-color:rgba(167,139,250,.32);background:rgba(124,58,237,.07)}.module-icon{width:42px;height:42px;flex:none;border-radius:12px;display:grid;place-items:center;color:#c084fc;background:rgba(124,58,237,.12);border:1px solid rgba(167,139,250,.12)}.module-body{min-width:0;flex:1}.module-body small{font-size:8px;color:#a78bfa;letter-spacing:.14em;font-weight:900}.module-body h3{font-size:16px;margin:6px 0}.module-body p{color:#777b8e;font-size:10px;line-height:1.55;margin:0}.module-side{text-align:right;min-width:70px;color:#8b90a2}.module-side strong{display:block;color:#fff;font-size:18px}.module-side span{font-size:8px}.module-side b{display:block;color:#c084fc;margin-top:5px}.module-side .open{color:#c4b5fd;font-weight:800}.commerce{margin-top:48px;padding:26px;border:1px solid rgba(167,139,250,.15);border-radius:20px;background:linear-gradient(120deg,rgba(124,58,237,.13),rgba(59,130,246,.05),#0c0e17);display:flex;justify-content:space-between;gap:30px;align-items:center}.commerce-links{display:grid;gap:8px;min-width:250px}.commerce-links a{padding:11px 13px;border-radius:9px;border:1px solid rgba(255,255,255,.08);background:rgba(7,8,16,.55);color:#d8b4fe;font-size:10px;font-weight:900}.page footer{max-width:1180px;margin:35px auto 0;padding:0 24px;display:flex;justify-content:space-between;color:#555b6b;font-size:9px;letter-spacing:.12em;font-weight:900}.page footer a{color:#777b8e;letter-spacing:0}.empty{margin:60px auto;max-width:520px;padding:42px;border:1px solid rgba(255,255,255,.08);border-radius:20px;text-align:center;background:#0c0e17;color:#777b8e}.empty small{display:block;color:#a78bfa;letter-spacing:.16em;font-size:9px;font-weight:900;margin-bottom:12px}.empty strong{display:block;color:#fff;font-size:26px;margin-bottom:10px}.empty p{font-size:12px}.empty a{color:#c4b5fd;font-size:12px}@media(max-width:850px){.hero,.commerce{display:block}.hero-status{margin-top:25px}.kpis{grid-template-columns:repeat(2,1fr)}.section-head{display:block}.primary{display:inline-block;margin-top:14px}.modules{grid-template-columns:1fr}.commerce-links{margin-top:20px}}@media(max-width:500px){.top-actions small{display:none}.shell{padding:35px 16px}.kpis{grid-template-columns:1fr}.hero h1{font-size:44px}}`
