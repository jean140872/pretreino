'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)))
  }, [])

  return (
    <main className="pretreino-shell">
      <section className="hero-card">
        <div className="eyebrow">PRETREINO</div>
        <h1>Seu treino começa antes do treino.</h1>
        <p>Organize seu perfil fitness, acompanhe sua evolução e tenha uma base preparada para os próximos módulos da plataforma.</p>
        <div className="actions">
          <Link className="button primary" href={signedIn ? '/dashboard' : '/login'}>{signedIn ? 'Ir para o dashboard' : 'Entrar'}</Link>
          {!signedIn && <Link className="button secondary" href="/cadastro">Criar conta</Link>}
        </div>
      </section>
    </main>
  )
}
