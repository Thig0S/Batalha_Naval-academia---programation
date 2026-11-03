# Proposal

## Why

O repositório contém apenas o enunciado do jogo (`README.md`), as diretrizes de trabalho (`AGENTS.md`) e o scaffold vazio do OpenSpec: não existe aplicação Angular, `package.json`, nem qualquer teste executável. Sem uma base técnica instalada e verificada, as fases seguintes (domínio, preparação de frota, batalha) não têm onde ser implementadas nem como ser validadas.

## What Changes

- Criar o workspace Angular 22.2 (standalone, zoneless, sem SSR) na raiz do repositório, para que `npm start`, `npm test`, `npm run build` funcionem como descrito no `README.md`.
- Configurar detecção de mudanças zoneless com `provideZonelessChangeDetection()` e bootstrap baseado em signals.
- Integrar Tailwind CSS 4 via PostCSS, com tokens de tema (`@theme`) para as cores do jogo (água, acerto, destruído, embarcação).
- Integrar `lucide-angular` com um catálogo único de ícones usado pela interface.
- Configurar ESLint (angular-eslint) e Prettier, expondo os scripts `lint`, `format` e `format:check` já documentados no `README.md`.
- Configurar Vitest como runner de testes unitários e deixar uma suíte mínima passando.
- Criar o shell de layout e uma página inicial vazia em português, pronta para receber as telas de apresentação, preparação e batalha.
- Verificar o requisito de Node do `README.md` ("26 ou superior") contra o ambiente real e a faixa suportada pelo Angular 22.2, ajustando `README.md` e o campo `engines` do `package.json` para o valor correto.

Esta change **não** implementa nenhuma regra do jogo: nenhum tabuleiro, embarcação, turno ou ataque é modelado aqui.

## Capabilities

### New Capabilities

Nenhuma. Esta change é infraestrutura e ferramental: não introduz comportamento observável do jogo, portanto não cria spec. O marcador `skip_specs: true` está registrado em `.openspec.yaml`.

### Modified Capabilities

Nenhuma. O projeto ainda não possui specs em `openspec/specs/`.

## Impact

- **Novos arquivos na raiz**: `package.json`, `angular.json`, `tsconfig*.json`, `.postcssrc.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `src/` completo.
- **Dependências adicionadas**: `@angular/*` 22.2, `tailwindcss` 4 + `@tailwindcss/postcss`, `lucide-angular`, `vitest`, `angular-eslint`, `prettier`.
- **Documentação**: possível ajuste da seção "Desenvolvimento" do `README.md` (versão de Node).
- **Não afeta**: `openspec/`, `.opencode/`, regras de jogo, API pública de nada (não há código ainda).
