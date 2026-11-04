import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { criarAleatorioFixo } from '../../core/testes/aleatorio-fixo';
import { ALEATORIO } from '../../state/aleatorio';
import { PartidaStore } from '../../state/partida-store';
import { posicionarFrotaNaStore } from '../../state/testes/frota-do-jogador';
import { Batalha } from './batalha';

describe('Batalha', () => {
  it('mostra as cinco embarcações no tabuleiro do jogador e nada no do computador', async () => {
    await TestBed.configureTestingModule({
      imports: [Batalha],
      providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(7) }],
    });
    const fixture = TestBed.createComponent(Batalha);
    const store = TestBed.inject(PartidaStore);
    store.iniciarPartida();
    posicionarFrotaNaStore(store);
    store.iniciarBatalha();
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    const tabuleiros = elemento.querySelectorAll('app-tabuleiro');
    expect(tabuleiros).toHaveLength(2);

    const ocupadasDoProprio = [
      ...tabuleiros[0].querySelectorAll<HTMLButtonElement>('button'),
    ].filter((celula) => celula.getAttribute('aria-label')?.includes(', '));
    expect(ocupadasDoProprio).toHaveLength(17); // as cinco embarcações, 17 células
    expect(tabuleiros[0].querySelectorAll('button svg')).toHaveLength(17);

    const rotulosDoAdversario = [
      ...tabuleiros[1].querySelectorAll<HTMLButtonElement>('button'),
    ].map((celula) => celula.getAttribute('aria-label') ?? '');
    expect(rotulosDoAdversario.filter((rotulo) => rotulo.includes(', '))).toHaveLength(0);
    expect(tabuleiros[1].querySelectorAll('button svg')).toHaveLength(0);
  });
});
