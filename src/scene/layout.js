/**
 * Medidas y colores del cuarto. Unidades: metros aproximados; el origen (0, 0, 0) es el
 * centro del piso. Ejes: +x derecha, +y arriba, +z hacia la cámara.
 */

export const ROOM = { w: 6, h: 4.2, d: 5 };

/** Ventana en la pared del fondo. */
export const WINDOW = { x: -0.5, y: 2.5, w: 1.7, h: 1.4, frame: 0.07 };

/** Escritorio contra la pared izquierda. `top` es la altura del tablero. */
export const DESK = { x: -2.2, z: -0.6, top: 1.0 };

/** Silla frente al escritorio. `seat` es la altura del asiento. */
export const CHAIR = { x: -1.15, z: -0.6, seat: 0.6 };

/** Repisa en la pared del fondo, a la derecha de la ventana. */
export const SHELF = { x: 1.7, z: -ROOM.d / 2 + 0.17, rows: [1.65, 2.4] };

/** Cuadro en la pared izquierda, sobre el escritorio. */
export const PICTURE = { y: 2.55, z: DESK.z, w: 1.05, h: 0.78 };

export const COLORS = {
  floor: "#6B513F",
  wallBack: "#2F4D41",
  wallSide: "#294437",
  wood: "#A2774F",
  woodDark: "#7E5A3E",
  metal: "#1E2E28",
  laptop: "#D9DCDE", // aluminio plateado
  laptopDark: "#17191B", // teclado y marco de la pantalla
  chair: "#22352E",
  rug: "#C2A27A",
  hoodie: "#D9628A",
};
