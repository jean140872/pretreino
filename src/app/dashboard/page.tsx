'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage(){
 const [email,setEmail]=useState<string|null>(null)
 const [name,setName]=useState('')
 useEffect(()=>{createClient().auth.getUser().then(({data})=>{if(!data.user){window.location.href='/login';return}setEmail(data.user.email??null);setName(data.user.user_metadata?.full_name??'')})},[])
 async function logout(){await createClient().auth.signOut();window.location.href='/login'}
 return <main className="page-shell"><header className="topbar"><span className="brand">PRETREINO</span><button className="link-button" onClick={logout}>Sair</button></header><section className="dashboard-hero"><div className="eyebrow">DASHBOARD</div><h1>{name ? `Olá, ${name}` : 'Olá'}</h1><p className="muted">Aqui começa o acompanhamento da sua evolução.</p>{email&&<p className="muted small">{email}</p>}</section><section className="dashboard-grid"><Link className="module-card" href="/perfil-fitness"><span>01</span><h2>Perfil Fitness</h2><p>Dados físicos, objetivo e ponto de partida.</p></Link><Link className="module-card" href="/evolucao"><span>02</span><h2>Evolução</h2><p>Histórico de medições e acompanhamento da tendência.</p></Link><div className="module-card disabled"><span>03</span><h2>Treino</h2><p>Módulo preparado para a sequência do projeto.</p></div><div className="module-card disabled"><span>04</span><h2>Alimentação</h2><p>Módulo preparado para a sequência do projeto.</p></div></section></main>
}
