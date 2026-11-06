import type { Tiro } from '../combate';
import { TAMANHO_TABULEIRO, type Coordenada } from '../coordenada';

/** Coordenadas do tabuleiro 10 × 10 na ordem linha/coluna, de A1 a J10. */
export function todasAsCoordenadas(): Coordenada[] {
  const coordenadas: Coordenada[] = [];
  for (let linha = 0; linha < TAMANHO_TABULEIRO; linha++) {
    for (let coluna = 0; coluna < TAMANHO_TABULEIRO; coluna++) {
      coordenadas.push({ linha, coluna });
    }
  }
  return coordenadas;
}

/** Histórico de ataques registrados como água nas coordenadas indicadas, cada um em cópia própria. */
export function tirosAgua(coordenadas: readonly Coordenada[]): Tiro[] {
  return coordenadas.map((coordenada) => ({
    coordenada: { ...coordenada },
    resultado: 'agua',
  }));
}
