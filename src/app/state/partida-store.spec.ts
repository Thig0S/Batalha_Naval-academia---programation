import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TIPOS_DA_FROTA } from '../core/frota';
import { frotaCompleta, validarPosicionamento } from '../core/posicionamento';
import { criarAleatorioFixo } from '../core/testes/aleatorio-fixo';
import { ALEATORIO } from './aleatorio';
import { PartidaStore } from './partida-store';
import { posicionarFrotaNaStore } from './testes/frota-do-jogador';

/** Cria uma store com o gerador de números aleatórios sobrescrito por um PRNG fixo. */
async function criarStore(semente: number): Promise<PartidaStore> {
  await TestBed.configureTestingModule({
    providers: [{ provide: ALEATORIO, useValue: criarAleatorioFixo(semente) }],
  });
  return TestBed.inject(PartidaStore);
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
  });

  it('inicia a batalha quando a frota do jogador está completa', async () => {
    const store = await criarStore(42);
    store.iniciarPartida();

    posicionarFrotaNaStore(store);

    expect(store.frotaCompleta()).toBe(true);
    expect(store.iniciarBatalha()).toBe(true);
    expect(store.fase()).toBe('batalha');
  });
});
