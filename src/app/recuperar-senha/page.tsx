'use client'
import {FormEvent,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
export default function RecuperarSenhaPage(){
 const [email,setEmail]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setError('');setMessage('');const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/redefinir-senha`});if(error)setError(error.message);else setMessage('Se o e-mail estiver cadastrado, enviaremos as instruções.')}
 return <main className="card"><h1>Recuperar senha</h1><form className="stack" onSubmit={submit}><label>E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><button>Enviar instruções</button></form>{message&&<p className="success">{message}</p>}{error&&<p className="error">{error}</p>}</main>
}
