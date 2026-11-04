import { describe, expect, it } from 'vitest';
import {
  TAMANHO_TABULEIRO,
  chaveCoordenada,
  coordenadaDoRotulo,
  dentroDoTabuleiro,
  rotuloCoordenada,
} from './coordenada';

describe('coordenadaDoRotulo', () => {
  it('interpreta A1 como o canto superior esquerdo (0, 0)', () => {
    expect(coordenadaDoRotulo('A1')).toEqual({ linha: 0, coluna: 0 });
  });

  it('interpreta J10 como o canto inferior direito (9, 9)', () => {
    expect(coordenadaDoRotulo('J10')).toEqual({ linha: 9, coluna: 9 });
  });

  it('interpreta C7 como linha C e coluna 7', () => {
    expect(coordenadaDoRotulo('C7')).toEqual({ linha: 2, coluna: 6 });
  });

  it('rejeita K1 e A11 por estarem fora do tabuleiro', () => {
    expect(coordenadaDoRotulo('K1')).toBeNull();
    expect(coordenadaDoRotulo('A11')).toBeNull();
  });

  it('rejeita rótulos sem coluna', () => {
    expect(coordenadaDoRotulo('A0')).toBeNull();
    expect(coordenadaDoRotulo('B')).toBeNull();
  });
});

describe('rotuloCoordenada', () => {
  it('produz A1 para a origem e J10 para o extremo oposto', () => {
    expect(rotuloCoordenada({ linha: 0, coluna: 0 })).toBe('A1');
    expect(rotuloCoordenada({ linha: 9, coluna: 9 })).toBe('J10');
  });

  it('produz C7 para a linha 2 e coluna 6', () => {
    expect(rotuloCoordenada({ linha: 2, coluna: 6 })).toBe('C7');
  });

  it('vai e volta entre rótulo e coordenada em todas as posições', () => {
    for (let linha = 0; linha < TAMANHO_TABULEIRO; linha++) {
      for (let coluna = 0; coluna < TAMANHO_TABULEIRO; coluna++) {
        const rotulo = rotuloCoordenada({ linha, coluna });
        expect(coordenadaDoRotulo(rotulo)).toEqual({ linha, coluna });
      }
    }
  });
});

describe('chaveCoordenada', () => {
  it('produz a mesma chave para posições iguais e chaves distintas para posições diferentes', () => {
    expect(chaveCoordenada({ linha: 2, coluna: 6 })).toBe(chaveCoordenada({ linha: 2, coluna: 6 }));
    expect(chaveCoordenada({ linha: 2, coluna: 6 })).not.toBe(
      chaveCoordenada({ linha: 6, coluna: 2 }),
    );
  });
});

describe('dentroDoTabuleiro', () => {
  it('aceita todas as posições do tabuleiro 10 × 10', () => {
    for (let linha = 0; linha < TAMANHO_TABULEIRO; linha++) {
      for (let coluna = 0; coluna < TAMANHO_TABULEIRO; coluna++) {
        expect(dentroDoTabuleiro({ linha, coluna })).toBe(true);
      }
    }
  });

  it('rejeita posições fora dos limites', () => {
    expect(dentroDoTabuleiro({ linha: -1, coluna: 0 })).toBe(false);
    expect(dentroDoTabuleiro({ linha: 0, coluna: -1 })).toBe(false);
    expect(dentroDoTabuleiro({ linha: 10, coluna: 0 })).toBe(false);
    expect(dentroDoTabuleiro({ linha: 0, coluna: 10 })).toBe(false);
  });
});
