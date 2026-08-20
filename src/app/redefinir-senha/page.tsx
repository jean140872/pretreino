'use client'
import {FormEvent,useState} from 'react'
import {createClient} from '@/lib/supabase/client'
export default function RedefinirSenhaPage(){
 const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function submit(e:FormEvent){e.preventDefault();setError('');const {error}=await createClient().auth.updateUser({password});if(error)setError(error.message);else setMessage('Senha atualizada com sucesso.')}
 return <main className="card"><h1>Redefinir senha</h1><form className="stack" onSubmit={submit}><label>Nova senha<input type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></label><button>Atualizar senha</button></form>{message&&<p className="success">{message}</p>}{error&&<p className="error">{error}</p>}</main>
}
