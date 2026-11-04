import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { criarAleatorioFixo } from '../../core/testes/aleatorio-fixo';
import { ALEATORIO } from '../../state/aleatorio';
import { PartidaStore } from '../../state/partida-store';
import { Apresentacao } from './apresentacao';

async function criarTela(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<Apresentacao>>;
  elemento: HTMLElement;
}> {
  await TestBed.configureTestingModule({
    imports: [Apresentacao],
    providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(42) }],
  });
  const fixture = TestBed.createComponent(Apresentacao);
  await fixture.whenStable();
  return { fixture, elemento: fixture.nativeElement as HTMLElement };
}

describe('Apresentacao', () => {
  it('renderiza o resumo das regras e o botão "Iniciar partida"', async () => {
    const { elemento } = await criarTela();

    const botao = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
      botao.textContent?.includes('Iniciar partida'),
    );

    expect(elemento.textContent).toContain('Como jogar');
    expect(botao).toBeDefined();
  });

  it('ao acionar o botão, leva à preparação com o tabuleiro do jogador vazio', async () => {
    const { fixture, elemento } = await criarTela();

    const botao = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
      botao.textContent?.includes('Iniciar partida'),
    );
    if (!botao) {
      throw new Error('Botão "Iniciar partida" não encontrado.');
    }

    botao.click();
    await fixture.whenStable();

    const store = TestBed.inject(PartidaStore);
    expect(store.fase()).toBe('preparacao');
    expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
  });
});
