/**
 * Convierte la música en dos números que el resto de la escena usa. No toca ningún objeto:
 * solo calcula.
 *
 *   mix        0 = lofi, 1 = bachata. Sube y baja suave al dar Play o Pausa.
 *   beatLevel  El "destello" de cada golpe: salta a 1 cuando hay un golpe y cae rápido a 0.
 *
 * Para saber cuándo hay un golpe tiene dos fuentes:
 *   1. El audio real (ui/audioMeter.js): los golpes de la canción que está sonando.
 *   2. Un metrónomo con el "bpm" de la playlist: respaldo si el navegador no deja analizar.
 */
import { approach } from "../lib/math.js";

/** Qué tan rápido se apaga el destello de cada golpe (más alto = destello más corto). */
const PULSE_DECAY = 5;
/** Qué tan rápido cambia `mix` al dar Play o Pausa (más alto = transición más corta). */
const MIX_RATE = 1.8;
/** Qué tan rápido sigue `beatLevel` al destello. Alto: debe sentirse instantáneo. */
const BEAT_RATE = 16;

export function createRhythm() {
  const state = { mix: 0, beatLevel: 0 };
  /** Destello "crudo": 1 justo en el golpe, y se va apagando solo. */
  let pulse = 0;

  /**
   * @param {object} frame
   * @param {number} frame.dt segundos desde el frame anterior
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {"lofi" | "bachata"} frame.mode
   * @param {number} frame.bpm tempo de la canción, para el metrónomo de respaldo
   * @param {{ bass: number, isOnset: boolean } | null} frame.audio lo que entrega player.readAudio()
   */
  function update({ dt, t, mode, bpm, audio }) {
    const isPlaying = mode === "bachata";
    state.mix = approach(state.mix, isPlaying ? 1 : 0, MIX_RATE, dt);

    if (!isPlaying) {
      pulse = 0;
    } else if (audio) {
      // Fuente 1: el audio real. Si en este frame hubo un golpe, el destello vuelve a 1.
      if (audio.isOnset) pulse = 1;
      else pulse *= Math.exp(-dt * PULSE_DECAY); // si no, se apaga un poco
    } else {
      // Fuente 2: metrónomo. `phase` va de 0 (justo en el golpe) a casi 1 (antes del siguiente).
      const beats = (t * bpm) / 60;
      const phase = beats % 1;
      pulse = Math.exp(-phase * PULSE_DECAY);
    }

    state.beatLevel = approach(state.beatLevel, pulse, BEAT_RATE, dt);
    return state;
  }

  return { update };
}
