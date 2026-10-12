import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ============================================================
//  Config
// ============================================================
// Avatar VRoid del dueño (.vrm). Vacío = silla vacía y la laptop teclea sola.
const AVATAR_URL = "";
// Música: lista en music/playlist.json (mp3 libres de derechos servidos desde el VPS).
const PLAYLIST_URL = "music/playlist.json";
let BPM = 128; // cambia con cada canción (campo "bpm" de la playlist)

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PALETTE = {
  plum: new THREE.Color("#0F1E1A"),   // fondo: noche de bosque
  violet: new THREE.Color("#23392F"),
  amber: new THREE.Color("#FFB45C"),
  teal: new THREE.Color("#8FD6B8"),   // menta: lluvia y luz de la pantalla
  rose: new THREE.Color("#E86A92"),
  paper: new THREE.Color("#F2E6D8"),
  ink: new THREE.Color("#08120F"),
};

// ============================================================
//  Renderer, escena y cámara
// ============================================================
const canvas = document.getElementById("scene");
const isSmall = window.matchMedia("(max-width: 760px)").matches;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
// Sombras suaves reales: lo que le da profundidad al cuarto sin agregar objetos.
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = PALETTE.plum.clone();

const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
const LOOK_AT = new THREE.Vector3(-0.7, 1.35, -0.7);
const CAM_BASE = new THREE.Vector3(6.5, 4.7, 7.6);

// Estilo low-poly limpio: materiales mate de color plano y bordes apenas redondeados.
const matte = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });

function block(w, h, d, color, pos, radius = 0.025) {
  const r = Math.min(radius, w / 2.2, h / 2.2, d / 2.2);
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), matte(color));
  m.position.set(...pos);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ============================================================
//  El cuarto: solo lo esencial (piso, 2 paredes, ventana, escritorio, laptop, lámpara, silla)
// ============================================================
const room = new THREE.Group();
scene.add(room);

const ROOM = { w: 6, h: 4.2, d: 5 };
const C = {
  floor: "#6B513F",
  wallBack: "#2F4D41",
  wallSide: "#294437",
  wood: "#A2774F",
  woodDark: "#7E5A3E",
  metal: "#1E2E28",
  laptop: "#C9CFC8",
  chair: "#22352E",
  rug: "#C2A27A",
};

room.add(block(ROOM.w, 0.16, ROOM.d, C.floor, [0, -0.08, 0], 0.02));
room.add(block(ROOM.w, ROOM.h, 0.14, C.wallBack, [0, ROOM.h / 2, -ROOM.d / 2 - 0.07], 0.02));
room.add(block(0.14, ROOM.h, ROOM.d, C.wallSide, [-ROOM.w / 2 - 0.07, ROOM.h / 2, 0], 0.02));

// Ventana con lluvia (shader) en la pared del fondo: marco simple, sin cruces.
const rainUniforms = { uTime: { value: 0 }, uTint: { value: PALETTE.teal.clone() } };
const WIN = { x: -0.5, y: 2.5, w: 1.7, h: 1.4 };
const windowGlass = new THREE.Mesh(
  new THREE.PlaneGeometry(WIN.w, WIN.h),
  new THREE.ShaderMaterial({
    uniforms: rainUniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform vec3 uTint; varying vec2 vUv;
      float hash(float n){ return fract(sin(n) * 43758.5453); }
      void main(){
        vec3 night = mix(vec3(0.06,0.06,0.14), uTint * 0.3, vUv.y * 0.55);
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
        float moon = smoothstep(0.075, 0.065, distance(vUv * vec2(1.21, 1.0), vec2(0.82, 0.74)));
        float halo = smoothstep(0.3, 0.0, distance(vUv * vec2(1.21, 1.0), vec2(0.82, 0.74))) * 0.18;
        float glare = smoothstep(0.06, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.12)) * 0.07;
        vec3 col = night + uTint * rain + vec3(1.0, 0.96, 0.85) * (moon * 0.9 + halo) + glare;
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
);
windowGlass.position.set(WIN.x, WIN.y, -ROOM.d / 2 + 0.002);
room.add(windowGlass);
const FW = 0.07; // grosor del marco
room.add(block(WIN.w + FW * 2, FW, 0.06, C.metal, [WIN.x, WIN.y + WIN.h / 2 + FW / 2, -ROOM.d / 2 + 0.03]));
room.add(block(WIN.w + FW * 2, FW, 0.06, C.metal, [WIN.x, WIN.y - WIN.h / 2 - FW / 2, -ROOM.d / 2 + 0.03]));
room.add(block(FW, WIN.h, 0.06, C.metal, [WIN.x - WIN.w / 2 - FW / 2, WIN.y, -ROOM.d / 2 + 0.03]));
room.add(block(FW, WIN.h, 0.06, C.metal, [WIN.x + WIN.w / 2 + FW / 2, WIN.y, -ROOM.d / 2 + 0.03]));
room.add(block(WIN.w + 0.3, 0.05, 0.2, C.metal, [WIN.x, WIN.y - WIN.h / 2 - FW - 0.02, -ROOM.d / 2 + 0.1])); // alféizar
room.add(block(0.045, WIN.h, 0.05, C.metal, [WIN.x, WIN.y, -ROOM.d / 2 + 0.03]));          // parante
room.add(block(WIN.w, 0.045, 0.05, C.metal, [WIN.x, WIN.y + 0.12, -ROOM.d / 2 + 0.03]));    // travesaño

// Escritorio contra la pared izquierda: tablero + 2 patas tipo panel.
const DESK = { x: -2.2, z: -0.6, top: 1.0 };
room.add(block(1.2, 0.07, 2.3, C.wood, [DESK.x, DESK.top, DESK.z], 0.03));
[-1.0, 1.0].forEach((dz) => room.add(block(1.05, DESK.top - 0.04, 0.06, C.woodDark, [DESK.x, (DESK.top - 0.04) / 2, DESK.z + dz])));

// Laptop: base + tapa + pantalla con código (CanvasTexture), mirando hacia la silla (+x).
const laptop = new THREE.Group();
laptop.position.set(DESK.x - 0.05, DESK.top + 0.035, DESK.z);
room.add(laptop);
laptop.add(block(0.6, 0.025, 0.88, C.laptop, [0, 0.0125, 0], 0.01));
const screenCanvas = document.createElement("canvas");
screenCanvas.width = 512;
screenCanvas.height = 320;
const screenCtx = screenCanvas.getContext("2d");
const screenTex = new THREE.CanvasTexture(screenCanvas);
screenTex.colorSpace = THREE.SRGBColorSpace;
const lid = new THREE.Group();
lid.position.set(-0.29, 0.025, 0);
lid.rotation.z = -0.3;
laptop.add(lid);
lid.add(block(0.025, 0.56, 0.88, C.laptop, [0, 0.28, 0], 0.01));
const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.5), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
screen.position.set(0.014, 0.28, 0);
screen.rotation.y = Math.PI / 2;
lid.add(screen);
const screenLight = new THREE.PointLight(PALETTE.teal, 1.4, 2.4, 2);
screenLight.position.set(DESK.x + 0.4, DESK.top + 0.4, DESK.z);
room.add(screenLight);

// Lámpara: base, brazo y pantalla cerrada; su luz proyecta sombras sobre el escritorio.
const lamp = new THREE.Group();
lamp.position.set(DESK.x - 0.25, DESK.top + 0.035, DESK.z - 0.85);
room.add(lamp);
const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.04, 24), matte(C.metal));
lampBase.position.y = 0.02;
lampBase.castShadow = true;
lamp.add(lampBase);
lamp.add(block(0.035, 0.7, 0.035, C.metal, [0, 0.39, 0], 0.012));
const shade = new THREE.Mesh(
  new THREE.ConeGeometry(0.17, 0.22, 24),
  new THREE.MeshStandardMaterial({ color: "#F2A65A", emissive: "#7A3E10", roughness: 0.8 })
);
shade.position.set(0.1, 0.76, 0.08);
shade.rotation.z = -0.55;
shade.castShadow = true;
lamp.add(shade);
const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), new THREE.MeshBasicMaterial({ color: "#FFE3B0", toneMapped: false }));
bulb.position.set(0.15, 0.68, 0.11);
lamp.add(bulb);
const lampLight = new THREE.SpotLight(PALETTE.amber, 14, 4.5, 0.7, 0.7, 1.4);
lampLight.position.set(DESK.x - 0.1, DESK.top + 0.72, DESK.z - 0.74);
lampLight.target.position.set(DESK.x + 0.35, DESK.top, DESK.z + 0.2); // apunta al escritorio, no al piso
lampLight.castShadow = true;
lampLight.shadow.mapSize.set(isSmall ? 512 : 1024, isSmall ? 512 : 1024);
lampLight.shadow.bias = -0.0008;
lampLight.shadow.radius = 6;
room.add(lampLight, lampLight.target);

// Silla simple frente al escritorio (el personaje mira hacia -x).
const CHAIR = { x: -1.15, z: -0.6, seat: 0.6 };
const chair = new THREE.Group();
chair.position.set(CHAIR.x, 0, CHAIR.z);
room.add(chair);
chair.add(block(0.62, 0.09, 0.62, C.chair, [0, CHAIR.seat, 0], 0.04));
chair.add(block(0.08, 0.72, 0.58, C.chair, [0.29, CHAIR.seat + 0.42, 0], 0.035));
chair.add(block(0.06, CHAIR.seat - 0.06, 0.06, C.metal, [0, (CHAIR.seat - 0.06) / 2 + 0.04, 0], 0.02));
const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24), matte(C.metal));
chairBase.position.y = 0.02;
chairBase.castShadow = chairBase.receiveShadow = true;
chair.add(chairBase);
// Hoodie colgado en el respaldo mientras no hay avatar.
const hoodie = block(0.14, 0.46, 0.56, "#D9628A", [0.36, CHAIR.seat + 0.5, 0], 0.05);
chair.add(hoodie);

// Alfombra bajo la silla.
const rug = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.02, 1.5, 2, 0.01), matte(C.rug));
rug.position.set(-1.0, 0.011, -0.55);
rug.receiveShadow = true;
room.add(rug);

// Repisa flotante con pocos libros (pared del fondo, a la derecha de la ventana).
const SHELF = { x: 1.7, z: -ROOM.d / 2 + 0.17 };
[1.65, 2.4].forEach((y, row) => {
  room.add(block(1.3, 0.05, 0.3, C.wood, [SHELF.x, y, SHELF.z], 0.015));
  const books = row === 0
    ? [["#E8A24E", 0.36], ["#D9628A", 0.42], ["#F2E6D8", 0.32], ["#8FD6B8", 0.38]]
    : [["#5E8C78", 0.34], ["#E8A24E", 0.4]];
  let x = SHELF.x - 0.52;
  books.forEach(([color, h]) => {
    room.add(block(0.09, h, 0.22, color, [x, y + 0.025 + h / 2, SHELF.z], 0.012));
    x += 0.11;
  });
  if (row === 1) {
    const leaning = block(0.09, 0.36, 0.22, "#F2E6D8", [x + 0.07, y + 0.2, SHELF.z], 0.012);
    leaning.rotation.z = -0.32; // un libro inclinado: detalle humano
    room.add(leaning);
  }
});

// Cuadro sobre el escritorio (arte original: luna sobre colinas), en la pared izquierda.
const artCanvas = document.createElement("canvas");
artCanvas.width = 320;
artCanvas.height = 240;
(() => {
  const g = artCanvas.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, 240);
  sky.addColorStop(0, "#14332B");
  sky.addColorStop(1, "#3E6B5A");
  g.fillStyle = sky;
  g.fillRect(0, 0, 320, 240);
  g.fillStyle = "#F2E6D8";
  g.beginPath(); g.arc(222, 70, 26, 0, Math.PI * 2); g.fill();
  [[40, 40], [90, 25], [140, 55], [270, 120], [300, 40]].forEach(([x, y]) => g.fillRect(x, y, 3, 3));
  g.fillStyle = "#24493D";
  g.beginPath(); g.moveTo(0, 240); g.quadraticCurveTo(90, 120, 200, 200); g.quadraticCurveTo(260, 170, 320, 190); g.lineTo(320, 240); g.fill();
  g.fillStyle = "#183229";
  g.beginPath(); g.moveTo(0, 210); g.quadraticCurveTo(140, 160, 320, 235); g.lineTo(320, 240); g.lineTo(0, 240); g.fill();
})();
const artTex = new THREE.CanvasTexture(artCanvas);
artTex.colorSpace = THREE.SRGBColorSpace;
const ART = { y: 2.55, z: DESK.z, w: 1.05, h: 0.78 };
room.add(block(0.05, ART.h + 0.1, ART.w + 0.1, C.woodDark, [-ROOM.w / 2 + 0.03, ART.y, ART.z], 0.01));
const art = new THREE.Mesh(new THREE.PlaneGeometry(ART.w, ART.h), new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.9 }));
art.position.set(-ROOM.w / 2 + 0.06, ART.y, ART.z);
art.rotation.y = Math.PI / 2;
room.add(art);


// ============================================================
//  Luces: modo lofi (azul) ↔ modo bachata (rosa)
// ============================================================
const hemi = new THREE.HemisphereLight("#A9CBBB", "#2A3A31", 1.4);
scene.add(hemi);
// Luz principal suave (luna) con sombras.
const windowLight = new THREE.DirectionalLight("#C4E5D6", 1.3);
windowLight.position.set(3.5, 6, 4);
windowLight.target.position.set(-0.8, 0.5, -0.8);
windowLight.castShadow = true;
windowLight.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
Object.assign(windowLight.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 0.5, far: 20 });
windowLight.shadow.bias = -0.0006;
windowLight.shadow.radius = 5;
scene.add(windowLight, windowLight.target);
const partyLight = new THREE.PointLight(PALETTE.rose, 0, 7, 1.4);
partyLight.position.set(0.6, 3.2, 0.6);
scene.add(partyLight);

const MODES = {
  lofi: { hemiSky: new THREE.Color("#A9CBBB"), window: new THREE.Color("#C4E5D6"), screen: PALETTE.teal, party: 0, rain: PALETTE.teal },
  // Bachata: el cuarto se queda verde; solo cambian la pantalla, la lluvia y una luz rosa que late.
  bachata: { hemiSky: new THREE.Color("#A9CBBB"), window: new THREE.Color("#C4E5D6"), screen: PALETTE.rose, party: 9, rain: PALETTE.rose },
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
  vrm.scene.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } });
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
//  Música: disco flotante (canción al azar / pausa), sin panel de información
// ============================================================
const body = document.body;
const playBtn = document.getElementById("play");
const music = document.getElementById("music");

let playlist = [];
let current = -1;

function loadTrack(i) {
  if (!playlist.length) return;
  current = (i + playlist.length) % playlist.length;
  const track = playlist[current];
  music.src = `music/${track.file}`;
  BPM = track.bpm || 128;
}

// Elige una canción al azar, distinta de la actual si hay más de una.
function randomTrack() {
  if (playlist.length < 2) return 0;
  let i = current;
  while (i === current) i = Math.floor(Math.random() * playlist.length);
  return i;
}

fetch(PLAYLIST_URL)
  .then((r) => (r.ok ? r.json() : []))
  .then((list) => { playlist = Array.isArray(list) ? list : []; })
  .catch(() => { playlist = []; });

// Al terminar una canción sigue otra al azar.
music.addEventListener("ended", () => {
  loadTrack(randomTrack());
  music.play().catch(() => {});
});

let mode = "lofi";
let modeChangedAt = 0;
function setMode(on) {
  mode = on ? "bachata" : "lofi";
  modeChangedAt = clock.elapsedTime;
  body.dataset.mode = mode;
  playBtn.setAttribute("aria-pressed", String(on));
  playBtn.setAttribute("aria-label", on ? "Pause the music" : "Play a random song");
  if (on && playlist.length) music.play().catch(() => {});
  else music.pause();
}
playBtn.addEventListener("click", () => {
  const turnOn = mode !== "bachata";
  if (turnOn && playlist.length) loadTrack(randomTrack());
  setMode(turnOn);
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
  partyLight.intensity = mix * MODES.bachata.party * (0.12 + beatLevel * 0.95); // late con el 1-2-3-tap
  scene.background.copy(PALETTE.plum);
  lampLight.intensity = 14 * (1 - mix * 0.35) + Math.sin(t * 13) * 0.1;

  rainUniforms.uTime.value = t * 0.35 * motion;

  // Pantalla: se redibuja ~20 veces por segundo.
  if (++screenFrame % 3 === 0) {
    mode === "bachata" ? drawEqualizer(t) : drawCode(t);
    screenTex.needsUpdate = true;
  }

  // Hoodie (sin avatar) se mece un poquito con la música.
  hoodie.rotation.x = sway * 0.08;

  poseAvatar(t, mode, beatLevel, sway);

  // La lámpara "se enciende" al terminar el loader (con un parpadeo corto).
  if (lampOn < 1 && !document.body.classList.contains("is-loading")) {
    lampOn = Math.min(1, lampOn + dt * (reduceMotion ? 4 : 1.4));
  }
  const flicker = lampOn < 1 && !reduceMotion ? (Math.sin(t * 60) > 0.2 ? 1 : 0.35) : 1;
  lampLight.intensity *= lampOn * flicker;
  bulb.material.color.setScalar(0.25 + 0.75 * lampOn * flicker).multiply(BULB_COLOR);

  // Cámara: sigue el scroll entre secciones + parallax con el mouse + balanceo con la bachata.
  const shot = cameraShot(scrollProgress());
  camTarget.position.lerp(shot.pos, Math.min(1, dt * 3));
  camTarget.look.lerp(shot.look, Math.min(1, dt * 3));
  const swayCam = reduceMotion ? 0 : sway * 0.25;
  const px = reduceMotion ? 0 : pointer.x * 0.6;
  const py = reduceMotion ? 0 : pointer.y * 0.35;
  camera.position.set(camTarget.position.x + px + swayCam, camTarget.position.y - py, camTarget.position.z);
  camera.lookAt(camTarget.look);
  room.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.15) * 0.03;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// ============================================================
//  Cámara por secciones (Room → About → Work → Contact)
// ============================================================
const SHOTS = [
  { id: "room", pos: CAM_BASE.clone(), look: LOOK_AT.clone() },
  { id: "about", pos: new THREE.Vector3(1.2, 2.9, 1.6), look: new THREE.Vector3(-0.6, 2.5, -2.5) },   // la ventana
  { id: "work", pos: new THREE.Vector3(-0.2, 1.9, 0.9), look: new THREE.Vector3(-2.2, 1.2, -0.6) },  // la laptop
  { id: "contact", pos: new THREE.Vector3(8.6, 7.2, 9.8), look: new THREE.Vector3(-0.4, 1.0, -0.4) }, // todo el cuarto
];
const camTarget = { position: CAM_BASE.clone(), look: LOOK_AT.clone() };
const sections = SHOTS.map((s) => document.getElementById(s.id));
const smooth = (x) => x * x * (3 - 2 * x);

// 0 = Room, 1 = About, 2 = Work, 3 = Contact (con decimales entre medio).
function scrollProgress() {
  const mid = window.scrollY + window.innerHeight * 0.5;
  for (let i = sections.length - 1; i >= 0; i--) {
    const el = sections[i];
    if (mid >= el.offsetTop) {
      const next = sections[i + 1];
      if (!next) return i;
      const span = next.offsetTop - el.offsetTop;
      return i + Math.min(1, (mid - el.offsetTop) / span);
    }
  }
  return 0;
}

const shotOut = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
function cameraShot(p) {
  const i = Math.min(Math.floor(p), SHOTS.length - 1);
  const j = Math.min(i + 1, SHOTS.length - 1);
  // La cámara se queda en cada toma y viaja en la segunda mitad de cada sección.
  const k = smooth(Math.max(0, (p - i - 0.45) / 0.55));
  shotOut.pos.copy(SHOTS[i].pos).lerp(SHOTS[j].pos, k);
  shotOut.look.copy(SHOTS[i].look).lerp(SHOTS[j].look, k);
  return shotOut;
}

// Navbar: marca la sección visible.
const navLinks = [...document.querySelectorAll(".nav__links a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.dataset.section === e.target.id)));
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
sections.forEach((s) => sectionObserver.observe(s));

// ============================================================
//  Loader: progreso real (fuentes, shaders, avatar, primer frame)
// ============================================================
const loaderNum = document.getElementById("loader-num");
const tasks = { fonts: false, shaders: false, avatar: !AVATAR_URL, frame: false };
let shown = 0;
const loaderStart = performance.now();
let lampOn = 0;
const BULB_COLOR = new THREE.Color("#FFE3B0");

function loaderTick() {
  const done = Object.values(tasks).filter(Boolean).length / Object.keys(tasks).length;
  // El número sube suave hacia el progreso real; mínimo ~1.2 s para que se alcance a leer.
  const minTime = reduceMotion ? 0 : Math.min(1, (performance.now() - loaderStart) / 1200);
  const target = Math.min(done, minTime) * 100;
  shown += (target - shown) * 0.12;
  if (target - shown < 0.6) shown = target;
  loaderNum.textContent = String(Math.round(shown));
  if (shown >= 100) {
    document.body.classList.remove("is-loading");
    return;
  }
  requestAnimationFrame(loaderTick);
}

document.fonts?.ready.then(() => { tasks.fonts = true; typing.next = 0; });
if (!document.fonts) tasks.fonts = true;
// Compilar los shaders antes del primer frame (síncrono: compileAsync a veces no resuelve).
try { renderer.compile(scene, camera); } catch (err) { console.warn(err); }
tasks.shaders = true;
// Red de seguridad: si algo se queda colgado, abrimos la página igual a los 8 s.
setTimeout(() => Object.keys(tasks).forEach((k) => { tasks[k] = true; }), 8000);
loadAvatar()
  .catch((err) => console.warn("No se pudo cargar el avatar:", err))
  .finally(() => { tasks.avatar = true; });

requestAnimationFrame(() => {
  animate();
  tasks.frame = true;
});
requestAnimationFrame(loaderTick);
