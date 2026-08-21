'use client'

export default function Home() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-mark">P</span>
          <span>PRETREINO</span>
        </div>
        <a href="/cadastro" className="header-login">Entrar na plataforma</a>
      </header>

      <div className="landing-container">
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="launch-badge">🚀 A nova era do seu treino começou</div>
            <h1>
              Seu treino.<br />
              Sua evolução.<br />
              <span>Seu próximo nível.</span>
            </h1>
            <p>
              O PRETREINO é a plataforma inteligente para quem leva treino a sério.
              Dados, inteligência e praticidade para resultados reais.
            </p>

            <div className="hero-buttons">
              <a href="/cadastro" className="cta cta-primary">
                <span>♙</span> Entrar na plataforma <strong>→</strong>
              </a>
              <a href="/cadastro" className="cta cta-secondary">
                <span>♙</span> Criar minha conta <strong>→</strong>
              </a>
            </div>
          </div>

          <div className="evolution-card">
            <div className="evolution-head">
              <h2>↗ Evolução geral</h2>
              <span>Este mês⌄</span>
            </div>
            <div className="progress-ring">
              <div className="progress-inner">
                <strong>+24%</strong>
                <span>de evolução<br />este mês</span>
              </div>
            </div>
            <div className="above-average">↗ <span>Você está acima da sua média!</span></div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="feature-card feature-purple">
            <div className="feature-icon">♙</div>
            <div>
              <h3>Perfil Fitness</h3>
              <p>Seu perfil completo com métricas que mostram sua evolução de verdade.</p>
              <a href="/cadastro">Saiba mais&nbsp; →</a>
            </div>
          </article>

          <article className="feature-card feature-blue">
            <div className="feature-icon">▰</div>
            <div>
              <h3>Treinos inteligentes</h3>
              <p>Treinos personalizados com base em dados, performance e objetivos.</p>
              <a href="/cadastro">Saiba mais&nbsp; →</a>
            </div>
          </article>

          <article className="feature-card feature-cyan">
            <div className="feature-icon">▥</div>
            <div>
              <h3>Sua evolução</h3>
              <p>Acompanhe seus resultados com gráficos claros e objetivos atingíveis.</p>
              <a href="/cadastro">Saiba mais&nbsp; →</a>
            </div>
          </article>
        </section>
      </div>

      <style jsx global>{`
        .landing-page {
          min-height: 100vh;
          color: #f8fafc;
          background:
            radial-gradient(circle at 34% 18%, rgba(91, 33, 182, .34), transparent 34%),
            radial-gradient(circle at 76% 26%, rgba(14, 165, 233, .18), transparent 32%),
            linear-gradient(135deg, #020617 0%, #070b24 52%, #020617 100%);
          overflow: hidden;
        }

        .landing-header {
          height: 88px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(28px, 7vw, 72px);
          border-bottom: 1px solid rgba(148, 163, 184, .12);
          background: rgba(2, 6, 23, .72);
        }

        .landing-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 29px;
          font-weight: 900;
          letter-spacing: -.04em;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: white;
          font-size: 25px;
          font-weight: 900;
          background: linear-gradient(145deg, #7c3aed, #06b6d4);
          box-shadow: 0 0 26px rgba(124, 58, 237, .45);
        }

        .header-login {
          color: #f8fafc;
          text-decoration: none;
          padding: 12px 22px;
          border: 1px solid rgba(167, 139, 250, .65);
          border-radius: 10px;
          background: rgba(15, 23, 42, .55);
          font-weight: 700;
          transition: .2s ease;
        }

        .header-login:hover { background: rgba(124, 58, 237, .18); box-shadow: 0 0 24px rgba(124, 58, 237, .2); }

        .landing-container {
          width: min(1320px, calc(100% - 56px));
          margin: 0 auto;
          padding: 50px 0 44px;
        }

        .landing-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(420px, .9fr);
          gap: 62px;
          align-items: center;
        }

        .hero-copy { padding-left: 10px; }

        .launch-badge {
          display: inline-flex;
          align-items: center;
          padding: 10px 17px;
          border: 1px solid rgba(167, 139, 250, .18);
          border-radius: 999px;
          background: rgba(76, 29, 149, .18);
          color: #d8b4fe;
          font-size: 15px;
          margin-bottom: 22px;
        }

        .hero-copy h1 {
          margin: 0;
          font-size: clamp(48px, 5.3vw, 76px);
          line-height: .99;
          letter-spacing: -.055em;
          font-weight: 900;
        }

        .hero-copy h1 span {
          background: linear-gradient(90deg, #8b5cf6 5%, #3b82f6 52%, #06b6d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .hero-copy > p {
          max-width: 650px;
          margin: 25px 0 0;
          color: #cbd5e1;
          font-size: 20px;
          line-height: 1.55;
        }

        .hero-buttons {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 30px;
        }

        .cta {
          min-width: 300px;
          height: 82px;
          padding: 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          border-radius: 11px;
          text-decoration: none;
          font-size: 20px;
          font-weight: 800;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .cta:hover { transform: translateY(-2px); }
        .cta span { font-size: 26px; }
        .cta strong { font-size: 27px; margin-left: auto; font-weight: 500; }
        .cta-primary { color: white; background: linear-gradient(100deg, #6d28d9, #7c3aed); border: 1px solid #a78bfa; box-shadow: 0 0 28px rgba(124, 58, 237, .48); }
        .cta-secondary { color: #04111f; background: linear-gradient(100deg, #22d3ee, #06b6d4); box-shadow: 0 0 28px rgba(6, 182, 212, .3); }

        .evolution-card {
          min-height: 510px;
          padding: 30px 34px;
          border: 1px solid rgba(100, 116, 139, .34);
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(15, 23, 42, .86), rgba(10, 20, 42, .62));
          box-shadow: inset 0 1px rgba(255,255,255,.03), 0 30px 70px rgba(0,0,0,.22);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .evolution-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .evolution-head h2 { margin: 0; font-size: 20px; }
        .evolution-head span { padding: 11px 15px; border: 1px solid rgba(71, 85, 105, .55); border-radius: 8px; color: #e2e8f0; font-size: 14px; }

        .progress-ring {
          width: 290px;
          height: 290px;
          margin: 34px 0 30px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: conic-gradient(from 0deg, #22d3ee 0 24%, #3b82f6 24% 30%, #312e81 30% 100%);
          position: relative;
        }

        .progress-ring::before { content: ''; position: absolute; inset: 14px; border-radius: 50%; background: #081225; }
        .progress-inner { position: relative; text-align: center; display: grid; gap: 10px; }
        .progress-inner strong { font-size: 54px; letter-spacing: -.05em; }
        .progress-inner span { color: #cbd5e1; font-size: 17px; line-height: 1.35; }
        .above-average { width: 100%; color: #34d399; font-size: 25px; }
        .above-average span { color: #e2e8f0; font-size: 16px; margin-left: 8px; vertical-align: 3px; }

        .feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; margin-top: 50px; }
        .feature-card { min-height: 205px; padding: 25px 28px; display: flex; gap: 22px; border: 1px solid rgba(100, 116, 139, .3); border-radius: 15px; background: rgba(9, 18, 37, .72); box-shadow: inset 0 1px rgba(255,255,255,.025); }
        .feature-icon { width: 72px; height: 72px; flex: 0 0 72px; display: grid; place-items: center; border-radius: 50%; font-size: 34px; color: white; }
        .feature-purple .feature-icon { background: linear-gradient(145deg, #7c3aed, #4f46e5); }
        .feature-blue .feature-icon { background: linear-gradient(145deg, #2563eb, #0ea5e9); }
        .feature-cyan .feature-icon { background: linear-gradient(145deg, #0891b2, #06b6d4); }
        .feature-card h3 { margin: 8px 0 8px; font-size: 20px; }
        .feature-card p { margin: 0; color: #cbd5e1; line-height: 1.6; font-size: 15px; }
        .feature-card a { display: inline-block; margin-top: 20px; text-decoration: none; font-weight: 800; }
        .feature-purple a { color: #a78bfa; }
        .feature-blue a { color: #38bdf8; }
        .feature-cyan a { color: #22d3ee; }

        @media (max-width: 1000px) {
          .landing-hero { grid-template-columns: 1fr; }
          .evolution-card { min-height: auto; }
          .feature-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 650px) {
          .landing-header { height: 76px; padding: 0 20px; }
          .landing-brand { font-size: 22px; }
          .brand-mark { width: 36px; height: 36px; }
          .header-login { padding: 9px 13px; font-size: 13px; }
          .landing-container { width: min(100% - 32px, 1320px); padding-top: 28px; }
          .hero-copy { padding-left: 0; }
          .hero-copy h1 { font-size: clamp(42px, 13vw, 60px); }
          .hero-copy > p { font-size: 17px; }
          .hero-buttons { flex-direction: column; }
          .cta { min-width: 0; width: 100%; height: 70px; font-size: 17px; }
          .progress-ring { width: 240px; height: 240px; }
          .progress-inner strong { font-size: 44px; }
          .feature-card { padding: 22px; }
        }
      `}</style>
    </main>
  )
}
