# Design

## Context

Ver `proposal.md` — Why. O que molda este desenho:

- A change `fundacao-do-projeto` deixou Angular 22.2 zoneless, Vitest, Tailwind e o shell prontos, mas nenhum modelo de jogo.
- O `README.md` define tabuleiro 10 × 10 (A–J / 1–10), frota de cinco tipos e as regras de posicionamento; a seção 8 lista os casos que precisam ser rejeitados ou aceitos.
- O `AGENTS.md` exige nomes de métodos e variáveis em português e separação por fases pequenas.
- O `README.md` (seção Testes) exige que regras do jogo sejam funções puras de TypeScript testadas diretamente, sem `TestBed`.
- A próxima change (preparação da frota) vai consumir este núcleo; a change de combate vai estendê-lo com tiros.

## Goals / Non-Goals

**Goals:**

- Um núcleo de domínio puro, sem nenhuma importação de `@angular/*`, que possa ser testado isoladamente.
- Um contrato estável o bastante para a tela de preparação apenas ler estado e chamar ações.
- Erros de posicionamento como dados tipados, não exceções nem `boolean`.
- Geração de frota válida e reproduzível para a frota do computador.

**Non-Goals:**

- Tiros, turnos, ataques, destruição e vitória: pertencem à change `combate`.
- Store, signals, componentes e qualquer mudança visível: pertencem à change `preparacao-da-frota`.
- Configuração de tamanho de tabuleiro ou de frota: o enunciado fixa 10 × 10 e uma de cada tipo.
- Persistência, serialização ou API pública do pacote.

## Decisions

### D1. Domínio em `src/app/core/`, sem Angular

```
src/app/core/
  coordenada.ts       -> Coordenada, limites, rotulo, chave
  frota.ts            -> TipoEmbarcacao, tamanhos, Embarcacao, coordenadas
  tabuleiro.ts        -> Tabuleiro, tabuleiro vazio, posicoes ocupadas
  posicionamento.ts   -> validar / posicionar / remover / frotaCompleta / pendentes
  frota-aleatoria.ts  -> gerarFrotaAleatoria(aleatorio)
  testes/
    aleatorio-fixo.ts -> PRNG mulberry32 para testes
```

- **Por quê**: o `README.md` já prevê regras como funções puras. Um `core/` sem dependência de framework permite testar sem `TestBed` e reaproveitar no combate.
- **Alternativa descartada**: colocar as regras num service injetável desde já — acoplaria o domínio ao ciclo de vida do Angular sem ganho.

### D2. Coordenada numérica interna, rótulo só na borda

`Coordenada` é `{ linha: 0..9, coluna: 0..9 }`. `rotuloCoordenada` produz `"A1"`, `"J10"`; `chaveCoordenada` produz uma string estável para uso em conjuntos.

- **Por quê**: validação de borda, rotação e deslocamento são aritmética de índices. Fazer isso com `"A1"` convida a bugs de parsing.
- **Consequência**: a UI e a futura spec de combate usam rótulos apenas para exibir e para `aria-label`.

### D3. O tipo da embarcação é a identidade

Cada tipo aparece exatamente uma vez na frota, então `tipo` funciona como id. `Tabuleiro` guarda `embarcacoes: Embarcacao[]`.

- **Por quê**: elimina um `id` artificial e a possibilidade de duas embarcações do mesmo tipo. `tiposPendentes` vira uma diferença de conjuntos.
- **Alternativa descartada**: `id` sequencial por embarcação — necessário só se a frota passasse a ter quantidades variáveis, o que o enunciado não pede.
- **Custo se mudar**: adicionar `id` e gerar um por posicionamento; o resto do contrato não muda.

### D4. Âncora + orientação, não lista de células

`Embarcacao` é `{ tipo, linha, coluna, orientacao }`; a âncora é a posição de menor linha/coluna. As células são derivadas por `coordenadasDe`.

- **Por quê**: rotacionar é trocar um enum; mover é trocar dois números. A validação precisa apenas das células derivadas.
- **Alternativa descartada**: lista absoluta de coordenadas — mais flexível para formas arbitrárias, porém torna rotação e reposicionamento operações de conjuntos.
- **Consequência**: um cruzador não pode ser representado em L, o que a spec proíbe de qualquer forma.

### D5. Estado imutável e resultado explícito

As operações retornam um novo `Tabuleiro` ou um resultado de falha; nunca mutam a entrada nem lançam exceção.

```ts
type MotivoInvalido = 'fora-do-tabuleiro' | 'sobreposicao';

type ResultadoPosicionamento =
  | { ok: true; tabuleiro: Tabuleiro }
  | { ok: false; motivo: MotivoInvalido };
```

- **Por quê**: signals do Angular comparam referência; estruturas imutáveis evitam atualizações invisíveis. Rejeição de posicionamento é fluxo normal de jogo, não erro de programação.
- **Alternativa descartada**: classes mutáveis com `throw` — obrigaria `try/catch` na store e tornaria o estado difícil de comparar.

### D6. Reposicionamento remove antes de validar

`posicionar` remove a embarcação do mesmo tipo, valida contra o tabuleiro restante e então insere. `validarPosicionamento` ignora a embarcação do mesmo tipo para que o preview concorde com a ação.

- **Por quê**: sem isso, mover um navio para uma célula que ele já ocupa falha como sobreposição — um bug difícil de perceber e fácil de evitar.
- **Consequência**: o resultado só substitui o tabuleiro quando a validação passa; caso contrário, a posição anterior permanece intacta.

### D7. Aleatoriedade injetada

Todo sorteio recebe `aleatorio: () => number` (intervalo `[0, 1)`), com `Math.random` como valor padrão apenas na borda.

- **Por quê**: a frota do computador e, no futuro, o ataque aleatório precisam de testes determinísticos. `Math.random` dentro do domínio tornaria os testes probabilísticos.
- **Consequência**: o teste usa um PRNG mulberry32 em `core/testes/aleatorio-fixo.ts` e verifica reprodutibilidade.

### D8. Gerador aleatório por tentativa com reinício

A geração percorre os tipos do maior para o menor, tentando posições aleatórias válidas. Se uma embarcação não couber, a frota inteira recomeça, com limite de tentativas e de reinícios.

- **Por quê**: posicionar os maiores primeiro reduz a chance de o tabuleiro ficar fragmentado. Com 17 células em 100, a taxa de falha é baixa, e o reinício garante que o resultado seja sempre uma frota completa.
- **Alternativa descartada**: embaralhar todas as posições válidas para cada navio — mais código e mais memória sem ganho observável no tamanho do tabuleiro.
- **Limite**: se o limite for atingido (não deve ocorrer no tabuleiro padrão), a função lança um erro de programação, não devolve frota incompleta.

### D9. Tiros ficam para a change de combate

`Tabuleiro` nasce apenas com `embarcacoes`; `tiros` entra na spec de combate.

- **Por quê**: nenhum cenário desta change exercita ataque. Um campo morto agora só criaria dúvida sobre quem o mantém.
- **Custo**: um campo novo e ajuste dos construtores de teste na change `combate`.

### D10. Nomes em português

Tipos e funções seguem o `AGENTS.md`: `Coordenada`, `Embarcacao`, `Tabuleiro`, `posicionar`, `removerEmbarcacao`, `frotaCompleta`, `gerarFrotaAleatoria`.

- **Por quê**: consistência com o restante do projeto e com a futura store.
- **Cuidado**: `Orientacao`, `Embarcacao` e `Tabuleiro` não colidem com tipos do Angular nem do DOM.

## Risks / Trade-offs

- **Gerador aleatório entrar em laço ou falhar** → limite de tentativas e de reinícios por geração; teste com 1.000 execuções garante frota completa e válida.
- **Bug sutil no reposicionamento** → cenário dedicado na spec e teste explícito movendo uma embarcação para células que ela já ocupa.
- **Tipo como id limitar mudanças futuras** → documentado em D3; se a frota ganhar quantidades variáveis, adicionar `id` é localizado.
- **Sem tiros agora, tipo muda na change de combate** → mudança pequena e prevista em D9; mantém esta change honesta quanto ao comportamento entregue.
- **Núcleo sem UI não demonstrar progresso visual** → verificação por `npm test`; a UI chega na change seguinte consumindo exatamente este contrato.
- **Excesso de abstração antes da UI** → o contrato se limita ao que a spec exige; nada de factory, estratégia ou configuração.

## Migration Plan

Não aplicável: são arquivos novos, sem consumidores existentes. A change pode ser desfeita removendo `src/app/core/` e a spec criada; nada mais depende dela.

## Open Questions

Nenhuma. A forma de interação da tela de preparação (clique na âncora, arrastar ou girar tocando) não altera este contrato: todas convergem para `(tipo, linha, coluna, orientacao)`. A decisão fica para a change `preparacao-da-frota`.
