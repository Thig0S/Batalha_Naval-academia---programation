import { describe, expect, it } from 'vitest';
import { Embarcacao } from './frota';
import { frotaCompleta, posicionar } from './posicionamento';
import { TABULEIRO_VAZIO } from './tabuleiro';

const cruzador: Embarcacao = { tipo: 'cruzador', linha: 0, coluna: 0, orientacao: 'horizontal' };
const destroyer: Embarcacao = { tipo: 'destroyer', linha: 5, coluna: 5, orientacao: 'horizontal' };

describe('TABULEIRO_VAZIO', () => {
  it('possui nenhuma embarcação posicionada', () => {
    expect(TABULEIRO_VAZIO.embarcacoes).toEqual([]);
    expect(frotaCompleta(TABULEIRO_VAZIO)).toBe(false);
  });
});

describe('imutabilidade do tabuleiro', () => {
  it('as operações não mutam o tabuleiro recebido', () => {
    const resultado = posicionar(cruzador, TABULEIRO_VAZIO);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('posicionar deveria aceitar o cruzador');
    }
    const comCruzador = resultado.tabuleiro;
    const posicoesComCruzador = comCruzador.embarcacoes;

    posicionar(destroyer, comCruzador);
    frotaCompleta(comCruzador);

    expect(TABULEIRO_VAZIO.embarcacoes).toEqual([]);
    expect(comCruzador.embarcacoes).toBe(posicoesComCruzador);
    expect(comCruzador.embarcacoes).toHaveLength(1);
  });
});
