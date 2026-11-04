import { Component, inject, signal } from '@angular/core';
import { LucideAnchor } from '@lucide/angular';
import { Apresentacao } from './telas/apresentacao/apresentacao';
import { Batalha } from './telas/batalha/batalha';
import { Preparacao } from './telas/preparacao/preparacao';
import { PartidaStore } from './state/partida-store';

@Component({
  imports: [LucideAnchor, Apresentacao, Preparacao, Batalha],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly titulo = signal('Batalha Naval');

  protected readonly store = inject(PartidaStore);
}
