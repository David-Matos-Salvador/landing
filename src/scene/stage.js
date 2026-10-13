/** El "escenario": renderer, escena y cámara, y cómo se adaptan al tamaño de la ventana. */
import * as THREE from "three";
import { MOBILE_QUERY, PALETTE } from "../config.js";

const mobile = window.matchMedia(MOBILE_QUERY);

/** @param {HTMLCanvasElement} canvas */
export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  // Sombras de bordes suaves: lo que le da profundidad al cuarto sin agregar objetos.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.night);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  /** Ajusta el lienzo y el encuadre: el cuarto queda a la derecha (escritorio) o arriba (móvil). */
  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    if (mobile.matches) {
      camera.setViewOffset(w, h, 0, h * 0.2, w, h);
      camera.fov = 44;
    } else {
      // Desplazamos el centro de la imagen hacia la derecha para dejar la columna de texto.
      camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      camera.fov = 30;
    }
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return { renderer, scene, camera };
}
