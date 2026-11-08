# Design

## Context

Ver `proposal.md` para a motivação. O estado atual que condiciona a solução:

- `PartidaStore` guarda apenas `fase`, `tabuleiroJogador` e `tabuleiroComputador`; a preparação já valida a frota e a batalha só troca de fase.
- O domínio em `src/app/core/` já oferece `criarCombate`, `atacar`, `sortearAlvo`, `tiposDestruidos` e `frotaDestruida`, todos puros e testados, com `ALEATORIO` injetável.
- `Batalha` renderiza dois `Tabuleiro` somente leitura; `Tabuleiro` conhece embarcações, preview e foco, mas não resultados de ataque.
- A aplicação é zoneless, com signals e componentes standalone; os testes usam Vitest, `TestBed` apenas onde há renderização e PRNG fixo via token.
- Regra do projeto: cor nunca é o único indicador; todo estado precisa de ícone, texto ou `aria-label`.

## Goals / Non-Goals

**Goals:**

- Fechar o ciclo jogável: atacar, alternar turnos, ver resultados, encerrar e reiniciar.
- Manter a `PartidaStore` como fonte única de verdade, sem duplicar regras já testadas no domínio.
- Deixar o atraso do computador testável e sem timers órfãos.
- Reaproveitar o `Tabuleiro` para os dois lados, sem revelar a frota adversária.

**Non-Goals:**

- Alterar regras de combate, posicionamento ou sorteio.
- Revelar embarcações ainda não destruídas no tabuleiro adversário (uma embarcação destruída já teve todas as células atingidas, então mostrá-la por inteiro não expõe nenhuma posição não atingida).
- Animações, persistência, placar ou IA estratégica.
- Redesenho visual amplo; o acabamento responsivo fica para um change posterior.

## Decisions

### 1. Estado de combate dentro da store

`PartidaStore` passa a manter um signal `EstadoCombate | null` e a derivar o que a tela consome: `turno`, `vencedor`, `tirosRecebidosPeloJogador`, `tirosRecebidosPeloComputador`, `tiposDestruidosDoComputador`, `tiposDestruidosDoJogador`, `embarcacoesDestruidasDoComputador`, `embarcacoesDestruidasDoJogador` e `combateAtivo`.

- As duas listas de embarcações destruídas são derivadas de `tiposDestruidos` sobre o tabuleiro do combate: nada muda no domínio, a store apenas devolve os objetos `Embarcacao` completos para a tela mostrar a embarcação destruída por inteiro.
- `iniciarBatalha()` cria o combate com `criarCombate` usando os tabuleiros já posicionados; se a frota não estiver completa ou a criação falhar, permanece na preparação e devolve `false`.
- `atacarJogador(coordenada)` delega a `atacar(estado, 'jogador', coordenada)` e devolve o resultado para a tela traduzir o motivo da rejeição.
- `atacarComputador()` sorteia com `sortearAlvo(tirosRecebidosPeloJogador, aleatorio)` e aplica `atacar(estado, 'computador', alvo)`.
- `novaPartida()` limpa o timer, zera o combate e reutiliza `iniciarPartida()` (preparação, tabuleiro vazio, nova frota do computador).

Alternativa descartada: criar um serviço separado de combate. A store já é o ponto de composição da partida e um serviço extra duplicaria o ciclo de vida e os signals.

### 2. Ataque automático com atraso e timer único

Após um ataque válido do jogador que não encerre a partida, a store agenda `atacarComputador()` com `setTimeout` de `ATRASO_COMPUTADOR_MS = 1200`. O turno já é do computador imediatamente, então a tela mostra "vez do computador", exibe o aviso "O computador está atacando…" na região `aria-live` e bloqueia cliques durante toda a espera.

- Um único campo `timer` é mantido; um novo agendamento limpa o anterior e `novaPartida()` sempre limpa o timer.
- `atacarComputador()` revalida o estado (turno e vencedor) antes de agir, tornando o timer inofensivo se a partida for reiniciada.
- O aviso de espera não é estado novo: a tela deriva `turno === 'computador' && combateAtivo` e o remove sozinha quando o contra-ataque conclui o turno.
- Testes usam `vi.useFakeTimers()` e `vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS)`; a constante fica exportada para evitar número mágico nos testes.

Alternativas descartadas: ataque imediato (mistura os dois resultados) e `effect` do Angular (menos direto para um evento único e mais difícil de limpar).

### 3. Resultados no `Tabuleiro` por inputs

`Tabuleiro` ganha os inputs `tirosRecebidos: readonly Tiro[]`, `embarcacoesDestruidas: readonly Embarcacao[]` e um input explícito `interativo: boolean` (substituindo a regra implícita `modo === 'preparacao'`). Cada célula deriva seu resultado da seguinte forma, nesta ordem:

- célula de uma embarcação destruída (vinda de `embarcacoesDestruidas`): fundo `destruido` + ícone de explosão, com o tipo no rótulo — assim a embarcação aparece completa no mapa, nos dois lados, mesmo nas células cujo tiro anterior foi `acerto`;
- `agua`: fundo `agua` + ícone de ondas;
- `acerto`: fundo `acerto` + ícone de mira;
- `destruido` (tiro da própria célula): fundo `destruido` + ícone de explosão;
- sem tiro: comportamento atual (embarcação no tabuleiro próprio ou célula livre).

O histórico de `Tiro` não é reescrito: o domínio mantém `acerto` onde couber; só a apresentação deriva a embarcação inteira quando ela é destruída. No modo `adversario`, o mapa de embarcações é derivado somente de `embarcacoesDestruidas` — as demais seguem ocultas e os tiros são sempre renderizados. O `aria-label` passa a incluir o resultado, e a legenda da tela repete os três estados em texto. Os ícones Lucide exatos serão confirmados na implementação entre os disponíveis em `@lucide/angular`.

Alternativa descartada: um componente de célula novo. O `Tabuleiro` já centraliza cabeçalhos, acessibilidade e classes; estendê-lo evita duplicação.

### 4. Tela de batalha com turno, aviso e reinício

`Batalha` compõe:

- indicador de turno (`Você` / `Computador`) e situação (`Em andamento` / `Vitória` / `Derrota`);
- tabuleiro próprio com embarcações, `embarcacoesDestruidasDoJogador` e `tirosRecebidosPeloJogador`, não interativo;
- tabuleiro adversário com `embarcacoesDestruidasDoComputador` e `tirosRecebidosPeloComputador`, interativo somente quando `turno === 'jogador'` e não há vencedor;
- região `aria-live` com três conteúdos: o aviso "O computador está atacando…" durante a espera (`turno === 'computador'`), o motivo de ataque rejeitado e o anúncio de embarcação destruída;
- botão "Nova partida" exibido quando há vencedor.

O clique no tabuleiro adversário chama `atacarJogador`; a tela traduz `MotivoAtaqueInvalido` em texto por um mapa em `state/rotulos.ts`, sem alterar o domínio.

### 5. Rótulos centralizados

`state/rotulos.ts` ganha `ROTULOS_DE_RESULTADO`, `ROTULOS_DE_MOTIVO_ATAQUE` e `ROTULOS_DE_VENCEDOR`, mantendo os textos de interface em português e fora dos templates.

### 6. Estratégia de testes

- `partida-store.spec.ts`: ataque válido, rejeição de repetido sem consumir turno, alternância, ataque automático com timers falsos, vitória/derrota, bloqueio após o fim, `novaPartida` e embarcações destruídas expostas.
- `tabuleiro.spec.ts`: resultado renderizado, `aria-label` por resultado, ausência de revelação de embarcações não destruídas no modo adversário e embarcação destruída completa nos dois modos.
- `batalha.spec.ts`: clique ataca, turno bloqueia, aviso de espera do computador, aviso acessível de rejeição, embarcação destruída completa, banner final e botão de reinício.
- Regras de combate continuam cobertas apenas em `core/*.spec.ts`, sem duplicação.

## Risks / Trade-offs

- Timer sobrevivendo à troca de tela ou reinício → timer único, limpeza em `novaPartida` e revalidação dentro de `atacarComputador`.
- Testes zoneless com timers falsos podem não atualizar a view → usar `fixture.detectChanges()`/`whenStable()` após avançar o tempo.
- Duplicar estado (combate na store e tabuleiros separados) → a store mantém os tabuleiros como entrada e o combate copia as frotas; a tela lê somente o combate durante a batalha.
- Atraso de 1200 ms pode parecer lento em testes manuais → constante exportada e fácil de ajustar; o aviso "O computador está atacando…" e o bloqueio visual deixam claro que a espera é intencional.
- Mostrar a embarcação destruída completa pode parecer que revela a frota → só as embarcações destruídas são exibidas e o domínio só as destrói quando todas as células já foram atingidas; as não destruídas seguem ocultas no tabuleiro adversário.
- Ícones Lucide podem ter nomes diferentes do esperado → confirmar na implementação e manter fallback textual no `aria-label` e na legenda.

## Migration Plan

Não há migração de dados nem mudança de contrato público. A preparação continua igual; a única alteração de fluxo é o reinício, que reutiliza `iniciarPartida()`.

## Open Questions

Nenhuma.
