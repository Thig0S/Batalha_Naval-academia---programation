import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { chaveCoordenada } from '../core/coordenada';
import { coordenadasDe, TIPOS_DA_FROTA } from '../core/frota';
import { frotaCompleta, validarPosicionamento } from '../core/posicionamento';
import { criarAleatorioFixo } from '../core/testes/aleatorio-fixo';
import { ALEATORIO } from './aleatorio';
import { ATRASO_COMPUTADOR_MS, PartidaStore } from './partida-store';
import { atacarValido, celulaLivreDoComputador } from './testes/ataques';
import { posicionarFrotaNaStore } from './testes/frota-do-jogador';

/** Cria uma store com o gerador de números aleatórios sobrescrito por um PRNG fixo. */
async function criarStore(semente: number): Promise<PartidaStore> {
  await TestBed.configureTestingModule({
    providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(semente) }],
  });
  return TestBed.inject(PartidaStore);
}

/** Prepara uma store em batalha: partida iniciada, frota do jogador completa e combate criado. */
async function criarBatalha(semente = 7): Promise<PartidaStore> {
  const store = await criarStore(semente);
  store.iniciarPartida();
  posicionarFrotaNaStore(store);
  store.iniciarBatalha();
  return store;
}

describe('PartidaStore', () => {
  it('começa na fase apresentação com os dois tabuleiros vazios', async () => {
    const store = await criarStore(42);

    expect(store.fase()).toBe('apresentacao');
    expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
    expect(store.tabuleiroComputador()).toEqual({ embarcacoes: [] });
  });

  it('gera a mesma frota do computador com a mesma semente de PRNG', async () => {
    const primeira = await criarStore(42);
    primeira.iniciarPartida();
    const frotaPrimeira = primeira.tabuleiroComputador();

    TestBed.resetTestingModule();
    const segunda = await criarStore(42);
    segunda.iniciarPartida();

    expect(segunda.tabuleiroComputador()).toEqual(frotaPrimeira);
  });

  it('ao iniciar a partida, leva à preparação com o tabuleiro do jogador vazio e a frota do computador completa e válida', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();
    const computador = store.tabuleiroComputador();

    expect(store.fase()).toBe('preparacao');
    expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
    expect(computador.embarcacoes.map((embarcacao) => embarcacao.tipo).sort()).toEqual(
      [...TIPOS_DA_FROTA].sort(),
    );
    for (const embarcacao of computador.embarcacoes) {
      expect(validarPosicionamento(embarcacao, computador)).toBeNull();
    }
    expect(frotaCompleta(computador)).toBe(true);
  });

  it('posiciona no tabuleiro do jogador e atualiza os tipos pendentes', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();

    const resultado = store.posicionar({
      tipo: 'cruzador',
      linha: 2,
      coluna: 1,
      orientacao: 'horizontal',
    });

    expect(resultado.ok).toBe(true);
    expect(store.tabuleiroJogador().embarcacoes).toHaveLength(1);
    expect(store.tiposPendentes()).toEqual([
      'porta-avioes',
      'encouracado',
      'submarino',
      'destroyer',
    ]);
  });

  it('propaga o motivo do posicionamento inválido e não altera o tabuleiro', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();
    store.posicionar({ tipo: 'cruzador', linha: 2, coluna: 1, orientacao: 'horizontal' });
    const anterior = store.tabuleiroJogador();

    const sobreposicao = store.posicionar({
      tipo: 'submarino',
      linha: 2,
      coluna: 2,
      orientacao: 'horizontal',
    });
    expect(sobreposicao).toEqual({ ok: false, motivo: 'sobreposicao' });
    expect(store.tabuleiroJogador()).toEqual(anterior);

    const fora = store.posicionar({
      tipo: 'porta-avioes',
      linha: 0,
      coluna: 7,
      orientacao: 'horizontal',
    });
    expect(fora).toEqual({ ok: false, motivo: 'fora-do-tabuleiro' });
    expect(store.tabuleiroJogador()).toEqual(anterior);
  });

  it('remove a embarcação do tipo indicado, liberando suas células', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();
    store.posicionar({ tipo: 'cruzador', linha: 2, coluna: 1, orientacao: 'horizontal' });

    store.remover('cruzador');

    expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
    expect(store.tiposPendentes()).toEqual([...TIPOS_DA_FROTA]);
  });

  it('bloqueia o início da batalha com a frota do jogador incompleta', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();

    posicionarFrotaNaStore(store, ['destroyer']);

    expect(store.frotaCompleta()).toBe(false);
    expect(store.iniciarBatalha()).toBe(false);
    expect(store.fase()).toBe('preparacao');
    expect(store.estadoCombate()).toBeNull();
    expect(store.combateAtivo()).toBe(false);
  });

  it('inicia a batalha quando a frota do jogador está completa', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();

    posicionarFrotaNaStore(store);

    expect(store.frotaCompleta()).toBe(true);
    expect(store.iniciarBatalha()).toBe(true);
    expect(store.fase()).toBe('batalha');
  });

  it('fora do combate, deriva turno, vencedor, tiros e tipos destruídos como vazios', async () => {
    const store = await criarStore(42);

    expect(store.estadoCombate()).toBeNull();
    expect(store.turno()).toBeNull();
    expect(store.vencedor()).toBeNull();
    expect(store.tirosRecebidosPeloJogador()).toEqual([]);
    expect(store.tirosRecebidosPeloComputador()).toEqual([]);
    expect(store.tiposDestruidosDoComputador()).toEqual([]);
    expect(store.tiposDestruidosDoJogador()).toEqual([]);
    expect(store.combateAtivo()).toBe(false);
  });

  it('cria o combate no turno do jogador, sem tiros e sem vencedor', async () => {
    const store = await criarBatalha();

    expect(store.fase()).toBe('batalha');
    expect(store.combateAtivo()).toBe(true);
    expect(store.turno()).toBe('jogador');
    expect(store.vencedor()).toBeNull();
    expect(store.tirosRecebidosPeloJogador()).toEqual([]);
    expect(store.tirosRecebidosPeloComputador()).toEqual([]);
    expect(store.tiposDestruidosDoComputador()).toEqual([]);
  });

  it('registra um ataque do jogador na água e devolve a vez ao computador', async () => {
    const store = await criarBatalha();

    atacarValido(store, celulaLivreDoComputador(store));

    expect(store.tirosRecebidosPeloComputador()).toHaveLength(1);
    expect(store.tirosRecebidosPeloComputador()[0].resultado).toBe('agua');
    expect(store.turno()).toBe('computador');
    expect(store.vencedor()).toBeNull();
  });

  it('classifica acerto e destruição quando o jogador completa uma embarcação', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      const destroyer = store
        .tabuleiroComputador()
        .embarcacoes.find((embarcacao) => embarcacao.tipo === 'destroyer');
      if (destroyer === undefined) {
        throw new Error('Destroyer não encontrada no tabuleiro do computador.');
      }
      const [primeira, segunda] = coordenadasDe(destroyer);

      const acerto = store.atacarJogador(primeira);
      if (!acerto.ok) {
        throw new Error('Esperava acerto na primeira posição da embarcação.');
      }
      expect(acerto.tiro.resultado).toBe('acerto');
      expect(acerto.tiro.tipo).toBeUndefined();
      expect(store.tiposDestruidosDoComputador()).toEqual([]);

      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      expect(store.turno()).toBe('jogador');

      const destruido = store.atacarJogador(segunda);
      if (!destruido.ok) {
        throw new Error('Esperava destruição na última posição da embarcação.');
      }
      expect(destruido.tiro.resultado).toBe('destruido');
      expect(destruido.tiro.tipo).toBe('destroyer');
      expect(store.tiposDestruidosDoComputador()).toEqual(['destroyer']);
      expect(store.tirosRecebidosPeloComputador()).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejeita coordenada repetida sem consumir o turno nem alterar o histórico', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      const alvo = celulaLivreDoComputador(store);
      atacarValido(store, alvo);
      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      expect(store.turno()).toBe('jogador');

      const historico = store.tirosRecebidosPeloComputador();
      const repetido = store.atacarJogador(alvo);

      expect(repetido).toEqual({ ok: false, motivo: 'coordenada-ja-atacada' });
      expect(store.turno()).toBe('jogador');
      expect(store.tirosRecebidosPeloComputador()).toEqual(historico);
      expect(store.tirosRecebidosPeloComputador()).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('faz o computador atacar alvo ainda não atacado e devolver o turno', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      for (let rodada = 0; rodada < 3; rodada++) {
        atacarValido(store, celulaLivreDoComputador(store));
        expect(store.turno()).toBe('computador');

        vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
        expect(store.turno()).toBe('jogador');
      }

      const tiros = store.tirosRecebidosPeloJogador();
      expect(tiros).toHaveLength(3);
      const alvos = new Set(tiros.map((tiro) => chaveCoordenada(tiro.coordenada)));
      expect(alvos.size).toBe(3);
      for (const tiro of tiros) {
        expect(tiro.coordenada.linha).toBeGreaterThanOrEqual(0);
        expect(tiro.coordenada.linha).toBeLessThan(10);
        expect(tiro.coordenada.coluna).toBeGreaterThanOrEqual(0);
        expect(tiro.coordenada.coluna).toBeLessThan(10);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it('não ataca antes do atraso e ataca exatamente depois dele', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      atacarValido(store, celulaLivreDoComputador(store));

      expect(store.tirosRecebidosPeloJogador()).toHaveLength(0);
      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS - 1);
      expect(store.tirosRecebidosPeloJogador()).toHaveLength(0);
      expect(store.turno()).toBe('computador');

      vi.advanceTimersByTime(1);
      expect(store.tirosRecebidosPeloJogador()).toHaveLength(1);
      expect(store.turno()).toBe('jogador');
    } finally {
      vi.useRealTimers();
    }
  });

  it('reiniciar cancela o ataque pendente do computador', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      atacarValido(store, celulaLivreDoComputador(store)); // deixa um ataque agendado
      store.novaPartida();

      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS * 2);

      expect(store.estadoCombate()).toBeNull();
      expect(store.fase()).toBe('preparacao');
      expect(store.tirosRecebidosPeloJogador()).toEqual([]);
      expect(store.tirosRecebidosPeloComputador()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reinicia após a vitória com tabuleiro vazio, nova frota e sem resíduos', async () => {
    const store = await criarBatalha();
    vi.useFakeTimers();
    try {
      const alvos = store
        .tabuleiroComputador()
        .embarcacoes.flatMap(coordenadasDe)
        .map((coordenada) => ({ ...coordenada }));

      for (const alvo of alvos) {
        atacarValido(store, alvo);
        if (store.vencedor() !== null) {
          break;
        }
        vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS);
      }
      expect(store.vencedor()).toBe('jogador');
      expect(store.combateAtivo()).toBe(false);
      expect(store.tiposDestruidosDoComputador()).toHaveLength(TIPOS_DA_FROTA.length);

      store.novaPartida();

      expect(store.fase()).toBe('preparacao');
      expect(store.estadoCombate()).toBeNull();
      expect(store.turno()).toBeNull();
      expect(store.vencedor()).toBeNull();
      expect(store.tabuleiroJogador()).toEqual({ embarcacoes: [] });
      expect(store.tirosRecebidosPeloJogador()).toEqual([]);
      expect(store.tirosRecebidosPeloComputador()).toEqual([]);
      expect(store.tabuleiroComputador().embarcacoes).toHaveLength(TIPOS_DA_FROTA.length);

      vi.advanceTimersByTime(ATRASO_COMPUTADOR_MS * 2);
      expect(store.estadoCombate()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
