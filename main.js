import * as THREE from "three";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 640px)").matches;

// ---------- Escena ----------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x07060d, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x07060d, 0.035);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.2, 9);

const COLORS = [new THREE.Color("#3ef2ff"), new THREE.Color("#ff3ea5"), new THREE.Color("#ffb547")];

// ---------- Lluvia de glifos de código ----------
const GLYPHS = ["{", "}", "<", "/>", "=>", ";", "()", "[]", "&&", "#", "$", "λ", "01", "fn", "∞", "♪"];

function glyphTexture(text) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${text.length > 1 ? 54 : 78}px "JetBrains Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#fff";
  ctx.shadowBlur = 12;
  ctx.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const FIELD = { w: 36, h: 20, depth: 70 };
const perGlyph = Math.round((isMobile ? 380 : 900) / GLYPHS.length);
const glyphGroups = [];

GLYPHS.forEach((g, i) => {
  const positions = new Float32Array(perGlyph * 3);
  for (let p = 0; p < perGlyph; p++) {
    positions[p * 3] = (Math.random() - 0.5) * FIELD.w;
    positions[p * 3 + 1] = (Math.random() - 0.3) * FIELD.h;
    positions[p * 3 + 2] = -Math.random() * FIELD.depth;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    map: glyphTexture(g),
    size: 0.55 + Math.random() * 0.35,
    color: COLORS[i % COLORS.length],
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.userData.speed = 2 + Math.random() * 2.5;
  scene.add(points);
  glyphGroups.push(points);
});

// ---------- Núcleo: icosaedro wireframe que "respira" con el beat ----------
const coreUniforms = {
  uTime: { value: 0 },
  uBeat: { value: 0 },
  uColorA: { value: COLORS[0].clone() },
  uColorB: { value: COLORS[1].clone() },
};

const coreMat = new THREE.ShaderMaterial({
  uniforms: coreUniforms,
  wireframe: true,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uBeat;
    varying float vWave;
    void main() {
      vec3 p = position;
      float wave = sin(p.x * 2.1 + uTime * 1.3) * sin(p.y * 2.7 + uTime * 0.9) * sin(p.z * 1.9 + uTime);
      vWave = wave;
      p += normal * (wave * 0.28 + uBeat * 0.35);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform float uBeat;
    varying float vWave;
    void main() {
      vec3 col = mix(uColorA, uColorB, smoothstep(-0.6, 0.6, vWave));
      gl_FragColor = vec4(col * (0.8 + uBeat * 0.9), 0.75);
    }
  `,
});

const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2, isMobile ? 3 : 5), coreMat);
core.position.set(isMobile ? 0 : 3.2, 1.6, -2);
scene.add(core);

const halo = new THREE.Mesh(
  new THREE.SphereGeometry(1.35, 32, 32),
  new THREE.MeshBasicMaterial({ color: COLORS[1], transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })
);
core.add(halo);

// ---------- Piso synthwave ----------
const gridUniforms = { uTime: { value: 0 }, uBeat: { value: 0 } };
const grid = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, 1, 1),
  new THREE.ShaderMaterial({
    uniforms: gridUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying float vDist;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vDist = length(wp.xz - cameraPosition.xz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uBeat;
      varying vec2 vUv;
      varying float vDist;
      float line(float x, float w) {
        float f = abs(fract(x) - 0.5);
        return smoothstep(w, 0.0, f - (0.5 - w));
      }
      void main() {
        vec2 g = vUv * 60.0;
        g.y += uTime * 1.6;
        float l = max(line(g.x, 0.035), line(g.y, 0.035));
        vec3 col = mix(vec3(0.24, 0.95, 1.0), vec3(1.0, 0.24, 0.65), uBeat);
        float fade = smoothstep(55.0, 4.0, vDist);
        gl_FragColor = vec4(col, l * fade * (0.55 + uBeat * 0.45));
      }
    `,
  })
);
grid.rotation.x = -Math.PI / 2;
grid.position.y = -2.4;
scene.add(grid);

// ---------- Interacción ----------
const pointer = { x: 0, y: 0 };
window.addEventListener("pointermove", (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Música ----------
// 1) Si hay SPOTIFY_TRACK_ID: reproductor oficial de Spotify (barra compacta, sin video).
//    Quien no tenga sesión de Spotify en el navegador escucha un preview de 30 s.
// 2) Si no: archivo propio y libre de derechos en music/bachata.mp3.
const SPOTIFY_TRACK_ID = "4d9fwUVP1SKEJubBUOeBKB"; // ← pegar aquí el ID de "Jr — La Estrella" (open.spotify.com/track/<ID>)
const music = document.getElementById("music");
const spotifyCard = document.getElementById("spotify");
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

function setMusic(on) {
  if (SPOTIFY_TRACK_ID) {
    spotifyCard.classList.toggle("is-on", on);
    spotifyCard.setAttribute("aria-hidden", String(!on));
    if (!spotify) return;
    if (on) spotify.play();
    else spotify.pause();
    return;
  }
  if (on) music.play().catch(() => {}); // sin archivo o bloqueado: seguimos solo con visuales
  else music.pause();
}

// Modo bachata: ~128 BPM, paso básico 1-2-3-tap (el 4 es el "tap").
const BPM = 128;
let bachata = false;
const beatBtn = document.getElementById("beat");
beatBtn.addEventListener("click", () => {
  bachata = !bachata;
  setMusic(bachata);
  beatBtn.setAttribute("aria-pressed", String(bachata));
  beatBtn.querySelector(".btn__icon").textContent = bachata ? "■" : "▶";
  beatBtn.querySelector(".btn__label").textContent = bachata ? "1·2·3·tap" : "modo bachata";
  typeLines(bachata ? BACHATA_LINES : [], { append: true });
});

// ---------- Loop ----------
const clock = new THREE.Clock();
let beatLevel = 0;
let sway = 0;

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const motion = reduceMotion ? 0.25 : 1;

  // Beat: pulso fuerte en 1-2-3 y suave en el tap; el cuerpo se balancea de lado a lado.
  let targetBeat = 0;
  let targetSway = 0;
  if (bachata) {
    const beats = t * (BPM / 60);
    const step = Math.floor(beats) % 8;          // 8 tiempos: 4 a la derecha, 4 a la izquierda
    const phase = beats % 1;
    const accent = step % 4 === 3 ? 0.45 : 1;    // el "tap" pega más suave
    targetBeat = Math.exp(-phase * 6) * accent;
    const dir = step < 4 ? 1 : -1;
    targetSway = dir * Math.min(step % 4, 2.5) * 0.35;
  }
  beatLevel += (targetBeat - beatLevel) * Math.min(1, dt * 18);
  sway += (targetSway - sway) * Math.min(1, dt * 4);

  coreUniforms.uTime.value = t * motion;
  coreUniforms.uBeat.value = beatLevel;
  gridUniforms.uTime.value = t * motion * (bachata ? 1.8 : 1);
  gridUniforms.uBeat.value = bachata ? 0.6 + beatLevel * 0.4 : 0;

  core.rotation.y += dt * 0.25 * motion;
  core.rotation.x += dt * 0.12 * motion;
  core.scale.setScalar(1 + beatLevel * 0.12);
  halo.material.opacity = 0.1 + beatLevel * 0.25;

  const speedBoost = bachata ? 1.9 : 1;
  for (const group of glyphGroups) {
    const pos = group.geometry.attributes.position;
    const arr = pos.array;
    const v = group.userData.speed * dt * motion * speedBoost;
    for (let i = 2; i < arr.length; i += 3) {
      arr[i] += v;
      if (arr[i] > camera.position.z) arr[i] -= FIELD.depth;
    }
    pos.needsUpdate = true;
  }

  camera.position.x += (pointer.x * 1.4 + sway - camera.position.x) * 0.04;
  camera.position.y += (1.2 - pointer.y * 0.8 - camera.position.y) * 0.04;
  camera.rotation.z = -sway * 0.03;
  camera.lookAt(0, 0.8, -6);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// ---------- Terminal ----------
const term = document.getElementById("term");

const INTRO_LINES = [
  { p: "$ ", t: "whoami" },
  { t: "david matos — developer", cls: "ok" },
  { p: "$ ", t: "cat status.txt" },
  { t: "compilando algo locaso… 🎧 lofi + bachata", cls: "hl" },
  { p: "$ ", t: "./deploy --target=vps" },
  { t: "✓ coolify · ✓ https · ✓ telegram", cls: "ok" },
];
const BACHATA_LINES = [
  { p: "$ ", t: SPOTIFY_TRACK_ID ? "spotify play \"La Estrella\"" : "play bachata.mp3 --loop" },
  { t: "♪ 1 · 2 · 3 · tap ♪", cls: "hl" },
];

let queue = Promise.resolve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function renderLine(el, line, text) {
  el.innerHTML = "";
  if (line.p) {
    const s = document.createElement("span");
    s.className = "p";
    s.textContent = line.p;
    el.appendChild(s);
  }
  const body = document.createElement("span");
  if (line.cls) body.className = line.cls;
  body.textContent = text;
  el.appendChild(body);
}

function typeLines(lines, { append = false } = {}) {
  queue = queue.then(async () => {
    if (!append) term.textContent = "";
    for (const line of lines) {
      const el = document.createElement("div");
      term.appendChild(el);
      const typed = !line.cls && !reduceMotion;
      if (typed) {
        for (let i = 1; i <= line.t.length; i++) {
          renderLine(el, line, line.t.slice(0, i));
          await sleep(45 + Math.random() * 55);
        }
        await sleep(220);
      } else {
        renderLine(el, line, line.t);
        await sleep(reduceMotion ? 0 : 160);
      }
    }
    // Mantener solo las últimas líneas y el cursor al final.
    while (term.children.length > 9) term.firstChild.remove();
    term.querySelector(".cursor")?.remove();
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    term.lastElementChild?.appendChild(cursor);
  });
}

typeLines(INTRO_LINES);
