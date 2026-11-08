# Proposal

## Why

O domínio de combate está pronto e testado, mas a aplicação ainda não permite jogar: a tela de batalha é somente leitura e a `PartidaStore` não conhece ataques, turnos nem vencedor. Sem essa integração, o enunciado não é atendido de ponta a ponta e o jogador não consegue iniciar, disputar e concluir uma partida.

## What Changes

- Integrar o combate à `PartidaStore`, criando o estado de combate ao iniciar a batalha e expondo turno, vencedor, tiros recebidos e tipos destruídos.
- Permitir que o jogador ataque o tabuleiro do computador, rejeitando coordenadas repetidas sem consumir o turno.
- Resolver o ataque automático do computador após um atraso perceptível, mantendo o tabuleiro bloqueado e avisando em texto que ele está jogando.
- Exibir na tela de batalha: indicação de turno, resultado de cada ataque (água, acerto, embarcação destruída), aviso textual de destruição com a embarcação completa no mapa e tabuleiro próprio com os ataques recebidos.
- Encerrar a partida imediatamente com vitória ou derrota, bloqueando novos ataques e anunciando o resultado.
- Oferecer "Nova partida", reiniciando as frotas e voltando à preparação.
- Cobrir store, integração e renderização com testes, mantendo as regras já validadas no domínio.

## Capabilities

### New Capabilities

- `batalha-jogavel`: condução da partida na interface — ataques do jogador e do computador, turnos, feedback de resultados, encerramento com vencedor e reinício.

### Modified Capabilities

Nenhuma. `tabuleiro-e-frota`, `preparacao-da-frota` e `combate-de-turnos` permanecem válidos; esta change apenas compõe esses contratos na store e na tela.

## Impact

- `src/app/state/partida-store.ts` e testes: novo estado de combate, ataques e reinício.
- `src/app/telas/batalha/` e `src/app/componentes/tabuleiro/`: interação de ataque, marcação de resultados e estados de célula.
- `src/app/state/rotulos.ts`: rótulos de resultado e de vencedor.
- Nenhuma dependência nova, alteração de regras de domínio ou mudança no fluxo de preparação além do reinício.
