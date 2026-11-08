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

/** Botão do pop-up de fim de jogo com o rótulo indicado. */
function botaoDoPopup(elemento: HTMLElement, rotulo: string): HTMLButtonElement {
  const dialogo = elemento.querySelector('[role="dialog"]');
  if (dialogo === null) {
    throw new Error('Pop-up de fim de jogo não encontrado.');
  }
  const botao = [...dialogo.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
    botao.textContent?.includes(rotulo),
  );
  if (botao === undefined) {
    throw new Error(`Botão "${rotulo}" não encontrado no pop-up.`);
  }
  return botao;
}

/** Botão fora do pop-up — o da barra de situação final — com o rótulo indicado. */
function botaoForaDoPopup(elemento: HTMLElement, rotulo: string): HTMLButtonElement {
  const botao = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find(
    (botao) => botao.textContent?.includes(rotulo) && botao.closest('[role="dialog"]') === null,
  );
  if (botao === undefined) {
    throw new Error(`Botão "${rotulo}" não encontrado na barra de situação final.`);
  }
  return botao;
}

/**
 * Vence a partida clicando em todas as posições ocupadas da frota do computador, devolvendo
 * a vez ao computador entre os ataques. Requer timers falsos ativos.
 */
function vencerPartida(
  fixture: ReturnType<typeof TestBed.createComponent<Batalha>>,
  store: PartidaStore,
  elemento: HTMLElement,
): void {
  const alvos = store
    .tabuleiroComputador()
    .embarcacoes.flatMap(coordenadasDe)
    .map((coordenada) => ({ ...coordenada }));

  for (const alvo of alvos) {
    celulaAdversaria(elemento, alvo).click();
    fixture.detectChanges();
    if (store.vencedor() !== null) {
      return;
    }
    vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
    fixture.detectChanges();
  }
  throw new Error('Esperava que o jogador vencesse a partida.');
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
    expect(texto(elemento)).not.toContain('Jogar novamente');
    expect(texto(elemento)).not.toContain('Preparar nova frota');
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
      expect(aviso(elemento)).toBe('O computador está atacando…');

      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      fixture.detectChanges();
      expect(texto(elemento)).toContain('Turno: Você');
      expect(aviso(elemento)).toBe('');

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
      expect(aviso(elemento)).toBe('O computador está atacando…');
    } finally {
      vi.useRealTimers();
    }
  });

  it('exibe o aviso de espera durante todo o atraso e o remove quando o computador revida', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      expect(aviso(elemento)).toBe('');

      atacarValido(store, celulaLivreDoComputador(store));
      fixture.detectChanges();
      expect(aviso(elemento)).toBe('O computador está atacando…');

      // Aviso presente durante toda a espera, mesmo faltando pouco para o contra-ataque.
      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS - 1);
      fixture.detectChanges();
      expect(aviso(elemento)).toBe('O computador está atacando…');

      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(aviso(elemento)).toBe('');
      expect(store.turno()).toBe('jogador');
    } finally {
      vi.useRealTimers();
    }
  });

  it('anuncia a destruição e mostra a embarcação inimiga completa no mapa', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      const encouracado = store
        .tabuleiroComputador()
        .embarcacoes.find((embarcacao) => embarcacao.tipo === 'encouracado');
      if (encouracado === undefined) {
        throw new Error('Encouraçado não encontrado no tabuleiro do computador.');
      }
      const alvos = coordenadasDe(encouracado);

      // Ataca as quatro posições, devolvendo a vez entre cada ataque.
      for (const alvo of alvos) {
        celulaAdversaria(elemento, alvo).click();
        fixture.detectChanges();
        if (store.vencedor() !== null) {
          break;
        }
        vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
        fixture.detectChanges();
      }

      expect(store.tiposDestruidosDoComputador()).toEqual(['encouracado']);
      expect(aviso(elemento)).toContain('Embarcação destruída: Encouraçado');
      expect(texto(elemento)).toContain('do computador: 1/5');

      // As quatro células do encouraçado aparecem completas como destruídas, com o tipo.
      const adversarias = celulasDo(elemento, 1);
      const marcadas = adversarias.filter((celula) =>
        celula.getAttribute('aria-label')?.includes(', '),
      );
      expect(marcadas).toHaveLength(4);
      for (const celula of marcadas) {
        expect(celula.getAttribute('aria-label')).toContain('encouraçado');
        expect(celula.getAttribute('aria-label')).toContain('embarcação destruída');
        expect(celula.className).toContain('bg-destruido');
        expect(celula.querySelector('svg')?.classList.contains('lucide-bomb')).toBe(true);
      }

      // As embarcações ainda não destruídas continuam ocultas.
      for (const celula of adversarias) {
        const rotulo = celula.getAttribute('aria-label') ?? '';
        if (!rotulo.includes(', ')) {
          expect(rotulo).not.toMatch(/porta-aviões|cruzador|submarino|destroyer/);
        }
      }
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

      const dialogo = elemento.querySelector('[role="dialog"]');
      expect(dialogo).not.toBeNull();
      expect(dialogo?.getAttribute('aria-modal')).toBe('true');

      botaoDoPopup(elemento, 'Preparar nova frota').click();
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

      // A frota destruída do jogador aparece completa no tabuleiro próprio.
      const proprias = celulasDo(elemento, 0);
      const destruidas = proprias.filter((celula) =>
        celula.getAttribute('aria-label')?.includes('embarcação destruída'),
      );
      expect(destruidas).toHaveLength(17); // as cinco embarcações, 17 células
      expect(store.embarcacoesDestruidasDoJogador()).toHaveLength(5);
      for (const celula of destruidas) {
        expect(celula.className).toContain('bg-destruido');
        expect(celula.querySelector('svg')?.classList.contains('lucide-bomb')).toBe(true);
      }

      const antes = store.tirosRecebidosPeloComputador().length;
      const aposOFim = store.atacarJogador(celulaLivreDoComputador(store));
      expect(aposOFim).toEqual({ ok: false, motivo: 'combate-encerrado' });
      expect(store.tirosRecebidosPeloComputador()).toHaveLength(antes);
    } finally {
      vi.useRealTimers();
    }
  });

  it('exibe o pop-up no fim de jogo e "Fechar" o dispensa mantendo a barra com as duas opções', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      vencerPartida(fixture, store, elemento);

      const dialogo = elemento.querySelector('[role="dialog"]');
      expect(dialogo).not.toBeNull();
      expect(dialogo?.getAttribute('aria-modal')).toBe('true');
      expect(dialogo?.textContent).toContain('Você venceu a partida!');

      botaoDoPopup(elemento, 'Fechar').click();
      fixture.detectChanges();

      expect(elemento.querySelector('[role="dialog"]')).toBeNull();
      expect(texto(elemento)).toContain('Você venceu a partida!');
      expect(botaoForaDoPopup(elemento, 'Jogar novamente')).toBeTruthy();
      expect(botaoForaDoPopup(elemento, 'Preparar nova frota')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('"Esc" dispensa o pop-up mantendo a barra com as duas opções', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      vencerPartida(fixture, store, elemento);

      const dialogo = elemento.querySelector('[role="dialog"]');
      expect(dialogo).not.toBeNull();
      if (dialogo === null) {
        throw new Error('Pop-up de fim de jogo não encontrado.');
      }
      dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(elemento.querySelector('[role="dialog"]')).toBeNull();
      expect(texto(elemento)).toContain('Você venceu a partida!');
      expect(botaoForaDoPopup(elemento, 'Jogar novamente')).toBeTruthy();
      expect(botaoForaDoPopup(elemento, 'Preparar nova frota')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('"Jogar novamente" começa nova batalha com a frota do jogador preservada, zero tiros e nenhum vencedor', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      vencerPartida(fixture, store, elemento);
      const frotaDoJogador = store.tabuleiroJogador();
      const frotaDoComputador = store.tabuleiroComputador();

      botaoDoPopup(elemento, 'Jogar novamente').click();
      fixture.detectChanges();

      expect(store.fase()).toBe('batalha');
      expect(store.vencedor()).toBeNull();
      expect(store.turno()).toBe('jogador');
      expect(store.tirosRecebidosPeloJogador()).toEqual([]);
      expect(store.tirosRecebidosPeloComputador()).toEqual([]);
      expect(store.tabuleiroJogador()).toEqual(frotaDoJogador);
      expect(store.tabuleiroComputador().embarcacoes).not.toEqual(frotaDoComputador.embarcacoes);
      // sem vencedor não há pop-up nem barra de situação final
      expect(elemento.querySelector('[role="dialog"]')).toBeNull();
      const semSaida = [...elemento.querySelectorAll<HTMLButtonElement>('button')].some(
        (botao) =>
          botao.textContent?.includes('Jogar novamente') ||
          botao.textContent?.includes('Preparar nova frota'),
      );
      expect(semSaida).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reexibe o pop-up ao fim da nova partida depois de dispensá-lo e jogar novamente', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      vencerPartida(fixture, store, elemento);
      botaoDoPopup(elemento, 'Fechar').click();
      fixture.detectChanges();
      expect(elemento.querySelector('[role="dialog"]')).toBeNull();

      botaoForaDoPopup(elemento, 'Jogar novamente').click();
      fixture.detectChanges();
      expect(store.vencedor()).toBeNull();

      vencerPartida(fixture, store, elemento);

      const dialogo = elemento.querySelector('[role="dialog"]');
      expect(dialogo).not.toBeNull();
      expect(dialogo?.textContent).toContain('Você venceu a partida!');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reexibe o pop-up no fim da partida seguinte depois de dispensá-lo e preparar nova frota', async () => {
    const { fixture, store, elemento } = await criarTela();
    vi.useFakeTimers();
    try {
      vencerPartida(fixture, store, elemento);
      botaoDoPopup(elemento, 'Fechar').click();
      fixture.detectChanges();

      // dispensado, o pop-up só volta se o estado "fechado" for resetado ao novo combate
      botaoForaDoPopup(elemento, 'Preparar nova frota').click();
      fixture.detectChanges();
      expect(store.fase()).toBe('preparacao');

      posicionarFrotaNaStore(store);
      store.iniciarBatalha();
      fixture.detectChanges();

      vencerPartida(fixture, store, elemento);

      const dialogo = elemento.querySelector('[role="dialog"]');
      expect(dialogo).not.toBeNull();
      expect(dialogo?.textContent).toContain('Você venceu a partida!');
    } finally {
      vi.useRealTimers();
    }
  });
});
