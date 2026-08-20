'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Exercise = { name: string; muscle_group: string | null; equipment: string | null; instructions: string | null }
type WorkoutItem = { id: string; sets: number | null; reps: string | null; rest_seconds: number | null; notes: string | null; sort_order: number; exercise: Exercise | null }
type Workout = { id: string; name: string; day_of_week: number | null; sort_order: number; items: WorkoutItem[] }

export default function TreinoPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const client = createClient()
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }

      const { data: plan, error: planError } = await client
        .from('training_plans')
        .select('id,name,goal,days_per_week')
        .eq('user_id', auth.user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planError) { setError('Não foi possível carregar o treino.'); setLoading(false); return }
      if (!plan) { setLoading(false); return }

      const { data: workoutRows, error: workoutsError } = await client
        .from('workouts')
        .select('id,name,day_of_week,sort_order')
        .eq('user_id', auth.user.id)
        .eq('plan_id', plan.id)
        .order('sort_order')

      if (workoutsError) { setError('Não foi possível carregar os treinos.'); setLoading(false); return }

      const ids = (workoutRows ?? []).map(w => w.id)
      let items: any[] = []
      if (ids.length) {
        const { data, error: itemsError } = await client
          .from('workout_exercises')
          .select('id,workout_id,sets,reps,rest_seconds,notes,sort_order,exercise:exercises(name,muscle_group,equipment,instructions)')
          .in('workout_id', ids)
          .order('sort_order')
        if (itemsError) { setError('Não foi possível carregar os exercícios.'); setLoading(false); return }
        items = data ?? []
      }

      const grouped = (workoutRows ?? []).map(w => ({
        ...w,
        items: items.filter(item => item.workout_id === w.id).map(item => ({ ...item, exercise: Array.isArray(item.exercise) ? item.exercise[0] ?? null : item.exercise }))
      }))
      setWorkouts(grouped)
      setActiveId(grouped[0]?.id ?? null)
      setLoading(false)
    }
    load()
  }, [])

  async function finishWorkout(workoutId: string) {
    setSaving(true)
    setError('')
    const client = createClient()
    const { data: auth } = await client.auth.getUser()
    if (!auth.user) { window.location.href = '/login'; return }
    const { error: saveError } = await client.from('workout_sessions').insert({ user_id: auth.user.id, workout_id: workoutId, started_at: new Date().toISOString(), completed_at: new Date().toISOString() })
    if (saveError) setError(`Não foi possível registar o treino: ${saveError.message}`)
    else { setCompleted(workoutId); setTimeout(() => setCompleted(null), 3000) }
    setSaving(false)
  }

  if (loading) return <main className="page-shell"><p className="muted">Carregando seu treino...</p></main>

  const active = workouts.find(w => w.id === activeId)

  return (
    <main className="page-shell">
      <header className="topbar"><Link href="/dashboard" className="brand">PRETREINO</Link><Link href="/evolucao">Evolução</Link></header>
      <section className="section-heading">
        <div><div className="eyebrow">TREINO</div><h1>Seu treino personalizado</h1><p className="muted">Treinos ligados ao seu plano activo e preparados para acompanhar a sua evolução.</p></div>
      </section>

      {error && <p className="notice error-notice">{error}</p>}

      {!workouts.length ? (
        <section className="module-card"><h2>Seu treino ainda está a ser preparado.</h2><p className="muted">Quando existir um plano activo no PRETREINO, os treinos e exercícios aparecerão aqui.</p><Link className="button primary" href="/perfil-fitness">Rever meu Perfil Fitness</Link></section>
      ) : (
        <>
          <section className="dashboard-grid">
            {workouts.map((workout, index) => <button key={workout.id} className={`module-card ${activeId === workout.id ? 'selected' : ''}`} onClick={() => setActiveId(workout.id)}><span>{String(index + 1).padStart(2, '0')}</span><h2>{workout.name}</h2><p>{workout.items.length} exercício{workout.items.length === 1 ? '' : 's'}</p></button>)}
          </section>
          {active && <section className="measurement-form">
            <div className="section-heading"><div><div className="eyebrow">SESSÃO</div><h2>{active.name}</h2></div></div>
            {active.items.length === 0 ? <p className="muted">Este treino ainda não tem exercícios associados.</p> : <div className="history-list">{active.items.map(item => <article className="history-row" key={item.id}><div><strong>{item.exercise?.name ?? 'Exercício'}</strong><p className="muted small">{[item.exercise?.muscle_group, item.exercise?.equipment].filter(Boolean).join(' · ')}</p></div><div><span>{item.sets ? `${item.sets} séries` : 'Séries —'}</span><span>{item.reps ? `${item.reps} repetições` : 'Reps —'}</span>{item.rest_seconds ? <span>{item.rest_seconds}s descanso</span> : null}</div></article>)}</div>}
            <button className="button primary" disabled={saving} onClick={() => finishWorkout(active.id)}>{saving ? 'Registando...' : completed === active.id ? 'Treino concluído' : 'Concluir treino'}</button>
          </section>}
        </>
      )}
    </main>
  )
}
