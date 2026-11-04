import { describe, expect, it } from 'vitest';
import { coordenadaDoRotulo } from './coordenada';
import { Embarcacao, TipoEmbarcacao, coordenadasDe } from './frota';
import {
  frotaCompleta,
  posicionar,
  removerEmbarcacao,
  tiposPendentes,
  validarPosicionamento,
} from './posicionamento';
import { TABULEIRO_VAZIO, Tabuleiro } from './tabuleiro';

function aPartirDe(
  rotulo: string,
  tipo: TipoEmbarcacao,
  orientacao: 'horizontal' | 'vertical',
): Embarcacao {
  const coordenada = coordenadaDoRotulo(rotulo);
  if (coordenada === null) {
    throw new Error(`rótulo de teste inválido: ${rotulo}`);
  }
  return { tipo, linha: coordenada.linha, coluna: coordenada.coluna, orientacao };
}

function construirFrota(tipos: TipoEmbarcacao[]): Tabuleiro {
  let tabuleiro = TABULEIRO_VAZIO;
  // Uma embarcação por linha, todas horizontais a partir da coluna 1; nunca se sobrepõem.
  for (const [indice, tipo] of tipos.entries()) {
    const resultado = posicionar(
      { tipo, linha: indice, coluna: 0, orientacao: 'horizontal' },
      tabuleiro,
    );
    if (!resultado.ok) {
      throw new Error(`frota de teste inválida: ${tipo} -> ${resultado.motivo}`);
    }
    tabuleiro = resultado.tabuleiro;
  }
  return tabuleiro;
}

describe('validarPosicionamento', () => {
  it('rejeita um porta-aviões horizontal a partir de A8 por ultrapassar a borda direita', () => {
    const portaAvioes = aPartirDe('A8', 'porta-avioes', 'horizontal');
    expect(validarPosicionamento(portaAvioes, TABULEIRO_VAZIO)).toBe('fora-do-tabuleiro');
  });

  it('rejeita um encouraçado vertical a partir de H5 por ultrapassar a borda inferior', () => {
    const encouracado = aPartirDe('H5', 'encouracado', 'vertical');
    expect(validarPosicionamento(encouracado, TABULEIRO_VAZIO)).toBe('fora-do-tabuleiro');
  });

  it('rejeita posicionamento sobre posição ocupada como sobreposição', () => {
    const tabuleiro = construirFrota(['cruzador']);
    const invasor = aPartirDe('A3', 'encouracado', 'vertical');
    expect(validarPosicionamento(invasor, tabuleiro)).toBe('sobreposicao');
  });

  it('aceita embarcações lado a lado em colunas adjacentes, sem compartilhar posições', () => {
    const cruzador = aPartirDe('B2', 'cruzador', 'vertical');
    const primeiro = posicionar(cruzador, TABULEIRO_VAZIO);
    if (!primeiro.ok) {
      throw new Error('o cruzador vertical deveria caber em B2');
    }
    const submarino = aPartirDe('B1', 'submarino', 'vertical');
    expect(validarPosicionamento(submarino, primeiro.tabuleiro)).toBeNull();
  });

  it('aceita embarcações que se tocam apenas na diagonal', () => {
    const destroyer = aPartirDe('B2', 'destroyer', 'horizontal');
    const primeiro = posicionar(destroyer, TABULEIRO_VAZIO);
    if (!primeiro.ok) {
      throw new Error('o destroyer deveria caber em B2');
    }
    const cruzador = aPartirDe('C1', 'cruzador', 'vertical');
    expect(validarPosicionamento(cruzador, primeiro.tabuleiro)).toBeNull();
  });
});

describe('posicionar', () => {
  it('rejeita posicionamento inválido e mantém o tabuleiro exatamente como estava', () => {
    const tabuleiro = construirFrota(['cruzador', 'encouracado']);
    const invasor = aPartirDe('B1', 'destroyer', 'horizontal');
    const antes = [...tabuleiro.embarcacoes];

    const resultado = posicionar(invasor, tabuleiro);

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.motivo).toBe('sobreposicao');
    }
    expect(tabuleiro.embarcacoes).toEqual(antes);
  });

  it('posiciona embarcação válida e devolve um novo tabuleiro, sem mutar o recebido', () => {
    const destroyer = aPartirDe('C4', 'destroyer', 'horizontal');
    const antes = [...TABULEIRO_VAZIO.embarcacoes];

    const resultado = posicionar(destroyer, TABULEIRO_VAZIO);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('o destroyer deveria caber em C4');
    }
    expect(TABULEIRO_VAZIO.embarcacoes).toEqual(antes);
    expect(resultado.tabuleiro).toEqual({ embarcacoes: [destroyer] });
  });
});

describe('removerEmbarcacao', () => {
  it('remove a embarcação e libera as posições dela', () => {
    const tabuleiro = construirFrota(['cruzador', 'destroyer']);
    const ocupante = aPartirDe('B1', 'encouracado', 'vertical');

    const semDestroyer = removerEmbarcacao('destroyer', tabuleiro);

    expect(semDestroyer).not.toBe(tabuleiro);
    expect(semDestroyer.embarcacoes).toHaveLength(1);
    expect(validarPosicionamento(ocupante, semDestroyer)).toBeNull();
    expect(tiposPendentes(semDestroyer)).toContain('destroyer');
  });
});

describe('reposicionamento', () => {
  it('aceita mover a embarcação para posições que ela própria ocupava', () => {
    const cruzador = aPartirDe('B2', 'cruzador', 'horizontal');
    const posicionado = posicionar(cruzador, TABULEIRO_VAZIO);
    if (!posicionado.ok) {
      throw new Error('o cruzador horizontal deveria caber em B2');
    }
    // O mesmo tipo girado na mesma âncora mantém células que ele próprio ocupava (B2 e B3).
    const girado = aPartirDe('B2', 'cruzador', 'vertical');

    const reposicionado = posicionar(girado, posicionado.tabuleiro);

    expect(reposicionado.ok).toBe(true);
    expect(validarPosicionamento(girado, posicionado.tabuleiro)).toBeNull();
  });

  it('rejeita reposicionamento inválido e preserva a posição anterior', () => {
    const destroyer = aPartirDe('A1', 'destroyer', 'horizontal');
    const posicionado = posicionar(destroyer, TABULEIRO_VAZIO);
    if (!posicionado.ok) {
      throw new Error('o destroyer deveria caber em A1');
    }
    const moverParaFora = aPartirDe('J10', 'destroyer', 'horizontal');
    const antes = [...posicionado.tabuleiro.embarcacoes];

    const reposicionado = posicionar(moverParaFora, posicionado.tabuleiro);

    expect(reposicionado.ok).toBe(false);
    if (!reposicionado.ok) {
      expect(reposicionado.motivo).toBe('fora-do-tabuleiro');
    }
    expect(posicionado.tabuleiro.embarcacoes).toEqual(antes);
    expect(posicionado.tabuleiro.embarcacoes[0]).toEqual(destroyer);
  });
});

describe('frotaCompleta e tiposPendentes', () => {
  const todos: TipoEmbarcacao[] = [
    'porta-avioes',
    'encouracado',
    'cruzador',
    'submarino',
    'destroyer',
  ];

  it('considera a frota incompleta com apenas quatro tipos posicionados', () => {
    const tipos = todos.filter((tipo) => tipo !== 'submarino');
    const tabuleiro = construirFrota(tipos);

    expect(frotaCompleta(tabuleiro)).toBe(false);
    expect(tiposPendentes(tabuleiro)).toEqual(['submarino']);
  });

  it('considera a frota completa com os cinco tipos posicionados', () => {
    const tabuleiro = construirFrota(todos);

    expect(frotaCompleta(tabuleiro)).toBe(true);
    expect(tiposPendentes(tabuleiro)).toEqual([]);
    expect(tabuleiro.embarcacoes.map(coordenadasDe).flat()).toHaveLength(17);
  });
});
