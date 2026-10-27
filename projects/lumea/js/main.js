/* =========================================================
   Luméa · interactions & scroll animations
   ========================================================= */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const loader = $('#loader');

  document.body.classList.add('is-loading');

  // If the CDN scripts failed (offline), show the static site instead of a stuck loader.
  if (!window.gsap || !window.ScrollTrigger) {
    loader.remove();
    document.body.classList.remove('is-loading');
    window.__sceneStarted = true;
    window.dispatchEvent(new Event('scene:start'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else (typeof target === 'number' ? window.scrollTo({ top: target, behavior: 'smooth' }) : target.scrollIntoView({ behavior: 'smooth' }));
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? 0 : $(id);
    if (el === null) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    scrollTo(el);
  }));

  /* ---------- Split helpers ---------- */
  function splitLines(el) {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map((p) => `<span class="line"><span class="line__inner">${p.trim()}</span></span>`).join('');
    return $$('.line__inner', el);
  }
  function splitWords(el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    return $$('.w', el);
  }

  /* ---------- Loader → hero intro ---------- */
  const heroLines = $$('.hero__title .line__inner');
  gsap.set(heroLines, { yPercent: 115, rotate: 4 });
  gsap.set(['.hero__eyebrow', '.hero__sub', '.hero__actions', '.hero__meta', '.hero__scroll', '.nav'], { autoAlpha: 0, y: 24 });

  const count = { v: 0 };
  const countEl = $('#loaderCount');
  const minTime = new Promise((r) => setTimeout(r, reduced ? 200 : 1900));
  const sceneReady = new Promise((r) => {
    window.addEventListener('scene:ready', r, { once: true });
    setTimeout(r, 6000); // never block on a slow GPU / network
  });
  gsap.to(count, { v: 92, duration: 1.8, ease: 'power2.out', onUpdate: () => (countEl.textContent = Math.round(count.v)) });

  Promise.all([minTime, sceneReady]).then(() => {
    gsap.to(count, { v: 100, duration: 0.3, onUpdate: () => (countEl.textContent = Math.round(count.v)) });
    const tl = gsap.timeline({ delay: 0.35 });
    tl.to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' })
      .add(() => {
        window.__sceneStarted = true;
        window.dispatchEvent(new Event('scene:start'));
        document.body.classList.remove('is-loading');
        loader.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }, '-=0.35')
      .to(heroLines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.12, ease: 'expo.out' }, '-=0.2')
      .to(['.nav', '.hero__eyebrow', '.hero__sub', '.hero__actions', '.hero__meta', '.hero__scroll'], { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, '-=1.1');
  });

  /* ---------- Hero scroll-out ---------- */
  gsap.to('.hero__content', {
    yPercent: -30, autoAlpha: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true },
  });

  /* ---------- Nav behaviour ---------- */
  const nav = $('#nav');
  let lastY = 0;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.8 && !document.body.classList.contains('menu-open'));
      lastY = y;
    },
  });
  // switch the nav to dark text while it sits over a light section
  const lightSections = $$('[data-nav="light"]');
  const updateNavTheme = () => {
    const light = lightSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 40 && r.bottom > 40; });
    nav.classList.toggle('is-light', light);
  };
  gsap.ticker.add(updateNavTheme);
  $('#burger').addEventListener('click',() => document.body.classList.toggle('menu-open'));

  /* ---------- Section titles (line reveal) ---------- */
  $$('.reveal-title').forEach((el) => {
    const lines = splitLines(el);
    gsap.from(lines, {
      yPercent: 110, rotate: 3, duration: 1.3, stagger: 0.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
  $$('.eyebrow').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { autoAlpha: 0, x: -20, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- Intro: image, scrub text, counters ---------- */
  gsap.from('.intro__card', {
    clipPath: 'inset(100% 0 0 0 round 260px 260px 22px 22px)', duration: 1.6, ease: 'expo.inOut',
    scrollTrigger: { trigger: '.intro__card', start: 'top 80%' },
  });
  gsap.to('.intro__card img', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.intro__badge', { scale: 0, rotate: -120, duration: 1.4, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.intro__badge', start: 'top 90%' } });

  const words = splitWords($('#scrubText'));
  gsap.to(words, {
    opacity: 1, stagger: 0.08, ease: 'none',
    scrollTrigger: { trigger: '#scrubText', start: 'top 80%', end: 'bottom 50%', scrub: true },
  });

  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suf = el.dataset.suffix || '';
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(o, {
        v: end, duration: 2.2, ease: 'power3.out',
        onUpdate: () => (el.textContent = (dec ? o.v.toFixed(dec) : Math.round(o.v).toLocaleString('en-US')) + suf),
      }),
    });
  });

  /* ---------- Treatments: pinned horizontal scroll (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('#tTrack');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.treatments', start: 'top top', end: () => '+=' + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => gsap.set('#tProgress', { scaleX: self.progress }),
      },
    });
    // each card swings in from a 3D angle as it enters the viewport
    $$('.tcard', track).forEach((card) => {
      gsap.fromTo(card, { rotateY: -24, z: -120, opacity: 0.4 }, {
        rotateY: 0, z: 0, opacity: 1, ease: 'power2.out',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 100%', end: 'left 55%', scrub: true },
      });
      const img = $('img', card);
      if (img) gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
  });
  mm.add('(max-width: 900px)', () => {
    gsap.from('.tcard', { y: 60, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#tTrack', start: 'top 85%' } });
  });

  /* ---------- Technology ---------- */
  const device = $('#techDevice');
  gsap.fromTo(device, { rotateY: -22, rotateX: 10, scale: 0.9 }, {
    rotateY: 16, rotateX: -6, scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.tech', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  const hotspots = $$('.hotspot');
  const techItems = $$('.tech__item');
  const setTech = (i) => {
    techItems.forEach((t, k) => t.classList.toggle('is-active', k === i));
    hotspots.forEach((h) => h.classList.toggle('is-active', +h.dataset.i === i));
  };
  techItems.forEach((item, i) => {
    ScrollTrigger.create({ trigger: item, start: 'top 62%', end: 'bottom 62%', onToggle: (s) => s.isActive && setTech(i) });
  });
  hotspots.forEach((h) => h.addEventListener('click', () => scrollTo(techItems[+h.dataset.i])));

  /* ---------- Studio: 3D carousel ---------- */
  const shots = [
    ['arch-room.jpg', 'The Arch Room'],
    ['glow-suite.jpg', 'The Glow Suite'],
    ['hydra-device.jpg', 'Hydra Technology'],
    ['microcurrent.jpg', 'Microcurrent Lift'],
    ['signature-facial.jpg', 'Signature Facial'],
  ];
  const ring = $('#ring');
  const N = 10;
  const items = [];
  for (let i = 0; i < N; i++) {
    const [src, cap] = shots[i % shots.length];
    const fig = document.createElement('figure');
    fig.className = 'carousel__item';
    fig.innerHTML = `<img src="assets/img/${src}" alt="${cap}" loading="lazy" /><figcaption>${cap}</figcaption>`;
    ring.appendChild(fig);
    items.push(fig);
  }
  const step = 360 / N;
  let radius = 0;
  const layoutRing = () => {
    const w = ring.offsetWidth;
    radius = Math.round((w / 2) / Math.tan(Math.PI / N) * 1.18);
    items.forEach((it, i) => (it.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`));
  };
  layoutRing();
  window.addEventListener('resize', layoutRing);

  const car = { angle: 0, vel: 0, dragging: false, lastX: 0, visible: false };
  const carousel = $('#carousel');
  carousel.addEventListener('pointerdown', (e) => { car.dragging = true; car.lastX = e.clientX; carousel.setPointerCapture(e.pointerId); });
  carousel.addEventListener('pointermove', (e) => {
    if (!car.dragging) return;
    const dx = e.clientX - car.lastX;
    car.lastX = e.clientX;
    car.vel = dx * 0.25;
    car.angle += dx * 0.25;
  });
  const endDrag = () => (car.dragging = false);
  carousel.addEventListener('pointerup', endDrag);
  carousel.addEventListener('pointercancel', endDrag);
  ScrollTrigger.create({
    trigger: carousel, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => (car.visible = s.isActive),
    onUpdate: (s) => { if (!car.dragging) car.vel += s.getVelocity() * 0.00035; },
  });
  gsap.from(ring, { rotateX: -30, scale: 0.7, autoAlpha: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: carousel, start: 'top 80%' } });
  gsap.ticker.add(() => {
    if (!car.visible) return;
    if (!car.dragging) {
      car.vel *= 0.94;
      car.angle += car.vel + (reduced ? 0 : 0.08);
    }
    ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${car.angle}deg)`;
    items.forEach((it, i) => {
      const a = ((i * step + car.angle) % 360 + 360) % 360;
      const c = Math.cos((a * Math.PI) / 180); // 1 = front
      it.style.filter = `brightness(${0.45 + 0.55 * ((c + 1) / 2)})`;
    });
  });

  /* ---------- Journey ---------- */
  const path = $('#journeyPath');
  if (path) {
    const len = path.getTotalLength();
    gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.journey__steps', start: 'top 80%', end: 'bottom 60%', scrub: true } });
  }
  gsap.from('.step', {
    y: 70, autoAlpha: 0, rotateX: -25, transformPerspective: 900, duration: 1.2, stagger: 0.15, ease: 'power3.out',
    scrollTrigger: { trigger: '.journey__steps', start: 'top 80%' },
  });
  gsap.from('.step__n', { scale: 0, duration: 1, stagger: 0.15, ease: 'back.out(2)', scrollTrigger: { trigger: '.journey__steps', start: 'top 80%' } });

  /* ---------- Reviews slider ---------- */
  const reviews = $$('.review');
  const dots = $$('#reviewDots button');
  let rIdx = 0;
  let rTimer;
  const showReview = (i) => {
    if (i === rIdx) return;
    const prev = reviews[rIdx];
    const next = reviews[i];
    gsap.to(prev, { autoAlpha: 0, y: -20, duration: 0.6, ease: 'power2.in' });
    gsap.fromTo(next, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.45, ease: 'power3.out' });
    dots[rIdx].classList.remove('is-active');
    dots[i].classList.add('is-active');
    rIdx = i;
  };
  const autoplay = () => { clearInterval(rTimer); rTimer = setInterval(() => showReview((rIdx + 1) % reviews.length), 6500); };
  dots.forEach((d, i) => d.addEventListener('click', () => { showReview(i); autoplay(); }));
  autoplay();

  /* ---------- Membership ---------- */
  gsap.from('.plan', {
    y: 90, rotateX: -18, autoAlpha: 0, transformPerspective: 1200, duration: 1.3, stagger: 0.14, ease: 'expo.out',
    scrollTrigger: { trigger: '.plans', start: 'top 82%' },
  });

  /* ---------- Book ---------- */
  gsap.from('.book__form', { y: 80, autoAlpha: 0, rotateY: -12, transformPerspective: 1200, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.book__form', start: 'top 85%' } });
  gsap.from('.book__info li', { x: -30, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.book__info', start: 'top 90%' } });
  gsap.from('.footer__big', { yPercent: 40, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 95%' } });

  const toast = $('#toast');
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-show'), 4200);
  };
  const dateInput = $('#f-date');
  dateInput.min = new Date().toISOString().split('T')[0];
  $('#bookForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('input, select', e.target);
    let ok = true;
    fields.forEach((f) => {
      const bad = !f.checkValidity();
      f.closest('.field').classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    if (!ok) return showToast('Please complete all fields so we can reserve your spot.');
    const name = $('#f-name').value.trim().split(' ')[0];
    showToast(`Thank you, ${name}. Your request is in and our concierge will be in touch shortly.`);
    e.target.reset();
  });

  /* ---------- Cursor, magnetic buttons, 3D tilt (desktop only) ---------- */
  if (finePointer && !reduced) {
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ringEl = $('.cursor__ring');
    const label = $('.cursor__ring span');
    const pos = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
    window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      pos.rx += (pos.x - pos.rx) * 0.16;
      pos.ry += (pos.y - pos.ry) * 0.16;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      ringEl.style.transform = `translate(${pos.rx}px, ${pos.ry}px)`;
    });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, select, .hotspot');
      cursor.classList.toggle('is-label', !!lab && !hov);
      cursor.classList.toggle('is-hover', !!hov);
      if (lab) label.textContent = lab.dataset.cursor;
    });

    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
    });

    $$('.tilt').forEach((el) => {
      const max = el.classList.contains('intro__card') ? 7 : 9;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        gsap.to(el, { rotateY: (px - 0.5) * max * 2, rotateX: (0.5 - py) * max * 2, transformPerspective: 1000, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
