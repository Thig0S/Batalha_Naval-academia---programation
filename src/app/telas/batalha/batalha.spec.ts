import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { Coordenada } from '../../core/coordenada';
import { coordenadasDe } from '../../core/frota';
import { criarAleatorioFixo } from '../../core/testes/aleatorio-fixo';
import { ALEATORIO } from '../../state/aleatorio';
import { ATRASO_COMPUTADOR_MS, PartidaStore } from '../../state/partida-store';
import { atacarValido, celulaLivreDoComputador } from '../../state/testes/ataques';
import { posicionarFrotaNaStore } from '../../state/testes/frota-do-jogador';
import { Batalha } from './batalha';

/** Semente em que o computador destrói toda a frota do jogador na 53ª rodada. */
const SEMENTE_DA_DERROTA = 15514;

/** Fixture da tela com a store já em batalha: frota do jogador completa e combate criado. */
async function criarTela(semente = 7): Promise<{
  fixture: ReturnType<typeof TestBed.createComponent<Batalha>>;
  store: PartidaStore;
  elemento: HTMLElement;
}> {
  await TestBed.configureTestingModule({
    imports: [Batalha],
    providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(semente) }],
  });
  const fixture = TestBed.createComponent(Batalha);
  const store = TestBed.inject(PartidaStore);
  store.iniciarPartida();
  posicionarFrotaNaStore(store);
  store.iniciarBatalha();
  await fixture.whenStable();
  return { fixture, store, elemento: fixture.nativeElement as HTMLElement };
}

/** Células do tabuleiro indicado: 0 para o próprio e 1 para o adversário. */
function celulasDo(elemento: HTMLElement, indice: number): HTMLButtonElement[] {
  const tabuleiro = elemento.querySelectorAll('app-tabuleiro')[indice];
  return [...tabuleiro.querySelectorAll<HTMLButtonElement>('button')];
}

/** Célula adversária correspondente à coordenada, na mesma ordem do tabuleiro. */
function celulaAdversaria(elemento: HTMLElement, coordenada: Coordenada): HTMLButtonElement {
  return celulasDo(elemento, 1)[coordenada.linha * 10 + coordenada.coluna];
}

function texto(elemento: HTMLElement): string {
  return elemento.textContent ?? '';
}

function aviso(elemento: HTMLElement): string {
  return elemento.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';
}

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

  it('renderiza os dois tabuleiros, a legenda dos resultados e o turno inicial do jogador', async () => {
    const { elemento } = await criarTela();

    expect(elemento.querySelectorAll('app-tabuleiro')).toHaveLength(2);
    expect(texto(elemento)).toContain('Turno: Você');
    expect(texto(elemento)).toContain('Situação: Em andamento');
    expect(texto(elemento)).toContain('Embarcações destruídas — do computador: 0/5');
    expect(texto(elemento)).toContain('Água');
    expect(texto(elemento)).toContain('Acerto');
    expect(texto(elemento)).toContain('Embarcação destruída');
    expect(elemento.querySelector('[aria-live="polite"]')).not.toBeNull();
    expect(texto(elemento)).not.toContain('Nova partida');
  });

  it('clique no tabuleiro adversário ataca e o clique repetido avisa sem consumir o turno', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      const alvo = celulaLivreDoComputador(store);
      const celula = celulaAdversaria(elemento, alvo);

      celula.click();
      fixture.detectChanges();

      expect(store.tirosRecebidosPeloComputador()).toHaveLength(1);
      expect(celula.getAttribute('aria-label')).toContain('água');
      expect(texto(elemento)).toContain('Turno: Computador');
      expect(aviso(elemento)).toBe('');

      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      fixture.detectChanges();
      expect(texto(elemento)).toContain('Turno: Você');

      celula.click();
      fixture.detectChanges();

      expect(store.tirosRecebidosPeloComputador()).toHaveLength(1);
      expect(store.turno()).toBe('jogador');
      expect(aviso(elemento)).toContain('já foi atacada');
      expect(celula.getAttribute('aria-label')).toContain('água');
    } finally {
      vi.useRealTimers();
    }
  });

  it('bloqueia o tabuleiro adversário enquanto o computador joga', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      const alvo = celulaLivreDoComputador(store);
      celulaAdversaria(elemento, alvo).click();
      fixture.detectChanges();

      expect(texto(elemento)).toContain('Turno: Computador');
      const adversarias = celulasDo(elemento, 1);
      expect(adversarias.every((celula) => celula.disabled)).toBe(true);

      const outro = celulaLivreDoComputador(store);
      celulaAdversaria(elemento, outro).click();
      fixture.detectChanges();

      expect(store.tirosRecebidosPeloComputador()).toHaveLength(1);
      expect(aviso(elemento)).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('anuncia a embarcação destruída com o tipo, marcando apenas as células atingidas', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      const destroyer = store
        .tabuleiroComputador()
        .embarcacoes.find((embarcacao) => embarcacao.tipo === 'destroyer');
      if (destroyer === undefined) {
        throw new Error('Destroyer não encontrada no tabuleiro do computador.');
      }
      const [primeira, segunda] = coordenadasDe(destroyer);

      celulaAdversaria(elemento, primeira).click();
      fixture.detectChanges();
      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      fixture.detectChanges();
      celulaAdversaria(elemento, segunda).click();
      fixture.detectChanges();

      expect(aviso(elemento)).toContain('Embarcação destruída: Destroyer');
      expect(texto(elemento)).toContain('do computador: 1/5');

      const marcadas = celulasDo(elemento, 1).filter((celula) =>
        celula.getAttribute('aria-label')?.includes(', '),
      );
      expect(marcadas).toHaveLength(2); // só as duas posições efetivamente atingidas
      for (const celula of marcadas) {
        expect(celula.getAttribute('aria-label')).not.toContain('destroyer');
      }
      expect(celulasDo(elemento, 1).filter((celula) => celula.querySelector('svg'))).toHaveLength(
        2,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('anuncia a vitória, bloqueia os dois tabuleiros e reinicia pela preparação', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      const alvos = store
        .tabuleiroComputador()
        .embarcacoes.flatMap(coordenadasDe)
        .map((coordenada) => ({ ...coordenada }));

      for (const alvo of alvos) {
        celulaAdversaria(elemento, alvo).click();
        fixture.detectChanges();
        if (store.vencedor() !== null) {
          break;
        }
        vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
        fixture.detectChanges();
      }
      expect(store.vencedor()).toBe('jogador');

      expect(texto(elemento)).toContain('Turno: Partida encerrada');
      expect(texto(elemento)).toContain('Situação: Vitória');
      expect(texto(elemento)).toContain('Você venceu a partida!');
      expect(celulasDo(elemento, 0).every((celula) => celula.disabled)).toBe(true);
      expect(celulasDo(elemento, 1).every((celula) => celula.disabled)).toBe(true);

      const reiniciar = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
        botao.textContent?.includes('Nova partida'),
      );
      if (reiniciar === undefined) {
        throw new Error('Botão "Nova partida" não encontrado.');
      }
      reiniciar.click();
      fixture.detectChanges();

      expect(store.fase()).toBe('preparacao');
      expect(store.estadoCombate()).toBeNull();
      expect(store.vencedor()).toBeNull();
      expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
      expect(store.tirosRecebidosPeloJogador()).toEqual([]);
      expect(store.tirosRecebidosPeloComputador()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('anuncia a derrota e não aceita mais ataques', async () => {
    const { fixture, store, elemento } = await criarTela(SEMENTE_DA_DERROTA);
    vi.useFakeTimers();
    try {
      for (let rodada = 0; rodada < 80 && store.vencedor() === null; rodada++) {
        atacarValido(store, celulaLivreDoComputador(store));
        if (store.vencedor() !== null) {
          break;
        }
        vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      }
      expect(store.vencedor()).toBe('computador');
      fixture.detectChanges();

      expect(texto(elemento)).toContain('Situação: Derrota');
      expect(texto(elemento)).toContain('O computador venceu a partida.');
      expect(celulasDo(elemento, 0).every((celula) => celula.disabled)).toBe(true);
      expect(celulasDo(elemento, 1).every((celula) => celula.disabled)).toBe(true);

      const antes = store.tirosRecebidosPeloComputador().length;
      const aposOFim = store.atacarJogador(celulaLivreDoComputador(store));
      expect(aposOFim).toEqual({ ok: false, motivo: 'combate-encerrado' });
      expect(store.tirosRecebidosPeloComputador()).toHaveLength(antes);
    } finally {
      vi.useRealTimers();
    }
  });
});
