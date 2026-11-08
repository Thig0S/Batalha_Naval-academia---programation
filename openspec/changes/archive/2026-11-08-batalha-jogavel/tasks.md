# Tasks

## 1. Estado de combate na store

- [x] 1.1 Adicionar à `PartidaStore` o signal do `EstadoCombate | null` e os computeds de turno, vencedor, tiros recebidos por lado, tipos destruídos e combate ativo; verificar que os testes atuais da store continuam passando com `npm test -- partida-store`.
- [x] 1.2 Fazer `iniciarBatalha()` criar o combate com `criarCombate` a partir dos tabuleiros posicionados e falhar sem trocar de fase quando a frota estiver incompleta; verificar com testes de batalha iniciada no turno do jogador, sem tiros e sem vencedor, e de frota incompleta.
- [x] 1.3 Implementar `atacarJogador(coordenada)` delegando a `atacar` e devolvendo o resultado; verificar com testes de ataque válido (água, acerto e destruição) e de coordenada repetida rejeitada sem alterar turno nem histórico.
- [x] 1.4 Implementar `atacarComputador()` com `sortearAlvo` sobre os tiros recebidos pelo jogador e `atacar`; verificar com PRNG fixo que o alvo não foi atacado antes, que o resultado entra no tabuleiro do jogador e que o turno volta ao jogador.
- [x] 1.5 Agendar o ataque do computador com `ATRASO_COMPUTADOR_MS` e timer único, limpando agendamentos anteriores; verificar com timers falsos que nada acontece antes do atraso, que o ataque ocorre depois e que reiniciar cancela o timer pendente.
- [x] 1.6 Implementar `novaPartida()` limpando timer e combate e reutilizando o fluxo de preparação com nova frota do computador; verificar com teste de reinício após vitória/derrota (tabuleiro do jogador vazio, sem tiros e sem vencedor).

## 2. Rótulos e tabuleiro com resultados

- [x] 2.1 Adicionar a `state/rotulos.ts` os mapas de resultado (`agua`, `acerto`, `destruido`), de motivo de ataque inválido e de vencedor; verificar com `npm run lint` que os tipos cobrem todos os casos.
- [x] 2.2 Estender `Tabuleiro` com os inputs `tirosRecebidos` e `interativo`, derivando por célula o resultado, as classes e o `aria-label` com ícone além da cor; verificar com testes de componente para água, acerto e destruído.
- [x] 2.3 Garantir que o modo `adversario` renderize apenas os tiros, sem derivar nem revelar embarcações; verificar com teste que nenhuma célula adversária ganha rótulo de embarcação.
- [x] 2.4 Atualizar a tela de preparação para o novo input `interativo`; verificar que os testes de preparação e de posicionamento continuam passando.

## 3. Tela de batalha interativa

- [x] 3.1 Montar a tela com indicador de turno/situação, os dois tabuleiros ligados à store, legenda dos resultados e região `aria-live`; verificar com teste de renderização dos dois tabuleiros e do turno inicial do jogador.
- [x] 3.2 Ligar o clique no tabuleiro adversário a `atacarJogador` e exibir o motivo textual quando o ataque for rejeitado; verificar com teste de clique válido atualizando a célula e de clique repetido mantendo o turno e mostrando o aviso.
- [x] 3.3 Bloquear o tabuleiro adversário fora do turno do jogador e durante o atraso do computador; verificar com teste que cliques no turno do computador não registram ataque.
- [x] 3.4 Anunciar em texto a embarcação destruída sem revelar as demais posições; verificar com teste que o aviso cita o tipo e que só as células atingidas aparecem marcadas.
- [x] 3.5 Exibir vitória/derrota, bloquear os dois tabuleiros ao encerrar e mostrar o botão "Nova partida" ligado à store; verificar com testes de vitória, derrota e reinício voltando à preparação.

## 4. Verificação integrada

- [x] 4.1 Rodar `npm test` e confirmar que store, tabuleiro, batalha e domínio passam sem regressões.
- [x] 4.2 Rodar `npm run lint` e `npm run format:check` e corrigir o que for apontado.
- [x] 4.3 Rodar `npm run build` e confirmar o build de produção sem erros.

## 5. Espera perceptível e embarcação destruída completa

- [x] 5.1 Aumentar `ATRASO_COMPUTADOR_MS` para 1200 ms e exibir "O computador está atacando…" na região `aria-live` durante a espera, derivado do turno sem estado novo; verificar com timers falsos que o aviso aparece durante o atraso e some quando o contra-ataque devolve o turno.
- [x] 5.2 Expor na `PartidaStore` as `embarcacoesDestruidasDoComputador` e `embarcacoesDestruidasDoJogador` derivadas de `tiposDestruidos`, sem alterar o domínio; verificar com testes de store antes e depois da destruição.
- [x] 5.3 Estender o `Tabuleiro` com o input `embarcacoesDestruidas`, marcando todas as células da embarcação como destruída (fundo, ícone e rótulo com o tipo) e, no modo `adversario`, revelando apenas as embarcações já destruídas; verificar com testes de componente nos dois modos.
- [x] 5.4 Atualizar a tela de batalha para os novos inputs e o aviso de espera e rodar `npm test`, `npm run lint`, `npm run format:check` e `npm run build`.

## Workflow follow-up

- Arquivar o change após a revisão e a implementação serem concluídas.
- Verificar o resultado arquivado em `openspec/changes/archive/`.
