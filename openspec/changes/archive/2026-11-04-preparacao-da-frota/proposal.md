# Proposal

## Why

O núcleo `src/app/core/` já entrega coordenadas, frota, posicionamento e geração aleatória (35 testes passando), mas a aplicação não tem nenhum comportamento visível: o `<main>` do shell está vazio, não existe store nem tela, e nada do jogo pode ser exercitado no navegador. A próxima fase natural é consumir esse domínio na preparação da partida, tela a tela, conforme o enunciado do `README.md` (seções 3 e 7).

## What Changes

- Criar `src/app/state/partida-store.ts`: o `PartidaStore` com signals e computed, guardando `fase` (`apresentacao` → `preparacao` → `batalha`), `tabuleiroJogador` e `tabuleiroComputador`, e expondo `tiposPendentes`, `frotaCompleta` e as ações `iniciarPartida`, `posicionar`, `remover` e `iniciarBatalha`.
- Gerar a frota do computador em `iniciarPartida` com `gerarFrotaAleatoria`, usando um gerador de números aleatórios injetável (token com `Math.random` como padrão) para testes determinísticos. Essa frota permanece oculta durante toda a preparação.
- Criar a tela de apresentação (fase `apresentacao`): resumo das regras do jogo e botão "Iniciar partida".
- Criar a tela de preparação (fase `preparacao`): lista dos tipos pendentes e posicionados, alternância de orientação, tabuleiro próprio interativo com preview do posicionamento que mostra o motivo da rejeição em texto (não só cor), clique na âncora para posicionar e clique em célula ocupada para selecionar a embarcação e removê-la ou reposicioná-la. Após posicionar, avança automaticamente para o próximo tipo pendente.
- Criar o componente `app-tabuleiro`, de apresentação pura (inputs de estado, outputs de célula), com modos `preparacao`, `proprio` e `adversario`; no modo `adversario` as embarcações nunca são renderizadas. Células acessíveis com `aria-label` e ícone, sem depender apenas de cor.
- Habilitar "Iniciar batalha" somente com a frota do jogador completa; ao acionar, a store muda para `batalha`.
- Criar a tela de batalha como placeholder nesta change: os dois tabuleiros somente leitura, sem ataques.
- Fazer o shell (`app.ts` / `app.html`) hospedar a tela ativa conforme `fase`, sem roteador.
- Cobrir store e telas com testes (Vitest; `TestBed` apenas onde há renderização ou signals do Angular).

Esta change **não** implementa tiros, turnos, ataques, destruição de embarcações, estado de fim de partida nem navegação por teclado com roving tabindex (fica para as changes seguintes: `combate`, `tela-de-batalha` e `acabamento`).

## Capabilities

### New Capabilities

- `preparacao-da-frota`: comportamento visível da preparação da partida — tela inicial do jogo, posicionamento interativo da frota pelo jogador com feedback de invalidez, condição para iniciar a batalha e frote do computador gerada e oculta.

### Modified Capabilities

Nenhuma. A spec `tabuleiro-e-frota` continua descrevendo as regras puras do domínio e não muda nesta change.

## Impact

- **Novos arquivos**: `src/app/state/partida-store.ts`, `src/app/telas/apresentacao/`, `src/app/telas/preparacao/`, `src/app/telas/batalha/`, `src/app/componentes/tabuleiro/`, `src/app/componentes/lista-de-frota/`, com testes ao lado.
- **Alterados**: `src/app/app.ts` / `app.html` / `app.css` para hospedar a tela ativa conforme a fase.
- **Dependências**: nenhuma nova; reutiliza `@lucide/angular`, Tailwind e o domínio existente.
- **Não afeta**: `src/app/core/` (nenhuma mudança de contrato), `openspec/specs/tabuleiro-e-frota/`, tema de cores.
- **Verificação**: `npm test`, `npm run lint`, `npm run build` e inspeção visual com Playwright (1440x900 e 375x812).
