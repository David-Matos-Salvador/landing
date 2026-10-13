/**
 * "Escucha" la música: usa la Web Audio API del navegador para medir, en cada frame, el
 * volumen general de la canción y el de su bajo, y avisa cuando hay un golpe.
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
  /** @type {Float32Array | null} volumen de cada banda de frecuencia */
  let bands = null;
  /** @type {Float32Array | null} la onda de sonido de los últimos milisegundos */
  let wave = null;
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
        wave = new Float32Array(analyser.fftSize);
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

  /** Volumen general: la raíz del promedio de los cuadrados de la onda (RMS). */
  function measureLoudness() {
    analyser.getFloatTimeDomainData(wave); // llena `wave` con valores de -1 a 1
    let sumOfSquares = 0;
    for (const sample of wave) sumOfSquares += sample * sample;
    return Math.sqrt(sumOfSquares / wave.length);
  }

  /** Volumen solo de las notas graves, donde están el bombo y el bajo. */
  function measureBass() {
    analyser.getFloatFrequencyData(bands); // llena `bands` con el volumen de cada banda, en decibelios
    let power = 0;
    for (let i = BASS_BANDS.from; i <= BASS_BANDS.to; i++) power += powerOf(bands[i]);
    return Math.sqrt(power / (BASS_BANDS.to - BASS_BANDS.from + 1));
  }

  /**
   * @param {number} t segundos desde que empezó la escena
   * @param {number} dt segundos desde el frame anterior
   * @returns {{ loudness: number, isOnset: boolean } | null} null si no hay análisis disponible
   */
  function read(t, dt) {
    if (!analyser || audio.paused) return null;
    return { loudness: measureLoudness(), isOnset: detector.detect(measureBass(), t, dt) };
  }

  return { start, read };
}
