/**
 * Configuración del sitio: los valores que uno querría cambiar sin leer el resto del código.
 * Ningún otro módulo debería tener "números mágicos" de este tipo.
 */

/** Avatar VRoid (.vrm). Vacío = silla vacía y la laptop teclea sola. */
export const AVATAR_URL = "";

/** Lista de canciones (mp3 con derecho de uso, servidos por nginx). Ver music/README.md. */
export const PLAYLIST_URL = "music/playlist.json";
export const MUSIC_DIR = "music/";

/** Tempo que se usa cuando una canción no trae el campo "bpm". */
export const DEFAULT_BPM = 128;

/** Debe coincidir con el breakpoint de los archivos CSS. */
export const MOBILE_QUERY = "(max-width: 760px)";

export const LOADER = {
  /** Tiempo mínimo en pantalla, para que el porcentaje se alcance a leer. */
  minVisibleMs: 1200,
  /** Red de seguridad: si una tarea se cuelga, la página se abre igual. */
  safetyTimeoutMs: 8000,
};

/** Paleta "night forest". Los mismos colores viven en styles/tokens.css. */
export const PALETTE = {
  night: "#0F1E1A",
  amber: "#FFB45C",
  mint: "#8FD6B8",
  rose: "#E86A92",
  paper: "#F2E6D8",
};
