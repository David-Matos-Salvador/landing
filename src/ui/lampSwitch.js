/** Botón de la página que prende y apaga la lámpara. Solo muestra el estado: no lo guarda. */
import { onLanguageChange, t } from "../i18n/index.js";

/**
 * @param {object} options
 * @param {HTMLButtonElement} options.button
 * @param {() => void} options.onToggle se llama cuando la persona pulsa el botón
 */
export function createLampSwitch({ button, onToggle }) {
  let isLampOn = true;

  function render() {
    button.setAttribute("aria-pressed", String(isLampOn));
    button.setAttribute("aria-label", t(isLampOn ? "lamp.turnOff" : "lamp.turnOn"));
  }

  button.addEventListener("click", onToggle);
  onLanguageChange(render);
  render();

  return {
    /** @param {boolean} isOn refleja en el botón si la lámpara quedó encendida */
    show(isOn) {
      isLampOn = isOn;
      render();
    },
  };
}
