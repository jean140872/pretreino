'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ProgressState = { percent: number; next: string; detail: string }

function calculateProgress(input: { profile: number; plan: boolean; measurements: number; workouts: number }): ProgressState {
  const profileScore = input.profile >= 3 ? 10 : input.profile >= 2 ? 7 : input.profile >= 1 ? 4 : 0
  const planScore = input.plan ? 25 : 0
  const measurementScore = Math.min(input.measurements, 4) * 5
  const workoutScore = Math.min(input.workouts, 6) * 4
  const percent = Math.min(100, profileScore + planScore + measurementScore + workoutScore)
  const next = !input.plan ? 'Completar o seu plano' : input.measurements < 2 ? 'Registar a próxima medição' : input.workouts < 3 ? 'Completar mais um treino' : 'Continuar a sua consistência'
  const detail = percent >= 75 ? 'A sua jornada está a ganhar ritmo. Continue.' : percent >= 50 ? 'Já existe uma base sólida. Continue a construir.' : percent >= 25 ? 'Você já começou. O próximo marco está ao seu alcance.' : 'Dê o primeiro passo e veja o seu progresso crescer.'
  return { percent, next, detail }
}

export default function ProgressOverlay() {
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [open, setOpen] = useState(true)

  useEffect(() => {
    async function load() {
      const client = createClient()
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) return
      const user = auth.user
      const [measurements, plan, workouts] = await Promise.all([
        client.from('fitness_measurements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        client.from('training_plans').select('id').eq('user_id', user.id).eq('active', true).limit(1).maybeSingle(),
        client.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ])
      const metadata = user.user_metadata ?? {}
      const profile = ['full_name', 'goal', 'gender', 'birth_date'].filter((key) => Boolean(metadata[key])).length
      setProgress(calculateProgress({ profile, plan: Boolean(plan.data?.id), measurements: measurements.count ?? 0, workouts: workouts.count ?? 0 }))
    }
    load()
  }, [])

  if (!progress) return null

  return <div className={`progress-overlay ${open ? 'is-open' : 'is-closed'}`}>
    <button className="progress-toggle" onClick={() => setOpen(!open)} aria-label="Mostrar progresso">{open ? '×' : `${progress.percent}%`}</button>
    {open && <div className="progress-panel">
      <div className="progress-panel-top"><span>SEU PROGRESSO</span><strong>{progress.percent}%</strong></div>
      <div className="progress-bar"><i style={{ width: `${progress.percent}%` }} /></div>
      <div className="progress-copy"><div><b>{progress.detail}</b><small>Próximo marco: {progress.next}</small></div><span>✦</span></div>
    </div>}
    <style jsx>{`.progress-overlay{position:fixed;right:30px;top:96px;z-index:30}.progress-panel{width:330px;padding:18px 18px 16px;border:1px solid rgba(192,132,252,.22);border-radius:17px;background:linear-gradient(145deg,rgba(20,16,38,.97),rgba(9,11,20,.97));box-shadow:0 22px 70px rgba(0,0,0,.4),0 0 45px rgba(124,58,237,.1);backdrop-filter:blur(18px)}.progress-panel-top{display:flex;align-items:center;justify-content:space-between}.progress-panel-top span{font-size:9px;letter-spacing:.16em;color:#8d91a3;font-weight:900}.progress-panel-top strong{font-size:22px;background:linear-gradient(90deg,#d8b4fe,#60a5fa);-webkit-background-clip:text;color:transparent}.progress-bar{height:7px;border-radius:99px;background:rgba(255,255,255,.08);margin:12px 0 13px;overflow:hidden}.progress-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#60a5fa);box-shadow:0 0 16px rgba(124,58,237,.65)}.progress-copy{display:flex;justify-content:space-between;gap:14px}.progress-copy b{display:block;color:#fff;font-size:11px;line-height:1.35}.progress-copy small{display:block;color:#777b8e;font-size:9px;margin-top:5px}.progress-copy>span{color:#c084fc;font-size:20px}.progress-toggle{position:absolute;right:-10px;top:-10px;width:25px;height:25px;border-radius:50%;border:1px solid rgba(255,255,255,.12);background:#151522;color:#a5a8b6;cursor:pointer}.is-closed .progress-toggle{position:static;width:auto;height:auto;min-width:48px;padding:8px 11px;border-radius:12px;color:#fff;font-size:11px;font-weight:900;background:linear-gradient(90deg,#6d28d9,#4338ca);box-shadow:0 10px 30px rgba(67,56,202,.3)}@media(max-width:700px){.progress-overlay{right:14px;left:14px;top:88px}.progress-panel{width:100%}}`}</style>
  </div>
}
