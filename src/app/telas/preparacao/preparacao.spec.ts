import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { criarAleatorioFixo } from '../../core/testes/aleatorio-fixo';
import { ALEATORIO } from '../../state/aleatorio';
import { PartidaStore } from '../../state/partida-store';
import { POSICOES_DA_FROTA, posicionarFrotaNaStore } from '../../state/testes/frota-do-jogador';
import { Preparacao } from './preparacao';

/** Fixture da tela com a store já em preparação. */
async function criarTela(): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<Preparacao>>;
  store: PartidaStore;
  elemento: HTMLElement;
}> {
  await TestBed.configureTestingModule({
    imports: [Preparacao],
    providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(7) }],
  });
  const fixture = TestBed.createComponent(Preparacao);
  const store = TestBed.inject(PartidaStore);
  store.iniciarPartida();
  await fixture.whenStable();
  return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
}

/** Localiza uma célula do tabuleiro pelo início do rótulo acessível (livre ou ocupada). */
function celulaPorRotulo(elemento: HTMLElement, rotulo: string): HTMLButtonElement {
  const celulas = [...elemento.querySelectorAll<HTMLButtonElement>('app-tabuleiro button')];
  const procurada = celulas.find(
    (celula) =>
      celula.getAttribute('aria-label') === rotulo ||
      celula.getAttribute('aria-label')?.startsWith(`${rotulo}, `),
  );
  if (!procurada) {
    throw new Error(`Célula ${rotulo} não encontrada.`);
  }
  return procurada;
}

/** Localiza um botão da tela pelo trecho de texto. */
function botaoPorTexto(elemento: HTMLElement, texto: string): HTMLButtonElement {
  const botao = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find((o) =>
    o.textContent?.includes(texto),
  );
  if (!botao) {
    throw new Error(`Botão "${texto}" não encontrado.`);
  }
  return botao;
}

/** Texto do único item da lista marcado como selecionado. */
function textoDoSelecionado(elemento: HTMLElement): string {
  const apertado = [
    ...elemento.querySelectorAll<HTMLButtonElement>('app-lista-de-frota button'),
  ].find((item) => item.getAttribute('aria-pressed') === 'true');
  return apertado?.textContent ?? '';
}

/** Rótulos acessíveis das células com o destaque indicado. */
function rotulosComDestaque(
  elemento: HTMLElement,
  destaque: 'valido' | 'invalido',
): (string | null)[] {
  return [...elemento.querySelectorAll(`[data-previa="${destaque}"]`)].map((celula) =>
    celula.getAttribute('aria-label'),
  );
}

describe('Preparacao', () => {
  it('permite selecionar e remover pelo tabuleiro depois de completar a frota', async () => {
    const { fixture, store, elemento } = await criarTela();
    for (const rotulo of ['A1', 'B1', 'C1', 'D1', 'E1']) {
      celulaPorRotulo(elemento, rotulo).click();
      await fixture.whenStable();
    }
    expect(textoDoSelecionado(elemento)).toBe('');
    expect(store.frotaCompleta()).toBe(true);
    celulaPorRotulo(elemento, 'C2').click();
    await fixture.whenStable();
    expect(textoDoSelecionado(elemento)).toContain('Cruzador');
    botaoPorTexto(elemento, 'Remover').click();
    await fixture.whenStable();
    expect(store.tiposPendentes()).toEqual(['cruzador']);
    expect(botaoPorTexto(elemento, 'Iniciar batalha').disabled).toBe(true);
  });

  it('clicar novamente no navio selecionado não muda sua âncora', async () => {
    const { fixture, store, elemento } = await criarTela();
    store.posicionar(POSICOES_DA_FROTA.cruzador);
    await fixture.whenStable();
    botaoPorTexto(elemento, 'Cruzador').click();
    await fixture.whenStable();
    const anterior = store.tabuleiroJogador();
    celulaPorRotulo(elemento, 'C2').click();
    await fixture.whenStable();
    expect(store.tabuleiroJogador()).toBe(anterior);
    expect(textoDoSelecionado(elemento)).toContain('Cruzador');
  });

  it('rejeita sobreposição no corpo da embarcação sem mudar tabuleiro ou seleção', async () => {
    const { fixture, store, elemento } = await criarTela();
    store.posicionar(POSICOES_DA_FROTA.cruzador);
    await fixture.whenStable();
    const anterior = store.tabuleiroJogador();
    celulaPorRotulo(elemento, 'C3').dispatchEvent(new Event('focusin'));
    await fixture.whenStable();
    botaoPorTexto(elemento, 'Vertical').click();
    await fixture.whenStable();
    celulaPorRotulo(elemento, 'B2').click();
    await fixture.whenStable();
    expect(store.tabuleiroJogador()).toBe(anterior);
    expect(textoDoSelecionado(elemento)).toContain('Porta-aviões');
    expect(elemento.querySelector('[aria-live]')?.textContent).toContain('sobrepõe');
  });

  it('começa com o primeiro tipo pendente selecionado e a orientação muda o preview', async () => {
    const { fixture, elemento } = await criarTela();

    expect(textoDoSelecionado(elemento)).toContain('Porta-aviões');

    botaoPorTexto(elemento, 'Cruzador').click();
    await fixture.whenStable();
    expect(textoDoSelecionado(elemento)).toContain('Cruzador');

    celulaPorRotulo(elemento, 'B2').dispatchEvent(new Event('focusin'));
    await fixture.whenStable();
    expect(rotulosComDestaque(elemento, 'valido')).toEqual(['B2', 'B3', 'B4']);

    botaoPorTexto(elemento, 'Vertical').click();
    await fixture.whenStable();
    expect(rotulosComDestaque(elemento, 'valido')).toEqual(['B2', 'C2', 'D2']);
  });

  it('marcando o preview inválido com o motivo em texto, não apenas cor', async () => {
    const { fixture, elemento } = await criarTela();

    celulaPorRotulo(elemento, 'A8').dispatchEvent(new Event('focusin'));
    await fixture.whenStable();

    expect(rotulosComDestaque(elemento, 'invalido')).toEqual(['A8', 'A9', 'A10']);
    expect(
      (elemento.querySelector('[aria-live="polite"]')?.textContent ?? '').includes(
        'fora do tabuleiro',
      ),
    ).toBe(true);
  });

  it('posiciona o cruzador pela âncora C7 e avança para o próximo pendente', async () => {
    const { fixture, store, elemento } = await criarTela();

    botaoPorTexto(elemento, 'Cruzador').click();
    await fixture.whenStable();
    celulaPorRotulo(elemento, 'C7').click();
    await fixture.whenStable();

    for (const rotulo of ['C7', 'C8', 'C9']) {
      expect(celulaPorRotulo(elemento, rotulo).getAttribute('aria-label')).toBe(
        `${rotulo}, cruzador`,
      );
    }
    expect(store.tiposPendentes()).not.toContain('cruzador');
    expect(textoDoSelecionado(elemento)).toContain('Porta-aviões');
    expect(store.fase()).toBe('preparacao');
  });

  it('rejeita o clique inválido mantendo o tabuleiro e a seleção, com o motivo em texto', async () => {
    const { fixture, store, elemento } = await criarTela();

    celulaPorRotulo(elemento, 'A8').click();
    await fixture.whenStable();

    expect((elemento.querySelector('[aria-live="polite"]')?.textContent ?? '').trim()).toContain(
      'fora do tabuleiro',
    );
    expect(store.tabuleiroJogador().embarcacoes).toHaveLength(0);
    expect(textoDoSelecionado(elemento)).toContain('Porta-aviões');
  });

  it('reposiciona o cruzador de B2 para a âncora H8', async () => {
    const { fixture, store, elemento } = await criarTela();

    store.posicionar({ tipo: 'cruzador', linha: 1, coluna: 1, orientacao: 'horizontal' });
    await fixture.whenStable();

    celulaPorRotulo(elemento, 'B2').click(); // seleciona a embarcação posicionada
    await fixture.whenStable();
    expect(textoDoSelecionado(elemento)).toContain('Cruzador');

    celulaPorRotulo(elemento, 'H8').click();
    await fixture.whenStable();

    expect(celulaPorRotulo(elemento, 'H8').getAttribute('aria-label')).toBe('H8, cruzador');
    for (const rotulo of ['B2', 'B3', 'B4']) {
      expect(celulaPorRotulo(elemento, rotulo).getAttribute('aria-label')).toBe(rotulo);
    }
    expect(store.tiposPendentes()).not.toContain('cruzador');
  });

  it('remove a embarcação posicionada, liberando as células', async () => {
    const { fixture, store, elemento } = await criarTela();

    store.posicionar(POSICOES_DA_FROTA.cruzador);
    await fixture.whenStable();

    celulaPorRotulo(elemento, 'C1').click(); // seleciona a embarcação posicionada
    await fixture.whenStable();
    botaoPorTexto(elemento, 'Remover').click();
    await fixture.whenStable();

    expect(store.tabuleiroJogador().embarcacoes).toHaveLength(0);
    for (const rotulo of ['C1', 'C2', 'C3']) {
      expect(celulaPorRotulo(elemento, rotulo).getAttribute('aria-label')).toBe(rotulo);
    }
    expect(botaoPorTexto(elemento, 'Cruzador').textContent).toContain('Pendente');
  });

  it('mantém "Iniciar batalha" bloqueado até a frota completar e então leva à batalha', async () => {
    const { fixture, store, elemento } = await criarTela();

    posicionarFrotaNaStore(store, ['destroyer']);
    await fixture.whenStable();
    expect(botaoPorTexto(elemento, 'Iniciar batalha').disabled).toBe(true);

    store.posicionar(POSICOES_DA_FROTA.destroyer);
    await fixture.whenStable();

    const iniciar = botaoPorTexto(elemento, 'Iniciar batalha');
    expect(iniciar.disabled).toBe(false);
    iniciar.click();
    await fixture.whenStable();
    expect(store.fase()).toBe('batalha');
  });
});
