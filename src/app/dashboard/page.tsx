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
    </main>
  )
}
