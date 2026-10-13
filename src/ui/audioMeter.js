/**
 * "Escucha" la música: usa la Web Audio API del navegador para medir, en cada frame, qué
 * tan fuerte suena el bajo de la canción, y avisa cuando hay un golpe.
 *
 * Cómo se conecta el audio:
 *   <audio>  ──►  analizador (mide, no modifica)  ──►  parlantes
 */
import { createOnsetDetector } from "../lib/onset.js";

/** Tamaño del análisis: divide el sonido en 512 bandas de frecuencia, de graves a agudos. */
const FFT_SIZE = 1024;
/** Bandas que cuentan como "bajo": de ~45 a ~170 Hz (bombo y bajo). */
const BASS_BANDS = { from: 1, to: 4 };
/** Sin suavizado: queremos ver cada golpe tal cual, no un promedio de varios frames. */
const SMOOTHING = 0;

/** Decibelios → potencia lineal. En decibelios un golpe fuerte "se aplana"; en lineal resalta. */
const powerOf = (decibels) => 10 ** (decibels / 10);

/** @param {HTMLAudioElement} audio */
export function createAudioMeter(audio) {
  /** @type {AnalyserNode | null} */
  let analyser = null;
  /** @type {AudioContext | null} */
  let context = null;
  /** @type {Float32Array | null} */
  let bands = null;
  const detector = createOnsetDetector();

  /**
   * Prepara el análisis. Hay que llamarlo desde un clic: los navegadores no dejan iniciar
   * audio sin una acción de la persona. Llamarlo varias veces no hace daño.
   */
  function start() {
    try {
      if (!context) {
        context = new AudioContext();
        analyser = context.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = SMOOTHING;
        bands = new Float32Array(analyser.frequencyBinCount);
        context.createMediaElementSource(audio).connect(analyser).connect(context.destination);
      }
      // El contexto puede nacer "suspendido"; sin esto la música no sonaría.
      if (context.state === "suspended") context.resume();
    } catch (error) {
      // Sin Web Audio la música suena igual; solo perdemos el análisis (rhythm.js usa el tempo).
      console.warn("No se pudo analizar el audio:", error);
      analyser = null;
    }
  }

  /**
   * @param {number} t segundos desde que empezó la escena
   * @param {number} dt segundos desde el frame anterior
   * @returns {{ bass: number, isOnset: boolean } | null} null si no hay análisis disponible
   */
  function read(t, dt) {
    if (!analyser || audio.paused) return null;
    analyser.getFloatFrequencyData(bands); // llena `bands` con el volumen de cada banda, en decibelios

    let power = 0;
    for (let i = BASS_BANDS.from; i <= BASS_BANDS.to; i++) power += powerOf(bands[i]);
    const bass = Math.sqrt(power / (BASS_BANDS.to - BASS_BANDS.from + 1)); // amplitud media del bajo

    return { bass, isOnset: detector.detect(bass, t, dt) };
  }

  return { start, read };
}
