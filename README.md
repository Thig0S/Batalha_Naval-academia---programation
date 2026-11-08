# Batalha Naval — Enunciado da atividade

## Objetivo

Desenvolver uma **versão web do jogo Batalha Naval**, utilizando **Angular**, na qual uma pessoa disputa uma partida contra o computador.

Este documento descreve **o jogo que deve ser construído**, suas regras e o comportamento esperado. A organização do projeto, as decisões de arquitetura, a implementação e os detalhes de interface serão definidos posteriormente durante o trabalho com **OpenSpec** e **OpenCode**, incluindo as orientações registradas em `AGENTS.md`.

## Como funciona o jogo

Cada participante possui uma frota de embarcações escondida em um tabuleiro de **10 × 10 posições**. Os jogadores se alternam atacando coordenadas do tabuleiro adversário, tentando localizar e destruir todas as embarcações.

O jogador humano enfrenta o computador. **O computador não precisa adotar estratégias de combate:** ele deve escolher aleatoriamente posições que ainda não atacou.

Vence quem destruir primeiro toda a frota adversária.

## 1. Tabuleiros

- Cada participante possui um tabuleiro com **10 linhas (A a J)** e **10 colunas (1 a 10)**.
- Cada posição é identificada por uma coordenada, como `A1`, `C7` ou `J10`.
- Durante a batalha, o jogador deve conseguir acompanhar seu próprio tabuleiro e os ataques realizados contra o computador.
- As posições das embarcações do computador permanecem **ocultas durante a partida**. Seus acertos e erros devem ser mostrados conforme os ataques acontecem.
- No tabuleiro do jogador, devem ser visíveis suas embarcações e os ataques recebidos.

## 2. Embarcações

Cada participante possui a mesma frota:

| Embarcação   | Quantidade | Tamanho (posições) |
| ------------ | ---------: | -----------------: |
| Porta-aviões |          1 |                  5 |
| Encouraçado  |          1 |                  4 |
| Cruzador     |          1 |                  3 |
| Submarino    |          1 |                  3 |
| Destroyer    |          1 |                  2 |

Uma embarcação ocupa posições **consecutivas**, sempre em linha reta, na orientação **horizontal ou vertical**.

### Regras de posicionamento

- Nenhuma parte da embarcação pode ficar fora do tabuleiro.
- Duas embarcações não podem ocupar a mesma posição.
- Embarcações **podem ficar encostadas**, inclusive nas diagonais, desde que não haja sobreposição.
- Todas as embarcações da frota devem estar posicionadas para que a batalha possa começar.

**Exemplo:** um cruzador de tamanho 3 pode ocupar `B2`, `B3` e `B4`, mas não `B2`, `B3` e `C4`.

## 3. Preparação da partida

Antes da batalha:

1. O jogador posiciona manualmente suas embarcações no próprio tabuleiro.
2. O jogador pode alterar o posicionamento enquanto a batalha não tiver começado.
3. O computador distribui automaticamente sua frota, respeitando as mesmas regras.
4. A batalha só pode começar quando ambas as frotas estiverem completas e válidas.

O jogador deve conseguir escolher a orientação das embarcações e reconhecer quando uma tentativa de posicionamento é inválida.

## 4. Turnos e ataques

- **O jogador humano realiza o primeiro ataque.**
- Cada participante tem direito a **um ataque por turno**, mesmo quando acerta uma embarcação.
- O ataque consiste em selecionar uma única coordenada no tabuleiro adversário.
- Uma coordenada já atacada não pode ser atacada novamente pelo mesmo participante.
- Um ataque válido pode resultar em:
  - **Água:** não havia embarcação naquela posição.
  - **Acerto:** havia parte de uma embarcação naquela posição.
  - **Embarcação destruída:** o ataque atingiu a última posição intacta de uma embarcação.
- Depois de um ataque válido do jogador, o computador realiza um ataque, desde que a partida não tenha terminado.
- O computador escolhe **aleatoriamente entre as coordenadas que ainda não atacou**.
- Tentativas inválidas não consomem o turno.

Os resultados dos ataques devem permanecer visíveis para que o jogador acompanhe a evolução da partida.

## 5. Destruição de embarcações

- Cada posição ocupada por uma embarcação pode ser atingida uma única vez.
- Uma embarcação é considerada **destruída** quando todas as suas posições tiverem sido atingidas.
- O jogo deve informar quando uma embarcação for destruída.
- Acertar uma embarcação não revela automaticamente suas posições restantes.

## 6. Vitória, derrota e nova partida

- A partida termina **imediatamente** quando todas as embarcações de um participante forem destruídas.
- Se a frota do computador for destruída primeiro, o jogador vence.
- Se a frota do jogador for destruída primeiro, o jogador perde.
- Depois do encerramento, não é permitido realizar novos ataques naquela partida.
- O jogador deve poder **iniciar uma nova partida**, com os tabuleiros reiniciados e novas frotas.

## 7. Experiência esperada

A aplicação deve permitir que o usuário:

1. Inicie uma partida a partir de uma apresentação inicial do jogo.
2. Organize a própria frota antes do combate.
3. Visualize claramente os dois tabuleiros durante a batalha.
4. Saiba de quem é o turno e veja o resultado de cada ataque.
5. Identifique acertos, erros e embarcações destruídas sem depender apenas de cores.
6. Reconheça quando a partida terminou e possa jogar novamente.

A experiência deve ser utilizável tanto em computadores quanto em dispositivos móveis. **A forma exata das interações e a aparência visual ficam em aberto** para definição durante o desenvolvimento.

## 8. Exemplos de situações que o jogo deve tratar

| Situação                                                    | Comportamento esperado                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Posicionar um porta-aviões horizontalmente a partir de `A8` | Rejeitar, pois ultrapassaria a borda direita.                              |
| Posicionar uma embarcação sobre uma posição já ocupada      | Rejeitar sem alterar o posicionamento válido existente.                    |
| Posicionar duas embarcações lado a lado, sem sobreposição   | Permitir.                                                                  |
| Iniciar a batalha com embarcações ainda não posicionadas    | Impedir o início.                                                          |
| Atacar uma coordenada já atacada                            | Impedir o ataque e manter o turno.                                         |
| Atingir a última posição intacta de uma embarcação          | Informar que ela foi destruída.                                            |
| Destruir a última embarcação adversária                     | Encerrar a partida imediatamente, sem conceder outro ataque ao computador. |
| Tentar atacar após o encerramento                           | Impedir o ataque.                                                          |
| Iniciar uma nova partida                                    | Reiniciar o jogo com uma nova preparação de frotas.                        |

## 9. Limites da atividade

**Não fazem parte do jogo obrigatório:**

- Partidas entre dois jogadores humanos.
- Multiplayer online.
- Inteligência artificial estratégica para o computador.
- Contas de usuário, ranking ou chat.
- Continuação de partidas após fechar a aplicação.

## Desenvolvimento

Requisitos: Node.js 24 ou superior (validado com 24.21.0) e npm.

```bash
npm install     # instala as dependências
npm start       # servidor de desenvolvimento em http://localhost:4200
npm test        # testes unitários com Vitest
npm run build   # build de produção em dist/
```

Qualidade de código:

```bash
npm run lint          # análise estática com ESLint
npm run format        # formata os arquivos com Prettier
npm run format:check  # apenas verifica a formatação
```

A aplicação usa Angular 22.2 com componentes standalone e sem Zone.js (zoneless),
estilização com Tailwind CSS 4 e ícones Lucide.

## Deploy automático

O workflow `.github/workflows/deploy.yml` gera e publica o site no GitHub Pages a
cada push em `main` ou `master`. Também pode ser executado manualmente pela aba
**Actions**, em **Deploy para GitHub Pages → Run workflow**.

Para ativar, envie o workflow ao GitHub e, em **Settings → Pages → Build and
deployment → Source**, selecione **GitHub Actions**. Se o ambiente `github-pages`
tiver restrições de branches, permita tanto `main` quanto `master` em
**Settings → Environments → github-pages**.

A publicação usa o `GITHUB_TOKEN` automático, sem precisar cadastrar um token
pessoal. O build publicado é o conteúdo de `dist/batalhanaval/browser`, com o
caminho base `/Batalha_Naval-academia---programation/`.

## Tema

As cores do jogo são tokens do Tailwind declarados em `src/styles.css` (`@theme`),
o que gera utilitários como `bg-agua`, `text-acerto` e `border-tabuleiro-borda`.

| Token                     | Uso                                           |
| ------------------------- | --------------------------------------------- |
| `--color-agua`            | ataque em célula sem embarcação               |
| `--color-acerto`          | célula com parte de embarcação atingida       |
| `--color-destruido`       | embarcação totalmente destruída               |
| `--color-navio`           | posição de embarcação no tabuleiro do jogador |
| `--color-tabuleiro`       | fundo do tabuleiro                            |
| `--color-tabuleiro-borda` | grade e bordas do tabuleiro                   |

Regra do projeto: **cor nunca é o único indicador**. Todo estado de célula (água,
acerto, embarcação destruída) deve também trazer ícone, texto ou rótulo acessível
(`aria-label`), para funcionar em daltonismo, alto contraste e leitores de tela.

## Testes

O runner é o Vitest integrado ao builder do Angular CLI (`npm test` roda uma vez,
com `--watch=false`). Convenções:

- Arquivos de teste ficam ao lado do código, como `*.spec.ts`.
- Regras do jogo (tabuleiro, frota, turnos, ataques) devem ser funções puras de
  TypeScript e testadas diretamente, sem `TestBed`.
- `TestBed` é usado apenas quando o comportamento testado depende de renderização
  ou de signals do Angular.
