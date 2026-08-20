'use client'
import {FormEvent,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
export default function LoginPage(){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setError('');const {error}=await createClient().auth.signInWithPassword({email,password});if(error)setError(error.message);else window.location.href='/dashboard'}
 return <main className="card"><h1>Entrar</h1><form className="stack" onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Senha<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>Entrar</button></form>{error&&<p className="error">{error}</p>}<p><a href="/recuperar-senha">Esqueci minha senha</a></p><p><a href="/cadastro">Criar conta</a></p></main>
}
