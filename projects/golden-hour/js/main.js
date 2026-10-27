/* =========================================================
   Golden Hour · interactions & scroll animations
   ========================================================= */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const loader = $('#loader');
  document.body.classList.add('is-loading');

  // CDN failed (offline): show the static page instead of a stuck loader.
  if (!window.gsap || !window.ScrollTrigger) {
    loader.remove();
    document.body.classList.remove('is-loading');
    window.__sceneStarted = true;
    dispatchEvent(new Event('scene:start'));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll + anchors ---------- */
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
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id === '#top' ? 0 : $(id);
    if (el === null) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    scrollTo(el);
  }));

  const splitLines = (el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) => `<span class="line"><span class="line__inner">${p.trim()}</span></span>`).join('');
    return $$('.line__inner', el);
  };

  /* ---------- Loader → hero intro ---------- */
  const heroLines = $$('.hero__title .line__inner');
  gsap.set(heroLines, { yPercent: 115, rotate: 5 });
  const heroBits = ['.nav', '.hero__brand', '.hero__kicker', '.hero__sub', '.hero__actions', '.hero__badge', '.hero__scroll'];
  gsap.set(heroBits, { autoAlpha: 0, y: 24 });

  const count = { v: 0 };
  const setCount = () => { $('#loaderCount').textContent = Math.round(count.v); $('#loaderFill').style.height = (count.v * 0.86) + '%'; };
  gsap.to(count, { v: 90, duration: 1.8, ease: 'power2.out', onUpdate: setCount });
  const minTime = new Promise((r) => setTimeout(r, reduced ? 200 : 1900));
  const sceneReady = new Promise((r) => { addEventListener('scene:ready', r, { once: true }); setTimeout(r, 6000); });

  Promise.all([minTime, sceneReady]).then(() => {
    gsap.to(count, { v: 100, duration: 0.35, onUpdate: setCount });
    gsap.timeline({ delay: 0.4 })
      .to(loader, { clipPath: 'circle(0% at 50% 50%)', duration: 1.1, ease: 'expo.inOut' })
      .add(() => {
        window.__sceneStarted = true;
        dispatchEvent(new Event('scene:start'));
        document.body.classList.remove('is-loading');
        loader.remove();
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      }, '-=0.45')
      .to(heroLines, { yPercent: 0, rotate: 0, duration: 1.4, stagger: 0.14, ease: 'expo.out' }, '-=0.1')
      .to(heroBits, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, '-=1.1');
  });
  gsap.set(loader, { clipPath: 'circle(150% at 50% 50%)' });

  gsap.to('.hero__content', { yPercent: -35, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 25%', scrub: true } });

  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const lightSections = $$('[data-nav="light"]');
  let lastY = 0;
  gsap.ticker.add(() => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY + 1 && y > innerHeight * 0.8 && !document.body.classList.contains('menu-open'));
    if (y < lastY - 1) nav.classList.remove('is-hidden');
    lastY = y;
    nav.classList.toggle('is-light', lightSections.some((s) => { const r = s.getBoundingClientRect(); return r.top <= 36 && r.bottom > 36; }));
  });
  $('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));

  /* ---------- Titles & kickers ---------- */
  $$('.reveal').forEach((el) => {
    gsap.from(splitLines(el), { yPercent: 115, rotate: 4, duration: 1.3, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
  });
  $$('.kicker').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { autoAlpha: 0, x: -24, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* ---------- Story ---------- */
  gsap.from('.story__p, .story__stats', { autoAlpha: 0, y: 40, duration: 1.2, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.story__p', start: 'top 88%' } });
  $$('.story__img').forEach((fig, i) => {
    gsap.from(fig, { clipPath: 'inset(100% 0% 0% 0% round 26px)', duration: 1.6, delay: i * 0.2, ease: 'expo.inOut', scrollTrigger: { trigger: '.story__media', start: 'top 78%' } });
    gsap.fromTo($('img', fig), { yPercent: -8 }, { yPercent: 6 - i * 10, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.story__stamp', { scale: 0, rotate: -180, duration: 1.4, ease: 'back.out(1.7)', scrollTrigger: { trigger: '.story__media', start: 'top 60%' } });
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const suf = el.dataset.suffix || '';
    const o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v) + suf) }) });
  });

  /* ---------- Signature stacking cards ---------- */
  const scards = $$('.scard');
  scards.forEach((card, i) => {
    gsap.from(card, { y: 120, rotateX: -12, transformPerspective: 1400, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 95%' } });
    const next = scards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.9, yPercent: -4, filter: 'brightness(0.45)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 12%', scrub: true },
    });
  });

  /* ---------- Menu tabs + floating image ---------- */
  const tabs = $$('#tabs button');
  const pill = $('#tabPill');
  const movePill = (btn) => {
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = `translateX(${btn.offsetLeft - 6}px)`;
  };
  const activate = (btn) => {
    tabs.forEach((b) => b.classList.toggle('is-active', b === btn));
    movePill(btn);
    const panel = $(`.mlist[data-panel="${btn.dataset.tab}"]`);
    $$('.mlist').forEach((l) => l.classList.toggle('is-active', l === panel));
    gsap.fromTo($$('li', panel), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' });
    ScrollTrigger.refresh();
  };
  tabs.forEach((b) => b.addEventListener('click', () => activate(b)));
  requestAnimationFrame(() => movePill(tabs[0]));
  addEventListener('resize', () => movePill($('#tabs button.is-active')));
  document.fonts && document.fonts.ready.then(() => movePill($('#tabs button.is-active')));
  gsap.from('.mlist.is-active li', { autoAlpha: 0, y: 40, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.menu__panels', start: 'top 85%' } });

  if (finePointer) {
    const float = $('#menuFloat');
    const fimg = $('img', float);
    const fx = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3.out' });
    const fy = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3.out' });
    let lastX = 0;
    addEventListener('pointermove', (e) => {
      fx(e.clientX + 40); fy(e.clientY);
      gsap.to(float, { rotate: gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6), duration: 0.5 });
      lastX = e.clientX;
    }, { passive: true });
    $$('.mlist li').forEach((li) => {
      li.addEventListener('pointerenter', () => {
        const src = `assets/img/${li.dataset.img}.jpg`;
        if (!fimg.src.endsWith(src)) fimg.src = src;
        gsap.to(float, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' });
      });
      li.addEventListener('pointerleave', () => gsap.to(float, { autoAlpha: 0, scale: 0.6, duration: 0.4 }));
    });
  }

  /* ---------- Day → Night (pinned) ---------- */
  const sky = $('#dnSky');
  const frames = $$('.dn__frame');
  const caps = $$('.dn__cap');
  const sunEl = $('#dnSun');
  const arc = $('#dnArc');
  const arcLen = arc.getTotalLength();
  arc.style.strokeDasharray = arcLen;
  const clock = $('#dnClock');
  const moods = [
    ['#2f6f9f', '#b8956a'],
    ['#4a2a45', '#e0864a'],
    ['#221a38', '#9c4c48'],
    ['#060a17', '#1b1832'],
  ];
  gsap.set(sky, { '--top': moods[0][0], '--bot': moods[0][1], background: 'linear-gradient(180deg, var(--top), var(--bot))' });
  const dnTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.daynight', start: 'top top', end: '+=320%', pin: '.dn__pin', scrub: 0.8, anticipatePin: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // sun rides the arc; becomes the moon after sunset
        const a = Math.PI * (1 - (0.28 + p * 0.72));
        sunEl.setAttribute('cx', 150 + 140 * Math.cos(a));
        sunEl.setAttribute('cy', 140 - 140 * Math.sin(a));
        sunEl.style.fill = p > 0.7 ? '#e6ecff' : '#ffd98a';
        arc.style.strokeDashoffset = arcLen * (1 - (0.28 + p * 0.72));
        const mins = Math.round((660 + p * 690) / 5) * 5; // 11:00 → 22:30
        const h = Math.floor(mins / 60), m = mins % 60;
        clock.textContent = `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
        const idx = Math.min(3, Math.floor(p * 4 + 0.08));
        caps.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      },
    },
  });
  frames.forEach((f, i) => {
    if (!i) return;
    dnTl.to(f, { clipPath: 'inset(0% 0 0 0)', duration: 1 }, i - 0.6)
      .fromTo($('img', f), { scale: 1.25 }, { scale: 1, duration: 1 }, i - 0.6)
      .to(sky, { '--top': moods[i][0], '--bot': moods[i][1], duration: 1 }, i - 0.6);
  });
  dnTl.to({}, { duration: 0.4 });

  /* ---------- Spaces: 3D plane that stands up ---------- */
  const plane = $('#galleryPlane');
  gsap.fromTo(plane, { rotateX: 52, rotateZ: -12, scale: 0.78, y: -60 }, {
    rotateX: 0, rotateZ: 0, scale: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'center 60%', scrub: 1 },
  });
  $$('.gcol').forEach((col) => {
    gsap.fromTo(col, { y: 0 }, { y: +col.dataset.speed * 1.6, ease: 'none', scrollTrigger: { trigger: '#gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Events ---------- */
  gsap.from('.ecard', { y: 100, rotateY: -25, autoAlpha: 0, transformPerspective: 1200, duration: 1.3, stagger: 0.14, ease: 'expo.out', scrollTrigger: { trigger: '.ecards', start: 'top 85%' } });
  gsap.from('.private', { scaleX: 0.85, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.private', start: 'top 92%' } });

  /* ---------- Reserve ---------- */
  gsap.from('.rform', { y: 100, rotateX: 18, transformPerspective: 1300, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.rform', start: 'top 88%' } });
  gsap.from('.hours div', { x: -30, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.hours', start: 'top 92%' } });
  gsap.from('.reserve__glow', { yPercent: 40, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.reserve', start: 'top bottom', end: 'center center', scrub: true } });
  gsap.from('.footer__big', { yPercent: 60, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 95%' } });

  const toast = $('#toast');
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-show'), 4500);
  };
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  $('#rDate').min = iso(today);
  $('#rDate').value = iso(new Date(today.getTime() + 86400000));
  $('#rform').addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    ['#rDate', '#rName', '#rEmail'].forEach((s) => {
      const f = $(s);
      const bad = !f.checkValidity();
      f.closest('.f').classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    if (!ok) return showToast('Almost there. Please add your name, email and a date.');
    const area = $('input[name="area"]:checked').value;
    const d = new Date($('#rDate').value + 'T12:00');
    const nice = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    showToast(`Table for ${$('#rGuests').value} in the ${area.toLowerCase()}, ${nice} at ${$('#rTime').value}. See you soon, ${$('#rName').value.trim().split(' ')[0]}!`);
    $('#rName').value = '';
    $('#rEmail').value = '';
  });

  /* ---------- Cursor, magnetic, tilt ---------- */
  $$('.gitem').forEach((el) => (el.dataset.cursor = 'View'));
  $$('.scard').forEach((el) => (el.dataset.cursor = 'Yum'));
  $$('.dn__frames').forEach((el) => (el.dataset.cursor = 'Scroll'));

  if (finePointer && !reduced) {
    const cursor = $('.cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const label = $('.cursor__ring span');
    const pos = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
    addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
    gsap.ticker.add(() => {
      pos.rx += (pos.x - pos.rx) * 0.16;
      pos.ry += (pos.y - pos.ry) * 0.16;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      ring.style.transform = `translate(${pos.rx}px, ${pos.ry}px)`;
    });
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a, button, input, select, label, .mlist li');
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
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        gsap.to(el, { rotateY: (px - 0.5) * 14, rotateX: (0.5 - py) * 14, transformPerspective: 1000, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
