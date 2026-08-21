'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Measurement = { measured_at: string; weight_kg: number | null }
type DashboardData = {
  email: string | null
  name: string
  measurementCount: number
  currentWeight: number | null
  weightDelta: number | null
  workoutCount: number
  hasPlan: boolean
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const client = createClient()
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) {
        window.location.href = '/login'
        return
      }

      const user = auth.user
      const [measurementsResult, planResult] = await Promise.all([
        client.from('fitness_measurements').select('measured_at,weight_kg').eq('user_id', user.id).order('measured_at', { ascending: false }),
        client.from('training_plans').select('id').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      if (measurementsResult.error) setError('Não foi possível carregar os dados de evolução.')

      const measurements = (measurementsResult.data ?? []) as Measurement[]
      const latest = measurements[0]
      const oldest = measurements[measurements.length - 1]
      const weightDelta = latest?.weight_kg != null && oldest?.weight_kg != null
        ? latest.weight_kg - oldest.weight_kg
        : null

      let workoutCount = 0
      if (planResult.data?.id) {
        const workoutsResult = await client.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('plan_id', planResult.data.id)
        workoutCount = workoutsResult.count ?? 0
      }

      setData({
        email: user.email ?? null,
        name: user.user_metadata?.full_name ?? '',
        measurementCount: measurements.length,
        currentWeight: latest?.weight_kg ?? null,
        weightDelta,
        workoutCount,
        hasPlan: Boolean(planResult.data?.id),
      })
      setLoading(false)
    }

    loadDashboard()
  }, [])

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  const firstName = useMemo(() => data?.name?.trim().split(/\s+/)[0] ?? '', [data?.name])
  const variationLabel = data?.weightDelta == null
    ? 'Adicione mais medições para acompanhar a tendência.'
    : `${data.weightDelta > 0 ? '+' : ''}${data.weightDelta.toFixed(1)} kg desde a primeira medição`

  if (loading) return <main className="dashboard-app"><div className="dashboard-loading">A preparar o seu espaço PRETREINO...</div></main>

  return (
    <main className="dashboard-app">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand"><span className="dashboard-brand-mark">P</span><span>PRETREINO</span></div>

        <div className="dashboard-nav-label">SEU ESPAÇO</div>
        <nav className="dashboard-nav">
          <Link className="dashboard-nav-item active" href="/dashboard"><span>⌂</span> Visão geral</Link>
          <Link className="dashboard-nav-item" href="/treino"><span>↗</span> Meu treino</Link>
          <Link className="dashboard-nav-item" href="/nutricao"><span>◈</span> Alimentação</Link>
          <Link className="dashboard-nav-item" href="/evolucao"><span>⌁</span> Evolução</Link>
          <Link className="dashboard-nav-item" href="/perfil-fitness"><span>◎</span> Perfil fitness</Link>
        </nav>

        <div className="dashboard-nav-label commerce-label">PRETREINO+</div>
        <nav className="dashboard-nav">
          <Link className="dashboard-nav-item premium-nav" href="/premium"><span>✦</span> Assinar Premium <b>PRO</b></Link>
          <Link className="dashboard-nav-item" href="/loja"><span>◇</span> Loja</Link>
          <Link className="dashboard-nav-item" href="/identidade-visual"><span>◌</span> Minha identidade</Link>
        </nav>

        <div className="dashboard-sidebar-bottom">
          <Link className="dashboard-sidebar-offer" href="/premium"><span className="offer-icon">✦</span><div><strong>Desbloqueie o PRETREINO PRO</strong><small>Mais recursos, personalização e acompanhamento.</small></div><span className="offer-arrow">→</span></Link>
          <button className="dashboard-logout" onClick={logout}>Sair da conta</button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-breadcrumb"><span>PRETREINO</span><i>/</i><strong>VISÃO GERAL</strong><em><b /> Sistema online</em></div>
          <div className="dashboard-user"><div className="dashboard-avatar">{firstName?.charAt(0)?.toUpperCase() || 'P'}</div><div><strong>{data?.name || 'Seu perfil'}</strong><small>{data?.email || 'Conta PRETREINO'}</small></div></div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div className="welcome-copy">
              <span className="dashboard-eyebrow">SEU PROGRESSO COMEÇA AQUI</span>
              <h1>{firstName ? `Olá, ${firstName}.` : 'Olá.'}<br /><em>Vamos evoluir.</em></h1>
              <p>Acompanhe treino, alimentação, evolução e tudo o que o PRETREINO prepara para a sua jornada.</p>
              <div className="welcome-tags"><span>Treino personalizado</span><span>Nutrição</span><span>IA</span></div>
            </div>
            <div className="welcome-actions">
              <Link className="dashboard-primary-action" href={data?.hasPlan ? '/treino' : '/perfil-fitness'}>{data?.hasPlan ? 'Começar meu treino' : 'Completar meu perfil'} <span>→</span></Link>
              <Link className="dashboard-secondary-action" href="/premium">Conhecer o Premium <span>✦</span></Link>
            </div>
          </section>

          {error && <p className="notice error-notice">{error}</p>}

          <section className="dashboard-section-head">
            <div><span className="dashboard-eyebrow">SEUS NÚMEROS</span><h2>Visão do seu momento</h2></div>
            <Link href="/evolucao">Ver evolução completa →</Link>
          </section>

          <section className="premium-stats-grid">
            <div className="premium-stat-card featured"><span className="stat-icon">◉</span><small>PESO ATUAL</small><strong>{data?.currentWeight != null ? data.currentWeight : '—'}<b>{data?.currentWeight != null ? ' kg' : ''}</b></strong><p>{variationLabel}</p></div>
            <div className="premium-stat-card"><span className="stat-icon">⌁</span><small>MEDIÇÕES</small><strong>{data?.measurementCount ?? 0}</strong><p>Registos de evolução</p></div>
            <div className="premium-stat-card"><span className="stat-icon">↗</span><small>EXERCÍCIOS NO PLANO</small><strong>{data?.workoutCount ?? 0}</strong><p>{data?.hasPlan ? 'Disponíveis no seu plano' : 'Nenhum plano activo ainda'}</p></div>
          </section>

          <section className="dashboard-section-head modules-head"><div><span className="dashboard-eyebrow">PERFORMANCE</span><h2>Seu centro de performance</h2></div></section>
          <section className="premium-module-grid">
            <Link className="premium-module-card training" href="/treino"><div className="module-card-top"><span>01</span><b>↗</b></div><div className="module-symbol">✦</div><h3>Meu treino</h3><p>{data?.hasPlan ? 'Seu plano personalizado está pronto para você.' : 'Monte seu ponto de partida e acompanhe suas sessões.'}</p><span className="module-link">Abrir treino →</span></Link>
            <Link className="premium-module-card nutrition" href="/nutricao"><div className="module-card-top"><span>02</span><b>↗</b></div><div className="module-symbol">◈</div><h3>Alimentação</h3><p>Organize metas nutricionais e refeições para potencializar os seus resultados.</p><span className="module-link">Abrir alimentação →</span></Link>
            <Link className="premium-module-card evolution" href="/evolucao"><div className="module-card-top"><span>03</span><b>↗</b></div><div className="module-symbol">⌁</div><h3>Evolução</h3><p>Veja histórico, tendências e o resultado do trabalho que está a construir.</p><span className="module-link">Acompanhar evolução →</span></Link>
            <Link className="premium-module-card profile" href="/perfil-fitness"><div className="module-card-top"><span>04</span><b>↗</b></div><div className="module-symbol">◎</div><h3>Perfil fitness</h3><p>Actualize objetivo, medidas e o ponto de partida da sua experiência.</p><span className="module-link">Ver meu perfil →</span></Link>
          </section>

          <section className="dashboard-section-head commerce-head"><div><span className="dashboard-eyebrow">EXPERIMENTE MAIS</span><h2>PRETREINO+ e compras</h2></div><Link href="/loja">Abrir loja →</Link></section>
          <section className="commerce-grid">
            <Link className="commerce-card premium-commerce" href="/premium"><div className="commerce-glow" /><span className="commerce-icon">✦</span><div><small>ASSINATURA</small><h3>PRETREINO PRO</h3><p>Desbloqueie a experiência completa, recursos avançados e acompanhamento premium.</p></div><span className="commerce-cta">Ver planos <b>→</b></span></Link>
            <Link className="commerce-card store-commerce" href="/loja"><span className="commerce-icon">◇</span><div><small>LOJA PRETREINO</small><h3>Produtos e experiências</h3><p>Explore itens e experiências pensados para acompanhar a sua evolução.</p></div><span className="commerce-cta">Explorar loja <b>→</b></span></Link>
            <Link className="commerce-card identity-commerce" href="/identidade-visual"><span className="commerce-icon">◌</span><div><small>PERSONALIZAÇÃO</small><h3>Minha identidade</h3><p>Personalize a aparência da sua experiência e deixe o seu espaço com a sua cara.</p></div><span className="commerce-cta">Personalizar <b>→</b></span></Link>
          </section>

          <section className="dashboard-bottom-note"><div><span>✦</span><div><strong>O seu espaço cresce consigo.</strong><p>À medida que novas funcionalidades forem activadas, elas aparecerão aqui de forma clara e organizada.</p></div></div><Link href="/premium">Ver tudo que o PRO oferece →</Link></section>
        </div>
      </section>

      <style jsx global>{`
        .dashboard-app{min-height:100vh;background:#070810;color:#f7f7fb;display:flex;font-family:Arial,Helvetica,sans-serif}
        .dashboard-sidebar{width:258px;flex:none;min-height:100vh;background:linear-gradient(180deg,#0b0c15 0%,#080910 100%);border-right:1px solid rgba(255,255,255,.08);padding:28px 18px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
        .dashboard-brand{display:flex;align-items:center;gap:11px;font-size:16px;font-weight:900;letter-spacing:.08em;padding:4px 10px 32px}.dashboard-brand-mark{width:35px;height:35px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5);box-shadow:0 0 25px rgba(139,92,246,.3);font-size:20px}
        .dashboard-nav-label{font-size:10px;letter-spacing:.16em;color:#666a7c;font-weight:800;padding:0 12px 11px}.commerce-label{margin-top:26px}.dashboard-nav{display:grid;gap:5px}.dashboard-nav-item{height:44px;display:flex;align-items:center;gap:13px;padding:0 13px;border-radius:12px;color:#989bad;font-size:13px;font-weight:700;transition:.18s}.dashboard-nav-item span{width:18px;text-align:center;font-size:17px}.dashboard-nav-item:hover{background:rgba(255,255,255,.05);color:#fff}.dashboard-nav-item.active{background:linear-gradient(90deg,rgba(124,58,237,.25),rgba(79,70,229,.1));color:#fff;border:1px solid rgba(139,92,246,.18);box-shadow:inset 3px 0 #8b5cf6}.dashboard-nav-item b{margin-left:auto;font-size:8px;letter-spacing:.08em;color:#c084fc;background:rgba(139,92,246,.13);border:1px solid rgba(192,132,252,.2);padding:3px 5px;border-radius:5px}
        .dashboard-sidebar-bottom{margin-top:auto}.dashboard-sidebar-offer{display:flex;align-items:flex-start;gap:9px;padding:13px;border:1px solid rgba(139,92,246,.18);border-radius:14px;background:linear-gradient(145deg,rgba(91,45,232,.15),rgba(255,255,255,.025));margin-bottom:12px;color:#fff}.offer-icon{width:29px;height:29px;display:grid;place-items:center;flex:none;border-radius:9px;background:rgba(139,92,246,.2);color:#d8b4fe}.dashboard-sidebar-offer strong{display:block;font-size:11px;line-height:1.25}.dashboard-sidebar-offer small{display:block;color:#777b8e;font-size:9px;line-height:1.35;margin-top:4px}.offer-arrow{margin-left:auto;color:#c084fc}.dashboard-logout{width:100%;height:42px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#8b8fa0;border-radius:11px;cursor:pointer;font-weight:700}.dashboard-logout:hover{color:#fff;border-color:rgba(255,255,255,.18)}
        .dashboard-main{min-width:0;flex:1;background:radial-gradient(circle at 72% 0%,rgba(91,45,232,.12),transparent 30%),#070810}.dashboard-topbar{height:78px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(22px,4vw,54px);background:rgba(7,8,16,.72);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}.dashboard-breadcrumb{font-size:10px;letter-spacing:.12em;color:#777b8e;font-weight:800}.dashboard-breadcrumb i{font-style:normal;color:#414454;margin:0 9px}.dashboard-breadcrumb strong{color:#a1a5b5}.dashboard-breadcrumb em{font-style:normal;color:#63e3a0;letter-spacing:0;margin-left:14px}.dashboard-breadcrumb em b{display:inline-block;width:6px;height:6px;border-radius:50%;background:#45dc8c;margin-right:6px;box-shadow:0 0 9px #45dc8c}.dashboard-user{display:flex;align-items:center;gap:10px}.dashboard-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#7c3aed,#2563eb);font-weight:900}.dashboard-user strong{display:block;font-size:12px}.dashboard-user small{display:block;color:#6f7385;font-size:10px;margin-top:3px}
        .dashboard-content{width:min(1240px,calc(100% - 48px));margin:0 auto;padding:42px 0 70px}.dashboard-welcome{min-height:245px;border:1px solid rgba(255,255,255,.08);border-radius:25px;padding:34px 38px;display:flex;align-items:flex-end;justify-content:space-between;gap:30px;background:radial-gradient(circle at 80% 20%,rgba(139,92,246,.25),transparent 32%),linear-gradient(135deg,rgba(22,17,42,.95),rgba(9,12,27,.96));box-shadow:0 25px 70px rgba(0,0,0,.28);position:relative;overflow:hidden}.dashboard-welcome:after{content:"";position:absolute;width:300px;height:300px;border-radius:50%;right:-110px;top:-145px;background:rgba(59,130,246,.13);filter:blur(8px)}.welcome-copy{position:relative;z-index:1}.dashboard-eyebrow{display:block;color:#a78bfa;font-size:10px;font-weight:900;letter-spacing:.16em;margin-bottom:10px}.dashboard-welcome h1{font-size:clamp(38px,4vw,58px);line-height:1;letter-spacing:-.05em;margin:0}.dashboard-welcome h1 em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;background-clip:text;color:transparent}.dashboard-welcome p{color:#9da0b1;font-size:15px;line-height:1.6;margin:17px 0 0;max-width:610px}.welcome-tags{display:flex;gap:7px;margin-top:19px;flex-wrap:wrap}.welcome-tags span{font-size:9px;color:#c2c5d2;padding:6px 9px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.03)}.welcome-actions{position:relative;z-index:2;display:flex;flex-direction:column;gap:9px;min-width:190px}.dashboard-primary-action,.dashboard-secondary-action{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 18px;border-radius:12px;color:#fff;font-size:12px;font-weight:900}.dashboard-primary-action{background:linear-gradient(90deg,#7c2ff0,#4f46e5);box-shadow:0 12px 35px rgba(91,45,232,.28)}.dashboard-secondary-action{border:1px solid rgba(192,132,252,.22);background:rgba(255,255,255,.035);color:#ddd6fe}.dashboard-primary-action:hover,.dashboard-secondary-action:hover{transform:translateY(-1px)}.dashboard-primary-action span{font-size:19px}.dashboard-secondary-action span{color:#c084fc}
        .dashboard-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:42px 0 17px}.dashboard-section-head h2{font-size:24px;margin:0;letter-spacing:-.025em}.dashboard-section-head>a{color:#a78bfa;font-size:12px;font-weight:800}.modules-head{margin-top:48px}.premium-stats-grid{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:14px}.premium-stat-card{min-height:148px;border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:20px;background:linear-gradient(145deg,rgba(18,20,31,.96),rgba(10,11,19,.96));position:relative;overflow:hidden}.premium-stat-card.featured{background:radial-gradient(circle at 90% 10%,rgba(139,92,246,.25),transparent 40%),linear-gradient(145deg,#151126,#0b0c16)}.premium-stat-card .stat-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:rgba(139,92,246,.12);color:#c084fc;margin-bottom:14px}.premium-stat-card small{display:block;color:#707486;font-size:9px;font-weight:900;letter-spacing:.12em}.premium-stat-card strong{display:block;font-size:31px;margin-top:5px;letter-spacing:-.04em}.premium-stat-card strong b{font-size:13px;color:#a3a6b4;margin-left:5px}.premium-stat-card p{color:#727688;font-size:10px;margin:7px 0 0}
        .premium-module-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.premium-module-card{min-height:245px;border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:20px;position:relative;overflow:hidden;background:#0b0d15;color:#fff;transition:.2s}.premium-module-card:hover{transform:translateY(-3px);border-color:rgba(167,139,250,.28);box-shadow:0 18px 40px rgba(0,0,0,.22)}.premium-module-card:before{content:"";position:absolute;inset:auto -45px -80px auto;width:160px;height:160px;border-radius:50%;filter:blur(8px);opacity:.16}.premium-module-card.training:before{background:#a855f7}.premium-module-card.nutrition:before{background:#2563eb}.premium-module-card.evolution:before{background:#06b6d4}.premium-module-card.profile:before{background:#ec4899}.module-card-top{display:flex;justify-content:space-between;color:#666a7c;font-size:10px;font-weight:900;letter-spacing:.08em}.module-card-top b{color:#8f93a4;font-size:15px}.module-symbol{width:39px;height:39px;border-radius:11px;display:grid;place-items:center;margin:27px 0 16px;background:rgba(139,92,246,.13);color:#c084fc;font-size:19px}.nutrition .module-symbol{background:rgba(37,99,235,.13);color:#60a5fa}.evolution .module-symbol{background:rgba(6,182,212,.13);color:#67e8f9}.profile .module-symbol{background:rgba(236,72,153,.13);color:#f9a8d4}.premium-module-card h3{font-size:17px;margin:0 0 9px}.premium-module-card p{font-size:11px;line-height:1.55;color:#85899a;min-height:51px;margin:0}.module-link{display:block;margin-top:18px;color:#b8a1ff;font-size:10px;font-weight:900}
        .commerce-head{margin-top:48px}.commerce-grid{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px}.commerce-card{min-height:205px;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:22px;display:flex;flex-direction:column;position:relative;overflow:hidden;color:#fff;background:linear-gradient(145deg,#11131e,#0b0d14);transition:.2s}.commerce-card:hover{transform:translateY(-3px);border-color:rgba(167,139,250,.28);box-shadow:0 20px 45px rgba(0,0,0,.25)}.premium-commerce{background:radial-gradient(circle at 85% 15%,rgba(139,92,246,.28),transparent 38%),linear-gradient(145deg,#17112a,#0b0d17)}.commerce-glow{position:absolute;width:190px;height:190px;border-radius:50%;right:-90px;bottom:-100px;background:rgba(79,70,229,.24);filter:blur(20px)}.commerce-icon{width:35px;height:35px;border-radius:10px;display:grid;place-items:center;background:rgba(139,92,246,.14);color:#d8b4fe;font-size:18px;margin-bottom:17px}.commerce-card small{color:#74788a;font-size:9px;letter-spacing:.14em;font-weight:900}.commerce-card h3{font-size:18px;margin:5px 0 7px}.commerce-card p{color:#85899a;font-size:11px;line-height:1.5;max-width:440px;margin:0}.commerce-cta{margin-top:auto;padding-top:18px;color:#c4b5fd;font-size:10px;font-weight:900}.commerce-cta b{font-size:15px;margin-left:5px}.dashboard-bottom-note{margin-top:16px;border:1px solid rgba(255,255,255,.06);border-radius:15px;padding:15px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:rgba(255,255,255,.025)}.dashboard-bottom-note>div{display:flex;align-items:center;gap:11px}.dashboard-bottom-note>div>span{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;background:rgba(139,92,246,.13);color:#c084fc}.dashboard-bottom-note strong{font-size:11px}.dashboard-bottom-note p{margin:3px 0 0;color:#737788;font-size:9px}.dashboard-bottom-note>a{color:#a78bfa;font-size:10px;font-weight:900;white-space:nowrap}
        .dashboard-loading{min-height:100vh;display:grid;place-items:center;width:100%;color:#a78bfa;font-weight:800;letter-spacing:.04em}.notice{padding:12px 15px;border-radius:10px;font-size:11px}.error-notice{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.16);color:#fca5a5}
        @media(max-width:1100px){.dashboard-sidebar{width:225px}.premium-module-grid{grid-template-columns:repeat(2,1fr)}.commerce-grid{grid-template-columns:1fr 1fr}.premium-commerce{grid-column:span 2}}
        @media(max-width:760px){.dashboard-app{display:block}.dashboard-sidebar{position:static;width:100%;height:auto;min-height:0;padding:16px}.dashboard-brand{padding-bottom:16px}.dashboard-nav{grid-template-columns:repeat(2,1fr)}.commerce-label,.dashboard-sidebar-bottom{margin-top:18px}.dashboard-topbar{position:static;height:auto;padding:14px 18px}.dashboard-breadcrumb{display:none}.dashboard-content{width:calc(100% - 24px);padding:20px 0 45px}.dashboard-welcome{padding:24px;display:block}.welcome-actions{margin-top:24px}.premium-stats-grid,.premium-module-grid,.commerce-grid{grid-template-columns:1fr}.premium-commerce{grid-column:auto}.dashboard-section-head{align-items:flex-start;flex-direction:column}.dashboard-bottom-note{display:block}.dashboard-bottom-note>a{display:block;margin-top:12px}.dashboard-user small{display:none}}
      `}</style>
    </main>
  )
}
