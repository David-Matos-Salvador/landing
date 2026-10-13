/**
 * Convierte la música en tres números que el resto de la escena usa para moverse.
 * No toca ningún objeto: solo calcula.
 *
 * Tiene dos fuentes para saber cuándo hay un golpe:
 *   1. El audio real (ui/audioMeter.js): la luz sigue los golpes de la canción que suena.
 *   2. Un metrónomo con el "bpm" de la playlist: respaldo si el navegador no deja analizar.
 */
import { approach } from "../lib/math.js";

/** Segundos de espera tras dar Play antes de que el metrónomo empiece a marcar. */
const METRONOME_START_DELAY = 0.8;
const BEATS_PER_PHRASE = 8;
/** Qué tan rápido se apaga el destello de cada golpe (más alto = más corto). */
const PULSE_DECAY = 5;
/** El cuarto tiempo de la bachata (el "tap") se marca más suave. */
const TAP_STRENGTH = 0.4;

/**
 * Bachata: frases de 8 tiempos, "1-2-3-tap" hacia un lado y luego hacia el otro.
 * @param {number} beatNumber cuántos golpes van
 * @returns {{ sway: number, isTap: boolean }} hacia dónde se inclina el cuerpo en ese golpe
 */
function danceStep(beatNumber) {
  const step = beatNumber % BEATS_PER_PHRASE;
  const stepInSide = step % 4; // 0, 1, 2 = pasos; 3 = tap
  const side = step < 4 ? 1 : -1;
  return { sway: side * Math.min(stepInSide, 2.5) * 0.4, isTap: stepInSide === 3 };
}

export function createRhythm() {
  const state = {
    /** 0 = lofi, 1 = bachata. Cambia suave para que las luces no salten. */
    mix: 0,
    /** Destello de cada golpe: sube a 1 y cae rápido. */
    beatLevel: 0,
    /** Balanceo lateral: positivo hacia un lado, negativo hacia el otro. */
    sway: 0,
  };
  let lastMode = "lofi";
  let modeChangedAt = 0;
  let heardBeats = 0; // golpes detectados en el audio desde que empezó a sonar
  let pulse = 0; // destello del último golpe detectado

  /**
   * @param {object} frame
   * @param {number} frame.dt segundos desde el frame anterior
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {"lofi" | "bachata"} frame.mode
   * @param {number} frame.bpm tempo de la canción, para el metrónomo de respaldo
   * @param {{ bass: number, isOnset: boolean } | null} frame.audio lo que entrega player.readAudio()
   */
  function update({ dt, t, mode, bpm, audio }) {
    if (mode !== lastMode) {
      lastMode = mode;
      modeChangedAt = t;
      heardBeats = 0;
      pulse = 0;
    }
    const isDancing = mode === "bachata";
    state.mix = approach(state.mix, isDancing ? 1 : 0, 1.8, dt);

    let targetBeat = 0;
    let targetSway = 0;
    if (isDancing && audio) {
      // Fuente 1: el audio real. Cada golpe detectado enciende el destello y avanza un paso.
      if (audio.isOnset) {
        pulse = 1;
        heardBeats++;
      }
      pulse *= Math.exp(-dt * PULSE_DECAY);
      targetBeat = pulse;
      targetSway = heardBeats > 0 ? danceStep(heardBeats - 1).sway : 0;
    } else if (isDancing && t - modeChangedAt > METRONOME_START_DELAY) {
      // Fuente 2: metrónomo. `beats` cuenta tiempos con decimales según el tempo.
      const beats = (t * bpm) / 60;
      const phase = beats % 1; // 0 justo en el golpe, casi 1 antes del siguiente
      const { sway, isTap } = danceStep(Math.floor(beats));
      targetBeat = Math.exp(-phase * PULSE_DECAY) * (isTap ? TAP_STRENGTH : 1);
      targetSway = sway;
    }
    state.beatLevel = approach(state.beatLevel, targetBeat, 16, dt);
    state.sway = approach(state.sway, targetSway, 3.5, dt);
    return state;
  }

  return { update };
}
