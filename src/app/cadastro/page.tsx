'use client'
import {FormEvent,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
export default function CadastroPage(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setError('');setMessage('');const {error}=await createClient().auth.signUp({email,password,options:{data:{full_name:name}}});if(error)setError(error.message);else setMessage('Cadastro enviado. Verifique seu e-mail para confirmar a conta.')}
 return <main className="card"><h1>Criar conta</h1><form className="stack" onSubmit={submit}><label>Nome<input value={name} onChange={e=>setName(e.target.value)} required/></label><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Senha<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>Criar conta</button></form>{message&&<p className="success">{message}</p>}{error&&<p className="error">{error}</p>}<p><a href="/login">Já tenho uma conta</a></p></main>
}
