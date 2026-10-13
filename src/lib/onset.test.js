// Pruebas del detector de golpes. Se corren con `npm test` (el test runner viene con Node).
import assert from "node:assert/strict";
import { test } from "node:test";
import { createOnsetDetector } from "./onset.js";

const FPS = 60;
const DT = 1 / FPS;

/** Corre el detector sobre una señal inventada y devuelve en qué segundos detectó golpes. */
function onsetsOf(levelAt, seconds) {
  const detector = createOnsetDetector();
  const onsets = [];
  for (let frame = 0; frame < seconds * FPS; frame++) {
    const t = frame * DT;
    if (detector.detect(levelAt(t), t, DT)) onsets.push(t);
  }
  return onsets;
}

/** Un golpe cada `interval` segundos: sube a 0.9 y cae rápido, sobre un fondo de 0.2. */
const pulseEvery = (interval) => (t) => 0.2 + 0.7 * Math.exp(-(t % interval) * 12);

test("detecta un golpe por cada pulso de la señal", () => {
  const onsets = onsetsOf(pulseEvery(0.5), 10); // 120 golpes por minuto durante 10 s
  assert.ok(onsets.length >= 18 && onsets.length <= 20, `esperaba ~20 golpes, hubo ${onsets.length}`);
});

test("los golpes detectados caen sobre los pulsos, no entre ellos", () => {
  const onsets = onsetsOf(pulseEvery(0.5), 10);
  for (const t of onsets) {
    const distanceToPulse = Math.min(t % 0.5, 0.5 - (t % 0.5));
    assert.ok(distanceToPulse < 0.05, `golpe en ${t.toFixed(2)} s, lejos de un pulso`);
  }
});

test("un sonido fuerte pero constante no cuenta como golpes", () => {
  const onsets = onsetsOf(() => 0.8, 10);
  assert.ok(onsets.length <= 1, `esperaba 0 o 1 golpes, hubo ${onsets.length}`);
});

test("el silencio no produce golpes", () => {
  assert.equal(onsetsOf(() => 0, 5).length, 0);
});

test("nunca hay dos golpes más juntos que el mínimo permitido", () => {
  const onsets = onsetsOf(pulseEvery(0.1), 5); // pulsos demasiado rápidos
  for (let i = 1; i < onsets.length; i++) {
    assert.ok(onsets[i] - onsets[i - 1] > 0.24);
  }
});
