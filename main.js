// Mobile nav toggle
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

// Smooth scroll for internal anchors
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id && id.startsWith("#") && id.length > 1) {
      e.preventDefault();
      document
        .querySelector(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      links?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// Animate case study counters
const counters = document.querySelectorAll(".stat .num");
const once = new Set();
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !once.has(entry.target)) {
        once.add(entry.target);
        const el = entry.target;
        const end = parseInt(el.getAttribute("data-count"), 10) || 0;
        const start = 0;
        const dur = 1200;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = Math.floor(start + (end - start) * p);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
  },
  { threshold: 0.5 }
);
counters.forEach((c) => io.observe(c));

// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Basic client-side form handler (demo only)
document.getElementById("contactForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  alert("Thanks! Your message has been sent. We’ll be in touch shortly.");
  e.target.reset();
});
