# preparacao-da-frota Specification

## Purpose

Permite ao jogador preparar a partida: apresentar o jogo, posicionar a própria frota com feedback claro de validade e iniciar a batalha somente quando a frota estiver completa, com a frota do computador posicionada e oculta.

## Requirements

### Requirement: Tela inicial do jogo

A aplicação SHALL exibir uma tela inicial com um resumo das regras e um botão "Iniciar partida". Ao acionar o botão, o sistema MUST levar à tela de preparação com a frota do jogador vazia e a frota do computador já posicionada.

#### Scenario: Iniciar partida

- **WHEN** o botão "Iniciar partida" é acionado
- **THEN** a tela de preparação é exibida com a frota do jogador vazia

#### Scenario: Frota do computador fica pronta na partida

- **WHEN** uma partida é iniciada
- **THEN** a frota do computador está completa, dentro do tabuleiro e sem sobreposição

### Requirement: Seleção de embarcação pendente

A tela de preparação SHALL listar os tipos de embarcação pendentes, marcando os posicionados como concluídos, e permitir selecionar um tipo pendente. Quando uma embarcação é posicionada com sucesso, o sistema MUST selecionar automaticamente o próximo tipo pendente.

#### Scenario: Tipos pendentes listados

- **WHEN** a preparação começa
- **THEN** os cinco tipos aparecem como pendentes e um deles está selecionado

#### Scenario: Avanço após posicionar

- **WHEN** uma embarcação é posicionada com sucesso
- **THEN** o próximo tipo pendente passa a estar selecionado e o posicionado aparece como concluído

### Requirement: Escolha de orientação

Antes de posicionar, o jogador SHALL poder alternar a orientação da embarcação selecionada entre horizontal e vertical.

#### Scenario: Alternar orientação muda o preview

- **WHEN** o jogador alterna a orientação de um cruzador selecionado
- **THEN** o preview passa a indicar as células na nova orientação

### Requirement: Posicionamento pela âncora

Ao clicar em uma célula do próprio tabuleiro com um tipo pendente selecionado, o sistema SHALL capturar a coordenada clicada como âncora, na orientação escolhida, e posicioná-la conforme as regras de limites e sobreposição do domínio.

#### Scenario: Cruzador horizontal a partir de C7

- **WHEN** um cruzador horizontal está selecionado e o jogador clica em `C7`
- **THEN** o cruzador passa a ocupar `C7`, `C8` e `C9`

### Requirement: Preview do posicionamento

O sistema SHALL destacar, ao focar uma célula do próprio tabuleiro com um tipo pendente selecionado, as células que a embarcação ocuparia e indicar se o posicionamento é válido. Quando inválido, o indicador MUST combinar cor com texto do motivo (`fora-do-tabuleiro` ou `sobreposicao`), nunca apenas cor.

#### Scenario: Preview válido

- **WHEN** o jogador foca `B2` com um cruzador horizontal selecionado
- **THEN** as células `B2`, `B3` e `B4` aparecem destacadas como posicionamento válido

#### Scenario: Preview inválido com motivo

- **WHEN** o jogador foca `A8` com um porta-aviões horizontal selecionado
- **THEN** o preview indica invalidade e o motivo é apresentado em texto acessível

### Requirement: Rejeição de posicionamento inválido

Ao clicar em uma célula que resulta em posicionamento inválido, o sistema MUST rejeitar a ação, exibir o motivo da rejeição e preservar o tabuleiro e a seleção como estavam.

#### Scenario: Clique inválido não altera o tabuleiro

- **WHEN** o jogador clica em `A8` com um porta-aviões horizontal selecionado
- **THEN** o posicionamento é rejeitado com o motivo em texto
- **AND** o tabuleiro permanece exatamente como estava e o tipo continua selecionado

### Requirement: Reposicionar e remover embarcação posicionada

O sistema SHALL permitir selecionar uma embarcação posicionada clicando em uma de suas células e removê-la, liberando as células e devolvendo o tipo à lista de pendentes. O reposicionamento da embarcação selecionada SHALL seguir o mesmo mecanismo de posicionamento por âncora, validando contra o tabuleiro sem a própria embarcação.

#### Scenario: Remover embarcação

- **WHEN** o jogador remove o cruzador posicionado
- **THEN** suas células são liberadas e o cruzador volta a constar como pendente

#### Scenario: Reposicionar embarcação

- **WHEN** o cruzador posicionado em `B2` recebe nova âncora em `H8`
- **THEN** o cruzador passa a ocupar as células a partir de `H8` e as células que ocupava em `B` ficam livres

### Requirement: Identificação acessível das células

No tabuleiro próprio, cada célula SHALL ter rótulo acessível com a coordenada e, quando ocupada, o tipo da embarcação, e os estados de célula MUST ser distinguíveis por ícone ou rótulo além da cor.

#### Scenario: Célula ocupada tem rótulo acessível

- **WHEN** uma célula ocupada por parte do encouraçado é inspecionada
- **THEN** seu rótulo acessível informa a coordenada e o tipo da embarcação

### Requirement: Início da batalha condicionado à frota completa

O sistema MUST manter o botão "Iniciar batalha" desabilitado enquanto a frota do jogador estiver incompleta e habilitá-lo quando completa. Ao acionar o botão em condição válida, o sistema MUST levar à visão de batalha.

#### Scenario: Início bloqueado com frota incompleta

- **WHEN** quatro dos cinco tipos estão posicionados
- **THEN** o botão "Iniciar batalha" permanece desabilitado

#### Scenario: Iniciar a batalha

- **WHEN** a frota do jogador está completa e o botão é acionado
- **THEN** a visão de batalha é exibida

### Requirement: Visão de batalha com tabuleiros distintos

Na visão de batalha, o sistema SHALL mostrar o tabuleiro do jogador com suas embarcações visíveis e o tabuleiro do computador sem revelar nenhuma de suas posições.

#### Scenario: Tabuleiro do adversário sem revelações

- **WHEN** a visão de batalha é exibida
- **THEN** o tabuleiro do jogador mostra as cinco embarcações e o do computador não revela embarcação alguma
