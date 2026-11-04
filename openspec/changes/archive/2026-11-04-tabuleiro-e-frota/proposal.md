# Proposal

## Why

O repositório tem apenas infraestrutura: a change `fundacao-do-projeto` deixou o Angular 22.2, o Tailwind, o Vitest e o shell prontos, mas nenhuma regra do jogo existe ainda. A primeira capacidade necessária é a mais fundamental: representar um tabuleiro 10 × 10, a frota de cinco embarcações e a validade de cada posicionamento. Sem esse núcleo, as telas de preparação e batalha não têm o que renderizar nem como testar. O projeto também ainda não possui nenhuma spec durável — esta change inaugura `openspec/specs/`.

## What Changes

- Criar `src/app/core/` como camada de domínio puro: TypeScript sem nenhuma importação de Angular.
- Modelar coordenadas do tabuleiro (linhas `A`–`J`, colunas `1`–`10`) com representação numérica interna e conversão para rótulo.
- Definir a frota padrão (porta-aviões 5, encouraçado 4, cruzador 3, submarino 3, destroyer 2), usando o tipo da embarcação como identidade, já que há exatamente uma de cada.
- Modelar uma embarcação posicionada como âncora (linha, coluna) + orientação, com derivação das células ocupadas.
- Implementar validação de posicionamento com motivo tipado: fora do tabuleiro ou sobreposição. Embarcações encostadas, inclusive na diagonal, continuam válidas.
- Implementar operações imutáveis de posicionar, remover e reposicionar, com o reposicionamento validando contra o tabuleiro sem a embarcação antiga.
- Implementar verificação de frota completa e listagem dos tipos pendentes.
- Implementar geração de frota aleatória válida com gerador de números aleatórios injetável, reutilizável pela frota do computador na fase seguinte.
- Cobrir as regras com testes unitários Vitest, incluindo os casos da seção 8 do `README.md`.

Esta change **não** implementa tiros, turnos, ataques, destruição, store, componentes ou telas. O `Tabuleiro` nasce apenas com embarcações; os tiros entram na change de combate.

## Capabilities

### New Capabilities

- `tabuleiro-e-frota`: coordenadas, composição da frota, regras de posicionamento (bordas, sobreposição, adjacência), operações imutáveis de posicionamento, condição de frota completa e geração de frota aleatória válida.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs em `openspec/specs/`.

## Impact

- **Novos arquivos**: `src/app/core/` (modelo, validação, sorteio) e testes `*.spec.ts` ao lado de cada arquivo puro.
- **Specs**: criação de `openspec/specs/tabuleiro-e-frota/spec.md` ao arquivar esta change.
- **Dependências**: nenhuma nova. Usa o Vitest já configurado.
- **Não afeta**: `app.ts`, shell, Tailwind, tokens de tema, `package.json`, `README.md`, `AGENTS.md`.
- **Sem UI**: nenhuma mudança visível no navegador; a verificação é `npm test`.
