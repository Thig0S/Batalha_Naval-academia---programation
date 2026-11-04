import { Component, inject } from '@angular/core';
import { LucideShip } from '@lucide/angular';
import { PartidaStore } from '../../state/partida-store';

/** Tela inicial do jogo: resumo das regras e entrada para a preparação da frota. */
@Component({
  selector: 'app-apresentacao',
  imports: [LucideShip],
  templateUrl: './apresentacao.html',
})
export class Apresentacao {
  protected readonly store = inject(PartidaStore);
}
