/**
 * Ambiente del cuarto según el modo. En bachata el cuarto se queda verde: solo cambian
 * la luz de la pantalla, el color de la lluvia y una luz rosa que late con la música.
 */
import * as THREE from "three";
import { PALETTE } from "../config.js";

const LOFI_ACCENT = new THREE.Color(PALETTE.mint);
const BACHATA_ACCENT = new THREE.Color(PALETTE.rose);
const PARTY_LIGHT_INTENSITY = 9;

/**
 * @param {object} beat lo que entrega rhythm.update()
 * @param {number} beat.mix 0 = lofi, 1 = bachata
 * @param {number} beat.beatLevel golpe del ritmo, de 0 a 1
 * @param {object} targets lo que cambia de color
 * @param {THREE.Color} targets.screenLightColor
 * @param {THREE.Color} targets.rainTint
 * @param {THREE.PointLight} targets.partyLight
 */
export function applyMood({ mix, beatLevel }, { screenLightColor, rainTint, partyLight }) {
  screenLightColor.copy(LOFI_ACCENT).lerp(BACHATA_ACCENT, mix);
  rainTint.copy(LOFI_ACCENT).lerp(BACHATA_ACCENT, mix);
  // Siempre queda un poco encendida (0.12) y sube con cada golpe.
  partyLight.intensity = mix * PARTY_LIGHT_INTENSITY * (0.12 + beatLevel * 0.95);
}
