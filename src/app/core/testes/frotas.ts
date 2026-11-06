import type { Embarcacao } from '../frota';
import type { Tabuleiro } from '../tabuleiro';

/**
 * Frotas completas, válidas e determinísticas para testes de domínio. Cada frota ocupa linhas
 * distintas, então nunca há sobreposição interna, e nenhum navio ultrapassa os limites.
 */
const EMBARCACOES_DO_JOGADOR: readonly Embarcacao[] = [
  { tipo: 'porta-avioes', linha: 1, coluna: 0, orientacao: 'horizontal' }, // B1-B5
  { tipo: 'encouracado', linha: 3, coluna: 5, orientacao: 'horizontal' }, // D6-D9
  { tipo: 'cruzador', linha: 5, coluna: 0, orientacao: 'horizontal' }, // F1-F3
  { tipo: 'submarino', linha: 7, coluna: 5, orientacao: 'horizontal' }, // H6-H8
  { tipo: 'destroyer', linha: 9, coluna: 0, orientacao: 'horizontal' }, // J1-J2
];

const EMBARCACOES_DO_COMPUTADOR: readonly Embarcacao[] = [
  { tipo: 'porta-avioes', linha: 0, coluna: 5, orientacao: 'horizontal' }, // A6-A10
  { tipo: 'encouracado', linha: 2, coluna: 0, orientacao: 'horizontal' }, // C1-C4
  { tipo: 'cruzador', linha: 4, coluna: 5, orientacao: 'horizontal' }, // E6-E8
  { tipo: 'submarino', linha: 6, coluna: 0, orientacao: 'horizontal' }, // G1-G3
  { tipo: 'destroyer', linha: 8, coluna: 5, orientacao: 'horizontal' }, // I6-I7
];

function copiar(embarcacoes: readonly Embarcacao[]): Tabuleiro {
  return { embarcacoes: embarcacoes.map((embarcacao) => ({ ...embarcacao })) };
}

/** Frota completa e válida do jogador, em cópia nova a cada chamada. */
export function frotaDoJogador(): Tabuleiro {
  return copiar(EMBARCACOES_DO_JOGADOR);
}

/** Frota completa e válida do computador, em cópia nova a cada chamada. */
export function frotaDoComputador(): Tabuleiro {
  return copiar(EMBARCACOES_DO_COMPUTADOR);
}
