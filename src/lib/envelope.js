/**
 * "Envolvente" del volumen: convierte el volumen crudo de cada frame (que salta mucho y
 * depende de qué tan fuerte esté grabada la canción) en un número estable de 0 a 1 que dice
 * "qué tan intensa está la canción ahora, comparada con su parte más fuerte".
 * Números puros, sin audio ni navegador: se prueba en envelope.test.js.
 */

/** Qué tan rápido "olvida" el pico más alto, por si la canción baja para siempre. */
const PEAK_FORGET_RATE = 0.05;
/** Por debajo de esta fracción del pico se considera "apagado": da contraste a la luz. */
const FLOOR = 0.3;
/** La luz sube rápido con la música y baja más lento: así no parpadea. */
const RISE_RATE = 14;
const FALL_RATE = 4;

export function createEnvelope() {
  let peak = 0;
  let energy = 0;

  /**
   * @param {number} loudness volumen de este frame (cualquier escala, mayor = más fuerte)
   * @param {number} dt segundos desde el frame anterior
   * @returns {number} intensidad de 0 (silencio) a 1 (la parte más fuerte de la canción)
   */
  function follow(loudness, dt) {
    // El pico sube al instante con un sonido fuerte y baja muy despacio.
    peak = Math.max(loudness, peak * Math.exp(-dt * PEAK_FORGET_RATE));
    const relative = peak > 0 ? loudness / peak : 0;
    const target = Math.max(0, (relative - FLOOR) / (1 - FLOOR));

    const rate = target > energy ? RISE_RATE : FALL_RATE;
    energy += (target - energy) * Math.min(1, dt * rate);
    return energy;
  }

  function reset() {
    peak = 0;
    energy = 0;
  }

  return { follow, reset };
}
