/** Número de linhas e de colunas do tabuleiro (10 × 10). */
export const TAMANHO_TABULEIRO = 10;

/** Letras que identificam as linhas do tabuleiro, da primeira à última. */
const LETRAS_DAS_LINHAS = 'ABCDEFGHIJ' as const;

/**
 * Posição interna do tabuleiro, com linha e coluna numéricas.
 * A linha 0 corresponde a `A` e a coluna 0 corresponde à coluna `1`.
 */
export interface Coordenada {
  linha: number;
  coluna: number;
}

/** Converte uma coordenada interna para o rótulo exibido ao jogador, como `A1` ou `J10`. */
export function rotuloCoordenada(coordenada: Coordenada): string {
  return `${LETRAS_DAS_LINHAS[coordenada.linha]}${coordenada.coluna + 1}`;
}

/** Converte um rótulo como `C7` para a coordenada interna, ou `null` quando o rótulo não é válido. */
export function coordenadaDoRotulo(rotulo: string): Coordenada | null {
  const correspondencia = /^([A-J])([1-9]|10)$/.exec(rotulo.trim().toUpperCase());
  if (correspondencia === null) {
    return null;
  }
  const coordenada: Coordenada = {
    linha: LETRAS_DAS_LINHAS.indexOf(correspondencia[1] as (typeof LETRAS_DAS_LINHAS)[number]),
    coluna: Number(correspondencia[2]) - 1,
  };
  return dentroDoTabuleiro(coordenada) ? coordenada : null;
}

/** Texto estável que identifica unicamente uma coordenada, para uso em conjuntos e comparações. */
export function chaveCoordenada(coordenada: Coordenada): string {
  return `${coordenada.linha}:${coordenada.coluna}`;
}

/** Indica se a coordenada está dentro dos limites do tabuleiro 10 × 10. */
export function dentroDoTabuleiro(coordenada: Coordenada): boolean {
  return (
    coordenada.linha >= 0 &&
    coordenada.linha < TAMANHO_TABULEIRO &&
    coordenada.coluna >= 0 &&
    coordenada.coluna < TAMANHO_TABULEIRO
  );
}
