// Pruebas de la envolvente de volumen. Se corren con `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createEnvelope } from "./envelope.js";

const DT = 1 / 60;

/** Alimenta la envolvente con el mismo volumen durante unos segundos y devuelve el resultado. */
function settle(envelope, loudness, seconds) {
  let energy = 0;
  for (let frame = 0; frame < seconds * 60; frame++) energy = envelope.follow(loudness, DT);
  return energy;
}

test("la parte más fuerte de la canción da cerca de 1", () => {
  assert.ok(settle(createEnvelope(), 0.4, 2) > 0.95);
});

test("no depende de qué tan fuerte esté grabada la canción", () => {
  const quietRecording = settle(createEnvelope(), 0.05, 2);
  const loudRecording = settle(createEnvelope(), 0.9, 2);
  assert.ok(Math.abs(quietRecording - loudRecording) < 0.01);
});

test("una parte suave después de una fuerte baja la intensidad", () => {
  const envelope = createEnvelope();
  settle(envelope, 0.8, 2);
  const soft = settle(envelope, 0.4, 2); // la mitad del volumen
  assert.ok(soft > 0.15 && soft < 0.5, `esperaba una intensidad media-baja, fue ${soft.toFixed(2)}`);
});

test("el silencio lleva la intensidad a 0", () => {
  const envelope = createEnvelope();
  settle(envelope, 0.8, 2);
  assert.ok(settle(envelope, 0, 3) < 0.01);
});

test("sube más rápido de lo que baja", () => {
  const rising = createEnvelope();
  const afterRise = settle(rising, 0.8, 0.1);

  const falling = createEnvelope();
  settle(falling, 0.8, 2);
  const afterFall = settle(falling, 0, 0.1);

  assert.ok(afterRise > 1 - afterFall, "en 0.1 s debería subir más de lo que baja");
});
