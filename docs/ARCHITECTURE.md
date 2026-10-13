# Arquitectura

Guía para leer el código. La idea central: **cada archivo hace una sola cosa**, y
`src/main.js` es el único lugar donde las piezas se conocen entre sí.

## Mapa de carpetas

```
index.html              La página: contenido de las secciones y qué CSS/JS se carga
links/                  El linktree (otra página, mismo sistema de colores)
public/music/           Canciones y playlist.json (public/ se copia tal cual al sitio)
vite.config.js          Configuración del build (dos páginas: principal y linktree)
dist/                   Resultado del build; no se edita ni se sube a git
styles/                 Un archivo CSS por componente
  tokens.css            Variables: colores, fuentes, tamaños  ← empieza por aquí
  base.css              Reset, lienzo 3D de fondo, accesibilidad global
  loader.css  nav.css  sections.css  components.css  disc.css  switch.css
src/
  main.js               Punto de entrada: crea todo y corre el loop  ← empieza por aquí
  links.js              Punto de entrada del linktree (solo el idioma)
  config.js             Valores que uno querría cambiar (URLs, tempo, paleta)
  i18n/                 Idiomas: en.js, es.js y index.js (qué idioma está activo, t())
  lib/                  Utilidades sin estado
    env.js              ¿Pantalla chica? ¿Menos animaciones?
    math.js             smoothstep, approach
    onset.js            Detector de golpes (números puros) + onset.test.js
    envelope.js         Intensidad de la canción de 0 a 1 + envelope.test.js
    pickLanguage.js     Elige el idioma inicial + pickLanguage.test.js
  scene/                Todo lo 3D
    stage.js            Renderer, escena, cámara y resize
    layout.js           Medidas y colores del cuarto (dónde está cada cosa)
    primitives.js       block() y matte(): las piezas con que se arma todo
    room.js             Arma el cuarto con los objetos de objects/
    objects/            Un archivo por objeto: window, desk, laptop, lamp, chair...
    lights.js           Luces generales (ambiente, luna, fiesta)
    rhythm.js           Convierte la música en tres números (mix, energy, beatLevel)
    mood.js             Aplica esos números a los colores de las luces
    cameraRig.js        Cámara: una toma por sección + parallax con el mouse
    clickTargets.js     Clics sobre objetos 3D (raycaster)
    avatar.js           Avatar VRM opcional
  ui/                   Lo que no es 3D
    loader.js           Pantalla de carga
    nav.js              Resalta la sección actual en el navbar
    lampSwitch.js       Botón que prende y apaga la lámpara
    languageSwitch.js   Botón EN / ES
    player.js           Disco de música y modo lofi / bachata
    audioMeter.js       Mide el bajo de la canción que suena (Web Audio API)
```

## Cómo fluyen los datos

En cada frame (60 veces por segundo), `animate()` en `main.js` hace esto, en orden:

```
player  ──►  mode, bpm, readAudio()     ¿hay música? ¿hubo un golpe en este frame?
                │
rhythm.update() ──►  { mix, energy, beatLevel }   tres números, nada más
                │
        ┌───────┼──────────┬──────────┬───────────┐
     applyMood  room    laptop      lamp      cameraRig      cada pieza los usa
        └───────┴──────────┴──────────┴───────────┘
                │
        renderer.render()        se dibuja el frame
```

Los datos van **en una sola dirección**: de arriba hacia abajo. Ninguna pieza de abajo
modifica a otra; solo reciben números y se actualizan a sí mismas. Por eso se puede leer
(o cambiar) un archivo sin tener los demás en la cabeza.

## Cómo la luz sigue la música

`audioMeter.js` conecta el `<audio>` a un analizador del navegador y, en cada frame, mide
dos cosas: el volumen general y el de las frecuencias graves (bombo y bajo).

- **Brillo.** `lib/envelope.js` compara el volumen con la parte más fuerte de la canción
  y entrega `energy` (0 a 1): la luz baja en las partes suaves y sube en el coro.
- **Ritmo.** `lib/onset.js` decide si el bajo acaba de dar un golpe (sube de pronto por
  encima de su promedio). `rhythm.js` lo convierte en `beatLevel`, un acento que cae rápido.

`mood.js` junta los dos: el brillo lo pone `energy` y `beatLevel` lo hace latir encima.
La música cambia luces y la pantalla de la laptop; no mueve la cámara ni los objetos.

Si el navegador no deja analizar el audio, `rhythm.js` usa un metrónomo con el campo
`bpm` de la playlist. El resto de la escena no se entera de cuál de las dos fuentes se usó.

## Idiomas

El HTML trae el texto en inglés y cada elemento traducible lleva una clave:
`<p data-i18n="hero.tagline">`. Al abrir la página, `i18n/index.js` elige el idioma
(primero lo que la persona eligió antes, después el idioma de su navegador, y si no,
inglés) y reemplaza cada texto por el del diccionario. Los textos que escribe el
JavaScript (por ejemplo la etiqueta del disco) se piden con `t("clave")`, y las piezas que
los usan se suscriben con `onLanguageChange()` para actualizarse al cambiar de idioma.

Una prueba (`i18n.test.js`) falla si a un idioma le falta una clave o si el HTML usa una
clave que no existe.

## Los tres patrones que se repiten

**1. Funciones fábrica.** Casi todos los módulos exportan una función `createX()` o
`addX()` que arma algo y devuelve un objeto pequeño con lo único que se puede usar desde
afuera, normalmente un `update()`:

```js
const lamp = addLamp(room, { shadowMapSize: 1024 });
lamp.update({ dt, t, mix, isOn });
```

Lo que está dentro de la función (por ejemplo `power` en `lamp.js`) es privado: nadie más
puede tocarlo. Es encapsulación sin clases.

**2. Un solo dueño por dato.** El modo (`lofi` / `bachata`) vive solo en `player.js`; el
ritmo, solo en `rhythm.js`; si el loader terminó, solo en `loader.js`. Los demás lo leen,
nunca lo escriben. Cuando algo se ve mal, hay un solo lugar donde buscar.

**3. Configuración separada del comportamiento.** Los números que describen _qué_ hay
(medidas en `layout.js`, tomas de cámara en `cameraRig.js`, ajustes en `config.js`) están
arriba y con nombre; el código que dice _cómo_ se mueve va debajo.

## Recetas

| Quiero...                          | Toco...                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Cambiar un color de toda la página | `styles/tokens.css` (y `PALETTE` en `src/config.js` para el 3D)             |
| Mover un mueble                    | `src/scene/layout.js`                                                       |
| Agregar un objeto al cuarto        | Archivo nuevo en `src/scene/objects/` + una línea en `room.js`              |
| Agregar una sección                | `<section id="x">` y un enlace en `index.html` + una toma en `cameraRig.js` |
| Cambiar el encuadre de una sección | La toma con ese `id` en `cameraRig.js`                                      |
| Cambiar lo que escribe la laptop   | `CODE` en `src/scene/objects/laptopScreen.js`                               |
| Agregar una canción                | `music/README.md`                                                           |
| Poner mi avatar                    | `AVATAR_URL` en `src/config.js`                                             |

## Decisiones (y por qué)

- **Vite como herramienta de build.** En desarrollo sirve los archivos de `src/` uno por
  uno y recarga la página al guardar. Para producción (`npm run build`) junta todo en la
  carpeta `dist/`: un solo JavaScript minificado con únicamente las partes de Three.js que
  se usan, un CSS, y un hash en cada nombre de archivo para que el navegador los guarde
  en caché. Resultado: ~150 kB de JavaScript comprimido en vez de ~410 kB desde un CDN.
  El código que escribes no cambia: siguen siendo módulos ES normales.
- **El avatar se descarga aparte.** `avatar.js` usa `import()` dinámico, así que Vite deja
  esas librerías en archivos separados que solo se piden si hay un avatar configurado.
- **JavaScript con JSDoc, no TypeScript.** Los comentarios `@param` documentan los tipos y
  el editor los usa para autocompletar, sin necesitar compilación.
- **CSS por componente con tokens.** Los colores tienen nombre por función
  (`--color-glow`), no por tono; así cambiar la paleta es editar un archivo.
- **Accesibilidad.** Se respeta `prefers-reduced-motion` (en `lib/env.js` y en el CSS), el
  navbar usa `aria-current` y el disco `aria-pressed`.

## Calidad

```bash
npm install        # una vez
npm run dev        # servidor local en http://localhost:5173, recarga al guardar
npm run check      # ESLint (errores) + Prettier (formato) + pruebas
npm test           # solo las pruebas (archivos *.test.js)
npm run format     # corrige el formato
npm run build      # genera dist/, lo mismo que se publica
npm run preview    # sirve dist/ en http://localhost:4173 para probar el build
```

GitHub Actions corre `npm run check` y `npm run build` en cada push (`.github/workflows/check.yml`).
