import { chaveCoordenada, Coordenada } from '../../core/coordenada';
import { coordenadasDe } from '../../core/frota';
import { PartidaStore } from '../partida-store';

/**
 * Primeira célula do tabuleiro do computador sem embarcação e ainda não atacada pelo jogador,
 * na ordem do tabuleiro. Escolhe apenas alvos "seguros": a frota adversária nunca é destruída,
 * o que mantém determinístico o número de rodadas até o fim da partida.
 */
export function celulaLivreDoComputador(store: PartidaStore): Coordenada {
  const ocupadas = new Set(
    store.tabuleiroComputador().embarcacoes.flatMap(coordenadasDe).map(chaveCoordenada),
  );
  const jaAtacadas = new Set(
    store.tirosRecebidosPeloComputador().map((tiro) => chaveCoordenada(tiro.coordenada)),
  );

  for (let linha = 0; linha < 10; linha++) {
    for (let coluna = 0; coluna < 10; coluna++) {
      const coordenada: Coordenada = { linha, coluna };
      const chave = chaveCoordenada(coordenada);
      if (!ocupadas.has(chave) && !jaAtacadas.has(chave)) {
        return coordenada;
      }
    }
  }
  throw new Error('Nenhuma célula livre restante no tabuleiro do computador.');
}

/** Ataque do jogador garantindo que o domínio aceitou; falha o teste caso contrário. */
export function atacarValido(store: PartidaStore, coordenada: Coordenada): void {
  const resultado = store.atacarJogador(coordenada);
  if (!resultado.ok) {
    throw new Error(`Esperava ataque válido, veio "${resultado.motivo}".`);
  }
}
