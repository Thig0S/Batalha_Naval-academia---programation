import { describe, expect, it } from 'vitest';
import { frotaDestruida, resolverTiro, tiposDestruidos } from './ataques';
import type { LadoDoCombate, Tiro } from './combate';
import { TIPOS_DA_FROTA, coordenadasDe, type Embarcacao, type TipoEmbarcacao } from './frota';
import type { Tabuleiro } from './tabuleiro';
import { frotaDoComputador } from './testes/frotas';

function lado(tabuleiro: Tabuleiro, tiros: readonly Tiro[] = []): LadoDoCombate {
  return { tabuleiro, tirosRecebidos: tiros };
}

function embarcacaoDe(tabuleiro: Tabuleiro, tipo: TipoEmbarcacao): Embarcacao {
  const embarcacao = tabuleiro.embarcacoes.find((posicionada) => posicionada.tipo === tipo);
  if (embarcacao === undefined) {
    throw new Error(`embarcação ${tipo} ausente na frota de teste`);
  }
  return embarcacao;
}

/** Registra, uma a uma, as posições da embarcação e devolve o histórico resultante. */
function atacarPosicoes(tabuleiro: Tabuleiro, embarcacao: Embarcacao): Tiro[] {
  const historico: Tiro[] = [];
  for (const celula of coordenadasDe(embarcacao)) {
    historico.push(resolverTiro(celula, lado(tabuleiro, historico)));
  }
  return historico;
}

describe('resolverTiro', () => {
  it('classifica como água uma célula sem embarcação', () => {
    const tiro = resolverTiro({ linha: 0, coluna: 0 }, lado(frotaDoComputador()));

    expect(tiro).toEqual({ coordenada: { linha: 0, coluna: 0 }, resultado: 'agua' });
    expect(Object.keys(tiro).sort()).toEqual(['coordenada', 'resultado']);
  });

  it('classifica como acerto a primeira posição atingida, sem revelar as demais posições', () => {
    const tabuleiro = frotaDoComputador();
    const primeira = coordenadasDe(embarcacaoDe(tabuleiro, 'cruzador'))[0];

    const tiro = resolverTiro(primeira, lado(tabuleiro));

    expect(tiro.resultado).toBe('acerto');
    expect(Object.keys(tiro).sort()).toEqual(['coordenada', 'resultado']);
    expect(tiro).not.toHaveProperty('tipo');
  });

  it('classifica como destruída a última posição intacta do destroyer', () => {
    const tabuleiro = frotaDoComputador();
    const [primeira, ultima] = coordenadasDe(embarcacaoDe(tabuleiro, 'destroyer'));

    const historico = [resolverTiro(primeira, lado(tabuleiro))];
    const tiro = resolverTiro(ultima, lado(tabuleiro, historico));

    expect(tiro).toEqual({ coordenada: ultima, resultado: 'destruido', tipo: 'destroyer' });
    expect(Object.keys(tiro).sort()).toEqual(['coordenada', 'resultado', 'tipo']);
  });

  it('registra uma cópia da coordenada recebida', () => {
    const coordenada = { linha: 0, coluna: 0 };

    const tiro = resolverTiro(coordenada, lado(frotaDoComputador()));

    expect(tiro.coordenada).not.toBe(coordenada);
    expect(tiro.coordenada).toEqual(coordenada);
  });
});

describe('tiposDestruidos e frotaDestruida', () => {
  it('não considera destruída uma embarcação parcialmente atingida', () => {
    const tabuleiro = frotaDoComputador();
    const primeira = coordenadasDe(embarcacaoDe(tabuleiro, 'cruzador'))[0];
    const defensor = lado(tabuleiro, [resolverTiro(primeira, lado(tabuleiro))]);

    expect(tiposDestruidos(defensor)).toEqual([]);
    expect(frotaDestruida(defensor)).toBe(false);
  });

  it('separa o cruzador destruído do submarino, apesar do mesmo tamanho', () => {
    const tabuleiro = frotaDoComputador();
    const defensor = lado(
      tabuleiro,
      atacarPosicoes(tabuleiro, embarcacaoDe(tabuleiro, 'cruzador')),
    );

    expect(tiposDestruidos(defensor)).toEqual(['cruzador']);
    expect(tiposDestruidos(defensor)).not.toContain('submarino');
    expect(frotaDestruida(defensor)).toBe(false);
  });

  it('considera a frota destruída quando as cinco embarcações perderam todas as posições', () => {
    const tabuleiro = frotaDoComputador();
    const tiros = tabuleiro.embarcacoes.flatMap((embarcacao) =>
      atacarPosicoes(tabuleiro, embarcacao),
    );
    const defensor = lado(tabuleiro, tiros);

    expect(tiposDestruidos(defensor).sort()).toEqual([...TIPOS_DA_FROTA].sort());
    expect(frotaDestruida(defensor)).toBe(true);
  });

  it('mantém os tiros anteriores com o resultado original após a destruição', () => {
    const tabuleiro = frotaDoComputador();
    const [primeira, ultima] = coordenadasDe(embarcacaoDe(tabuleiro, 'destroyer'));
    const primeiroTiro = resolverTiro(primeira, lado(tabuleiro));
    const historico: Tiro[] = [primeiroTiro];

    const tiroFinal = resolverTiro(ultima, lado(tabuleiro, historico));

    expect(tiroFinal.resultado).toBe('destruido');
    expect(historico[0]).toBe(primeiroTiro);
    expect(historico[0].resultado).toBe('acerto');
  });
});
