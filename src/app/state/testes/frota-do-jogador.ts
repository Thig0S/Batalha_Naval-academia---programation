import { Embarcacao, TipoEmbarcacao, TIPOS_DA_FROTA } from '../../core/frota';
import { PartidaStore } from '../partida-store';

/** Posições padrão da frota do jogador para os testes, uma embarcação por linha. */
export const POSICOES_DA_FROTA: Record<TipoEmbarcacao, Embarcacao> = {
  'porta-avioes': { tipo: 'porta-avioes', linha: 0, coluna: 0, orientacao: 'horizontal' },
  encouracado: { tipo: 'encouracado', linha: 1, coluna: 0, orientacao: 'horizontal' },
  cruzador: { tipo: 'cruzador', linha: 2, coluna: 0, orientacao: 'horizontal' },
  submarino: { tipo: 'submarino', linha: 3, coluna: 0, orientacao: 'horizontal' },
  destroyer: { tipo: 'destroyer', linha: 4, coluna: 0, orientacao: 'horizontal' },
};

/** Posiciona a frota completa do jogador na store, exceto os tipos omitidos. */
export function posicionarFrotaNaStore(
  store: PartidaStore,
  omitidos: readonly TipoEmbarcacao[] = [],
): void {
  for (const tipo of TIPOS_DA_FROTA) {
    if (!omitidos.includes(tipo)) {
      store.posicionar(POSICOES_DA_FROTA[tipo]);
    }
  }
}
