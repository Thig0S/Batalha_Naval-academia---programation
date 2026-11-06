import { chaveCoordenada, type Coordenada } from './coordenada';
import { coordenadasDe, type TipoEmbarcacao } from './frota';
import type { LadoDoCombate, Tiro } from './combate';

/**
 * Resolve um ataque contra o lado defensor e devolve o tiro a registrar.
 *
 * Pré-condição: a coordenada ainda não consta no histórico do defensor — `atacar` valida isso
 * antes de chamar. O tiro é o resultado público do ataque: carrega a coordenada (copiada), o
 * resultado e, apenas na destruição, o tipo da embarcação; nunca revela a frota nem as
 * posições restantes da embarcação atingida.
 *
 * O motor de turnos (`atacar`, em `./combate`) usa esta função e acrescenta o tiro ao
 * `tirosRecebidos` do defensor. Tiros anteriores nunca são reescritos: um acerto continua
 * `acerto` mesmo depois que a embarcação é destruída por ataques seguintes.
 */
export function resolverTiro(coordenada: Coordenada, lado: LadoDoCombate): Tiro {
  const chave = chaveCoordenada(coordenada);
  const embarcacao = lado.tabuleiro.embarcacoes.find((posicionada) =>
    coordenadasDe(posicionada).some((celula) => chaveCoordenada(celula) === chave),
  );

  if (embarcacao === undefined) {
    return { coordenada: { ...coordenada }, resultado: 'agua' };
  }

  const atingidas = new Set(lado.tirosRecebidos.map((tiro) => chaveCoordenada(tiro.coordenada)));
  const outrasPosicoes = coordenadasDe(embarcacao).filter(
    (celula) => chaveCoordenada(celula) !== chave,
  );
  const destruida = outrasPosicoes.every((celula) => atingidas.has(chaveCoordenada(celula)));

  return destruida
    ? { coordenada: { ...coordenada }, resultado: 'destruido', tipo: embarcacao.tipo }
    : { coordenada: { ...coordenada }, resultado: 'acerto' };
}

/** Tipos do lado defensor cujas embarcações perderam todas as posições. */
export function tiposDestruidos(lado: LadoDoCombate): TipoEmbarcacao[] {
  const atingidas = new Set(lado.tirosRecebidos.map((tiro) => chaveCoordenada(tiro.coordenada)));
  return lado.tabuleiro.embarcacoes
    .filter((embarcacao) =>
      coordenadasDe(embarcacao).every((celula) => atingidas.has(chaveCoordenada(celula))),
    )
    .map((embarcacao) => embarcacao.tipo);
}

/** Indica se todas as embarcações do lado defensor perderam todas as suas posições. */
export function frotaDestruida(lado: LadoDoCombate): boolean {
  return tiposDestruidos(lado).length === lado.tabuleiro.embarcacoes.length;
}
