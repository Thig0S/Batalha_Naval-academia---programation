# batalha-jogavel Specification

## Purpose

Conduz a partida na interface: o jogador ataca o tabuleiro do computador, acompanha turnos e resultados, vê o ataque automático adversário e encerra ou reinicia a partida com clareza.

## Requirements

### Requirement: Início do combate na batalha

Ao entrar na visão de batalha com as duas frotas completas, o sistema SHALL iniciar um combate com os tabuleiros posicionados, sem ataques registrados, com o turno do jogador e sem vencedor. Se a frota do jogador não estiver completa, a batalha MUST NOT começar.

#### Scenario: Batalha começa no turno do jogador

- **WHEN** o jogador inicia a batalha com a própria frota completa
- **THEN** a visão de batalha é exibida com os dois tabuleiros, nenhum ataque registrado, o turno do jogador e nenhum vencedor

#### Scenario: Frota incompleta não inicia combate

- **WHEN** a frota do jogador está incompleta
- **THEN** a batalha não começa e a preparação permanece exibida

### Requirement: Ataque do jogador no tabuleiro adversário

No turno do jogador, selecionar uma coordenada ainda não atacada do tabuleiro do computador SHALL registrar o ataque e classificá-lo como água, acerto ou embarcação destruída. A coordenada atacada MUST permanecer visível com seu resultado.

#### Scenario: Ataque na água

- **WHEN** o jogador ataca uma coordenada do computador sem embarcação
- **THEN** a célula passa a exibir o resultado água

#### Scenario: Ataque em embarcação

- **WHEN** o jogador ataca uma coordenada ocupada por embarcação ainda não destruída
- **THEN** a célula passa a exibir o resultado acerto

#### Scenario: Ataque que destrói embarcação

- **WHEN** o jogador atinge a última posição intacta de uma embarcação
- **THEN** a célula exibe o resultado de embarcação destruída e o tipo atingido é informado em texto

### Requirement: Rejeição de ataque repetido na interface

Selecionar uma coordenada já atacada pelo jogador MUST ser rejeitado sem registrar novo ataque, sem consumir o turno e com aviso textual do motivo.

#### Scenario: Clique em célula já atacada

- **WHEN** o jogador clica novamente em uma coordenada que já atacou
- **THEN** nenhum ataque é registrado, o turno continua com o jogador e um aviso em texto informa que a coordenada já foi atacada

### Requirement: Indicação e bloqueio de turno

A tela de batalha SHALL informar de quem é o turno. Durante a espera pelo contra-ataque, a tela SHALL indicar em texto que o computador está atacando. O tabuleiro do computador MUST aceitar ataques somente no turno do jogador e MUST permanecer bloqueado enquanto o computador joga ou após o encerramento.

#### Scenario: Turno do jogador

- **WHEN** o turno pertence ao jogador
- **THEN** a tela informa que é a vez do jogador e o tabuleiro do computador aceita ataques

#### Scenario: Turno do computador

- **WHEN** o jogador conclui um ataque válido sem encerrar a partida
- **THEN** a tela informa que é a vez do computador e o tabuleiro do computador não aceita novos ataques

#### Scenario: Espera pelo computador

- **WHEN** o jogador conclui um ataque válido e o computador ainda não realizou o contra-ataque
- **THEN** a tela exibe em texto que o computador está atacando e o tabuleiro do computador segue bloqueado durante todo o atraso

### Requirement: Ataque automático do computador

Após um ataque válido do jogador que não encerre a partida, o computador SHALL atacar automaticamente, depois de um atraso perceptível, uma coordenada que ainda não atacou, sem exigir ação do jogador. O resultado MUST aparecer no tabuleiro do jogador e o turno MUST voltar ao jogador, salvo se o computador vencer.

#### Scenario: Computador devolve o turno

- **WHEN** o jogador ataca e a partida continua
- **THEN** o computador realiza um ataque em coordenada ainda não atacada por ele, o resultado aparece no tabuleiro do jogador e o turno volta ao jogador

#### Scenario: Computador vence

- **WHEN** o ataque do computador destrói a última embarcação do jogador
- **THEN** a partida encerra com a derrota do jogador, sem devolver o turno

### Requirement: Feedback acessível dos resultados

Cada célula atacada SHALL ser distinguível por ícone ou rótulo acessível além da cor. A destruição de uma embarcação MUST ser anunciada em texto com o tipo atingido, e todas as células dessa embarcação MUST passar a exibir o resultado de embarcação destruída, mostrando a embarcação completa no mapa dos dois lados. O tabuleiro adversário MUST continuar ocultando as embarcações ainda não destruídas.

#### Scenario: Célula atacada tem rótulo acessível

- **WHEN** uma célula atacada é inspecionada
- **THEN** seu rótulo acessível informa a coordenada e o resultado do ataque, sem depender apenas da cor

#### Scenario: Destruição anunciada

- **WHEN** uma embarcação do computador é destruída
- **THEN** um aviso em texto informa qual tipo foi destruído, todas as células daquela embarcação aparecem marcadas como destruídas no mapa e as embarcações ainda não destruídas permanecem ocultas

#### Scenario: Embarcação destruída própria aparece completa

- **WHEN** o computador destrói uma embarcação da frota do jogador
- **THEN** todas as células daquela embarcação aparecem marcadas como destruídas no tabuleiro do jogador, mantendo as demais embarcações visíveis

### Requirement: Tabuleiro próprio durante a batalha

O tabuleiro do jogador SHALL manter as embarcações visíveis e exibir os resultados dos ataques recebidos, distinguindo água, acerto e embarcação destruída.

#### Scenario: Ataques recebidos visíveis

- **WHEN** o computador ataca o tabuleiro do jogador
- **THEN** a célula atacada exibe seu resultado e as embarcações do jogador continuam visíveis

### Requirement: Encerramento com vitória ou derrota

O sistema SHALL encerrar a partida imediatamente quando uma frota for destruída, anunciar o vencedor e bloquear novos ataques de ambos os lados.

#### Scenario: Vitória do jogador

- **WHEN** o jogador destrói a última embarcação do computador
- **THEN** a tela anuncia a vitória do jogador, nenhum ataque adicional é aceito e o computador não joga

#### Scenario: Derrota do jogador

- **WHEN** o computador destrói a última embarcação do jogador
- **THEN** a tela anuncia a derrota do jogador e nenhum ataque adicional é aceito

### Requirement: Nova partida

Após o encerramento, o sistema SHALL oferecer a ação "Nova partida", que reinicia o jogo com tabuleiro do jogador vazio, nova frota do computador e nenhum ataque ou vencedor anterior, levando à preparação.

#### Scenario: Reiniciar após o fim

- **WHEN** o jogador aciona "Nova partida" após o encerramento
- **THEN** a preparação é exibida com o tabuleiro do jogador vazio, uma nova frota do computador e sem ataques ou vencedor anteriores
