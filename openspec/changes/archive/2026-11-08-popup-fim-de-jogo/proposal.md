# Proposal

## Why

Quando a batalha termina, o resultado aparece apenas como um texto e um botão no fluxo da tela, o que passa despercebido e não convida o jogador a continuar jogando. Um pop-up de encerramento com o vencedor e as opções de reinício deixa o fim da partida evidente e reduz o caminho para uma nova partida.

## What Changes

- Exibir, ao fim da batalha, um pop-up (modal com fundo escuro) anunciando quem venceu, com os botões **"Jogar novamente"**, **"Preparar nova frota"** e **"Fechar"**.
- **"Jogar novamente"** inicia uma nova batalha mantendo a frota do jogador posicionada, com nova frota do computador e combate novo.
- **"Preparar nova frota"** mantém o comportamento do "Nova partida" atual: volta à preparação com o tabuleiro do jogador vazio.
- **"Fechar"** (e a tecla Esc) dispensa o pop-up para inspecionar o tabuleiro final; a tela de batalha passa a exibir a situação final com as duas opções de reinício, de modo que o encerramento nunca deixe o jogador sem ação.
- Ações acessíveis por teclado, com `role="dialog"`, `aria-modal`, rótulo pelo título e foco inicial no pop-up.

## Capabilities

### New Capabilities

_(nenhuma)_

### Modified Capabilities

- `batalha-jogavel`: o requisito "Encerramento com vitória ou derrota" ganha o anúncio do vencedor em pop-up modal acessível; o requisito "Nova partida" passa a descrever as duas opções de reinício ("Jogar novamente" mantendo a frota do jogador e "Preparar nova frota" indo à preparação) e a exibição persistente dessas opções após fechar o pop-up.

## Impact

- `src/app/telas/batalha/` (`batalha.ts`, `batalha.html`, `batalha.spec.ts`): novo pop-up, substituição do banner inline de fim de jogo por ele e estado de "pop-up fechado".
- `src/app/state/partida-store.ts` + spec: novo método `jogarNovamente()` (novo combate mantendo a frota do jogador, com nova frota do computador).
- Possível componente reutilizável de modal em `src/app/componentes/` (a decidir no design).
- Nenhuma mudança no domínio `src/app/core/` nem em outras telas.
