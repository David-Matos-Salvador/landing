/** Punto de entrada del CV (/cv/): idioma y botón de descarga en PDF. */
import { createLanguageSwitch } from "./ui/languageSwitch.js";

createLanguageSwitch({
  button: document.getElementById("language"),
  meta: { title: "meta.cvTitle", description: "meta.cvDescription" },
});

// "Descargar PDF" abre la ventana de impresión del navegador; ahí se elige "Guardar como PDF".
// cv.css trae una hoja @media print que deja el CV en A4, en blanco y negro y sin botones.
document.getElementById("download").addEventListener("click", () => window.print());
