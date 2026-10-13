/**
 * Convierte "qué modo hay y a qué tempo" en tres números que el resto de la escena usa
 * para moverse con la música. No toca ningún objeto: solo calcula.
 */
import { approach } from "../lib/math.js";

/** Segundos de espera tras dar Play antes de empezar a marcar el ritmo. */
const START_DELAY = 0.8;
const BEATS_PER_PHRASE = 8;

export function createRhythm() {
  const state = {
    /** 0 = lofi, 1 = bachata. Cambia suave para que las luces no salten. */
    mix: 0,
    /** Golpe de cada tiempo: sube a 1 y cae rápido. */
    beatLevel: 0,
    /** Balanceo lateral: positivo hacia un lado, negativo hacia el otro. */
    sway: 0,
  };
  let lastMode = "lofi";
  let modeChangedAt = 0;

  /**
   * @param {number} dt segundos desde el frame anterior
   * @param {number} t segundos desde que empezó la escena
   * @param {"lofi" | "bachata"} mode
   * @param {number} bpm
   */
  function update(dt, t, mode, bpm) {
    if (mode !== lastMode) {
      lastMode = mode;
      modeChangedAt = t;
    }
    const isDancing = mode === "bachata";
    state.mix = approach(state.mix, isDancing ? 1 : 0, 1.8, dt);

    // Bachata: frases de 8 tiempos, "1-2-3-tap" hacia cada lado. El tap pega más suave.
    let targetBeat = 0;
    let targetSway = 0;
    if (isDancing && t - modeChangedAt > START_DELAY) {
      const beats = (t * bpm) / 60;
      const step = Math.floor(beats) % BEATS_PER_PHRASE;
      const stepInSide = step % 4; // 0, 1, 2 = pasos; 3 = tap
      const phase = beats % 1; // 0 justo en el golpe, casi 1 antes del siguiente
      targetBeat = Math.exp(-phase * 5) * (stepInSide === 3 ? 0.4 : 1);
      targetSway = (step < 4 ? 1 : -1) * Math.min(stepInSide, 2.5) * 0.4;
    }
    state.beatLevel = approach(state.beatLevel, targetBeat, 16, dt);
    state.sway = approach(state.sway, targetSway, 3.5, dt);
    return state;
  }

  return { update };
}
