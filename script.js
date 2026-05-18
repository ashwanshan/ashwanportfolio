/* ════════════════════════════════════════════
   ASHWAN PORTFOLIO — script.js  (Enhanced 3D)
   ════════════════════════════════════════════ */

/* ── 1. THREE.JS 3D BACKGROUND ──────────────
   Smooth animated particle + wireframe mesh
   scene that fills the entire page background.
 ──────────────────────────────────────────── */
(function init3DBackground() {
  const canvas = document.getElementById('bg3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x06060e, 1);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 5);

  /* — Fog for depth — */
  scene.fog = new THREE.FogExp2(0x06060e, 0.035);

  /* — Star / particle field — */
  const starGeo = new THREE.BufferGeometry();
  const COUNT   = 3500;
  const pos     = new Float32Array(COUNT * 3);
  const sizes   = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 80;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 80;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
    sizes[i] = Math.random() * 1.8 + 0.4;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1));

  const starMat = new THREE.PointsMaterial({
    color: 0xb07bff,
    size: 0.06,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* — Second star layer (blue tint) — */
  const starGeo2 = new THREE.BufferGeometry();
  const pos2     = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) {
    pos2[i * 3]     = (Math.random() - 0.5) * 60;
    pos2[i * 3 + 1] = (Math.random() - 0.5) * 60;
    pos2[i * 3 + 2] = (Math.random() - 0.5) * 60;
  }
  starGeo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  const starMat2 = new THREE.PointsMaterial({
    color: 0x60a5fa,
    size: 0.04,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const stars2 = new THREE.Points(starGeo2, starMat2);
  scene.add(stars2);

  /* — Wireframe icosahedron core — */
  const icoGeo  = new THREE.IcosahedronGeometry(1.4, 1);
  const icoMat  = new THREE.MeshBasicMaterial({
    color: 0x7c3aed,
    wireframe: true,
    transparent: true,
    opacity: 0.12,
  });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(3, -1, -2);
  scene.add(ico);

  /* — Second wireframe (blue, far right hero side) — */
  const icoGeo2 = new THREE.IcosahedronGeometry(1.0, 1);
  const icoMat2 = new THREE.MeshBasicMaterial({
    color: 0x2563eb,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });
  const ico2 = new THREE.Mesh(icoGeo2, icoMat2);
  ico2.position.set(-3.5, 1.5, -1.5);
  scene.add(ico2);

  /* — Floating torus ring — */
  const torusGeo = new THREE.TorusGeometry(1.8, 0.01, 8, 80);
  const torusMat = new THREE.MeshBasicMaterial({
    color: 0xb07bff,
    transparent: true,
    opacity: 0.07,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(-1, -2, -3);
  torus.rotation.x = Math.PI / 3;
  scene.add(torus);

  /* — Nebula-like glow planes — */
  function makeGlow(color, x, y, z, size) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    return m;
  }
  scene.add(makeGlow(0x7c3aed, -2, 2, -4, 10));
  scene.add(makeGlow(0x2563eb,  3, -1, -5, 8));

  /* — Mouse-reactive camera nudge — */
  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth  - 0.5) * 0.4;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  /* — Resize handler — */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* — Scroll-based camera push-back — */
  let scrollY = 0;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; });

  /* — Render loop — */
  let t = 0;
  function animate() {
    requestAnimationFrame(animate);
    t += 0.003;

    // Smooth mouse follow
    currentX += (targetX - currentX) * 0.04;
    currentY += (targetY - currentY) * 0.04;

    // Camera drift + mouse
    camera.position.x = currentX * 1.5 + Math.sin(t * 0.3) * 0.2;
    camera.position.y = -currentY * 1.2 + Math.sin(t * 0.2) * 0.15 - scrollY * 0.0008;
    camera.position.z = 5 + Math.sin(t * 0.15) * 0.3;
    camera.lookAt(0, 0, 0);

    // Rotate stars slowly
    stars.rotation.y  = t * 0.04;
    stars.rotation.x  = t * 0.015;
    stars2.rotation.y = -t * 0.06;
    stars2.rotation.z =  t * 0.01;

    // Rotate wireframes
    ico.rotation.x  = t * 0.25;
    ico.rotation.y  = t * 0.35;
    ico2.rotation.x = -t * 0.2;
    ico2.rotation.z =  t * 0.28;

    // Torus drift
    torus.rotation.z = t * 0.12;
    torus.position.y = -2 + Math.sin(t * 0.5) * 0.3;

    renderer.render(scene, camera);
  }
  animate();

  // Fade in canvas after loader
  setTimeout(() => canvas.classList.add('visible'), 2200);
})();

/* ── 2. LOADING SCREEN ──────────────────────── */
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  setTimeout(() => {
    loader.classList.add('hide');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 2100);
});

/* ── 3. CUSTOM CURSOR ───────────────────────── */
const cursorDot  = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

if (window.matchMedia('(pointer: fine)').matches) {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll('a, button, .btn, .project-card, .skill-card, .service-card, .profile-3d-card').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorRing.style.transform = 'translate(-50%,-50%) scale(1.8)';
      cursorRing.style.opacity   = '0.8';
    });
    el.addEventListener('mouseleave', () => {
      cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
      cursorRing.style.opacity   = '0.5';
    });
  });

  document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity  = '0';
    cursorRing.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity  = '1';
    cursorRing.style.opacity = '0.5';
  });
}

/* ── 4. NAVBAR ──────────────────────────────── */
const navbar     = document.getElementById('navbar');
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const navLinks   = document.querySelectorAll('.nav-link');
const mobLinks   = document.querySelectorAll('.mob-link');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

mobLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

const sections    = document.querySelectorAll('section[id]');
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => navObserver.observe(s));

/* ── 5. TYPING ANIMATION ────────────────────── */
const typingEl = document.getElementById('typingText');
const roles    = ['Video Editor','Web Developer','Graphic Designer','Creative Freelancer','UI Enthusiast'];
let roleIndex = 0, charIndex = 0, isDeleting = false;

function typeLoop() {
  const current = roles[roleIndex];
  if (isDeleting) {
    typingEl.textContent = current.slice(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = current.slice(0, charIndex + 1);
    charIndex++;
  }
  let speed = isDeleting ? 60 : 100;
  if (!isDeleting && charIndex === current.length) { speed = 1800; isDeleting = true; }
  else if (isDeleting && charIndex === 0) { isDeleting = false; roleIndex = (roleIndex + 1) % roles.length; speed = 400; }
  setTimeout(typeLoop, speed);
}
setTimeout(typeLoop, 2200);

/* ── 6. SCROLL REVEAL ───────────────────────── */
const revealEls     = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });

revealEls.forEach((el) => {
  const parent   = el.parentElement;
  const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
  const pos      = siblings.indexOf(el);
  if (pos > 0) el.style.transitionDelay = `${pos * 0.1}s`;
  revealObserver.observe(el);
});

/* ── 7. STAT COUNTERS ───────────────────────── */
const statNums = document.querySelectorAll('.stat-num');

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const step   = target / (1400 / 16);
  let current  = 0;
  const tick   = () => {
    current += step;
    if (current >= target) { el.textContent = target; }
    else { el.textContent = Math.floor(current); requestAnimationFrame(tick); }
  };
  tick();
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { statNums.forEach(animateCounter); statsObserver.disconnect(); }
  });
}, { threshold: 0.5 });

const aboutSection = document.getElementById('about');
if (aboutSection) statsObserver.observe(aboutSection);

/* ── 8. SKILL BARS ──────────────────────────── */
const skillFills    = document.querySelectorAll('.skill-fill');
const skillsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      skillFills.forEach(fill => {
        setTimeout(() => { fill.style.width = fill.dataset.width + '%'; }, 400);
      });
      skillsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const skillsSection = document.getElementById('skills');
if (skillsSection) skillsObserver.observe(skillsSection);

/* ── 9. SMOOTH SCROLL ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (targetId === '#') return;
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;
    e.preventDefault();
    const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 70;
    const offsetTop = targetEl.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
  });
});

/* ── 10. CONTACT FORM ───────────────────────── */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !message) {
      const btn = contactForm.querySelector('button[type="submit"]');
      btn.style.animation = 'none'; btn.offsetHeight;
      btn.style.animation = 'shake 0.4s ease';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('email').style.borderColor = '#ef4444';
      return;
    }

    const submitBtn = contactForm.querySelector('button[type="submit"]');
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Sending…';

    setTimeout(() => {
      submitBtn.disabled  = false;
      submitBtn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Message';
      formSuccess.classList.add('show');
      contactForm.reset();
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    }, 1800);
  });

  contactForm.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('input', () => { field.style.borderColor = ''; });
  });
}

/* Injected keyframes */
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)}
    25%{transform:translateX(-6px)}
    75%{transform:translateX(6px)}
  }
  .ri-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(shakeStyle);

/* ── 11. PROFILE 3D CARD TILT ───────────────
   Smooth perspective tilt on mouse move over
   the hero profile card.
 ──────────────────────────────────────────── */
const card3D = document.getElementById('profile3DCard');
const wrap3D = document.getElementById('profile3DWrapper');

if (card3D && wrap3D) {
  let tiltX = 0, tiltY = 0;
  let targetTX = 0, targetTY = 0;

  wrap3D.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = wrap3D.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;   // -0.5 … 0.5
    const y = (e.clientY - top)  / height - 0.5;
    targetTX = -y * 22;
    targetTY =  x * 22;
  });

  wrap3D.addEventListener('mouseleave', () => {
    targetTX = 0;
    targetTY = 0;
  });

  function animateTilt() {
    tiltX += (targetTX - tiltX) * 0.1;
    tiltY += (targetTY - tiltY) * 0.1;
    card3D.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`;
    requestAnimationFrame(animateTilt);
  }
  animateTilt();
}

/* ── 12. GRID / CARD STAGGER DELAY ─────────── */
['.projects-grid', '.services-grid', '.skills-grid'].forEach(selector => {
  const grid = document.querySelector(selector);
  if (!grid) return;
  Array.from(grid.children).forEach((card, i) => {
    card.style.transitionDelay = `${i * 0.12}s`;
  });
});

/* ── 13. PARALLAX ORB TILT (hero BG orbs removed
   since Three.js canvas handles background now)
 ──────────────────────────────────────────── */

console.log('%c⚡ Ashwan Portfolio — 3D Enhanced', 'color:#b07bff; font-size:14px; font-weight:bold;');
