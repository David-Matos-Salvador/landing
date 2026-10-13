// Pruebas del recorte de imágenes. Se corren con `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { coverFit } from "./coverFit.js";

test("una imagen con la misma forma que el marco se ve completa", () => {
  assert.deepEqual(coverFit(1.5, 1.5), { repeat: { x: 1, y: 1 }, offset: { x: 0, y: 0 } });
});

test("a una imagen más ancha se le cortan los lados por igual", () => {
  const fit = coverFit(2, 1); // el doble de ancha que el marco
  assert.deepEqual(fit.repeat, { x: 0.5, y: 1 });
  assert.deepEqual(fit.offset, { x: 0.25, y: 0 });
});

test("a una imagen más alta se le corta arriba y abajo por igual", () => {
  const fit = coverFit(0.5, 1); // el doble de alta que el marco
  assert.deepEqual(fit.repeat, { x: 1, y: 0.5 });
  assert.deepEqual(fit.offset, { x: 0, y: 0.25 });
});
