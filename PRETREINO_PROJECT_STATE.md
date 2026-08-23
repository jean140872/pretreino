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

## Dashboard — requisitos de produto

A Dashboard não deve mostrar apenas treino, alimentação, evolução e perfil. Deve tornar visíveis e acessíveis, desde cedo:

- PRETREINO+ / Premium.
- Loja.
- Identidade visual do utilizador.
- Caminhos para compra/assinatura.
- Conteúdos/serviços que podem gerar receita.
- Treino, alimentação, evolução e perfil continuam disponíveis.

## Loja e monetização

A Loja possui uma página premium e uma página dedicada `/produtos-suplementos` alimentada por `store_products`. Produtos publicados pelo painel administrativo aparecem automaticamente; cliques são registados em `store_clicks`. O painel `/admin/loja` permite cadastrar, editar, publicar/ocultar e definir preço, imagem e links externos/afiliados.

Os preços aprovados para a estrutura de assinatura são:
- Free: R$ 0.
- Pro: R$ 39,90/mês ou R$ 299,90/ano.
- Premium: R$ 59,90/mês ou R$ 449,90/ano.

## Superfícies premium implementadas

- `/ia` — espaço premium para conversas persistidas em `ai_conversations`.
- `/comunidade` — feed premium e publicação em `community_posts`.
- `/profissionais` — directório premium ligado a `professionals`.
- `/academias` — directório premium ligado a `gyms`.
- `/admin` — centro premium de métricas ligado à view `admin_platform_metrics`.

As páginas novas não redesenham Home, Login, Cadastro, Confirmar Email ou Dashboard aprovadas.

## Sistema de assinatura

- `premium_plans` contém planos mensais e anuais.
- Pro mensal: R$ 39,90; Pro anual: R$ 299,90.
- Premium mensal: R$ 59,90; Premium anual: R$ 449,90.
- A página `/assinatura` apresenta Free, Pro e Premium e separa mensal/anual.
- O checkout usa `/api/checkout` e só activa uma assinatura após confirmação do provedor.
- Webhooks do Mercado Pago actualizam `premium_subscriptions` e `payment_events`.
- Nenhuma cobrança ou assinatura paga é simulada.

## Comércio da Loja

- `/loja` é o catálogo premium principal.
- `/produtos-suplementos` é a superfície dedicada de produtos e suplementos.
- `/carrinho` controla quantidades, remoção e subtotal.
- `/checkout-loja` recolhe dados de pedido e inicia pagamento seguro.
- `/pedidos` mostra o histórico do utilizador.
- `/admin/loja` permite gestão de catálogo.
- `/admin/pedidos` permite gestão do ciclo dos pedidos.
- `store_orders` e `store_order_items` guardam snapshots comerciais do pedido.
- Stock é validado no checkout e abatido quando o pagamento é aprovado.
- O webhook de pagamento evita abatimentos duplicados usando o evento externo como referência.
- Produtos em destaque, stock e disponibilidade são reflectidos na Loja.

## Painel administrativo

O painel administrativo foi expandido para funcionar como centro de controlo do produto, não como uma página com apenas duas opções.

- `/admin` — visão geral e métricas.
- `/admin/gestao` — pessoas, funções, receita, planos, catálogo, parceiros e auditoria.
- `/admin/loja` — gestão operacional completa da Loja.
- `/admin/pedidos` — operação dos pedidos.
- Funções administrativas ficam protegidas por verificação de administrador.
- Eventos administrativos são registados em `admin_events`.

## Segurança e performance

Foi aplicada a migration `20260821_security_and_fk_index_hardening` e, na consolidação final, `20260823_final_commerce_hardening`.

A consolidação final:
- adicionou índice para `store_order_items.product_id`;
- fixou o `search_path` da função `touch_store_order_updated_at`;
- preservou RLS e as verificações administrativas existentes.

O Advisor ainda pode sinalizar optimizações de RLS e funções administrativas SECURITY DEFINER que são deliberadas para os fluxos existentes. A protecção de passwords vazadas depende da configuração Auth do projecto e não deve ser simulada no código.

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
10. Em assinaturas, nunca simular uma cobrança real. A assinatura paga só fica activa após confirmação do provedor de pagamentos.
11. O comando de continuidade é `PRE TREINO`.

## Infraestrutura conhecida

- GitHub: `jean140872/pretreino`
- Branch: `main`
- Render Web Service: `pretreino`
- URL pública: `https://pretreino.onrender.com`
- Supabase: `fitness-ia-platform`, região `sa-east-1`.
- Supabase configurado no ambiente do Render.

## Estado da consolidação

A última passagem consolidou os módulos existentes em vez de substituir páginas aprovadas. A árvore actual inclui autenticação, dashboard, evolução, treino, nutrição, IA, comunidade, identidade visual, academias, profissionais, premium, assinatura, loja, produtos/suplementos, carrinho, checkout, pedidos e painel administrativo. O último build de produção foi concluído com sucesso no Render.

## Fonte de verdade

Para o estado técnico exacto, usar o código e o histórico de commits do repositório. Para decisões de produto e aprovações, usar este checkpoint juntamente com o contexto da conversa. Não inventar decisões que não estejam registadas.
