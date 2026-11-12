// Vite: servidor de desarrollo con recarga al guardar y build de producción.
// El build junta los módulos en pocos archivos, los minifica y les pone un hash en el nombre
// (así el navegador los puede guardar en caché "para siempre").
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5173, strictPort: true },
  build: {
    target: "es2022",
    // Three.js solo ya pesa ~590 kB minificado (150 kB comprimido): subimos el aviso por encima de eso.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // Tres páginas: la principal, el linktree y el CV. Cada una carga solo lo que usa.
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        links: resolve(import.meta.dirname, "links/index.html"),
        cv: resolve(import.meta.dirname, "cv/index.html"),
      },
    },
  },
});
