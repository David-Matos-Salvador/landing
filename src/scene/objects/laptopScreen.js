/**
 * Lo que se ve en la pantalla de la laptop, dibujado con canvas 2D:
 * código que se escribe solo (modo lofi) o un ecualizador (modo bachata).
 * No sabe nada de Three.js: solo entrega un <canvas>.
 */
import { PALETTE } from "../../config.js";
import { reduceMotion } from "../../lib/env.js";

const SIZE = { w: 512, h: 320 };
const LINE_HEIGHT = 24;
const TITLE_BAR_HEIGHT = 30;
const MAX_VISIBLE_LINES = 11;
const MARGIN = { x: 20, y: TITLE_BAR_HEIGHT + 16 };
/** Los tres botones de una ventana de macOS: cerrar, minimizar y maximizar. */
const WINDOW_BUTTONS = ["#FF5F57", "#FEBC2E", "#28C840"];

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

const THEME = {
  codeBackground: "#151027",
  partyBackground: "#1E1030",
  comment: "#7E74A8",
  string: PALETTE.amber,
  text: PALETTE.paper,
  cursor: "#6FD3D8",
  titleBar: "#241C3D",
  titleText: "#9A91C4",
};

/** Resaltado de sintaxis mínimo: comentarios, líneas con strings y el resto. */
function colorOf(line) {
  if (line.trim().startsWith("//")) return THEME.comment;
  if (line.includes("'")) return THEME.string;
  return THEME.text;
}

export function createLaptopScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE.w;
  canvas.height = SIZE.h;
  const ctx = canvas.getContext("2d");

  /** Hasta dónde va el "tipeo": línea, carácter y cuándo toca la siguiente tecla. */
  const typing = { line: 0, char: 0, nextKeyAt: 0 };

  function typeNextKey(t) {
    typing.char++;
    if (typing.char > CODE[typing.line].length) {
      typing.line = (typing.line + 1) % CODE.length; // al terminar, vuelve a empezar
      typing.char = 0;
    }
    // Pausas irregulares entre teclas: se siente como una persona escribiendo.
    typing.nextKeyAt = t + (reduceMotion ? 0.12 : 0.05 + Math.random() * 0.09);
  }

  /** Barra superior de la ventana: los tres botones y el nombre del archivo o la app. */
  function drawTitleBar(title) {
    ctx.fillStyle = THEME.titleBar;
    ctx.fillRect(0, 0, SIZE.w, TITLE_BAR_HEIGHT);
    WINDOW_BUTTONS.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(20 + i * 18, TITLE_BAR_HEIGHT / 2, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = THEME.titleText;
    ctx.font = '600 14px "M PLUS 1 Code", monospace';
    ctx.textBaseline = "middle";
    // A la izquierda, junto a los botones: el centro lo tapa la muesca de la cámara.
    ctx.fillText(title, 80, TITLE_BAR_HEIGHT / 2 + 1);
  }

  /** @param {number} t segundos desde que empezó la escena */
  function drawCode(t) {
    if (t > typing.nextKeyAt) typeNextKey(t);

    ctx.fillStyle = THEME.codeBackground;
    ctx.fillRect(0, 0, SIZE.w, SIZE.h);
    drawTitleBar("room.js");
    ctx.font = '600 17px "M PLUS 1 Code", monospace';
    ctx.textBaseline = "top";

    const typed = [...CODE.slice(0, typing.line), CODE[typing.line].slice(0, typing.char)];
    const visible = typed.slice(-MAX_VISIBLE_LINES);
    visible.forEach((line, i) => {
      ctx.fillStyle = colorOf(line);
      ctx.fillText(line, MARGIN.x, MARGIN.y + i * LINE_HEIGHT);
    });

    // Cursor que parpadea dos veces por segundo, al final de la última línea.
    if (Math.floor(t * 2) % 2 === 0) {
      const lastLine = visible.at(-1) ?? "";
      const x = MARGIN.x + ctx.measureText(lastLine).width + 2;
      const y = MARGIN.y + (visible.length - 1) * LINE_HEIGHT;
      ctx.fillStyle = THEME.cursor;
      ctx.fillRect(x, y, 9, 18);
    }
  }

  /**
   * @param {number} t segundos desde que empezó la escena
   * @param {number} bpm tempo de la canción: las barras saltan a ese ritmo
   */
  function drawEqualizer(t, bpm) {
    ctx.fillStyle = THEME.partyBackground;
    ctx.fillRect(0, 0, SIZE.w, SIZE.h);
    drawTitleBar("music");
    ctx.fillStyle = THEME.text;
    ctx.font = '700 22px "Bricolage Grotesque", sans-serif';
    ctx.textBaseline = "top";
    ctx.fillText("now playing", 24, TITLE_BAR_HEIGHT + 14);

    const beat = (t * bpm) / 60;
    for (let i = 0; i < 24; i++) {
      const pulse = Math.abs(Math.sin(beat * Math.PI + i * 0.7));
      const shape = 0.5 + 0.5 * Math.abs(Math.sin(i * 1.3)); // cada barra tiene su alto máximo
      const height = 30 + pulse * 150 * shape;
      ctx.fillStyle = i % 2 ? PALETTE.rose : PALETTE.amber;
      ctx.fillRect(24 + i * 19.5, 290 - height, 12, height);
    }
  }

  /** Vuelve a teclear de inmediato (por ejemplo, cuando la fuente de código termina de cargar). */
  function resumeTyping() {
    typing.nextKeyAt = 0;
  }

  return { canvas, drawCode, drawEqualizer, resumeTyping };
}
