/**
 * Calcula cómo recortar una imagen para que llene un marco sin deformarse, igual que
 * `object-fit: cover` en CSS: se agranda hasta cubrir todo y lo que sobra queda fuera, centrado.
 *
 * Devuelve qué fracción de la imagen se ve (`repeat`) y desde dónde empieza (`offset`),
 * los dos de 0 a 1 por cada eje. Es el formato que usan las texturas de Three.js.
 *
 * @param {number} imageAspect ancho / alto de la imagen
 * @param {number} frameAspect ancho / alto del marco
 * @returns {{ repeat: { x: number, y: number }, offset: { x: number, y: number } }}
 */
export function coverFit(imageAspect, frameAspect) {
  const repeat = { x: 1, y: 1 };
  if (imageAspect > frameAspect) {
    repeat.x = frameAspect / imageAspect; // imagen más ancha que el marco: se cortan los lados
  } else {
    repeat.y = imageAspect / frameAspect; // imagen más alta: se corta arriba y abajo
  }
  return { repeat, offset: { x: (1 - repeat.x) / 2, y: (1 - repeat.y) / 2 } };
}
