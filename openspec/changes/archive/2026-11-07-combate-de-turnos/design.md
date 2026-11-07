# Design

## Context

Ver `proposal.md` para a motivação e `specs/combate-de-turnos/spec.md` para o contrato comportamental.

- `core/tabuleiro.ts` contém somente `embarcacoes`; posicionamento e remoção recriam esse objeto sem outros campos. Acrescentar tiros diretamente nele exigiria revisar operações que não pertencem a esta change.
- `core/frota.ts` representa cada navio por tipo, âncora e orientação; `coordenadasDe` deriva suas posições. O tipo identifica unicamente uma embarcação da frota padrão.
- `frotaCompleta` verifica apenas tipos pendentes, não duplicatas, limites ou sobreposição. `validarPosicionamento` ignora o mesmo tipo para permitir reposicionamento.
- `dentroDoTabuleiro` verifica limites numéricos, mas não integralidade. A fronteira de ataque precisa rejeitar também frações e valores não finitos.
- O domínio existente usa resultados discriminados e operações sem mutação. O PRNG em `core/testes/aleatorio-fixo.ts` permite testes reproduzíveis.
- `PartidaStore` e a tela de batalha ainda não têm ataques ou turnos e permanecerão inalterados.

## Goals / Non-Goals

**Goals:**

- Um contrato TypeScript puro que possa ser integrado posteriormente à store sem duplicar regras.
- Histórico único por tabuleiro receptor, com estado de destruição derivado e transições explícitas.
- Modelo terminal sem combinações incoerentes de vencedor e turno.

**Non-Goals:**

- Signals, dependências Angular, componentes, temporizadores, animações ou resposta automática disparada pelo navegador.
- Alteração da representação do tabuleiro de preparação, de suas specs ou de sua API.
- Persistência, IA estratégica, revelação integral de frotas ou mecanismo visual de reinício.

## Decisions

### D1. Compor o estado de combate sem modificar Tabuleiro

Criar `core/combate.ts` com tipos readonly para `Participante` (`jogador` ou `computador`), `Tiro`, `LadoDoCombate` e `EstadoCombate`. Cada lado contém um `tabuleiro` e a lista de `tirosRecebidos`. O estado é uma união: em andamento tem `turno: Participante` e `vencedor: null`; encerrado tem `turno: null` e `vencedor: Participante`.

`Tiro` guarda a coordenada e o resultado histórico: `agua`, `acerto` ou `destruido`; somente a destruição precisa informar `tipo`. Coordenadas restantes nunca entram no resultado de ataque. Consultas derivam os tipos destruídos a partir da frota e das coordenadas atingidas; um acerto antigo não é reescrito quando o navio afunda.

Por quê: elimina sincronização de listas separadas de ataques feitos e recebidos e preserva a preparação. Alternativa descartada: adicionar tiros a `Tabuleiro`, alterando todos os produtores desse tipo para preservar um campo que ainda não utilizam.

### D2. Inicialização validada e isolada

`criarCombate(tabuleiroJogador, tabuleiroComputador)` retorna sucesso com estado novo ou falha `frota-invalida` com `participante`. Validar primeiro jogador e depois computador. Cada frota precisa ter exatamente os cinco tipos conhecidos, uma ocorrência de cada, orientação horizontal/vertical, índices inteiros, posições dentro do tabuleiro e ausência de sobreposição. Reutilizar `coordenadasDe` e `validarPosicionamento` após verificar identidade e orientação; não confiar isoladamente em `frotaCompleta`.

Copiar as embarcações de entrada para criar snapshots próprios e listas novas de tiros. Manter os snapshots compartilhados entre transições internas, sem mutá-los. Isso isola o combate de edições posteriores no tabuleiro de preparação sem copiar frotas a cada tiro.

Alternativa descartada: confiar apenas no chamador; as funções de preparação têm pré-condições diferentes e o novo contrato deve ser válido também em testes puros.

### D3. Uma ação resolve exatamente um ataque

`atacar(estado, participante, coordenada)` retorna `{ ok: true, estado, tiro }` ou `{ ok: false, motivo }`. Validar nesta ordem: combate encerrado, turno incorreto, coordenada inválida, coordenada já atacada. Motivos: `combate-encerrado`, `turno-incorreto`, `coordenada-invalida`, `coordenada-ja-atacada`.

Em sucesso, identificar o adversário, resolver a ocupação, registrar o tiro e derivar destruição/vitória usando o histórico atualizado. Se houver vencedor, encerrar antes de alternar; senão devolver o turno ao adversário. Não modificar estado, coordenada ou coleções recebidas; copiar a coordenada registrada. Em falha, não gerar próximo estado nem consumir aleatoriedade.

Por quê: o computador segue as mesmas regras do jogador, e cada transição fica testável. Alternativa descartada: executar os dois ataques na mesma função; isso mistura resolução de ataque com orquestração futura e dificulta observar o turno do computador.

### D4. Consultas de destruição sem flags redundantes

Em `core/ataques.ts`, concentrar a resolução de tiros e as consultas `tiposDestruidos` e `frotaDestruida`, recebendo o lado defensor. Usar chaves de coordenada em conjuntos para verificar se todas as posições de cada navio foram atingidas. Um histórico completo é suficiente para reconstruir o estado visual futuro; não armazenar dano também em cada embarcação.

Alternativa descartada: contadores de vida e flags de destruição mutáveis, que introduzem invariantes duplicadas. Com até 100 ataques e 17 posições por frota, derivar é simples e suficiente.

### D5. Sortear entre disponíveis, sem consultar a frota

Criar `core/ataque-aleatorio.ts` com `sortearAlvo(tirosRecebidos, aleatorio)`, onde o histórico passado é o do tabuleiro do jogador, isto é, os ataques feitos pelo computador. A função só precisa das coordenadas já atacadas, não recebe a frota nem usa o resultado dos tiros.

Enumerar as 100 coordenadas em ordem linha/coluna, filtrar as atacadas e escolher `floor(aleatorio() * quantidade)`. O gerador é obrigatório e segue o contrato `[0, 1)` usado no projeto. Retornar `null` sem chamar o gerador quando não houver alvos; caso contrário consumir exatamente um valor. A função não registra ataques e não verifica turno: a orquestração futura chama `atacar` com o alvo escolhido.

Por quê: termina mesmo com gerador constante e permite testar primeiro/último candidato. Alternativa descartada: repetir sorteios até achar posição livre, que pode não terminar e degrada no fim do tabuleiro.

### D6. Testes puros por camada e simulação completa

Testar resolução/consultas em `ataques.spec.ts`, transições e inicialização em `combate.spec.ts`, e seleção em `ataque-aleatorio.spec.ts`, sem `TestBed`. Montar frotas completas determinísticas em fixtures de `core/testes/`, sem importar helpers de `state/`.

Cobrir cada cenário da spec, as duas vitórias, a imutabilidade de estados e coordenadas, o isolamento da criação, 100 sorteios sem repetição e partidas completas usando o PRNG existente. As simulações alternam explicitamente os participantes e param ao surgir vencedor; testes pós-término garantem a rejeição. Usar entradas congeladas para detectar mutações quando apropriado.

Alternativa descartada: validar apenas pelo navegador; não exercita bordas do domínio e depende de integração fora do escopo.

## Risks / Trade-offs

- Confundir histórico feito com recebido → manter somente `tirosRecebidos` no defensor e testar que um ataque altera apenas o histórico adversário.
- Helpers de frota verificarem condições insuficientes → adicionar as verificações de composição e coordenadas na criação do combate, sem mudar contratos anteriores.
- Estado completo contém a frota secreta → não enviar o estado inteiro ao componente adversário na integração futura; usar apenas resultados públicos. Esta change não cria uma fronteira de segurança contra inspeção do JavaScript local.
- Tipos readonly não congelam objetos em execução → copiar entradas na criação e coordenadas no registro; testar ausência de mutação. Chamadores não devem contornar readonly para modificar snapshots.
- Batalha continuará somente leitura ao concluir esta change → resultado intencional da divisão; a próxima change integra store, interface e nova partida.

## Migration Plan

Adicionar módulos e testes de domínio, sem migrar a store ou os tabuleiros existentes. Executar a suíte completa para preservar a preparação. Não há dados persistidos, migração de dependências ou publicação independente; rollback consiste em remover apenas os módulos e testes adicionados por esta change. A integração posterior passará as frotas existentes a `criarCombate`.
