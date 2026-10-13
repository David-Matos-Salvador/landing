/**
 * Detector de golpes ("onsets"). Recibe, frame a frame, qué tan fuerte suena el bajo
 * (amplitud lineal, de 0 a ~1)
 * y responde si en ese instante hubo un golpe. No sabe nada de audio ni del navegador:
 * solo compara números, por eso se puede probar con datos inventados (ver onset.test.js).
 *
 * Idea: un golpe es un momento en que el volumen sube de pronto por encima de lo "normal".
 * Lo normal se calcula como un promedio que se va adaptando a la canción.
 */

/**
 * El nivel debe superar al promedio por este factor para contar como golpe. Medido con las
 * canciones de la playlist: con 1.3 una bachata comercial (bajo siempre alto) daba golpes de
 * más; con 1.5 da ~128 por minuto, su tempo real.
 */
const RATIO_OVER_AVERAGE = 1.5;
/** Por debajo de esto es casi silencio: se ignora aunque supere al promedio. */
const MIN_LEVEL = 0.005;
/** Segundos mínimos entre golpes (0.24 s = 250 golpes por minuto como máximo). */
const MIN_GAP = 0.24;
/** Qué tan rápido se adapta el promedio (más alto = olvida antes lo anterior). */
const AVERAGE_RATE = 1.5;

export function createOnsetDetector() {
  let average = 0;
  let previous = 0;
  let lastOnsetAt = -Infinity;

  /**
   * @param {number} level amplitud del bajo en este frame, de 0 a ~1
   * @param {number} t segundos desde que empezó la escena
   * @param {number} dt segundos desde el frame anterior
   * @returns {boolean} true si en este frame hay un golpe
   */
  function detect(level, t, dt) {
    const isLoud = level > MIN_LEVEL && level > average * RATIO_OVER_AVERAGE;
    const isRising = level > previous;
    const hasWaited = t - lastOnsetAt > MIN_GAP;
    const isOnset = isLoud && isRising && hasWaited;

    if (isOnset) lastOnsetAt = t;
    average += (level - average) * Math.min(1, dt * AVERAGE_RATE);
    previous = level;
    return isOnset;
  }

  return { detect };
}
