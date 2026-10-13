// Pruebas de la elección de idioma. Se corren con `npm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { pickLanguage } from "./pickLanguage.js";

const supported = ["en", "es"];

test("usa el idioma del navegador si la página lo tiene", () => {
  assert.equal(pickLanguage({ saved: null, preferred: ["es"], supported }), "es");
});

test("entiende variantes regionales como es-PE", () => {
  assert.equal(pickLanguage({ saved: null, preferred: ["es-PE", "en-US"], supported }), "es");
});

test("respeta el orden de preferencia del navegador", () => {
  assert.equal(pickLanguage({ saved: null, preferred: ["fr-FR", "en-GB", "es"], supported }), "en");
});

test("si no hay coincidencia usa el idioma por defecto", () => {
  assert.equal(pickLanguage({ saved: null, preferred: ["ja", "de"], supported }), "en");
  assert.equal(pickLanguage({ saved: null, preferred: [], supported }), "en");
});

test("lo que la persona eligió antes gana al navegador", () => {
  assert.equal(pickLanguage({ saved: "en", preferred: ["es-PE"], supported }), "en");
});

test("ignora un idioma guardado que la página ya no tiene", () => {
  assert.equal(pickLanguage({ saved: "fr", preferred: ["es"], supported }), "es");
});
