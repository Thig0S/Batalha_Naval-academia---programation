# Design

## Context

Ver `proposal.md` - Why. O que molda este desenho:

- O domínio em `src/app/core/` está pronto e testado: `posicionar` já serve de reposicionamento, `validarPosicionamento` devolve motivo tipado, `frotaCompleta`/`tiposPendentes` dão a condição de início e `gerarFrotaAleatoria` recebe `aleatorio: () => number`.
- A aplicação não tem store nem telas: o shell (`app.ts`) hospeda um `<main>` vazio e a fase ainda não existe. A fundação decidiu **sem roteador** (D2 do design arquivado) e zoneless com signals.
- O `AGENTS.md` exige nomes em português, fases pequenas e responsividade simples; o `README.md` exige domínio puro sem `TestBed`, tokens de tema e "cor nunca é o único indicador".
- As conversas de exploração fixaram: interação por lista + orientação + clique na âncora, e "Iniciar batalha" levando a uma visão de batalha placeholder com os dois tabuleiros somente leitura.

## Goals / Non-Goals

**Goals:**

- Um `PartidaStore` com signals e computed, sem lógica de interação, cujo contrato é exatamente o que as telas precisam ler e chamar.
- Um ciclo completo observável no navegador: apresentação → preparação (posicionar, remover, reposicionar) → batalha (somente leitura).
- Acessibilidade mínima desde a primeira versão do tabuleiro: células como botões rotulados, motivo textual de invalidez, ícone além da cor.
- Componente de tabuleiro de apresentação, reutilizável nas fases seguintes sem reescrita.

**Non-Goals:**

- Tiros, turnos, ataques, destruição e estado de fim de partida: a mudança no `Tabuleiro` fica para `combate`.
- Teclado completo no tabuleiro (roving tabindex, setas): fica para `acabamento`; a célula já nasce `button` para não obrigar retrabalho de markup depois.
- Persistência, deep-link, PWA e qualquer backend.
- Arrastar e soltar, ou posicionar por duas células clicadas.

## Decisions

### D1. Store única em `src/app/state/`, com signals

`PartidaStore` (`providedIn: 'root'`) guarda `_fase`, `_tabuleiroJogador` e `_tabuleiroComputador` como signals privados e expõe leituras readonly; ações delegam ao domínio e substituem o signal por referência nova.

```
fase = 'apresentacao' | 'preparacao' | 'batalha'
tabuleiroJogador = signal<Tabuleiro>
tabuleiroComputador = signal<Tabuleiro>   // nunca lida pelas telas nesta change
tiposPendentes, frotaCompleta = computed   // sobre tabuleiroJogador
iniciarPartida() / posicionar() / remover() / iniciarBatalha()
```

- **Por quê**: a fundação já decidiu state por signals e sem roteador; uma store única evita sincronizar duas estruturas de fase, e a imutabilidade do domínio casa com a única forma de atualização de signal (nova referência).
- **Alternativa descartada**: `NgRx` ou serviços de facade por tela — excesso para três fases e uma fonte única de verdade.

### D2. Estado de interação fica na tela, não na store

`tipoSelecionado`, `orientacao` e `celulaFocada` são signals locais de `app-preparacao`. O preview chama `validarPosicionamento` contra o tabuleiro da store.

- **Por quê**: a store permanece um espelho do estado do jogo; girar orientação ou focar célula não é estado de jogo. Como `validarPosicionamento` ignora a embarcação do mesmo tipo, o preview de reposicionamento concorda com a ação sem lógica extra.
- **Consequência**: recarregar ou trocar de tela descarta a seleção — comportamento aceitável.

### D3. PRNG injetável via token

`ALEATORIO` é um `InjectionToken<() => number>` fornecido com `Math.random` em `app.config.ts`. A store usa `inject(ALEATORIO)` em `iniciarPartida`; os testes sobrescrevem com um PRNG fixo e verificam determinismo.

- **Por quê**: mantém `Math.random` fora do fluxo testável sem reescrever o domínio, que já aceita o gerador injetado (D7 da change anterior).
- **Alternativa descartada**: passar o gerador por parâmetro nas ações da store — polui o contrato que as telas consomem.

### D4. Frota do computador nasce em `iniciarPartida`

`iniciarPartida()` gera a frota do computador imediatamente e zera o tabuleiro do jogador. O sucesso de `iniciarBatalha()` não depende de sorteio.

- **Por quê**: o enunciado manda o computador distribuir antes da batalha; gerar na entrada da preparação deixa o botão "Iniciar batalha" com condição única (frota do jogador completa) e simplifica o reinício.
- **Consequência**: uma partida em preparação já tem a frota adversária resolvida, o que é irrelevante nesta change, pois nenhuma tela a lê.

### D5. O modo `adversario` nunca revela o tabuleiro do computador

O modo `adversario` do componente não recebe as embarcações: é a tela (`app-batalha`) que decide o que passa. A store expõe `tabuleiroComputador`, mas nenhum template desta change gera conteúdo a partir dela.

- **Por quê**: ocultar por composição (input ausente) é estrutural, não depende de condição de template esquecível; e o teste do componente no modo `adversario` garante ausência de rótulo de embarcação.
- **Risco residual**: mudanças futuras em `app-batalha` passando a frota por engano — mitigado pelo teste de ausência no componente e, na change `combate`, por resultados derivados (`tiros`) substituírem o input.

### D6. Componente de tabuleiro burro, grade CSS 11x11

`app-tabuleiro` recebe `modo` (`'preparacao' | 'proprio' | 'adversario'`) e `embarcacoes`, e emite `celulaSelecionada(coordenada)` e `celulaFocada(coordenada)`. Internamente um `computed` deriva `Map<chave, tipo>` a partir de `embarcacoes`; cada célula é um `<button type="button">` em grid de 11 colunas (cabeçalho de colunas 1–10, linhas A–J e canto vazio).

- **Por quê**: 100 células não devem recalcular `coordenadaDe` por célula; o mapa por chave é O(17) uma vez por mudança de input. Estado por inputs/outputs mantém o componente testável e reaproveitável nos três modos.
- **Alternativa descartada**: tabela `<table>` com semântica de grade ARIA completa — a navegação por teclado formal entra em `acabamento`; grid CSS dá o mesmo resultado visual com menos máquina de estado.

### D7. Interação de posicionamento: lista + orientação + clique na âncora

`app-lista-de-frota` lista os tipos com estado (pendente/posicionado) e seleciona por clique; um controle alterna orientação; o tabuleiro emite a âncora clicada. Após posicionar com sucesso, seleciona o próximo pendente na ordem de `TIPOS_DA_FROTA` (maior para o menor). Clique em célula ocupada pelo tipo selecionado (ou qualquer embarcação) seleciona a embarcação daquela célula para remover ou reposicionar; um botão "Remover" devolve o tipo a pendente.

- **Por quê**: funciona igualmente em mouse e toque, sem gestos de arraste frágeis em mobile; reutiliza `posicionar` para reposicionar sem caminho de código separado.
- **Alternativa descartada**: arrastar e soltar — mais código de gesto, frágil em 375px, e o mesmo contrato de domínio no fim.

### D8. Acessibilidade mínima agora, teclado completo depois

Cada célula tem `aria-label` ("C7", "C7, encouraçado" quando ocupada) e estado visual por token de tema + ícone Lucide para célula ocupada. O motivo de rejeição aparece em uma região `aria-live="polite"` e a embarcação fica contornada, não só colorida.

- **Por quê**: a regra de tema do `README.md` proíbe cor como único indicador, e os rótulos de célula são requisito de spec; roving tabindex é retrabalho mecânico sobre botões já existentes quando chegar.
- **Custo aceito**: 100 paradas de tabulação por tabuleiro até a change `acabamento`.

### D9. Fase `batalha` placeholder somente leitura

Ao iniciar a batalha, `app-batalha` renderiza os dois tabuleiros: o próprio com `modo: 'proprio'` e as embarcações do jogador; o adversário com `modo: 'adversario'` e nenhuma embarcação. Nenhuma ação de ataque existe nesta change.

- **Por quê**: fecha o ciclo de navegação entre fases e prova o contrato do componente nos dois modos com custo descartável mínimo — a tela é substituída por inteira na change de combate.
- **Alternativa descartada**: não navegar — deixaria um botão habilitado sem efeito e a troca de fase sem teste visual.

### D10. Nomes em português

Componentes: `app-apresentacao`, `app-preparacao`, `app-batalha`, `app-tabuleiro`, `app-lista-de-frota`. Estado da store: `fase`, `tabuleiroJogador`, `iniciarPartida`, `iniciarBatalha`. Nenhum nome colide com tipos do domínio já existentes.

## Risks / Trade-offs

- **100 paradas de tabulação por tabuleiro** → navegação por teclado fica ruim até a change `acabamento`; mitigação documentada em D8 e células já são `button`, então o retrabalho é de foco, não de markup.
- **Frota do computador exposta por engano** → modo `adversario` não recebendo input de embarcações (D5) e teste de ausência de rótulo no componente.
- **`gerarFrotaAleatoria` lança no limite de reinícios (improvável)** → comportamento herdado da change anterior; a falha aparece como erro de programação, não como frota inválida. Sem captura silenciosa.
- **Preview sem hover em toque** → em toque o clique posiciona diretamente e o erro aparece com motivo; o preview completo só existe com foco/sobre em desktop. Aceito no enunciado (motivo visível é obrigatório, preview não).
- **Store crescer na change `combate`** → `tiros` e `turno` entram na mesma store pela natureza de partida única; separar em duas stores agora só mudaria o local do problema.
- ** Migração nula** → arquivos novos e troca do corpo do `<main>` do shell; desfazer é remover `state/`, `telas/` e `componentes/` e voltar o shell. Nada do `core/` muda.

## Open Questions

Nenhuma pendente que altere spec, abordagem ou divisão de tarefas. O ícone por tipo de embarcação (um ícone por tipo ou um único marcador de embarcação) decide-se em implementação e não é behavior de spec.
