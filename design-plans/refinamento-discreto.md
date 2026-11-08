# Refinamento discreto dos painéis do Batalha Naval

Written against: `b8de7fe3b4bf4fe20bfb6f716b10eaaed26f3f4f`.

Status: implementado nas três páginas em 2026-11-08, após autorização do usuário.

## Evidence chain

- Surface: apresentação, preparação e batalha selecionadas pelo `@switch` em `src/app/app.html:15–25`, mais encerramento renderizado pela batalha.
- Problem: não foi comprovada uma violação visual. A demanda é estética: organizar instruções, controles e resumo em painéis discretos sem mudar a identidade do jogo.
- Design evidence: o usuário escolheu “Refinamento discreto” e depois aprovou expressamente painéis para instruções, controles e resumo, com as cores, bordas e arredondamentos existentes e os tabuleiros intactos. `AGENTS.md:7–15` determina Tailwind, Lucide, português, responsividade e implementação em fases pequenas.
- Owner: os templates `src/app/telas/apresentacao/apresentacao.html`, `src/app/telas/preparacao/preparacao.html` e `src/app/telas/batalha/batalha.html` possuem essas composições. A paleta pertence a `src/styles.css:6–13`.
- Scope and affected surfaces: apenas a apresentação visual dos blocos ao redor das grades. O painel pós-partida e o diálogo são exemplares e superfícies de regressão, não alvos de redesenho.
- Uncertainty: a auditoria usou a publicação existente, não um servidor local. Encerramento foi examinado apenas no código. Conferir a renderização local antes e depois da implementação, sobretudo em 768 px e nos estados finais.

## Design decision

Usar o tratamento já existente do painel de resultado (`rounded-lg border border-tabuleiro-borda bg-slate-900 p-4`) para delimitar instruções, controles e resumo da partida. Manter composição simples, com espaçamentos já usados (`gap-4`, `gap-6`), títulos existentes e ações primárias laranja.

Não adicionar painéis às grades: suas dimensões, cores, células, coordenadas e ícones ficam intactos. O refinamento acontece no entorno, não no campo de batalha. Não adicionar fontes, ilustrações, gradientes, animações ou dependências.

## Reuse

- Tokens existentes de `src/styles.css`: `agua`, `acerto`, `destruido`, `navio`, `tabuleiro`, `tabuleiro-borda`, sem alterar seus valores ou opacidades das células.
- Exemplar de painel: `src/app/telas/batalha/batalha.html:82–85`.
- Exemplar de hierarquia: títulos `text-xl font-bold tracking-tight text-slate-100`, conteúdo auxiliar `text-sm text-slate-300`, já presentes nas telas.
- Botões primários existentes: `rounded-lg bg-acerto px-5 py-3 font-semibold text-slate-950`, preservando hover, foco e disabled.
- `app-tabuleiro` e `app-lista-de-frota` permanecem os componentes atuais. Não criar um componente compartilhado só para eliminar repetição de classes: os templates já expressam o tratamento necessário.

## Changes

Implementar uma fase por vez, validar e apresentar o resultado antes de avançar.

1. **Fase 1 — apresentação:** `src/app/telas/apresentacao/apresentacao.html`
   - Change: agrupar “Como jogar” e sua lista no painel exemplar, com `flex flex-col gap-4`. Manter título principal, introdução e botão “Iniciar partida” fora dele. Restringir a largura do painel ao `max-w-prose` já usado pelo conteúdo, com `w-full min-w-0` para o mobile.
   - Preserve: todos os textos, níveis dos títulos, ícone, ação do botão e introdução com destaque A–J / 1–10. Não acrescentar etapas de navegação.
   - Verify: o painel contém as quatro instruções; o botão continua separado e visível após elas; nada ultrapassa a viewport em 375 px.

2. **Fase 2 — preparação:** `src/app/telas/preparacao/preparacao.html`
   - Change: manter o título da tela fora de um novo painel interno. Colocar lista de frota, região de aviso e orientação dentro desse painel, usando o tratamento exemplar e `flex min-w-0 flex-col gap-4`. Manter o grid externo e sua proporção `md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]`.
   - Preserve: a coluna do tabuleiro, todos os inputs/outputs, o aviso com altura mínima, destaque da seleção, orientação, ação Remover e o botão Iniciar batalha. Não modificar o template ou a lógica interna da lista ou do tabuleiro.
   - Verify: pendente e posicionado continuam legíveis; selecionar um navio posicionado mostra Remover sem corte ou rolagem horizontal. Conferir também na largura de 768 px, pois o padding reduz a largura interna da coluna de controles.

3. **Fase 3 — combate:** `src/app/telas/batalha/batalha.html`
   - Change: aplicar o tratamento exemplar ao bloco de resumo de turno, situação e embarcações destruídas, mantendo seu `flex-wrap`, `gap-x-6`, `gap-y-1` e tipografia. Manter avisos imediatamente depois, fora do painel.
   - Preserve: título, ordem dos campos, valores derivados, legendas, duas grades, disposição `md:flex-row`, transição de turnos e ambos os caminhos de reinício. Não alterar o painel pós-partida nem o diálogo nesta fase.
   - Verify: textos longos quebram dentro do painel; os dois tabuleiros conservam suas larguras e disposição; o resumo segue correto durante a vez do jogador, do computador e após o término.

## Scope

- Inherit: apenas os três templates acima recebem o novo tratamento de agrupamento.
- Verify: `src/app/componentes/lista-de-frota/lista-de-frota.html` como filho do painel de controles; `src/app/componentes/tabuleiro/tabuleiro.html` nas duas telas; `src/app/componentes/modal-fim-de-jogo/modal-fim-de-jogo.html` e resultado persistente como regressões.
- Exclude: shell/cabeçalho/rodapé, paleta, core, store, lógica dos componentes, regras, novas funcionalidades, alterações de semântica, novas bibliotecas, deploy e arquivos da skill. Não sobrescrever `.agents/` ou `skills-lock.json`, já presentes como trabalho do usuário.

## Validation

- Product: iniciar partida; posicionar cinco navios; alternar orientação; selecionar/remover/recolocar; iniciar batalha; atacar e aguardar computador; finalizar; fechar o popup; testar Jogar novamente e Preparar nova frota sem regressão.
- Interface: comparar antes/depois em 375 × 812, 768 × 1024 e 1440 × 900. Verificar textos compridos, erro de posicionamento, frota completa, navio selecionado com Remover, turno do computador, vitória e derrota. Não adicionar `overflow-x-hidden` para esconder problemas de layout.
- System: todos os painéis novos reutilizam a mesma receita existente; não aparecem cores hexadecimais novas, fontes novas ou novo componente de painel. `src/styles.css` e os arquivos de `app-tabuleiro` não devem mudar.
- Repository: `npm run lint` → sem erros; `npm test` → testes aprovados; `npm run build` → build concluído. Não executar deploy automaticamente.
- Repository: `npx prettier --check src/app/telas/apresentacao/apresentacao.html src/app/telas/preparacao/preparacao.html src/app/telas/batalha/batalha.html` → templates formatados. Corrigir apenas os arquivos do escopo se necessário, não executar formatação global.

## Stop conditions

- Parar se a revisão base mudou de maneira que invalide os caminhos ou exemplares.
- Parar se acomodar o painel exigir mudar a grade, a lógica do jogo ou a paleta.
- Parar se a ação Remover ou algum texto deixar de caber nas larguras de validação; revisar o layout local com o usuário antes de ampliar escopo.
- Não converter o plano em um redesenho global; concluir e validar cada fase pequena antes da próxima.

## Design documentation

- After acceptance and validation: nenhuma alteração de documentação do produto é necessária. Registrar execução e validação neste plano, sem inventar um design system novo.

## Execução e validação — 2026-11-08

- Fases 1, 2 e 3 implementadas nos três templates previstos. Paleta, tabuleiros, lógica, shell, lista de frota e modal não foram alterados.
- `npm run lint`, `npm test` (150 testes em 16 arquivos), `npm run build`, verificação Prettier dos três templates e `git diff --check` passaram.
- Navegador local em `http://127.0.0.1:4200`: apresentação conferida em 375 px, com quatro instruções e botão fora do painel; preparação e combate conferidos em 375, 768 e 1440 px sem rolagem horizontal. Na preparação, seleção com Remover permanece dentro do painel; no combate, grades preservam 343 px em mobile e 512 px em desktop.
- Exercitados pelo navegador: posicionamento, seleção, remoção, orientação, rejeição fora do tabuleiro, frota completa, ataque com retaliação, vitória, popup em 375 px, fechamento e Jogar novamente. Para chegar à vitória, a automação leu as coordenadas adversárias pela API de depuração local do Angular e realizou os ataques pelos botões; não alterou o estado diretamente nem o código do jogo.
- Limites: derrota e ação Preparar nova frota não foram repetidas manualmente no navegador nesta execução; a suíte existente passou integralmente. Não houve deploy.
