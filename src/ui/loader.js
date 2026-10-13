/**
 * Pantalla de carga. El porcentaje refleja tareas reales (fuentes, shaders, avatar, primer
 * frame): cada una avisa con complete() cuando termina.
 */
import { LOADER } from "../config.js";
import { reduceMotion } from "../lib/env.js";

/**
 * @param {object} options
 * @param {HTMLElement} options.numberElement donde se escribe el porcentaje
 * @param {string[]} options.tasks nombres de las tareas que hay que esperar
 */
export function createLoader({ numberElement, tasks }) {
  const pending = new Set(tasks);
  const startedAt = performance.now();
  let shown = 0; // porcentaje en pantalla; persigue al real para que no salte
  let isDone = false;

  /** @param {string} task */
  function complete(task) {
    pending.delete(task);
  }

  function tick() {
    const realProgress = 1 - pending.size / tasks.length;
    // Tope por tiempo: aunque todo cargue al instante, el número tarda un momento en llegar a 100.
    const timeCap = reduceMotion ? 1 : Math.min(1, (performance.now() - startedAt) / LOADER.minVisibleMs);
    const target = Math.min(realProgress, timeCap) * 100;

    shown += (target - shown) * 0.12;
    if (target - shown < 0.6) shown = target;
    numberElement.textContent = String(Math.round(shown));

    if (shown >= 100) {
      isDone = true;
      document.body.classList.remove("is-loading"); // el CSS oculta el loader y muestra la página
      return;
    }
    requestAnimationFrame(tick);
  }

  // Red de seguridad: si algo se queda colgado, abrimos la página igual.
  setTimeout(() => pending.clear(), LOADER.safetyTimeoutMs);
  requestAnimationFrame(tick);

  return {
    complete,
    get isDone() {
      return isDone;
    },
  };
}
