# Tasks

## 1. Rematch na store

- [ ] 1.1 Adicionar à `PartidaStore` o método `jogarNovamente()`, que cancela o timer, gera nova frota do computador, cria combate novo com a frota do jogador preservada e mantém a fase `batalha`; verificar com testes de store que o novo combate começa no turno do jogador sem tiros, com a frota do jogador idêntica à anterior e frota do computador nova, e que uma derrota imediata também permite jogar novamente.
- [ ] 1.2 Verificar com teste de store que `jogarNovamente()` devolve `false` sem alterar estado quando o combate não pode ser criado (frota do jogador inválida), rodando `npm test -- --include src/app/state/partida-store.spec.ts`.

## 2. Componente do pop-up

- [ ] 2.1 Criar o componente standalone `ModalFimDeJogo` em `src/app/componentes/modal-fim-de-jogo/` com input `vencedor` e outputs `jogarNovamente`, `prepararNovaFrota` e `fechar`, renderizando overlay com fundo escuro, `role="dialog"`, `aria-modal`, título anunciando vitória/derrota em texto e botões "Jogar novamente", "Preparar nova frota" e "Fechar" (ícones Lucide); verificar com `modal-fim-de-jogo.spec.ts` que anuncia o vencedor certo nos dois casos, que o diálogo é rotulado acessivelmente e que os três outputs são emitidos ao clicar nos botões.
- [ ] 2.2 Focar o painel do diálogo logo após a renderização e fechar com Esc no overlay; verificar no spec do componente que o foco inicial cai no diálogo e que a tecla Esc emite `fechar`.

## 3. Integração na tela de batalha

- [ ] 3.1 Na `Batalha`, adicionar o signal `popupFechado` com `popupVisivel` derivado (há vencedor e não foi dispensado), reexibindo o pop-up no fim da partida seguinte (reset quando `vencedor` volta a `null`); substituir o banner inline de fim de jogo pelo pop-up quando visível e por uma barra de situação final sempre que houver vencedor, com os botões "Jogar novamente" e "Preparar nova frota"; verificar em `batalha.spec.ts` que o fim de jogo exibe o pop-up, que "Fechar" o dispensa mantendo a barra com as duas opções e que Esc também dispensa.
- [ ] 3.2 Ligar os handlers: `jogarNovamente` → `store.jogarNovamente()` (limpando aviso e `popupFechado`), `prepararNovaFrota` → `store.novaPartida()`; verificar em `batalha.spec.ts` que "Jogar novamente" começa nova batalha com a frota do jogador preservada, zero tiros e nenhum vencedor, que "Preparar nova frota" leva à preparação com tabuleiro vazio e que o pop-up reaparece ao fim da nova partida.

## 4. Verificação integrada

- [ ] 4.1 Rodar `npm test`, `npm run lint`, `npm run format:check` e `npm run build` e corrigir qualquer falha, confirmando que todos os testes passam (incluindo os pré-existentes).

## Workflow follow-up

- Arquivar a change após revisão, com `/opsx-archive popup-fim-de-jogo`.
