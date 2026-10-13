// Reglas de ESLint: encuentra errores probables en el JavaScript (variables sin usar, typos...).
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    rules: {
      eqeqeq: "error", // siempre === y !==
      "no-var": "error", // const / let en vez de var
      "prefer-const": "error", // const si la variable nunca se reasigna
    },
  },
  {
    // vite.config.js corre en Node, no en el navegador.
    files: ["*.config.js"],
    languageOptions: { globals: globals.node },
  },
];
