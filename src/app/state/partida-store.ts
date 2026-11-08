import { Injectable, computed, inject, signal } from '@angular/core';
import { Embarcacao, TipoEmbarcacao } from '../core/frota';
import { gerarFrotaAleatoria } from '../core/frota-aleatoria';
import {
  ResultadoPosicionamento,
  removerEmbarcacao,
  posicionar as posicionarNoTabuleiro,
  tiposPendentes as tiposPendentesNoTabuleiro,
  frotaCompleta as frotaCompletaNoTabuleiro,
} from '../core/posicionamento';
import { TABULEIRO_VAZIO, Tabuleiro } from '../core/tabuleiro';
import {
  EstadoCombate,
  LadoDoCombate,
  Participante,
  ResultadoAtaque,
  atacar,
  criarCombate,
} from '../core/combate';
import { tiposDestruidos } from '../core/ataques';
import { sortearAlvo } from '../core/ataque-aleatorio';
import { Coordenada } from '../core/coordenada';
import { ALEATORIO } from './aleatorio';

/** Atraso, em milissegundos, entre o ataque do jogador e a retaliação do computador. */
export const ATRASO_COMPUTADOR_MS = 1200;

/** Fases da partida, na ordem do fluxo do jogo. */
export type Fase = 'apresentacao' | 'preparacao' | 'batalha';

/**
 * Fonte única de verdade da partida: guarda a fase, os dois tabuleiros e o estado do combate
 * como signals, delegando toda regra de posicionamento e de combate ao domínio em
 * `src/app/core/`. A tela lê apenas os valores derivados desta store.
 */
@Injectable({ providedIn: 'root' })
export class PartidaStore {
  private readonly aleatorio = inject(ALEATORIO);

  private readonly _fase = signal<Fase>('apresentacao');
  private readonly _tabuleiroJogador = signal<Tabuleiro>(TABULEIRO_VAZIO);
  private readonly _tabuleiroComputador = signal<Tabuleiro>(TABULEIRO_VAZIO);
  private readonly _estadoCombate = signal<EstadoCombate | null>(null);

  /** Único timer do ataque automático do computador; `null` quando não há agendamento. */
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Fase atual da partida, somente leitura. */
  readonly fase = this._fase.asReadonly();

  /** Tabuleiro do jogador, somente leitura. */
  readonly tabuleiroJogador = this._tabuleiroJogador.asReadonly();

  /** Tabuleiro do computador, somente leitura; nenhuma tela o lê durante a batalha. */
  readonly tabuleiroComputador = this._tabuleiroComputador.asReadonly();

  /** Estado do combate durante a batalha; `null` fora dela. */
  readonly estadoCombate = this._estadoCombate.asReadonly();

  /** Tipos que o jogador ainda precisa posicionar, na ordem padrão da frota. */
  readonly tiposPendentes = computed(() => tiposPendentesNoTabuleiro(this._tabuleiroJogador()));

  /** Indica se as cinco embarcações do jogador já estão posicionadas sem sobreposição. */
  readonly frotaCompleta = computed(() => frotaCompletaNoTabuleiro(this._tabuleiroJogador()));

  /** De quem é o turno; `null` sem combate ou depois que a partida encerra. */
  readonly turno = computed<Participante | null>(() => this._estadoCombate()?.turno ?? null);

  /** Vencedor da partida; `null` enquanto não houver um. */
  readonly vencedor = computed<Participante | null>(() => this._estadoCombate()?.vencedor ?? null);

  /** Ataques recebidos pelo jogador, na ordem em que aconteceram. */
  readonly tirosRecebidosPeloJogador = computed(
    () => this._estadoCombate()?.jogador.tirosRecebidos ?? [],
  );

  /** Ataques recebidos pelo computador, na ordem em que aconteceram. */
  readonly tirosRecebidosPeloComputador = computed(
    () => this._estadoCombate()?.computador.tirosRecebidos ?? [],
  );

  /** Embarcações do computador já destruídas, sem revelar posições restantes. */
  readonly tiposDestruidosDoComputador = computed(() => {
    const estado = this._estadoCombate();
    return estado === null ? [] : tiposDestruidos(estado.computador);
  });

  /** Embarcações do jogador já destruídas. */
  readonly tiposDestruidosDoJogador = computed(() => {
    const estado = this._estadoCombate();
    return estado === null ? [] : tiposDestruidos(estado.jogador);
  });

  /** Embarcações do computador destruídas por inteiro, para exibir a embarcação completa no mapa. */
  readonly embarcacoesDestruidasDoComputador = computed(() => {
    const estado = this._estadoCombate();
    return estado === null ? [] : this.destruidasDo(estado.computador);
  });

  /** Embarcações do jogador destruídas por inteiro, exibidas completas no tabuleiro próprio. */
  readonly embarcacoesDestruidasDoJogador = computed(() => {
    const estado = this._estadoCombate();
    return estado === null ? [] : this.destruidasDo(estado.jogador);
  });

  /** Indica se há combate em andamento: criado e ainda sem vencedor. */
  readonly combateAtivo = computed(() => {
    const estado = this._estadoCombate();
    return estado !== null && estado.vencedor === null;
  });

  /** Leva à preparação: zera o tabuleiro do jogador e gera a frota oculta do computador. */
  iniciarPartida(): void {
    this._tabuleiroJogador.set(TABULEIRO_VAZIO);
    this._tabuleiroComputador.set(gerarFrotaAleatoria(this.aleatorio));
    this._fase.set('preparacao');
  }

  /**
   * Posiciona (ou reposiciona, pois o domínio troca a embarcação do mesmo tipo) uma embarcação
   * no tabuleiro do jogador. Um posicionamento inválido devolve o motivo e não altera nada.
   */
  posicionar(embarcacao: Embarcacao): ResultadoPosicionamento {
    const resultado = posicionarNoTabuleiro(embarcacao, this._tabuleiroJogador());
    if (resultado.ok) {
      this._tabuleiroJogador.set(resultado.tabuleiro);
    }
    return resultado;
  }

  /** Remove a embarcação do tipo indicado, liberando suas células. */
  remover(tipo: TipoEmbarcacao): void {
    this._tabuleiroJogador.set(removerEmbarcacao(tipo, this._tabuleiroJogador()));
  }

  /**
   * Leva à batalha criando o combate com as duas frotas posicionadas. Uma frota incompleta
   * ou inválida falha sem trocar de fase nem criar combate; o combate começa no turno do
   * jogador, sem ataques e sem vencedor.
   */
  iniciarBatalha(): boolean {
    const resultado = criarCombate(this._tabuleiroJogador(), this._tabuleiroComputador());
    if (!resultado.ok) {
      return false;
    }
    this.cancelarAtaqueAgendado();
    this._estadoCombate.set(resultado.combate);
    this._fase.set('batalha');
    return true;
  }

  /**
   * Registra um ataque do jogador contra o tabuleiro do computador, delegando ao domínio.
   * Um ataque válido devolve o tiro e passa a vez ao computador (agendado com atraso), a
   * menos que a frota adversária tenha sido destruída. Uma rejeição — inclusive sem combate —
   * devolve o motivo sem alterar turno nem histórico.
   */
  atacarJogador(coordenada: Coordenada): ResultadoAtaque {
    const estado = this._estadoCombate();
    if (estado === null) {
      return { ok: false, motivo: 'combate-encerrado' };
    }

    const resultado = atacar(estado, 'jogador', coordenada);
    if (!resultado.ok) {
      return resultado;
    }

    this._estadoCombate.set(resultado.estado);
    if (resultado.estado.vencedor === null) {
      this.agendarAtaqueDoComputador();
    }
    return resultado;
  }

  /**
   * Faz o computador atacar uma coordenada ainda não atacada por ele, sorteada com o gerador
   * injetado. Nada acontece sem combate, fora do turno do computador ou depois do encerramento,
   * tornando inofensivo um timer que sobreviva a uma reinicialização.
   */
  atacarComputador(): void {
    const estado = this._estadoCombate();
    if (estado === null || estado.vencedor !== null || estado.turno !== 'computador') {
      return;
    }

    const alvo = sortearAlvo(estado.jogador.tirosRecebidos, this.aleatorio);
    if (alvo === null) {
      return;
    }

    const resultado = atacar(estado, 'computador', alvo);
    if (resultado.ok) {
      this._estadoCombate.set(resultado.estado);
    }
  }

  /**
   * Limpa timer e combate e reinicia a partida pelo fluxo usual: preparação, tabuleiro do
   * jogador vazio e nova frota do computador.
   */
  novaPartida(): void {
    this.cancelarAtaqueAgendado();
    this._estadoCombate.set(null);
    this.iniciarPartida();
  }

  /**
   * Reinicia a batalha mantendo a frota do jogador: cancela o timer, gera uma nova frota
   * do computador e cria um combate novo, que começa no turno do jogador, sem tiros e sem
   * vencedor, permanecendo na fase `batalha`. Se o combate não puder ser criado (frota do
   * jogador inválida), devolve `false` sem alterar o estado.
   */
  jogarNovamente(): boolean {
    this.cancelarAtaqueAgendado();
    const novaFrota = gerarFrotaAleatoria(this.aleatorio);
    const resultado = criarCombate(this._tabuleiroJogador(), novaFrota);
    if (!resultado.ok) {
      return false;
    }
    this._tabuleiroComputador.set(novaFrota);
    this._estadoCombate.set(resultado.combate);
    this._fase.set('batalha');
    return true;
  }

  /**
   * Embarcações do lado defensor que perderam todas as posições, devolvidas como objetos
   * completos para a apresentação mostrar a embarcação destruída no mapa. Reaproveita
   * `tiposDestruidos` do domínio; nenhuma regra de combate é duplicada ou alterada.
   */
  private destruidasDo(lado: LadoDoCombate): Embarcacao[] {
    const destruidas = new Set(tiposDestruidos(lado));
    return lado.tabuleiro.embarcacoes.filter((embarcacao) => destruidas.has(embarcacao.tipo));
  }

  /** Agenda o ataque do computador com atraso, substituindo qualquer agendamento anterior. */
  private agendarAtaqueDoComputador(): void {
    this.cancelarAtaqueAgendado();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.atacarComputador();
    }, ATRASO_COMPUTADOR_MS);
  }

  /** Cancela o ataque do computador pendente, se houver. */
  private cancelarAtaqueAgendado(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
