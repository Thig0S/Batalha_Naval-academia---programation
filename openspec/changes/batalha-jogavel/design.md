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
- Revelar as posições restantes de embarcações destruídas.
- Animações, persistência, placar ou IA estratégica.
- Redesenho visual amplo; o acabamento responsivo fica para um change posterior.

## Decisions

### 1. Estado de combate dentro da store

`PartidaStore` passa a manter um signal `EstadoCombate | null` e a derivar o que a tela consome: `turno`, `vencedor`, `tirosRecebidosPeloJogador`, `tirosRecebidosPeloComputador`, `tiposDestruidosDoComputador`, `tiposDestruidosDoJogador` e `combateAtivo`.

- `iniciarBatalha()` cria o combate com `criarCombate` usando os tabuleiros já posicionados; se a frota não estiver completa ou a criação falhar, permanece na preparação e devolve `false`.
- `atacarJogador(coordenada)` delega a `atacar(estado, 'jogador', coordenada)` e devolve o resultado para a tela traduzir o motivo da rejeição.
- `atacarComputador()` sorteia com `sortearAlvo(tirosRecebidosPeloJogador, aleatorio)` e aplica `atacar(estado, 'computador', alvo)`.
- `novaPartida()` limpa o timer, zera o combate e reutiliza `iniciarPartida()` (preparação, tabuleiro vazio, nova frota do computador).

Alternativa descartada: criar um serviço separado de combate. A store já é o ponto de composição da partida e um serviço extra duplicaria o ciclo de vida e os signals.

### 2. Ataque automático com atraso e timer único

Após um ataque válido do jogador que não encerre a partida, a store agenda `atacarComputador()` com `setTimeout` de `ATRASO_COMPUTADOR_MS = 700`. O turno já é do computador imediatamente, então a tela mostra "vez do computador" e bloqueia cliques durante a espera.

- Um único campo `timer` é mantido; um novo agendamento limpa o anterior e `novaPartida()` sempre limpa o timer.
- `atacarComputador()` revalida o estado (turno e vencedor) antes de agir, tornando o timer inofensivo se a partida for reiniciada.
- Testes usam `vi.useFakeTimers()` e `vi.advanceTimersByTime(700)`; a constante fica exportada para evitar número mágico nos testes.

Alternativas descartadas: ataque imediato (mistura os dois resultados) e `effect` do Angular (menos direto para um evento único e mais difícil de limpar).

### 3. Resultados no `Tabuleiro` por inputs

`Tabuleiro` ganha o input `tirosRecebidos: readonly Tiro[]` e um input explícito `interativo: boolean` (substituindo a regra implícita `modo === 'preparacao'`). Cada célula deriva seu resultado do histórico:

- `agua`: fundo `agua` + ícone de ondas;
- `acerto`: fundo `acerto` + ícone de mira;
- `destruido`: fundo `destruido` + ícone de explosão;
- sem tiro: comportamento atual (embarcação no tabuleiro próprio ou célula livre).

O `aria-label` passa a incluir o resultado, e a legenda da tela repete os três estados em texto. No modo `adversario`, as embarcações continuam não sendo derivadas; só os tiros são renderizados. Os ícones Lucide exatos serão confirmados na implementação entre os disponíveis em `@lucide/angular`.

Alternativa descartada: um componente de célula novo. O `Tabuleiro` já centraliza cabeçalhos, acessibilidade e classes; estendê-lo evita duplicação.

### 4. Tela de batalha com turno, aviso e reinício

`Batalha` compõe:

- indicador de turno (`Você` / `Computador`) e situação (`Em andamento` / `Vitória` / `Derrota`);
- tabuleiro próprio com embarcações e `tirosRecebidosPeloJogador`, não interativo;
- tabuleiro adversário com `tirosRecebidosPeloComputador`, interativo somente quando `turno === 'jogador'` e não há vencedor;
- região `aria-live` para o motivo de ataque rejeitado e para o anúncio de embarcação destruída;
- botão "Nova partida" exibido quando há vencedor.

O clique no tabuleiro adversário chama `atacarJogador`; a tela traduz `MotivoAtaqueInvalido` em texto por um mapa em `state/rotulos.ts`, sem alterar o domínio.

### 5. Rótulos centralizados

`state/rotulos.ts` ganha `ROTULOS_DE_RESULTADO`, `ROTULOS_DE_MOTIVO_ATAQUE` e `ROTULOS_DE_VENCEDOR`, mantendo os textos de interface em português e fora dos templates.

### 6. Estratégia de testes

- `partida-store.spec.ts`: ataque válido, rejeição de repetido sem consumir turno, alternância, ataque automático com timers falsos, vitória/derrota, bloqueio após o fim e `novaPartida`.
- `tabuleiro.spec.ts`: resultado renderizado, `aria-label` por resultado e ausência de revelação no modo adversário.
- `batalha.spec.ts`: clique ataca, turno bloqueia, aviso acessível aparece, banner final e botão de reinício.
- Regras de combate continuam cobertas apenas em `core/*.spec.ts`, sem duplicação.

## Risks / Trade-offs

- Timer sobrevivendo à troca de tela ou reinício → timer único, limpeza em `novaPartida` e revalidação dentro de `atacarComputador`.
- Testes zoneless com timers falsos podem não atualizar a view → usar `fixture.detectChanges()`/`whenStable()` após avançar o tempo.
- Duplicar estado (combate na store e tabuleiros separados) → a store mantém os tabuleiros como entrada e o combate copia as frotas; a tela lê somente o combate durante a batalha.
- Atraso de 700 ms pode parecer lento em testes manuais → constante exportada e fácil de ajustar; o bloqueio visual deixa claro que o computador está jogando.
- Ícones Lucide podem ter nomes diferentes do esperado → confirmar na implementação e manter fallback textual no `aria-label` e na legenda.

## Migration Plan

Não há migração de dados nem mudança de contrato público. A preparação continua igual; a única alteração de fluxo é o reinício, que reutiliza `iniciarPartida()`.

## Open Questions

Nenhuma.
