import { MotivoAtaqueInvalido, Participante, ResultadoTiro } from '../core/combate';
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

/** Rótulos dos resultados de um ataque registrado, usados em célula e legenda. */
export const ROTULOS_DE_RESULTADO: Record<ResultadoTiro, string> = {
  agua: 'Água',
  acerto: 'Acerto',
  destruido: 'Embarcação destruída',
};

/** Rótulos dos motivos de rejeição de ataque, sempre em texto acessível. */
export const ROTULOS_DE_MOTIVO_ATAQUE: Record<MotivoAtaqueInvalido, string> = {
  'combate-encerrado': 'A partida já terminou e nenhum ataque é aceito.',
  'turno-incorreto': 'Ainda não é a sua vez de atacar.',
  'coordenada-invalida': 'A coordenada do ataque é inválida.',
  'coordenada-ja-atacada': 'Esta coordenada já foi atacada.',
};

/** Rótulos do vencedor, usados como situação final da partida. */
export const ROTULOS_DE_VENCEDOR: Record<Participante, string> = {
  jogador: 'Vitória',
  computador: 'Derrota',
};
