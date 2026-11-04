import { Component, computed, inject, signal } from '@angular/core';
import { LucideShip } from '@lucide/angular';
import { ListaDeFrota } from '../../componentes/lista-de-frota/lista-de-frota';
import { PrevisaoDePosicionamento, Tabuleiro } from '../../componentes/tabuleiro/tabuleiro';
import { Coordenada, chaveCoordenada } from '../../core/coordenada';
import {
  Embarcacao,
  Orientacao,
  TipoEmbarcacao,
  TIPOS_DA_FROTA,
  coordenadasDe,
} from '../../core/frota';
import { validarPosicionamento } from '../../core/posicionamento';
import { PartidaStore } from '../../state/partida-store';
import { ROTULOS_DE_MOTIVO, ROTULOS_DE_TIPO } from '../../state/rotulos';

/** Preview interno, com o motivo tipado para a apresentação textual. */
interface Previsao {
  celulas: readonly Coordenada[];
  valido: boolean;
  motivo: string | null;
}

/**
 * Tela de preparação da frota: seleção do tipo, orientação, preview com motivo de invalidez
 * em texto, posicionamento pela âncora e remoção/reposicionamento da embarcação selecionada.
 * O estado de interação é local; o estado do jogo fica na `PartidaStore`.
 */
@Component({
  selector: 'app-preparacao',
  imports: [LucideShip, ListaDeFrota, Tabuleiro],
  templateUrl: './preparacao.html',
})
export class Preparacao {
  protected readonly store = inject(PartidaStore);

  /** Tipo pendente ou posicionado selecionado; `null` quando a frota está completa. */
  protected readonly tipoSelecionado = signal<TipoEmbarcacao | null>(TIPOS_DA_FROTA[0]);

  /** Orientação da embarcação a posicionar. */
  protected readonly orientacao = signal<Orientacao>('horizontal');

  /** Última célula na qual o jogador deixou o ponteiro ou o foco. */
  protected readonly celulaFocada = signal<Coordenada | null>(null);

  /** Motivo textual da rejeição de posicionamento, sempre acompanhado da cor. */
  protected readonly motivoDaRejeicao = signal<string | null>(null);

  /** Tipos de embarcação posicionados no tabuleiro do jogador. */
  protected readonly embarcacoes = computed(() => this.store.tabuleiroJogador().embarcacoes);

  /** Embarcação posicionada do tipo selecionado, para remoção e reposicionamento. */
  protected readonly embarcacaoSelecionada = computed(
    () =>
      this.embarcacoes().find((embarcacao) => embarcacao.tipo === this.tipoSelecionado()) ?? null,
  );

  /** Preview interno, com o motivo tipado para a apresentação textual. */
  private readonly previsaoInterna = computed<Previsao | null>(() => {
    const celula = this.celulaFocada();
    const tipo = this.tipoSelecionado();
    if (celula === null || tipo === null) {
      return null;
    }

    const candidata: Embarcacao = {
      tipo,
      linha: celula.linha,
      coluna: celula.coluna,
      orientacao: this.orientacao(),
    };
    const motivo = validarPosicionamento(candidata, this.store.tabuleiroJogador());
    return {
      celulas: coordenadasDe(candidata),
      valido: motivo === null,
      motivo: motivo === null ? null : ROTULOS_DE_MOTIVO[motivo],
    };
  });

  /** Preview do posicionamento da embarcação selecionada contra o tabuleiro da store. */
  protected readonly previsao = computed<PrevisaoDePosicionamento | null>(() => {
    const previa = this.previsaoInterna();
    return previa === null ? null : { celulas: previa.celulas, valido: previa.valido };
  });

  /** Aviso da região viva: motivo do preview inválido ou da rejeição do último clique. */
  protected readonly aviso = computed(
    () => this.previsaoInterna()?.motivo ?? this.motivoDaRejeicao(),
  );

  protected rotuloDeTipo(tipo: TipoEmbarcacao): string {
    return ROTULOS_DE_TIPO[tipo];
  }

  protected selecionarTipo(tipo: TipoEmbarcacao): void {
    this.tipoSelecionado.set(tipo);
    this.motivoDaRejeicao.set(null);
  }

  protected alternarOrientacao(orientacao: Orientacao): void {
    this.orientacao.set(orientacao);
  }

  protected aoFocar(celula: Coordenada | null): void {
    this.celulaFocada.set(celula);
  }

  /**
   * Clique na âncora: se a célula pertence a outra embarcação, seleciona-a; caso contrário,
   * posiciona a embarcação selecionada na orientação escolhida e avança para o próximo
   * pendente. Um posicionamento inválido mantém tabuleiro e seleção e mostra o motivo em texto.
   */
  protected aoClicarNaCelula(celula: Coordenada): void {
    const chaveDaCelula = chaveCoordenada(celula);
    const ocupante = this.embarcacoes().find((embarcacao) =>
      coordenadasDe(embarcacao).some((outra) => chaveCoordenada(outra) === chaveDaCelula),
    );
    if (ocupante !== undefined) {
      this.selecionarTipo(ocupante.tipo);
      return;
    }

    const tipo = this.tipoSelecionado();
    if (tipo === null) {
      return;
    }

    const candidata: Embarcacao = {
      tipo,
      linha: celula.linha,
      coluna: celula.coluna,
      orientacao: this.orientacao(),
    };
    const resultado = this.store.posicionar(candidata);
    if (resultado.ok) {
      this.motivoDaRejeicao.set(null);
      this.tipoSelecionado.set(this.store.tiposPendentes()[0] ?? null);
    } else {
      this.motivoDaRejeicao.set(ROTULOS_DE_MOTIVO[resultado.motivo]);
    }
  }

  /** Remove a embarcação posicionada selecionada; o tipo segue selecionado como pendente. */
  protected removerSelecionada(): void {
    const tipo = this.tipoSelecionado();
    if (tipo === null || this.embarcacaoSelecionada() === null) {
      return;
    }
    this.store.remover(tipo);
    this.motivoDaRejeicao.set(null);
  }

  protected iniciarBatalha(): void {
    this.store.iniciarBatalha();
  }
}
