import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Coordenada } from '../../core/coordenada';
import { Embarcacao } from '../../core/frota';
import { ModoTabuleiro, PrevisaoDePosicionamento, Tabuleiro } from './tabuleiro';

/** Encouraçado horizontal ocupando A1–A4, para verificar a revelação de ocupação. */
const ENCOURACADO: Embarcacao = {
  tipo: 'encouracado',
  linha: 0,
  coluna: 0,
  orientacao: 'horizontal',
};

/** Entradas do preview para o teste de destaque. */
const PREVISAO_VALIDA: PrevisaoDePosicionamento = {
  celulas: [
    { linha: 1, coluna: 1 },
    { linha: 1, coluna: 2 },
  ],
  valido: true,
};

async function renderizar(
  modo: ModoTabuleiro,
  opcoes: { embarcacoes?: readonly Embarcacao[]; previsao?: PrevisaoDePosicionamento | null } = {},
): Promise<ReturnType<typeof TestBed.createComponent<Tabuleiro>>> {
  await TestBed.configureTestingModule({ imports: [Tabuleiro] });
  const fixture = TestBed.createComponent(Tabuleiro);
  fixture.componentRef.setInput('modo', modo);
  if (opcoes.embarcacoes !== undefined) {
    fixture.componentRef.setInput('embarcacoes', opcoes.embarcacoes);
  }
  if (opcoes.previsao !== undefined) {
    fixture.componentRef.setInput('previsao', opcoes.previsao);
  }
  await fixture.whenStable();
  return fixture;
}

function botoes(
  fixture: ReturnType<typeof TestBed.createComponent<Tabuleiro>>,
): HTMLButtonElement[] {
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')];
}

describe('Tabuleiro', () => {
  it('renderiza 100 células clicáveis com as coordenadas corretas na ordem', async () => {
    const fixture = await renderizar('preparacao');
    const celulas = botoes(fixture);

    expect(celulas).toHaveLength(100);
    expect(celulas[0].getAttribute('aria-label')).toBe('A1');
    expect(celulas[55].getAttribute('aria-label')).toBe('F6');
    expect(celulas[99].getAttribute('aria-label')).toBe('J10');
    expect(celulas[0].disabled).toBe(false);
  });

  it('emite a coordenada clicada e o foco ganho e perdido', async () => {
    const fixture = await renderizar('preparacao');

    const clicadas: Coordenada[] = [];
    const focadas: (Coordenada | null)[] = [];
    fixture.componentInstance.celulaSelecionada.subscribe((coordenada) =>
      clicadas.push(coordenada),
    );
    fixture.componentInstance.celulaFocada.subscribe((coordenada) => focadas.push(coordenada));

    const celulas = botoes(fixture);
    celulas[26].click(); // C7: linha C e coluna 7
    celulas[26].dispatchEvent(new Event('focusin'));
    celulas[26].dispatchEvent(new Event('focusout'));

    expect(clicadas).toEqual([{ linha: 2, coluna: 6 }]);
    expect(focadas).toEqual([{ linha: 2, coluna: 6 }, null]);
  });

  it('nos modos que revelam, células ocupadas têm rótulo acessível com o tipo e ícone além da cor', async () => {
    const fixture = await renderizar('preparacao', { embarcacoes: [ENCOURACADO] });
    const elemento = fixture.nativeElement as HTMLElement;

    // A1..A4 ocupadas pelo encouraçado; A5 livre.
    const celulas = botoes(fixture);
    expect(celulas[0].getAttribute('aria-label')).toBe('A1, encouraçado');
    expect(celulas[3].getAttribute('aria-label')).toBe('A4, encouraçado');
    expect(celulas[4].getAttribute('aria-label')).toBe('A5');

    expect(elemento.querySelectorAll('button svg')).toHaveLength(4);
  });

  it('no modo adversario não revela embarcação alguma, mesmo recebendo embarcacoes', async () => {
    const fixture = await renderizar('adversario', { embarcacoes: [ENCOURACADO] });
    const elemento = fixture.nativeElement as HTMLElement;

    for (const celula of botoes(fixture)) {
      expect(celula.getAttribute('aria-label')).not.toContain('encouraçado');
    }
    expect(elemento.querySelectorAll('button svg')).toHaveLength(0);
  });

  it('no modo próprio as células ficam somente leitura', async () => {
    const fixture = await renderizar('proprio', { embarcacoes: [ENCOURACADO] });

    for (const celula of botoes(fixture)) {
      expect(celula.disabled).toBe(true);
    }
  });

  it('destaca as células do preview com a validade marcada em atributo acessível', async () => {
    const fixture = await renderizar('preparacao', { previsao: PREVISAO_VALIDA });

    const destacadas = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-previa="valido"]'),
    ];

    expect(destacadas.map((celula) => celula.getAttribute('aria-label'))).toEqual(['B2', 'B3']);
  });
});
