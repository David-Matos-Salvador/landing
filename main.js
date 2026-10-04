import * as THREE from "three";

// ============================================================
//  Config
// ============================================================
// Avatar VRoid del dueño (.vrm). Vacío = silla vacía y la laptop teclea sola.
const AVATAR_URL = "";
// Spotify: Jr — La Estrella. Vacío = usa music/bachata.mp3 (libre de derechos).
const SPOTIFY_TRACK_ID = "4d9fwUVP1SKEJubBUOeBKB";
const BPM = 128;

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PALETTE = {
  plum: new THREE.Color("#1B1530"),
  violet: new THREE.Color("#3A2F5B"),
  amber: new THREE.Color("#FFB45C"),
  teal: new THREE.Color("#6FD3D8"),
  rose: new THREE.Color("#E86A92"),
  paper: new THREE.Color("#F2E6D8"),
  ink: new THREE.Color("#120D22"),
};

// ============================================================
//  Renderer, escena y cámara
// ============================================================
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = PALETTE.plum.clone();

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const LOOK_AT = new THREE.Vector3(-0.7, 1.45, -0.7);
const CAM_BASE = new THREE.Vector3(6.5, 4.7, 7.6);

// Sombreado "anime": 3 tonos duros en vez de degradado suave.
const toonRamp = (() => {
  const data = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]);
  const tex = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();
const toon = (color) => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp });

// Contorno tipo dibujo: copia del objeto un poco más grande, por dentro y en tinta.
const outlineMat = new THREE.MeshBasicMaterial({ color: PALETTE.ink, side: THREE.BackSide });
function withOutline(mesh, thickness = 0.03) {
  const shell = new THREE.Mesh(mesh.geometry, outlineMat);
  mesh.geometry.computeBoundingBox();
  const size = new THREE.Vector3();
  mesh.geometry.boundingBox.getSize(size);
  shell.scale.set(
    1 + thickness / Math.max(size.x, 0.01) * 2,
    1 + thickness / Math.max(size.y, 0.01) * 2,
    1 + thickness / Math.max(size.z, 0.01) * 2
  );
  mesh.add(shell);
  return mesh;
}

function box(w, h, d, color, pos, outline = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(color));
  m.position.set(...pos);
  if (outline) withOutline(m);
  return m;
}

// ============================================================
//  El cuarto (diorama cortado, como casa de muñecas)
// ============================================================
const room = new THREE.Group();
scene.add(room);

const ROOM = { w: 6, h: 4.2, d: 5 };
room.add(box(ROOM.w, 0.2, ROOM.d, "#4A3B6E", [0, -0.1, 0]));                        // piso
room.add(box(ROOM.w, ROOM.h, 0.2, "#3A2F5B", [0, ROOM.h / 2, -ROOM.d / 2 - 0.1]));   // pared fondo
room.add(box(0.2, ROOM.h, ROOM.d, "#33295A", [-ROOM.w / 2 - 0.1, ROOM.h / 2, 0]));   // pared izquierda
room.add(box(2.4, 0.02, 2.0, "#5C3F72", [-0.9, 0.01, -0.5], false));                 // alfombra

// Ventana con lluvia (shader) en la pared del fondo.
const rainUniforms = { uTime: { value: 0 }, uTint: { value: PALETTE.teal.clone() } };
const windowGlass = new THREE.Mesh(
  new THREE.PlaneGeometry(2.0, 1.6),
  new THREE.ShaderMaterial({
    uniforms: rainUniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uTint; varying vec2 vUv;
      float hash(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        vec3 night = mix(vec3(0.07,0.06,0.16), uTint * 0.35, vUv.y * 0.6);
        float rain = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float cols = 38.0 + fi * 17.0;
          float col = floor(vUv.x * cols);
          float speed = 0.6 + hash(col + fi * 7.0) * 0.9;
          float y = fract(vUv.y + uTime * speed + hash(col * 3.1 + fi));
          float streak = smoothstep(0.0, 0.08, y) * smoothstep(0.22, 0.08, y);
          float thin = smoothstep(0.5, 0.0, abs(fract(vUv.x * cols) - 0.5) * 6.0);
          rain += streak * thin * (0.35 - fi * 0.08);
        }
        // Luces lejanas de la ciudad.
        float city = step(0.985, hash(floor(vUv.x * 60.0) + floor(vUv.y * 30.0) * 61.0)) * step(vUv.y, 0.35);
        gl_FragColor = vec4(night + uTint * rain + vec3(1.0,0.8,0.5) * city * 0.6, 1.0);
      }`,
  })
);
windowGlass.position.set(-0.6, 2.55, -ROOM.d / 2 + 0.005);
room.add(windowGlass);
// Marco y cruz de la ventana.
const frameColor = "#2A2148";
[[2.16, 0.1, 0, 0.84], [2.16, 0.1, 0, -0.84], [0.1, 1.78, 1.04, 0], [0.1, 1.78, -1.04, 0], [0.06, 1.6, 0, 0], [2.0, 0.06, 0, 0]].forEach(
  ([w, h, x, y]) => room.add(box(w, h, 0.08, frameColor, [-0.6 + x, 2.55 + y, -ROOM.d / 2 + 0.04]))
);

// Escritorio contra la pared izquierda.
const DESK = { x: -2.2, z: -0.6, top: 1.05 };
room.add(box(1.25, 0.08, 2.5, "#8A5A44", [DESK.x, DESK.top, DESK.z]));
[[-0.5, -1.1], [-0.5, 1.1], [0.5, -1.1], [0.5, 1.1]].forEach(([dx, dz]) =>
  room.add(box(0.08, DESK.top, 0.08, "#6B4433", [DESK.x + dx, DESK.top / 2, DESK.z + dz]))
);

// Laptop: base + pantalla con código (CanvasTexture) mirando hacia la silla (+x).
const laptop = new THREE.Group();
laptop.position.set(DESK.x - 0.05, DESK.top + 0.04, DESK.z);
room.add(laptop);
laptop.add(box(0.62, 0.03, 0.9, "#C9C3D9", [0, 0.015, 0]));
const screenCanvas = document.createElement("canvas");
screenCanvas.width = 512;
screenCanvas.height = 320;
const screenCtx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
const lid = new THREE.Group();
lid.position.set(-0.3, 0.03, 0);
lid.rotation.z = -0.32; // la tapa inclinada hacia atrás
laptop.add(lid);
lid.add(box(0.03, 0.58, 0.9, "#C9C3D9", [0, 0.29, 0]));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.52), new THREE.MeshBasicMaterial({ map: screenTex }));
screen.position.set(0.017, 0.29, 0);
screen.rotation.y = Math.PI / 2;
lid.add(screen);
const screenLight = new THREE.PointLight(PALETTE.teal, 1.2, 2.2, 2);
screenLight.position.set(DESK.x + 0.4, DESK.top + 0.4, DESK.z);
room.add(screenLight);

// Lámpara de escritorio.
const lamp = new THREE.Group();
lamp.position.set(DESK.x - 0.3, DESK.top + 0.04, DESK.z - 0.95);
room.add(lamp);
lamp.add(box(0.28, 0.05, 0.28, "#2A2148", [0, 0.025, 0]));
lamp.add(box(0.05, 0.75, 0.05, "#2A2148", [0, 0.4, 0]));
const shade = withOutline(new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.25, 20, 1, true), toon("#FFB45C")));
shade.position.set(0.12, 0.78, 0.1);
shade.rotation.z = -0.5;
lamp.add(shade);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color: "#FFE3B0" }));
bulb.position.set(0.16, 0.7, 0.12);
lamp.add(bulb);
const lampLight = new THREE.PointLight(PALETTE.amber, 9, 6, 1.6);
lampLight.position.set(DESK.x + 0.1, DESK.top + 0.75, DESK.z - 0.75);
room.add(lampLight);

// Taza con vapor.
const mug = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.16, 16), toon("#E86A92")));
mug.position.set(DESK.x + 0.15, DESK.top + 0.12, DESK.z + 0.85);
room.add(mug);
const steam = new THREE.Points(
  new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(18 * 3), 3)),
  new THREE.PointsMaterial({ color: "#F2E6D8", size: 0.05, transparent: true, opacity: 0.45, depthWrite: false })
);
room.add(steam);

// Silla frente al escritorio (el personaje mira hacia -x).
const CHAIR = { x: -1.15, z: -0.6, seat: 0.62 };
const chair = new THREE.Group();
chair.position.set(CHAIR.x, 0, CHAIR.z);
room.add(chair);
chair.add(box(0.7, 0.1, 0.7, "#2F2650", [0, CHAIR.seat, 0]));
chair.add(box(0.1, 0.85, 0.7, "#2F2650", [0.32, CHAIR.seat + 0.47, 0]));
chair.add(box(0.06, CHAIR.seat, 0.06, "#1F193A", [0, CHAIR.seat / 2, 0]));
chair.add(box(0.7, 0.05, 0.07, "#1F193A", [0, 0.03, 0], false));
chair.add(box(0.07, 0.05, 0.7, "#1F193A", [0, 0.03, 0], false));
// Hoodie colgado en el respaldo mientras no hay avatar.
const hoodie = box(0.16, 0.5, 0.62, "#E86A92", [0.4, CHAIR.seat + 0.55, 0]);
chair.add(hoodie);

// Estante con libros y una planta.
room.add(box(1.6, 0.06, 0.45, "#6B4433", [1.4, 2.4, -ROOM.d / 2 + 0.25]));
["#6FD3D8", "#FFB45C", "#E86A92", "#F2E6D8", "#9C8BD6"].forEach((c, i) =>
  room.add(box(0.16, 0.4 + (i % 3) * 0.08, 0.32, c, [0.8 + i * 0.22, 2.63 + (i % 3) * 0.04, -ROOM.d / 2 + 0.25]))
);
const pot = withOutline(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 16), toon("#C46A4A")));
pot.position.set(2.45, 0.2, -2.0);
room.add(pot);
for (let i = 0; i < 5; i++) {
  const leaf = withOutline(new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), toon("#5FA37A")));
  leaf.scale.set(0.5, 1.4, 0.5);
  const a = (i / 5) * Math.PI * 2;
  leaf.position.set(2.45 + Math.cos(a) * 0.14, 0.75 + (i % 2) * 0.15, -2.0 + Math.sin(a) * 0.14);
  leaf.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4);
  room.add(leaf);
}

// Polvo flotando en la luz de la lámpara.
const DUST = 70;
const dustPos = new Float32Array(DUST * 3);
for (let i = 0; i < DUST; i++) {
  dustPos[i * 3] = DESK.x + 0.4 + Math.random() * 1.6;
  dustPos[i * 3 + 1] = 0.8 + Math.random() * 2.2;
  dustPos[i * 3 + 2] = DESK.z - 1.2 + Math.random() * 2.4;
}
const dust = new THREE.Points(
  new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(dustPos, 3)),
  new THREE.PointsMaterial({ color: PALETTE.amber, size: 0.03, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending })
);
room.add(dust);

// ============================================================
//  Luces: modo lofi (azul) ↔ modo bachata (rosa)
// ============================================================
const hemi = new THREE.HemisphereLight("#6C7BD8", "#1B1530", 1.1);
scene.add(hemi);
const windowLight = new THREE.DirectionalLight(PALETTE.teal, 1.4);
windowLight.position.set(-0.6, 3.5, 3);
scene.add(windowLight);
const partyLight = new THREE.PointLight(PALETTE.rose, 0, 7, 1.4);
partyLight.position.set(0.6, 3.2, 0.6);
scene.add(partyLight);

const MODES = {
  lofi: { hemiSky: new THREE.Color("#6C7BD8"), window: PALETTE.teal, screen: PALETTE.teal, party: 0, rain: PALETTE.teal },
  bachata: { hemiSky: new THREE.Color("#C05C9A"), window: PALETTE.rose, screen: PALETTE.rose, party: 7, rain: PALETTE.rose },
};

// ============================================================
//  Pantalla de la laptop: código que se escribe solo / ecualizador
// ============================================================
const CODE = [
  "// room.js — 2:07 a.m.",
  "const coffee = await brew({ strength: 'high' });",
  "",
  "export async function ship(app) {",
  "  const build = await docker.build(app);",
  "  await coolify.deploy(build, {",
  "    domain: 'davidmatos.lat',",
  "    https: true,",
  "  });",
  "  return 'it works on my server';",
  "}",
  "",
  "if (tired()) play('bachata');",
];
const typing = { line: 0, char: 0, next: 0 };

function drawCode(t) {
  const ctx = screenCtx;
  ctx.fillStyle = "#151027";
  ctx.fillRect(0, 0, 512, 320);
  ctx.font = '600 17px "M PLUS 1 Code", monospace';
  ctx.textBaseline = "top";
  if (t > typing.next) {
    typing.char++;
    if (typing.char > CODE[typing.line].length) {
      typing.line++;
      typing.char = 0;
      if (typing.line >= CODE.length) { typing.line = 0; }
    }
    typing.next = t + (reduceMotion ? 0.12 : 0.05 + Math.random() * 0.09);
  }
  const visible = CODE.slice(0, typing.line).concat(CODE[typing.line].slice(0, typing.char));
  visible.slice(-12).forEach((line, i) => {
    ctx.fillStyle = line.trim().startsWith("//") ? "#7E74A8" : line.includes("'") ? "#FFB45C" : "#F2E6D8";
    ctx.fillText(line, 20, 18 + i * 24);
  });
  if (Math.floor(t * 2) % 2 === 0) {
    const last = visible.slice(-12);
    const y = 18 + (last.length - 1) * 24;
    const x = 20 + ctx.measureText(last[last.length - 1] || "").width + 2;
    ctx.fillStyle = "#6FD3D8";
    ctx.fillRect(x, y, 9, 18);
  }
}

function drawEqualizer(t) {
  const ctx = screenCtx;
  ctx.fillStyle = "#1E1030";
  ctx.fillRect(0, 0, 512, 320);
  ctx.fillStyle = "#F2E6D8";
  ctx.font = '700 22px "Zen Maru Gothic", sans-serif';
  ctx.fillText("now playing", 24, 22);
  const beat = (t * BPM) / 60;
  for (let i = 0; i < 24; i++) {
    const h = 30 + Math.abs(Math.sin(beat * Math.PI + i * 0.7)) * 150 * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.3)));
    ctx.fillStyle = i % 2 ? "#E86A92" : "#FFB45C";
    ctx.fillRect(24 + i * 19.5, 290 - h, 12, h);
  }
}

// ============================================================
//  Avatar VRoid (opcional): se sienta en la silla, teclea y baila
// ============================================================
let vrm = null;
async function loadAvatar() {
  if (!AVATAR_URL) return;
  const [{ GLTFLoader }, { VRMLoaderPlugin, VRMUtils }] = await Promise.all([
    import("three/addons/loaders/GLTFLoader.js"),
    import("@pixiv/three-vrm"),
  ]);
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const gltf = await loader.loadAsync(AVATAR_URL);
  vrm = gltf.userData.vrm;
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  VRMUtils.rotateVRM0(vrm); // los VRM 0.x miran al revés; así todos miran a +z
  vrm.scene.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
  vrm.scene.rotation.y = -Math.PI / 2; // +z → -x: mirando a la laptop
  vrm.scene.position.set(CHAIR.x - 0.05, 0, CHAIR.z);
  scene.add(vrm.scene);
  hoodie.visible = false;
  sitDown();
}

function bone(name) { return vrm?.humanoid.getNormalizedBoneNode(name); }

function sitDown() {
  // Muslos al frente y canillas hacia abajo; luego bajamos todo hasta que la cadera toque el asiento.
  ["leftUpperLeg", "rightUpperLeg"].forEach((b) => bone(b) && (bone(b).rotation.x = -Math.PI / 2));
  ["leftLowerLeg", "rightLowerLeg"].forEach((b) => bone(b) && (bone(b).rotation.x = Math.PI / 2));
  vrm.update(0);
  const hips = new THREE.Vector3();
  bone("hips").getWorldPosition(hips);
  vrm.scene.position.y -= hips.y - (CHAIR.seat + 0.12);
}

function poseAvatar(t, mode, beatLevel, sway) {
  if (!vrm) return;
  const L = bone("leftUpperArm"), R = bone("rightUpperArm");
  const LL = bone("leftLowerArm"), RL = bone("rightLowerArm");
  const spine = bone("spine"), head = bone("head"), hips = bone("hips");
  if (mode === "lofi") {
    // Tecleando: brazos al frente, antebrazos sobre el teclado, dedos "rápidos".
    L && L.rotation.set(-0.9, 0, -1.05 + Math.sin(t * 9) * 0.03);
    R && R.rotation.set(-0.9, 0, 1.05 + Math.sin(t * 8 + 1) * 0.03);
    LL && LL.rotation.set(0, -0.9, 0);
    RL && RL.rotation.set(0, 0.9, 0);
    spine && spine.rotation.set(0.12, 0, 0);
    head && head.rotation.set(0.15 + Math.sin(t * 0.7) * 0.03, Math.sin(t * 0.4) * 0.05, 0);
    hips && (hips.rotation.y = 0);
  } else {
    // Bachata sentado: cadera y hombros al ritmo 1-2-3-tap, cabeza siguiendo el beat.
    L && L.rotation.set(-0.2, 0, -1.2 + beatLevel * 0.25);
    R && R.rotation.set(-0.2, 0, 1.2 - beatLevel * 0.25);
    LL && LL.rotation.set(0, -0.6, 0);
    RL && RL.rotation.set(0, 0.6, 0);
    spine && spine.rotation.set(0.02, sway * 0.18, sway * 0.12);
    head && head.rotation.set(-0.05 + beatLevel * 0.12, sway * 0.15, -sway * 0.1);
    hips && (hips.rotation.y = sway * 0.12);
  }
  vrm.update(1 / 60);
}

// ============================================================
//  Música (Spotify o mp3) y botón Play
// ============================================================
const body = document.body;
const playBtn = document.getElementById("play");
const playLabel = playBtn.querySelector(".play__label");
const spotifyBox = document.getElementById("spotify");
const music = document.getElementById("music");
let spotify = null;

if (SPOTIFY_TRACK_ID) {
  window.onSpotifyIframeApiReady = (IFrameAPI) => {
    IFrameAPI.createController(
      document.getElementById("spotify-embed"),
      { uri: `spotify:track:${SPOTIFY_TRACK_ID}`, width: "100%", height: 80 },
      (controller) => { spotify = controller; }
    );
  };
  const s = document.createElement("script");
  s.src = "https://open.spotify.com/embed/iframe-api/v1";
  s.async = true;
  document.head.appendChild(s);
}

let mode = "lofi";
let modeChangedAt = 0;
playBtn.addEventListener("click", () => {
  mode = mode === "lofi" ? "bachata" : "lofi";
  modeChangedAt = clock.elapsedTime;
  const on = mode === "bachata";
  body.dataset.mode = mode;
  playBtn.setAttribute("aria-pressed", String(on));
  playLabel.textContent = on ? "Pause" : "Play bachata";
  if (SPOTIFY_TRACK_ID) {
    spotifyBox.classList.toggle("is-on", on);
    spotifyBox.setAttribute("aria-hidden", String(!on));
    if (spotify) on ? spotify.play() : spotify.pause();
  } else {
    on ? music.play().catch(() => {}) : music.pause();
  }
});

// ============================================================
//  Encuadre responsive: diorama a la derecha (escritorio) o arriba (móvil)
// ============================================================
function frame() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  if (w > 760) {
    // Desplazamos el centro de la imagen hacia la derecha para dejar la columna de texto.
    camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
    camera.fov = 30;
  } else {
    camera.setViewOffset(w, h, 0, h * 0.2, w, h);
    camera.fov = 44;
  }
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", frame);
frame();

const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
});

// ============================================================
//  Loop
// ============================================================
const clock = new THREE.Clock();
let beatLevel = 0, sway = 0, mix = 0;
const tmpColor = new THREE.Color();
let screenFrame = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const motion = reduceMotion ? 0.3 : 1;

  // Transición suave entre modos (mix 0 = lofi, 1 = bachata).
  const targetMix = mode === "bachata" ? 1 : 0;
  mix += (targetMix - mix) * Math.min(1, dt * 1.8);

  // Ritmo de bachata: 8 tiempos, 1-2-3-tap a cada lado; el "tap" pega más suave.
  let targetBeat = 0, targetSway = 0;
  if (mode === "bachata" && t - modeChangedAt > 0.8) {
    const beats = (t * BPM) / 60;
    const step = Math.floor(beats) % 8;
    const phase = beats % 1;
    targetBeat = Math.exp(-phase * 5) * (step % 4 === 3 ? 0.4 : 1);
    targetSway = (step < 4 ? 1 : -1) * Math.min(step % 4, 2.5) * 0.4;
  }
  beatLevel += (targetBeat - beatLevel) * Math.min(1, dt * 16);
  sway += (targetSway - sway) * Math.min(1, dt * 3.5);

  // Colores según el modo.
  hemi.color.copy(MODES.lofi.hemiSky).lerp(MODES.bachata.hemiSky, mix);
  windowLight.color.copy(MODES.lofi.window).lerp(MODES.bachata.window, mix);
  screenLight.color.copy(MODES.lofi.screen).lerp(MODES.bachata.screen, mix);
  rainUniforms.uTint.value.copy(MODES.lofi.rain).lerp(MODES.bachata.rain, mix);
  partyLight.intensity = mix * (MODES.bachata.party * (0.55 + beatLevel * 0.6));
  scene.background.copy(PALETTE.plum).lerp(tmpColor.set("#2A1433"), mix * 0.8);
  lampLight.intensity = 9 * (1 - mix * 0.35) + Math.sin(t * 13) * 0.08;

  rainUniforms.uTime.value = t * 0.35 * motion;

  // Pantalla: se redibuja ~20 veces por segundo.
  if (++screenFrame % 3 === 0) {
    mode === "bachata" ? drawEqualizer(t) : drawCode(t);
    screenTex.needsUpdate = true;
  }

  // Vapor de la taza.
  const sp = steam.geometry.attributes.position.array;
  for (let i = 0; i < 18; i++) {
    const life = (t * 0.35 * motion + i / 18) % 1;
    sp[i * 3] = mug.position.x + Math.sin(life * 6 + i) * 0.04;
    sp[i * 3 + 1] = mug.position.y + 0.1 + life * 0.45;
    sp[i * 3 + 2] = mug.position.z + Math.cos(life * 5 + i) * 0.04;
  }
  steam.geometry.attributes.position.needsUpdate = true;
  steam.material.opacity = 0.45;

  // Polvo flotando (y "brincando" con el beat).
  const dp = dust.geometry.attributes.position.array;
  for (let i = 0; i < DUST; i++) {
    dp[i * 3 + 1] += (0.02 + beatLevel * 0.25) * dt * motion;
    if (dp[i * 3 + 1] > 3.1) dp[i * 3 + 1] = 0.8;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  dust.material.color.copy(PALETTE.amber).lerp(PALETTE.rose, mix);

  // Hoodie (sin avatar) se mece un poquito con la música.
  hoodie.rotation.x = sway * 0.08;

  poseAvatar(t, mode, beatLevel, sway);

  // Cámara: parallax con el mouse y balanceo suave con la bachata.
  const swayCam = reduceMotion ? 0 : sway * 0.25;
  camera.position.set(
    CAM_BASE.x + pointer.x * 0.6 + swayCam,
    CAM_BASE.y - pointer.y * 0.35,
    CAM_BASE.z
  );
  camera.lookAt(LOOK_AT);
  room.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.15) * 0.03;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

loadAvatar().catch((err) => console.warn("No se pudo cargar el avatar:", err));
document.fonts?.ready.then(() => { typing.next = 0; });
requestAnimationFrame(animate);
