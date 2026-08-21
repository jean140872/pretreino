'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await createClient().auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else window.location.href = '/dashboard'
  }

  return (
    <main className="login-page">
      <header className="login-topbar">
        <Link href="/" className="login-brand">
          <span className="login-brand-mark">P</span>
          <span>PRETREINO</span>
        </Link>
        <div className="login-account">
          Ainda não tem uma conta? <Link href="/cadastro">Criar minha conta</Link>
        </div>
      </header>

      <section className="login-content">
        <div className="login-intro">
          <div className="login-pill">✦ &nbsp; Bem-vindo de volta</div>
          <h1>Entre na sua conta e<br />continue sua <span>evolução.</span></h1>
          <p>Retome seus treinos, acompanhe sua evolução e continue avançando com o PRETREINO.</p>

          <div className="login-benefits">
            <div><span className="login-benefit-icon purple">↗</span><div><strong>Seu progresso</strong><small>Tenha suas métricas e evolução sempre à mão.</small></div></div>
            <div><span className="login-benefit-icon blue">▣</span><div><strong>Treinos personalizados</strong><small>Continue de onde parou com seus planos de treino.</small></div></div>
            <div><span className="login-benefit-icon cyan">✦</span><div><strong>Inteligência PRETREINO</strong><small>Dados e insights para ajudar você a evoluir.</small></div></div>
          </div>

          <div className="login-security"><span>✓</span><div><strong>Ambiente seguro</strong><small>Seus dados e acesso são protegidos.</small></div></div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <div className="login-user-badge">♙</div>
            <div><h2>Entrar na plataforma</h2><p>Acesse sua conta para continuar</p></div>
          </div>

          <form onSubmit={submit} className="login-form">
            <label>E-mail<input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label>Senha
              <div className="login-password-wrap">
                <input type={showPassword ? 'text' : 'password'} placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">{showPassword ? '◉' : '◌'}</button>
              </div>
            </label>

            <div className="login-options"><label className="remember"><input type="checkbox" /> <span>Lembrar de mim</span></label><Link href="/recuperar-senha">Esqueci minha senha</Link></div>
            <button className="login-submit" type="submit">Entrar na plataforma <span>→</span></button>
          </form>

          {error && <p className="login-error">{error}</p>}

          <div className="login-divider"><span>ou continue com</span></div>
          <div className="login-social"><button type="button"><span>G</span> Google</button><button type="button"><span>●</span> Apple</button></div>
          <p className="login-register">Ainda não possui uma conta? <Link href="/cadastro">Criar minha conta</Link></p>
          <p className="login-consent">Ao entrar, você concorda com os Termos de Uso e a Política de Privacidade do PRETREINO.</p>
        </div>
      </section>

      <style jsx global>{`
        .login-page{min-height:100vh;color:#f8f7ff;background:radial-gradient(circle at 24% 26%,rgba(115,40,225,.25),transparent 34%),radial-gradient(circle at 84% 52%,rgba(15,88,210,.18),transparent 31%),linear-gradient(135deg,#03020d 0%,#07021b 46%,#020a20 100%);overflow:hidden}
        .login-topbar{height:82px;padding:0 5.5vw;display:flex;align-items:center;justify-content:space-between;background:rgba(2,2,11,.82);border-bottom:1px solid rgba(255,255,255,.08)}
        .login-brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none;font-size:22px;font-weight:900;letter-spacing:-.04em}.login-brand-mark{width:38px;height:38px;display:grid;place-items:center;border-radius:11px;background:linear-gradient(145deg,#7c3aed,#06b6d4);box-shadow:0 0 24px rgba(124,58,237,.38)}
        .login-account{color:#aaa7b5;font-size:14px}.login-account a{color:#c4b5fd;text-decoration:none;font-weight:700}.login-account a:hover{color:#fff}
        .login-content{width:min(1180px,calc(100% - 48px));min-height:calc(100vh - 82px);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(430px,.72fr);gap:70px;align-items:center;padding:38px 0 52px}
        .login-intro{padding-left:8px}.login-pill{display:inline-flex;padding:9px 15px;border:1px solid rgba(167,139,250,.2);border-radius:999px;background:rgba(76,29,149,.18);color:#d8b4fe;font-size:14px;margin-bottom:22px}.login-intro h1{margin:0;font-size:clamp(46px,5vw,68px);line-height:1.02;letter-spacing:-.055em;font-weight:900}.login-intro h1 span{background:linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent}.login-intro>p{max-width:590px;margin:24px 0 30px;color:#cbd5e1;font-size:18px;line-height:1.55}
        .login-benefits{display:grid;gap:19px;max-width:570px}.login-benefits>div{display:flex;gap:15px;align-items:center}.login-benefit-icon{width:48px;height:48px;flex:0 0 48px;display:grid;place-items:center;border-radius:13px;color:#fff;font-size:21px}.login-benefit-icon.purple{background:linear-gradient(145deg,#7c3aed,#4f46e5)}.login-benefit-icon.blue{background:linear-gradient(145deg,#2563eb,#0ea5e9)}.login-benefit-icon.cyan{background:linear-gradient(145deg,#0891b2,#06b6d4)}.login-benefits strong{display:block;font-size:16px;margin-bottom:3px}.login-benefits small{display:block;color:#aeb8c9;font-size:14px;line-height:1.45}
        .login-security{max-width:570px;margin-top:30px;padding:17px 19px;display:flex;gap:13px;align-items:center;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(15,23,42,.5)}.login-security>span{width:36px;height:36px;display:grid;place-items:center;border-radius:50%;color:#34d399;border:1px solid rgba(52,211,153,.4);background:rgba(16,185,129,.08);font-weight:900}.login-security strong{display:block;font-size:14px}.login-security small{display:block;color:#9ca7b8;margin-top:3px}
        .login-card{padding:34px 38px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:linear-gradient(145deg,rgba(17,17,35,.94),rgba(5,7,21,.96));box-shadow:0 35px 100px rgba(0,0,0,.44),inset 0 1px rgba(255,255,255,.06)}.login-card-head{display:flex;align-items:center;gap:16px;margin-bottom:27px}.login-user-badge{width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:linear-gradient(145deg,rgba(124,58,237,.35),rgba(91,33,182,.18));border:1px solid rgba(167,139,250,.3);color:#c4b5fd;font-size:26px}.login-card h2{margin:0;font-size:26px;letter-spacing:-.02em}.login-card-head p{margin:5px 0 0;color:#8f8d9d;font-size:13px}
        .login-form{display:grid;gap:18px}.login-form>label{display:grid;gap:8px;color:#f3f1f8;font-size:14px;font-weight:700}.login-form input:not([type=checkbox]){width:100%;height:54px;box-sizing:border-box;padding:0 16px;border:1px solid rgba(100,116,139,.42);border-radius:10px;background:rgba(3,5,18,.72);color:#fff;outline:none;font-size:15px}.login-form input:not([type=checkbox])::placeholder{color:#626579}.login-form input:not([type=checkbox]):focus{border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,.12)}.login-password-wrap{position:relative}.login-password-wrap input{padding-right:48px!important}.login-password-wrap button{position:absolute;right:8px;top:7px;width:40px;height:40px;border:0;background:transparent;color:#8b91a3;cursor:pointer}.login-options{display:flex;align-items:center;justify-content:space-between;margin-top:-2px;font-size:13px}.remember{display:flex!important;align-items:center!important;gap:7px!important;color:#a9adba!important;font-weight:500!important}.remember input{width:16px;height:16px;accent-color:#7c3aed}.login-options a{color:#b99cff;text-decoration:none;font-weight:700}.login-options a:hover{color:#fff}
        .login-submit{height:56px;border:0;border-radius:11px;color:#fff;background:linear-gradient(100deg,#7c3aed,#4f46e5);font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 0 26px rgba(124,58,237,.34);transition:.2s}.login-submit span{font-size:22px;margin-left:12px}.login-submit:hover{transform:translateY(-1px);box-shadow:0 0 34px rgba(124,58,237,.5)}.login-error{margin:14px 0 0;padding:12px 14px;border:1px solid rgba(248,113,113,.28);border-radius:10px;background:rgba(127,29,29,.15);color:#fca5a5;font-size:13px}
        .login-divider{display:flex;align-items:center;gap:13px;margin:24px 0 17px;color:#f2f0fa;font-size:13px;font-weight:600}.login-divider:before,.login-divider:after{content:"";height:1px;flex:1;background:rgba(255,255,255,.25)}.login-divider span{white-space:nowrap}.login-social{display:grid;grid-template-columns:1fr 1fr;gap:13px}.login-social button{height:52px;border:1px solid rgba(255,255,255,.3);border-radius:10px;background:#05060d;color:#fff;font-size:14px;font-weight:700;cursor:pointer}.login-social button span{margin-right:8px}.login-social button:hover{border-color:#a78bfa;background:#0d0e1c}.login-register{text-align:center;color:#9b9aaa;font-size:13px;margin:21px 0 0}.login-register a{color:#c4b5fd;text-decoration:none;font-weight:800}.login-consent{text-align:center;color:#777888;font-size:11px;line-height:1.5;margin:17px 0 0}
        @media(max-width:980px){.login-content{grid-template-columns:1fr;max-width:650px;gap:25px}.login-intro{padding-left:0}.login-intro h1{font-size:52px}.login-security{max-width:none}.login-card{order:2}}
        @media(max-width:600px){.login-topbar{height:72px;padding:0 18px}.login-brand{font-size:18px}.login-brand-mark{width:34px;height:34px}.login-account{font-size:12px}.login-content{width:calc(100% - 28px);padding:28px 0}.login-intro h1{font-size:42px}.login-intro>p{font-size:16px}.login-card{padding:27px 20px}.login-social{grid-template-columns:1fr}.login-options{font-size:12px}}
      `}</style>
    </main>
  )
}
