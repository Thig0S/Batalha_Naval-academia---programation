import { Component, signal } from '@angular/core';
import { LucideAnchor } from '@lucide/angular';

@Component({
  imports: [LucideAnchor],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly titulo = signal('Batalha Naval');
}
