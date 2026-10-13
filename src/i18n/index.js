/**
 * Idiomas de la página. Único lugar que sabe qué idioma está activo.
 *
 * Cómo se marca un texto en el HTML:
 *   <p data-i18n="hero.tagline">...</p>                 el contenido del elemento
 *   <nav data-i18n-aria-label="nav.label" ...>          su atributo aria-label
 *
 * Los textos que cambia el JavaScript (por ejemplo "Pausar la música") se piden con t().
 */
import { pickLanguage } from "../lib/pickLanguage.js";
import { en } from "./en.js";
import { es } from "./es.js";

const DICTIONARIES = { en, es };
/** El primero es el idioma por defecto. */
export const LANGUAGES = Object.keys(DICTIONARIES);
const STORAGE_KEY = "language";

let current = LANGUAGES[0];
/** Funciones que quieren enterarse cuando cambia el idioma. */
const listeners = new Set();

/** localStorage puede fallar (modo privado, cookies bloqueadas): entonces no se recuerda y ya. */
function readSaved() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
function save(language) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Sin almacenamiento, la elección dura solo esta visita.
  }
}

/**
 * Traduce una clave al idioma activo.
 * @param {string} key
 * @returns {string} si falta la traducción usa el inglés; si tampoco está, devuelve la clave
 */
export function t(key) {
  return DICTIONARIES[current][key] ?? en[key] ?? key;
}

export function getLanguage() {
  return current;
}

/** Escribe en la página todos los textos marcados con data-i18n. */
function render({ title, description }) {
  document.documentElement.lang = current; // lectores de pantalla y buscadores
  document.title = t(title);
  document.querySelector('meta[name="description"]')?.setAttribute("content", t(description));

  for (const element of document.querySelectorAll("[data-i18n]")) {
    // innerHTML porque algunos textos llevan <span> o <strong>. Es seguro: los textos son
    // los de en.js y es.js, escritos por nosotros; nunca vienen de un usuario.
    element.innerHTML = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  }
  // El CSS espera esta clase para mostrar el texto del loader: así no se ve un instante en inglés.
  document.documentElement.classList.add("i18n-ready");
}

/**
 * Elige el idioma inicial y traduce la página.
 * @param {{ title: string, description: string }} meta claves del <title> y de la descripción
 */
export function initLanguage(meta) {
  current = pickLanguage({
    saved: readSaved(),
    preferred: navigator.languages ?? [navigator.language],
    supported: LANGUAGES,
  });
  render(meta);

  /** @param {string} language */
  function setLanguage(language) {
    if (!LANGUAGES.includes(language) || language === current) return;
    current = language;
    save(language); // solo se guarda cuando la persona lo elige a mano
    render(meta);
    for (const listener of listeners) listener(language);
  }

  return { setLanguage };
}

/**
 * Avisa cuando cambia el idioma. Para piezas que escriben textos desde JavaScript.
 * @param {(language: string) => void} listener
 */
export function onLanguageChange(listener) {
  listeners.add(listener);
}
