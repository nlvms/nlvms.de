// Auto-advancing image gallery.
// Initializes every `.gallery` produced by the {% gallery %} shortcode:
// shows one slide at a time, advances on a timer, and offers prev/next
// arrows and clickable dots. Pauses on hover and honors reduced-motion.

function initGallery(root) {
  const slides = Array.from(root.querySelectorAll(".gallery-slide"));
  if (slides.length === 0) return;

  const dots = Array.from(root.querySelectorAll(".gallery-dot"));
  const nav = Array.from(root.querySelectorAll(".gallery-btn, .gallery-dots"));
  const interval = parseInt(root.dataset.interval, 10) || 4000;
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  // A single image needs no controls or timer.
  if (slides.length < 2) {
    nav.forEach((el) => (el.hidden = true));
    return;
  }

  let index = Math.max(
    0,
    slides.findIndex((s) => s.classList.contains("is-active")),
  );
  let timer = null;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const active = n === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    dots.forEach((dot, n) => {
      const active = n === index;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (!reduceMotion) timer = setInterval(() => show(index + 1), interval);
  }

  root.querySelector(".gallery-next")?.addEventListener("click", () => {
    show(index + 1);
    start();
  });
  root.querySelector(".gallery-prev")?.addEventListener("click", () => {
    show(index - 1);
    start();
  });
  dots.forEach((dot, n) =>
    dot.addEventListener("click", () => {
      show(n);
      start();
    }),
  );

  // Pause while the visitor is looking (hover / keyboard focus).
  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);

  show(index);
  start();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".gallery").forEach(initGallery);
});
