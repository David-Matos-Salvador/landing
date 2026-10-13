/** Ventana con lluvia: un plano con un shader y un marco simple alrededor. */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { COLORS, ROOM, WINDOW } from "../layout.js";
import { block } from "../primitives.js";

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTint;
  varying vec2 vUv;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec3 night = mix(vec3(0.06, 0.06, 0.14), uTint * 0.3, vUv.y * 0.55);

    // Dos capas de gotas: columnas finas que caen a velocidades distintas.
    float rain = 0.0;
    for (int i = 0; i < 2; i++) {
      float fi = float(i);
      float cols = 34.0 + fi * 19.0;
      float col = floor(vUv.x * cols);
      float speed = 0.6 + hash(col + fi * 7.0) * 0.9;
      float y = fract(vUv.y + uTime * speed + hash(col * 3.1 + fi));
      float streak = smoothstep(0.0, 0.08, y) * smoothstep(0.22, 0.08, y);
      float thin = smoothstep(0.5, 0.0, abs(fract(vUv.x * cols) - 0.5) * 6.0);
      rain += streak * thin * (0.3 - fi * 0.08);
    }

    // Luna y un reflejo diagonal suave: que se lea como vidrio.
    vec2 moonUv = vUv * vec2(1.21, 1.0);
    float moon = smoothstep(0.075, 0.065, distance(moonUv, vec2(0.82, 0.74)));
    float halo = smoothstep(0.3, 0.0, distance(moonUv, vec2(0.82, 0.74))) * 0.18;
    float glare = smoothstep(0.06, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.12)) * 0.07;

    vec3 color = night + uTint * rain + vec3(1.0, 0.96, 0.85) * (moon * 0.9 + halo) + glare;
    gl_FragColor = vec4(color, 1.0);
  }`;

/**
 * @param {THREE.Group} room
 * @returns {{ uniforms: { uTime: { value: number }, uTint: { value: THREE.Color } } }}
 *   `uTime` mueve la lluvia y `uTint` le da color.
 */
export function addWindow(room) {
  const { x, y, w, h, frame } = WINDOW;
  const wallZ = -ROOM.d / 2;
  const uniforms = { uTime: { value: 0 }, uTint: { value: new THREE.Color(PALETTE.mint) } };

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER }),
  );
  glass.position.set(x, y, wallZ + 0.002);
  room.add(glass);

  const frameZ = wallZ + 0.03;
  room.add(
    block(w + frame * 2, frame, 0.06, COLORS.metal, [x, y + h / 2 + frame / 2, frameZ]), // arriba
    block(w + frame * 2, frame, 0.06, COLORS.metal, [x, y - h / 2 - frame / 2, frameZ]), // abajo
    block(frame, h, 0.06, COLORS.metal, [x - w / 2 - frame / 2, y, frameZ]), // izquierda
    block(frame, h, 0.06, COLORS.metal, [x + w / 2 + frame / 2, y, frameZ]), // derecha
    block(w + 0.3, 0.05, 0.2, COLORS.metal, [x, y - h / 2 - frame - 0.02, wallZ + 0.1]), // alféizar
    block(0.045, h, 0.05, COLORS.metal, [x, y, frameZ]), // parante
    block(w, 0.045, 0.05, COLORS.metal, [x, y + 0.12, frameZ]), // travesaño
  );

  return { uniforms };
}
