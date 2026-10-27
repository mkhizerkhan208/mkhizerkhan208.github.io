/* =========================================================
   Velvet Bean · shared site behaviour (every page)
   header/footer injection, loader + page-transition curtain,
   smooth scroll, reveals, split titles, cursor, tilt, counters
   ========================================================= */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const page = document.body.dataset.page;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const ICON = {
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    mark: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-12 0-20 12-20 26s8 26 20 26 20-12 20-26S44 6 32 6z"/><path d="M32 7c-6 9 6 16 0 25s6 17 0 25"/></svg>',
  };
  const PAGES = [
    ['index', 'Home', 'index.html'],
    ['menu', 'Menu', 'menu.html'],
    ['experiences', 'Experiences', 'experiences.html'],
    ['story', 'Our Story', 'story.html'],
    ['contact', 'Contact', 'contact.html'],
  ];
  const HOURS = [ // 0 = Sunday
    ['Sunday', 8, 20], ['Monday', 7, 21], ['Tuesday', 7, 21], ['Wednesday', 7, 21], ['Thursday', 7, 21], ['Friday', 7, 23], ['Saturday', 8, 23],
  ];
  const fmtH = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`;

  /* ---------------- header + footer ---------------- */
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <a href="index.html" class="brand" aria-label="Velvet Bean home">${ICON.mark}<span>Velvet Bean<small>Coffee · Chocolate · Bar</small></span></a>
    <nav class="nav" aria-label="Primary">${PAGES.map(([k, n, h]) => `<a href="${h}" class="${k === page ? 'is-active' : ''}">${n}</a>`).join('')}</nav>
    <a href="contact.html#book" class="btn btn--caramel btn--sm header__cta magnetic">Book a table ${ICON.arrow}</a>
    <button class="burger" aria-label="Open menu"><span></span><span></span></button>`;
  document.body.prepend(header);
  const mnav = document.createElement('div');
  mnav.className = 'mnav';
  mnav.innerHTML = PAGES.map(([k, n, h], i) => `<a href="${h}" class="${k === page ? 'is-active' : ''}"><small>0${i + 1}</small>${n}</a>`).join('') + '<p>418 Wythe Ave, Brooklyn · (718) 555-0142</p>';
  header.after(mnav);
  $('.burger', header).addEventListener('click', () => document.body.classList.toggle('menu-open'));

  const footer = $('footer[data-footer]');
  if (footer) {
    footer.className = 'footer';
    footer.innerHTML = `
      <div class="footer__glow"></div>
      <div class="container footer__cta">
        <p class="eyebrow">Stay a little longer</p>
        <h2 class="footer__big" data-split>Another <em>cup?</em></h2>
        <a href="contact.html#book" class="btn btn--caramel magnetic">Reserve your table ${ICON.arrow}</a>
      </div>
      <div class="container footer__grid">
        <div>
          <a href="index.html" class="brand">${ICON.mark}<span>Velvet Bean<small>Coffee · Chocolate · Bar</small></span></a>
          <p style="margin-top:1.2rem;max-width:320px">Single-origin espresso, bean-to-bar chocolate and slow evenings in Williamsburg, Brooklyn.</p>
          <div class="social">
            <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/></svg></a>
            <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M14 3v11a4 4 0 1 1-4-4M14 3c.5 3 2.5 5 6 5"/></svg></a>
            <a href="#" aria-label="Pinterest"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M11 8c3-1 6 1 5 4s-4 3-5 1m0 0l-2 7"/></svg></a>
          </div>
        </div>
        <div><h5>Explore</h5>${PAGES.map(([, n, h]) => `<a href="${h}">${n}</a>`).join('')}</div>
        <div><h5>Hours</h5>${[[1, 'Mon–Thu'], [5, 'Friday'], [6, 'Saturday'], [0, 'Sunday']].map(([d, l]) => `<p>${l} · ${fmtH(HOURS[d][1])}–${fmtH(HOURS[d][2])}</p>`).join('')}</div>
        <div><h5>The Velvet List</h5><p>New roasts, chocolate drops and tasting nights. Once a month, never spam.</p>
          <form class="news" data-news><input type="email" required placeholder="Your email" aria-label="Email address"><button class="btn btn--caramel btn--sm">Join</button></form></div>
      </div>
      <div class="container footer__bottom"><span>© 2026 Velvet Bean Coffee &amp; Chocolate Bar · Demo website for portfolio purposes</span><span>418 Wythe Ave, Brooklyn, NY 11249</span></div>`;
  }

  /* ---------------- toast ---------------- */
  const toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove('is-on'), 3800);
  };
  $$('[data-news]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); f.reset(); toast('Welcome to the Velvet List. Your first drink is on us.'); }));

  /* ---------------- open now + hours ---------------- */
  const now = new Date();
  const [, oh, ch] = HOURS[now.getDay()];
  const hr = now.getHours() + now.getMinutes() / 60;
  const isOpen = hr >= oh && hr < ch;
  $$('[data-open]').forEach((el) => {
    el.classList.toggle('is-closed', !isOpen);
    el.innerHTML = `<i></i>${isOpen ? `Open now · until ${fmtH(ch)}` : `Closed · opens ${fmtH(hr < oh ? oh : HOURS[(now.getDay() + 1) % 7][1])}`}`;
  });
  $$('[data-hours]').forEach((el) => {
    el.innerHTML = [1, 2, 3, 4, 5, 6, 0].map((d) => `<div class="${d === now.getDay() ? 'is-today' : ''}"><span>${HOURS[d][0]}${d === now.getDay() ? ' · today' : ''}</span><b>${fmtH(HOURS[d][1])} – ${fmtH(HOURS[d][2])}</b></div>`).join('');
  });

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop();
  }
  const lock = (on) => { document.documentElement.classList.toggle('is-locked', on); if (lenis) on ? lenis.stop() : lenis.start(); };

  /* ---------------- header on scroll ---------------- */
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    const menuOpen = document.body.classList.contains('menu-open');
    if (y > lastY + 2 && y > innerHeight * 0.7 && !menuOpen) header.classList.add('is-hidden');
    else if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- split titles ---------------- */
  const splitLines = (el) => {
    if (el.dataset.splitDone) return $$('.line > span', el);
    el.dataset.splitDone = '1';
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join('');
    return $$('.line > span', el);
  };
  const heroSplits = [];
  $$('[data-split]').forEach((el) => {
    const parts = splitLines(el);
    if (!hasGsap || reduced) return;
    gsap.set(parts, { yPercent: 115, rotate: 4 });
    if (el.closest('.hero')) heroSplits.push(parts);
    else ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(parts, { yPercent: 0, rotate: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out' }) });
  });

  /* ---------------- reveal on scroll ---------------- */
  // clip-path: inset(100%) makes an element report zero intersection, so clip reveals watch their parent
  const watchers = new Map();
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    (watchers.get(e.target) || []).forEach((el) => el.classList.add('is-in'));
    watchers.delete(e.target);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -10% 0px' });
  const bindReveal = (root = document) => $$('[data-reveal]:not(.is-in)', root).forEach((el) => {
    const w = el.dataset.reveal === 'clip' ? el.parentElement : el;
    if (!watchers.has(w)) { watchers.set(w, []); io.observe(w); }
    if (!watchers.get(w).includes(el)) watchers.get(w).push(el);
  });

  /* ---------------- parallax images, scrub text, counters ---------------- */
  if (hasGsap && !reduced) {
    $$('[data-parallax]').forEach((el) => {
      const img = $('img', el) || el;
      gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-scrub]').forEach((el) => {
      el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
      gsap.to($$('.w', el), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
  }
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count, dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const fmt = (v) => (el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + suf);
    fmt(0);
    const ob = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      ob.disconnect();
      if (!hasGsap) return fmt(end);
      const o = { v: 0 };
      gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => fmt(o.v) });
    });
    ob.observe(el);
  });

  /* ---------------- cursor, magnetic, tilt ---------------- */
  if (fine && !reduced) {
    const c = document.createElement('div');
    c.className = 'cursor';
    c.innerHTML = '<div class="cursor__dot"></div><div class="cursor__ring"><span></span></div>';
    document.body.appendChild(c);
    const dot = $('.cursor__dot', c), ring = $('.cursor__ring', c), label = $('span', ring);
    const p = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
    addEventListener('pointermove', (e) => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });
    const loop = () => {
      p.rx += (p.x - p.rx) * 0.17; p.ry += (p.y - p.ry) * 0.17;
      dot.style.transform = `translate(${p.x}px,${p.y}px)`;
      ring.style.transform = `translate(${p.rx}px,${p.ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, select, textarea, label, summary');
      c.classList.toggle('is-label', !!lab && !hov);
      c.classList.toggle('is-hover', !!hov);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    if (hasGsap) {
      document.addEventListener('pointermove', (e) => {
        const m = e.target.closest && e.target.closest('.magnetic');
        if (!m) return;
        const r = m.getBoundingClientRect();
        gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
      });
      document.addEventListener('pointerout', (e) => {
        const m = e.target.closest && e.target.closest('.magnetic');
        if (m && !m.contains(e.relatedTarget)) gsap.to(m, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' });
      });
      document.addEventListener('pointermove', (e) => {
        const t = e.target.closest && e.target.closest('[data-tilt]');
        if (!t) return;
        const r = t.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(t, { rotateY: px * 14, rotateX: -py * 14, transformPerspective: 1000, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      });
      document.addEventListener('pointerout', (e) => {
        const t = e.target.closest && e.target.closest('[data-tilt]');
        if (t && !t.contains(e.relatedTarget)) gsap.to(t, { rotateY: 0, rotateX: 0, duration: 1.2, ease: 'elastic.out(1,0.5)', overwrite: 'auto' });
      });
    }
  }

  /* ---------------- loader / curtain / page transitions ---------------- */
  const curtain = $('.curtain');
  const readyFns = [];
  let isReady = false;
  const onReady = (fn) => (isReady ? fn() : readyFns.push(fn));
  const fireReady = () => {
    if (isReady) return;
    isReady = true;
    window.__pageReady = true;
    dispatchEvent(new Event('page:ready'));
    lock(false);
    if (hasGsap && !reduced) {
      heroSplits.forEach((parts, i) => gsap.to(parts, { yPercent: 0, rotate: 0, duration: 1.5, stagger: 0.12, ease: 'expo.out', delay: 0.1 + i * 0.15 }));
      gsap.from('.hero [data-hero]', { y: 30, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'power3.out', delay: 0.35 });
      gsap.from(header, { y: -30, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
    }
    readyFns.splice(0).forEach((fn) => fn());
    bindReveal();
    if (location.hash) {
      const t = document.getElementById(location.hash.slice(1));
      if (t) setTimeout(() => (lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.8 }) : t.scrollIntoView({ behavior: 'smooth' })), 700);
    }
    if (hasGsap) ScrollTrigger.refresh();
  };
  const reveal = () => {
    curtain.classList.remove('is-active');
    if (!hasGsap || reduced) { curtain.style.display = 'none'; fireReady(); return; }
    gsap.to(curtain, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut', onComplete: () => (curtain.style.visibility = 'hidden') });
    setTimeout(fireReady, 550);
  };
  lock(true);
  let firstVisit = true;
  try { firstVisit = !sessionStorage.getItem('vb:visited'); sessionStorage.setItem('vb:visited', '1'); } catch (e) { /* private mode */ }
  const sceneReady = new Promise((r) => { addEventListener('scene:ready', r, { once: true }); setTimeout(r, firstVisit ? 5000 : 2500); if (!$('canvas[data-scene]')) r(); });
  if (firstVisit && hasGsap && !reduced) {
    const count = $('.curtain__count'), path = $$('.curtain__mark path');
    gsap.to(path, { strokeDashoffset: 0, duration: 1.6, stagger: 0.2, ease: 'power2.inOut' });
    const o = { v: 0 };
    gsap.to(o, { v: 86, duration: 1.8, ease: 'power2.out', onUpdate: () => (count.textContent = Math.round(o.v)) });
    Promise.all([sceneReady, new Promise((r) => setTimeout(r, 1900))]).then(() => {
      gsap.to(o, { v: 100, duration: 0.35, onUpdate: () => (count.textContent = Math.round(o.v)), onComplete: reveal });
    });
  } else {
    $$('.curtain__count, .curtain__label').forEach((e) => (e.style.display = 'none'));
    if (hasGsap) gsap.set($$('.curtain__mark path'), { strokeDashoffset: 0 });
    Promise.race([sceneReady, new Promise((r) => setTimeout(r, 900))]).then(reveal);
  }

  const leave = (href) => {
    if (!hasGsap || reduced) { location.href = href; return; }
    lock(true);
    curtain.style.visibility = 'visible';
    curtain.classList.add('is-active');
    $$('.curtain__count, .curtain__label').forEach((e) => (e.style.display = 'none'));
    gsap.fromTo(curtain, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => (location.href = href) });
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('tel:') || href.startsWith('mailto:') || !/\.html(#.*)?$/.test(href)) return;
    const [file, hash] = href.split('#');
    const current = location.pathname.split('/').pop() || 'index.html';
    document.body.classList.remove('menu-open');
    if (file === current) {
      e.preventDefault();
      const t = hash && document.getElementById(hash);
      if (t) lenis ? lenis.scrollTo(t, { offset: -80, duration: 1.6 }) : t.scrollIntoView({ behavior: 'smooth' });
      else lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    leave(href);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { curtain.style.visibility = 'hidden'; lock(false); } });

  window.VB = { $, $$, toast, lenis: () => lenis, lock, onReady, bindReveal, splitLines, ICON, reduced, fine, hasGsap };
})();
