import { InjectionToken } from '@angular/core';

/**
 * Gerador de números aleatórios injetável, usado pela store para gerar a frota do computador.
 * A dependência de `Math.random` é provida em `app.config.ts`, e os testes sobrescrevem o token
 * com um PRNG fixo para favorecer o determinismo.
 */
export const ALEATORIO = new InjectionToken<() => number>('ALEATORIO');
