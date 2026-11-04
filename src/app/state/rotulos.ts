import { TipoEmbarcacao } from '../core/frota';
import { MotivoInvalido } from '../core/posicionamento';

/** Rótulos dos tipos de embarcação exibidos ao jogador. */
export const ROTULOS_DE_TIPO: Record<TipoEmbarcacao, string> = {
  'porta-avioes': 'Porta-aviões',
  encouracado: 'Encouraçado',
  cruzador: 'Cruzador',
  submarino: 'Submarino',
  destroyer: 'Destroyer',
};

/** Rótulos dos motivos de rejeição de posicionamento, sempre em texto acessível. */
export const ROTULOS_DE_MOTIVO: Record<MotivoInvalido, string> = {
  'fora-do-tabuleiro': 'O posicionamento está fora do tabuleiro.',
  sobreposicao: 'O posicionamento sobrepõe outra embarcação.',
};
