'use client'

export default function Home() {
  return (
    <main className="page">
      <div className="container">
        <section className="hero card">
          <div className="hero-content">
            <span className="badge badge-primary">PRETREINO</span>
            <h1 className="page-title hero-title">
              Seu treino.
              <br />
              Sua evolução.
              <br />
              <span>Seu próximo nível.</span>
            </h1>
            <p className="page-subtitle hero-text">
              Uma plataforma inteligente para transformar seus objetivos
              fitness em evolução de verdade.
            </p>
            <div className="hero-actions">
              <a href="/login" className="btn btn-primary">
                Entrar na plataforma
              </a>
              <a href="/cadastro" className="btn btn-secondary">
                Criar minha conta
              </a>
            </div>
            <div className="hero-benefits">
              <div><strong>Treinos</strong><span>personalizados</span></div>
              <div><strong>Evolução</strong><span>acompanhada</span></div>
              <div><strong>IA</strong><span>inteligente</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-glow"></div>
            <div className="fitness-card">
              <span className="badge badge-success">EVOLUÇÃO</span>
              <h2>Seu progresso</h2>
              <div className="progress-number">+24%</div>
              <p>Continue evoluindo.</p>
              <div className="progress-bar"><div className="progress-fill"></div></div>
              <div className="progress-info"><span>Hoje</span><strong>Meta em andamento</strong></div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="section-heading">
            <span className="badge badge-primary">PRETREINO</span>
            <h2>Mais do que um aplicativo fitness.</h2>
            <p>Tudo pensado para acompanhar sua jornada, organizar sua rotina e transformar seus dados em decisões melhores.</p>
          </div>
          <div className="grid grid-3">
            <article className="card feature-card"><div className="feature-icon">01</div><h3>Perfil Fitness</h3><p>Seus objetivos, medidas, experiência e rotina reunidos em um único lugar.</p></article>
            <article className="card feature-card"><div className="feature-icon">02</div><h3>Treinos inteligentes</h3><p>Uma experiência preparada para evoluir junto com seu nível e seus objetivos.</p></article>
            <article className="card feature-card"><div className="feature-icon">03</div><h3>Sua evolução</h3><p>Acompanhe peso, medidas e progresso para enxergar sua evolução ao longo do tempo.</p></article>
          </div>
        </section>
      </div>
      <style jsx global>{`
        .hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:40px;align-items:center;padding:48px;overflow:hidden;position:relative}
        .hero-content{position:relative;z-index:2}.hero-title{font-size:clamp(42px,6vw,72px);line-height:1.02;margin-top:18px}.hero-title span{background:linear-gradient(135deg,#6d28d9,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent}.hero-text{font-size:18px;max-width:620px}
        .hero-actions{display:flex;gap:12px;align-items:center;margin-top:28px;flex-wrap:wrap}.hero-benefits{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:38px;padding-top:24px;border-top:1px solid #e5e7eb}.hero-benefits div{display:grid;gap:4px}.hero-benefits strong{font-size:15px}.hero-benefits span{font-size:13px;color:#64748b}
        .hero-visual{min-height:340px;display:grid;place-items:center;position:relative}.visual-glow{position:absolute;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(109,40,217,.25),rgba(6,182,212,.12) 45%,transparent 70%);filter:blur(10px)}.fitness-card{position:relative;width:min(360px,100%);padding:30px;border-radius:24px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 20px 60px rgba(15,23,42,.12)}.fitness-card h2{margin:22px 0 8px;font-size:28px}.fitness-card p{margin:0;color:#64748b}.progress-number{font-size:56px;font-weight:900;letter-spacing:-.05em;background:linear-gradient(135deg,#6d28d9,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent;margin:4px 0 10px}.progress-bar{width:100%;height:12px;margin-top:22px;overflow:hidden;border-radius:999px;background:#ede9fe}.progress-fill{width:24%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#6d28d9,#06b6d4)}.progress-info{display:flex;justify-content:space-between;gap:12px;margin-top:10px;color:#64748b;font-size:12px}.progress-info strong{color:#17202a}
        .features{padding-bottom:20px}.features .section-heading{padding:54px 0 28px}.features .section-heading h2{margin:12px 0 0;font-size:38px;letter-spacing:-.03em}.features .section-heading p{max-width:720px}.feature-card{min-height:220px}.feature-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:#ede9fe;color:#4c1d95;font-weight:900;margin-bottom:28px}.feature-card h3{margin:0 0 8px;font-size:22px}.feature-card p{margin:0;color:#64748b;line-height:1.6}
        @media(max-width:800px){.hero{grid-template-columns:1fr;padding:28px;gap:24px}.hero-title{font-size:clamp(38px,11vw,56px)}.hero-benefits{gap:12px}.hero-visual{min-height:280px}.features .section-heading h2{font-size:30px}.grid-3{grid-template-columns:1fr}}
      `}</style>
    </main>
  )
}
