# PRETREINO — Project State / Checkpoint

> Documento de continuidade. O código existente no repositório e o histórico de commits são a fonte de verdade técnica. Este ficheiro regista as decisões e restrições que não devem ser perdidas entre sessões.

## Regra principal do projecto

PRETREINO é um produto comercial para gerar receita por várias vias. Não reduzir o produto a uma landing page ou a uma app fitness simples.

Quando o utilizador aprovar uma página, layout, fluxo ou decisão, essa parte fica congelada: não alterar, redesenhar ou substituir sem autorização explícita. Alterações posteriores devem ser limitadas exactamente ao que for solicitado.

## Escopo preservado

- Landing/Home premium aprovada.
- Autenticação completa.
- Cadastro e confirmação de e-mail.
- Login.
- Perfil Fitness.
- Medidas e histórico/evolução.
- Treinos personalizados.
- Alimentação/nutrição.
- PRETREINO IA.
- Comunidade.
- Academias/profissionais.
- Loja e oportunidades de afiliados.
- PRETREINO+ / Premium e pagamentos/assinatura.
- Painel administrativo e métricas.
- Identidade visual do utilizador.
- Navegação premium e caminhos de compra visíveis e fáceis de encontrar.
- Dados e autenticação com Supabase.
- Deploy através do Render.
- Código mantido no GitHub: `jean140872/pretreino`, branch `main`.

## Identidade visual aprovada

- Visual premium, escuro, moderno e forte.
- Gradientes roxo/azul e cartões com acabamento premium.
- A página de cadastro teve uma versão visual premium aprovada; depois o fundo fotográfico foi removido a pedido do utilizador. Não reintroduzir fotos no cadastro sem autorização.
- A Dashboard actualmente aprovada deve ser preservada nas partes já validadas.

## Fluxos já testados / problemas encontrados

- Botões da Home para entrar/cadastrar devem seguir os caminhos aprovados.
- A página antiga `/login` simples em HTML foi considerada inadequada e não deve ser usada como destino visual dos botões aprovados.
- O cadastro deve criar a conta e conduzir ao fluxo de confirmação de e-mail quando a configuração exigir confirmação.
- A confirmação de e-mail também precisa ter apresentação premium, não a página HTML simples anterior.
- Depois de autenticar, o utilizador entra na Dashboard.
- A Dashboard foi testada com utilizador real e aprovada como base visual.
- Foram encontrados destinos internos demasiado simples; devem receber tratamento premium sem alterar as páginas já aprovadas.

## Dashboard — requisitos de produto

A Dashboard não deve mostrar apenas treino, alimentação, evolução e perfil. Deve tornar visíveis e acessíveis, desde cedo:

- PRETREINO+ / Premium.
- Loja.
- Identidade visual do utilizador.
- Caminhos para compra/assinatura.
- Conteúdos/serviços que podem gerar receita.
- Treino, alimentação, evolução e perfil continuam disponíveis.

O objectivo é permitir que um utilizador curioso experimente rapidamente as partes do produto e também encontre as áreas comerciais sem procurar demasiado.

## Alteração técnica mais recente

Commit: `c6e92cb002f43015c1bfa2369a38bba302189783`
Mensagem: `fix: mark store page as client component`

Foi corrigida a página da Loja para funcionar como Client Component e foi feito novo deployment no Render.

Deployment final: `dep-da3rb567bikc73d64cjg` — status `live`.

Antes dele, o commit `7e9cfd6a68b3d591c1b46ec45604f7278a28c38b` teve build failure; o problema foi corrigido antes do deployment live seguinte.

## Loja

A Loja já recebeu uma página premium com:

- cabeçalho PRETREINO;
- retorno para Dashboard;
- hero de Loja;
- cards para plano personalizado, experiência alimentar e PRETREINO+;
- CTA de exploração;
- tratamento visual premium;
- responsividade.

Os itens de compra reais devem ser ligados às funcionalidades comerciais quando forem implementados; não apresentar compra fictícia como se estivesse activa.

## Princípios de alteração

1. Não criar novos esboços quando o utilizador pede aplicação directa no código.
2. Não substituir uma página aprovada por outra versão.
3. Não mexer em áreas não solicitadas.
4. Antes de afirmar que algo foi corrigido, verificar o código/deployment e, quando possível, os logs.
5. Quando houver erro de build, corrigir o erro real em vez de contornar com uma reconstrução do projecto.
6. Preservar o escopo comercial completo.
7. Priorizar experiência premium e caminhos de monetização claros.
8. Testar como utilizador final, seguindo os links e botões da plataforma.

## Infraestrutura conhecida

- GitHub: `jean140872/pretreino`
- Branch: `main`
- Render Web Service: `pretreino`
- URL pública: `https://pretreino.onrender.com`
- Supabase configurado no ambiente do Render.

## Histórico relevante de decisões

- Home/landing foi aprovada e deve permanecer intacta.
- Cadastro premium foi aprovado; não redesenhar sem pedido.
- Imagens no cadastro foram testadas; a decisão final foi deixar o fundo sem foto.
- O utilizador explicitou várias vezes que alterações devem ser cirúrgicas e apenas no ponto solicitado.
- O utilizador quer continuar o desenvolvimento por etapas e testar cada fluxo como utilizador real.

## Fonte de verdade

Para o estado técnico exacto, usar o código e o histórico de commits do repositório. Para decisões de produto e aprovações, usar este checkpoint juntamente com o contexto da conversa. Não inventar decisões que não estejam registadas.
