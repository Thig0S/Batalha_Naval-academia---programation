# Tasks

## 1. Modelo e criação do combate

- [x] 1.1 Criar em `src/app/core/combate.ts` os tipos readonly `Participante`, `Tiro`, `LadoDoCombate`, `EstadoCombate` e resultados discriminados, sem alterar `Tabuleiro`, store ou telas; documentar os históricos como ataques recebidos. Verificar: os contratos representam combate ativo com turno e encerrado com vencedor sem turno, e a compilação aceita os consumidores existentes.
- [x] 1.2 Implementar `criarCombate` com validação das duas frotas, cópia das embarcações, listas novas de tiros e turno inicial do jogador; criar fixtures puras em `core/testes/`. Verificar em `combate.spec.ts`: sucesso com frotas válidas; falha `frota-invalida` identificando jogador/computador para tipo ausente, duplicado, desconhecido, orientação inválida, coordenada não inteira/não finita, limites e sobreposição; entradas preservadas e alteração posterior da frota de entrada sem efeito no combate.

## 2. Resolução e consultas de ataques

- [x] 2.1 Implementar em `core/ataques.ts` a resolução de água/acerto/destruição, com coordenada copiada no tiro e sem revelar posições restantes; documentar o contrato de uso pelo motor de turnos. Verificar em `ataques.spec.ts`: água em célula livre, acerto parcial, última posição do destroyer como `destruido` com tipo, e ausência de frota ou posições restantes no resultado público.
- [x] 2.2 Implementar `tiposDestruidos` e `frotaDestruida` derivando dano das coordenadas atingidas, sem flags ou contadores redundantes. Verificar em `ataques.spec.ts`: navio parcial não destruído, cruzador e submarino tratados separadamente apesar do mesmo tamanho, cinco navios destruídos, e tiros antigos mantidos com o resultado original.

## 3. Transições e término

- [x] 3.1 Implementar `atacar` com validação de encerramento, turno, coordenada e repetição, nessa ordem; documentar os quatro motivos de falha. Verificar em `combate.spec.ts`: limites negativos/superiores, índices fracionários/não finitos, ataque repetido na vez correta, jogador fora da vez e computador fora da vez são rejeitados sem mudar estado ou turno.
- [x] 3.2 Conectar resolução e histórico adversário à transição, alternando após água, acerto ou destruição não terminal. Verificar em `combate.spec.ts`: um ataque válido por participante, retorno ao jogador após o computador, preservação do histórico do atacante e ausência de mutação de estados e coordenadas recebidos, inclusive com entradas congeladas.
- [x] 3.3 Encerrar antes de alternar quando o ataque destruir a frota adversária. Verificar em `combate.spec.ts`: vitória do jogador e do computador com `turno: null`, nenhum ataque extra após vitória do jogador, rejeição de ataques posteriores de ambos e criação independente de outro combate sem ataques/vencedor.

## 4. Alvo aleatório do computador

- [x] 4.1 Criar `core/ataque-aleatorio.ts` com `sortearAlvo`, enumerando candidatos não atacados em ordem linha/coluna e recebendo o gerador por parâmetro, sem acesso à frota. Documentar qual histórico passar e o contrato `[0, 1)`. Verificar em `ataque-aleatorio.spec.ts`: alvo não repetido, primeiro/último candidato com valores nos extremos válidos, único candidato com 99 ataques, `null` com 100 ataques, uma chamada ao gerador quando há candidatos e nenhuma quando não há.
- [x] 4.2 Cobrir determinismo, independência da frota e esgotamento sem repetição. Verificar em `ataque-aleatorio.spec.ts`: PRNGs com a mesma semente e históricos iguais produzem a mesma sequência, resultados água/acerto diferentes não mudam o sorteio, 100 escolhas válidas são únicas e um gerador constante termina mesmo com uma única célula restante.

## 5. Verificação integrada do domínio

- [x] 5.1 Adicionar simulações puras de partidas completas em `combate.spec.ts`, compondo criação, sorteio e ataques e parando ao definir vencedor. Verificar: várias sementes terminam em até 199 ataques válidos, sem repetição por atacante, com turnos alternados até o término, exatamente um vencedor e todos os estados anteriores preservados; manter testes determinísticos explícitos para ambas as vitórias.
- [x] 5.2 Executar `npm run format:check`, `npm run lint`, `npm test` e `npm run build`. Verificar: todos terminam com código 0 e a suíte existente de preparação continua passando, sem novos imports de Angular no domínio nem alterações funcionais em store/telas.
- [x] 5.3 Executar `openspec validate combate-de-turnos --strict` e revisar a correspondência entre os cenários da spec e os testes entregues. Verificar: validação sem erros/avisos e cobertura dos oito requisitos, sem tarefas de integração visual incluídas nesta change.

## Workflow follow-up

- Arquivar a change após revisão do usuário, sincronizando a nova capacidade `combate-de-turnos`.
- Propor a próxima change para integrar o domínio à `PartidaStore`, habilitar ataques na tela, apresentar vitória/derrota e iniciar nova partida.
