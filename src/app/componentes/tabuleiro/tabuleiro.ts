import { Component, computed, input, output } from '@angular/core';
import { LucideShip } from '@lucide/angular';
import {
  TAMANHO_TABULEIRO,
  Coordenada,
  chaveCoordenada,
  rotuloCoordenada,
} from '../../core/coordenada';
import { Embarcacao, TipoEmbarcacao, coordenadasDe } from '../../core/frota';
import { ROTULOS_DE_TIPO } from '../../state/rotulos';

/** Modo de apresentação do tabuleiro; só a preparação aceita interação. */
export type ModoTabuleiro = 'preparacao' | 'proprio' | 'adversario';

/** Destaque das células que a embarcação selecionada ocuparia, com a validade do posicionamento. */
export interface PrevisaoDePosicionamento {
  celulas: readonly Coordenada[];
  valido: boolean;
}

/** Célula derivada das entradas, pronta para o template. */
interface Celula {
  chave: string;
  coordenada: Coordenada;
  rotuloAcessivel: string;
  tipo: TipoEmbarcacao | null;
  previsao: 'valido' | 'invalido' | null;
  classes: string;
}

/** Linha derivada das entradas, com a letra do cabeçalho e suas células. */
interface Linha {
  letra: string;
  celulas: Celula[];
}

/**
 * Componente de apresentação do tabuleiro 10 × 10, burro em inputs e outputs.
 * No modo `adversario` as embarcações nunca são reveladas: o mapa de células ocupadas
 * nem é derivado quando o modo não revela.
 */
@Component({
  selector: 'app-tabuleiro',
  imports: [LucideShip],
  templateUrl: './tabuleiro.html',
})
export class Tabuleiro {
  /** Modo de apresentação. */
  readonly modo = input.required<ModoTabuleiro>();

  /** Embarcações visíveis; ignorado no modo `adversario`. */
  readonly embarcacoes = input<readonly Embarcacao[]>([]);

  /** Destaque do preview de posicionamento, usado na preparação. */
  readonly previsao = input<PrevisaoDePosicionamento | null>(null);

  /** Tipo da embarcação selecionada, cujo contorno indica a seleção. */
  readonly tipoDestacado = input<TipoEmbarcacao | null>(null);

  /** Célula clicada pelo jogador. */
  readonly celulaSelecionada = output<Coordenada>();

  /** Célula ganhando foco/sobreposição; `null` quando o foco sai. */
  readonly celulaFocada = output<Coordenada | null>();

  /** Números dos cabeçalhos de coluna, de 1 a 10. */
  protected readonly rotulosDeColuna = Array.from({ length: TAMANHO_TABULEIRO }, (_, i) => i + 1);

  /** Grade derivada das entradas: cabeçalhos, ocupação, preview e destaque em uma passada. */
  protected readonly linhas = computed<Linha[]>(() => {
    const revela = this.modo() !== 'adversario';
    const tipoPorChave = new Map<string, TipoEmbarcacao>();
    if (revela) {
      for (const embarcacao of this.embarcacoes()) {
        for (const celula of coordenadasDe(embarcacao)) {
          tipoPorChave.set(chaveCoordenada(celula), embarcacao.tipo);
        }
      }
    }

    const previsao = this.previsao();
    const chavesDaPrevisao = previsao === null ? [] : previsao.celulas.map(chaveCoordenada);
    const tipoDestacado = this.tipoDestacado();

    return Array.from({ length: TAMANHO_TABULEIRO }, (_, linha) => {
      const letra = rotuloCoordenada({ linha, coluna: 0 }).slice(0, 1);
      const celulas = Array.from({ length: TAMANHO_TABULEIRO }, (_, coluna): Celula => {
        const coordenada: Coordenada = { linha, coluna };
        const chave = chaveCoordenada(coordenada);
        const rotulo = `${letra}${coluna + 1}`;
        const tipo = tipoPorChave.get(chave) ?? null;

        const naPrevisao = previsao !== null && chavesDaPrevisao.includes(chave);
        const previsaoAtual: 'valido' | 'invalido' | null =
          naPrevisao && previsao !== null && previsao.valido
            ? 'valido'
            : naPrevisao
              ? 'invalido'
              : null;

        const destacada = tipo !== null && tipoDestacado !== null && tipo === tipoDestacado;

        let classes =
          'flex aspect-square items-center justify-center rounded-sm border border-tabuleiro-borda/70 text-center disabled:cursor-default focus-visible:outline-2 focus-visible:outline-acerto';
        if (previsaoAtual === 'invalido') {
          classes += ' bg-destruido/50 border-destruido text-slate-100';
        } else if (previsaoAtual === 'valido' && tipo === null) {
          classes += ' bg-acerto/40 border-acerto text-slate-950';
        } else if (tipo !== null) {
          classes +=
            ' bg-navio text-slate-950' + (previsaoAtual === 'valido' ? ' border-acerto' : '');
        } else {
          classes += ' bg-agua/15 text-slate-100 hover:bg-agua/35';
        }
        if (destacada) {
          classes += ' outline-2 outline-acerto';
        }

        return {
          chave,
          coordenada,
          rotuloAcessivel:
            tipo === null ? rotulo : `${rotulo}, ${ROTULOS_DE_TIPO[tipo].toLowerCase()}`,
          tipo,
          previsao: previsaoAtual,
          classes,
        };
      });
      return { letra, celulas };
    });
  });
}
