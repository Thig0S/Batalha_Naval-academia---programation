# Spec Delta

## Purpose

Permite representar o tabuleiro 10 × 10, a frota de cinco embarcações e a validade de cada posicionamento, servindo de base para a preparação da partida e para o combate.

## ADDED Requirements

### Requirement: Coordenadas do tabuleiro

O sistema SHALL representar o tabuleiro como uma grade de 10 linhas identificadas de A a J e 10 colunas identificadas de 1 a 10. Cada posição MUST ser identificável por uma coordenada formada pela letra da linha seguida do número da coluna, como `A1`, `C7` ou `J10`.

#### Scenario: Coordenada dentro do tabuleiro

- **WHEN** uma posição é referenciada como `C7`
- **THEN** o sistema a interpreta como linha C e coluna 7

#### Scenario: Coordenadas nos extremos

- **WHEN** as posições `A1` e `J10` são referenciadas
- **THEN** ambas são válidas e correspondem a cantos opostos do tabuleiro

#### Scenario: Coordenada fora do tabuleiro

- **WHEN** uma coordenada como `K1` ou `A11` é referenciada
- **THEN** o sistema a considera fora do tabuleiro

### Requirement: Composição da frota

O sistema SHALL definir uma frota composta por exatamente uma embarcação de cada tipo: porta-aviões com 5 posições, encouraçado com 4, cruzador com 3, submarino com 3 e destroyer com 2.

#### Scenario: Frota padrão

- **WHEN** a frota é consultada
- **THEN** ela contém cinco embarcações, uma de cada tipo, totalizando 17 posições

### Requirement: Forma de uma embarcação

Uma embarcação SHALL ocupar posições consecutivas em linha reta, apenas na orientação horizontal ou vertical. O sistema MUST NOT aceitar embarcações em diagonal ou com posições descontínuas.

#### Scenario: Cruzador horizontal

- **WHEN** um cruzador é posicionado em `B2`, `B3` e `B4`
- **THEN** o posicionamento é válido

#### Scenario: Cruzador em L

- **WHEN** um cruzador ocuparia `B2`, `B3` e `C4`
- **THEN** o posicionamento é inválido por não formar uma linha reta

### Requirement: Posicionamento dentro dos limites

Nenhuma parte da embarcação pode ficar fora do tabuleiro. O sistema SHALL rejeitar qualquer posicionamento que ultrapasse as bordas superior, inferior, esquerda ou direita, sem alterar o tabuleiro.

#### Scenario: Porta-aviões horizontal a partir de A8

- **WHEN** um porta-aviões de 5 posições é posicionado horizontalmente começando em `A8`
- **THEN** o posicionamento é rejeitado por ultrapassar a borda direita
- **AND** o tabuleiro permanece inalterado

#### Scenario: Encouraçado vertical a partir de H5

- **WHEN** um encouraçado de 4 posições é posicionado verticalmente começando em `H5`
- **THEN** o posicionamento é rejeitado por ultrapassar a borda inferior

### Requirement: Proibição de sobreposição

Duas embarcações MUST NOT ocupar a mesma posição. O sistema SHALL rejeitar o posicionamento sobreposto e preservar o posicionamento válido existente.

#### Scenario: Embarcação sobre posição ocupada

- **WHEN** uma embarcação é posicionada sobre uma posição já ocupada por outra
- **THEN** o posicionamento é rejeitado como sobreposição
- **AND** o tabuleiro permanece exatamente como estava

### Requirement: Adjacência permitida

O sistema MUST permitir que embarcações fiquem encostadas, inclusive nas diagonais, desde que não compartilhem nenhuma posição.

#### Scenario: Embarcações lado a lado

- **WHEN** duas embarcações são posicionadas em colunas adjacentes sem compartilhar posições
- **THEN** ambas permanecem válidas

#### Scenario: Embarcações encostadas na diagonal

- **WHEN** duas embarcações se tocam apenas na diagonal
- **THEN** o posicionamento é permitido

### Requirement: Reposicionamento antes da batalha

O sistema SHALL permitir alterar o posicionamento de uma embarcação já posicionada. O reposicionamento MUST ser validado contra o tabuleiro sem a embarcação na posição antiga, e um reposicionamento inválido MUST preservar o posicionamento anterior.

#### Scenario: Mover embarcação para as próprias posições

- **WHEN** uma embarcação posicionada é movida para uma posição que inclui células que ela própria ocupava
- **THEN** o reposicionamento é válido, pois a posição antiga é liberada antes da validação

#### Scenario: Reposicionamento inválido

- **WHEN** uma embarcação é movida para uma posição que ultrapassa a borda
- **THEN** o reposicionamento é rejeitado
- **AND** a embarcação permanece na posição anterior

### Requirement: Remoção de embarcação

O sistema SHALL permitir remover uma embarcação posicionada, liberando todas as suas posições para novos posicionamentos.

#### Scenario: Remover embarcação

- **WHEN** uma embarcação posicionada é removida
- **THEN** suas posições deixam de estar ocupadas
- **AND** o tipo removido volta a constar como pendente

### Requirement: Frota completa

O sistema SHALL considerar a frota completa somente quando as cinco embarcações estiverem posicionadas. O sistema MUST informar quais tipos ainda faltam.

#### Scenario: Frota incompleta

- **WHEN** apenas quatro dos cinco tipos estão posicionados
- **THEN** a frota é considerada incompleta
- **AND** o tipo que falta é identificado

#### Scenario: Frota completa

- **WHEN** as cinco embarcações estão posicionadas sem sobreposição
- **THEN** a frota é considerada completa

### Requirement: Geração automática de frota

O sistema SHALL gerar uma frota completa e válida automaticamente, respeitando as mesmas regras de limites e de sobreposição. A geração MUST ser reproduzível quando receber a mesma sequência de números aleatórios.

#### Scenario: Frota gerada é sempre válida

- **WHEN** uma frota é gerada automaticamente repetidamente
- **THEN** todas as gerações contêm as cinco embarcações, dentro do tabuleiro e sem sobreposição

#### Scenario: Geração reproduzível

- **WHEN** a geração recebe a mesma sequência de números aleatórios
- **THEN** produz o mesmo posicionamento de frota
