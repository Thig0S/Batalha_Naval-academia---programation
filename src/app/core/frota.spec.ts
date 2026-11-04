import { describe, expect, it } from 'vitest';
import { Coordenada } from './coordenada';
import { Embarcacao, TAMANHOS, TIPOS_DA_FROTA, coordenadasDe } from './frota';

describe('composição da frota', () => {
  it('define exatamente cinco tipos de embarcação', () => {
    expect(TIPOS_DA_FROTA).toHaveLength(5);
  });

  it('define os tamanhos 5, 4, 3, 3 e 2 para os cinco tipos', () => {
    expect(TAMANHOS['porta-avioes']).toBe(5);
    expect(TAMANHOS.encouracado).toBe(4);
    expect(TAMANHOS.cruzador).toBe(3);
    expect(TAMANHOS.submarino).toBe(3);
    expect(TAMANHOS.destroyer).toBe(2);
  });

  it('totaliza 17 posições para a frota padrão', () => {
    const total = TIPOS_DA_FROTA.reduce((acumulado, tipo) => acumulado + TAMANHOS[tipo], 0);
    expect(total).toBe(17);
  });
});

describe('coordenadasDe', () => {
  const embarcacaoHorizontal: Embarcacao = {
    tipo: 'cruzador',
    linha: 1,
    coluna: 1,
    orientacao: 'horizontal',
  };
  const embarcacaoVertical: Embarcacao = {
    tipo: 'cruzador',
    linha: 1,
    coluna: 1,
    orientacao: 'vertical',
  };

  function coordenadasEquivalentes(coordenadas: Coordenada[]): string[] {
    return coordenadas.map((coordenada) => `${coordenada.linha}:${coordenada.coluna}`);
  }

  it('deriva coordenas consecutivas na ordem correta para orientação horizontal', () => {
    expect(coordenadasEquivalentes(coordenadasDe(embarcacaoHorizontal))).toEqual([
      '1:1',
      '1:2',
      '1:3',
    ]);
  });

  it('deriva coordenadas consecutivas na ordem correta para orientação vertical', () => {
    expect(coordenadasEquivalentes(coordenadasDe(embarcacaoVertical))).toEqual([
      '1:1',
      '2:1',
      '3:1',
    ]);
  });

  it('deriva cinco coordenadas para o porta-aviões', () => {
    const portaAvioes: Embarcacao = {
      tipo: 'porta-avioes',
      linha: 0,
      coluna: 0,
      orientacao: 'horizontal',
    };
    expect(coordenadasDe(portaAvioes)).toHaveLength(5);
  });
});
