import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TipoEmbarcacao } from '../../core/frota';
import { ListaDeFrota } from './lista-de-frota';

/** Dois tipos posicionados e três pendentes, para verificar os estados. */
const PENDENTES: readonly TipoEmbarcacao[] = ['porta-avioes', 'submarino', 'destroyer'];

async function renderizar(selecionado: TipoEmbarcacao | null = null, pendentes = PENDENTES) {
  await TestBed.configureTestingModule({ imports: [ListaDeFrota] });
  const fixture = TestBed.createComponent(ListaDeFrota);
  fixture.componentRef.setInput('pendentes', pendentes);
  if (selecionado !== null) {
    fixture.componentRef.setInput('selecionado', selecionado);
  }
  await fixture.whenStable();
  return fixture;
}

function elementos(fixture: ReturnType<typeof TestBed.createComponent<ListaDeFrota>>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

describe('ListaDeFrota', () => {
  it('lista os cinco tipos marcados como pendentes ou posicionados', async () => {
    const fixture = await renderizar();
    const texto = elementos(fixture).textContent ?? '';

    const itens = elementos(fixture).querySelectorAll('[aria-pressed]');
    expect(itens).toHaveLength(5);
    expect([...itens].filter((item) => item.textContent?.includes('Pendente'))).toHaveLength(3);
    expect([...itens].filter((item) => item.textContent?.includes('Posicionado'))).toHaveLength(2);
    expect(texto).toContain('Encouraçado');
  });

  it('emite o tipo clicado para seleção', async () => {
    const fixture = await renderizar();

    const emitidos: TipoEmbarcacao[] = [];
    fixture.componentInstance.selecao.subscribe((tipo) => emitidos.push(tipo));

    const encouracado = [
      ...elementos(fixture).querySelectorAll<HTMLButtonElement>('[aria-pressed]'),
    ].find((item) => item.textContent?.includes('Encouraçado'));
    if (!encouracado) {
      throw new Error('Item do encouraçado não encontrado.');
    }
    encouracado.click();

    expect(emitidos).toEqual(['encouracado']);
  });

  it('emite a remoção do tipo posicionado selecionado e nada quando o selecionado é pendente', async () => {
    const fixture = await renderizar('encouracado');

    const emitidos: TipoEmbarcacao[] = [];
    fixture.componentInstance.remocao.subscribe((tipo) => emitidos.push(tipo));

    let botoes = [...elementos(fixture).querySelectorAll<HTMLButtonElement>('button')];
    const remover = botoes.find((botao) => botao.textContent?.includes('Remover'));
    if (!remover) {
      throw new Error('Botão de remoção não encontrado.');
    }
    remover.click();
    expect(emitidos).toEqual(['encouracado']);

    fixture.componentRef.setInput('selecionado', 'porta-avioes');
    await fixture.whenStable();
    botoes = [...elementos(fixture).querySelectorAll<HTMLButtonElement>('button')];
    expect(botoes.filter((botao) => botao.textContent?.includes('Remover'))).toHaveLength(0);
  });
});
