# Tasks

## 1. Coordenadas e frota

- [ ] 1.1 Criar `src/app/core/coordenada.ts` com `TAMANHO_TABULEIRO`, `Coordenada` (linha/coluna numéricas), `rotuloCoordenada`, `chaveCoordenada` e `dentroDoTabuleiro`. Verificar: `coordenada.spec.ts` cobre `A1` → `(0,0)`, `J10` → `(9,9)`, rótulos de ida e volta e rejeição de `K1`/`A11`.
- [ ] 1.2 Criar `src/app/core/frota.ts` com `TipoEmbarcacao`, `TAMANHOS`, `TIPOS_DA_FROTA`, `Embarcacao` (âncora + orientação) e `coordenadasDe`. Verificar: `frota.spec.ts` confirma 5 tipos, tamanhos 5/4/3/3/2, total de 17 posições e coordenadas horizontais e verticais na ordem correta.

## 2. Tabuleiro e posicionamento

- [ ] 2.1 Criar `src/app/core/tabuleiro.ts` com `Tabuleiro` (somente `embarcacoes`) e `TABULEIRO_VAZIO`. Verificar: `tabuleiro.spec.ts` confirma tabuleiro vazio sem embarcações e que operações não mutam a entrada.
- [ ] 2.2 Implementar `validarPosicionamento` e `posicionar` em `src/app/core/posicionamento.ts`, com `MotivoInvalido` = `fora-do-tabuleiro` | `sobreposicao` e resultado explícito. Verificar: `posicionamento.spec.ts` cobre porta-aviões em `A8`, encouraçado em `H5`, sobreposição com tabuleiro inalterado e encostados lado a lado/diagonal aceitos.
- [ ] 2.3 Implementar `removerEmbarcacao` e o reposicionamento (remover o tipo antes de validar). Verificar: `posicionamento.spec.ts` cobre remoção liberando células, mover sobre as próprias células como válido e reposicionamento inválido preservando a posição anterior.
- [ ] 2.4 Implementar `frotaCompleta` e `tiposPendentes`. Verificar: `posicionamento.spec.ts` confirma frota incompleta com quatro tipos, tipo pendente identificado e frota completa com os cinco.

## 3. Geração aleatória de frota

- [ ] 3.1 Criar `src/app/core/testes/aleatorio-fixo.ts` com PRNG mulberry32 determinístico. Verificar: o arquivo não é coletado como teste (`*.spec.ts`) e produz a mesma sequência para a mesma semente.
- [ ] 3.2 Implementar `gerarFrotaAleatoria(aleatorio)` em `src/app/core/frota-aleatoria.ts`, com tentativa por embarcação do maior para o menor, reinício da frota e limites. Verificar: `frota-aleatoria.spec.ts` gera 1.000 frotas e confirma, em todas, cinco embarcações, dentro dos limites e sem sobreposição.
- [ ] 3.3 Adicionar teste de reprodutibilidade da geração. Verificar: duas execuções com a mesma semente produzem exatamente as mesmas embarcações.

## 4. Verificação de integração

- [ ] 4.1 Confirmar que `src/app/core/` não importa nada de `@angular/*`. Verificar: busca por `@angular` em `src/app/core` não retorna resultados.
- [ ] 4.2 Executar `npm run format:check`, `npm run lint`, `npm test` e `npm run build`. Verificar: os quatro comandos terminam com código 0 e o build gera `dist/`.
- [ ] 4.3 Executar `openspec validate tabuleiro-e-frota --strict`. Verificar: validação sem erros e sem avisos.

## Workflow follow-up

- Arquivar a change depois da revisão do usuário, sincronizando a spec `tabuleiro-e-frota` para `openspec/specs/`.
- Seguir para a change `preparacao-da-frota` (store + tela consumindo este núcleo).
