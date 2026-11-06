import { describe, expect, it, vi } from 'vitest';
import { sortearAlvo } from './ataque-aleatorio';
import { resolverTiro } from './ataques';
import type { Tiro } from './combate';
import { chaveCoordenada } from './coordenada';
import { criarAleatorioFixo } from './testes/aleatorio-fixo';
import { frotaDoComputador, frotaDoJogador } from './testes/frotas';
import { todasAsCoordenadas, tirosAgua } from './testes/tiros';

function sequencia(tiros: readonly Tiro[], semente: number, quantidade = 10): string[] {
  const aleatorio = criarAleatorioFixo(semente);
  return Array.from({ length: quantidade }, () => {
    const alvo = sortearAlvo(tiros, aleatorio);
    if (alvo === null) {
      throw new Error('sem candidatos disponíveis na sequência de teste');
    }
    return chaveCoordenada(alvo);
  });
}

describe('sortearAlvo', () => {
  it('sorteia um alvo que não consta no histórico', () => {
    const historico = tirosAgua(todasAsCoordenadas().slice(0, 30));

    const alvo = sortearAlvo(historico, criarAleatorioFixo(3));

    expect(alvo).not.toBeNull();
    if (alvo === null) {
      throw new Error('era esperado um alvo');
    }
    expect(historico.map((tiro) => chaveCoordenada(tiro.coordenada))).not.toContain(
      chaveCoordenada(alvo),
    );
    expect(alvo.linha).toBeGreaterThanOrEqual(0);
    expect(alvo.linha).toBeLessThan(10);
    expect(alvo.coluna).toBeGreaterThanOrEqual(0);
    expect(alvo.coluna).toBeLessThan(10);
  });

  it('escolhe o primeiro candidato com o gerador no início do intervalo', () => {
    expect(sortearAlvo([], () => 0)).toEqual({ linha: 0, coluna: 0 });
  });

  it('escolhe o último candidato com o gerador perto do fim do intervalo', () => {
    expect(sortearAlvo([], () => 0.9999999999999999)).toEqual({ linha: 9, coluna: 9 });
  });

  it('escolhe o único candidato restante quando 99 coordenadas já foram atacadas', () => {
    const restantes = todasAsCoordenadas().filter(
      (coordenada) => chaveCoordenada(coordenada) !== '5:5',
    );

    const alvo = sortearAlvo(tirosAgua(restantes), () => 0.5);

    expect(alvo).toEqual({ linha: 5, coluna: 5 });
  });

  it('devolve null com as 100 coordenadas atacadas, sem chamar o gerador', () => {
    const gerador = vi.fn(() => 0);

    expect(sortearAlvo(tirosAgua(todasAsCoordenadas()), gerador)).toBeNull();
    expect(gerador).not.toHaveBeenCalled();
  });

  it('chama o gerador exatamente uma vez quando há candidatos', () => {
    const gerador = vi.fn(() => 0);

    expect(sortearAlvo([], gerador)).toEqual({ linha: 0, coluna: 0 });
    expect(gerador).toHaveBeenCalledTimes(1);
  });

  it('produz a mesma sequência com a mesma semente e o mesmo histórico', () => {
    const historico = tirosAgua(todasAsCoordenadas().slice(0, 30));

    expect(sequencia(historico, 99)).toEqual(sequencia(historico, 99));
  });

  it('ignora a frota e o resultado dos tiros: históricos iguais dão a mesma sequência', () => {
    const coordenadas = todasAsCoordenadas().slice(0, 10);
    const ladoDoJogador = { tabuleiro: frotaDoJogador(), tirosRecebidos: [] };
    const ladoDoComputador = { tabuleiro: frotaDoComputador(), tirosRecebidos: [] };
    // Os mesmos ataques contra duas frotas distintas produzem resultados diferentes.
    const sobreOJogador = coordenadas.map((coordenada) => resolverTiro(coordenada, ladoDoJogador));
    const sobreOComputador = coordenadas.map((coordenada) =>
      resolverTiro(coordenada, ladoDoComputador),
    );

    expect(sobreOJogador).not.toEqual(sobreOComputador);
    expect(sequencia(sobreOJogador, 5)).toEqual(sequencia(sobreOComputador, 5));
    expect(sequencia(tirosAgua(coordenadas), 5)).toEqual(sequencia(sobreOJogador, 5));
  });

  it('escolhe 100 alvos únicos até esgotar o tabuleiro', () => {
    const atacadas: Tiro[] = [];
    const escolhidas: string[] = [];

    for (let rodada = 0; rodada < 100; rodada++) {
      const alvo = sortearAlvo(atacadas, criarAleatorioFixo(rodada + 1));
      if (alvo === null) {
        throw new Error(`alvo ausente na rodada ${rodada + 1}`);
      }
      escolhidas.push(chaveCoordenada(alvo));
      atacadas.push({ coordenada: alvo, resultado: 'agua' });
    }

    expect(new Set(escolhidas).size).toBe(100);
    expect(sortearAlvo(atacadas, () => 0)).toBeNull();
  });

  it('termina com gerador constante mesmo com uma única célula restante', () => {
    const restantes = todasAsCoordenadas().filter(
      (coordenada) => chaveCoordenada(coordenada) !== '9:9',
    );

    expect(sortearAlvo(tirosAgua(restantes), () => 0)).toEqual({ linha: 9, coluna: 9 });
  });
});
