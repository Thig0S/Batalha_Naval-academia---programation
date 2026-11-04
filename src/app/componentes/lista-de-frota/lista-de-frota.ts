import { Component, computed, input, output } from '@angular/core';
import { TipoEmbarcacao, TAMANHOS, TIPOS_DA_FROTA } from '../../core/frota';
import { ROTULOS_DE_TIPO } from '../../state/rotulos';

/**
 * Lista pura de apresentação dos cinco tipos da frota, marcados como pendentes ou posicionados,
 * com seleção por clique e botão de remoção para o posicionado selecionado.
 */
@Component({
  selector: 'app-lista-de-frota',
  templateUrl: './lista-de-frota.html',
})
export class ListaDeFrota {
  /** Tipos ainda não posicionados; os demais da frota aparecem como posicionados. */
  readonly pendentes = input<readonly TipoEmbarcacao[]>([]);

  /** Tipo selecionado atualmente, pendente ou posicionado. */
  readonly selecionado = input<TipoEmbarcacao | null>(null);

  /** Tipo escolhido pelo clique. */
  readonly selecao = output<TipoEmbarcacao>();

  /** Pedido de remoção do tipo posicionado selecionado. */
  readonly remocao = output<TipoEmbarcacao>();

  protected readonly tipos = TIPOS_DA_FROTA;

  protected readonly tamanhos = TAMANHOS;

  protected readonly rotulos = ROTULOS_DE_TIPO;

  protected readonly chavesPendentes = computed(() => new Set(this.pendentes()));

  protected pendente(tipo: TipoEmbarcacao): boolean {
    return this.chavesPendentes().has(tipo);
  }

  protected pedirRemocao(tipo: TipoEmbarcacao): void {
    this.remocao.emit(tipo);
  }

  protected classesDoItem(tipo: TipoEmbarcacao): string {
    const base =
      'flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-acerto';
    return this.selecionado() === tipo
      ? `${base} border-acerto bg-acerto/10 text-slate-100`
      : `${base} border-tabuleiro-borda bg-slate-900/40 text-slate-300 hover:border-slate-500`;
  }
}
