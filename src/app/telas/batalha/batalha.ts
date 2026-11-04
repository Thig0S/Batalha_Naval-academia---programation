import { Component, inject, computed } from '@angular/core';
import { Tabuleiro } from '../../componentes/tabuleiro/tabuleiro';
import { PartidaStore } from '../../state/partida-store';

/**
 * Tela de batalha nesta change: mostra os dois tabuleiros somente leitura.
 * O tabuleiro do jogador revela as embarcações; o do computador chega sem
 * nenhuma embarcação, pois nenhuma posição adversária é revelada.
 */
@Component({
  selector: 'app-batalha',
  imports: [Tabuleiro],
  templateUrl: './batalha.html',
})
export class Batalha {
  protected readonly store = inject(PartidaStore);

  protected readonly embarcacoesDoJogador = computed(
    () => this.store.tabuleiroJogador().embarcacoes,
  );
}
