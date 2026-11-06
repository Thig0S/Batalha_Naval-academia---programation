import { chaveCoordenada, dentroDoTabuleiro, type Coordenada } from './coordenada';
import { TIPOS_DA_FROTA, coordenadasDe, type TipoEmbarcacao } from './frota';
import { frotaDestruida, resolverTiro } from './ataques';
import { validarPosicionamento } from './posicionamento';
import type { Tabuleiro } from './tabuleiro';

/** Quem participa da partida: o jogador humano ou o computador. */
export type Participante = 'jogador' | 'computador';

/** Resultado histórico de um ataque já registrado no tabuleiro que o recebeu. */
export type ResultadoTiro = 'agua' | 'acerto' | 'destruido';

/**
 * Um ataque registrado no tabuleiro que o recebeu. O histórico é público apenas como
 * resultado: nunca carrega a frota nem as posições restantes da embarcação atingida, e o
 * `tipo` aparece somente quando o ataque destruiu a embarcação inteira.
 */
export interface Tiro {
  readonly coordenada: Coordenada;
  readonly resultado: ResultadoTiro;
  /** Presente somente quando `resultado` é `destruido`. */
  readonly tipo?: TipoEmbarcacao;
}

/**
 * Um lado do combate: o tabuleiro defensor e os ataques que ele recebeu, na ordem em que
 * aconteceram. Quem ataca lê o `tirosRecebidos` adversário para saber o que já foi escolhido.
 */
export interface LadoDoCombate {
  readonly tabuleiro: Tabuleiro;
  readonly tirosRecebidos: readonly Tiro[];
}

/** Combate em andamento: há turno ativo e ainda não há vencedor. */
export interface CombateEmAndamento {
  readonly jogador: LadoDoCombate;
  readonly computador: LadoDoCombate;
  readonly turno: Participante;
  readonly vencedor: null;
}

/** Combate encerrado: o vencedor está definido e não há turno ativo. */
export interface CombateEncerrado {
  readonly jogador: LadoDoCombate;
  readonly computador: LadoDoCombate;
  readonly turno: null;
  readonly vencedor: Participante;
}

/** Estado do combate; a união impede combinações incoerentes de turno e vencedor. */
export type EstadoCombate = CombateEmAndamento | CombateEncerrado;

/** Combate criado com as duas frotas validadas e sem nenhum ataque. */
export interface CriacaoValida {
  readonly ok: true;
  readonly combate: EstadoCombate;
}

/** Falha na criação, apontando qual das duas frotas não passou na validação. */
export interface CriacaoInvalida {
  readonly ok: false;
  readonly motivo: 'frota-invalida';
  readonly participante: Participante;
}

export type ResultadoCriacao = CriacaoValida | CriacaoInvalida;

/** Ataque aceito: o próximo estado do combate e o tiro registrado no tabuleiro adversário. */
export interface AtaqueValido {
  readonly ok: true;
  readonly estado: EstadoCombate;
  readonly tiro: Tiro;
}

/**
 * Motivo pelo qual um ataque é rejeitado, nesta ordem de verificação: combate já encerrado,
 * participante fora da vez, coordenada inválida e coordenada já atacada pelo mesmo
 * participante. Nenhuma rejeição consome o turno nem altera o estado.
 */
export type MotivoAtaqueInvalido =
  'combate-encerrado' | 'turno-incorreto' | 'coordenada-invalida' | 'coordenada-ja-atacada';

export interface AtaqueInvalido {
  readonly ok: false;
  readonly motivo: MotivoAtaqueInvalido;
}

export type ResultadoAtaque = AtaqueValido | AtaqueInvalido;

/**
 * Verifica se uma frota é completa e válida para o combate: os cinco tipos conhecidos, um de
 * cada, com âncora inteira, orientação válida, dentro do tabuleiro e sem sobreposição.
 */
function frotaValida(tabuleiro: Tabuleiro): boolean {
  const tipos = tabuleiro.embarcacoes.map((embarcacao) => embarcacao.tipo);
  const tiposUnicos = new Set(tipos);
  if (
    tiposUnicos.size !== TIPOS_DA_FROTA.length ||
    !TIPOS_DA_FROTA.every((tipo) => tiposUnicos.has(tipo))
  ) {
    return false;
  }

  for (const embarcacao of tabuleiro.embarcacoes) {
    if (embarcacao.orientacao !== 'horizontal' && embarcacao.orientacao !== 'vertical') {
      return false;
    }
    if (!Number.isInteger(embarcacao.linha) || !Number.isInteger(embarcacao.coluna)) {
      return false;
    }
    if (coordenadasDe(embarcacao).some((celula) => !dentroDoTabuleiro(celula))) {
      return false;
    }
    if (validarPosicionamento(embarcacao, tabuleiro) !== null) {
      return false;
    }
  }
  return true;
}

/** Copia as embarcações para que edições posteriores na entrada não afetem o combate. */
function copiarTabuleiro(tabuleiro: Tabuleiro): Tabuleiro {
  return { embarcacoes: tabuleiro.embarcacoes.map((embarcacao) => ({ ...embarcacao })) };
}

/**
 * Cria um combate com as duas frotas validadas: históricos vazios, turno inicial do jogador e
 * nenhum vencedor. Falha sem alterar as entradas quando uma frota é incompleta ou inválida.
 */
export function criarCombate(
  tabuleiroJogador: Tabuleiro,
  tabuleiroComputador: Tabuleiro,
): ResultadoCriacao {
  if (!frotaValida(tabuleiroJogador)) {
    return { ok: false, motivo: 'frota-invalida', participante: 'jogador' };
  }
  if (!frotaValida(tabuleiroComputador)) {
    return { ok: false, motivo: 'frota-invalida', participante: 'computador' };
  }

  return {
    ok: true,
    combate: {
      jogador: { tabuleiro: copiarTabuleiro(tabuleiroJogador), tirosRecebidos: [] },
      computador: { tabuleiro: copiarTabuleiro(tabuleiroComputador), tirosRecebidos: [] },
      turno: 'jogador',
      vencedor: null,
    },
  };
}

/** Indica se a coordenada de ataque tem índices inteiros e está dentro do tabuleiro. */
function coordenadaDeAtaqueValida(coordenada: Coordenada): boolean {
  return (
    Number.isInteger(coordenada.linha) &&
    Number.isInteger(coordenada.coluna) &&
    dentroDoTabuleiro(coordenada)
  );
}

/**
 * Registra um ataque do `participante` contra a coordenada do tabuleiro adversário.
 *
 * A validação acontece nesta ordem: combate encerrado, turno incorreto, coordenada inválida e
 * coordenada já atacada. Um ataque válido devolve um estado novo (nunca muta o recebido), com
 * o tiro acrescentado ao histórico do defensor; alterna o turno, exceto quando o ataque
 * destrói a frota adversária, caso em que o combate encerra imediatamente com o atacante
 * como vencedor.
 */
export function atacar(
  estado: EstadoCombate,
  participante: Participante,
  coordenada: Coordenada,
): ResultadoAtaque {
  if (estado.vencedor !== null) {
    return { ok: false, motivo: 'combate-encerrado' };
  }
  if (estado.turno !== participante) {
    return { ok: false, motivo: 'turno-incorreto' };
  }
  if (!coordenadaDeAtaqueValida(coordenada)) {
    return { ok: false, motivo: 'coordenada-invalida' };
  }

  const defensor: Participante = participante === 'jogador' ? 'computador' : 'jogador';
  const ladoDefensor = defensor === 'jogador' ? estado.jogador : estado.computador;
  const jaAtacada = ladoDefensor.tirosRecebidos.some(
    (tiro) => chaveCoordenada(tiro.coordenada) === chaveCoordenada(coordenada),
  );
  if (jaAtacada) {
    return { ok: false, motivo: 'coordenada-ja-atacada' };
  }

  const tiro = resolverTiro(coordenada, ladoDefensor);
  const ladoAtualizado: LadoDoCombate = {
    tabuleiro: ladoDefensor.tabuleiro,
    tirosRecebidos: [...ladoDefensor.tirosRecebidos, tiro],
  };
  const jogador = defensor === 'jogador' ? ladoAtualizado : estado.jogador;
  const computador = defensor === 'computador' ? ladoAtualizado : estado.computador;

  if (frotaDestruida(ladoAtualizado)) {
    return {
      ok: true,
      tiro,
      estado: { jogador, computador, turno: null, vencedor: participante },
    };
  }

  return {
    ok: true,
    tiro,
    estado: { jogador, computador, turno: defensor, vencedor: null },
  };
}
