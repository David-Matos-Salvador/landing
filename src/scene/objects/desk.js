/** Escritorio contra la pared izquierda: un tablero y dos patas tipo panel. */
import { COLORS, DESK } from "../layout.js";
import { block } from "../primitives.js";

/** @param {import("three").Group} room */
export function addDesk(room) {
  const legHeight = DESK.top - 0.04;
  room.add(block(1.2, 0.07, 2.3, COLORS.wood, [DESK.x, DESK.top, DESK.z], 0.03));
  for (const side of [-1, 1]) {
    room.add(block(1.05, legHeight, 0.06, COLORS.woodDark, [DESK.x, legHeight / 2, DESK.z + side]));
  }
}
