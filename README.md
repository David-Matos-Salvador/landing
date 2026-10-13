# landing

Página principal de [davidmatos.lat](https://davidmatos.lat): un cuarto 3D de noche, hecho
con Three.js, que se vuelve una fiesta de bachata al dar Play. Incluye el linktree en `/links/`.

Sitio estático: HTML, CSS y módulos ES. Vite lo empaqueta para producción.

## Correr en local

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>. Antes de subir cambios: `npm run check`.

## Entender el código

Lee [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): mapa de carpetas, cómo fluyen los datos y
qué archivo tocar para cada cambio. Para leer el código, empieza por `src/main.js`.

## Publicar

`git push` a `main`. Coolify construye la imagen (`Dockerfile`: Vite genera `dist/` y nginx
lo sirve) y la publica con HTTPS. Para agregar música: [public/music/README.md](public/music/README.md).
