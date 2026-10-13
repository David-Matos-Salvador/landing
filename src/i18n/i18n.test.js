// Pruebas de los diccionarios: que no falte ni sobre ninguna traducción.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { en } from "./en.js";
import { es } from "./es.js";

const PAGES = ["index.html", "links/index.html"];

test("inglés y español tienen exactamente las mismas claves", () => {
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
});

test("ninguna traducción está vacía", () => {
  for (const [name, dictionary] of Object.entries({ en, es })) {
    for (const [key, text] of Object.entries(dictionary)) {
      assert.ok(text.trim().length > 0, `${name}: "${key}" está vacío`);
    }
  }
});

test("toda clave que usa el HTML existe en los diccionarios", () => {
  for (const page of PAGES) {
    const html = readFileSync(new URL(`../../${page}`, import.meta.url), "utf8");
    const keys = [...html.matchAll(/data-i18n(?:-aria-label)?="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(keys.length > 0, `${page} no tiene claves`);
    for (const key of keys) assert.ok(key in en, `${page} usa "${key}", que no está en en.js`);
  }
});
