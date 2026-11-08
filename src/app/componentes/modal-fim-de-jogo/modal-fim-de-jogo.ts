import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { LucideRotateCcw, LucideSkull, LucideTarget, LucideTrophy, LucideX } from '@lucide/angular';
import { Participante } from '../../core/combate';

/**
 * Pop-up modal de encerramento da partida: anuncia o vencedor em texto dentro de um diálogo
 * acessível e emite os pedidos de reinício e de dispensa. Componente burro — toda a regra
 * de jogo fica na store e na tela que o exibe.
 */
@Component({
  selector: 'app-modal-fim-de-jogo',
  imports: [LucideTrophy, LucideSkull, LucideRotateCcw, LucideTarget, LucideX],
  templateUrl: './modal-fim-de-jogo.html',
})
export class ModalFimDeJogo {
  /** Vencedor da partida encerrada; `null` enquanto o pop-up não é exibido. */
  readonly vencedor = input<Participante | null>(null);

  /** Pedido de nova batalha mantendo a frota do jogador posicionada. */
  readonly jogarNovamente = output<void>();

  /** Pedido de voltar à preparação com o tabuleiro do jogador vazio. */
  readonly prepararNovaFrota = output<void>();

  /** Dispensa o pop-up sem encerrar a partida. */
  readonly fechar = output<void>();

  /** Título do diálogo: anuncia a vitória ou a derrota do jogador em texto. */
  protected readonly titulo = computed(() =>
    this.vencedor() === 'jogador' ? 'Você venceu a partida!' : 'O computador venceu a partida.',
  );

  private readonly painel = viewChild<ElementRef<HTMLDivElement>>('painel');

  constructor() {
    afterNextRender(() => {
      this.painel()?.nativeElement.focus();
    });
  }
}
