import { describe, expect, it } from 'vitest';
import { TAMANHO_TABULEIRO, chaveCoordenada } from './coordenada';
import { TIPOS_DA_FROTA, coordenadasDe } from './frota';
import { gerarFrotaAleatoria } from './frota-aleatoria';
import { criarAleatorioFixo } from './testes/aleatorio-fixo';

describe('gerarFrotaAleatoria', () => {
  it('gera 1.000 frotas válidas: cinco embarcações, dentro dos limites e sem sobreposição', () => {
    const aleatorio = criarAleatorioFixo(2026);

    for (let indice = 0; indice < 1000; indice++) {
      const tabuleiro = gerarFrotaAleatoria(aleatorio);

      expect(tabuleiro.embarcacoes).toHaveLength(5);
      expect(new Set(tabuleiro.embarcacoes.map((embarcacao) => embarcacao.tipo))).toEqual(
        new Set(TIPOS_DA_FROTA),
      );

      const totaisPorTipo = tabuleiro.embarcacoes.map(
        (embarcacao) => coordenadasDe(embarcacao).length,
      );
      expect(totaisPorTipo.reduce((total, tamanho) => total + tamanho, 0)).toBe(17);

      const todasAsCelulas = tabuleiro.embarcacoes.flatMap(coordenadasDe);
      for (const celula of todasAsCelulas) {
        expect(celula.linha).toBeGreaterThanOrEqual(0);
        expect(celula.linha).toBeLessThan(TAMANHO_TABULEIRO);
        expect(celula.coluna).toBeGreaterThanOrEqual(0);
        expect(celula.coluna).toBeLessThan(TAMANHO_TABULEIRO);
      }
      const celulasUnicas = new Set(todasAsCelulas.map(chaveCoordenada));
      expect(celulasUnicas.size).toBe(17);
    }
  });

  it('é reproduzível: a mesma semente produz exatamente as mesmas embarcações', () => {
    const primeira = gerarFrotaAleatoria(criarAleatorioFixo(42));
    const segunda = gerarFrotaAleatoria(criarAleatorioFixo(42));

    expect(segunda).toEqual(primeira);
  });

  it('sementes distintas produzem posicionamentos normalmente diferentes', () => {
    const primeira = gerarFrotaAleatoria(criarAleatorioFixo(1));
    const segunda = gerarFrotaAleatoria(criarAleatorioFixo(2));

    expect(segunda).not.toEqual(primeira);
  });
});
