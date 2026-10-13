/**
 * Convierte la música en tres números que el resto de la escena usa. No toca ningún objeto:
 * solo calcula.
 *
 *   mix        0 = lofi, 1 = bachata. Sube y baja suave al dar Play o Pausa.
 *   energy     Qué tan intensa está la canción ahora, de 0 a 1. Decide el BRILLO de la luz:
 *              baja en las partes suaves y sube en el coro.
 *   beatLevel  El acento de cada golpe: salta a 1 cuando hay un golpe y cae rápido a 0.
 *              Hace que la luz LATA con el ritmo.
 *
 * Tiene dos fuentes:
 *   1. El audio real (ui/audioMeter.js): el volumen y los golpes de la canción que suena.
 *   2. Un metrónomo con el "bpm" de la playlist: respaldo si el navegador no deja analizar.
 */
import { createEnvelope } from "../lib/envelope.js";
import { approach } from "../lib/math.js";

/** Qué tan rápido se apaga el acento de cada golpe (más alto = acento más corto). */
const PULSE_DECAY = 5;
/** Qué tan rápido cambia `mix` al dar Play o Pausa (más alto = transición más corta). */
const MIX_RATE = 1.8;
/** Qué tan rápido sigue `beatLevel` al acento. Alto: debe sentirse instantáneo. */
const BEAT_RATE = 16;
/** Intensidad fija que usa el metrónomo, porque sin audio no sabemos el volumen. */
const METRONOME_ENERGY = 0.7;

export function createRhythm() {
  const state = { mix: 0, energy: 0, beatLevel: 0 };
  const envelope = createEnvelope();
  /** Acento "crudo": 1 justo en el golpe, y se va apagando solo. */
  let pulse = 0;

  /**
   * @param {object} frame
   * @param {number} frame.dt segundos desde el frame anterior
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {"lofi" | "bachata"} frame.mode
   * @param {number} frame.bpm tempo de la canción, para el metrónomo de respaldo
   * @param {{ loudness: number, isOnset: boolean } | null} frame.audio lo que entrega player.readAudio()
   */
  function update({ dt, t, mode, bpm, audio }) {
    const isPlaying = mode === "bachata";
    state.mix = approach(state.mix, isPlaying ? 1 : 0, MIX_RATE, dt);

    if (!isPlaying) {
      pulse = 0;
      state.energy = 0;
      envelope.reset(); // la próxima canción empieza a medirse desde cero
    } else if (audio) {
      // Fuente 1: el audio real.
      state.energy = envelope.follow(audio.loudness, dt);
      if (audio.isOnset)
        pulse = 1; // hubo un golpe: acento completo
      else pulse *= Math.exp(-dt * PULSE_DECAY); // si no, se apaga un poco
    } else {
      // Fuente 2: metrónomo. `phase` va de 0 (justo en el golpe) a casi 1 (antes del siguiente).
      const phase = ((t * bpm) / 60) % 1;
      pulse = Math.exp(-phase * PULSE_DECAY);
      state.energy = METRONOME_ENERGY;
    }

    state.beatLevel = approach(state.beatLevel, pulse, BEAT_RATE, dt);
    return state;
  }

  return { update };
}
