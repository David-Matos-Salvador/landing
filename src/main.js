/**
 * Punto de entrada. Este archivo no "hace" nada por sí mismo: crea cada pieza, las conecta
 * y corre el loop de animación. Para entender el sitio, empieza por aquí y sigue los imports.
 * Mapa completo en docs/ARCHITECTURE.md.
 */
import * as THREE from "three";
import { AVATAR_URL } from "./config.js";
import { loadAvatar } from "./scene/avatar.js";
import { createCameraRig } from "./scene/cameraRig.js";
import { addLights } from "./scene/lights.js";
import { applyMood } from "./scene/mood.js";
import { createRhythm } from "./scene/rhythm.js";
import { buildRoom } from "./scene/room.js";
import { createStage } from "./scene/stage.js";
import { createLoader } from "./ui/loader.js";
import { initNav } from "./ui/nav.js";
import { createPlayer } from "./ui/player.js";

/** Si la pestaña estuvo en segundo plano, el salto de tiempo se limita para que nada "teletransporte". */
const MAX_FRAME_SECONDS = 0.05;

// --- 1. Página: loader, música y navbar ---------------------------------------------------
const loader = createLoader({
  numberElement: document.getElementById("loader-num"),
  tasks: ["fonts", "shaders", "avatar", "firstFrame"],
});
const player = createPlayer({
  button: document.getElementById("play"),
  audio: document.getElementById("music"),
});

// --- 2. Escena 3D -------------------------------------------------------------------------
const { renderer, scene, camera } = createStage(document.getElementById("scene"));
const room = buildRoom(scene);
const lights = addLights(scene);
const cameraRig = createCameraRig(camera);
const rhythm = createRhythm();
initNav(cameraRig.sections);

/** @type {Awaited<ReturnType<typeof loadAvatar>>} */
let avatar = null;

// --- 3. Tareas de carga -------------------------------------------------------------------
if (document.fonts) {
  document.fonts.ready.then(() => {
    loader.complete("fonts");
    room.laptop.resumeTyping(); // la pantalla usa la fuente de código: que no espere para escribir
  });
} else {
  loader.complete("fonts");
}

// Compilar los shaders antes del primer frame evita un tirón al abrir la página.
// (Síncrono a propósito: compileAsync a veces no resuelve.)
try {
  renderer.compile(scene, camera);
} catch (error) {
  console.warn("No se pudieron precompilar los shaders:", error);
}
loader.complete("shaders");

loadAvatar(scene, AVATAR_URL)
  .then((loaded) => {
    avatar = loaded;
    if (avatar) room.hoodie.visible = false; // con avatar, el hoodie ya no cuelga de la silla
  })
  .catch((error) => console.warn("No se pudo cargar el avatar:", error))
  .finally(() => loader.complete("avatar"));

// --- 4. Loop de animación: se ejecuta una vez por frame -----------------------------------
const timer = new THREE.Timer();
timer.connect(document); // pausa el reloj cuando la pestaña queda en segundo plano

/** @param {number} timestamp milisegundos; lo entrega requestAnimationFrame */
function animate(timestamp) {
  timer.update(timestamp);
  const dt = Math.min(timer.getDelta(), MAX_FRAME_SECONDS); // segundos desde el frame anterior
  const t = timer.getElapsed(); // segundos desde que empezó la escena
  const { mode, bpm } = player;

  // Primero se calcula el ritmo; después cada pieza lo usa para moverse.
  const beat = rhythm.update(dt, t, mode, bpm);

  applyMood(beat, {
    screenLightColor: room.laptop.light.color,
    rainTint: room.rainTint,
    partyLight: lights.party,
  });
  room.update({ t, sway: beat.sway });
  room.laptop.update({ t, mode, bpm });
  room.lamp.update({ dt, t, mix: beat.mix, isOn: loader.isDone });
  avatar?.pose({ dt, t, mode, beatLevel: beat.beatLevel, sway: beat.sway });
  cameraRig.update({ dt, sway: beat.sway });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame((timestamp) => {
  animate(timestamp);
  loader.complete("firstFrame");
});
