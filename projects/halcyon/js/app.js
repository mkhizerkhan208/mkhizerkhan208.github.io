/* =========================================================
   HALCYON Estates · app
   Hash-routed so it runs from disk or any static host.
   Signature piece: a scroll-driven "film tour" that moves a
   virtual camera through the listing photos on a canvas.
   ========================================================= */
(function () {
  'use strict';
  const H = window.HALCYON;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const app = $('#app');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = (n) => `assets/img/${n}.jpg`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const usd = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const short = (n) => (n >= 1e6 ? '$' + (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 2).replace(/\.?0+$/, '') + 'M' : '$' + Math.round(n / 1e3) + 'K');
  const byId = (id) => H.listings.find((l) => l.id === id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('halcyon:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('halcyon:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  let saved = store.get('saved', []);
  const syncSaved = () => { $('#savedCount').textContent = saved.length; $('#savedCount').classList.toggle('is-zero', !saved.length); };

  const ic = {
    bed: '<svg viewBox="0 0 24 24"><path d="M3 18V8M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5M7 11.5a1.5 1.5 0 1 0 0-.01"/></svg>',
    bath: '<svg viewBox="0 0 24 24"><path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2"/></svg>',
    area: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 9h5V4M20 15h-5v5"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
  };

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('is-on'), 3200);
  }

  /* ---------- listing card ---------- */
  const card = (l, i = 0) => `
    <article class="lcard" data-reveal style="--d:${(i % 3) * 90}ms">
      <a href="#/home/${l.id}" class="lcard__media">
        <img src="${img(l.img)}" alt="${esc(l.address)}, ${esc(l.city)}" loading="lazy" />
        <span class="status status--${l.status.toLowerCase().replace(/\s/g, '')}">${l.status}</span>
        ${l.tour ? `<span class="filmtag">${ic.play} Film tour</span>` : ''}
      </a>
      <button class="save ${saved.includes(l.id) ? 'is-on' : ''}" data-save="${l.id}" aria-label="Save ${esc(l.address)}">${ic.heart}</button>
      <div class="lcard__body">
        <div class="lcard__price">${usd(l.price)}</div>
        <a href="#/home/${l.id}" class="lcard__addr">${esc(l.address)}</a>
        <p class="lcard__city">${ic.pin}${esc(l.city)}, CA</p>
        <ul class="facts"><li>${ic.bed}${l.beds} bd</li><li>${ic.bath}${l.baths} ba</li><li>${ic.area}${l.sqft.toLocaleString()} sq ft</li></ul>
      </div>
    </article>`;

  /* ---------- router ---------- */
  let route = {};
  let cleanup = [];
  const views = {};
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    return { name: parts[0] || 'home', id: parts[1], q: new URLSearchParams(qs || '') };
  }
  function render(soft) {
    route = parse();
    cleanup.forEach((f) => f());
    cleanup = [];
    const v = views[route.name] || views.notfound;
    const swap = () => {
      app.innerHTML = v(route);
      v.after && v.after(route);
      bindReveal();
      document.body.dataset.route = route.name;
      $$('.nav a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#/' + (route.name === 'homes' ? 'homes' : '')));
      onScroll();
    };
    if (soft || !window.gsap || reduced) { swap(); return; }
    gsap.to(app, { autoAlpha: 0, duration: 0.25, onComplete: () => { swap(); lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0); gsap.to(app, { autoAlpha: 1, duration: 0.5 }); } });
  }
  addEventListener('hashchange', () => { document.body.classList.remove('menu-open'); render(); });

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const bindReveal = () => $$('[data-reveal]:not(.is-in)', app).forEach((el) => io.observe(el));

  /* ================= HOME ================= */
  views.home = () => {
    const f = byId('cliffside-malibu');
    const cities = [...new Set(H.listings.map((l) => l.city))].sort();
    return `
    <section class="hero" id="hero">
      <div class="hero__slides">
        ${['malibu-cliff', 'bel-air-pool', 'laguna-sunset'].map((n, i) => `<div class="hero__slide ${i ? '' : 'is-on'}"><img src="${img(n)}" alt="" /></div>`).join('')}
      </div>
      <div class="hero__shade"></div>
      <div class="wrap hero__inner">
        <p class="kicker kicker--light">California luxury real estate · Since 2008</p>
        <h1 class="hero__title"><span class="ln"><span>Where California</span></span><span class="ln"><span><em>comes home.</em></span></span></h1>
        <p class="hero__sub">Oceanfront estates, canyon moderns and desert retreats, represented with discretion and marketed like film.</p>
        <form class="search" id="heroSearch">
          <label><span>Location</span><select name="city"><option value="">All of California</option>${cities.map((c) => `<option>${c}</option>`).join('')}</select></label>
          <label><span>Home type</span><select name="type"><option value="">Any style</option><option>Modern</option><option>Coastal</option></select></label>
          <label><span>Price</span><select name="min"><option value="">Any price</option><option value="3000000">$3M+</option><option value="5000000">$5M+</option><option value="10000000">$10M+</option></select></label>
          <label><span>Bedrooms</span><select name="beds"><option value="">Any</option><option value="4">4+</option><option value="5">5+</option><option value="6">6+</option></select></label>
          <button class="btn btn--gold">Search homes ${ic.arrow}</button>
        </form>
      </div>
      <a href="#/home/${f.id}" class="now">
        <span class="now__dot"></span><span>Now showing</span><b>${f.address}, ${f.city}</b><em>${short(f.price)}</em>
      </a>
      <div class="hero__scroll" data-jump="tour"><span></span>Scroll for the film tour</div>
    </section>

    <section class="stats">
      <div class="wrap stats__grid">
        <div data-reveal><b data-count="2.4" data-dec="1" data-pre="$" data-suf="B">0</b><span>Sold since 2008</span></div>
        <div data-reveal style="--d:90ms"><b data-count="640" data-suf="+">0</b><span>Homes represented</span></div>
        <div data-reveal style="--d:180ms"><b data-count="11" data-suf=" days">0</b><span>Median time to offer</span></div>
        <div data-reveal style="--d:270ms"><b data-count="103" data-suf="%">0</b><span>Average sale-to-list</span></div>
      </div>
    </section>

    <section class="tour" id="tour" style="--scenes:${H.tour.length}">
      <div class="tour__sticky">
        <canvas id="tourCanvas" aria-label="Scroll-driven film tour of 21 Cliffside Drive, Malibu"></canvas>
        <div class="tour__grain"></div>
        <div class="tour__bars"><i></i><i></i></div>
        <div class="tour__top">
          <div class="tour__rec"><span class="rec"></span>Film tour · ${f.address}, ${f.city}</div>
          <div class="tour__time" id="tourTime">00:00 / 01:45</div>
        </div>
        <div class="tour__intro" id="tourIntro">
          <p class="kicker kicker--light">Featured listing · ${short(f.price)}</p>
          <h2 class="h2 h2--light">Take the <em>tour.</em></h2>
          <p>Keep scrolling to walk through ${f.address} from the drive to the sunset terrace.</p>
          <div class="mouse"><span></span></div>
        </div>
        <div class="tour__cap" id="tourCap">
          <p class="tour__room" id="tourRoom"></p>
          <h3 class="tour__title" id="tourTitle"></h3>
          <p class="tour__copy" id="tourCopy"></p>
          <ul class="tour__stats" id="tourStats"></ul>
        </div>
        <div class="plan" aria-hidden="true">
          <p>Floor plan</p>
          <svg viewBox="0 0 200 150" id="plan">
            <rect x="4" y="96" width="60" height="50" data-p="entry" /><text x="34" y="124">Entry</text>
            <rect x="64" y="96" width="80" height="50" data-p="living" /><text x="104" y="124">Great room</text>
            <rect x="64" y="52" width="80" height="44" data-p="dining" /><text x="104" y="78">Dining</text>
            <rect x="4" y="4" width="60" height="92" data-p="suite" /><text x="34" y="54">Suite</text>
            <rect x="144" y="52" width="52" height="94" data-p="pool" /><text x="170" y="102">Pool</text>
            <rect x="64" y="4" width="80" height="48" data-p="garden" /><text x="104" y="32">Fire lounge</text>
            <rect x="144" y="4" width="52" height="48" data-p="terrace" /><text x="170" y="32">Terrace</text>
          </svg>
        </div>
        <div class="chapters" id="chapters">
          ${H.tour.map((s, i) => `<button data-ch="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${s.room}</button>`).join('')}
          <div class="chapters__bar"><i id="tourBar"></i></div>
        </div>
        <div class="tour__end" id="tourEnd">
          <p class="kicker kicker--light">${f.beds} beds · ${f.baths} baths · ${f.sqft.toLocaleString()} sq ft</p>
          <h2 class="h2 h2--light">${f.address}<br /><em>${f.city}, California</em></h2>
          <div class="tour__price">${usd(f.price)}</div>
          <div class="tour__cta"><a href="#/home/${f.id}" class="btn btn--gold">View the listing ${ic.arrow}</a><a href="#/#contact" data-jump="contact" class="btn btn--line">Book a private showing</a></div>
        </div>
      </div>
    </section>

    <section class="section" id="featured">
      <div class="wrap">
        <div class="sec-head" data-reveal>
          <div><p class="kicker">Exclusive listings</p><h2 class="h2">Homes worth <em>crossing town for</em></h2></div>
          <div class="pills" id="areaPills"><button class="is-on" data-a="">All</button><button data-a="Malibu">Malibu</button><button data-a="Los Angeles">Los Angeles</button><button data-a="Orange County">Orange County</button><button data-a="Santa Barbara">Santa Barbara</button></div>
        </div>
        <div class="lgrid" id="featGrid"></div>
        <div class="center"><a href="#/homes" class="btn btn--dark">View all ${H.listings.length} homes ${ic.arrow}</a></div>
      </div>
    </section>

    <section class="sell section section--dark" id="sell">
      <div class="wrap sell__grid">
        <div class="sell__copy" data-reveal>
          <p class="kicker kicker--light">Selling with HALCYON</p>
          <h2 class="h2 h2--light">Your home,<br /><em>marketed like cinema.</em></h2>
          <p>Every listing gets an architectural photographer, a scroll-driven film tour, a private preview for our buyer network and a global campaign. That’s how we average 103% of list price.</p>
          <ol class="steps">
            <li><b>01</b><div><h4>Private valuation</h4><p>Comparable sales, micro-market trends and a pricing strategy within 48 hours.</p></div></li>
            <li><b>02</b><div><h4>Film & staging</h4><p>Architectural photography, twilight shoots and a cinematic web tour.</p></div></li>
            <li><b>03</b><div><h4>Launch & negotiate</h4><p>Off-market preview, global launch and hard-nosed negotiation.</p></div></li>
          </ol>
        </div>
        <form class="val" id="valuation" data-reveal style="--d:120ms">
          <div class="val__head"><h3>Instant home estimate</h3><span>Free · 30 seconds</span></div>
          <label class="f"><span>Neighborhood</span><select name="area">${H.neighborhoods.map((n) => `<option>${n.name}</option>`).join('')}</select></label>
          <div class="f2">
            <label class="f"><span>Living area (sq ft)</span><input name="sqft" type="number" min="800" max="20000" value="4200" /></label>
            <label class="f"><span>Bedrooms</span><select name="beds"><option>3</option><option selected>4</option><option>5</option><option>6+</option></select></label>
          </div>
          <label class="f"><span>Condition</span><select name="cond"><option value="0.92">Needs updating</option><option value="1" selected>Good</option><option value="1.12">Newly built / remodeled</option></select></label>
          <div class="toggles">
            <label class="tg"><input type="checkbox" name="view" /><span></span>Ocean or canyon view</label>
            <label class="tg"><input type="checkbox" name="pool" checked /><span></span>Pool</label>
          </div>
          <div class="val__out">
            <small>Estimated market value</small>
            <b id="valOut">$0</b>
            <div class="val__range"><span id="valLow"></span><i><em></em></i><span id="valHigh"></span></div>
          </div>
          <a href="#/#contact" data-jump="contact" class="btn btn--gold btn--block">Get a full valuation from an agent</a>
          <p class="fine">Indicative only, based on demo neighborhood medians.</p>
        </form>
      </div>
    </section>

    <section class="section" id="areas">
      <div class="wrap">
        <div class="sec-head" data-reveal><div><p class="kicker">Neighborhoods</p><h2 class="h2">Know the coast <em>block by block</em></h2></div></div>
        <div class="areas">
          ${H.neighborhoods.map((n, i) => `
            <a href="#/homes?city=${encodeURIComponent(n.name)}" class="area area--${i}" data-reveal style="--d:${(i % 3) * 80}ms">
              <img src="${img(n.img)}" alt="${n.name}" loading="lazy" />
              <div><h3>${n.name}</h3><p>${n.note}</p><dl><dt>Median</dt><dd>${short(n.median)}</dd><dt>Active</dt><dd>${n.homes} homes</dd></dl></div>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <section class="section section--sand" id="team">
      <div class="wrap">
        <div class="sec-head" data-reveal><div><p class="kicker">The partners</p><h2 class="h2">Advisors, <em>not salespeople</em></h2></div><p class="muted sec-head__note">Four partners, $3B+ in career sales and a combined 70 years on the California coast.</p></div>
        <div class="team">
          ${H.agents.map((a, i) => `
            <article class="agent" data-reveal style="--d:${i * 80}ms">
              <div class="agent__mono" style="--h:${[28, 200, 350, 150][i]}"><span>${a.name.split(' ').map((w) => w[0]).join('')}</span></div>
              <h3>${a.name}</h3><p class="agent__role">${a.role}</p>
              <dl><dt>Focus</dt><dd>${a.area}</dd><dt>Career sales</dt><dd>${a.sales}</dd></dl>
              <div class="agent__cta"><a href="tel:${a.phone.replace(/\D/g, '')}" class="icon-btn" aria-label="Call ${a.name}">${ic.phone}</a><a href="#/#contact" data-jump="contact" class="icon-btn" aria-label="Email ${a.name}">${ic.mail}</a></div>
            </article>`).join('')}
        </div>
      </div>
    </section>

    <section class="section quotes">
      <div class="wrap">
        <p class="kicker" data-reveal>Client stories (sample)</p>
        <div class="quotes__slider" id="quotes">
          ${H.reviews.map((r, i) => `<blockquote class="${i ? '' : 'is-on'}"><p>“${r.text}”</p><cite>${r.name} · ${r.where}</cite></blockquote>`).join('')}
        </div>
        <div class="quotes__dots" id="qDots">${H.reviews.map((_, i) => `<button class="${i ? '' : 'is-on'}" aria-label="Story ${i + 1}"></button>`).join('')}</div>
      </div>
    </section>

    <section class="section section--tint" id="journal">
      <div class="wrap">
        <div class="sec-head" data-reveal><div><p class="kicker">The Journal</p><h2 class="h2">Market intelligence, <em>in plain English</em></h2></div></div>
        <div class="journal">
          ${H.journal.map((j, i) => `<article class="post" data-reveal style="--d:${i * 90}ms"><div class="post__img"><img src="${img(j.img)}" alt="" loading="lazy" /></div><p class="post__tag">${j.tag} · ${j.mins} min read</p><h3>${j.title}</h3><span class="link">Read article ${ic.arrow}</span></article>`).join('')}
        </div>
      </div>
    </section>

    <section class="contact section section--dark" id="contact">
      <div class="wrap contact__grid">
        <div data-reveal>
          <p class="kicker kicker--light">Private showings</p>
          <h2 class="h2 h2--light">See it <em>in person.</em></h2>
          <p class="contact__lead">Tell us what you’re looking for. A partner will call you within the hour, seven days a week.</p>
          <ul class="contact__info"><li>${ic.phone}<a href="tel:+13105550118">(310) 555-0118</a></li><li>${ic.mail}<a href="mailto:hello@halcyon.estate">hello@halcyon.estate</a></li><li>${ic.pin}22815 Pacific Coast Hwy, Malibu</li></ul>
        </div>
        <form class="cform" id="contactForm" novalidate data-reveal style="--d:120ms">
          <div class="seg" role="radiogroup"><label><input type="radio" name="int" value="Buying" checked /><span>Buying</span></label><label><input type="radio" name="int" value="Selling" /><span>Selling</span></label><label><input type="radio" name="int" value="Both" /><span>Both</span></label></div>
          <div class="f2"><label class="f"><span>Full name</span><input name="name" required /></label><label class="f"><span>Phone</span><input name="phone" type="tel" required /></label></div>
          <label class="f"><span>Email</span><input name="email" type="email" required /></label>
          <label class="f"><span>Home of interest</span><select name="home"><option value="">Not sure yet</option>${H.listings.filter((l) => l.status !== 'Sold').map((l) => `<option>${l.address}, ${l.city}</option>`).join('')}</select></label>
          <div class="f"><span>Preferred day</span><div class="days" id="days"></div></div>
          <div class="f"><span>Time</span><div class="slots">${['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM'].map((t, i) => `<label><input type="radio" name="time" value="${t}" ${i ? '' : 'checked'} /><span>${t}</span></label>`).join('')}</div></div>
          <button class="btn btn--gold btn--block">Request showing ${ic.arrow}</button>
          <p class="fine">Demo form: nothing is sent.</p>
        </form>
      </div>
    </section>`;
  };
  views.home.after = () => {
    // hero slideshow
    const slides = $$('.hero__slide');
    let si = 0;
    const timer = setInterval(() => { slides[si].classList.remove('is-on'); si = (si + 1) % slides.length; slides[si].classList.add('is-on'); }, 7000);
    cleanup.push(() => clearInterval(timer));
    if (window.gsap && !reduced) {
      gsap.from('.hero__title .ln > span', { yPercent: 110, duration: 1.4, stagger: 0.14, ease: 'expo.out', delay: 0.2 });
      gsap.from('.hero .kicker, .hero__sub, .search, .now', { y: 30, autoAlpha: 0, duration: 1.1, stagger: 0.1, ease: 'power3.out', delay: 0.45 });
    }
    $('#heroSearch').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new URLSearchParams([...new FormData(e.target)].filter(([, v]) => v));
      location.hash = '#/homes' + (q.toString() ? '?' + q : '');
    });
    // featured with area pills
    const drawFeat = (area) => {
      const list = H.listings.filter((l) => (!area || l.area === area) && l.status !== 'Sold').slice(0, 6);
      $('#featGrid').innerHTML = list.map(card).join('');
      bindReveal();
    };
    drawFeat('');
    $('#areaPills').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('#areaPills button').forEach((x) => x.classList.toggle('is-on', x === b)); drawFeat(b.dataset.a); });
    // counters
    $$('[data-count]').forEach((el) => {
      const o = { v: 0 }, end = +el.dataset.count, dec = +(el.dataset.dec || 0);
      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const fmt = () => (el.textContent = (el.dataset.pre || '') + o.v.toFixed(dec) + (el.dataset.suf || ''));
        if (window.gsap) gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: fmt }); else { o.v = end; fmt(); }
      });
      obs.observe(el);
    });
    initTour();
    initValuation();
    // quotes
    const qs = $$('#quotes blockquote'), dots = $$('#qDots button');
    let qi = 0;
    const showQ = (i) => { qs[qi].classList.remove('is-on'); dots[qi].classList.remove('is-on'); qi = i; qs[qi].classList.add('is-on'); dots[qi].classList.add('is-on'); };
    dots.forEach((d, i) => d.addEventListener('click', () => showQ(i)));
    const qt = setInterval(() => showQ((qi + 1) % qs.length), 6500);
    cleanup.push(() => clearInterval(qt));
    initBooking($('#contactForm'), $('#days'));
    const pending = sessionStorage.getItem('halcyon:jump');
    if (pending) { sessionStorage.removeItem('halcyon:jump'); setTimeout(() => jump(pending), 120); }
  };

  /* ---------- the film tour ---------- */
  function initTour() {
    const sec = $('#tour'), cv = $('#tourCanvas');
    if (!sec || !cv) return;
    const ctx = cv.getContext('2d');
    const scenes = H.tour;
    const cache = {};
    scenes.forEach((s) => { if (!cache[s.img]) { const im = new Image(); im.src = img(s.img); cache[s.img] = im; } });
    let W = 0, Hh = 0, dpr = 1;
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; Hh = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
    };
    size();
    addEventListener('resize', size);
    cleanup.push(() => removeEventListener('resize', size));

    const cover = (im, fx, fy, z, alpha, blur) => {
      if (!im.complete || !im.naturalWidth) return;
      const iw = im.naturalWidth, ih = im.naturalHeight;
      const s = Math.max(W / iw, Hh / ih) * z;
      const dw = iw * s, dh = ih * s;
      let dx = W / 2 - fx * dw, dy = Hh / 2 - fy * dh;
      dx = clamp(dx, W - dw, 0); dy = clamp(dy, Hh - dh, 0);
      ctx.globalAlpha = alpha;
      ctx.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
      ctx.drawImage(im, dx * dpr, dy * dpr, dw * dpr, dh * dpr);
    };
    const T0 = performance.now();
    const drawScene = (i, t, alpha, push, blur) => {
      const s = scenes[i];
      const e = ease(clamp(t, 0, 1));
      const drift = (performance.now() - T0) / 1000;
      const fx = lerp(s.from.x, s.to.x, e) + Math.sin(drift * 0.35 + i) * 0.004;
      const fy = lerp(s.from.y, s.to.y, e) + Math.cos(drift * 0.3 + i) * 0.004;
      const z = lerp(s.from.z, s.to.z, e) * push;
      cover(cache[s.img], fx, fy, z, alpha, blur);
    };

    let target = 0, cur = 0, raf, lastIdx = -1;
    const els = { room: $('#tourRoom'), title: $('#tourTitle'), copy: $('#tourCopy'), stats: $('#tourStats'), cap: $('#tourCap'), bar: $('#tourBar'), time: $('#tourTime'), intro: $('#tourIntro'), end: $('#tourEnd') };
    const chapters = $$('#chapters button');
    const planRects = $$('#plan rect');
    const TOTAL = 105; // seconds of "film"
    const tc = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

    const setCaption = (i) => {
      if (i === lastIdx) return;
      lastIdx = i;
      const s = scenes[i];
      els.cap.classList.remove('is-on');
      setTimeout(() => {
        els.room.textContent = `${String(i + 1).padStart(2, '0')} · ${s.room}`;
        els.title.textContent = s.title;
        els.copy.textContent = s.copy;
        els.stats.innerHTML = s.stats.map((x) => `<li>${x}</li>`).join('');
        els.cap.classList.add('is-on');
      }, 180);
      chapters.forEach((c, k) => { c.classList.toggle('is-on', k === i); c.classList.toggle('is-done', k < i); });
      planRects.forEach((r) => r.classList.toggle('is-on', r.dataset.p === s.plan));
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = sec.getBoundingClientRect();
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      target = clamp(-r.top / (r.height - innerHeight), 0, 1);
      cur += (target - cur) * (reduced ? 1 : 0.085);
      const n = scenes.length;
      const f = clamp(cur, 0, 0.99999) * n;
      const i = Math.floor(f), t = f - i;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.filter = 'none';
      ctx.fillStyle = '#0b0d10'; ctx.fillRect(0, 0, cv.width, cv.height);
      const TR = 0.22; // share of each scene used to travel into the next
      const next = scenes[i + 1];
      const sameNext = next && next.img === scenes[i].img;
      if (sameNext) {
        // same photograph: the camera glides straight on into the next move
        drawScene(i, t, 1, 1, 0);
      } else if (t > 1 - TR && next) {
        const k = ease((t - (1 - TR)) / TR);
        {
          // push forward through the frame, then land in the next room
          drawScene(i, 1, 1, 1 + k * 0.35, k * 10);
          drawScene(i + 1, 0, k, 1.18 - k * 0.18, (1 - k) * 8);
        }
      } else {
        drawScene(i, t / (1 - TR), 1, 1, 0);
      }
      ctx.globalAlpha = 1; ctx.filter = 'none';
      // UI
      setCaption(t > 1 - TR * 0.5 && next ? i + 1 : i);
      els.bar.style.width = cur * 100 + '%';
      els.time.textContent = `${tc(cur * TOTAL)} / ${tc(TOTAL)}`;
      els.intro.classList.toggle('is-on', cur < 0.035);
      els.cap.classList.toggle('is-hidden', cur < 0.035 || cur > 0.965);
      els.end.classList.toggle('is-on', cur > 0.965);
      sec.classList.toggle('is-ending', cur > 0.965);
    };
    frame();
    cleanup.push(() => cancelAnimationFrame(raf));
    chapters.forEach((c, k) => c.addEventListener('click', () => {
      const top = sec.getBoundingClientRect().top + scrollY;
      const y = top + ((k + 0.05) / scenes.length) * (sec.offsetHeight - innerHeight);
      lenis ? lenis.scrollTo(y, { duration: 1.8 }) : scrollTo({ top: y, behavior: 'smooth' });
    }));
  }

  /* ---------- valuation ---------- */
  function initValuation() {
    const f = $('#valuation');
    if (!f) return;
    const shown = { v: 0 };
    const calc = () => {
      const d = Object.fromEntries(new FormData(f));
      const n = H.neighborhoods.find((x) => x.name === d.area);
      const ppsf = n.median / 3600;
      const beds = { 3: 0.96, 4: 1, 5: 1.04, '6+': 1.08 }[d.beds];
      let v = clamp(+d.sqft || 0, 800, 20000) * ppsf * beds * +d.cond;
      if (d.view) v *= 1.18;
      if (d.pool) v *= 1.05;
      const lo = v * 0.93, hi = v * 1.07;
      $('#valLow').textContent = short(lo); $('#valHigh').textContent = short(hi);
      if (window.gsap) gsap.to(shown, { v, duration: 0.9, ease: 'power3.out', onUpdate: () => ($('#valOut').textContent = usd(shown.v)) });
      else $('#valOut').textContent = usd(v);
    };
    f.addEventListener('input', calc);
    f.addEventListener('change', calc);
    calc();
  }

  /* ---------- booking (day pills + form) ---------- */
  function initBooking(form, daysEl) {
    if (!form) return;
    const d0 = new Date();
    daysEl.innerHTML = Array.from({ length: 7 }, (_, k) => {
      const d = new Date(d0); d.setDate(d0.getDate() + k + 1);
      return `<label><input type="radio" name="day" value="${d.toDateString()}" ${k ? '' : 'checked'} /><span><small>${d.toLocaleDateString('en-US', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('en-US', { month: 'short' })}</small></span></label>`;
    }).join('');
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach((i) => { const bad = !i.checkValidity(); i.closest('.f').classList.toggle('is-err', bad); if (bad) ok = false; });
      if (!ok) { toast('Please add your name, phone and email.'); return; }
      const fd = new FormData(form);
      toast(`Thank you, ${String(fd.get('name')).split(' ')[0]}. Showing requested for ${new Date(fd.get('day')).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${fd.get('time')}.`);
      form.reset();
      $('input[name=day]', daysEl).checked = true;
    });
  }

  /* ================= ALL HOMES ================= */
  views.homes = (r) => {
    const cities = [...new Set(H.listings.map((l) => l.city))].sort();
    const q = r.q;
    return `
    <section class="page-head">
      <div class="wrap">
        <nav class="crumbs"><a href="#/">Home</a><span>/</span><b>Homes for sale</b></nav>
        <h1 class="h1">California <em>homes</em></h1>
        <p class="muted" id="count"></p>
      </div>
    </section>
    <section class="wrap">
      <form class="filters" id="filters">
        <label class="f f--search"><span>Search</span><input name="text" placeholder="Address, city or feature" value="${esc(q.get('text') || '')}" /></label>
        <label class="f"><span>City</span><select name="city"><option value="">All cities</option>${cities.map((c) => `<option ${q.get('city') === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
        <label class="f"><span>Style</span><select name="type"><option value="">Any</option>${['Modern', 'Coastal'].map((t) => `<option ${q.get('type') === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="f"><span>Min price</span><select name="min"><option value="">No min</option>${[3e6, 5e6, 8e6, 10e6].map((v) => `<option value="${v}" ${+q.get('min') === v ? 'selected' : ''}>${short(v)}</option>`).join('')}</select></label>
        <label class="f"><span>Max price</span><select name="max"><option value="">No max</option>${[5e6, 8e6, 12e6, 20e6].map((v) => `<option value="${v}" ${+q.get('max') === v ? 'selected' : ''}>${short(v)}</option>`).join('')}</select></label>
        <label class="f"><span>Beds</span><select name="beds"><option value="">Any</option>${[4, 5, 6].map((v) => `<option value="${v}" ${+q.get('beds') === v ? 'selected' : ''}>${v}+</option>`).join('')}</select></label>
        <label class="f"><span>Status</span><select name="status"><option value="">Any</option>${['New', 'For sale', 'Open house', 'Pending', 'Sold', 'Featured'].map((v) => `<option ${q.get('status') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="tg tg--dark"><input type="checkbox" name="saved" ${q.get('saved') ? 'checked' : ''} /><span></span>Saved only</label>
      </form>
      <div class="bar">
        <div class="chips" id="chips"></div>
        <label class="sortsel">Sort <select id="sort"><option value="new">Newest</option><option value="hi">Price: high to low</option><option value="lo">Price: low to high</option><option value="size">Largest</option></select></label>
      </div>
      <div class="lgrid" id="results"></div>
    </section>`;
  };
  views.homes.after = () => {
    const f = $('#filters');
    const draw = () => {
      const d = Object.fromEntries(new FormData(f));
      const text = (d.text || '').toLowerCase().trim();
      let list = H.listings.filter((l) => {
        if (d.city && l.city !== d.city) return false;
        if (d.type && l.type !== d.type) return false;
        if (d.min && l.price < +d.min) return false;
        if (d.max && l.price > +d.max) return false;
        if (d.beds && l.beds < +d.beds) return false;
        if (d.status && l.status !== d.status) return false;
        if (d.saved && !saved.includes(l.id)) return false;
        if (text && !`${l.address} ${l.city} ${l.area} ${l.headline} ${l.features.join(' ')}`.toLowerCase().includes(text)) return false;
        return true;
      });
      const s = $('#sort').value;
      if (s === 'hi') list.sort((a, b) => b.price - a.price);
      if (s === 'lo') list.sort((a, b) => a.price - b.price);
      if (s === 'size') list.sort((a, b) => b.sqft - a.sqft);
      if (s === 'new') list.sort((a, b) => b.year - a.year);
      $('#count').textContent = `${list.length} home${list.length === 1 ? '' : 's'} · ${list.length ? short(Math.min(...list.map((l) => l.price))) + ' to ' + short(Math.max(...list.map((l) => l.price))) : ''}`;
      $('#results').innerHTML = list.length ? list.map(card).join('') : `<div class="empty"><h3>No homes match yet</h3><p>Widen your search, or ask us about off-market homes.</p><a class="btn btn--dark" href="#/#contact" data-jump="contact">Ask about off-market</a></div>`;
      const chips = Object.entries(d).filter(([, v]) => v).map(([k, v]) => `<button type="button" data-k="${k}">${k === 'saved' ? 'Saved' : k === 'min' ? short(+v) + '+' : k === 'max' ? 'Under ' + short(+v) : k === 'beds' ? v + '+ beds' : esc(v)} ✕</button>`);
      $('#chips').innerHTML = chips.join('') + (chips.length ? '<button type="button" class="clear" data-k="*">Clear all</button>' : '');
      bindReveal();
    };
    f.addEventListener('input', draw);
    f.addEventListener('change', draw);
    f.addEventListener('submit', (e) => e.preventDefault());
    $('#sort').addEventListener('change', draw);
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k;
      $$(k === '*' ? '[name]' : `[name="${k}"]`, f).forEach((el) => (el.type === 'checkbox' ? (el.checked = false) : (el.value = '')));
      draw();
    });
    draw();
  };

  /* ================= LISTING DETAIL ================= */
  const detail = (r) => {
    const l = byId(r.id);
    if (!l) return views.notfound();
    const g = l.gallery;
    const similar = H.listings.filter((x) => x.id !== l.id && x.status !== 'Sold').sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price)).slice(0, 3);
    const agent = H.agents[H.listings.indexOf(l) % H.agents.length];
    return `
    <section class="wrap detail">
      <nav class="crumbs"><a href="#/">Home</a><span>/</span><a href="#/homes">Homes</a><span>/</span><a href="#/homes?city=${encodeURIComponent(l.city)}">${l.city}</a><span>/</span><b>${esc(l.address)}</b></nav>
      <div class="mosaic">
        <button class="mosaic__main" data-gal="0"><img src="${img(g[0])}" alt="${esc(l.address)}" /><span class="status status--${l.status.toLowerCase().replace(/\s/g, '')}">${l.status}</span></button>
        <button data-gal="1"><img src="${img(g[1] || g[0])}" alt="" /></button>
        <button data-gal="2"><img src="${img(g[0])}" alt="" style="object-position:20% 70%;transform:scale(1.6)" /></button>
        <button data-gal="3" class="mosaic__more"><img src="${img(g[g.length - 1])}" alt="" style="object-position:80% 40%;transform:scale(1.4)" /><span>View all photos</span></button>
      </div>
      <div class="detail__grid">
        <div class="detail__main">
          <div class="detail__head">
            <div>
              <p class="kicker">${l.city}, California · ${l.type}</p>
              <h1 class="h1 h1--detail">${esc(l.address)}</h1>
              <p class="detail__headline">${esc(l.headline)}</p>
            </div>
            <div class="detail__price"><b>${usd(l.price)}</b><small>Est. ${usd(monthly(l.price, 20, 6.5, 30).total)}/mo</small></div>
          </div>
          <ul class="keyfacts">
            <li>${ic.bed}<b>${l.beds}</b><span>Bedrooms</span></li><li>${ic.bath}<b>${l.baths}</b><span>Bathrooms</span></li>
            <li>${ic.area}<b>${l.sqft.toLocaleString()}</b><span>Sq ft</span></li><li><svg viewBox="0 0 24 24"><path d="M3 20h18M5 20V9l7-5 7 5v11"/></svg><b>${l.lot}</b><span>Lot</span></li>
            <li><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg><b>${l.year}</b><span>Built</span></li>
          </ul>
          <div class="detail__actions">
            ${l.tour ? `<a href="#/#tour" data-jump="tour" class="btn btn--dark">${ic.play} Watch the film tour</a>` : ''}
            <button class="btn btn--outline" data-save="${l.id}">${ic.heart} <span>${saved.includes(l.id) ? 'Saved' : 'Save home'}</span></button>
            <button class="btn btn--outline" id="shareBtn">Share</button>
          </div>
          <h2 class="h3">About this home</h2>
          <p class="detail__desc">${esc(l.desc)}</p>
          <h2 class="h3">Features</h2>
          <ul class="features">${l.features.map((x) => `<li>${ic.check}${x}</li>`).join('')}</ul>
          <h2 class="h3">Payment calculator</h2>
          <div class="calc" id="calc">
            <div class="calc__inputs">
              <label class="f"><span>Home price</span><input type="number" name="price" value="${l.price}" step="50000" /></label>
              <label class="f"><span>Down payment <em id="downPct">20%</em></span><input type="range" name="down" min="10" max="60" value="20" /></label>
              <label class="f"><span>Interest rate <em id="ratePct">6.5%</em></span><input type="range" name="rate" min="4" max="9" step="0.125" value="6.5" /></label>
              <label class="f"><span>Loan term</span><select name="term"><option value="30">30-year fixed</option><option value="15">15-year fixed</option></select></label>
            </div>
            <div class="calc__out">
              <svg viewBox="0 0 42 42" class="donut" id="donut"><circle r="15.9" cx="21" cy="21" /></svg>
              <div class="calc__total"><small>Monthly payment</small><b id="calcTotal"></b></div>
              <ul id="calcRows"></ul>
            </div>
          </div>
        </div>
        <aside class="detail__side">
          <div class="bookcard">
            <div class="bookcard__agent"><div class="agent__mono agent__mono--sm" style="--h:28"><span>${agent.name.split(' ').map((w) => w[0]).join('')}</span></div><div><b>${agent.name}</b><small>${agent.role} · ${agent.phone}</small></div></div>
            <h3>Schedule a private showing</h3>
            <form class="cform cform--light" id="bookForm" novalidate>
              <div class="f"><span>Choose a day</span><div class="days days--light" id="bookDays"></div></div>
              <div class="f"><span>Time</span><div class="slots slots--light">${['10:00 AM', '1:00 PM', '4:00 PM'].map((t, i) => `<label><input type="radio" name="time" value="${t}" ${i ? '' : 'checked'} /><span>${t}</span></label>`).join('')}</div></div>
              <label class="f"><span>Name</span><input name="name" required /></label>
              <label class="f"><span>Phone</span><input name="phone" type="tel" required /></label>
              <label class="f"><span>Email</span><input name="email" type="email" required /></label>
              <button class="btn btn--dark btn--block">Request showing</button>
              <p class="fine">Proof of funds may be requested before showings over $10M.</p>
            </form>
          </div>
        </aside>
      </div>
    </section>
    <section class="section section--tint"><div class="wrap">
      <div class="sec-head"><div><p class="kicker">You may also like</p><h2 class="h2">Similar <em>homes</em></h2></div></div>
      <div class="lgrid">${similar.map(card).join('')}</div>
    </div></section>`;
  };
  function monthly(price, downPct, rate, years) {
    const loan = price * (1 - downPct / 100);
    const r = rate / 100 / 12, n = years * 12;
    const pi = loan * (r / (1 - Math.pow(1 + r, -n)));
    const tax = (price * 0.0115) / 12, ins = (price * 0.0035) / 12;
    return { pi, tax, ins, total: pi + tax + ins, loan };
  }
  // the "home" name is taken by the landing page; detail uses #/home/:id
  const landing = views.home;
  views.home = (r) => (r.id ? detail(r) : landing(r));
  views.home.after = (r) => {
    if (!r.id) return landing.after(r);
    const l = byId(r.id);
    if (!l) return;
    // gallery lightbox
    $$('[data-gal]').forEach((b) => b.addEventListener('click', () => openLightbox(l.gallery, Math.min(+b.dataset.gal, l.gallery.length - 1), l.address)));
    // calculator
    const c = $('#calc');
    const drawCalc = () => {
      const price = +$('[name=price]', c).value || l.price, down = +$('[name=down]', c).value, rate = +$('[name=rate]', c).value, term = +$('[name=term]', c).value;
      $('#downPct').textContent = `${down}% · ${short(price * down / 100)}`;
      $('#ratePct').textContent = rate.toFixed(3).replace(/0+$/, '').replace(/\.$/, '') + '%';
      const m = monthly(price, down, rate, term);
      $('#calcTotal').textContent = usd(m.total);
      const parts = [['Principal & interest', m.pi, '#0f1215'], ['Property tax', m.tax, '#b08d57'], ['Insurance', m.ins, '#9fb4bf']];
      $('#calcRows').innerHTML = parts.map(([n, v, col]) => `<li><i style="background:${col}"></i>${n}<b>${usd(v)}</b></li>`).join('') + `<li class="muted">Loan amount<b>${usd(m.loan)}</b></li>`;
      let acc = 0;
      $('#donut').innerHTML = `<circle r="15.9" cx="21" cy="21" class="donut__bg"/>` + parts.map(([, v, col]) => {
        const pct = (v / m.total) * 100; const seg = `<circle r="15.9" cx="21" cy="21" stroke="${col}" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${25 - acc}"/>`; acc += pct; return seg;
      }).join('');
    };
    c.addEventListener('input', drawCalc);
    drawCalc();
    $('#shareBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(location.href); toast('Link copied to clipboard'); } catch (e) { toast('Copy the address bar to share'); } });
    initBooking($('#bookForm'), $('#bookDays'));
  };

  views.notfound = () => `<section class="wrap empty-page"><h1 class="h1">Page not found</h1><p class="muted">This home may have sold, or the link has changed.</p><a class="btn btn--dark" href="#/homes">Browse homes</a></section>`;

  /* ---------- lightbox ---------- */
  let lb = { list: [], i: 0, cap: '' };
  function openLightbox(list, i, cap) {
    lb = { list, i, cap };
    drawLb();
    $('#lightbox').classList.add('is-on');
    lenis && lenis.stop();
  }
  function drawLb() {
    $('#lbImg').src = img(lb.list[lb.i]);
    $('#lbCap').textContent = `${lb.cap} · ${lb.i + 1} / ${lb.list.length}`;
  }
  const closeLb = () => { $('#lightbox').classList.remove('is-on'); lenis && lenis.start(); };
  $('#lightbox').addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (!a) { if (e.target.id === 'lightbox') closeLb(); return; }
    if (a.dataset.lb === 'close') closeLb();
    if (a.dataset.lb === 'next') { lb.i = (lb.i + 1) % lb.list.length; drawLb(); }
    if (a.dataset.lb === 'prev') { lb.i = (lb.i - 1 + lb.list.length) % lb.list.length; drawLb(); }
  });
  addEventListener('keydown', (e) => {
    if (!$('#lightbox').classList.contains('is-on')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') { lb.i = (lb.i + 1) % lb.list.length; drawLb(); }
    if (e.key === 'ArrowLeft') { lb.i = (lb.i - 1 + lb.list.length) % lb.list.length; drawLb(); }
  });

  /* ---------- global clicks ---------- */
  function jump(id) {
    const el = document.getElementById(id);
    if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: id === 'tour' ? 0 : -70, duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const j = e.target.closest('[data-jump]');
    if (j) {
      e.preventDefault();
      document.body.classList.remove('menu-open');
      if (route.name === 'home' && !route.id) jump(j.dataset.jump);
      else { sessionStorage.setItem('halcyon:jump', j.dataset.jump); location.hash = '#/'; }
      return;
    }
    const s = e.target.closest('[data-save]');
    if (s) {
      e.preventDefault();
      const id = s.dataset.save;
      const on = !saved.includes(id);
      saved = on ? [...saved, id] : saved.filter((x) => x !== id);
      store.set('saved', saved);
      syncSaved();
      $$(`[data-save="${id}"]`).forEach((b) => { b.classList.toggle('is-on', on); const sp = b.querySelector('span'); if (sp) sp.textContent = on ? 'Saved' : 'Save home'; });
      if (window.gsap && on) gsap.fromTo(s, { scale: 0.7 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' });
      toast(on ? 'Saved to your homes' : 'Removed from saved homes');
    }
  });
  $('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('[data-news]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); f.reset(); toast('Welcome to The Journal.'); }));

  /* ---------- header on scroll ---------- */
  const header = $('#header');
  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    const overDark = route.name === 'home' && !route.id && y < innerHeight * 0.85;
    const tour = $('#tour');
    const inTour = tour && tour.getBoundingClientRect().top <= 0 && tour.getBoundingClientRect().bottom > 80;
    header.classList.toggle('is-light', overDark || inTour);
    header.classList.toggle('is-solid', y > 20 && !overDark && !inTour);
    header.classList.toggle('is-hidden', inTour && y > lastY + 1);
    if (y < lastY - 1) header.classList.remove('is-hidden');
    lastY = y;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- boot ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  syncSaved();
  if (!location.hash) history.replaceState(null, '', '#/');
  render(true);

  const line = $('#loaderLine');
  const pics = $$('img', app).slice(0, 6);
  let n = 0, finished = false;
  const done = () => { if (finished) return; finished = true; line.style.width = '100%'; setTimeout(() => { $('#loader').classList.add('is-done'); setTimeout(() => $('#loader').remove(), 1000); }, 300); };
  pics.forEach((p) => { if (p.complete) n++; else p.addEventListener('load', () => { n++; line.style.width = (n / pics.length) * 100 + '%'; if (n >= pics.length) done(); }, { once: true }); });
  line.style.width = (n / Math.max(1, pics.length)) * 100 + '%';
  if (n >= pics.length) setTimeout(done, 700);
  setTimeout(done, 3500);
})();
