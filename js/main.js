/* =========================================================
   Portfolio · interactions (home + case study pages)
   ========================================================= */
(function () {
  'use strict';
  const P = window.PROFILE || {};
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const root = document.body.dataset.root || '';
  const isHome = document.body.dataset.page === 'home';
  const ARROW = '<svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  /* ---------- nav ---------- */
  const links = [['Work', '#work'], ['Services', '#services'], ['Skills', '#stack'], ['About', '#about'], ['Contact', '#contact']];
  const href = (h) => (isHome ? h : root + 'index.html' + h);
  const nav = document.createElement('header');
  nav.className = 'nav';
  nav.innerHTML = `<a href="${isHome ? '#top' : root + 'index.html'}" class="logo"><i>KK</i>Khizr Khan</a>
    <nav class="nav__links">${links.map(([n, h]) => `<a href="${href(h)}">${n}</a>`).join('')}</nav>
    <span class="avail"><i></i>Available for projects</span>
    <button class="burger" aria-label="Menu"><span></span><span></span></button>`;
  document.body.prepend(nav);
  const mnav = document.createElement('div');
  mnav.className = 'mnav';
  mnav.innerHTML = links.map(([n, h]) => `<a href="${href(h)}">${n}</a>`).join('');
  nav.after(mnav);
  $('.burger', nav).addEventListener('click', () => document.body.classList.toggle('menu-open'));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('menu-open'); });

  /* ---------- toast ---------- */
  const toastEl = Object.assign(document.createElement('div'), { className: 'toast' });
  document.body.appendChild(toastEl);
  const toast = (m) => { toastEl.textContent = m; toastEl.classList.add('is-on'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.remove('is-on'), 3600); };

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const t = a.getAttribute('href') === '#top' ? 0 : $(a.getAttribute('href'));
    if (t === null) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(t, { offset: -20, duration: 1.5 }) : (t === 0 ? scrollTo({ top: 0, behavior: 'smooth' }) : t.scrollIntoView({ behavior: 'smooth' }));
  });
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    if (y > lastY + 3 && y > 500 && !document.body.classList.contains('menu-open')) nav.classList.add('is-hidden');
    else if (y < lastY - 3) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- dynamic content (home) ---------- */
  if (P.skills && $('#skills')) {
    $('#skills').innerHTML = P.skills.map((g, i) => `
      <div class="skill" data-reveal style="--d:${(i % 3) * 90}ms">
        <div class="skill__head"><h3>${g.group}</h3><span>${String(g.items.length).padStart(2, '0')}</span></div>
        <div class="tags">${g.items.map(([n, core]) => `<span class="${core ? 'core' : ''}">${n}</span>`).join('')}</div>
      </div>`).join('');
    const all = P.skills.flatMap((g) => g.items.map(([n]) => n));
    const total = all.length;
    const cnt = $('[data-count="50"]');
    if (cnt) cnt.dataset.count = total;
    const m = $('#marquee');
    if (m) { const row = all.map((n) => `<span>${n}</span>`).join(''); m.innerHTML = row + row; }
  }
  const cl = $('#contactLinks');
  if (cl) {
    const rows = [];
    if (P.email) rows.push(`<a href="mailto:${P.email}"><span>${P.email}</span><small>Email ${'↗'}</small></a>`);
    if (P.calendly) rows.push(`<a href="${P.calendly}" target="_blank" rel="noopener"><span>Book a 20-minute call</span><small>Calendly ↗</small></a>`);
    if (P.linkedin) rows.push(`<a href="${P.linkedin}" target="_blank" rel="noopener"><span>LinkedIn</span><small>Profile ↗</small></a>`);
    if (P.github) rows.push(`<a href="${P.github}" target="_blank" rel="noopener"><span>GitHub</span><small>Code ↗</small></a>`);
    if (P.whatsapp) rows.push(`<a href="https://wa.me/${P.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener"><span>WhatsApp</span><small>Message ↗</small></a>`);
    rows.push('<button type="button" data-copy><span>Copy email address</span><small>Clipboard</small></button>');
    cl.innerHTML = rows.join('');
    $('[data-copy]', cl).addEventListener('click', async () => { try { await navigator.clipboard.writeText(P.email); toast('Email copied to clipboard'); } catch (e) { toast(P.email); } });
  }
  const form = $('#contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach((i) => { const bad = !i.checkValidity(); i.closest('.f').classList.toggle('is-err', bad); if (bad) ok = false; });
      if (!ok) { toast('Please fill in your name, email and project details.'); return; }
      const d = new FormData(form);
      const subject = `${d.get('type')} enquiry from ${d.get('name')}`;
      const body = `${d.get('msg')}\n\nBudget: ${d.get('budget')}\nReply to: ${d.get('email')}`;
      location.href = `mailto:${P.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      toast('Opening your email app…');
    });
    form.addEventListener('input', (e) => { const f = e.target.closest('.f.is-err'); if (f) f.classList.remove('is-err'); });
  }

  /* ---------- work filters ---------- */
  const fbtns = $$('#filters button');
  fbtns.forEach((b) => b.addEventListener('click', () => {
    fbtns.forEach((x) => x.classList.toggle('is-on', x === b));
    const f = b.dataset.f;
    const items = $$('#work [data-cat]');
    items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && !it.dataset.cat.split(' ').includes(f)));
    if (hasGsap && !reduced) gsap.fromTo(items.filter((i) => !i.classList.contains('is-hidden')), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: 'expo.out' });
    if (hasGsap) ScrollTrigger.refresh();
  }));

  /* ---------- Axelink console visual (real module names) ---------- */
  const cg = $('#consoleGrid');
  if (cg) {
    const mods = ['fingerprint', 'wappalyzer', 'headers', 'ssl_audit', 'ssl_deep', 'dns_audit', 'domain_audit', 'subdomains', 'performance', 'accessibility', 'seo', 'aeo', 'crawl', 'pageaudit', 'nvd', 'wayback', 'contacts', 'compare', 'ai_visibility', 'pitch_ai', 'dossier', 'report'];
    cg.innerHTML = mods.map((m) => `<div class="console__row"><b></b>${m}.py</div>`).join('');
    const rows = $$('.console__row', cg);
    let started = false;
    const run = () => {
      if (started) return; started = true;
      rows.forEach((r, i) => setTimeout(() => r.classList.add('is-on'), 120 + i * 110));
      setTimeout(() => $$('[data-cs]').forEach((s) => {
        const end = +s.dataset.cs, o = { v: 0 };
        if (hasGsap) gsap.to(o, { v: end, duration: 1.4, ease: 'power3.out', onUpdate: () => (s.textContent = Math.round(o.v)) }); else s.textContent = end;
      }), 120 + rows.length * 110);
    };
    new IntersectionObserver(([e], ob) => { if (e.isIntersecting) { run(); ob.disconnect(); } }, { threshold: 0.3 }).observe(cg);
  }

  /* ---------- split titles, reveals, scrub, counters ---------- */
  const heroSplits = [];
  $$('[data-split]').forEach((el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((p) => `<span class="line"><span>${p.trim()}</span></span>`).join('');
    const parts = $$('.line > span', el);
    if (!hasGsap || reduced) return;
    gsap.set(parts, { yPercent: 110 });
    if (el.closest('.hero, .cs-hero')) heroSplits.push(parts);
    else ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => gsap.to(parts, { yPercent: 0, duration: 1.2, stagger: 0.09, ease: 'expo.out' }) });
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));
  if (hasGsap && !reduced) $$('[data-scrub]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    gsap.to($$('.w', el), { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  });
  $$('[data-count]').forEach((el) => {
    const suf = el.dataset.suf || '';
    new IntersectionObserver(([e], ob) => {
      if (!e.isIntersecting) return; ob.disconnect();
      const end = +el.dataset.count, o = { v: 0 };
      if (hasGsap) gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v) + suf) }); else el.textContent = end + suf;
    }).observe(el);
  });

  /* ---------- cursor, magnetic, tilt ---------- */
  if (fine && !reduced) {
    const c = Object.assign(document.createElement('div'), { className: 'cursor' });
    const lab = Object.assign(document.createElement('div'), { className: 'cursor__label' });
    document.body.append(c, lab);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function loop() { cx += (x - cx) * 0.22; cy += (y - cy) * 0.22; c.style.transform = `translate(${cx}px,${cy}px)`; lab.style.transform = `translate(${cx + 18}px,${cy + 18}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', (e) => {
      const l = e.target.closest('[data-cursor]');
      c.classList.toggle('is-hover', !!e.target.closest('a, button, [data-cursor]'));
      lab.classList.toggle('is-on', !!l);
      if (l) lab.textContent = l.dataset.cursor;
    });
    if (hasGsap) {
      document.addEventListener('pointermove', (e) => {
        const m = e.target.closest && e.target.closest('.magnetic');
        if (m) { const r = m.getBoundingClientRect(); gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5 }); }
        const t = e.target.closest && e.target.closest('[data-tilt]');
        if (t) { const r = t.getBoundingClientRect(); gsap.to(t, { rotateY: ((e.clientX - r.left) / r.width - 0.5) * 12, rotateX: -((e.clientY - r.top) / r.height - 0.5) * 12, transformPerspective: 1000, duration: 0.6, ease: 'power2.out', overwrite: 'auto' }); }
      });
      document.addEventListener('pointerout', (e) => {
        const m = e.target.closest && e.target.closest('.magnetic');
        if (m && !m.contains(e.relatedTarget)) gsap.to(m, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' });
        const t = e.target.closest && e.target.closest('[data-tilt]');
        if (t && !t.contains(e.relatedTarget)) gsap.to(t, { rotateY: 0, rotateX: 0, duration: 1.1, ease: 'elastic.out(1,0.5)', overwrite: 'auto' });
      });
    }
  }

  /* ---------- loader → intro ---------- */
  const loader = $('#loader');
  const intro = () => {
    window.__ready = true;
    dispatchEvent(new Event('page:ready'));
    if (!hasGsap || reduced) return;
    heroSplits.forEach((parts, i) => gsap.to(parts, { yPercent: 0, duration: 1.4, stagger: 0.1, ease: 'expo.out', delay: 0.1 + i * 0.1 }));
    gsap.from('[data-hero]', { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', delay: 0.35 });
    gsap.from(nav, { y: -40, autoAlpha: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
  };
  if (loader) {
    let done = false;
    const finish = () => { if (done) return; done = true; $('#loaderBar').style.width = '100%'; setTimeout(() => { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 1000); intro(); }, 350); };
    requestAnimationFrame(() => ($('#loaderBar').style.width = '60%'));
    Promise.race([new Promise((r) => addEventListener('load', r, { once: true })), new Promise((r) => setTimeout(r, 2600))]).then(() => setTimeout(finish, 500));
  } else intro();
  addEventListener('load', () => hasGsap && ScrollTrigger.refresh());
})();
