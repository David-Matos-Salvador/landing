/** Piezas básicas con las que se arma todo el cuarto. */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Material mate de color plano: el estilo low-poly limpio del cuarto. */
export const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });

/**
 * Caja con bordes apenas redondeados que proyecta y recibe sombras.
 * @param {number} w ancho (x)
 * @param {number} h alto (y)
 * @param {number} d profundidad (z)
 * @param {string} color
 * @param {[number, number, number]} position centro de la caja
 * @param {number} [radius] radio del borde; se limita para que nunca supere a la caja
 */
export function block(w, h, d, color, position, radius = 0.025) {
  const safeRadius = Math.min(radius, w / 2.2, h / 2.2, d / 2.2);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, safeRadius), matte(color));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
