/**
 * Lámpara de escritorio con interruptor. Su luz proyecta sombras, se enciende sola cuando
 * termina el loader y se puede prender y apagar con toggle().
 */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { reduceMotion } from "../../lib/env.js";
import { COLORS, DESK } from "../layout.js";
import { block, matte } from "../primitives.js";

const BASE_INTENSITY = 14;
const BULB_COLOR = new THREE.Color("#FFE3B0");
/** Segundos^-1: qué tan rápido se enciende. Sin animaciones, casi al instante. */
const TURN_ON_RATE = reduceMotion ? 4 : 1.4;
/** Apagarse es más rápido que encenderse, como un foco real. */
const TURN_OFF_RATE = 6;
const SWITCH_COLOR = { on: new THREE.Color(PALETTE.amber), off: new THREE.Color("#3A4A43") };

/**
 * @param {THREE.Group} room
 * @param {{ shadowMapSize: number }} options
 */
export function addLamp(room, { shadowMapSize }) {
  const lamp = new THREE.Group();
  lamp.position.set(DESK.x - 0.25, DESK.top + 0.035, DESK.z - 0.85);
  room.add(lamp);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 24), matte(COLORS.metal));
  base.position.y = 0.02;
  base.castShadow = true;
  lamp.add(base);
  lamp.add(block(0.035, 0.7, 0.035, COLORS.metal, [0, 0.39, 0], 0.012)); // brazo

  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.22, 24),
    new THREE.MeshStandardMaterial({ color: "#F2A65A", emissive: "#7A3E10", roughness: 0.8 }),
  );
  shade.position.set(0.1, 0.76, 0.08);
  shade.rotation.z = -0.55;
  shade.castShadow = true;
  lamp.add(shade);

  // MeshBasicMaterial no reacciona a las luces: el foco siempre se ve "encendido".
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 16),
    new THREE.MeshBasicMaterial({ color: BULB_COLOR, toneMapped: false }),
  );
  bulb.position.set(0.15, 0.68, 0.11);
  lamp.add(bulb);

  const light = new THREE.SpotLight(PALETTE.amber, BASE_INTENSITY, 4.5, 0.7, 0.7, 1.4);
  light.position.set(DESK.x - 0.1, DESK.top + 0.72, DESK.z - 0.74);
  light.target.position.set(DESK.x + 0.35, DESK.top, DESK.z + 0.2); // apunta al escritorio, no al piso
  light.castShadow = true;
  light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  light.shadow.bias = -0.0008;
  light.shadow.radius = 6;
  room.add(light, light.target);

  // Botón del interruptor, en la base: ámbar si está encendida, gris si está apagada.
  const switchButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.02, 16),
    new THREE.MeshBasicMaterial({ color: SWITCH_COLOR.on, toneMapped: false }),
  );
  switchButton.position.set(0.07, 0.045, 0.07);
  lamp.add(switchButton);

  // Zona de clic invisible alrededor de la lámpara: es más fácil de apuntar que el brazo delgado.
  const clickArea = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.95, 0.5),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  clickArea.position.set(0.05, 0.45, 0.04);
  lamp.add(clickArea);

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
    bulb.material.color.setScalar(0.25 + 0.75 * glow).multiply(BULB_COLOR);
    shade.material.emissiveIntensity = glow; // apagada, la pantalla deja de "brillar por dentro"
  }

  return { update, toggle, clickArea };
}
