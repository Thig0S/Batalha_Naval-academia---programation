# Tasks

## 1. Ambiente e scaffold Angular

- [ ] 1.1 Gerar o workspace Angular 22.2 na raiz do repositório (gerar em pasta temporária e mover se o CLI recusar diretório não vazio), preservando `README.md`, `AGENTS.md`, `openspec/`, `.opencode/` e `.git/`. Verificar: `angular.json` e `package.json` existem na raiz e `git status` não mostra arquivos preservados como deletados.
- [ ] 1.2 Validar a compatibilidade do Node 24.21.0 com o Angular 22.2 rodando `npm install` e `npx ng version`. Verificar: os dois comandos terminam sem erro de `engines`; se houver erro, parar a change e reportar ao usuário (decisão D9).
- [ ] 1.3 Ajustar `package.json`: scripts `start`, `build`, `test` (com `--watch=false`), `lint`, `format`, `format:check` e campo `engines.node` com a faixa realmente suportada. Verificar: `npm run` lista os seis scripts e todos existem de fato.
- [ ] 1.4 Atualizar a seção "Desenvolvimento" do `README.md` para a versão de Node validada em 1.2. Verificar: os comandos escritos no README executam como documentado.

## 2. Bootstrap zoneless e shell

- [ ] 2.1 Configurar `src/app/app.config.ts` com `provideZonelessChangeDetection()`. Verificar: `Get-Content src/app/app.config.ts | Select-String provideZonelessChangeDetection` retorna a linha e `npm start` sobe sem erro.
- [ ] 2.2 Remover `zone.js` dos polyfills e das dependências. Verificar: nenhuma referência a `zone.js` em `angular.json` e em `package.json`.
- [ ] 2.3 Criar o shell em português: cabeçalho com "Batalha Naval", subtítulo curto e `<main>` vazio pronto para hospedar a tela ativa. Verificar: `npm start` renderiza os textos e o console do navegador (via Playwright MCP) não mostra erros.
- [ ] 2.4 Ajustar `src/index.html` com `lang="pt-BR"` e `<title>` em português. Verificar: inspeção do arquivo e do DOM carregado.

## 3. Tailwind 4 e tokens de tema

- [ ] 3.1 Instalar `tailwindcss` e `@tailwindcss/postcss` e criar `.postcssrc.json` apontando para o plugin. Verificar: `.postcssrc.json` existe e as duas dependências constam em `package.json`.
- [ ] 3.2 Adicionar `@import "tailwindcss";` e o bloco `@theme` com os tokens `--color-agua`, `--color-acerto`, `--color-destruido`, `--color-navio`, `--color-tabuleiro` e `--color-tabuleiro-borda` em `src/styles.css`. Verificar: `npm run build` gera CSS em `dist/` contendo as custom properties (`Select-String` no arquivo de saída).
- [ ] 3.3 Aplicar utilitários Tailwind no shell (layout, espaçamento, cor de fundo do tema) para provar que o pipeline funciona. Verificar: a classe aparece no CSS do build e a página renderiza estilizada.
- [ ] 3.4 Registrar a tabela de tokens e a regra "não depender só de cor" em uma seção "Tema" do `README.md`. Verificar: a seção existe e os nomes documentados batem com o `@theme`.

## 4. Ícones Lucide

- [ ] 4.1 Instalar `lucide-angular` 1.0.0 e importar um ícone (`Anchor`) diretamente no componente do shell. Verificar: `npm run build` conclui e o import resolve sem erro de tipo.
- [ ] 4.2 Marcar o ícone como decorativo (`aria-hidden`) e garantir que nenhuma informação dependa dele. Verificar: leitura do template e ausência de texto alternativo redundante.
- [ ] 4.3 Confirmar a renderização visual do ícone via Playwright MCP no `npm start`. Verificar: elemento `svg` presente no DOM e captura de tela sem ícone quebrado.

## 5. Lint e formatação

- [ ] 5.1 Instalar `angular-eslint` e `eslint-config-prettier` e criar `eslint.config.js` no formato flat. Verificar: `npm run lint` termina com código 0 em `src/`.
- [ ] 5.2 Criar `.prettierrc` (`printWidth: 100`, `singleQuote: true`, 2 espaços) e `.prettierignore` (`dist`, `node_modules`, `openspec`). Verificar: `npm run format` altera apenas arquivos esperados e `npm run format:check` retorna código 0.

## 6. Testes com Vitest

- [ ] 6.1 Configurar o builder de testes do Angular 22 como runner oficial e remover o `spec` de exemplo gerado pelo CLI. Verificar: `ng test --watch=false` termina com sucesso sem specs órfãos.
- [ ] 6.2 Criar `src/app/app.spec.ts` verificando que o shell renderiza o título "Batalha Naval". Verificar: `npm test` executa o teste e termina com código 0, sem processo pendurado.
- [ ] 6.3 Documentar no `README.md` a convenção de testes: domínio puro testado com Vitest, sem depender de `TestBed` quando não houver UI. Verificar: a seção existe e corresponde ao `design.md` (D7).

## 7. Verificação de integração

- [ ] 7.1 Executar a sequência completa `npm run format:check`, `npm run lint`, `npm test`, `npm run build` e confirmar código 0 em todas. Verificar: saída dos quatro comandos e `dist/` gerado.
- [ ] 7.2 Abrir `npm start` com Playwright MCP em 1440x900 e em 375x812, checando ausência de erros no console e ausência de rolagem horizontal. Verificar: relato das duas capturas e do console limpo.
- [ ] 7.3 Rodar `openspec validate fundacao-do-projeto --strict` e corrigir o que for apontado. Verificar: validação sem erro.

## Workflow follow-up

- Arquivar a change depois da revisão do usuário e antes de iniciar a fase 1 (`dominio-batalha-naval`).
