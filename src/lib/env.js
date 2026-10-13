/** Lo que sabemos del dispositivo y de las preferencias de la persona. */
import { MOBILE_QUERY } from "../config.js";

/** La persona pidió menos animaciones en su sistema operativo. */
export const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Pantalla angosta: sombras más livianas y otro encuadre de cámara. */
export const isSmallScreen = window.matchMedia(MOBILE_QUERY).matches;
