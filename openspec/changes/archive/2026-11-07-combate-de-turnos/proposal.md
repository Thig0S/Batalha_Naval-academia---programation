# Proposal

## Why

A preparação da frota está concluída, mas a batalha ainda é somente leitura. Antes de conectar os ataques à interface, precisamos de um domínio testável que resolva tiros, alternância de turnos e encerramento sem depender de Angular.

## What Changes

- Introduzir um estado de combate com as duas frotas, ataques recebidos, participante da vez e vencedor.
- Resolver ataques como água, acerto ou embarcação destruída, rejeitando coordenadas inválidas e repetidas sem consumir o turno.
- Alternar um ataque por participante, começando pelo jogador, e encerrar imediatamente quando uma frota for destruída.
- Escolher o ataque do computador aleatoriamente entre coordenadas ainda não atacadas, com gerador fornecido por parâmetro.
- Cobrir as regras com testes puros, incluindo partidas completas e preservação das entradas.
- Manter a preparação e a tela atual inalteradas. Integração com a store, interação visual, nova partida e acabamento ficam para changes seguintes.

## Capabilities

### New Capabilities

- `combate-de-turnos`: estado e regras do combate entre jogador e computador, incluindo ataques, destruição, sorteio de alvos, alternância e vencedor.

### Modified Capabilities

Nenhuma. Os contratos de `tabuleiro-e-frota` e `preparacao-da-frota` permanecem válidos; os registros de combate serão compostos com o tabuleiro existente, sem alterar suas regras de posicionamento.

## Impact

- Novos módulos e testes em `src/app/core/`, reutilizando coordenadas, embarcações, validação e o PRNG de testes existentes.
- Nenhuma dependência nova, alteração de interface, store ou configuração Angular.
- Novo contrato de domínio para a futura integração com `PartidaStore`; nenhum comportamento de combate será disponibilizado na interface nesta change.
