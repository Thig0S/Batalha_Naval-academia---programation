import { Component, computed, effect, inject, signal } from '@angular/core';
import {
  LucideBomb,
  LucideCrosshair,
  LucideRotateCcw,
  LucideTarget,
  LucideWaves,
} from '@lucide/angular';
import { ModalFimDeJogo } from '../../componentes/modal-fim-de-jogo/modal-fim-de-jogo';
import { Tabuleiro } from '../../componentes/tabuleiro/tabuleiro';
import { Coordenada } from '../../core/coordenada';
import { ResultadoTiro } from '../../core/combate';
import { PartidaStore } from '../../state/partida-store';
import {
  ROTULOS_DE_MOTIVO_ATAQUE,
  ROTULOS_DE_RESULTADO,
  ROTULOS_DE_TIPO,
  ROTULOS_DE_VENCEDOR,
} from '../../state/rotulos';

/** Item da legenda de resultados, com o rótulo textual repetido em texto. */
interface ItemDeLegenda {
  readonly resultado: ResultadoTiro;
  readonly rotulo: string;
}

/**
 * Tela de batalha: indicador de turno e situação, aviso em região viva, os dois tabuleiros
 * ligados à store — o do jogador com os ataques recebidos e o adversário aceitando ataques
 * só no turno do jogador —, legenda dos resultados e o encerramento com o pop-up modal e a
 * barra de situação final que mantém as opções de reinício sempre à mão.
 */
@Component({
  selector: 'app-batalha',
  imports: [
    Tabuleiro,
    ModalFimDeJogo,
    LucideWaves,
    LucideCrosshair,
    LucideBomb,
    LucideRotateCcw,
    LucideTarget,
  ],
  templateUrl: './batalha.html',
})
export class Batalha {
  protected readonly store = inject(PartidaStore);

  /** Motivo do último ataque rejeitado ou anúncio da embarcação destruída. */
  protected readonly aviso = signal<string | null>(null);

  /** Indica se o jogador dispensou o pop-up de fim de jogo da partida atual. */
  protected readonly popupFechado = signal(false);

  /** O pop-up fica visível enquanto há vencedor e o jogador não o dispensou. */
  protected readonly popupVisivel = computed(
    () => this.store.vencedor() !== null && !this.popupFechado(),
  );

  constructor() {
    // Um novo combate (vencedor voltando a `null`) recoloca o pop-up no próximo fim de jogo.
    effect(() => {
      if (this.store.vencedor() === null) {
        this.popupFechado.set(false);
      }
    });
  }

  /** Legenda dos três resultados, sempre acompanhada de ícone e texto. */
  protected readonly legenda: readonly ItemDeLegenda[] = [
    { resultado: 'agua', rotulo: ROTULOS_DE_RESULTADO.agua },
    { resultado: 'acerto', rotulo: ROTULOS_DE_RESULTADO.acerto },
    { resultado: 'destruido', rotulo: ROTULOS_DE_RESULTADO.destruido },
  ];

  /** Embarcações do jogador, lidas do combate durante a batalha. */
  protected readonly embarcacoesDoJogador = computed(
    () => this.store.estadoCombate()?.jogador.tabuleiro.embarcacoes ?? [],
  );

  /** Rótulo de quem joga agora; a partida encerrada não tem turno. */
  protected readonly rotuloDoTurno = computed(() => {
    if (this.store.vencedor() !== null) {
      return 'Partida encerrada';
    }
    return this.store.turno() === 'jogador' ? 'Você' : 'Computador';
  });

  /** Situação da partida: em andamento, vitória ou derrota do jogador. */
  protected readonly rotuloDaSituacao = computed(() => {
    const vencedor = this.store.vencedor();
    return vencedor === null ? 'Em andamento' : ROTULOS_DE_VENCEDOR[vencedor];
  });

  /** O tabuleiro adversário só aceita ataques no turno do jogador e antes do encerramento. */
  protected readonly adversarioInterativo = computed(
    () => this.store.combateAtivo() && this.store.turno() === 'jogador',
  );

  /** Espera pelo contra-ataque: a região viva avisa em texto enquanto o computador joga. */
  protected readonly aguardandoComputador = computed(
    () => this.store.combateAtivo() && this.store.turno() === 'computador',
  );

  /**
   * Clique no tabuleiro adversário: um ataque válido registra o tiro (a store agenda a
   * retaliação) e uma rejeição apenas mostra o motivo, sem consumir o turno. Uma destruição
   * é anunciada em texto com o tipo atingido e a embarcação aparece completa no mapa.
   */
  protected aoClicarNoAdversario(celula: Coordenada): void {
    const resultado = this.store.atacarJogador(celula);
    if (!resultado.ok) {
      this.aviso.set(ROTULOS_DE_MOTIVO_ATAQUE[resultado.motivo]);
      return;
    }

    const tiro = resultado.tiro;
    this.aviso.set(
      tiro.resultado === 'destruido' && tiro.tipo !== undefined
        ? `Embarcação destruída: ${ROTULOS_DE_TIPO[tiro.tipo]}`
        : null,
    );
  }

  /** Volta à preparação com o tabuleiro vazio, limpando o aviso da região viva. */
  protected prepararNovaFrota(): void {
    this.aviso.set(null);
    this.store.novaPartida();
  }

  /** Começa nova batalha com a frota do jogador preservada, limpando aviso e pop-up. */
  protected jogarNovamente(): void {
    this.aviso.set(null);
    this.popupFechado.set(false);
    this.store.jogarNovamente();
  }

  /** Dispensa o pop-up para inspecionar o tabuleiro; a barra mantém as opções de reinício. */
  protected fecharPopup(): void {
    this.popupFechado.set(true);
  }
}
