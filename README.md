# landing

Página principal de [davidmatos.lat](https://davidmatos.lat): un cuarto 3D de noche, hecho con
Three.js, que se vuelve una fiesta de bachata al dar Play. Incluye el linktree en `/links/` y mi
CV en `/cv/`, que se descarga como PDF.

Sitio estático: HTML, CSS y módulos ES, sin framework. Vite lo empaqueta para producción.

## Qué tiene de interesante

- **La cámara sigue el scroll.** Cada sección de la página tiene una "toma"; al bajar, la cámara
  viaja de una a la siguiente (`src/scene/cameraRig.js`).
- **Las luces siguen la música de verdad.** Un detector de golpes mide el bajo de la canción con la
  Web Audio API y lo convierte en tres números que mueven las luces (`src/lib/onset.js`,
  `src/scene/rhythm.js`). El detector es una función pura y tiene pruebas.
- **Un solo lugar para los textos.** La página, el linktree y el CV leen de los mismos diccionarios
  (`src/i18n/en.js` y `es.js`). Una prueba falla si a un idioma le falta una clave.
- **El CV es una página, no un archivo.** Usa los mismos textos que la landing y se imprime a PDF
  con una hoja de estilos de impresión (`cv/`).

## Decisiones

- **Sin framework.** La página es chica y quiero poder leer todo el código. Cada archivo hace una
  sola cosa, y `src/main.js` es el único lugar donde las piezas se conocen.
- **Lógica separada del 3D.** Lo que se puede calcular con números puros (golpes, intensidad,
  recorte de imágenes, idioma inicial) vive en `src/lib/` y tiene pruebas. Lo 3D solo dibuja.
- **Publicar es un push.** `main` se despliega solo en mi servidor (Coolify): Vite genera `dist/`
  y nginx lo sirve con HTTPS.
- **Hecha con agentes de IA, revisada por mí.** Yo defino qué se construye y las reglas
  (`AGENTS.md`); el agente escribe y corre las pruebas; yo reviso en local antes de publicar.

## Correr en local

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Antes de subir cambios: `npm run check` (ESLint, Prettier y pruebas)
y `npm run build`.

## Entender el código

Lee [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): mapa de carpetas, cómo fluyen los datos y qué
archivo tocar para cada cambio. Para leer el código, empieza por `src/main.js`.

## Publicar

`git push` a `main`. Coolify construye la imagen (`Dockerfile`) y la publica. Para agregar música:
[public/music/README.md](public/music/README.md).
