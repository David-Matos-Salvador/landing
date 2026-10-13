/**
 * Decide en qué idioma abrir la página. Función pura: recibe todo lo que necesita y no
 * lee nada del navegador, por eso se puede probar (ver pickLanguage.test.js).
 *
 * Orden de prioridad:
 *   1. Lo que la persona eligió antes con el botón de idioma.
 *   2. Los idiomas configurados en su navegador, en su orden de preferencia.
 *   3. El idioma por defecto.
 *
 * @param {object} options
 * @param {string | null} options.saved idioma guardado de una visita anterior
 * @param {readonly string[]} options.preferred idiomas del navegador, p. ej. ["es-PE", "es", "en"]
 * @param {readonly string[]} options.supported idiomas que tiene la página; el primero es el de por defecto
 * @returns {string}
 */
export function pickLanguage({ saved, preferred, supported }) {
  if (saved && supported.includes(saved)) return saved;

  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0]; // "es-PE" → "es"
    if (supported.includes(base)) return base;
  }
  return supported[0];
}
