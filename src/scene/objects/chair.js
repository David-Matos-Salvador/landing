/** Silla frente al escritorio, con un hoodie colgado en el respaldo mientras no hay avatar. */
import * as THREE from "three";
import { CHAIR, COLORS } from "../layout.js";
import { block, matte } from "../primitives.js";

/**
 * @param {THREE.Group} room
 * @returns {{ hoodie: THREE.Mesh }} el hoodie se oculta al cargar el avatar
 */
export function addChair(room) {
  const chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z);
  room.add(chair);

  const legHeight = CHAIR.seat - 0.06;
  chair.add(
    block(0.62, 0.09, 0.62, COLORS.chair, [0, CHAIR.seat, 0], 0.04), // asiento
    block(0.08, 0.72, 0.58, COLORS.chair, [0.29, CHAIR.seat + 0.42, 0], 0.035), // respaldo
    block(0.06, legHeight, 0.06, COLORS.metal, [0, legHeight / 2 + 0.04, 0], 0.02), // columna
  );

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24), matte(COLORS.metal));
  base.position.y = 0.02;
  base.castShadow = true;
  base.receiveShadow = true;
  chair.add(base);

  const hoodie = block(0.14, 0.46, 0.56, COLORS.hoodie, [0.36, CHAIR.seat + 0.5, 0], 0.05);
  chair.add(hoodie);

  return { hoodie };
}
