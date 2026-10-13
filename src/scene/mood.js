/**
 * Ambiente del cuarto según el modo. En bachata el cuarto se queda verde: solo cambian
 * la luz de la pantalla, el color de la lluvia y una luz rosa que sigue a la música.
 */
import * as THREE from "three";
import { PALETTE } from "../config.js";

const LOFI_ACCENT = new THREE.Color(PALETTE.mint);
const BACHATA_ACCENT = new THREE.Color(PALETTE.rose);
const PARTY_LIGHT_INTENSITY = 12;
/** Con música, la luz nunca se apaga del todo: queda este mínimo (fracción del máximo). */
const PARTY_LIGHT_FLOOR = 0.08;
/** Cuánto del brillo depende del golpe. 0 = luz pareja; 1 = se apaga entre golpe y golpe. */
const BEAT_DEPTH = 0.45;

/**
 * @param {object} beat lo que entrega rhythm.update()
 * @param {number} beat.mix 0 = lofi, 1 = bachata
 * @param {number} beat.energy intensidad de la canción, de 0 a 1
 * @param {number} beat.beatLevel acento del golpe, de 0 a 1
 * @param {object} targets lo que cambia de color
 * @param {THREE.Color} targets.screenLightColor
 * @param {THREE.Color} targets.rainTint
 * @param {THREE.PointLight} targets.partyLight
 */
export function applyMood({ mix, energy, beatLevel }, { screenLightColor, rainTint, partyLight }) {
  screenLightColor.copy(LOFI_ACCENT).lerp(BACHATA_ACCENT, mix);
  rainTint.copy(LOFI_ACCENT).lerp(BACHATA_ACCENT, mix);

  // El brillo lo pone la canción (energy); el golpe (beatLevel) lo hace latir encima.
  // Ejemplo con energy = 1: entre golpes queda en 0.55 y en cada golpe sube a 1.
  const pulse = 1 - BEAT_DEPTH + BEAT_DEPTH * beatLevel;
  const brightness = PARTY_LIGHT_FLOOR + (1 - PARTY_LIGHT_FLOOR) * energy * pulse;
  partyLight.intensity = mix * PARTY_LIGHT_INTENSITY * brightness;
}
