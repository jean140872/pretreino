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

  if (loading) return <main className="page-shell"><p className="muted">Carregando seu dashboard...</p></main>

  return (
    <main className="page-shell">
      <header className="topbar"><span className="brand">PRETREINO</span><button className="link-button" onClick={logout}>Sair</button></header>
      <section className="dashboard-hero"><div className="eyebrow">DASHBOARD</div><h1>{data?.name ? `Olá, ${data.name}` : 'Olá'}</h1><p className="muted">Aqui começa o acompanhamento real da sua evolução.</p>{data?.email && <p className="muted small">{data.email}</p>}</section>
      {error && <p className="notice error-notice">{error}</p>}
      <section className="stats-grid">
        <div className="stat-card"><span>Medições</span><strong>{data?.measurementCount ?? 0}</strong></div>
        <div className="stat-card"><span>Peso atual</span><strong>{data?.currentWeight != null ? `${data.currentWeight} kg` : '—'}</strong></div>
        <div className="stat-card"><span>Variação</span><strong>{data?.weightDelta == null ? '—' : `${data.weightDelta > 0 ? '+' : ''}${data.weightDelta.toFixed(1)} kg`}</strong></div>
        <div className="stat-card"><span>Exercícios no plano</span><strong>{data?.workoutCount ?? 0}</strong></div>
      </section>
      <section className="dashboard-grid">
        <Link className="module-card" href="/perfil-fitness"><span>01</span><h2>Perfil Fitness</h2><p>Dados físicos, objetivo e ponto de partida.</p></Link>
        <Link className="module-card" href="/evolucao"><span>02</span><h2>Evolução</h2><p>Histórico de medições e acompanhamento da tendência.</p></Link>
        <Link className="module-card" href="/treino"><span>03</span><h2>Meu treino</h2><p>{data?.hasPlan ? 'Treino personalizado ligado ao seu plano activo.' : 'Consulte o treino e acompanhe as suas sessões.'}</p></Link>
        <Link className="module-card" href="/nutricao"><span>04</span><h2>Alimentação</h2><p>Plano alimentar, metas nutricionais e refeições personalizadas.</p></Link>
      </section>
    </main>
  )
}
