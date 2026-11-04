import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { ALEATORIO } from './state/aleatorio';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: ALEATORIO, useValue: Math.random }],
    }).compileComponents();
  });

  it('renderiza o título do jogo no cabeçalho', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('Batalha Naval');
  });

  it('renderiza a tela de apresentação como fase inicial', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('app-apresentacao')).not.toBeNull();
    expect(elemento.querySelector('main')?.textContent).toContain('Iniciar partida');
  });
});
