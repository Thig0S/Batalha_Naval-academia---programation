# Tasks

## 1. Store da partida

- [x] 1.1 Criar o token `ALEATORIO` (`InjectionToken<() => number>`) em `src/app/state/`, provido com `Math.random` em `app.config.ts`. Verificar: a store injeta o token e o teste sobrescreve com PRNG fixo (`core/testes/aleatorio-fixo.ts`).
- [x] 1.2 Criar `src/app/state/partida-store.ts` com `Fase` (`'apresentacao' | 'preparacao' | 'batalha'`), signals privados `_fase`, `_tabuleiroJogador`, `_tabuleiroComputador`, leituras readonly e computed `tiposPendentes` / `frotaCompleta`. Verificar: `partida-store.spec.ts` confirma fase inicial `apresentacao` e tabuleiros vazios após construção.
- [x] 1.3 Implementar `iniciarPartida` (gera frota do computador com o gerador injetado, zera o tabuleiro do jogador, fase → `preparacao`), `posicionar`, `remover` e `iniciarBatalha` (condicionado a `frotaCompleta`). Verificar: spec da store cobre determinismo com PRNG fixo, frota do computador completa e válida, propagação de `MotivoInvalido` e o bloqueio de `iniciarBatalha` com frota incompleta.

## 2. Tela de apresentação e shell

- [x] 2.1 Criar `src/app/telas/apresentacao/` com resumo das regras e botão "Iniciar partida" que aciona `iniciarPartida`. Verificar: teste com `TestBed` aciona o botão e a fase passa a `preparacao` com o tabuleiro do jogador vazio.
- [x] 2.2 Ajustar `src/app/app.ts` e `app.html` para trocar a tela ativa conforme `fase` (sem roteador), mantendo o cabeçalho e o rodapé do shell. Verificar: `app.spec.ts` atualizado renderiza a tela de apresentação como fase inicial.

## 3. Componente de tabuleiro

- [x] 3.1 Criar `src/app/componentes/tabuleiro/` como componente de apresentação: inputs `modo` (`'preparacao' | 'proprio' | 'adversario'`) e `embarcacoes`, outputs `celulaSelecionada` e `celulaFocada`, grade CSS 11x11 com cabeçalhos de linhas e colunas e mapa derivado por chave de coordenada. Verificar: teste com `TestBed` confirma 100 células clicáveis e as coordenadas corretas na ordem.
- [x] 3.2 Implementar a acessibilidade das células: `aria-label` com a coordenada e o tipo da embarcação quando o modo revela, ícone Lucide além da cor nas posições ocupadas. Verificar: teste inspeciona o rótulo de uma célula ocupada pelo encouraçado e a ausência de qualquer rótulo de embarcação no modo `adversario`, mesmo quando `embarcacoes` é passado.

## 4. Lista da frota

- [x] 4.1 Criar `src/app/componentes/lista-de-frota/` com os cinco tipos marcados como pendentes ou posicionados, seleção por clique e botão "Remover" para o tipo posicionado selecionado; puro em inputs/outputs. Verificar: teste confirma estados, seleção emitida e evento de remoção.

## 5. Tela de preparação

- [x] 5.1 Criar `src/app/telas/preparacao/` com o estado local de interação (`tipoSelecionado`, `orientacao`, `celulaFocada`, embarcação posicionada selecionada) e o controle de orientação. Verificar: teste confirma a seleção inicial (primeiro pendente de `TIPOS_DA_FROTA`) e a alternância de orientação mudando o preview.
- [x] 5.2 Implementar o preview com `validarPosicionamento` contra o tabuleiro da store, destaque das células ocupadas e motivo exibido em região `aria-live="polite"` quando inválido. Verificar: teste foca `B2` (válido) e `A8` com porta-aviões horizontal (inválido) e confirma destaque e motivo em texto, nunca apenas cor.
- [x] 5.3 Implementar o posicionamento pela âncora: clique posiciona pela store, avança para o próximo pendente e, inválido, mantém tabuleiro e seleção. Verificar: spec cobre cruzador clicado em `C7` ocupando `C7`–`C9`, o clicado em `A8` rejeitado com motivo e tabuleiro inalterado, e o avanço de seleção.
- [x] 5.4 Implementar a seleção de embarcação posicionada pelo clique em uma de suas células e a remoção que devolve o tipo a pendente; o reposicionamento reutiliza a mesma âncora da 5.3. Verificar: spec cobre remoção liberando células e reposicionamento do cruzador de `B2` para âncora em `H8`.
- [x] 5.5 Implementar o botão "Iniciar batalha" desabilitado enquanto `frotaCompleta` for falso e habilitado quando verdadeiro, acionando `iniciarBatalha`. Verificar: spec cobre o bloqueio com quatro tipos posicionados, a habilitação com cinco e a transição de fase.

## 6. Tela de batalha (placeholder)

- [x] 6.1 Criar `src/app/telas/batalha/` mostrando o tabuleiro do jogador (modo `proprio`, com as embarcações) e o do computador (modo `adversario`, sem revelar posições), somente leitura e sem ações de ataque. Verificar: teste com `TestBed` confirma embarcações visíveis no próprio e nenhuma revelação no adversário.

## 7. Verificação de integração

- [x] 7.1 Executar `npm run format:check`, `npm run lint`, `npm test` e `npm run build`. Verificar: os quatro comandos terminam com código 0.
- [x] 7.2 Abrir `npm start` com Playwright MCP em 1440x900 e 375x812, percorrendo apresentação → posicionamento completo → batalha. Verificar: console sem erros, sem rolagem horizontal, motivo de invalidez visível em texto e contrastes legíveis nas duas larguras.
- [x] 7.3 Rodar `openspec validate preparacao-da-frota --strict`. Verificar: validação sem erros e sem avisos.

## Workflow follow-up

- Arquivar a change depois da revisão do usuário, sincronizando a spec `preparacao-da-frota` para `openspec/specs/`.
- Seguir para a change `combate` (tiros, turnos, ataques e destruição no domínio puro).
