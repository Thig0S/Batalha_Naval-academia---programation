import { Embarcacao } from './frota';

/**
 * Estado do tabuleiro: apenas as embarcações posicionadas.
 * Os tiros entram na change de combate.
 */
export interface Tabuleiro {
  embarcacoes: Embarcacao[];
}

/** Tabuleiro de partida, sem nenhuma embarcação posicionada. */
export const TABULEIRO_VAZIO: Tabuleiro = { embarcacoes: [] };
