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
    e.preventDefault(); setError(''); setMessage('')
    if (password !== confirm) return setError('As palavras-passe não coincidem.')
    if (!terms) return setError('Aceite os Termos de Uso e a Política de Privacidade para continuar.')
    const { error } = await createClient().auth.signUp({ email, password, options: { data: { full_name: name } } })
    if (error) setError(error.message); else setMessage('Cadastro enviado. Verifique o seu e-mail para confirmar a conta.')
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
          <div className="signup-footer">© 2026 PRETREINO. Todos os direitos reservados.</div>
        </div>

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
          <div className="social-row"><button type="button" onClick={() => oauth('google')}><span className="social-logo google-logo">G</span><span>Continuar com Google</span></button><button type="button" onClick={() => oauth('apple')}><span className="social-logo apple-logo">●</span><span>Continuar com Apple</span></button></div>
          {message && <p className="signup-success">{message}</p>}
          {error && <p className="signup-error">{error}</p>}
          <p className="consent">Ao criar uma conta, você concorda em receber comunicações do PRETREINO. Você pode cancelar quando quiser.</p>
        </div>
      </section>

      <style jsx global>{`
        .signup-page{min-height:100vh!important;color:#f8f7ff!important;background:radial-gradient(circle at 25% 28%,rgba(115,40,225,.25),transparent 34%),radial-gradient(circle at 88% 55%,rgba(15,88,210,.18),transparent 30%),linear-gradient(135deg,#03020d 0%,#07021b 46%,#020a20 100%)!important;overflow:hidden!important}
        .signup-topbar{height:82px!important;padding:0 5.5vw!important;background:rgba(2,2,11,.82)!important;z-index:20!important}
        .signup-brand{font-size:22px!important}.brand-mark{width:38px!important;height:38px!important}
        .signup-content{width:min(1480px,calc(100% - 52px))!important;min-height:calc(100vh - 82px)!important;grid-template-columns:minmax(0,1.06fr) minmax(500px,.84fr)!important;gap:48px!important;padding:28px 0 36px!important}
        .signup-hero{padding-left:14px!important;z-index:6!important}.signup-pill{margin-bottom:20px!important}.signup-hero h1{font-size:clamp(48px,5vw,72px)!important;max-width:700px!important}.signup-hero>p{font-size:17px!important;max-width:620px!important;margin:25px 0 31px!important}
        .benefit-grid{gap:25px 34px!important}.benefit-icon{width:56px!important;height:56px!important}.benefit small{max-width:235px!important}
        .protection{margin-top:29px!important}.signup-footer{margin-top:24px!important}
        .signup-card{z-index:8!important;padding:34px 40px!important;background:linear-gradient(145deg,rgba(17,17,35,.91),rgba(5,7,21,.94))!important;border-color:rgba(255,255,255,.14)!important;box-shadow:0 35px 100px rgba(0,0,0,.44),inset 0 1px rgba(255,255,255,.06)!important}
        .signup-card h2{font-size:30px!important}.signup-card-head{margin-bottom:25px!important}.user-badge{width:64px!important;height:64px!important}
        .signup-form{gap:18px!important}.signup-form input:not([type=checkbox]){height:54px!important;background:rgba(3,5,18,.7)!important}.signup-submit{height:56px!important}
        .or{display:flex!important;align-items:center!important;justify-content:center!important;gap:16px!important;margin:24px 0 18px!important;color:#f2f0fa!important;font-size:14px!important;font-weight:600!important;opacity:1!important}.or:before,.or:after{content:""!important;display:block!important;height:1px!important;flex:1!important;background:rgba(255,255,255,.28)!important;opacity:1!important}.or span{white-space:nowrap!important;text-shadow:0 1px 8px rgba(0,0,0,.8)!important}
        .social-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important}.social-row button{height:54px!important;min-height:54px!important;border:1px solid rgba(255,255,255,.38)!important;border-radius:11px!important;background:#05060d!important;color:#fff!important;opacity:1!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;font-size:15px!important;font-weight:700!important;box-shadow:inset 0 1px rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.28)!important;cursor:pointer!important;visibility:visible!important}.social-row button:hover{border-color:#a06cff!important;background:#0d0e1c!important;transform:translateY(-1px)!important}.social-logo{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:22px!important;height:22px!important;font-weight:800!important}.google-logo{font-size:18px!important;color:#fff!important}.apple-logo{font-size:12px!important;color:#fff!important}.consent{color:#aaa7b5!important}
        @media(max-width:1050px){.signup-content{grid-template-columns:1fr!important;max-width:760px!important}.signup-card{margin-top:10px!important}}
        @media(max-width:700px){.signup-content{width:calc(100% - 28px)!important;padding:30px 0!important}.signup-hero h1{font-size:43px!important}.benefit-grid{grid-template-columns:1fr!important}.signup-card{padding:27px 20px!important}.signup-fields.two-cols{grid-template-columns:1fr!important}.social-row{grid-template-columns:1fr!important}}
      `}</style>
    </main>
  )
}
