import { TAMANHO_TABULEIRO, chaveCoordenada, dentroDoTabuleiro } from './coordenada';
import {
  Embarcacao,
  Orientacao,
  TipoEmbarcacao,
  TIPOS_DA_FROTA,
  TAMANHOS,
  coordenadasDe,
} from './frota';
import { Tabuleiro } from './tabuleiro';

/** Tentativas de posicionamento por embarcação antes de reiniciar a frota inteira. */
const LIMITE_DE_TENTATIVAS = 200;

/** Reinícios da frota inteira por geração; no tabuleiro padrão não deve ocorrer. */
const LIMITE_DE_REINICIOS = 500;

/** Tipos ordenados do maior para o menor, para reduzir fragmentação do tabuleiro. */
const TIPOS_DO_MAIOR_PARA_O_MENOR: TipoEmbarcacao[] = [...TIPOS_DA_FROTA].sort(
  (a, b) => TAMANHOS[b] - TAMANHOS[a],
);

/** Sorteia uma orientação e uma âncora a partir do gerador injetado. */
function sortearEmbarcacao(tipo: TipoEmbarcacao, aleatorio: () => number): Embarcacao {
  const orientacao: Orientacao = aleatorio() < 0.5 ? 'horizontal' : 'vertical';
  return {
    tipo,
    linha: Math.floor(aleatorio() * TAMANHO_TABULEIRO),
    coluna: Math.floor(aleatorio() * TAMANHO_TABULEIRO),
    orientacao,
  };
}

/** Indica se a embarcação cabe: todas as células dentro do tabuleiro e livres. */
function cabeEm(embarcacao: Embarcacao, posicionadas: Embarcacao[]): boolean {
  const ocupadas = new Set(posicionadas.flatMap(coordenadasDe).map(chaveCoordenada));
  return coordenadasDe(embarcacao).every(
    (celula) => dentroDoTabuleiro(celula) && !ocupadas.has(chaveCoordenada(celula)),
  );
}

/**
 * Gera uma frota completa e válida: as cinco embarcações, dentro do tabuleiro e sem sobreposição,
 * sempre no formato de `Tabuleiro`. Reproduzível com a mesma sequência de números aleatórios.
 */
export function gerarFrotaAleatoria(aleatorio: () => number = Math.random): Tabuleiro {
  for (let reinicio = 0; reinicio < LIMITE_DE_REINICIOS; reinicio++) {
    const posicionadas: Embarcacao[] = [];
    for (const tipo of TIPOS_DO_MAIOR_PARA_O_MENOR) {
      let posicionada: Embarcacao | null = null;
      for (let tentativa = 0; tentativa < LIMITE_DE_TENTATIVAS; tentativa++) {
        const candidato = sortearEmbarcacao(tipo, aleatorio);
        if (cabeEm(candidato, posicionadas)) {
          posicionada = candidato;
          break;
        }
      }
      if (posicionada === null) {
        break;
      }
      posicionadas.push(posicionada);
    }
    if (posicionadas.length === TIPOS_DA_FROTA.length) {
      return { embarcacoes: posicionadas };
    }
  }
  throw new Error('A geração de frota aleatória excedeu o limite de reinícios.');
}
