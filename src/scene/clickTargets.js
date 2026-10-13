/**
 * Permite hacer clic en objetos 3D. Usa un "raycaster": lanza un rayo desde la cámara
 * hacia donde está el puntero y revisa qué objeto atraviesa primero.
 */
import * as THREE from "three";

/**
 * @param {THREE.Camera} camera
 * @param {HTMLCanvasElement} canvas
 */
export function createClickTargets(camera, canvas) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  /** @type {{ object: THREE.Object3D, onClick: () => void }[]} */
  const targets = [];

  /** Devuelve el objeto registrado que está bajo el puntero, si hay alguno. */
  function targetUnder(event) {
    // El raycaster espera la posición de -1 a 1, con el eje Y hacia arriba.
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    return targets.find((target) => raycaster.intersectObject(target.object).length > 0);
  }

  canvas.addEventListener("click", (event) => targetUnder(event)?.onClick());
  // El cursor cambia a "manito" sobre un objeto clicable, como en un enlace.
  canvas.addEventListener("pointermove", (event) => {
    canvas.style.cursor = targetUnder(event) ? "pointer" : "";
  });

  return {
    /**
     * @param {THREE.Object3D} object
     * @param {() => void} onClick
     */
    add(object, onClick) {
      targets.push({ object, onClick });
    },
  };
}
