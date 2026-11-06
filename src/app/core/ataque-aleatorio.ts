import { TAMANHO_TABULEIRO, chaveCoordenada, type Coordenada } from './coordenada';
import type { Tiro } from './combate';

/**
 * As 100 coordenadas do tabuleiro na ordem linha/coluna, de A1 a J10, usadas como candidatas.
 * Os objetos são internos: `sortearAlvo` devolve sempre uma cópia.
 */
const CANDIDATAS: readonly Coordenada[] = (() => {
  const coordenadas: Coordenada[] = [];
  for (let linha = 0; linha < TAMANHO_TABULEIRO; linha++) {
    for (let coluna = 0; coluna < TAMANHO_TABULEIRO; coluna++) {
      coordenadas.push({ linha, coluna });
    }
  }
  return coordenadas;
})();

/**
 * Escolhe um alvo para o ataque do computador entre as coordenadas que ainda não foram
 * atacadas, sem consultar a frota nem o resultado dos ataques — o sorteio é puro, sem
 * estratégia.
 *
 * Passe o histórico `tirosRecebidos` do tabuleiro que o computador ataca (ou seja, os ataques
 * já feitos por ele). O gerador `aleatorio` segue o contrato `[0, 1)` dos demais usos do
 * projeto: é chamado exatamente uma vez quando há candidatos e nenhuma vez quando não há.
 * Devolve `null` quando todas as 100 coordenadas já constam no histórico.
 */
export function sortearAlvo(
  tirosRecebidos: readonly Tiro[],
  aleatorio: () => number,
): Coordenada | null {
  const atacadas = new Set(tirosRecebidos.map((tiro) => chaveCoordenada(tiro.coordenada)));
  const livres = CANDIDATAS.filter((coordenada) => !atacadas.has(chaveCoordenada(coordenada)));
  if (livres.length === 0) {
    return null;
  }
  const indice = Math.floor(aleatorio() * livres.length);
  return { ...livres[indice] };
}
