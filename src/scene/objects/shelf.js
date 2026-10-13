/** Repisa flotante de dos niveles con pocos libros. */
import { PALETTE } from "../../config.js";
import { COLORS, SHELF } from "../layout.js";
import { block } from "../primitives.js";

/** Libros de cada nivel, de izquierda a derecha: [color, alto]. */
const BOOKS_BY_ROW = [
  [
    ["#E8A24E", 0.36],
    ["#D9628A", 0.42],
    [PALETTE.paper, 0.32],
    [PALETTE.mint, 0.38],
  ],
  [
    ["#5E8C78", 0.34],
    ["#E8A24E", 0.4],
  ],
];
const BOOK = { w: 0.09, d: 0.22, gap: 0.11 };

/** @param {import("three").Group} room */
export function addShelf(room) {
  SHELF.rows.forEach((y, row) => {
    room.add(block(1.3, 0.05, 0.3, COLORS.wood, [SHELF.x, y, SHELF.z], 0.015));

    let x = SHELF.x - 0.52;
    for (const [color, height] of BOOKS_BY_ROW[row]) {
      room.add(block(BOOK.w, height, BOOK.d, color, [x, y + 0.025 + height / 2, SHELF.z], 0.012));
      x += BOOK.gap;
    }

    // Un libro inclinado en el nivel de arriba: detalle humano.
    if (row === SHELF.rows.length - 1) {
      const leaning = block(BOOK.w, 0.36, BOOK.d, PALETTE.paper, [x + 0.07, y + 0.2, SHELF.z], 0.012);
      leaning.rotation.z = -0.32;
      room.add(leaning);
    }
  });
}
