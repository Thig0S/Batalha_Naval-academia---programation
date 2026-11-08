# Design

Ver `proposal.md` — Why.

## Context

A tela de batalha (`src/app/telas/batalha/`) já exibe o fim de jogo como um banner inline na raiz da seção: um `role="status"` com "Você venceu a partida!" / "O computador venceu a partida." e o botão "Nova partida" (que chama `store.novaPartida()`, zerando a frota do jogador). A store expõe `vencedor` como computed e `novaPartida()` já cancela timer e combate. Não existe nenhum componente de modal/dialog no projeto e o domínio `src/app/core/` não precisa mudar.

Restrições: Angular 22 zoneless com signals e standalone components, Tailwind CSS, Lucide Icons, textos em português, nomes em português seguindo convenções, acessibilidade por teclado e leitor de tela.

## Goals / Non-Goals

**Goals:**

- Pop-up modal de encerramento anunciando o vencedor, com "Jogar novamente", "Preparar nova frota" e "Fechar".
- "Jogar novamente" reinicia a batalha mantendo a frota do jogador (novo combate + nova frota do computador).
- Dispensar o pop-up (botão ou Esc) revela a situação final com as mesmas duas opções na tela, nunca deixando o jogador sem ação.
- Acessibilidade: `role="dialog"`, `aria-modal`, título associado, foco inicial no diálogo e retorno de foco ao fechar.

**Non-Goals:**

- Animações de abertura/fechamento e "focus trap" completo (Tab preso no modal) — fora do escopo desta change; o foco inicial e a navegação por teclado já cobrem o essencial.
- Placar, histórico de partidas ou opção de desistir durante o combate.
- Mudanças no domínio `src/app/core/` ou em outras telas.

## Decisions

### 1. Pop-up como componente próprio `ModalFimDeJogo`

Novo componente standalone em `src/app/componentes/modal-fim-de-jogo/` com inputs `vencedor` (`Participante | null`) e outputs `jogarNovamente`, `prepararNovaFrota` e `fechar`. O componente é burro: só apresenta e emite; toda a regra fica na store e na tela.

- *Alternativa descartada*: markup inline na `batalha.html` — funcionaria, mas mistura estilos de modal com a tela, torna o template longo e impede reutilizar o diálogo se outra tela ganhar fim de jogo.
- O pop-up é renderizado dentro da própria tela (overlay `fixed inset-0 z-50`), sem CDK/dialog nem dependência nova.

### 2. Overlay e bloqueio visual, sem travar o DOM

Overlay com `bg-slate-950/70` cobrindo a viewport e o painel do diálogo centralizado por flex; `pointer-events` apenas no overlay (o fundo não recebe cliques enquanto aberto). O `@if` da tela só renderiza o modal quando há vencedor e o jogador não o dispensou.

- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` apontando o título; o painel recebe `tabindex="-1"` e é focado logo após a renderização (signal effect com foco no diálogo), devolvendo o foco ao elemento que o abriu não é necessário porque o diálogo surge do próprio fluxo (fim de partida).
- Esc fecha: listener `(keydown.escape)` no overlay.

### 3. Estado de dispensado na tela, não na store

Signal privado `popupFechado = signal(false)` na tela de batalha, usado por `popupVisivel = computed(() => store.vencedor() !== null && !popupFechado())`.

- *Alternativa descartada*: estado na store — "o jogador já viu o pop-up" é puramente de apresentação, sem efeito em regras de jogo; manter na store poluiria a fonte única de verdade do domínio.
- `popupFechado` volta a `false` quando `vencedor` volta a `null` (novo combate), via `effect()` que observa `vencedor` — assim o próximo fim de jogo mostra o pop-up de novo.

### 4. `jogarNovamente()` na store

Novo método público: cancela timer, gera nova frota do computador (`gerarFrotaAleatoria`), cria combate novo com `criarCombate(tabuleiroJogador, novaFrota)` e, se ok, troca `_tabuleiroComputador`, `_estadoCombate` e mantém `_fase = 'batalha'`. Se o combate não puder ser criado (frota do jogador inválida), devolve `false` sem alterar nada.

- Reaproveita `iniciarBatalha()`? Não: ele exige a frota já existente e não regera a do computador. `jogarNovamente()` é o fluxo "rematch" completo e autocontido.
- `novaPartida()` permanece inalterado para o caminho "Preparar nova frota".

### 5. Banner inline de fim de jogo substituído pelo pop-up + barra persistente

O `@if (store.vencedor())` atual é substituído por:

- o pop-up (quando `popupVisivel()`);
- uma barra de situação final (sempre que há vencedor): texto do vencedor + botões "Jogar novamente" e "Preparar nova frota" — visível imediatamente e também após dispensar o pop-up, garantindo que a partida sempre tenha saída.

Assim não há dois anúncios simultâneos (o pop-up some quando a barra basta) e o comportamento "dispensado mantém as opções" cai naturalmente.

### 6. Ícones e estilo

Lucide via `@lucide/angular`: `LucideTrophy` (vitória), `LucideSkull`? — confirmar disponibilidade na implementação entre `LucideTrophy`, `LucideTarget`, `LucideRotateCcw` ("Jogar novamente") e `LucideX` ("Fechar"). Painel do diálogo: `rounded-lg border border-tabuleiro-borda bg-slate-900 p-6`, seguindo o visual já usado no banner atual; botão primário `bg-acerto` como em "Nova partida".

### 7. Testes

- `partida-store.spec.ts`: `jogarNovamente()` cria combate novo no turno do jogador com frota do jogador preservada (`embarcacoes` idênticas), frota do computador nova (sem sobreposição com a anterior quando a semente avança), zero tiros e sem vencedor; também que funciona logo após uma derrota.
- `modal-fim-de-jogo.spec.ts`: renderiza vencedor/jogador e computador, emite os três outputs, `role="dialog"`/`aria-modal`/`aria-labelledby` e foco inicial no diálogo.
- `batalha.spec.ts`: fim de jogo exibe o pop-up; "Fechar" (e Esc) esconde e mantém a barra com as duas opções; "Jogar novamente" zera tiros e mantém a frota do jogador em nova batalha; "Preparar nova frota" leva à preparação; o pop-up volta a aparecer no fim da partida seguinte.

## Risks / Trade-offs

- [Foco inicial pode falhar se o navegador não aceitar foco programático em elemento sem interação prévia] → o painel tem `tabindex="-1"` e o foco é aplicado num `afterNextRender`; se não focar, o diálogo continua plenamente navegável por Tab.
- [Sem focus trap, o Tab pode levar o foco aos botões do fundo] → mitigado por `aria-modal="true"` e pelo overlay bloquear cliques; focus trap fica registrado como Non-Goal.
- [Duas superfícies de reinício (pop-up e barra) podem divergir] → ambas emitem os mesmos outputs para os mesmos handlers da tela; um único conjunto de handlers.
- [`jogarNovamente()` regera frota do computador consumindo o PRNG] → mesmo comportamento de `iniciarPartida()`; testes usam semente fixa, como já fazem os testes de frota.
