/** Funciones matemáticas pequeñas que usan varias partes de la escena. */

/** Curva en "S": empieza y termina suave. Espera un valor entre 0 y 1. */
export const smoothstep = (x) => x * x * (3 - 2 * x);

/**
 * Acerca `current` a `target` un poco en cada frame (movimiento amortiguado).
 * `rate` más alto = llega más rápido. Multiplicar por `dt` lo hace independiente de los FPS.
 */
export const approach = (current, target, rate, dt) => current + (target - current) * Math.min(1, dt * rate);
