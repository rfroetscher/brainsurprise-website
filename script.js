// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Nav: scrolled state + mobile toggle =====
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
const links = document.querySelector('.nav__links');

const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
links.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  })
);

// ===== Reveal on scroll =====
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
}

// ===== Card spotlight (follows cursor) =====
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// ===== Count-up stats =====
const animateCount = (el) => {
  const target = parseInt(el.dataset.count, 10);
  if (isNaN(target)) return;
  const isYear = target > 1900;
  const dur = 1400;
  const start = performance.now();
  const suffix = el.textContent.includes('+') ? '+' : '';
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(eased * target);
    el.textContent = isYear ? String(val) : val + (p === 1 ? suffix : '');
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};
if (!reduce && 'IntersectionObserver' in window) {
  const statIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          statIo.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('.stat__num[data-count]').forEach((el) => statIo.observe(el));
}

// ===== Animated low-poly hero background =====
(function poly() {
  const canvas = document.getElementById('poly');
  if (!canvas || reduce) return;
  const ctx = canvas.getContext('2d');
  const palette = ['#8fd79a', '#b5a8f0', '#9db4f7', '#f2bcd4'];
  let w, h, dpr, points, tris, raf;

  const rand = (a, b) => a + Math.random() * (b - a);

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Build a loose grid of jittered points, each with a drift velocity.
    const gap = Math.max(90, Math.min(w, h) / 9);
    const cols = Math.ceil(w / gap) + 2;
    const rows = Math.ceil(h / gap) + 2;
    points = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const bx = (x - 1) * gap;
        const by = (y - 1) * gap;
        points.push({
          ox: bx + rand(-gap * 0.35, gap * 0.35),
          oy: by + rand(-gap * 0.35, gap * 0.35),
          phase: rand(0, Math.PI * 2),
          amp: rand(6, 20),
          x: 0, y: 0,
        });
      }
    }
    // Triangulate the grid (two triangles per cell).
    tris = [];
    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i = y * cols + x;
        tris.push([i, i + 1, i + cols], [i + 1, i + cols + 1, i + cols]);
      }
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const time = t * 0.0006;
    for (const p of points) {
      p.x = p.ox + Math.cos(time + p.phase) * p.amp;
      p.y = p.oy + Math.sin(time * 1.3 + p.phase) * p.amp;
    }
    for (let k = 0; k < tris.length; k++) {
      const [a, b, c] = tris[k];
      const pa = points[a], pb = points[b], pc = points[c];
      if (!pa || !pb || !pc) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.lineTo(pc.x, pc.y);
      ctx.closePath();
      const col = palette[k % palette.length];
      const alpha = 0.04 + 0.05 * (0.5 + 0.5 * Math.sin(time * 2 + k));
      ctx.fillStyle = hexA(col, alpha);
      ctx.fill();
      ctx.strokeStyle = hexA(col, 0.10);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  let resizeT;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(build, 200);
  }

  build();
  raf = requestAnimationFrame(frame);
  window.addEventListener('resize', onResize);

  // Pause when hero is off-screen to save battery.
  const hero = document.querySelector('.hero');
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!raf) raf = requestAnimationFrame(frame);
        } else {
          cancelAnimationFrame(raf);
          raf = null;
        }
      });
    }).observe(hero);
  }
})();
