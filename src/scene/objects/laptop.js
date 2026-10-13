/** Laptop sobre el escritorio: base, tapa, pantalla animada y la luz que emite la pantalla. */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { COLORS, DESK } from "../layout.js";
import { block } from "../primitives.js";
import { createLaptopScreen } from "./laptopScreen.js";

/** La pantalla se redibuja 1 de cada 3 frames (~20 veces por segundo): suficiente y más liviano. */
const REDRAW_EVERY_N_FRAMES = 3;

/** @param {THREE.Group} room */
export function addLaptop(room) {
  const laptop = new THREE.Group();
  laptop.position.set(DESK.x - 0.05, DESK.top + 0.035, DESK.z);
  room.add(laptop);
  laptop.add(block(0.6, 0.025, 0.88, COLORS.laptop, [0, 0.0125, 0], 0.01)); // base

  // La tapa gira sobre su borde trasero: por eso es un grupo con su propio origen.
  const lid = new THREE.Group();
  lid.position.set(-0.29, 0.025, 0);
  lid.rotation.z = -0.3;
  laptop.add(lid);
  lid.add(block(0.025, 0.56, 0.88, COLORS.laptop, [0, 0.28, 0], 0.01));

  const screen = createLaptopScreen();
  const texture = new THREE.CanvasTexture(screen.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.5),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  display.position.set(0.014, 0.28, 0);
  display.rotation.y = Math.PI / 2; // mira hacia la silla (+x)
  lid.add(display);

  const light = new THREE.PointLight(PALETTE.mint, 1.4, 2.4, 2);
  light.position.set(DESK.x + 0.4, DESK.top + 0.4, DESK.z);
  room.add(light);

  let frameCount = 0;

  /**
   * @param {object} frame
   * @param {number} frame.t segundos desde que empezó la escena
   * @param {"lofi" | "bachata"} frame.mode
   * @param {number} frame.bpm
   */
  function update({ t, mode, bpm }) {
    if (++frameCount % REDRAW_EVERY_N_FRAMES !== 0) return;
    if (mode === "bachata") screen.drawEqualizer(t, bpm);
    else screen.drawCode(t);
    texture.needsUpdate = true; // avisa a Three.js que el canvas cambió
  }

  return { light, update, resumeTyping: screen.resumeTyping };
}
