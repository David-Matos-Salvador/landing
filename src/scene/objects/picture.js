/** Cuadro sobre el escritorio. El arte es original: una luna sobre colinas, dibujada con canvas 2D. */
import * as THREE from "three";
import { PALETTE } from "../../config.js";
import { COLORS, PICTURE, ROOM } from "../layout.js";
import { block } from "../primitives.js";

const ART_SIZE = { w: 320, h: 240 };
const STARS = [
  [40, 40],
  [90, 25],
  [140, 55],
  [270, 120],
  [300, 40],
];

function paintArt() {
  const canvas = document.createElement("canvas");
  canvas.width = ART_SIZE.w;
  canvas.height = ART_SIZE.h;
  const g = canvas.getContext("2d");
  const { w, h } = ART_SIZE;

  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#14332B");
  sky.addColorStop(1, "#3E6B5A");
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);

  g.fillStyle = PALETTE.paper;
  g.beginPath();
  g.arc(222, 70, 26, 0, Math.PI * 2); // luna
  g.fill();
  for (const [x, y] of STARS) g.fillRect(x, y, 3, 3);

  g.fillStyle = "#24493D"; // colina del fondo
  g.beginPath();
  g.moveTo(0, h);
  g.quadraticCurveTo(90, 120, 200, 200);
  g.quadraticCurveTo(260, 170, w, 190);
  g.lineTo(w, h);
  g.fill();

  g.fillStyle = "#183229"; // colina del frente
  g.beginPath();
  g.moveTo(0, 210);
  g.quadraticCurveTo(140, 160, w, 235);
  g.lineTo(w, h);
  g.lineTo(0, h);
  g.fill();

  return canvas;
}

/** @param {THREE.Group} room */
export function addPicture(room) {
  const wallX = -ROOM.w / 2;
  const texture = new THREE.CanvasTexture(paintArt());
  texture.colorSpace = THREE.SRGBColorSpace;

  room.add(
    block(
      0.05,
      PICTURE.h + 0.1,
      PICTURE.w + 0.1,
      COLORS.woodDark,
      [wallX + 0.03, PICTURE.y, PICTURE.z],
      0.01,
    ),
  );

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(PICTURE.w, PICTURE.h),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
  );
  art.position.set(wallX + 0.06, PICTURE.y, PICTURE.z);
  art.rotation.y = Math.PI / 2; // mira hacia el cuarto (+x)
  room.add(art);
}
