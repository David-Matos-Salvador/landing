/** Alfombra bajo la silla. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { COLORS } from "../layout.js";
import { matte } from "../primitives.js";

/** @param {THREE.Group} room */
export function addRug(room) {
  const rug = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.02, 1.5, 2, 0.01), matte(COLORS.rug));
  rug.position.set(-1.0, 0.011, -0.55);
  rug.receiveShadow = true; // recibe sombras pero no las proyecta: está pegada al piso
  room.add(rug);
}
