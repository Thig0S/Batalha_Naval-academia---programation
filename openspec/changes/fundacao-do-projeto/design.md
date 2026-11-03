# Design

## Context

Ver `proposal.md` — Why. O que molda este desenho:

- O repositório não tem `package.json` nem código; tudo abaixo é criado do zero.
- `README.md` define a interface de linha de comando esperada (`npm start`, `npm test`, `npm run build`, `npm run lint`, `npm run format`, `npm run format:check`) e afirma Node.js 26+.
- `AGENTS.md` fixa Angular 22.2, zoneless, standalone, signals, Tailwind, Lucide e textos de UI em português.
- Ambiente local: Node 24.21.0, npm 11.19.0. Angular CLI publicado 22.2.5, `tailwindcss` 4.3.4, `lucide-angular` 1.0.0.
- Todas as fases seguintes dependem de um `npm test` confiável, porque as regras do jogo serão validadas por teste.

## Goals / Non-Goals

**Goals:**

- Um workspace Angular 22.2 instalado, que sobe, builda, testa, lint e formata na raiz do repositório.
- Pipeline de estilos funcional com Tailwind 4 e tokens de tema prontos para o jogo.
- Shell visual mínimo em português, sem nenhuma tela do jogo ainda.
- Base de testes (Vitest) com a suíte de exemplo do Angular substituída por um teste próprio e verde.

**Non-Goals:**

- Nenhuma regra de jogo, modelo de tabuleiro, serviço de partida ou componente de célula.
- Nenhum roteador: a navegação entre telas será controlada por estado (a máquina de fases da partida) nas fases seguintes.
- Nenhum E2E (fase 6), nenhum PWA, nenhum SSR, nenhuma integração com backend.
- Nenhuma decisão de identidade visual definitiva além dos tokens de cor.

## Decisions

### D1. Projeto Angular na raiz do repositório

`ng new` gera `package.json`, `angular.json`, `src/` diretamente em `batalhanaval/`.

- **Por quê**: o `README.md` documenta os comandos na raiz, com build em `dist/`, e o OpenSpec/`AGENTS.md` já vivem nesse nível.
- **Alternativa descartada**: subpasta `app/` ou `web/` — exigiria `cd` extra em todo comando documentado e um `package.json` raiz só para scripts delegados.

### D2. Sem roteador

A aplicação não instala `@angular/router` nesta change.

- **Por quê**: as telas do jogo são fases de uma partida única (apresentação → preparação → batalha → fim). Um signal de fase no store resolve; rotas adicionariam URLs, guards e estado duplicado sem requisito do enunciado.
- **Consequência**: o shell é um único componente que hospeda a tela ativa. Se depois houver necessidade real de deep-link, a fase 5 pode introduzir rotas com um custo baixo.

### D3. Zoneless explícito

`provideZonelessChangeDetection()` no `app.config.ts`, e nenhuma referência a `NgZone` no código.

- **Por quê**: o `AGENTS.md` exige zoneless; deixar explícito evita depender do default do CLI e documenta a intenção.
- **Alternativa descartada**: confiar no default do `ng new` da v22 — não é garantido e não fica registrado no código.

### D4. Tailwind 4 via PostCSS, CSS puro

`.postcssrc.json` com `@tailwindcss/postcss` e `@import "tailwindcss";` no início de `src/styles.css`. Nada de SCSS.

- **Por quê**: é o caminho oficial do Tailwind 4 para bundlers; CSS puro reduz uma camada de build e o Angular já entende CSS nativamente.
- **Alternativa descartada**: Tailwind CLI separado (`tailwindcss -i ... -o ...`) — exige script extra e watch duplicado; `tailwind.config.js` também não é necessário na v4.

### D5. Tokens de tema em `@theme`

Cores do jogo declaradas como custom properties do Tailwind em `src/styles.css`:

| Token | Uso |
|---|---|
| `--color-agua` | célula atacada sem embarcação |
| `--color-acerto` | célula com parte de embarcação atingida |
| `--color-destruido` | embarcação totalmente destruída |
| `--color-navio` | posição de embarcação no tabuleiro próprio |
| `--color-tabuleiro` / `--color-tabuleiro-borda` | fundo e grade |

- **Por quê**: a fase 5 exige que acerto/erro/destruído não dependam só de cor — os tokens são a camada de cor, e ícones/textos virão por cima. Centralizar agora evita `bg-red-500` espalhado depois.
- **Regra registrada**: todo par token/fundo deve passar contraste AA; a verificação fica na fase 5.

### D6. Ícones Lucide importados por componente

Cada componente importa os componentes de ícone que usa (`import { Anchor } from 'lucide-angular'`), em vez de um provider global com a biblioteca inteira.

- **Por quê**: mantém o bundle pequeno e o uso explícito; a API de import por componente é a mais estável.
- **Alternativa descartada**: `provideLucideIcons` com catálogo central — conveniente, porém arrasta ícones não usados e cria um ponto único de mudança.
- **Fallback aplicado na implementação**: `lucide-angular@1.0.0` declara peer `@angular/common: 13.x - 21.x` e falha com `ERESOLVE` no Angular 22. Foi adotado `@lucide/angular@1.66.0` (peer `>=17`), mesmo conjunto de ícones, com componentes standalone baseados em signals. O import continua por componente (`LucideAnchor` → `<svg lucideAnchor>`).

### D7. Vitest pelo builder do Angular CLI

`npm test` executa `ng test`, usando o builder oficial e o Vitest que o Angular 22 fixa. O script passa `--watch=false` para que a execução termine (compatível com CI e com o agente).

- **Por quê**: uma configuração a menos e versões que o CLI garante compatíveis; sobrescrever a versão do Vitest (5.1.0 local) pode quebrar o builder.
- **Alternativa descartada**: Vitest standalone com `vitest.config.ts` e `jsdom` — mais controle, mas exige configurar transform de templates/TS por conta própria.

### D8. Lint e formatação

ESLint flat config (`eslint.config.js`) com `angular-eslint` + `eslint-config-prettier`; Prettier com `printWidth: 100`, `singleQuote: true`, 2 espaços.

- **Por quê**: os scripts já estão documentados no `README.md`; `eslint-config-prettier` evita conflito entre regra de lint e formatação.
- **Consequência**: `npm run format:check` é o gate barato para o agente antes de encerrar uma fase.

### D9. Node: alinhar documentação, não forçar upgrade

O `README.md` afirma 26+, mas o Angular 22.2 declara suporte a versões LTS anteriores. Primeira task da change valida `ng build`/`ng test` no Node 24.21.0; se passar, `README.md` e `engines.node` passam a refletir a faixa real (`>=24`), sem exigir troca de ambiente.

- **Por quê**: instalar um Node novo na máquina do desenvolvedor é uma decisão dele, não um efeito colateral de scaffold; e a documentação precisa ser verdadeira.
- **Alternativa descartada**: fixar `engines: { node: ">=26" }` — quebraria `npm install` no ambiente atual sem ganho técnico.

### D10. Estrutura de pastas mínima

```
src/
  app/
    app.ts / app.html / app.css      -> shell + tela inicial vazia
    shared/
      tema/                          -> classes utilitárias de layout (se necessário)
  styles.css                         -> @import tailwind + @theme
```

`core/` (domínio puro) e `state/` (store da partida) **não** são criados aqui: nascem na fase 1 e 2, quando têm conteúdo real. Pastas vazias com `.gitkeep` viram ruído.

## Risks / Trade-offs

- **Node 24 x README 26+** → validado na primeira task; se o Angular recusar, a change para e a decisão volta para o usuário (instalar Node 26 ou fixar uma versão anterior do Angular).
- **Integração Tailwind 4 + Angular (PostCSS)** → smoke test na própria task: uma classe utilitária precisa aparecer no CSS do build. Fallback: Tailwind CLI no script de build.
- **`lucide-angular` 1.0.0 recente** → validar um import real de ícone na task de UI; fallback: usar `@lucide/angular`/SVG inline temporariamente e registrar a troca.
- **`ng test` em modo watch trava o agente** → `--watch=false` explícito no script `test`; conferir que o processo termina com código 0.
- **Builder de testes do Angular 22 ainda experimental** → não customizar `angular.json` além do necessário; registrar a versão do CLI usada no `package.json`.
- **Cores sem contraste** → tokens definidos agora e auditados na fase 5; risco aceito e rastreado.
- **Escopo inflado** → esta change não cria nenhuma abstração de jogo; se uma task começar a modelar tabuleiro, ela pertence à fase 1.

## Open Questions

Nenhuma pendente. As duas que existiam (Node e Tailwind) viram tasks de verificação com critério de fallback já definido, sem alterar o escopo.
