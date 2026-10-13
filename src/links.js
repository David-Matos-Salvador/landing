/** Punto de entrada del linktree (/links/): solo necesita el cambio de idioma. */
import { createLanguageSwitch } from "./ui/languageSwitch.js";

createLanguageSwitch({
  button: document.getElementById("language"),
  meta: { title: "meta.linksTitle", description: "meta.linksDescription" },
});
