/**
 * Arma el cuarto completo: piso, dos paredes y los objetos. Cada objeto vive en su propio
 * archivo dentro de objects/; aquí solo se decide qué hay en el cuarto.
 */
import * as THREE from "three";
import { isSmallScreen, reduceMotion } from "../lib/env.js";
import { COLORS, ROOM } from "./layout.js";
import { addChair } from "./objects/chair.js";
import { addDesk } from "./objects/desk.js";
import { addLamp } from "./objects/lamp.js";
import { addLaptop } from "./objects/laptop.js";
import { addPicture } from "./objects/picture.js";
import { addRug } from "./objects/rug.js";
import { addShelf } from "./objects/shelf.js";
import { addSodaCup } from "./objects/sodaCup.js";
import { addWindow } from "./objects/window.js";
import { block } from "./primitives.js";

const WALL = 0.14; // grosor de las paredes
const FLOOR = 0.16; // grosor del piso

/** @param {THREE.Scene} scene */
export function buildRoom(scene) {
  const room = new THREE.Group();
  scene.add(room);

  room.add(
    block(ROOM.w, FLOOR, ROOM.d, COLORS.floor, [0, -FLOOR / 2, 0], 0.02),
    block(ROOM.w, ROOM.h, WALL, COLORS.wallBack, [0, ROOM.h / 2, -ROOM.d / 2 - WALL / 2], 0.02),
    block(WALL, ROOM.h, ROOM.d, COLORS.wallSide, [-ROOM.w / 2 - WALL / 2, ROOM.h / 2, 0], 0.02),
  );

  const rainWindow = addWindow(room);
  addDesk(room);
  const laptop = addLaptop(room);
  const lamp = addLamp(room, { shadowMapSize: isSmallScreen ? 512 : 1024 });
  const { hoodie } = addChair(room);
  addRug(room);
  addShelf(room);
  addPicture(room);
  addSodaCup(room);

  /**
   * Lo único que se mueve por sí solo en el cuarto: la lluvia de la ventana.
   * @param {number} t segundos desde que empezó la escena
   */
  function update(t) {
    // La lluvia cae más lento si la persona pidió menos animaciones.
    rainWindow.uniforms.uTime.value = t * 0.35 * (reduceMotion ? 0.3 : 1);
  }

  return { rainTint: rainWindow.uniforms.uTint.value, laptop, lamp, hoodie, update };
}
