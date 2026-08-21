'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Measurement = { measured_at: string; weight_kg: number | null }
type DashboardData = { email: string | null; name: string; measurementCount: number; currentWeight: number | null; weightDelta: number | null; workoutCount: number; hasPlan: boolean }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadDashboard() {
      const client = createClient()
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      const user = auth.user
      const [measurementsResult, planResult] = await Promise.all([
        client.from('fitness_measurements').select('measured_at,weight_kg').eq('user_id', user.id).order('measured_at', { ascending: false }),
        client.from('training_plans').select('id').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (measurementsResult.error) setError('Não foi possível carregar os dados de evolução.')
      const measurements = (measurementsResult.data ?? []) as Measurement[]
      const latest = measurements[0]
      const oldest = measurements[measurements.length - 1]
      const weightDelta = latest?.weight_kg != null && oldest?.weight_kg != null ? latest.weight_kg - oldest.weight_kg : null
      let workoutCount = 0
      if (planResult.data?.id) {
        const workoutsResult = await client.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('plan_id', planResult.data.id)
        workoutCount = workoutsResult.count ?? 0
      }
      setData({ email: user.email ?? null, name: user.user_metadata?.full_name ?? '', measurementCount: measurements.length, currentWeight: latest?.weight_kg ?? null, weightDelta, workoutCount, hasPlan: Boolean(planResult.data?.id) })
      setLoading(false)
    }
    loadDashboard()
  }, [])

  async function logout() { await createClient().auth.signOut(); window.location.href = '/login' }

  if (loading) return <main className="dashboard-app"><div className="dashboard-loading">Carregando seu espaço PRETREINO...</div></main>

  const firstName = data?.name?.trim().split(/\s+/)[0]
  const variationLabel = data?.weightDelta == null ? 'Sem histórico suficiente' : `${data.weightDelta > 0 ? '+' : ''}${data.weightDelta.toFixed(1)} kg desde a primeira medição`

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
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-mini-card"><span className="dashboard-mini-icon">✦</span><div><strong>Seu próximo passo</strong><small>{data?.hasPlan ? 'Continue seu treino hoje.' : 'Complete seu perfil para começar.'}</small></div></div>
          <button className="dashboard-logout" onClick={logout}>Sair da conta</button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div><span className="dashboard-top-eyebrow">PRETREINO / VISÃO GERAL</span><span className="dashboard-status"><i /> Sistema online</span></div>
          <div className="dashboard-user"><div className="dashboard-avatar">{firstName?.charAt(0)?.toUpperCase() || 'P'}</div><div><strong>{data?.name || 'Seu perfil'}</strong><small>{data?.email || 'Conta PRETREINO'}</small></div></div>
        </header>

        <div className="dashboard-content">
          <section className="dashboard-welcome">
            <div><span className="dashboard-eyebrow">SEU PROGRESSO COMEÇA AQUI</span><h1>{firstName ? `Olá, ${firstName}.` : 'Olá.'}<br /><em>Vamos evoluir.</em></h1><p>Acompanhe seus treinos, alimentação e evolução em um único lugar.</p></div>
            <Link className="dashboard-primary-action" href={data?.hasPlan ? '/treino' : '/perfil-fitness'}>{data?.hasPlan ? 'Começar meu treino' : 'Completar meu perfil'} <span>→</span></Link>
          </section>

          {error && <p className="notice error-notice">{error}</p>}

          <section className="dashboard-section-head"><div><span className="dashboard-eyebrow">SEUS NÚMEROS</span><h2>Visão do seu momento</h2></div><Link href="/evolucao">Ver evolução completa →</Link></section>
          <section className="premium-stats-grid">
            <div className="premium-stat-card featured"><span className="stat-icon">◉</span><small>PESO ATUAL</small><strong>{data?.currentWeight != null ? `${data.currentWeight}` : '—'}<b>{data?.currentWeight != null ? ' kg' : ''}</b></strong><p>{variationLabel}</p></div>
            <div className="premium-stat-card"><span className="stat-icon">⌁</span><small>MEDIÇÕES</small><strong>{data?.measurementCount ?? 0}</strong><p>Registos de evolução</p></div>
            <div className="premium-stat-card"><span className="stat-icon">↗</span><small>EXERCÍCIOS NO PLANO</small><strong>{data?.workoutCount ?? 0}</strong><p>{data?.hasPlan ? 'Disponíveis no seu plano' : 'Nenhum plano activo ainda'}</p></div>
          </section>

          <section className="dashboard-section-head modules-head"><div><span className="dashboard-eyebrow">PRETREINO</span><h2>Seu centro de performance</h2></div></section>
          <section className="premium-module-grid">
            <Link className="premium-module-card training" href="/treino"><div className="module-card-top"><span className="module-number">01</span><span className="module-arrow">↗</span></div><div className="module-symbol">✦</div><h3>Meu treino</h3><p>{data?.hasPlan ? 'Seu plano personalizado está pronto para você.' : 'Monte seu ponto de partida e acompanhe suas sessões.'}</p><span className="module-link">Abrir treino →</span></Link>
            <Link className="premium-module-card nutrition" href="/nutricao"><div className="module-card-top"><span className="module-number">02</span><span className="module-arrow">↗</span></div><div className="module-symbol">◈</div><h3>Alimentação</h3><p>Organize suas metas nutricionais e refeições para potencializar seus resultados.</p><span className="module-link">Abrir alimentação →</span></Link>
            <Link className="premium-module-card evolution" href="/evolucao"><div className="module-card-top"><span className="module-number">03</span><span className="module-arrow">↗</span></div><div className="module-symbol">⌁</div><h3>Evolução</h3><p>Veja seu histórico, tendências e o resultado do trabalho que você está construindo.</p><span className="module-link">Acompanhar evolução →</span></Link>
            <Link className="premium-module-card profile" href="/perfil-fitness"><div className="module-card-top"><span className="module-number">04</span><span className="module-arrow">↗</span></div><div className="module-symbol">◎</div><h3>Perfil fitness</h3><p>Mantenha seus dados, objetivo e ponto de partida sempre actualizados.</p><span className="module-link">Ver meu perfil →</span></Link>
          </section>
        </div>
      </section>

      <style jsx global>{`
        .dashboard-app{min-height:100vh;background:#070810;color:#f7f7fb;display:flex;font-family:Arial,Helvetica,sans-serif}
        .dashboard-sidebar{width:252px;flex:none;min-height:100vh;background:linear-gradient(180deg,#0b0c15 0%,#080910 100%);border-right:1px solid rgba(255,255,255,.08);padding:28px 18px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
        .dashboard-brand{display:flex;align-items:center;gap:11px;font-size:16px;font-weight:900;letter-spacing:.08em;padding:4px 10px 34px}.dashboard-brand-mark{width:35px;height:35px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(145deg,#a855f7,#4f46e5);box-shadow:0 0 25px rgba(139,92,246,.3);font-size:20px}
        .dashboard-nav-label{font-size:10px;letter-spacing:.16em;color:#666a7c;font-weight:800;padding:0 12px 12px}.dashboard-nav{display:grid;gap:5px}.dashboard-nav-item{height:46px;display:flex;align-items:center;gap:13px;padding:0 13px;border-radius:12px;color:#989bad;font-size:14px;font-weight:700;transition:.18s}.dashboard-nav-item span{width:18px;text-align:center;font-size:18px}.dashboard-nav-item:hover{background:rgba(255,255,255,.05);color:#fff}.dashboard-nav-item.active{background:linear-gradient(90deg,rgba(124,58,237,.25),rgba(79,70,229,.1));color:#fff;border:1px solid rgba(139,92,246,.18);box-shadow:inset 3px 0 #8b5cf6}
        .dashboard-sidebar-bottom{margin-top:auto}.dashboard-mini-card{display:flex;gap:10px;padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:rgba(255,255,255,.035);margin-bottom:12px}.dashboard-mini-icon{width:31px;height:31px;flex:none;display:grid;place-items:center;border-radius:9px;background:rgba(139,92,246,.16);color:#c084fc}.dashboard-mini-card strong{display:block;font-size:12px;margin:1px 0 4px}.dashboard-mini-card small{display:block;color:#777b8e;font-size:10px;line-height:1.4}.dashboard-logout{width:100%;height:42px;border:1px solid rgba(255,255,255,.08);background:transparent;color:#8b8fa0;border-radius:11px;cursor:pointer;font-weight:700}.dashboard-logout:hover{color:#fff;border-color:rgba(255,255,255,.18)}
        .dashboard-main{min-width:0;flex:1;background:radial-gradient(circle at 72% 0%,rgba(91,45,232,.12),transparent 30%),#070810}.dashboard-topbar{height:78px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between;padding:0 clamp(22px,4vw,54px);background:rgba(7,8,16,.72);backdrop-filter:blur(16px);position:sticky;top:0;z-index:5}.dashboard-top-eyebrow{font-size:10px;letter-spacing:.13em;color:#777b8e;font-weight:800}.dashboard-status{margin-left:14px;font-size:11px;color:#62e6a0}.dashboard-status i{display:inline-block;width:6px;height:6px;background:#45dc8c;border-radius:50%;margin-right:6px;box-shadow:0 0 9px #45dc8c}.dashboard-user{display:flex;align-items:center;gap:10px}.dashboard-avatar{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#7c3aed,#2563eb);font-weight:900}.dashboard-user strong{display:block;font-size:12px}.dashboard-user small{display:block;color:#6f7385;font-size:10px;margin-top:3px}
        .dashboard-content{width:min(1240px,calc(100% - 48px));margin:0 auto;padding:44px 0 70px}.dashboard-welcome{min-height:220px;border:1px solid rgba(255,255,255,.08);border-radius:25px;padding:34px 38px;display:flex;align-items:flex-end;justify-content:space-between;gap:30px;background:radial-gradient(circle at 80% 20%,rgba(139,92,246,.25),transparent 32%),linear-gradient(135deg,rgba(22,17,42,.95),rgba(9,12,27,.96));box-shadow:0 25px 70px rgba(0,0,0,.28);position:relative;overflow:hidden}.dashboard-welcome:after{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-100px;top:-140px;background:rgba(59,130,246,.12);filter:blur(8px)}.dashboard-eyebrow{display:block;color:#a78bfa;font-size:10px;font-weight:900;letter-spacing:.16em;margin-bottom:10px}.dashboard-welcome h1{font-size:clamp(36px,4vw,56px);line-height:1;letter-spacing:-.05em;margin:0;position:relative;z-index:1}.dashboard-welcome h1 em{font-style:normal;background:linear-gradient(90deg,#c084fc,#60a5fa);-webkit-background-clip:text;background-clip:text;color:transparent}.dashboard-welcome p{color:#9da0b1;font-size:15px;line-height:1.6;margin:17px 0 0;max-width:520px}.dashboard-primary-action{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:18px;padding:15px 20px;border-radius:12px;background:linear-gradient(90deg,#7c2ff0,#4f46e5);color:#fff;font-size:13px;font-weight:900;box-shadow:0 12px 35px rgba(91,45,232,.28)}.dashboard-primary-action span{font-size:20px}.dashboard-primary-action:hover{transform:translateY(-1px);box-shadow:0 16px 42px rgba(91,45,232,.4)}
        .dashboard-section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin:42px 0 17px}.dashboard-section-head h2{font-size:24px;margin:0;letter-spacing:-.025em}.dashboard-section-head>a{color:#a78bfa;font-size:12px;font-weight:800}.modules-head{margin-top:48px}.premium-stats-grid{display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:14px}.premium-stat-card{min-height:148px;border:1px solid rgba(255,255,255,.075);border-radius:18px;padding:20px;background:linear-gradient(145deg,rgba(18,20,31,.96),rgba(10,11,19,.96));position:relative;overflow:hidden}.premium-stat-card.featured{background:radial-gradient(circle at 90% 10%,rgba(139,92,246,.25),transparent 40%),linear-gradient(145deg,#151126,#0b0c16)}.premium-stat-card .stat-icon{display:grid;place-items:center;width:32px;height:32px;border-radius:9px;background:rgba(139,92,246,.12);color:#c084fc;margin-bottom:14px}.premium-stat-card small{display:block;color:#707486;font-size:9px;font-weight:900;letter-spacing:.12em}.premium-stat-card strong{display:block;font-size:31px;margin-top:5px;letter-spacing:-.04em}.premium-stat-card strong b{font-size:14px;color:#9b9eae;margin-left:4px}.premium-stat-card p{color:#777b8e;font-size:11px;margin:7px 0 0}.premium-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.premium-module-card{min-height:205px;border:1px solid rgba(255,255,255,.075);border-radius:19px;padding:22px;background:linear-gradient(145deg,#11131e,#0b0c14);position:relative;overflow:hidden;transition:transform .18s,box-shadow .18s,border-color .18s}.premium-module-card:before{content:"";position:absolute;width:170px;height:170px;border-radius:50%;right:-70px;bottom:-95px;opacity:.2;filter:blur(2px)}.premium-module-card.training:before{background:#8b5cf6}.premium-module-card.nutrition:before{background:#22c55e}.premium-module-card.evolution:before{background:#38bdf8}.premium-module-card.profile:before{background:#f472b6}.premium-module-card:hover{transform:translateY(-3px);border-color:rgba(167,139,250,.28);box-shadow:0 18px 50px rgba(0,0,0,.25)}.module-card-top{display:flex;justify-content:space-between;color:#64697a;font-size:10px;font-weight:900;letter-spacing:.08em}.module-arrow{font-size:17px;color:#777b8e}.module-symbol{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:rgba(139,92,246,.1);color:#c084fc;font-size:20px;margin:18px 0 13px}.nutrition .module-symbol{background:rgba(34,197,94,.09);color:#6ee7a1}.evolution .module-symbol{background:rgba(56,189,248,.09);color:#7dd3fc}.profile .module-symbol{background:rgba(244,114,182,.09);color:#f9a8d4}.premium-module-card h3{font-size:20px;margin:0 0 7px}.premium-module-card p{color:#818596;font-size:12px;line-height:1.55;margin:0;max-width:470px}.module-link{display:inline-block;color:#a78bfa;font-size:11px;font-weight:900;margin-top:16px}.dashboard-loading{min-height:100vh;display:grid;place-items:center;color:#9da0b1;width:100%}
        @media(max-width:900px){.dashboard-sidebar{width:210px}.dashboard-content{width:min(100% - 32px,720px)}.premium-stats-grid{grid-template-columns:1fr 1fr}.premium-stat-card.featured{grid-column:1/-1}.dashboard-welcome{align-items:flex-start;flex-direction:column}.dashboard-primary-action{width:100%;justify-content:center}}
        @media(max-width:680px){.dashboard-app{display:block}.dashboard-sidebar{position:relative;width:100%;height:auto;min-height:0;padding:14px 14px 10px;border-right:0;border-bottom:1px solid rgba(255,255,255,.08)}.dashboard-brand{padding:2px 7px 14px}.dashboard-nav-label,.dashboard-sidebar-bottom{display:none}.dashboard-nav{display:flex;overflow-x:auto;gap:5px}.dashboard-nav-item{white-space:nowrap;height:40px;padding:0 10px}.dashboard-topbar{position:relative;height:68px;padding:0 16px}.dashboard-top-eyebrow{font-size:8px}.dashboard-status{display:block;margin:5px 0 0}.dashboard-user>div:last-child{display:none}.dashboard-content{width:calc(100% - 24px);padding:24px 0 48px}.dashboard-welcome{padding:26px 22px;min-height:0}.dashboard-welcome h1{font-size:37px}.dashboard-section-head{margin-top:32px}.dashboard-section-head h2{font-size:20px}.dashboard-section-head>a{font-size:10px}.premium-stats-grid,.premium-module-grid{grid-template-columns:1fr}.premium-stat-card.featured{grid-column:auto}.premium-module-card{min-height:190px}}
      `}</style>
    </main>
  )
}
