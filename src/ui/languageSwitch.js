/** Botón "EN / ES": muestra el idioma activo y cambia al otro con un clic. */
import { getLanguage, initLanguage, LANGUAGES, onLanguageChange, t } from "../i18n/index.js";

/**
 * @param {object} options
 * @param {HTMLButtonElement} options.button
 * @param {{ title: string, description: string }} options.meta claves del <title> y la descripción
 */
export function createLanguageSwitch({ button, meta }) {
  const { setLanguage } = initLanguage(meta);

  function show() {
    const language = getLanguage();
    for (const label of button.querySelectorAll("[data-lang]")) {
      label.toggleAttribute("data-active", label.dataset.lang === language);
    }
    button.setAttribute("aria-label", t("language.switch"));
  }

  button.addEventListener("click", () => {
    const next = LANGUAGES[(LANGUAGES.indexOf(getLanguage()) + 1) % LANGUAGES.length];
    setLanguage(next);
  });
  onLanguageChange(show);
  show();
}
