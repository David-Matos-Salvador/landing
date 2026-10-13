/**
 * Lámpara de mesa sencilla: base redonda, un tallo delgado y una pantalla que brilla.
 * Su luz proyecta sombras, se enciende sola cuando termina el loader y se puede prender y
 * apagar con toggle().
 */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { reduceMotion } from "../../lib/env.js";
import { COLORS, DESK } from "../layout.js";
import { matte } from "../primitives.js";

/** Medidas de la lámpara, de abajo hacia arriba. */
const BASE = { radius: 0.11, height: 0.03 };
const STEM = { radius: 0.012, height: 0.4 };
const SHADE = { topRadius: 0.1, bottomRadius: 0.15, height: 0.2 };
const SIDES = 32; // lados de los cilindros: suficiente para que se vean redondos

const BASE_INTENSITY = 14;
/** Segundos^-1: qué tan rápido se enciende. Sin animaciones, casi al instante. */
const TURN_ON_RATE = reduceMotion ? 4 : 1.4;
/** Apagarse es más rápido que encenderse, como un foco real. */
const TURN_OFF_RATE = 6;
/** Cuánto brilla la pantalla "por dentro" cuando está encendida del todo. */
const SHADE_GLOW = 1.3;
const SWITCH_COLOR = { on: new THREE.Color(PALETTE.amber), off: new THREE.Color("#3A4A43") };

/** Cilindro apoyado en `y` (su base, no su centro). */
function cylinder(topRadius, bottomRadius, height, material, y) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, height, SIDES), material);
  mesh.position.y = y + height / 2;
  return mesh;
}

/**
 * @param {THREE.Group} room
 * @param {{ shadowMapSize: number }} options
 */
export function addLamp(room, { shadowMapSize }) {
  const lamp = new THREE.Group();
  lamp.position.set(DESK.x - 0.25, DESK.top + 0.035, DESK.z - 0.85);
  room.add(lamp);

  const base = cylinder(BASE.radius, BASE.radius, BASE.height, matte(COLORS.metal), 0);
  const stem = cylinder(STEM.radius, STEM.radius, STEM.height, matte(COLORS.metal), BASE.height);
  base.castShadow = true;
  stem.castShadow = true;

  // La pantalla tiene luz propia (emissive): con la lámpara encendida se ve iluminada desde
  // adentro. No proyecta sombra, porque la luz sale justo debajo de ella y la taparía.
  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: "#F3D9A6",
    emissive: PALETTE.amber,
    emissiveIntensity: 0,
    roughness: 0.85,
  });
  const shadeY = BASE.height + STEM.height - 0.02;
  const shade = cylinder(SHADE.topRadius, SHADE.bottomRadius, SHADE.height, shadeMaterial, shadeY);
  lamp.add(base, stem, shade);

  // Botón del interruptor, en la base: ámbar si está encendida, gris si está apagada.
  const switchButton = cylinder(
    0.022,
    0.022,
    0.012,
    new THREE.MeshBasicMaterial({ color: SWITCH_COLOR.on, toneMapped: false }),
    BASE.height,
  );
  switchButton.position.set(0.06, switchButton.position.y, 0.06);
  lamp.add(switchButton);

  // Zona de clic invisible alrededor de la lámpara: es más fácil de apuntar que el tallo delgado.
  const height = shadeY + SHADE.height;
  const clickArea = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, height, 0.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  clickArea.position.y = height / 2;
  lamp.add(clickArea);

  // La luz: un foco que sale de debajo de la pantalla y apunta al escritorio, no al piso.
  const light = new THREE.SpotLight(PALETTE.amber, BASE_INTENSITY, 4.5, 0.75, 0.7, 1.4);
  light.position.set(lamp.position.x, lamp.position.y + shadeY, lamp.position.z);
  light.target.position.set(DESK.x + 0.3, DESK.top, DESK.z + 0.1);
  light.castShadow = true;
  light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  light.shadow.bias = -0.0008;
  light.shadow.radius = 6;
  room.add(light, light.target);

  /** Lo que eligió la persona con el interruptor. */
  let isSwitchedOn = true;
  /** 0 = apagada, 1 = encendida del todo. Persigue a lo que diga el interruptor. */
  let power = 0;

  /** Cambia el interruptor. @returns {boolean} true si quedó encendida */
  function toggle() {
    isSwitchedOn = !isSwitchedOn;
    switchButton.material.color.copy(isSwitchedOn ? SWITCH_COLOR.on : SWITCH_COLOR.off);
    return isSwitchedOn;
  }

  /**
   * @param {object} frame
   * @param {number} frame.dt segundos desde el frame anterior
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {number} frame.mix 0 = lofi, 1 = bachata (la lámpara baja un poco en la fiesta)
   * @param {boolean} frame.isPageReady falso mientras el loader está en pantalla
   */
  function update({ dt, t, mix, isPageReady }) {
    const shouldBeOn = isPageReady && isSwitchedOn;
    if (shouldBeOn) power = Math.min(1, power + dt * TURN_ON_RATE);
    else power = Math.max(0, power - dt * TURN_OFF_RATE);

    // Mientras se enciende, parpadea como un foco viejo.
    const isFlickering = shouldBeOn && power < 1 && !reduceMotion;
    const flicker = isFlickering && Math.sin(t * 60) <= 0.2 ? 0.35 : 1;
    const shimmer = Math.sin(t * 13) * 0.1; // variación mínima: que la luz no se vea "congelada"
    const glow = power * flicker;

    light.intensity = (BASE_INTENSITY * (1 - mix * 0.35) + shimmer) * glow;
    shadeMaterial.emissiveIntensity = SHADE_GLOW * glow;
  }

  return { update, toggle, clickArea };
}
