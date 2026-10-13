/** Navbar: marca con aria-current el enlace de la sección que está en pantalla. */

/** @param {HTMLElement[]} sections las <section> de la página, en orden */
export function initNav(sections) {
  const links = [...document.querySelectorAll(".nav__links a")];

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          link.setAttribute("aria-current", String(link.dataset.section === entry.target.id));
        }
      }
    },
    // El "área de detección" es una franja delgada en el centro de la pantalla:
    // la sección que la cruza es la sección actual.
    { rootMargin: "-45% 0px -45% 0px" },
  );
  for (const section of sections) observer.observe(section);
}
