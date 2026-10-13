/**
 * Música: el disco flotante. Un clic pone una canción al azar y cambia la página a modo
 * "bachata"; otro clic la pausa y vuelve a "lofi". No muestra información de la canción.
 */
import { DEFAULT_BPM, MUSIC_DIR, PLAYLIST_URL } from "../config.js";
import { createAudioMeter } from "./audioMeter.js";

/** @typedef {{ title: string, artist: string, file: string, bpm?: number, credit?: string }} Track */

/** @returns {Promise<Track[]>} lista vacía si el archivo falta o está mal formado */
async function fetchPlaylist() {
  try {
    const response = await fetch(PLAYLIST_URL);
    if (!response.ok) return [];
    const list = await response.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * @param {object} elements
 * @param {HTMLButtonElement} elements.button el disco
 * @param {HTMLAudioElement} elements.audio
 */
export function createPlayer({ button, audio }) {
  /** @type {Track[]} */
  let playlist = [];
  let currentIndex = -1;
  /** @type {"lofi" | "bachata"} */
  let mode = "lofi";
  let bpm = DEFAULT_BPM;
  const meter = createAudioMeter(audio);

  fetchPlaylist().then((list) => {
    playlist = list;
  });

  /** Índice al azar, distinto de la canción actual si hay más de una. */
  function randomIndex() {
    if (playlist.length < 2) return 0;
    let index = currentIndex;
    while (index === currentIndex) index = Math.floor(Math.random() * playlist.length);
    return index;
  }

  function loadRandomTrack() {
    if (!playlist.length) return;
    currentIndex = randomIndex();
    const track = playlist[currentIndex];
    audio.src = MUSIC_DIR + track.file;
    bpm = track.bpm || DEFAULT_BPM;
  }

  /** El navegador puede rechazar play() (por ejemplo, sin un clic previo): no es un error nuestro. */
  const play = () => audio.play().catch(() => {});

  /** @param {boolean} isPlaying */
  function setPlaying(isPlaying) {
    mode = isPlaying ? "bachata" : "lofi";
    document.body.dataset.mode = mode; // el CSS cambia el color de acento con este atributo
    button.setAttribute("aria-pressed", String(isPlaying));
    button.setAttribute("aria-label", isPlaying ? "Pause the music" : "Play a random song");
    if (isPlaying && playlist.length) {
      meter.start(); // dentro del clic: el navegador exige una acción de la persona
      play();
    } else {
      audio.pause();
    }
  }

  button.addEventListener("click", () => {
    const turnOn = mode === "lofi";
    if (turnOn) loadRandomTrack();
    setPlaying(turnOn);
  });

  // Al terminar una canción sigue otra al azar.
  audio.addEventListener("ended", () => {
    loadRandomTrack();
    play();
  });

  // Solo lectura desde afuera: la escena consulta el modo y el tempo en cada frame.
  return {
    get mode() {
      return mode;
    },
    get bpm() {
      return bpm;
    },
    /** Golpes reales de la canción en este frame, o null si no se puede analizar el audio. */
    readAudio: meter.read,
  };
}
