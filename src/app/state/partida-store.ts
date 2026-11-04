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
import { ALEATORIO } from './aleatorio';

/** Fases da partida, na ordem do fluxo do jogo. */
export type Fase = 'apresentacao' | 'preparacao' | 'batalha';

/**
 * Fonte única de verdade da partida: guarda a fase e os dois tabuleiros como signals,
 * delegando toda a regra de posicionamento ao domínio em `src/app/core/`.
 * O tabuleiro do computador é gerado em `iniciarPartida` e permanece oculto nesta change.
 */
@Injectable({ providedIn: 'root' })
export class PartidaStore {
  private readonly aleatorio = inject(ALEATORIO);

  private readonly _fase = signal<Fase>('apresentacao');
  private readonly _tabuleiroJogador = signal<Tabuleiro>(TABULEIRO_VAZIO);
  private readonly _tabuleiroComputador = signal<Tabuleiro>(TABULEIRO_VAZIO);

  /** Fase atual da partida, somente leitura. */
  readonly fase = this._fase.asReadonly();

  /** Tabuleiro do jogador, somente leitura. */
  readonly tabuleiroJogador = this._tabuleiroJogador.asReadonly();

  /** Tabuleiro do computador, somente leitura; nenhuma tela o lê nesta change. */
  readonly tabuleiroComputador = this._tabuleiroComputador.asReadonly();

  /** Tipos que o jogador ainda precisa posicionar, na ordem padrão da frota. */
  readonly tiposPendentes = computed(() => tiposPendentesNoTabuleiro(this._tabuleiroJogador()));

  /** Indica se as cinco embarcações do jogador já estão posicionadas sem sobreposição. */
  readonly frotaCompleta = computed(() => frotaCompletaNoTabuleiro(this._tabuleiroJogador()));

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

  /** Leva à batalha apenas com a frota do jogador completa; devolve se transicionou de fase. */
  iniciarBatalha(): boolean {
    if (!this.frotaCompleta()) {
      return false;
    }
    this._fase.set('batalha');
    return true;
  }
}
