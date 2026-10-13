/** Lámpara de escritorio. Su luz proyecta sombras y "se enciende" cuando termina el loader. */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { reduceMotion } from "../../lib/env.js";
import { COLORS, DESK } from "../layout.js";
import { block, matte } from "../primitives.js";

const BASE_INTENSITY = 14;
const BULB_COLOR = new THREE.Color("#FFE3B0");
/** Segundos^-1: qué tan rápido se enciende. Sin animaciones, casi al instante. */
const TURN_ON_RATE = reduceMotion ? 4 : 1.4;

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

  /** 0 = apagada, 1 = encendida del todo. */
  let power = 0;

  /**
   * @param {object} frame
   * @param {number} frame.dt segundos desde el frame anterior
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {number} frame.mix 0 = lofi, 1 = bachata (la lámpara baja un poco en la fiesta)
   * @param {boolean} frame.isOn falso mientras el loader está en pantalla
   */
  function update({ dt, t, mix, isOn }) {
    if (isOn && power < 1) power = Math.min(1, power + dt * TURN_ON_RATE);

    // Mientras se enciende, parpadea como un foco viejo.
    const isFlickering = power < 1 && !reduceMotion;
    const flicker = isFlickering && Math.sin(t * 60) <= 0.2 ? 0.35 : 1;
    const shimmer = Math.sin(t * 13) * 0.1; // variación mínima: que la luz no se vea "congelada"

    light.intensity = (BASE_INTENSITY * (1 - mix * 0.35) + shimmer) * power * flicker;
    bulb.material.color.setScalar(0.25 + 0.75 * power * flicker).multiply(BULB_COLOR);
  }

  return { update };
}
