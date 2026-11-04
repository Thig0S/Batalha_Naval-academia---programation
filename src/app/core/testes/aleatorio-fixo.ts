/**
 * Gerador de números aleatórios determinístico para testes, usando o PRNG mulberry32.
 * A mesma semente produz sempre a mesma sequência numérica no intervalo [0, 1).
 */
export function criarAleatorioFixo(semente: number): () => number {
  let estado = semente >>> 0;
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let misturado = estado;
    misturado = Math.imul(misturado ^ (misturado >>> 15), misturado | 1);
    misturado ^= misturado + Math.imul(misturado ^ (misturado >>> 7), misturado | 61);
    return ((misturado ^ (misturado >>> 14)) >>> 0) / 4294967296;
  };
}
