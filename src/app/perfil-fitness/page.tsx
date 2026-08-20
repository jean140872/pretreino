'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  name: string
  goal: string
  height: string
  weight: string
  waist: string
}

const emptyProfile: Profile = { name: '', goal: 'Hipertrofia', height: '', weight: '', waist: '' }

export default function PerfilFitnessPage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const client = createClient()
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        window.location.href = '/login'
        return
      }

      const { data: row, error: profileError } = await client
        .from('fitness_profiles')
        .select('goal,height_cm,weight_kg,waist_cm')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profileError) {
        setError('Não foi possível carregar o perfil. Verifique se a migração do Supabase foi aplicada.')
      } else {
        setProfile({
          name: data.user.user_metadata?.full_name ?? '',
          goal: row?.goal ?? emptyProfile.goal,
          height: row?.height_cm?.toString() ?? '',
          weight: row?.weight_kg?.toString() ?? '',
          waist: row?.waist_cm?.toString() ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)

    const client = createClient()
    const { data: auth } = await client.auth.getUser()
    if (!auth.user) {
      window.location.href = '/login'
      return
    }

    const { error: saveError } = await client.from('fitness_profiles').upsert({
      user_id: auth.user.id,
      goal: profile.goal,
      height_cm: profile.height ? Number(profile.height.replace(',', '.')) : null,
      weight_kg: profile.weight ? Number(profile.weight.replace(',', '.')) : null,
      waist_cm: profile.waist ? Number(profile.waist.replace(',', '.')) : null,
    })

    if (saveError) setError(`Não foi possível guardar o perfil: ${saveError.message}`)
    else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  if (loading) return <main className="page-shell"><p className="muted">Carregando perfil...</p></main>

  return (
    <main className="page-shell">
      <header className="topbar"><Link href="/dashboard" className="brand">PRETREINO</Link><Link href="/dashboard">Dashboard</Link></header>
      <section className="section-heading"><div><div className="eyebrow">PERFIL FITNESS</div><h1>Seu ponto de partida</h1><p className="muted">Mantenha seus dados-base organizados para acompanhar a evolução.</p></div></section>
      <form className="profile-grid" onSubmit={submit}>
        <label>Nome<input value={profile.name} readOnly /></label>
        <label>Objetivo<select value={profile.goal} onChange={e => setProfile({ ...profile, goal: e.target.value })}><option>Hipertrofia</option><option>Emagrecimento</option><option>Performance</option><option>Saúde e condicionamento</option></select></label>
        <label>Altura (cm)<input inputMode="decimal" value={profile.height} onChange={e => setProfile({ ...profile, height: e.target.value })} /></label>
        <label>Peso (kg)<input inputMode="decimal" value={profile.weight} onChange={e => setProfile({ ...profile, weight: e.target.value })} /></label>
        <label>Cintura (cm)<input inputMode="decimal" value={profile.waist} onChange={e => setProfile({ ...profile, waist: e.target.value })} /></label>
        <div className="form-actions"><button className="button primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar perfil'}</button>{saved && <span className="success">Guardado no Supabase</span>}</div>
      </form>
      {error && <p className="notice error-notice">{error}</p>}
      <p className="notice">Agora os dados do Perfil Fitness são persistidos por utilizador no Supabase, com Row Level Security para impedir acesso aos dados de outros utilizadores.</p>
    </main>
  )
}
