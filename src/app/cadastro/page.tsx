'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function CadastroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [terms, setTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const strength = useMemo(() => {
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++
    return score
  }, [password])

  const strengthLabel = ['Muito fraca', 'Fraca', 'Boa', 'Forte', 'Muito forte'][strength]

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password !== confirm) return setError('As palavras-passe não coincidem.')
    if (!terms) return setError('Aceite os Termos de Uso e a Política de Privacidade para continuar.')
    const { error } = await createClient().auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) setError(error.message)
    else setMessage('Cadastro enviado. Verifique o seu e-mail para confirmar a conta.')
  }

  async function oauth(provider: 'google' | 'apple') {
    setError('')
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) setError(error.message)
  }

  return (
    <main className="signup-page">
      <header className="signup-topbar">
        <Link href="/" className="signup-brand"><span className="brand-mark">P</span><span>PRETREINO</span></Link>
        <div className="signup-account">Já tem uma conta? <Link href="/login" className="signup-login">Entrar</Link></div>
      </header>

      <section className="signup-content">
        <div className="signup-hero">
          <div className="signup-pill">✦ &nbsp; Transforme seu treino. Transforme sua vida.</div>
          <h1>Crie sua conta e<br />comece sua <span>melhor<br />versão hoje.</span></h1>
          <p>Junte-se a milhares de pessoas que estão evoluindo com treinos personalizados, nutrição inteligente e o poder da IA.</p>

          <div className="benefit-grid">
            <div className="benefit"><div className="benefit-icon purple">♒</div><div><strong>Treinos personalizados</strong><small>Planos adaptados ao seu objetivo e nível de experiência.</small></div></div>
            <div className="benefit"><div className="benefit-icon blue">♜</div><div><strong>Nutrição inteligente</strong><small>Alimentação personalizada para potencializar resultados.</small></div></div>
            <div className="benefit"><div className="benefit-icon cyan">⌁</div><div><strong>Acompanhamento real</strong><small>Métricas, evolução e insights para você crescer sempre.</small></div></div>
            <div className="benefit"><div className="benefit-icon pink">✦</div><div><strong>IA que potencializa</strong><small>O PRETREINO IA analisa e orienta cada passo da sua jornada.</small></div></div>
          </div>

          <div className="protection"><div className="shield">✓</div><div><strong>Seus dados estão protegidos</strong><small>Utilizamos criptografia e seguimos os mais altos padrões de segurança.</small></div></div>
        </div>

        <div className="athlete-art"><img src="/pretreino-athlete.svg" alt="" /></div>

        <div className="signup-card">
          <div className="signup-card-head"><div className="user-badge">♙</div><div><h2>Criar minha conta</h2><p>Preencha os dados abaixo para começar</p></div></div>
          <form onSubmit={submit} className="signup-form">
            <div className="signup-fields two-cols">
              <label>Nome completo<input placeholder="Ex.: João da Silva" value={name} onChange={e => setName(e.target.value)} required /></label>
              <label>E-mail<input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            </div>
            <label>Senha<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} placeholder="Crie uma senha segura" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">{showPassword ? '◉' : '◌'}</button></div><div className="strength"><span>Força da senha: <b className={strength < 2 ? 'weak' : strength < 4 ? 'medium' : 'strong'}>{strengthLabel}</b></span><div>{[0,1,2,3,4].map(i => <i key={i} className={i < strength ? 'filled' : ''} />)}</div></div></label>
            <label>Confirmar senha<div className="password-wrap"><input type={showConfirm ? 'text' : 'password'} placeholder="Confirme sua senha" value={confirm} onChange={e => setConfirm(e.target.value)} required /><button type="button" onClick={() => setShowConfirm(v => !v)} aria-label="Mostrar confirmação">{showConfirm ? '◉' : '◌'}</button></div></label>
            <label className="terms"><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span>Concordo com os <a href="#termos">Termos de Uso</a> e <a href="#privacidade">Política de Privacidade</a></span></label>
            <button className="signup-submit" type="submit">Criar minha conta <span>→</span></button>
          </form>
          <div className="or"><span>ou cadastre-se com</span></div>
          <div className="social-row"><button type="button" onClick={() => oauth('google')}>G&nbsp;&nbsp; Google</button><button type="button" onClick={() => oauth('apple')}>●&nbsp;&nbsp; Apple</button></div>
          {message && <p className="signup-success">{message}</p>}
          {error && <p className="signup-error">{error}</p>}
          <p className="consent">Ao criar uma conta, você concorda em receber comunicações do PRETREINO. Você pode cancelar quando quiser.</p>
        </div>
      </section>
    </main>
  )
}
