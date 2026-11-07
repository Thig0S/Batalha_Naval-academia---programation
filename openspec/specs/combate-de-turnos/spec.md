# combate-de-turnos Specification

## Purpose

Define o combate entre jogador e computador, resolvendo ataques, alternância de turnos, destruição das embarcações e vencedor de forma verificável independentemente da interface.

## Requirements

### Requirement: Inicialização do combate

O sistema SHALL iniciar um combate somente com duas frotas completas e válidas, sem ataques registrados, com o jogador como primeiro participante e sem vencedor. Uma tentativa com frota incompleta ou inválida MUST ser rejeitada sem alterar as entradas.

#### Scenario: Combate pronto para o primeiro ataque

- **WHEN** um combate é criado com duas frotas completas e válidas
- **THEN** os dois históricos de ataques estão vazios, o turno pertence ao jogador e não há vencedor

#### Scenario: Frota incompleta ou inválida

- **WHEN** a criação recebe uma frota incompleta, sobreposta, fora dos limites ou com tipo duplicado
- **THEN** o combate não é criado e a falha identifica a frota inválida, sem modificar as entradas

### Requirement: Ataque contra o adversário

O sistema SHALL registrar cada ataque válido na coordenada selecionada do tabuleiro adversário e classificá-lo como água, acerto ou embarcação destruída. O ataque MUST preservar a frota e o histórico de ataques do outro tabuleiro.

#### Scenario: Ataque na água

- **WHEN** o participante da vez ataca uma coordenada livre ainda não atacada
- **THEN** o resultado é água e o ataque permanece registrado no tabuleiro adversário

#### Scenario: Ataque em embarcação intacta

- **WHEN** o participante da vez ataca uma posição ocupada sem destruir a embarcação
- **THEN** o resultado é acerto e a coordenada permanece registrada

### Requirement: Rejeição de ataques inválidos

O sistema MUST rejeitar ataques fora dos limites, com índices não inteiros ou em coordenadas já atacadas pelo mesmo participante. A rejeição SHALL informar o motivo e preservar integralmente o estado, inclusive o turno.

#### Scenario: Coordenada repetida

- **WHEN** um participante ataca novamente uma coordenada que já atacou
- **THEN** o ataque é rejeitado como coordenada já atacada e nenhum estado é alterado

#### Scenario: Coordenada fora dos limites

- **WHEN** um ataque referencia K1 ou A11
- **THEN** o ataque é rejeitado por coordenada inválida e o turno é preservado

#### Scenario: Índice inválido

- **WHEN** um ataque recebe índice fracionário ou não finito
- **THEN** o ataque é rejeitado por coordenada inválida sem registrar resultado

### Requirement: Alternância de turnos

O sistema SHALL permitir exatamente um ataque válido por turno, alternando jogador e computador independentemente de água, acerto ou destruição, exceto quando houver vencedor. Um ataque fora da vez MUST ser rejeitado sem alterar o estado.

#### Scenario: Acerto não concede novo ataque

- **WHEN** o jogador realiza um acerto sem encerrar o combate
- **THEN** o próximo turno pertence ao computador

#### Scenario: Computador devolve o turno

- **WHEN** o computador realiza um ataque válido sem encerrar o combate
- **THEN** o próximo turno pertence ao jogador

#### Scenario: Ataque fora da vez

- **WHEN** o jogador tenta atacar no turno do computador
- **THEN** o ataque é rejeitado por turno incorreto sem alterar históricos nem turno

### Requirement: Destruição de embarcação

O sistema SHALL considerar uma embarcação destruída somente quando todas as suas posições tiverem sido atingidas. O ataque à última posição intacta MUST informar a destruição e o tipo atingido. Um acerto anterior à destruição MUST NOT revelar as demais posições da embarcação em seu resultado público.

#### Scenario: Última posição do destroyer

- **WHEN** a última posição intacta do destroyer é atingida
- **THEN** o resultado informa embarcação destruída e identifica o destroyer

#### Scenario: Embarcação parcialmente atingida

- **WHEN** apenas uma posição do cruzador é atingida
- **THEN** ele não consta como destruído e o resultado do ataque não inclui suas posições restantes

### Requirement: Escolha aleatória do ataque do computador

O sistema SHALL escolher o alvo do computador entre todas as coordenadas ainda não atacadas por ele, sem consultar a localização das embarcações. A mesma sequência aleatória e o mesmo histórico MUST produzir os mesmos alvos. Sem coordenadas disponíveis, a escolha SHALL indicar ausência de alvo.

#### Scenario: Sorteio exclui ataques anteriores

- **WHEN** o computador escolhe outro alvo após ataques registrados
- **THEN** o alvo pertence ao tabuleiro e não consta em seu histórico anterior

#### Scenario: Seleção reproduzível e sem estratégia

- **WHEN** duas escolhas recebem o mesmo histórico e a mesma sequência aleatória, mesmo com frotas diferentes
- **THEN** os alvos escolhidos são iguais

#### Scenario: Última coordenada disponível

- **WHEN** 99 coordenadas já foram atacadas pelo computador
- **THEN** a escolha retorna a única coordenada restante

#### Scenario: Sem coordenadas disponíveis

- **WHEN** todas as 100 coordenadas constam como atacadas
- **THEN** a escolha informa ausência de alvo, sem repetir uma coordenada

### Requirement: Vitória e término imediato

O sistema MUST encerrar o combate no ataque que destruir toda a frota adversária, registrando o atacante como vencedor e deixando de haver turno ativo. O sistema MUST rejeitar qualquer ataque posterior, preservando o estado encerrado.

#### Scenario: Vitória do jogador

- **WHEN** o jogador atinge a última posição intacta da frota do computador
- **THEN** o jogador vence imediatamente, sem conceder turno ou ataque adicional ao computador

#### Scenario: Vitória do computador

- **WHEN** o computador atinge a última posição intacta da frota do jogador
- **THEN** o computador vence imediatamente e não há turno ativo

#### Scenario: Ataque após o término

- **WHEN** qualquer participante tenta atacar após a definição do vencedor
- **THEN** o ataque é rejeitado por combate encerrado e nenhum estado é alterado

### Requirement: Isolamento entre combates

O sistema SHALL preservar os estados anteriores ao produzir resultados de combate e permitir criar um novo combate com históricos vazios e sem vencedor, independentemente de combates anteriores.

#### Scenario: Estado anterior preservado

- **WHEN** um ataque válido produz o próximo estado
- **THEN** o estado recebido permanece inalterado, incluindo os históricos e as embarcações

#### Scenario: Novo combate independente

- **WHEN** um novo combate é criado após outro ter terminado
- **THEN** ele começa no turno do jogador, sem ataques e sem vencedor, sem modificar o combate anterior
