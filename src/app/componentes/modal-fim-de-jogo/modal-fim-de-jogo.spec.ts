import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ModalFimDeJogo } from './modal-fim-de-jogo';

/** Fixture do pop-up com o vencedor informado, já renderizado e estável. */
async function renderizar(vencedor: 'jogador' | 'computador') {
  await TestBed.configureTestingModule({ imports: [ModalFimDeJogo] });
  const fixture = TestBed.createComponent(ModalFimDeJogo);
  fixture.componentRef.setInput('vencedor', vencedor);
  await fixture.whenStable();
  return fixture;
}

function elementos(
  fixture: ReturnType<typeof TestBed.createComponent<ModalFimDeJogo>>,
): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

/** Botão do diálogo cujo texto contém o rótulo indicado. */
function botao(elemento: HTMLElement, rotulo: string): HTMLButtonElement {
  const encontrado = [...elemento.querySelectorAll<HTMLButtonElement>('button')].find((botao) =>
    botao.textContent?.includes(rotulo),
  );
  if (encontrado === undefined) {
    throw new Error(`Botão "${rotulo}" não encontrado.`);
  }
  return encontrado;
}

describe('ModalFimDeJogo', () => {
  it('anuncia a vitória do jogador quando ele vence', async () => {
    const fixture = await renderizar('jogador');

    const dialogo = elementos(fixture).querySelector('[role="dialog"]');
    expect(dialogo).not.toBeNull();
    expect(dialogo?.textContent).toContain('Você venceu a partida!');
    expect(dialogo?.textContent).not.toContain('O computador venceu a partida.');
  });

  it('anuncia a derrota do jogador quando o computador vence', async () => {
    const fixture = await renderizar('computador');

    const dialogo = elementos(fixture).querySelector('[role="dialog"]');
    expect(dialogo).not.toBeNull();
    expect(dialogo?.textContent).toContain('O computador venceu a partida.');
    expect(dialogo?.textContent).not.toContain('Você venceu a partida!');
  });

  it('rotula o diálogo acessivelmente com aria-modal e título associado', async () => {
    const fixture = await renderizar('jogador');
    const elemento = elementos(fixture);

    const dialogo = elemento.querySelector('[role="dialog"]');
    expect(dialogo).not.toBeNull();
    expect(dialogo?.getAttribute('aria-modal')).toBe('true');

    const rotulo = dialogo?.getAttribute('aria-labelledby');
    expect(rotulo).toBe('titulo-fim-de-jogo');
    const titulo = elemento.querySelector('#titulo-fim-de-jogo');
    expect(titulo).not.toBeNull();
    expect(titulo?.textContent).toContain('Você venceu a partida!');
  });

  it('emite jogarNovamente, prepararNovaFrota e fechar ao clicar nos botões', async () => {
    const fixture = await renderizar('jogador');
    const elemento = elementos(fixture);

    const emitidos: string[] = [];
    fixture.componentInstance.jogarNovamente.subscribe(() => emitidos.push('jogarNovamente'));
    fixture.componentInstance.prepararNovaFrota.subscribe(() => emitidos.push('prepararNovaFrota'));
    fixture.componentInstance.fechar.subscribe(() => emitidos.push('fechar'));

    botao(elemento, 'Jogar novamente').click();
    botao(elemento, 'Preparar nova frota').click();
    botao(elemento, 'Fechar').click();

    expect(emitidos).toEqual(['jogarNovamente', 'prepararNovaFrota', 'fechar']);
  });

  it('foca o painel do diálogo logo após a renderização', async () => {
    const fixture = await renderizar('jogador');
    await fixture.whenStable();

    const painel = elementos(fixture).querySelector('[role="dialog"]');
    expect(painel).not.toBeNull();
    expect(document.activeElement).toBe(painel);
  });

  it('emite fechar ao pressionar Esc no overlay', async () => {
    const fixture = await renderizar('jogador');
    const elemento = elementos(fixture);

    const emitidos: string[] = [];
    fixture.componentInstance.fechar.subscribe(() => emitidos.push('fechar'));

    const overlay = elemento.firstElementChild;
    if (overlay === null) {
      throw new Error('Overlay do pop-up não encontrado.');
    }
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(emitidos).toEqual(['fechar']);
  });
});
