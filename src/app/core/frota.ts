import { Coordenada } from './coordenada';

/** Tipos de embarcação da frota padrão; cada tipo aparece exatamente uma vez, então o tipo é a identidade. */
export type TipoEmbarcacao =
  'porta-avioes' | 'encouracado' | 'cruzador' | 'submarino' | 'destroyer';

/** Quantidade de posições ocupadas por cada tipo de embarcação. */
export const TAMANHOS: Record<TipoEmbarcacao, number> = {
  'porta-avioes': 5,
  encouracado: 4,
  cruzador: 3,
  submarino: 3,
  destroyer: 2,
};

/** Os cinco tipos que compõem a frota padrão, um de cada. */
export const TIPOS_DA_FROTA: readonly TipoEmbarcacao[] = [
  'porta-avioes',
  'encouracado',
  'cruzador',
  'submarino',
  'destroyer',
];

/** Orientação de uma embarcação posicionada; sempre em linha reta, nunca na diagonal. */
export type Orientacao = 'horizontal' | 'vertical';

/** Embarcação posicionada, definida pela âncora (célula de menor linha/coluna) e pela orientação. */
export interface Embarcacao {
  tipo: TipoEmbarcacao;
  linha: number;
  coluna: number;
  orientacao: Orientacao;
}

/** Deriva, na ordem, as coordenadas ocupadas por uma embarcação a partir da âncora e da orientação. */
export function coordenadasDe(embarcacao: Embarcacao): Coordenada[] {
  const tamanho = TAMANHOS[embarcacao.tipo];
  const deslocaLinha = embarcacao.orientacao === 'vertical';
  const deslocaColuna = embarcacao.orientacao === 'horizontal';
  return Array.from({ length: tamanho }, (_, indice) => ({
    linha: embarcacao.linha + (deslocaLinha ? indice : 0),
    coluna: embarcacao.coluna + (deslocaColuna ? indice : 0),
  }));
}
