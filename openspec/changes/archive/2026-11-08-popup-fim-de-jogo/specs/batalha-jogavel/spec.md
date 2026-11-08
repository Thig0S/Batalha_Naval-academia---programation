# Spec Delta

## MODIFIED Requirements

### Requirement: Encerramento com vitória ou derrota

O sistema SHALL encerrar a partida imediatamente quando uma frota for destruída, anunciar o vencedor em um pop-up modal acessível e bloquear novos ataques de ambos os lados.

#### Scenario: Vitória do jogador

- **WHEN** o jogador destrói a última embarcação do computador
- **THEN** a tela exibe um pop-up modal anunciando a vitória do jogador com as opções de reinício, nenhum ataque adicional é aceito e o computador não joga

#### Scenario: Derrota do jogador

- **WHEN** o computador destrói a última embarcação do jogador
- **THEN** a tela exibe um pop-up modal anunciando a derrota do jogador com as opções de reinício e nenhum ataque adicional é aceito

#### Scenario: Pop-up modal acessível e dispensável

- **WHEN** o pop-up de encerramento é exibido
- **THEN** ele identifica o vencedor em texto, é anunciado como diálogo modal acessível, recebe o foco inicial e pode ser dispensado pelo botão "Fechar" ou pela tecla Esc, sem encerrar a partida nem aceitar ataques

### Requirement: Nova partida

Após o encerramento, o sistema SHALL oferecer as opções de reinício tanto no pop-up quanto após dispensá-lo: "Jogar novamente" inicia uma nova batalha mantendo a frota do jogador posicionada com uma frota nova do computador, e "Preparar nova frota" leva à preparação com o tabuleiro do jogador vazio e sem rastro da partida anterior.

#### Scenario: Reiniciar após o fim

- **WHEN** o jogador aciona "Preparar nova frota" após o encerramento
- **THEN** a preparação é exibida com o tabuleiro do jogador vazio, uma nova frota do computador e sem ataques ou vencedor anteriores

#### Scenario: Jogar novamente mantendo a frota

- **WHEN** o jogador aciona "Jogar novamente" após o encerramento
- **THEN** uma nova batalha começa com a frota do jogador preservada, uma frota nova do computador, nenhum ataque registrado e o turno do jogador

#### Scenario: Pop-up dispensado mantém as opções

- **WHEN** o jogador fecha o pop-up após o encerramento
- **THEN** a tela de batalha continua exibindo o resultado da partida com as duas opções de reinício, sem aceitar novos ataques
