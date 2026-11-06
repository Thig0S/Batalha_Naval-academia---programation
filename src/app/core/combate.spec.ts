import { describe, expect, it } from 'vitest';
import { atacar, criarCombate, type EstadoCombate, type Participante } from './combate';
import { sortearAlvo } from './ataque-aleatorio';
import { chaveCoordenada, type Coordenada } from './coordenada';
import { gerarFrotaAleatoria } from './frota-aleatoria';
import { coordenadasDe, type Embarcacao, type Orientacao, type TipoEmbarcacao } from './frota';
import type { Tabuleiro } from './tabuleiro';
import { criarAleatorioFixo } from './testes/aleatorio-fixo';
import { frotaDoComputador, frotaDoJogador } from './testes/frotas';
import { todasAsCoordenadas } from './testes/tiros';

/** Cria um combate de teste a partir das frotas fixas, falhando o teste se forem rejeitadas. */
function combateDeTeste(): EstadoCombate {
  const resultado = criarCombate(frotaDoJogador(), frotaDoComputador());
  if (!resultado.ok) {
    throw new Error('frota de teste rejeitada na criação do combate');
  }
  return resultado.combate;
}

/** Executa um ataque que deve ser aceito, devolvendo o próximo estado. */
function executar(estado: EstadoCombate, atacante: Participante, alvo: Coordenada): EstadoCombate {
  const resultado = atacar(estado, atacante, alvo);
  if (!resultado.ok) {
    throw new Error(`ataque de teste rejeitado: ${resultado.motivo}`);
  }
  return resultado.estado;
}

/** Primeira coordenada do tabuleiro do `defensor` que o atacante ainda não atacou. */
function proximoAlvo(estado: EstadoCombate, defensor: Participante): Coordenada {
  const historico = defensor === 'jogador' ? estado.jogador : estado.computador;
  const atacadas = new Set(
    historico.tirosRecebidos.map((tiro) => chaveCoordenada(tiro.coordenada)),
  );
  for (const coordenada of todasAsCoordenadas()) {
    if (!atacadas.has(chaveCoordenada(coordenada))) {
      return coordenada;
    }
  }
  throw new Error('tabuleiro sem células livres');
}

/** Responde ao ataque do jogador com a próxima célula livre do tabuleiro do jogador. */
function respostaDoComputador(estado: EstadoCombate): EstadoCombate {
  return executar(estado, 'computador', proximoAlvo(estado, 'jogador'));
}

/** Ataca com o jogador a próxima célula livre do tabuleiro do computador. */
function ataqueDoJogador(estado: EstadoCombate): EstadoCombate {
  return executar(estado, 'jogador', proximoAlvo(estado, 'computador'));
}

/** Vitória determinística do jogador: acerta as 17 posições da frota do computador. */
function vitoriaDoJogador(): EstadoCombate {
  let estado = combateDeTeste();
  const alvos = frotaDoComputador().embarcacoes.flatMap((embarcacao) => coordenadasDe(embarcacao));
  for (const celula of alvos.slice(0, -1)) {
    estado = executar(estado, 'jogador', celula);
    estado = respostaDoComputador(estado);
  }
  return executar(estado, 'jogador', alvos[alvos.length - 1]);
}

/** Vitória determinística do computador: acerta as 17 posições da frota do jogador. */
function vitoriaDoComputador(): EstadoCombate {
  let estado = combateDeTeste();
  const alvos = frotaDoJogador().embarcacoes.flatMap((embarcacao) => coordenadasDe(embarcacao));
  for (const celula of alvos.slice(0, -1)) {
    estado = ataqueDoJogador(estado);
    estado = executar(estado, 'computador', celula);
  }
  estado = ataqueDoJogador(estado);
  return executar(estado, 'computador', alvos[alvos.length - 1]);
}

/** Cópia profunda em JSON, para comparar estados sem depender de `structuredClone`. */
function clonar<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T;
}

/** Congela profundamente um valor de teste; qualquer mutação lançaria em modo estrito. */
function congelar<T>(valor: T): T {
  if (valor !== null && typeof valor === 'object') {
    Object.freeze(valor);
    for (const filho of Object.values(valor)) {
      congelar(filho);
    }
  }
  return valor;
}

/** Aplica uma mutação à frota do jogador e devolve a frota resultante para a criação. */
function frotaJogadorInvalida(mutacao: (embarcacoes: Embarcacao[]) => void): Tabuleiro {
  const tabuleiro = frotaDoJogador();
  mutacao(tabuleiro.embarcacoes);
  return tabuleiro;
}

describe('criarCombate', () => {
  it('inicia com históricos vazios, turno do jogador e sem vencedor', () => {
    const resultado = criarCombate(frotaDoJogador(), frotaDoComputador());

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('frotas válidas foram rejeitadas');
    }
    const combate = resultado.combate;
    expect(combate.turno).toBe('jogador');
    expect(combate.vencedor).toBeNull();
    expect(combate.jogador.tirosRecebidos).toEqual([]);
    expect(combate.computador.tirosRecebidos).toEqual([]);
    expect(combate.jogador.tabuleiro.embarcacoes).toHaveLength(5);
    expect(combate.computador.tabuleiro.embarcacoes).toHaveLength(5);
  });

  it('rejeita frota incompleta identificando o jogador, sem alterar as entradas', () => {
    const jogador = frotaJogadorInvalida((embarcacoes) => embarcacoes.pop());
    const copia = clonar(jogador);

    const resultado = criarCombate(jogador, frotaDoComputador());

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
    expect(jogador).toEqual(copia);
  });

  it('rejeita tipo duplicado', () => {
    const resultado = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[4].tipo = 'cruzador';
      }),
      frotaDoComputador(),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita tipo desconhecido', () => {
    const resultado = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[4].tipo = 'lancha' as TipoEmbarcacao;
      }),
      frotaDoComputador(),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita orientação inválida', () => {
    const resultado = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].orientacao = 'diagonal' as Orientacao;
      }),
      frotaDoComputador(),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita âncora com índice não inteiro', () => {
    const resultado = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].linha = 1.5;
      }),
      frotaDoComputador(),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita âncora com índice não finito', () => {
    const comNan = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].coluna = Number.NaN;
      }),
      frotaDoComputador(),
    );
    const comInfinito = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].linha = Number.POSITIVE_INFINITY;
      }),
      frotaDoComputador(),
    );

    expect(comNan).toEqual({ ok: false, motivo: 'frota-invalida', participante: 'jogador' });
    expect(comInfinito).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita posição fora dos limites', () => {
    const paraFora = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].linha = -1;
      }),
      frotaDoComputador(),
    );
    const paraOBotao = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[0].coluna = 10;
      }),
      frotaDoComputador(),
    );

    expect(paraFora).toEqual({ ok: false, motivo: 'frota-invalida', participante: 'jogador' });
    expect(paraOBotao).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('rejeita sobreposição entre embarcações', () => {
    const resultado = criarCombate(
      frotaJogadorInvalida((embarcacoes) => {
        embarcacoes[2] = { tipo: 'cruzador', linha: 1, coluna: 0, orientacao: 'horizontal' };
      }),
      frotaDoComputador(),
    );

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'jogador',
    });
  });

  it('aponta o computador quando é a frota adversária que falha', () => {
    const computadorInvalido = frotaDoComputador();
    computadorInvalido.embarcacoes.pop();

    const resultado = criarCombate(frotaDoJogador(), computadorInvalido);

    expect(resultado).toEqual({
      ok: false,
      motivo: 'frota-invalida',
      participante: 'computador',
    });
  });

  it('preserva as entradas e isola o combate de alterações posteriores', () => {
    const jogador = frotaDoJogador();
    const computador = frotaDoComputador();
    const copia = clonar({ jogador, computador });

    const resultado = criarCombate(jogador, computador);
    if (!resultado.ok) {
      throw new Error('frotas válidas foram rejeitadas');
    }
    expect(jogador).toEqual(copia.jogador);
    expect(computador).toEqual(copia.computador);

    jogador.embarcacoes.pop();
    jogador.embarcacoes[0].linha = 9;
    computador.embarcacoes = [];

    expect(resultado.combate.jogador.tabuleiro.embarcacoes).toEqual(copia.jogador.embarcacoes);
    expect(resultado.combate.computador.tabuleiro.embarcacoes).toEqual(
      copia.computador.embarcacoes,
    );
  });

  it('aceita frotas congeladas sem tentar modificá-las', () => {
    const jogador = congelar(frotaDoJogador());
    const computador = congelar(frotaDoComputador());

    const resultado = criarCombate(jogador, computador);

    expect(resultado.ok).toBe(true);
  });
});

describe('atacar - rejeições', () => {
  it('rejeita coordenada fora dos limites', () => {
    const estado = combateDeTeste();
    const antes = clonar(estado);
    const invalidas: Coordenada[] = [
      { linha: -1, coluna: 0 },
      { linha: 0, coluna: 10 },
      { linha: 10, coluna: 0 },
      { linha: 0, coluna: -1 },
    ];

    for (const coordenada of invalidas) {
      expect(atacar(estado, 'jogador', coordenada)).toEqual({
        ok: false,
        motivo: 'coordenada-invalida',
      });
    }
    expect(estado).toEqual(antes);
  });

  it('rejeita índice fracionário', () => {
    const estado = combateDeTeste();

    expect(atacar(estado, 'jogador', { linha: 0.5, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'coordenada-invalida',
    });
    expect(atacar(estado, 'jogador', { linha: 0, coluna: 2.5 })).toEqual({
      ok: false,
      motivo: 'coordenada-invalida',
    });
  });

  it('rejeita índice não finito', () => {
    const estado = combateDeTeste();

    expect(atacar(estado, 'jogador', { linha: Number.NaN, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'coordenada-invalida',
    });
    expect(atacar(estado, 'jogador', { linha: 0, coluna: Number.POSITIVE_INFINITY })).toEqual({
      ok: false,
      motivo: 'coordenada-invalida',
    });
  });

  it('rejeita coordenada já atacada pelo mesmo participante', () => {
    let estado = combateDeTeste();
    estado = executar(estado, 'jogador', { linha: 0, coluna: 0 });
    estado = executar(estado, 'computador', { linha: 0, coluna: 0 });
    const antes = clonar(estado);

    const repetido = atacar(estado, 'jogador', { linha: 0, coluna: 0 });

    expect(repetido).toEqual({ ok: false, motivo: 'coordenada-ja-atacada' });
    expect(estado).toEqual(antes);
  });

  it('rejeita ataque fora da vez', () => {
    const estado = combateDeTeste();
    const antes = clonar(estado);
    expect(atacar(estado, 'computador', { linha: 0, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'turno-incorreto',
    });

    const aposAtaqueDoJogador = executar(estado, 'jogador', { linha: 0, coluna: 0 });
    const aposRejeicao = clonar(aposAtaqueDoJogador);
    expect(atacar(aposAtaqueDoJogador, 'jogador', { linha: 1, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'turno-incorreto',
    });
    expect(aposAtaqueDoJogador).toEqual(aposRejeicao);
    expect(estado).toEqual(antes);
  });

  it('valida o encerramento antes do turno e da coordenada', () => {
    const encerrado = vitoriaDoJogador();

    expect(atacar(encerrado, 'computador', { linha: -1, coluna: -1 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
    expect(atacar(encerrado, 'jogador', { linha: 0, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
  });

  it('valida o turno antes da coordenada', () => {
    const estado = combateDeTeste();

    expect(atacar(estado, 'computador', { linha: -1, coluna: -1 })).toEqual({
      ok: false,
      motivo: 'turno-incorreto',
    });
  });

  it('rejeita qualquer ataque depois do término, preservando o estado', () => {
    const encerrado = vitoriaDoJogador();
    const antes = clonar(encerrado);

    expect(atacar(encerrado, 'jogador', { linha: 5, coluna: 5 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
    expect(atacar(encerrado, 'computador', { linha: 5, coluna: 5 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
    expect(encerrado).toEqual(antes);
  });
});

describe('atacar - transições', () => {
  it('registra o ataque no tabuleiro adversário e preserva o histórico do atacante', () => {
    const estado = combateDeTeste();
    const alvo = { linha: 0, coluna: 0 };

    const resultado = atacar(estado, 'jogador', alvo);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error(`ataque válido rejeitado: ${resultado.motivo}`);
    }
    expect(resultado.estado.computador.tirosRecebidos).toHaveLength(1);
    expect(resultado.estado.computador.tirosRecebidos[0]).toEqual({
      coordenada: alvo,
      resultado: 'agua',
    });
    expect(resultado.estado.computador.tirosRecebidos[0]).toEqual(resultado.tiro);
    expect(resultado.estado.jogador.tirosRecebidos).toEqual([]);
    expect(resultado.estado.jogador.tabuleiro).toBe(estado.jogador.tabuleiro);
  });

  it('alterna para o computador após um ataque na água', () => {
    const resultado = atacar(combateDeTeste(), 'jogador', { linha: 0, coluna: 0 });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('ataque válido rejeitado');
    }
    expect(resultado.estado.turno).toBe('computador');
    expect(resultado.estado.vencedor).toBeNull();
  });

  it('não concede ataque extra ao jogador quando o ataque acerta', () => {
    const resultado = atacar(combateDeTeste(), 'jogador', { linha: 0, coluna: 5 });

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) {
      throw new Error('ataque válido rejeitado');
    }
    expect(resultado.tiro.resultado).toBe('acerto');
    expect(resultado.estado.computador.tirosRecebidos[0].resultado).toBe('acerto');
    expect(resultado.estado.turno).toBe('computador');
    expect(resultado.estado.vencedor).toBeNull();
  });

  it('devolve o turno ao jogador depois do ataque do computador', () => {
    const aposJogador = executar(combateDeTeste(), 'jogador', { linha: 0, coluna: 5 });

    const aposComputador = executar(aposJogador, 'computador', { linha: 0, coluna: 0 });

    expect(aposComputador.turno).toBe('jogador');
    expect(aposComputador.jogador.tirosRecebidos).toHaveLength(1);
    expect(aposComputador.computador.tirosRecebidos).toHaveLength(1);
  });

  it('alterna o turno mesmo quando o ataque destrói uma embarcação', () => {
    let estado = combateDeTeste();
    estado = executar(estado, 'jogador', { linha: 8, coluna: 5 });
    estado = executar(estado, 'computador', { linha: 0, coluna: 0 });

    estado = executar(estado, 'jogador', { linha: 8, coluna: 6 });

    const destruido = estado.computador.tirosRecebidos[1];
    expect(destruido.resultado).toBe('destruido');
    expect(destruido.tipo).toBe('destroyer');
    expect(estado.turno).toBe('computador');
    expect(estado.vencedor).toBeNull();
  });

  it('não altera o estado nem a coordenada recebidos, mesmo congelados', () => {
    const estado = congelar(combateDeTeste());
    const alvo = congelar({ linha: 0, coluna: 5 });
    const antes = clonar(estado);

    const resultado = atacar(estado, 'jogador', alvo);

    expect(resultado.ok).toBe(true);
    expect(estado).toEqual(antes);
    expect(alvo).toEqual({ linha: 0, coluna: 5 });
    if (resultado.ok) {
      expect(resultado.tiro.coordenada).not.toBe(alvo);
    }
  });
});

describe('vitória e término', () => {
  it('encerra com a vitória do jogador, sem turno ativo nem ataque seguinte', () => {
    const encerrado = vitoriaDoJogador();

    expect(encerrado.vencedor).toBe('jogador');
    expect(encerrado.turno).toBeNull();
    expect(encerrado.computador.tirosRecebidos).toHaveLength(17);
    expect(encerrado.computador.tirosRecebidos[16].resultado).toBe('destruido');
    expect(atacar(encerrado, 'computador', { linha: 0, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
  });

  it('encerra com a vitória do computador e sem turno ativo', () => {
    const encerrado = vitoriaDoComputador();

    expect(encerrado.vencedor).toBe('computador');
    expect(encerrado.turno).toBeNull();
    expect(encerrado.jogador.tirosRecebidos).toHaveLength(17);
    expect(encerrado.jogador.tirosRecebidos[16].resultado).toBe('destruido');
    expect(atacar(encerrado, 'jogador', { linha: 0, coluna: 0 })).toEqual({
      ok: false,
      motivo: 'combate-encerrado',
    });
  });

  it('cria outro combate independente depois do término', () => {
    const encerrado = vitoriaDoJogador();

    const novo = combateDeTeste();

    expect(novo.turno).toBe('jogador');
    expect(novo.vencedor).toBeNull();
    expect(novo.jogador.tirosRecebidos).toEqual([]);
    expect(novo.computador.tirosRecebidos).toEqual([]);
    expect(encerrado.vencedor).toBe('jogador');
  });
});

describe('simulação de partidas completas', () => {
  /** Joga até o vencedor, sorteando alvos e verificando alternância, unicidade e imutabilidade. */
  function simular(semente: number): { ataques: number; vencedor: Participante } {
    const geradorDeFrota = criarAleatorioFixo(semente);
    const criacao = criarCombate(
      gerarFrotaAleatoria(geradorDeFrota),
      gerarFrotaAleatoria(geradorDeFrota),
    );
    if (!criacao.ok) {
      throw new Error('frota gerada rejeitada na criação do combate');
    }

    const geradorDeAtaque = criarAleatorioFixo(semente + 1000);
    const atacadas: Record<Participante, Set<string>> = {
      jogador: new Set(),
      computador: new Set(),
    };
    const anteriores: { estado: EstadoCombate; copia: EstadoCombate }[] = [];
    let estado = criacao.combate;
    let ataques = 0;
    let esperado: Participante = 'jogador';

    while (estado.vencedor === null) {
      const atacante = estado.turno;
      if (atacante === null) {
        throw new Error('combate ativo sem turno ativo');
      }
      expect(atacante).toBe(esperado);

      const defensor = atacante === 'jogador' ? estado.computador : estado.jogador;
      const alvo = sortearAlvo(defensor.tirosRecebidos, geradorDeAtaque);
      if (alvo === null) {
        throw new Error('sem alvos antes do fim da partida');
      }
      const chave = chaveCoordenada(alvo);
      expect(atacadas[atacante].has(chave)).toBe(false);
      atacadas[atacante].add(chave);

      const antes = clonar(estado);
      const resultado = atacar(estado, atacante, alvo);
      expect(resultado.ok).toBe(true);
      if (!resultado.ok) {
        throw new Error(`ataque da simulação rejeitado: ${resultado.motivo}`);
      }
      anteriores.push({ estado, copia: antes });
      estado = resultado.estado;
      ataques += 1;
      esperado = atacante === 'jogador' ? 'computador' : 'jogador';
    }

    const vencedor = estado.vencedor;
    if (vencedor === null) {
      throw new Error('simulação terminou sem vencedor');
    }
    expect(ataques).toBeLessThanOrEqual(199);
    for (const item of anteriores) {
      expect(item.estado).toEqual(item.copia);
    }
    return { ataques, vencedor };
  }

  it('termina partidas com várias sementes em até 199 ataques válidos', () => {
    for (const semente of [1, 7, 42, 2026]) {
      const { ataques, vencedor } = simular(semente);

      expect(ataques).toBeGreaterThanOrEqual(33);
      expect(ataques).toBeLessThanOrEqual(199);
      expect(['jogador', 'computador']).toContain(vencedor);
    }
  });
});
