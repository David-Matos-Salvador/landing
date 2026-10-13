/** Botón de la página que prende y apaga la lámpara. Solo muestra el estado: no lo guarda. */

/**
 * @param {object} options
 * @param {HTMLButtonElement} options.button
 * @param {() => void} options.onToggle se llama cuando la persona pulsa el botón
 */
export function createLampSwitch({ button, onToggle }) {
  button.addEventListener("click", onToggle);

  return {
    /** @param {boolean} isOn refleja en el botón si la lámpara quedó encendida */
    show(isOn) {
      button.setAttribute("aria-pressed", String(isOn));
      button.setAttribute("aria-label", isOn ? "Turn the lamp off" : "Turn the lamp on");
    },
  };
}
