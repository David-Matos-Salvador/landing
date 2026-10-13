/**
 * Vaso de gaseosa lima-limón sobre el escritorio, con tapa y sorbete.
 * Es un vaso genérico: sin logo ni nombre de marca.
 */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { COLORS, DESK } from "../layout.js";
import { matte } from "../primitives.js";

const CUP = { height: 0.22, topRadius: 0.075, bottomRadius: 0.055 };
const SIDES = 24; // lados del cilindro: suficiente para que se vea redondo

/** Cilindro que proyecta sombra, apoyado en `y` (su base, no su centro). */
function cylinder(topRadius, bottomRadius, height, color, y) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(topRadius, bottomRadius, height, SIDES),
    matte(color),
  );
  mesh.position.y = y + height / 2;
  mesh.castShadow = true;
  return mesh;
}

/** @param {THREE.Group} room */
export function addSodaCup(room) {
  const cup = new THREE.Group();
  // Entre la laptop y la lámpara, al alcance de la mano.
  cup.position.set(DESK.x + 0.32, DESK.top + 0.035, DESK.z - 0.62);
  room.add(cup);

  // El vaso es más ancho arriba que abajo. La franja sigue esa forma a media altura.
  const radiusAt = (y) => CUP.bottomRadius + (CUP.topRadius - CUP.bottomRadius) * (y / CUP.height);
  const stripe = { y: 0.08, height: 0.05 };
  cup.add(
    cylinder(CUP.topRadius, CUP.bottomRadius, CUP.height, COLORS.soda, 0),
    cylinder(
      radiusAt(stripe.y + stripe.height) + 0.002,
      radiusAt(stripe.y) + 0.002,
      stripe.height,
      COLORS.sodaStripe,
      stripe.y,
    ),
    cylinder(CUP.topRadius + 0.006, CUP.topRadius + 0.006, 0.014, PALETTE.paper, CUP.height), // tapa
  );

  const straw = cylinder(0.008, 0.008, 0.16, PALETTE.paper, CUP.height - 0.02);
  straw.position.x = 0.02;
  straw.rotation.z = -0.18; // apenas inclinado, como queda al dejar el vaso
  cup.add(straw);
}
