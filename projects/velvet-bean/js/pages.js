/* =========================================================
   Velvet Bean · page-specific behaviour
   ========================================================= */
(function () {
  'use strict';
  const VB = window.VB;
  if (!VB) return;
  const { $, $$, toast, ICON, reduced, hasGsap } = VB;
  const page = document.body.dataset.page;
  const img = (n) => `assets/img/${n}.jpg`;
  const money = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');

  /* ================= HOME ================= */
  function home() {
    // pinned horizontal drinks with cards swinging in from 3D
    if (hasGsap && !reduced) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', () => {
        const track = $('.hs__track');
        const dist = () => Math.max(0, track.scrollWidth - innerWidth);
        const tween = gsap.to(track, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: '.hs', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1, onUpdate: (s) => gsap.set('.hs__progress i', { scaleX: s.progress }) },
        });
        $$('.drink', track).forEach((card) => {
          gsap.fromTo(card, { rotateY: -28, z: -160, opacity: 0.35 }, { rotateY: 0, z: 0, opacity: 1, ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 105%', end: 'left 55%', scrub: true } });
          const im = $('img', card);
          if (im) gsap.fromTo(im, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
        });
      });
    }
    // testimonials
    const qs = $$('#quotes .quote'), dots = $$('#qnav button');
    let qi = 0, timer;
    const show = (i) => {
      if (i === qi) return;
      if (hasGsap) {
        gsap.to(qs[qi], { autoAlpha: 0, y: -20, duration: 0.5, ease: 'power2.in' });
        gsap.fromTo(qs[i], { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.9, delay: 0.4, ease: 'power3.out' });
      } else { qs[qi].classList.remove('is-on'); qs[i].classList.add('is-on'); }
      dots[qi].classList.remove('is-on'); dots[i].classList.add('is-on');
      qi = i;
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => show((qi + 1) % qs.length), 6500); };
    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); auto(); }));
    auto();
  }

  /* ================= MENU ================= */
  const ITEMS = [
    { c: 'espresso', n: 'Flat White', d: 'Double ristretto, velvety whole milk, rosetta.', p: 4.75, i: 'latte-pour', k: '150 kcal', t: ['hot'], v: 1, g: 1 },
    { c: 'espresso', n: 'Velvet Latte', d: 'House espresso, burnt-sugar syrup, oat milk.', p: 5.5, i: 'espresso-bar', k: '190 kcal', t: [], v: 1, g: 1 },
    { c: 'espresso', n: 'Cortado Noir', d: 'Equal parts espresso and silky steamed milk.', p: 4.5, i: 'latte-pour', k: '90 kcal', t: [], v: 1, g: 1 },
    { c: 'cold', n: 'Velvet Iced Latte', d: 'Double ristretto over ice, oat milk, caramel.', p: 7.5, i: 'iced-splash', k: '210 kcal', t: ['hot'], v: 1, g: 1 },
    { c: 'cold', n: '36-Hour Cold Brew', d: 'Ethiopia Guji, steeped cold, swirled with cream.', p: 6.5, i: 'iced-latte', k: '60 kcal', t: [], v: 1, g: 1 },
    { c: 'cold', n: 'Espresso Tonic Duo', d: 'Yuzu tonic, lemon, a floated double shot.', p: 7, i: 'iced-duo', k: '80 kcal', t: [], v: 1, g: 1 },
    { c: 'cold', n: 'Salted Caramel Cloud', d: 'Blended espresso, house caramel, Maldon salt.', p: 8.5, i: 'caramel-frappe', k: '390 kcal', t: ['hot'], v: 0, g: 1 },
    { c: 'cold', n: 'Matcha Cloud', d: 'Uji matcha, white chocolate, sponge crumb.', p: 8, i: 'matcha-cloud', k: '340 kcal', t: [], v: 0, g: 0 },
    { c: 'cacao', n: '72% Chocolate Shake', d: 'House dark chocolate, espresso, cacao nibs.', p: 9, i: 'choc-shake', k: '420 kcal', t: ['hot'], v: 1, g: 1 },
    { c: 'cacao', n: 'Molten Hot Cacao', d: 'Poured-to-order ganache, steamed milk, sea salt.', p: 6.5, i: 'choc-drip', k: '310 kcal', t: [], v: 1, g: 1 },
    { c: 'cacao', n: 'Atelier Truffle Box', d: '16 hand-finished truffles, chef’s daily selection.', p: 48, i: 'praline-case', k: 'Box of 16', t: [], v: 0, g: 1 },
    { c: 'cacao', n: 'Bonbon Six', d: 'Six crisp-rice bonbons with salted peanut ganache.', p: 22, i: 'bonbon-box', k: 'Box of 6', t: [], v: 0, g: 0 },
    { c: 'cacao', n: 'Single-Estate Bar', d: '85% Madagascar, red fruit and cocoa dust.', p: 12, i: 'dark-stack', k: '70 g bar', t: [], v: 1, g: 1 },
    { c: 'dessert', n: 'Ganache Brownie', d: 'Fudgy brownie, warm ganache, strawberries.', p: 9, i: 'brownie', k: '480 kcal', t: ['hot'], v: 0, g: 0 },
    { c: 'dessert', n: 'Double Cacao Cookie', d: 'Dark dough, 70% chunks, flaky salt.', p: 5, i: 'cookies', k: '360 kcal', t: [], v: 0, g: 0 },
    { c: 'dessert', n: 'Midnight Sundae', d: 'Cacao gelato, brownie crumb, hot fudge, cherry.', p: 11, i: 'sundae', k: '560 kcal', t: [], v: 0, g: 1 },
    { c: 'dessert', n: 'Dipped Soft Serve', d: 'Vanilla bean, chocolate shell, biscoff crumb.', p: 7, i: 'dipped-cone', k: '330 kcal', t: [], v: 0, g: 0 },
    { c: 'dessert', n: 'Chocolatier’s Tower', d: 'Layered sponge, molten centre, cocoa truffles.', p: 16, i: 'chocolatiers', k: 'Serves 2', t: ['hot'], v: 0, g: 0 },
  ];
  function menu() {
    const grid = $('#mgrid'), tabs = $$('#tabs button'), pill = $('#tabPill');
    let cat = 'all';
    const movePill = (b) => { pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`; };
    const draw = () => {
      const vegan = $('#fVegan').checked, gf = $('#fGf').checked;
      const list = ITEMS.filter((x) => (cat === 'all' || x.c === cat) && (!vegan || x.v) && (!gf || x.g));
      grid.innerHTML = list.length ? list.map((x, i) => `
        <article class="mcard" data-tilt data-cursor="Order">
          <div class="mcard__img"><img src="${img(x.i)}" alt="${x.n}" loading="lazy" /><div class="mcard__tags">${x.t.includes('hot') ? '<span class="hot">Bestseller</span>' : ''}${x.v ? '<span>Vegan option</span>' : ''}${x.g ? '<span>GF</span>' : ''}</div></div>
          <div class="mcard__body">
            <div class="mcard__row"><h3>${x.n}</h3><span class="mcard__price">${money(x.p)}</span></div>
            <p>${x.d}</p>
            <div class="mcard__meta"><span>${x.k}</span><button class="mcard__add" data-add="${i}" aria-label="Add ${x.n}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>
          </div>
        </article>`).join('') : '<p class="mempty">Nothing matches those filters yet. Try removing one.</p>';
      $$('[data-add]', grid).forEach((b) => b.addEventListener('click', () => toast(`${list[+b.dataset.add].n} added to your pickup order.`)));
      if (hasGsap && !reduced) gsap.fromTo($$('.mcard', grid), { y: 60, rotateX: -18, autoAlpha: 0, transformPerspective: 1200 }, { y: 0, rotateX: 0, autoAlpha: 1, duration: 1, stagger: 0.06, ease: 'expo.out', clearProps: 'transform' });
      if (hasGsap) ScrollTrigger.refresh();
    };
    tabs.forEach((b) => b.addEventListener('click', () => {
      cat = b.dataset.cat;
      tabs.forEach((x) => x.classList.toggle('is-on', x === b));
      movePill(b);
      draw();
      const lenis = VB.lenis();
      const top = $('.menu-bar').getBoundingClientRect().top + scrollY - 70;
      if (scrollY > top + 10) lenis ? lenis.scrollTo(top, { duration: 1 }) : scrollTo({ top, behavior: 'smooth' });
    }));
    $('#fVegan').addEventListener('change', draw);
    $('#fGf').addEventListener('change', draw);
    requestAnimationFrame(() => movePill(tabs[0]));
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => movePill($('#tabs button.is-on')));
    addEventListener('resize', () => movePill($('#tabs button.is-on')));
    VB.onReady(draw);

    // drink builder
    const f = $('#opts');
    const C = {
      base: { espresso: ['#3a1d0e', 4.5, 'Espresso'], coldbrew: ['#241208', 5, 'Cold Brew'], matcha: ['#6f8c3a', 5.5, 'Matcha'], cacao: ['#4a2412', 5.5, 'Cacao'] },
      milk: { whole: ['#efe3d0', 0, ''], oat: ['#e5cfa8', 0.75, 'Oat'], almond: ['#ead9c1', 0.75, 'Almond'], none: ['transparent', 0, ''] },
      syrup: { none: ['transparent', 0, ''], caramel: ['#c98a47', 1, 'Caramel'], vanilla: ['#f0dfae', 1, 'Vanilla'], choc: ['#2d160b', 1.5, 'Ganache'] },
      size: { 8: [250, 0], 12: [300, 0.5], 16: [340, 1] },
    };
    const updateCup = () => {
      const d = Object.fromEntries(new FormData(f));
      const [bc, bp, bn] = C.base[d.base], [mc, mp, mn] = C.milk[d.milk], [sc, spr, sn] = C.syrup[d.syrup], [h, szp] = C.size[d.size];
      const iced = d.temp === 'iced', noMilk = d.milk === 'none';
      const glass = $('#glass');
      glass.style.height = (innerWidth < 600 ? h * 0.82 : h) + 'px';
      glass.style.borderRadius = iced ? '8px 8px 26px 26px' : '10px 10px 46px 46px';
      const base = noMilk ? 70 : 38, milk = noMilk ? 0 : 36, syrup = d.syrup === 'none' ? 0 : 8, foam = !iced && !noMilk ? 10 : 0;
      const L = (id, bottom, height, color) => { const el = $(id); el.style.bottom = bottom + '%'; el.style.height = height + '%'; if (color) el.style.background = color; };
      L('#lSyrup', 0, syrup, sc);
      L('#lBase', syrup, base, `linear-gradient(180deg, ${bc}, ${bc}ee)`);
      L('#lMilk', syrup + base, milk, `linear-gradient(180deg, ${mc}, ${bc}88)`);
      L('#lFoam', syrup + base + milk, foam);
      $('#cupviz').classList.toggle('is-iced', iced);
      const total = bp + mp + spr + szp;
      $('#price').textContent = money(total);
      const drink = d.base === 'espresso' ? (noMilk ? 'Americano' : 'Latte') : bn + (noMilk ? '' : ' Latte');
      $('#cupName').textContent = [d.size + ' oz', iced ? 'Iced' : '', mn, sn, drink].filter(Boolean).join(' ');
      return { total, name: $('#cupName').textContent };
    };
    f.addEventListener('change', updateCup);
    f.addEventListener('submit', (e) => { e.preventDefault(); const r = updateCup(); toast(`${r.name} (${money(r.total)}) ordered. Ready in about 6 minutes.`); });
    updateCup();
  }

  /* ================= EXPERIENCES ================= */
  function experiences() {
    const imgs = $$('#svcFrame img'), items = $$('.svc__item'), num = $('#svcNum');
    const setSvc = (i) => {
      imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
      items.forEach((it, k) => it.classList.toggle('is-on', k === i));
      num.textContent = String(i + 1).padStart(2, '0');
    };
    if (hasGsap) items.forEach((it, i) => ScrollTrigger.create({ trigger: it, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && setSvc(i) }));
    // quote estimator
    const q = $('#qtool'), out = { v: 0 };
    const calc = () => {
      const d = new FormData(q);
      const guests = +d.get('guests'), hours = +d.get('hours'), pkg = +d.get('pkg');
      const addons = d.getAll('add').reduce((s, v) => s + +v, 0);
      const base = { 45: 2, 75: 3, 120: 4 }[pkg];
      const perGuest = pkg + addons + Math.max(0, hours - base) * 12;
      const total = guests * perGuest;
      $('#qGuestsV').textContent = guests; $('#qHoursV').textContent = hours;
      $$('input[type=range]', q).forEach((r) => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'));
      $('#qNote').textContent = `${guests} guests · ${hours} hours · ${{ 45: 'Espresso', 75: 'Velvet', 120: 'Atelier' }[pkg]}${addons ? ' · ' + d.getAll('add').length + ' add-on' + (d.getAll('add').length > 1 ? 's' : '') : ''}`;
      const fmt = () => ($('#qTotal').textContent = '$' + Math.round(out.v).toLocaleString('en-US'));
      if (hasGsap) gsap.to(out, { v: total, duration: 0.8, ease: 'power3.out', onUpdate: fmt }); else { out.v = total; fmt(); }
    };
    q.addEventListener('input', calc);
    q.addEventListener('change', calc);
    calc();
    // one FAQ open at a time
    $$('.faq details').forEach((d) => d.addEventListener('toggle', () => { if (d.open) $$('.faq details').forEach((o) => o !== d && (o.open = false)); if (hasGsap) ScrollTrigger.refresh(); }));
  }

  /* ================= STORY ================= */
  const GALLERY = [
    ['interior', 'The lounge'], ['latte-pour', 'Morning pour'], ['praline-case', 'Atelier selection'], ['iced-splash', 'Velvet iced latte'], ['chocolatiers', 'Chocolatier’s tower'],
    ['storefront', 'Wythe Ave at dusk'], ['brownie', 'Ganache brownie'], ['espresso-bar', 'The machine'], ['matcha-cloud', 'Matcha cloud'], ['sundae', 'Midnight sundae'],
    ['bonbon-box', 'Bonbon six'], ['caramel-frappe', 'Salted caramel cloud'], ['dark-stack', '85% Madagascar'], ['iced-latte', 'Cold brew'], ['choc-drip', 'Molten cacao'], ['cookies', 'Double cacao cookies'],
  ];
  function story() {
    if (hasGsap && !reduced) gsap.to('.tl__line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '#tl', start: 'top 70%', end: 'bottom 60%', scrub: true } });
    const g = $('#gallery');
    g.innerHTML = GALLERY.map(([n, c], i) => `<button data-g="${i}" data-reveal style="--d:${(i % 4) * 70}ms" data-cursor="View"><img src="${img(n)}" alt="${c}" loading="lazy" /></button>`).join('');
    VB.bindReveal(g);
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox__x" aria-label="Close">✕</button><button class="lightbox__nav lightbox__prev" aria-label="Previous">‹</button><img alt="" /><button class="lightbox__nav lightbox__next" aria-label="Next">›</button><p></p>';
    document.body.appendChild(lb);
    let li = 0;
    const draw = () => { $('img', lb).src = img(GALLERY[li][0]); $('img', lb).alt = GALLERY[li][1]; $('p', lb).textContent = `${GALLERY[li][1]} · ${li + 1} / ${GALLERY.length}`; };
    const open = (i) => { li = i; draw(); lb.classList.add('is-on'); VB.lock(true); };
    const close = () => { lb.classList.remove('is-on'); VB.lock(false); };
    const step = (d) => { li = (li + d + GALLERY.length) % GALLERY.length; draw(); };
    g.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) open(+b.dataset.g); });
    $('.lightbox__x', lb).addEventListener('click', close);
    $('.lightbox__prev', lb).addEventListener('click', () => step(-1));
    $('.lightbox__next', lb).addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    addEventListener('keydown', (e) => { if (!lb.classList.contains('is-on')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  }

  /* ================= CONTACT ================= */
  function contact() {
    const HOURS = [[8, 20], [7, 21], [7, 21], [7, 21], [7, 21], [7, 23], [8, 23]];
    const tabsEl = $('#ftabs'), book = $('#bookForm'), enq = $('#enqForm'), ticket = $('#ticket');
    $$('button', tabsEl).forEach((b) => b.addEventListener('click', () => {
      const two = b.dataset.t === '2';
      tabsEl.classList.toggle('is-2', two);
      $$('button', tabsEl).forEach((x) => x.classList.toggle('is-on', x === b));
      book.classList.toggle('is-on', !two); enq.classList.toggle('is-on', two);
    }));
    // days + slots
    const today = new Date();
    const days = $('#days');
    days.innerHTML = Array.from({ length: 7 }, (_, k) => {
      const d = new Date(today); d.setDate(today.getDate() + k);
      return `<label><input type="radio" name="day" value="${d.toDateString()}" data-dow="${d.getDay()}" data-today="${k === 0 ? 1 : 0}" ${k ? '' : 'checked'} /><span><small>${k === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-US', { month: 'short' })}</small></span></label>`;
    }).join('');
    const drawSlots = () => {
      const sel = $('input[name=day]:checked', days);
      const [o, c] = HOURS[+sel.dataset.dow];
      const nowH = today.getHours() + today.getMinutes() / 60;
      const slots = [];
      for (let h = o + 0.5; h <= c - 1; h += 1.5) slots.push(h);
      let firstFree = true;
      $('#slots').innerHTML = slots.map((h) => {
        const past = sel.dataset.today === '1' && h <= nowH + 0.5;
        const label = `${((Math.floor(h) + 11) % 12) + 1}:${h % 1 ? '30' : '00'} ${h < 12 ? 'am' : 'pm'}`;
        const checked = !past && firstFree; if (checked) firstFree = false;
        return `<label><input type="radio" name="time" value="${label}" ${past ? 'disabled' : ''} ${checked ? 'checked' : ''} /><span>${label}</span></label>`;
      }).join('') || '<span class="fnote">Fully booked, try another day.</span>';
      if (firstFree && sel.dataset.today === '1') { const next = $$('input[name=day]', days)[1]; next.checked = true; drawSlots(); }
    };
    days.addEventListener('change', drawSlots);
    drawSlots();
    let guests = 2;
    $$('[data-step]', book).forEach((b) => b.addEventListener('click', () => {
      guests = Math.max(1, Math.min(8, guests + +b.dataset.step));
      $('#guests').textContent = guests;
      if (hasGsap) gsap.fromTo('#guests', { scale: 1.4 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      if (guests === 8) toast('For 9 or more guests, use the event enquiry tab.');
    }));
    const validate = (form) => {
      let ok = true;
      $$('[required]', form).forEach((i) => { const bad = !i.checkValidity(); i.closest('.fl').classList.toggle('is-err', bad); if (bad) ok = false; });
      if (!ok) { toast('Please fill in the highlighted fields.'); if (hasGsap) gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' }); }
      return ok;
    };
    document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('.fl.is-err'); if (f) f.classList.remove('is-err'); });
    const showTicket = (title, sub, stub) => {
      $('#tTitle').textContent = title; $('#tSub').textContent = sub; $('#tStub').innerHTML = stub;
      ticket.classList.add('is-on');
    };
    book.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(book)) return;
      const d = new FormData(book);
      const time = d.get('time');
      if (!time) { toast('Please pick a time.'); return; }
      const code = 'VB-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const day = new Date(d.get('day')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      showTicket(`See you soon, ${String(d.get('name')).trim().split(' ')[0]}.`, 'Your table is reserved. A confirmation text is on its way.', `<b>${day} · ${time}</b><span>${guests} guest${guests > 1 ? 's' : ''} · ${d.get('seat')} · ${d.get('occasion')}</span><span>Confirmation ${code}</span>`);
    });
    enq.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(enq)) return;
      const d = new FormData(enq);
      showTicket('Enquiry received.', 'Our events team will call you within one business day.', `<b>${d.get('type')}</b><span>${new Date(d.get('date') + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>`);
    });
    $('#tAgain').addEventListener('click', () => { ticket.classList.remove('is-on'); book.reset(); enq.reset(); guests = 2; $('#guests').textContent = 2; drawSlots(); });
    const dateIn = $('input[name=date]', enq);
    dateIn.min = today.toISOString().slice(0, 10);
  }

  ({ index: home, menu, experiences, story, contact }[page] || (() => {}))();
})();
