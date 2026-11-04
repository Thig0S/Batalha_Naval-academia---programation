import { chaveCoordenada, dentroDoTabuleiro } from './coordenada';
import { Embarcacao, TipoEmbarcacao, TIPOS_DA_FROTA, coordenadasDe } from './frota';
import { Tabuleiro } from './tabuleiro';

/** Motivo pelo qual um posicionamento é rejeitado. */
export type MotivoInvalido = 'fora-do-tabuleiro' | 'sobreposicao';

/** Resultado explícito de posicionar: um novo tabuleiro ou o motivo da rejeição, sem exceção. */
export type ResultadoPosicionamento =
  { ok: true; tabuleiro: Tabuleiro } | { ok: false; motivo: MotivoInvalido };

/**
 * Valida o posicionamento de uma embarcação contra o tabuleiro, ignorando a embarcação do mesmo
 * tipo — assim o preview concorda com a ação de reposicionar sobre as próprias células.
 * Devolve `null` quando o posicionamento é válido.
 */
export function validarPosicionamento(
  embarcacao: Embarcacao,
  tabuleiro: Tabuleiro,
): MotivoInvalido | null {
  const celulas = coordenadasDe(embarcacao);
  if (celulas.some((celula) => !dentroDoTabuleiro(celula))) {
    return 'fora-do-tabuleiro';
  }

  const chavesOcupadas = new Set(
    tabuleiro.embarcacoes
      .filter((outra) => outra.tipo !== embarcacao.tipo)
      .flatMap(coordenadasDe)
      .map(chaveCoordenada),
  );
  if (celulas.some((celula) => chavesOcupadas.has(chaveCoordenada(celula)))) {
    return 'sobreposicao';
  }

  return null;
}

/**
 * Posiciona uma embarcação sem mutar o tabuleiro recebido. Como o tipo é a identidade, embarcações
 * do mesmo tipo são removidas antes da validação: posicionar também serve de reposicionamento.
 * Inválido devolve um resultado de falha e não altera nada.
 */
export function posicionar(embarcacao: Embarcacao, tabuleiro: Tabuleiro): ResultadoPosicionamento {
  const motivo = validarPosicionamento(embarcacao, tabuleiro);
  if (motivo !== null) {
    return { ok: false, motivo };
  }

  const semMesmoTipo = tabuleiro.embarcacoes.filter((outra) => outra.tipo !== embarcacao.tipo);
  return { ok: true, tabuleiro: { embarcacoes: [...semMesmoTipo, embarcacao] } };
}

/** Remove a embarcação do tipo indicado, liberando suas posições, sem mutar o tabuleiro recebido. */
export function removerEmbarcacao(tipo: TipoEmbarcacao, tabuleiro: Tabuleiro): Tabuleiro {
  return { embarcacoes: tabuleiro.embarcacoes.filter((outra) => outra.tipo !== tipo) };
}

/** Tipos da frota que ainda faltam posicionar, em ordem padrão. */
export function tiposPendentes(tabuleiro: Tabuleiro): TipoEmbarcacao[] {
  const posicionados = new Set(tabuleiro.embarcacoes.map((embarcacao) => embarcacao.tipo));
  return TIPOS_DA_FROTA.filter((tipo) => !posicionados.has(tipo));
}

/** Indica se as cinco embarcações já estão posicionadas sem sobreposição. */
export function frotaCompleta(tabuleiro: Tabuleiro): boolean {
  return tiposPendentes(tabuleiro).length === 0;
}
