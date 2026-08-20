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
              <div>
                <strong>Treinos</strong>
                <span>personalizados</span>
              </div>
              <div>
                <strong>Evolução</strong>
                <span>acompanhada</span>
              </div>
              <div>
                <strong>IA</strong>
                <span>inteligente</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-glow"></div>
            <div className="fitness-card">
              <span className="badge badge-success">EVOLUÇÃO</span>
              <h2>Seu progresso</h2>
              <div className="progress-number">+24%</div>
              <p>Continue evoluindo.</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <div className="progress-info">
                <span>Hoje</span>
                <strong>Meta em andamento</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="section-heading">
            <span className="badge badge-primary">PRETREINO</span>
            <h2>Mais do que um aplicativo fitness.</h2>
            <p>
              Tudo pensado para acompanhar sua jornada, organizar sua rotina
              e transformar seus dados em decisões melhores.
            </p>
          </div>
          <div className="grid grid-3">
            <article className="card feature-card">
              <div className="feature-icon">01</div>
              <h3>Perfil Fitness</h3>
              <p>
                Seus objetivos, medidas, experiência e rotina reunidos em um
                único lugar.
              </p>
            </article>
            <article className="card feature-card">
              <div className="feature-icon">02</div>
              <h3>Treinos inteligentes</h3>
              <p>
                Uma experiência preparada para evoluir junto com seu nível e
                seus objetivos.
              </p>
            </article>
            <article className="card feature-card">
              <div className="feature-icon">03</div>
              <h3>Sua evolução</h3>
              <p>
                Acompanhe peso, medidas e progresso para enxergar sua evolução
                ao longo do tempo.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  )
}
