/** Laptop estilo MacBook sobre el escritorio: base, tapa, pantalla animada y la luz que emite. */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { COLORS, DESK } from "../layout.js";
import { block } from "../primitives.js";
import { createLaptopScreen } from "./laptopScreen.js";

/** La pantalla se redibuja 1 de cada 3 frames (~20 veces por segundo): suficiente y más liviano. */
const REDRAW_EVERY_N_FRAMES = 3;

/** Medidas de la laptop (estilo MacBook): cuerpo delgado de aluminio y pantalla con marco negro. */
const BODY = { depth: 0.6, width: 0.88, thickness: 0.02, corner: 0.01 };
const LID = { height: 0.56, thickness: 0.016 };
const DISPLAY = { width: 0.8, height: 0.5, bezel: 0.025 };
const NOTCH = { width: 0.1, height: 0.02 };

/** Plano de un solo color que no reacciona a las luces: para el vidrio negro de la pantalla. */
function flatPanel(width, height, color) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color }),
  );
  panel.rotation.y = Math.PI / 2; // mira hacia la silla (+x)
  return panel;
}

/** @param {THREE.Group} room */
export function addLaptop(room) {
  const laptop = new THREE.Group();
  laptop.position.set(DESK.x - 0.05, DESK.top + 0.035, DESK.z);
  room.add(laptop);

  // Base de aluminio, con el teclado (una placa oscura hundida) y el trackpad.
  const top = BODY.thickness;
  laptop.add(
    block(BODY.depth, BODY.thickness, BODY.width, COLORS.laptop, [0, top / 2, 0], BODY.corner),
    block(0.24, 0.004, 0.74, COLORS.laptopDark, [-0.1, top, 0], 0.002), // teclado, del lado de la pantalla
    block(0.17, 0.003, 0.3, "#CBCED1", [0.17, top, 0], 0.0015), // trackpad, del lado de la silla
  );

  // La tapa gira sobre su borde trasero: por eso es un grupo con su propio origen.
  const lid = new THREE.Group();
  lid.position.set(-BODY.depth / 2 + 0.01, top, 0);
  lid.rotation.z = -0.3;
  laptop.add(lid);
  const lidCenterY = LID.height / 2;
  lid.add(block(LID.thickness, LID.height, BODY.width, COLORS.laptop, [0, lidCenterY, 0], BODY.corner));

  // Pantalla: vidrio negro, encima la imagen, y encima la muesca de la cámara.
  // Cada capa va una fracción de milímetro más adelante para que no se pisen.
  const front = LID.thickness / 2;
  const glass = flatPanel(
    DISPLAY.width + DISPLAY.bezel * 2,
    DISPLAY.height + DISPLAY.bezel * 2,
    COLORS.laptopDark,
  );
  glass.position.set(front + 0.001, lidCenterY, 0);
  lid.add(glass);

  const screen = createLaptopScreen();
  const texture = new THREE.CanvasTexture(screen.canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(DISPLAY.width, DISPLAY.height),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  display.position.set(front + 0.002, lidCenterY, 0);
  display.rotation.y = Math.PI / 2;
  lid.add(display);

  const notch = flatPanel(NOTCH.width, NOTCH.height, COLORS.laptopDark);
  notch.position.set(front + 0.003, lidCenterY + DISPLAY.height / 2 - NOTCH.height / 2, 0);
  lid.add(notch);

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
