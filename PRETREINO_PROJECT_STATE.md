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
- A página antiga `/login` simples em HTML foi considerada inadequada e não deve ser usada como destino visual dos botões aprovados. A versão actual de Login é premium.
- O cadastro deve criar a conta e conduzir ao fluxo de confirmação de e-mail quando a configuração exigir confirmação.
- A confirmação de e-mail tem apresentação premium.
- Depois de autenticar, o utilizador entra na Dashboard.
- A Dashboard foi testada com utilizador real e aprovada como base visual.
- Foram encontrados destinos internos demasiado simples; foi feita uma varredura e esses destinos receberam um sistema visual premium comum.

## Dashboard — requisitos de produto

A Dashboard não deve mostrar apenas treino, alimentação, evolução e perfil. Deve tornar visíveis e acessíveis, desde cedo:

- PRETREINO+ / Premium.
- Loja.
- Identidade visual do utilizador.
- Caminhos para compra/assinatura.
- Conteúdos/serviços que podem gerar receita.
- Treino, alimentação, evolução e perfil continuam disponíveis.

O objectivo é permitir que um utilizador curioso experimente rapidamente as partes do produto e também encontre as áreas comerciais sem procurar demasiado.

## Varredura premium — alteração mais recente

Foi feita uma revisão da árvore de `src/app` e dos destinos internos. A análise identificou páginas genéricas que ainda usavam o sistema frio/branco antigo, incluindo:

- `/treino`
- `/nutricao`
- `/evolucao`
- `/perfil-fitness`
- `/recuperar-senha`
- `/redefinir-senha`

Em vez de substituir a lógica funcional dessas páginas, foi criado um sistema visual comum em `src/app/premium-pages.css` e importado no `src/app/layout.tsx`. Isso preserva a lógica, dados e fluxos existentes enquanto transforma os destinos genéricos num padrão premium.

## Loja e monetização

A Loja possui uma página premium e uma página dedicada `/produtos-suplementos` alimentada por `store_products`. Produtos publicados pelo painel administrativo aparecem automaticamente; cliques são registados em `store_clicks`. O painel `/admin/loja` permite cadastrar, editar, publicar/ocultar e definir preço, imagem e links externos/afiliados.

Os preços aprovados para a estrutura de assinatura são:
- Free: R$ 0.
- Pro: R$ 39,90/mês ou R$ 299,90/ano.
- Premium: R$ 59,90/mês ou R$ 449,90/ano.

A tabela `premium_plans` foi populada com PRETREINO Pro (R$ 39,90/mês) e PRETREINO Premium (R$ 59,90/mês), e a página `/premium` passou a ler esses planos dinamicamente. O checkout externo ainda não deve ser apresentado como pagamento concluído; a ligação a um provedor de pagamentos real é uma etapa própria de integração comercial.

## Continuação implementada

A análise profunda do projecto identificou que o banco já tinha núcleos para IA, comunidade, profissionais, academias e métricas, mas faltavam superfícies premium correspondentes. Foram adicionadas:

- `/ia` — espaço premium para conversas persistidas em `ai_conversations`.
- `/comunidade` — feed premium e publicação em `community_posts`.
- `/profissionais` — directório premium ligado a `professionals`.
- `/academias` — directório premium ligado a `gyms`.
- `/admin` — centro premium de métricas ligado à view `admin_platform_metrics`.

As páginas novas não redesenham Home, Login, Cadastro, Confirmar Email ou Dashboard aprovadas.

## Segurança e performance

Foi aplicada a migration `20260821_security_and_fk_index_hardening` para restringir execução de funções SECURITY DEFINER que não precisam ser chamadas pelo cliente e para adicionar índices de cobertura às foreign keys sinalizadas pelo Database Advisor. A segurança continua com RLS activo nas tabelas públicas.

O Advisor também sinaliza optimizações de RLS (`(select auth.uid())`), políticas permissivas duplicadas e protecção contra passwords comprometidas. A protecção de passwords vazadas depende da configuração Auth do projecto e não foi simulada no código.

## Princípios de alteração

1. Não criar novos esboços quando o utilizador pede aplicação directa no código.
2. Não substituir uma página aprovada por outra versão.
3. Não mexer em áreas não solicitadas.
4. Antes de afirmar que algo foi corrigido, verificar o código/deployment e, quando possível, os logs.
5. Quando houver erro de build, corrigir o erro real em vez de contornar com uma reconstrução do projecto.
6. Preservar o escopo comercial completo.
7. Priorizar experiência premium e caminhos de monetização claros.
8. Testar como utilizador final, seguindo os links e botões da plataforma.
9. Quando for pedido que todas as páginas sejam premium, aplicar o padrão aos destinos frios sem destruir a lógica ou as páginas explicitamente aprovadas.

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
- O comando de continuidade do projecto é `PRE TREINO`.

## Fonte de verdade

Para o estado técnico exacto, usar o código e o histórico de commits do repositório. Para decisões de produto e aprovações, usar este checkpoint juntamente com o contexto da conversa. Não inventar decisões que não estejam registadas.
