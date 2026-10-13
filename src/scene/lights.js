/** Luces generales de la escena. Las luces de la lámpara y de la laptop viven con sus objetos. */
import * as THREE from "three";
import { PALETTE } from "../config.js";
import { isSmallScreen } from "../lib/env.js";

/** @param {THREE.Scene} scene */
export function addLights(scene) {
  // Luz ambiente: un color desde arriba (cielo) y otro desde abajo (rebote del piso).
  scene.add(new THREE.HemisphereLight("#A9CBBB", "#2A3A31", 1.4));

  // Luz de luna: la principal, con sombras suaves.
  const moon = new THREE.DirectionalLight("#C4E5D6", 1.3);
  moon.position.set(3.5, 6, 4);
  moon.target.position.set(-0.8, 0.5, -0.8);
  moon.castShadow = true;
  const mapSize = isSmallScreen ? 1024 : 2048;
  moon.shadow.mapSize.set(mapSize, mapSize);
  // Área que cubre el mapa de sombras: justo el cuarto, para no desperdiciar resolución.
  Object.assign(moon.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 0.5, far: 20 });
  moon.shadow.bias = -0.0006;
  moon.shadow.radius = 5;
  scene.add(moon, moon.target);

  // Luz rosa de la fiesta: apagada (intensidad 0) hasta que suena la bachata.
  const party = new THREE.PointLight(PALETTE.rose, 0, 7, 1.4);
  party.position.set(0.6, 3.2, 0.6);
  scene.add(party);

  return { party };
}
