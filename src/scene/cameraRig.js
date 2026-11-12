/**
 * Mueve la cámara. Cada sección de la página tiene una "toma" (dónde está la cámara y a qué
 * mira); al hacer scroll la cámara viaja de una toma a la siguiente. Encima se suma un
 * movimiento pequeño: parallax con el mouse. La música no mueve la cámara.
 */
import * as THREE from "three";
import { reduceMotion } from "../lib/env.js";
import { smoothstep } from "../lib/math.js";

const v = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Una toma por sección, en el mismo orden que en index.html. `id` es el id de la <section>.
 * Para agregar una sección: una <section id="..."> en el HTML y una línea aquí.
 */
const SHOTS = [
  { id: "room", position: v(6.5, 4.7, 7.6), lookAt: v(-0.7, 1.35, -0.7) }, // el cuarto
  { id: "about", position: v(1.2, 2.9, 1.6), lookAt: v(-0.6, 2.5, -2.5) }, // la ventana
  { id: "agents", position: v(0.2, 2.3, 1.0), lookAt: v(-2.45, 1.45, -1.45) }, // la lámpara
  { id: "work", position: v(-0.2, 1.9, 0.9), lookAt: v(-2.2, 1.2, -0.6) }, // la laptop
  { id: "projects", position: v(0.5, 2.4, 0.9), lookAt: v(0.7, 2.05, -2.5) }, // la repisa
  { id: "life", position: v(0.6, 2.6, 0.3), lookAt: v(-3.0, 2.45, 0.0) }, // el cuadro
  { id: "contact", position: v(8.6, 7.2, 9.8), lookAt: v(-0.4, 1.0, -0.4) }, // todo el cuarto, desde lejos
];

/** La cámara se queda quieta en cada toma y viaja recién en la última parte de la sección. */
const TRAVEL_STARTS_AT = 0.45;
/** Qué tan rápido persigue la cámara a su destino (más alto = más brusco). */
const FOLLOW_RATE = 3;
const PARALLAX = { x: 0.6, y: 0.35 };

/** @param {THREE.PerspectiveCamera} camera */
export function createCameraRig(camera) {
  const sections = SHOTS.map((shot) => document.getElementById(shot.id));

  // Posición del puntero, de -1 (izquierda / arriba) a 1 (derecha / abajo).
  const pointer = { x: 0, y: 0 };
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  });

  // Vectores que se reutilizan en cada frame, para no crear objetos nuevos 60 veces por segundo.
  const goal = { position: new THREE.Vector3(), lookAt: new THREE.Vector3() };
  const current = { position: SHOTS[0].position.clone(), lookAt: SHOTS[0].lookAt.clone() };

  /**
   * En qué sección está el centro de la pantalla, con decimales:
   * 0 = primera sección, 1.5 = a mitad de camino entre la segunda y la tercera.
   */
  function scrollProgress() {
    const middle = window.scrollY + window.innerHeight / 2;
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (middle < section.offsetTop) continue;
      const next = sections[i + 1];
      if (!next) return i;
      const span = next.offsetTop - section.offsetTop;
      return i + Math.min(1, (middle - section.offsetTop) / span);
    }
    return 0;
  }

  /** Mezcla la toma actual con la siguiente según el avance del scroll. */
  function updateGoal(progress) {
    const from = Math.min(Math.floor(progress), SHOTS.length - 1);
    const to = Math.min(from + 1, SHOTS.length - 1);
    const travel = Math.max(0, (progress - from - TRAVEL_STARTS_AT) / (1 - TRAVEL_STARTS_AT));
    const eased = smoothstep(travel);
    goal.position.copy(SHOTS[from].position).lerp(SHOTS[to].position, eased);
    goal.lookAt.copy(SHOTS[from].lookAt).lerp(SHOTS[to].lookAt, eased);
  }

  /** @param {number} dt segundos desde el frame anterior */
  function update(dt) {
    updateGoal(scrollProgress());
    const follow = Math.min(1, dt * FOLLOW_RATE);
    current.position.lerp(goal.position, follow);
    current.lookAt.lerp(goal.lookAt, follow);

    const offsetX = reduceMotion ? 0 : pointer.x * PARALLAX.x;
    const offsetY = reduceMotion ? 0 : pointer.y * PARALLAX.y;
    camera.position.set(current.position.x + offsetX, current.position.y - offsetY, current.position.z);
    camera.lookAt(current.lookAt);
  }

  return { sections, update };
}
