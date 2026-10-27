/* =========================================================
   VELORA · storefront app
   Single-page store with hash routing so it runs from disk
   (file://) or any static host. State (bag, wishlist, orders,
   currency, account) persists in localStorage when available.
   ========================================================= */
(function () {
  'use strict';
  const D = window.VELORA;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const app = $('#app');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- storage + state ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('velora:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('velora:' + k, JSON.stringify(v)); } catch (e) { /* private mode: keep in memory */ } },
  };
  const state = {
    cart: store.get('cart', []),
    wish: store.get('wish', []),
    currency: store.get('currency', 'USD'),
    coupon: store.get('coupon', null),
    orders: store.get('orders', []),
    viewed: store.get('viewed', []),
    user: store.get('user', null),
    reviews: store.get('reviews', {}),
  };
  const save = (...keys) => keys.forEach((k) => store.set(k, state[k]));

  /* ---------------- helpers ---------------- */
  const byId = (id) => D.products.find((p) => p.id === id);
  const img = (name) => `assets/img/${name}.jpg`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (usd) => {
    const c = D.currencies[state.currency] || D.currencies.USD;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: state.currency }).format(usd * c.rate);
  };
  const catName = (id) => (D.categories.find((c) => c.id === id) || {}).name || 'Shop';
  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) {
      const fill = Math.max(0, Math.min(1, r - i + 1));
      s += `<i class="star" style="--f:${Math.round(fill * 100)}%"></i>`;
    }
    return `<span class="stars" aria-label="${r} out of 5">${s}</span>`;
  };
  const off = (p) => (p.was ? Math.round((1 - p.price / p.was) * 100) : 0);
  const icon = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    truck: '<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    ret: '<svg viewBox="0 0 24 24"><path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="M8 5L4 9l4 4"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>',
    filter: '<svg viewBox="0 0 24 24"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  };

  /* ---------------- toasts ---------------- */
  function toast(msg, opts = {}) {
    const t = document.createElement('div');
    t.className = 'toast' + (opts.type ? ' toast--' + opts.type : '');
    t.innerHTML = `${opts.img ? `<img src="${img(opts.img)}" alt="">` : `<span class="toast__dot"></span>`}<div><b>${msg}</b>${opts.sub ? `<small>${opts.sub}</small>` : ''}</div>${opts.action ? `<a href="${opts.action.href}">${opts.action.label}</a>` : ''}`;
    $('#toasts').appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 500); }, opts.ms || 3200);
  }

  /* ---------------- counts / badges ---------------- */
  const cartQty = () => state.cart.reduce((n, l) => n + l.qty, 0);
  function syncCounts(bump) {
    $$('[data-count="cart"]').forEach((el) => {
      el.textContent = cartQty();
      el.classList.toggle('is-zero', !cartQty());
      if (bump && window.gsap) gsap.fromTo(el, { scale: 1.8 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' });
    });
    $$('[data-count="wish"]').forEach((el) => { el.textContent = state.wish.length; el.classList.toggle('is-zero', !state.wish.length); });
    $$('[data-count="cart-label"]').forEach((el) => (el.textContent = cartQty() ? `(${cartQty()})` : ''));
  }

  /* ---------------- totals ---------------- */
  function totals(shipId = 'standard') {
    const lines = state.cart.map((l) => ({ ...l, p: byId(l.id) })).filter((l) => l.p);
    const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const cp = state.coupon ? D.coupons[state.coupon] : null;
    let disc = 0, freeShip = false, couponNote = '';
    if (cp) {
      if (cp.type === 'percent') {
        if (!cp.min || sub >= cp.min) disc = +(sub * cp.value / 100).toFixed(2);
        else couponNote = `Add ${money(cp.min - sub)} more to use ${state.coupon}`;
      }
      if (cp.type === 'ship') freeShip = true;
    }
    const method = D.shipping.find((s) => s.id === shipId) || D.shipping[0];
    let ship = method.price;
    if (!sub) ship = 0;
    else if (freeShip) ship = 0;
    else if (method.id === 'standard' && sub - disc >= D.freeShippingAt) ship = 0;
    const tax = +((sub - disc) * D.taxRate).toFixed(2);
    return { lines, sub, disc, ship, tax, total: sub - disc + ship + tax, couponNote, method };
  }

  /* ---------------- cart + wishlist actions ---------------- */
  function addToCart(id, opts = {}, fromEl) {
    const p = byId(id);
    if (!p) return;
    const size = opts.size || (p.sizes ? null : 'One size');
    if (p.sizes && !size) { quickView(id, 'Choose a size first'); return; }
    const color = opts.color || p.colors[0].n;
    const key = `${id}|${size}|${color}`;
    const line = state.cart.find((l) => l.key === key);
    const qty = Math.max(1, opts.qty || 1);
    if (line) line.qty = Math.min(10, line.qty + qty);
    else state.cart.push({ key, id, size, color, qty });
    save('cart');
    renderCart();
    flyToCart(fromEl, p.img);
    toast('Added to bag', { img: p.img, sub: `${p.name}${size !== 'One size' ? ' · ' + size : ''}`, action: { href: '#/cart', label: 'View bag' } });
  }
  function setQty(key, qty) {
    const l = state.cart.find((x) => x.key === key);
    if (!l) return;
    l.qty = Math.max(0, Math.min(10, qty));
    if (!l.qty) state.cart = state.cart.filter((x) => x.key !== key);
    save('cart');
    renderCart();
    if (route.name === 'cart') renderRoute(true);
    if (route.name === 'checkout') renderRoute(true);
  }
  function toggleWish(id, btn) {
    const has = state.wish.includes(id);
    state.wish = has ? state.wish.filter((x) => x !== id) : [id, ...state.wish];
    save('wish');
    syncCounts();
    $$(`[data-wish="${id}"]`).forEach((b) => b.classList.toggle('is-on', !has));
    if (btn && window.gsap && !has) gsap.fromTo(btn, { scale: 0.6 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,0.35)' });
    toast(has ? 'Removed from wishlist' : 'Saved to wishlist', { img: byId(id).img, action: has ? null : { href: '#/wishlist', label: 'View' } });
    if (route.name === 'wishlist') renderRoute(true);
  }
  function flyToCart(fromEl, imgName) {
    if (!fromEl || !window.gsap || reduced) { syncCounts(true); return; }
    const src = fromEl.closest('[data-card], .pdp, .qv, .look')?.querySelector('img') || fromEl;
    const target = [...$$('#openCart, #tabCart')].find((el) => el.offsetParent !== null);
    if (!src || !target) { syncCounts(true); return; }
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    const ghost = document.createElement('img');
    ghost.src = img(imgName);
    ghost.className = 'fly';
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    gsap.timeline({ onComplete: () => { ghost.remove(); syncCounts(true); } })
      .to(ghost, { duration: 0.35, scale: 0.55, borderRadius: '24px', ease: 'power2.out' })
      .to(ghost, { duration: 0.75, x: dx, ease: 'power1.inOut' }, 0.2)
      .to(ghost, { duration: 0.75, y: dy, scale: 0.06, opacity: 0.4, ease: 'back.in(1.4)' }, 0.2);
  }

  /* ---------------- product card ---------------- */
  function card(p, i = 0) {
    const wished = state.wish.includes(p.id);
    const badge = p.badges[0];
    return `
    <article class="pcard" data-card data-reveal style="--d:${(i % 4) * 70}ms">
      <div class="pcard__top">
      <a href="#/product/${p.id}" class="pcard__media" aria-label="${esc(p.name)}">
        <img src="${img(p.img)}" alt="${esc(p.name)}, ${esc(p.sub)}" loading="lazy" />
        ${badge ? `<span class="badge ${p.was ? 'badge--sale' : ''}">${esc(badge)}</span>` : ''}
        ${p.stock <= 8 ? `<span class="pcard__stock">Only ${p.stock} left</span>` : ''}
      </a>
      <button class="pcard__wish ${wished ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Save ${esc(p.name)} to wishlist">${icon.heart}</button>
      <div class="pcard__actions">
        <button class="btn btn--dark btn--sm" data-add="${p.id}">${icon.bag}<span>${p.sizes ? 'Choose size' : 'Add to bag'}</span></button>
        <button class="btn btn--glass btn--sm btn--icon" data-qv="${p.id}" aria-label="Quick view">${icon.eye}</button>
      </div>
      </div>
      <div class="pcard__body">
        <div class="pcard__row"><span class="pcard__cat">${catName(p.cat)}</span><span class="pcard__rate">${stars(p.rating)}<small>(${p.reviews})</small></span></div>
        <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
        <p class="pcard__sub">${esc(p.sub)}</p>
        <div class="pcard__row">
          <span class="price">${money(p.price)}${p.was ? `<s>${money(p.was)}</s>` : ''}</span>
          <span class="swatches">${p.colors.slice(0, 5).map((c) => `<i style="--c:${c.c}" title="${esc(c.n)}"></i>`).join('')}${p.colors.length > 5 ? `<small>+${p.colors.length - 5}</small>` : ''}</span>
        </div>
      </div>
    </article>`;
  }

  /* ---------------- router ---------------- */
  let route = { name: 'home', params: {}, query: new URLSearchParams() };
  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const query = new URLSearchParams(qs || '');
    const name = parts[0] || 'home';
    return { name, params: { id: parts[1] }, query, raw: h };
  }
  const views = {};
  let cleanup = [];
  function renderRoute(soft) {
    route = parse();
    cleanup.forEach((fn) => fn());
    cleanup = [];
    const view = views[route.name] || views.notfound;
    const html = view(route);
    const swap = () => {
      app.innerHTML = html;
      (view.after || (() => {}))(route);
      bindReveal();
      $$('.nav a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#/' + route.raw));
      $$('.tabbar [data-tab]').forEach((a) => a.classList.toggle('is-active', a.dataset.tab === (route.name === 'home' ? 'home' : route.name)));
      document.body.dataset.route = route.name;
      document.body.classList.toggle('on-hero', route.name === 'home' && scrollY < innerHeight * 0.8);
    };
    if (soft || !window.gsap || reduced) { swap(); return; }
    gsap.to(app, {
      autoAlpha: 0, y: 12, duration: 0.22, ease: 'power2.in', onComplete: () => {
        swap();
        if (lenis) lenis.scrollTo(0, { immediate: true }); else scrollTo(0, 0);
        gsap.fromTo(app, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' });
      },
    });
  }
  addEventListener('hashchange', () => { closeAll(); renderRoute(); });

  /* ---------------- reveal on scroll ---------------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function bindReveal() {
    $$('[data-reveal]:not(.is-in)', app).forEach((el) => (io ? io.observe(el) : el.classList.add('is-in')));
  }

  /* ================= VIEWS ================= */

  /* ---------- HOME ---------- */
  views.home = () => {
    const trending = D.products.filter((p) => ['monolith-low', 'heritage-chrono-emerald', 'riviera-knit-set', 'velvet-brush-set', 'court-classic', 'washed-cap-forest', 'midnight-moonphase', 'varsity-tracksuit'].includes(p.id));
    const deals = D.products.filter((p) => p.was);
    const dropEnd = Date.now() + ((3 * 24 + 7) * 3600 + 22 * 60) * 1000;
    const dealEnd = new Date(); dealEnd.setHours(23, 59, 59, 0);
    return `
    <section class="hero" id="hero">
      <div class="hero__glow"></div>
      <div class="container hero__grid">
        <div class="hero__copy">
          <p class="eyebrow eyebrow--light"><span class="pulse"></span> Autumn / Winter 2026 collection</p>
          <h1 class="hero__title"><span class="ln"><span>Considered</span></span><span class="ln"><span><em>essentials.</em></span></span></h1>
          <p class="hero__sub">Watches, sneakers and everyday pieces designed to be worn hard and loved for years. Free shipping over $75, returns on us.</p>
          <div class="hero__cta">
            <a href="#/shop" class="btn btn--light btn--lg magnetic">Shop the collection ${icon.arrow}</a>
            <a href="#/product/monolith-low" class="btn btn--ghost btn--lg magnetic">Drop 04: Monolith Low</a>
          </div>
          <div class="hero__proof">
            <div><b>4.8</b>${stars(4.8)}<small>12,400+ reviews</small></div>
            <div><b>24h</b><small>Dispatch on in-stock orders</small></div>
            <div><b>30 days</b><small>Free, easy returns</small></div>
          </div>
        </div>
        <div class="stage" id="stage" aria-hidden="true">
          <div class="stage__inner" id="stageInner">
            <figure class="float float--main" style="--z:0px"><img src="${img('monolith-low')}" alt="" /><figcaption><span>Drop 04</span><b>Monolith Low</b><em>${money(120)}</em></figcaption></figure>
            <figure class="float float--a" style="--z:140px;--t:0s"><img src="${img('chrono-emerald')}" alt="" /></figure>
            <figure class="float float--b" style="--z:90px;--t:-2s"><img src="${img('court-classic')}" alt="" /></figure>
            <figure class="float float--c" style="--z:180px;--t:-1s"><img src="${img('washed-cap-forest')}" alt="" /></figure>
            <figure class="float float--d" style="--z:70px;--t:-3s"><img src="${img('brush-set')}" alt="" /></figure>
            <div class="float chip" style="--z:230px;--t:-1.5s"><img src="${img('chrono-midnight')}" alt="" /><div><small>Just added</small><b>Midnight Moonphase</b></div><span>${money(159)}</span></div>
            <div class="float chip chip--rate" style="--z:200px;--t:-2.5s"><b>4.9</b>${stars(4.9)}<small>402 reviews</small></div>
          </div>
        </div>
      </div>
      <div class="hero__scroll"><span></span>Scroll</div>
    </section>

    <section class="perks">
      <div class="container perks__grid">
        <div data-reveal>${icon.truck}<div><b>Free shipping</b><small>On orders over $75</small></div></div>
        <div data-reveal style="--d:80ms">${icon.ret}<div><b>30-day returns</b><small>Free and no questions asked</small></div></div>
        <div data-reveal style="--d:160ms">${icon.lock}<div><b>Secure checkout</b><small>256-bit SSL encryption</small></div></div>
        <div data-reveal style="--d:240ms">${icon.shield}<div><b>2-year warranty</b><small>On every watch we sell</small></div></div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="sec-head" data-reveal><div><p class="eyebrow">Browse</p><h2 class="h2">Shop by <em>category</em></h2></div><a href="#/shop" class="link">View all ${icon.arrow}</a></div>
        <div class="cats">
          ${D.categories.map((c, i) => `
            <a href="#/shop?cat=${c.id}" class="cat" data-reveal style="--d:${i * 60}ms">
              <img src="${img(c.img)}" alt="${c.name}" loading="lazy" />
              <div class="cat__label"><b>${c.name}</b><small>${D.products.filter((p) => p.cat === c.id).length} products</small></div>
              <span class="cat__go">${icon.arrow}</span>
            </a>`).join('')}
        </div>
      </div>
    </section>

    <section class="section section--tint">
      <div class="container">
        <div class="sec-head" data-reveal>
          <div><p class="eyebrow">Trending now</p><h2 class="h2">What everyone's <em>adding to bag</em></h2></div>
          <div class="pills" id="trendTabs"><button class="is-on" data-t="all">All</button><button data-t="new">New in</button><button data-t="best">Bestsellers</button><button data-t="sale">Sale</button></div>
        </div>
        <div class="grid" id="trendGrid">${trending.map(card).join('')}</div>
      </div>
    </section>

    <section class="drop">
      <div class="drop__img"><img src="${img('monolith-low')}" alt="Monolith Low sneaker floating over dark volcanic rock" id="dropImg" /></div>
      <div class="container drop__grid">
        <div class="drop__copy" data-reveal>
          <p class="eyebrow eyebrow--light">Limited release · Drop 04</p>
          <h2 class="h2 h2--light">Monolith Low.<br /><em>Only 500 pairs.</em></h2>
          <p>Full-grain leather, a cushioned cupsole and a clean triple-white finish. When they're gone, they're gone.</p>
          <div class="countdown" data-countdown="${dropEnd}">
            <div><b data-u="d">00</b><small>Days</small></div><div><b data-u="h">00</b><small>Hours</small></div><div><b data-u="m">00</b><small>Mins</small></div><div><b data-u="s">00</b><small>Secs</small></div>
          </div>
          <div class="drop__cta"><a href="#/product/monolith-low" class="btn btn--light btn--lg">Shop the drop ${icon.arrow}</a><span class="drop__left"><i style="--p:68%"></i>342 of 500 claimed</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="sec-head" data-reveal>
          <div><p class="eyebrow">Deals of the day</p><h2 class="h2">Up to <em>22% off</em>, today only</h2></div>
          <div class="deal-timer" data-countdown="${dealEnd.getTime()}"><small>Ends in</small><b data-u="h">00</b>:<b data-u="m">00</b>:<b data-u="s">00</b></div>
        </div>
        <div class="rail" data-lenis-prevent-horizontal>
          ${deals.map((p, i) => card(p, i).replace('class="pcard"', 'class="pcard pcard--rail"')).join('')}
        </div>
      </div>
    </section>

    <section class="section section--tint">
      <div class="container look">
        <div class="look__img" data-reveal>
          <img src="${img('tipped-polo-look')}" alt="Flat lay: white tipped polo, washed black jeans and white sneakers" />
          <button class="hotspot" style="top:30%;left:38%" data-qv="tipped-pique-polo" aria-label="Tipped Piqué Polo"><span></span></button>
          <button class="hotspot" style="top:78%;left:24%" data-qv="monolith-low" aria-label="Monolith Low"><span></span></button>
          <button class="hotspot" style="top:55%;left:70%" data-qv="washed-cap-forest" aria-label="Add a cap"><span></span></button>
        </div>
        <div class="look__copy" data-reveal style="--d:120ms">
          <p class="eyebrow">Shop the look</p>
          <h2 class="h2">Weekend <em>uniform</em></h2>
          <p class="muted">Tap the dots to explore each piece, or grab the full look in one click.</p>
          <div class="look__list">
            ${['tipped-pique-polo', 'monolith-low', 'washed-cap-forest'].map((id) => { const p = byId(id); return `
              <a href="#/product/${id}" class="look__item"><img src="${img(p.img)}" alt="" /><div><b>${p.name}</b><small>${p.sub}</small></div><span>${money(p.price)}</span></a>`; }).join('')}
          </div>
          <button class="btn btn--dark btn--lg btn--block" id="addLook">${icon.bag} Add full look · ${money(48 + 120 + 28)}</button>
          <p class="fine">Default sizes M and US 9. Change them in your bag.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container duo">
        <div class="duo__card duo__card--app" data-reveal>
          <img src="${img('app-promo')}" alt="Phone showing the VELORA app with floating products" />
          <div class="duo__text">
            <p class="eyebrow">The VELORA app</p>
            <h3 class="h3">Your wardrobe,<br /><em>in your pocket.</em></h3>
            <p>Early access to drops, one-tap checkout and live order tracking.</p>
            <div class="stores"><span class="store"><small>Download on the</small>App Store</span><span class="store"><small>Get it on</small>Google Play</span></div>
          </div>
        </div>
        <div class="duo__card duo__card--dark" data-reveal style="--d:120ms">
          <img src="${img('laptop-cart')}" alt="Laptop with a shopping cart and parcels" />
          <div class="duo__text">
            <p class="eyebrow eyebrow--light">Checkout, simplified</p>
            <h3 class="h3 h3--light">Order by 3pm,<br /><em>ships today.</em></h3>
            <ul class="ticks"><li>${icon.check} Apple Pay, PayPal and all major cards</li><li>${icon.check} Real-time tracking on every order</li><li>${icon.check} Pay in 4 interest-free instalments</li></ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tint reviews-sec">
      <div class="container"><div class="sec-head" data-reveal><div><p class="eyebrow">Reviews</p><h2 class="h2">Rated <em>4.8 / 5</em> by 12,400+ customers</h2></div></div></div>
      <div class="marquee">
        <div class="marquee__track">
          ${[...D.sampleReviews, ...D.sampleReviews].map((r, i) => `
            <figure class="rcard"><div>${stars(r.stars)}</div><b>${r.title}</b><p>“${r.text}”</p><figcaption><span>${r.name[0]}</span>${r.name} · ${r.loc}<em>Verified buyer</em></figcaption></figure>`).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="sec-head" data-reveal><div><p class="eyebrow">#WearVELORA</p><h2 class="h2">As seen <em>on you</em></h2></div><span class="link">Tag us to be featured</span></div>
        <div class="gram">
          ${['varsity-tracksuit', 'court-classic', 'ombre-knit', 'chrono-emerald', 'riviera-knit-set', 'city-cap-sand'].map((n, i) => `
            <a href="#/shop" class="gram__item" data-reveal style="--d:${i * 50}ms"><img src="${img(n)}" alt="" loading="lazy" /><span>${icon.heart} ${120 + i * 37}</span></a>`).join('')}
        </div>
      </div>
    </section>`;
  };
  views.home.after = () => {
    // hero intro
    if (window.gsap && !reduced) {
      gsap.from('.hero__title .ln > span', { yPercent: 110, duration: 1.2, stagger: 0.12, ease: 'expo.out', delay: 0.1 });
      gsap.from('.hero__copy .eyebrow, .hero__sub, .hero__cta, .hero__proof', { y: 24, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out', delay: 0.35 });
      gsap.from('.float', { z: -400, autoAlpha: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out', delay: 0.2 });
    }
    // 3D stage follows the pointer
    const stage = $('#stage'), inner = $('#stageInner');
    if (stage && inner) {
      let rx = 0, ry = 0, tx = -6, ty = 10, raf;
      const move = (e) => { const r = stage.getBoundingClientRect(); ty = ((e.clientX - r.left) / r.width - 0.5) * 26; tx = -((e.clientY - r.top) / r.height - 0.5) * 18; };
      const loop = () => {
        const t = performance.now() / 1000;
        const ax = fine ? tx : -6 + Math.sin(t * 0.6) * 6, ay = fine ? ty : 10 + Math.cos(t * 0.5) * 10;
        rx += (ax - rx) * 0.06; ry += (ay - ry) * 0.06;
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
        raf = requestAnimationFrame(loop);
      };
      $('#hero').addEventListener('pointermove', move);
      loop();
      cleanup.push(() => cancelAnimationFrame(raf));
    }
    // trending tabs
    const all = D.products;
    $('#trendTabs').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$('#trendTabs button').forEach((x) => x.classList.toggle('is-on', x === b));
      let list;
      if (b.dataset.t === 'new') list = all.filter((p) => p.tags.includes('new'));
      else if (b.dataset.t === 'best') list = [...all].sort((a, b2) => b2.reviews - a.reviews).slice(0, 8);
      else if (b.dataset.t === 'sale') list = all.filter((p) => p.was);
      else list = all.slice(0, 8).sort((a, b2) => b2.rating - a.rating);
      const grid = $('#trendGrid');
      grid.innerHTML = list.slice(0, 8).map(card).join('');
      bindReveal();
    });
    // add full look
    $('#addLook').addEventListener('click', (e) => {
      addToCart('tipped-pique-polo', { size: 'M' }, e.currentTarget);
      setTimeout(() => addToCart('monolith-low', { size: '9' }), 250);
      setTimeout(() => addToCart('washed-cap-forest', {}), 500);
    });
    // drop parallax
    const dropImg = $('#dropImg');
    if (dropImg) {
      const onScroll = () => { const r = dropImg.parentElement.getBoundingClientRect(); const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; dropImg.style.transform = `translateY(${p * -60}px) scale(1.12)`; };
      addEventListener('scroll', onScroll, { passive: true }); onScroll();
      cleanup.push(() => removeEventListener('scroll', onScroll));
    }
  };

  /* ---------- SHOP ---------- */
  const filters = { cats: [], min: 0, max: 250, colors: [], sizes: [], rating: 0, sale: false, stock: false, sort: 'featured', q: '', shown: 12, cols: 3 };
  const allColors = () => {
    const m = new Map();
    D.products.forEach((p) => p.colors.forEach((c) => m.set(c.n.split(' / ')[0], c.c)));
    return [...m.entries()].slice(0, 14);
  };
  function applyFilters() {
    let list = D.products.filter((p) => {
      if (filters.cats.length && !filters.cats.includes(p.cat)) return false;
      if (p.price < filters.min || p.price > filters.max) return false;
      if (filters.colors.length && !p.colors.some((c) => filters.colors.includes(c.n.split(' / ')[0]))) return false;
      if (filters.sizes.length && !(p.sizes || []).some((s) => filters.sizes.includes(s))) return false;
      if (filters.rating && p.rating < filters.rating) return false;
      if (filters.sale && !p.was) return false;
      if (filters.stock && p.stock < 1) return false;
      if (filters.q) {
        const hay = `${p.name} ${p.sub} ${p.cat} ${catName(p.cat)} ${p.desc}`.toLowerCase();
        if (!filters.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    const s = filters.sort;
    if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (s === 'rating') list.sort((a, b) => b.rating - a.rating);
    if (s === 'new') list.sort((a, b) => (b.tags.includes('new') ? 1 : 0) - (a.tags.includes('new') ? 1 : 0));
    if (s === 'discount') list.sort((a, b) => off(b) - off(a));
    return list;
  }
  views.shop = (r) => {
    const cat = r.query.get('cat'), tag = r.query.get('tag'), q = r.query.get('q') || '';
    Object.assign(filters, { cats: cat ? [cat] : [], sale: tag === 'sale', q, shown: 12 });
    const title = q ? `Results for “${esc(q)}”` : tag === 'sale' ? 'Sale' : cat ? catName(cat) : 'Shop all';
    const sizes = ['S', 'M', 'L', 'XL', '7', '8', '9', '10', '11', '12'];
    return `
    <section class="page-head">
      <div class="container">
        <nav class="crumbs"><a href="#/">Home</a><span>/</span><a href="#/shop">Shop</a>${cat || tag || q ? `<span>/</span><b>${title}</b>` : ''}</nav>
        <h1 class="h1">${title}</h1>
        <p class="muted" id="shopCount"></p>
      </div>
    </section>
    <section class="container shop">
      <aside class="filters" id="filters" data-lenis-prevent>
        <div class="filters__head"><b>Filters</b><button class="link" id="clearFilters">Clear all</button><button class="icon-btn filters__close" id="closeFilters" aria-label="Close filters">${icon.close}</button></div>
        <details open><summary>Category</summary>
          ${D.categories.map((c) => `<label class="check"><input type="checkbox" name="cat" value="${c.id}" ${filters.cats.includes(c.id) ? 'checked' : ''}/><span>${c.name}</span><small>${D.products.filter((p) => p.cat === c.id).length}</small></label>`).join('')}
        </details>
        <details open><summary>Price</summary>
          <div class="range" id="range">
            <div class="range__track"><span id="rangeFill"></span></div>
            <input type="range" min="0" max="250" step="5" value="${filters.min}" id="rMin" aria-label="Minimum price" />
            <input type="range" min="0" max="250" step="5" value="${filters.max}" id="rMax" aria-label="Maximum price" />
          </div>
          <div class="range__vals"><span id="rMinV"></span><span id="rMaxV"></span></div>
        </details>
        <details open><summary>Colour</summary>
          <div class="colors">${allColors().map(([n, c]) => `<label class="color" title="${n}"><input type="checkbox" name="color" value="${n}"/><i style="--c:${c}"></i><span>${n}</span></label>`).join('')}</div>
        </details>
        <details open><summary>Size</summary>
          <div class="sizes">${sizes.map((s) => `<label class="size"><input type="checkbox" name="size" value="${s}"/><span>${s}</span></label>`).join('')}</div>
        </details>
        <details open><summary>Rating</summary>
          ${[4.8, 4.5, 4].map((v) => `<label class="check"><input type="radio" name="rating" value="${v}"/><span>${stars(v)} ${v}+ </span></label>`).join('')}
          <label class="check"><input type="radio" name="rating" value="0" checked/><span>Any rating</span></label>
        </details>
        <details open><summary>Availability</summary>
          <label class="switch"><input type="checkbox" id="fSale" ${filters.sale ? 'checked' : ''}/><span></span>On sale</label>
          <label class="switch"><input type="checkbox" id="fStock"/><span></span>In stock only</label>
        </details>
        <button class="btn btn--dark btn--block filters__apply" id="applyFilters">Show results</button>
      </aside>
      <div class="shop__main">
        <div class="toolbar">
          <button class="btn btn--outline btn--sm toolbar__filter" id="openFilters">${icon.filter} Filters</button>
          <div class="chips" id="chips"></div>
          <div class="toolbar__right">
            <label class="sort"><span>Sort</span><select id="sort">
              <option value="featured">Featured</option><option value="new">Newest</option><option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option><option value="rating">Top rated</option><option value="discount">Biggest discount</option>
            </select></label>
            <div class="density"><button data-cols="3" class="is-on" aria-label="3 columns">${'<i></i>'.repeat(3)}</button><button data-cols="4" aria-label="4 columns">${'<i></i>'.repeat(4)}</button></div>
          </div>
        </div>
        <div class="grid grid--shop" id="shopGrid"></div>
        <div class="loadmore" id="loadMore"></div>
      </div>
    </section>`;
  };
  views.shop.after = () => {
    const grid = $('#shopGrid');
    const draw = (keep) => {
      const list = applyFilters();
      $('#shopCount').textContent = `${list.length} product${list.length === 1 ? '' : 's'}`;
      if (!list.length) {
        grid.innerHTML = `<div class="empty"><h3>No matches</h3><p>Try removing a filter or two.</p><button class="btn btn--dark" id="emptyClear">Clear filters</button></div>`;
        $('#emptyClear').onclick = () => $('#clearFilters').click();
      } else grid.innerHTML = list.slice(0, filters.shown).map(card).join('');
      grid.className = `grid grid--shop cols-${filters.cols}`;
      const lm = $('#loadMore');
      lm.innerHTML = list.length > filters.shown
        ? `<p>Showing ${filters.shown} of ${list.length}</p><div class="lm-bar"><i style="width:${(filters.shown / list.length) * 100}%"></i></div><button class="btn btn--outline" id="lmBtn">Load more</button>`
        : list.length ? `<p>You've seen all ${list.length} products</p>` : '';
      if ($('#lmBtn')) $('#lmBtn').onclick = () => { filters.shown += 12; draw(true); };
      // chips
      const chips = [];
      filters.cats.forEach((c) => chips.push([`cat:${c}`, catName(c)]));
      filters.colors.forEach((c) => chips.push([`color:${c}`, c]));
      filters.sizes.forEach((s) => chips.push([`size:${s}`, `Size ${s}`]));
      if (filters.rating) chips.push(['rating', `${filters.rating}★+`]);
      if (filters.sale) chips.push(['sale', 'On sale']);
      if (filters.min > 0 || filters.max < 250) chips.push(['price', `${money(filters.min)} to ${money(filters.max)}`]);
      if (filters.q) chips.push(['q', `“${filters.q}”`]);
      $('#chips').innerHTML = chips.map(([k, l]) => `<button class="chip-x" data-chip="${esc(k)}">${esc(l)} ${icon.close}</button>`).join('');
      bindReveal();
      if (!keep && window.gsap && !reduced) gsap.from($$('.pcard', grid), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.03, ease: 'power2.out', clearProps: 'all' });
    };
    const f = $('#filters');
    f.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'cat') filters.cats = $$('input[name=cat]:checked', f).map((x) => x.value);
      if (t.name === 'color') filters.colors = $$('input[name=color]:checked', f).map((x) => x.value);
      if (t.name === 'size') filters.sizes = $$('input[name=size]:checked', f).map((x) => x.value);
      if (t.name === 'rating') filters.rating = +t.value;
      if (t.id === 'fSale') filters.sale = t.checked;
      if (t.id === 'fStock') filters.stock = t.checked;
      filters.shown = 12;
      draw();
    });
    // dual range
    const rMin = $('#rMin'), rMax = $('#rMax');
    const syncRange = () => {
      let a = +rMin.value, b = +rMax.value;
      if (a > b - 10) { if (document.activeElement === rMin) a = b - 10; else b = a + 10; rMin.value = a; rMax.value = b; }
      filters.min = a; filters.max = b;
      $('#rangeFill').style.left = (a / 250) * 100 + '%';
      $('#rangeFill').style.right = 100 - (b / 250) * 100 + '%';
      $('#rMinV').textContent = money(a); $('#rMaxV').textContent = money(b);
    };
    rMin.addEventListener('input', syncRange); rMax.addEventListener('input', syncRange);
    rMin.addEventListener('change', () => draw()); rMax.addEventListener('change', () => draw());
    syncRange();
    $('#sort').value = filters.sort;
    $('#sort').addEventListener('change', (e) => { filters.sort = e.target.value; draw(); });
    $$('.density button').forEach((b) => b.addEventListener('click', () => { filters.cols = +b.dataset.cols; $$('.density button').forEach((x) => x.classList.toggle('is-on', x === b)); draw(true); }));
    $('#chips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-chip]'); if (!b) return;
      const [k, v] = b.dataset.chip.split(':');
      const uncheck = (name) => $$(`input[name=${name}]`, f).forEach((x) => { if (x.value === v) x.checked = false; });
      if (k === 'cat') { filters.cats = filters.cats.filter((x) => x !== v); uncheck('cat'); }
      if (k === 'color') { filters.colors = filters.colors.filter((x) => x !== v); uncheck('color'); }
      if (k === 'size') { filters.sizes = filters.sizes.filter((x) => x !== v); uncheck('size'); }
      if (k === 'rating') { filters.rating = 0; $('input[name=rating][value="0"]', f).checked = true; }
      if (k === 'sale') { filters.sale = false; $('#fSale').checked = false; }
      if (k === 'price') { rMin.value = 0; rMax.value = 250; syncRange(); }
      if (k === 'q') filters.q = '';
      draw();
    });
    $('#clearFilters').addEventListener('click', () => {
      Object.assign(filters, { cats: [], min: 0, max: 250, colors: [], sizes: [], rating: 0, sale: false, stock: false, q: '', shown: 12 });
      $$('input[type=checkbox]', f).forEach((x) => (x.checked = false));
      $('input[name=rating][value="0"]', f).checked = true;
      rMin.value = 0; rMax.value = 250; syncRange();
      draw();
    });
    const openF = () => { f.classList.add('is-open'); $('#scrim').classList.add('is-on'); lenis && lenis.stop(); };
    const closeF = () => { f.classList.remove('is-open'); $('#scrim').classList.remove('is-on'); lenis && lenis.start(); };
    $('#openFilters').addEventListener('click', openF);
    $('#closeFilters').addEventListener('click', closeF);
    $('#applyFilters').addEventListener('click', closeF);
    cleanup.push(closeF);
    draw(true);
  };

  /* ---------- PRODUCT ---------- */
  const deliveryText = () => {
    const now = new Date();
    const cutoff = new Date(); cutoff.setHours(15, 0, 0, 0);
    const after = now > cutoff;
    let d = new Date(); let add = 3 + (after ? 1 : 0);
    while (add > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) add--; }
    const left = after ? null : Math.max(0, cutoff - now);
    const hm = left ? `${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m` : null;
    return `${hm ? `Order within <b>${hm}</b> for delivery by ` : 'Order now for delivery by '}<b>${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</b>`;
  };
  function productReviews(p) {
    const mine = state.reviews[p.id] || [];
    return [...mine, ...D.sampleReviews];
  }
  views.product = (r) => {
    const p = byId(r.params.id);
    if (!p) return views.notfound();
    state.viewed = [p.id, ...state.viewed.filter((x) => x !== p.id)].slice(0, 8);
    save('viewed');
    const wished = state.wish.includes(p.id);
    const related = D.products.filter((x) => x.cat === p.cat && x.id !== p.id).concat(D.products.filter((x) => x.cat !== p.cat)).slice(0, 4);
    const recent = state.viewed.filter((x) => x !== p.id).map(byId).filter(Boolean).slice(0, 4);
    const revs = productReviews(p);
    const dist = [0.78, 0.15, 0.04, 0.02, 0.01];
    return `
    <section class="container pdp" data-id="${p.id}">
      <nav class="crumbs"><a href="#/">Home</a><span>/</span><a href="#/shop?cat=${p.cat}">${catName(p.cat)}</a><span>/</span><b>${esc(p.name)}</b></nav>
      <div class="pdp__grid">
        <div class="gallery">
          <div class="gallery__thumbs">
            <button class="is-on" data-view="0"><img src="${img(p.img)}" alt="" /></button>
            <button data-view="1"><img src="${img(p.img)}" alt="" style="transform:scale(1.9);transform-origin:50% 35%" /></button>
            <button data-view="2"><img src="${img(p.img)}" alt="" style="transform:scale(1.9);transform-origin:50% 75%" /></button>
          </div>
          <div class="gallery__main" id="zoom">
            <img src="${img(p.img)}" alt="${esc(p.name)}" id="mainImg" />
            <div class="gallery__lens" id="lens" style="background-image:url(${img(p.img)})"></div>
            ${p.badges[0] ? `<span class="badge ${p.was ? 'badge--sale' : ''}">${p.badges[0]}</span>` : ''}
            <span class="gallery__hint">Hover to zoom</span>
          </div>
        </div>
        <div class="pdp__info">
          <p class="eyebrow">${catName(p.cat)}</p>
          <h1 class="pdp__title">${esc(p.name)}</h1>
          <p class="pdp__sub">${esc(p.sub)}</p>
          <a href="#reviews" class="pdp__rating" data-scroll="#reviews">${stars(p.rating)} <b>${p.rating}</b> <span>${p.reviews} reviews</span></a>
          <div class="pdp__price"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s><span class="save">Save ${off(p)}%</span>` : ''}</div>
          <p class="pdp__klarna">or 4 interest-free payments of <b>${money(p.price / 4)}</b></p>
          <p class="pdp__desc">${esc(p.desc)}</p>
          <div class="opt"><div class="opt__head"><b>Colour</b><span id="colorName">${esc(p.colors[0].n)}</span></div>
            <div class="opt__colors">${p.colors.map((c, i) => `<button class="${i ? '' : 'is-on'}" data-color="${esc(c.n)}" style="--c:${c.c}" aria-label="${esc(c.n)}"></button>`).join('')}</div></div>
          ${p.sizes ? `<div class="opt"><div class="opt__head"><b>Size</b><button class="link" id="sizeGuide">Size guide</button></div>
            <div class="opt__sizes">${p.sizes.map((s) => `<button data-size="${s}">${s}</button>`).join('')}</div><p class="opt__err" id="sizeErr">Please choose a size</p></div>` : ''}
          <div class="buy">
            <div class="qty"><button data-q="-1" aria-label="Decrease">${icon.minus}</button><input id="qty" type="number" value="1" min="1" max="10" aria-label="Quantity"/><button data-q="1" aria-label="Increase">${icon.plus}</button></div>
            <button class="btn btn--dark btn--lg buy__add" id="pdpAdd">${icon.bag} Add to bag · <span id="pdpTotal">${money(p.price)}</span></button>
            <button class="icon-btn icon-btn--box ${wished ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Save to wishlist">${icon.heart}</button>
          </div>
          <button class="btn btn--outline btn--lg btn--block" id="buyNow">Buy it now</button>
          <div class="stock"><div class="stock__bar"><i style="width:${Math.min(100, p.stock * 4)}%"></i></div><span>${p.stock <= 8 ? `<b class="warn">Only ${p.stock} left</b> in stock, order soon` : 'In stock and ready to ship'}</span></div>
          <div class="ship-box">${icon.truck}<p>${deliveryText()}</p></div>
          <ul class="pdp__perks"><li>${icon.ret} Free 30-day returns</li><li>${icon.shield} ${p.cat === 'watches' ? '2-year warranty' : '1-year quality guarantee'}</li><li>${icon.lock} Secure checkout</li></ul>
          <div class="share"><span>Share</span><button data-share>Copy link</button></div>
        </div>
      </div>

      <div class="tabs" id="pdpTabs">
        <div class="tabs__nav"><button class="is-on" data-tab="desc">Details</button><button data-tab="specs">Specifications</button><button data-tab="ship">Shipping &amp; returns</button><button data-tab="rev" id="reviews">Reviews (${p.reviews + (state.reviews[p.id] || []).length})</button></div>
        <div class="tabs__panel is-on" data-panel="desc"><p>${esc(p.desc)}</p><p>Every VELORA piece is quality-checked by hand before it ships and arrives in recyclable packaging.</p></div>
        <div class="tabs__panel" data-panel="specs"><table class="specs">${Object.entries(p.specs).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('')}<tr><th>SKU</th><td>VL-${p.id.slice(0, 6).toUpperCase()}-${p.price}</td></tr></table></div>
        <div class="tabs__panel" data-panel="ship"><ul class="ticks ticks--dark"><li>${icon.check} Free standard shipping on orders over $75 (4 to 6 business days)</li><li>${icon.check} Express shipping in 1 to 2 business days for $14.95</li><li>${icon.check} Free returns within 30 days, prepaid label included</li><li>${icon.check} Refunds processed within 3 business days of arrival</li></ul></div>
        <div class="tabs__panel" data-panel="rev">
          <div class="rev">
            <div class="rev__sum">
              <b>${p.rating}</b>${stars(p.rating)}<small>Based on ${p.reviews} reviews</small>
              ${dist.map((d, i) => `<div class="rev__bar"><span>${5 - i}★</span><i><em style="width:${d * 100}%"></em></i><small>${Math.round(d * p.reviews)}</small></div>`).join('')}
              <button class="btn btn--outline btn--block" id="writeRev">Write a review</button>
            </div>
            <div class="rev__list" id="revList">
              ${revs.map((x) => `<article class="review"><div class="review__top">${stars(x.stars)}<b>${esc(x.title)}</b></div><p>${esc(x.text)}</p><small>${esc(x.name)}${x.loc ? ' · ' + esc(x.loc) : ''} · <span class="verified">${icon.check} Verified buyer</span></small></article>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section"><div class="container">
      <div class="sec-head"><div><p class="eyebrow">Pairs well with</p><h2 class="h2">You may <em>also like</em></h2></div></div>
      <div class="grid">${related.map(card).join('')}</div>
    </div></section>
    ${recent.length ? `<section class="section section--tint"><div class="container">
      <div class="sec-head"><div><p class="eyebrow">Recently viewed</p><h2 class="h2">Pick up <em>where you left off</em></h2></div></div>
      <div class="grid">${recent.map(card).join('')}</div>
    </div></section>` : ''}

    <div class="sticky-buy" id="stickyBuy">
      <img src="${img(p.img)}" alt="" /><div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div>
      <button class="btn btn--dark" id="stickyAdd">Add to bag</button>
    </div>`;
  };
  views.product.after = (r) => {
    const p = byId(r.params.id);
    if (!p) return;
    const sel = { size: null, color: p.colors[0].n };
    const qty = $('#qty');
    const updTotal = () => ($('#pdpTotal').textContent = money(p.price * (+qty.value || 1)));
    $$('[data-q]').forEach((b) => b.addEventListener('click', () => { qty.value = Math.max(1, Math.min(10, (+qty.value || 1) + +b.dataset.q)); updTotal(); }));
    qty.addEventListener('input', updTotal);
    $$('[data-color]').forEach((b) => b.addEventListener('click', () => { sel.color = b.dataset.color; $('#colorName').textContent = sel.color; $$('[data-color]').forEach((x) => x.classList.toggle('is-on', x === b)); }));
    $$('[data-size]').forEach((b) => b.addEventListener('click', () => { sel.size = b.dataset.size; $$('[data-size]').forEach((x) => x.classList.toggle('is-on', x === b)); $('#sizeErr') && $('#sizeErr').classList.remove('is-on'); }));
    const tryAdd = (el, then) => {
      if (p.sizes && !sel.size) {
        const e = $('#sizeErr'); e.classList.add('is-on');
        if (window.gsap) gsap.fromTo('.opt__sizes', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
        $('.opt__sizes').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      addToCart(p.id, { size: sel.size, color: sel.color, qty: +qty.value || 1 }, el);
      then && setTimeout(then, 600);
    };
    $('#pdpAdd').addEventListener('click', (e) => tryAdd(e.currentTarget));
    $('#stickyAdd').addEventListener('click', (e) => tryAdd(e.currentTarget));
    $('#buyNow').addEventListener('click', (e) => tryAdd(e.currentTarget, () => (location.hash = '#/checkout')));
    // gallery views + zoom lens
    const main = $('#mainImg'), zoom = $('#zoom'), lens = $('#lens');
    const views3 = [['50% 50%', 1], ['50% 35%', 1.9], ['50% 75%', 1.9]];
    $$('[data-view]').forEach((b) => b.addEventListener('click', () => {
      const [o, s] = views3[+b.dataset.view];
      $$('[data-view]').forEach((x) => x.classList.toggle('is-on', x === b));
      main.style.transformOrigin = o; main.style.transform = `scale(${s})`;
    }));
    if (fine) {
      zoom.addEventListener('pointermove', (e) => {
        const r2 = zoom.getBoundingClientRect();
        const x = ((e.clientX - r2.left) / r2.width) * 100, y = ((e.clientY - r2.top) / r2.height) * 100;
        lens.style.backgroundPosition = `${x}% ${y}%`;
        lens.classList.add('is-on');
      });
      zoom.addEventListener('pointerleave', () => lens.classList.remove('is-on'));
    }
    // tabs
    $$('#pdpTabs .tabs__nav button').forEach((b) => b.addEventListener('click', () => {
      $$('#pdpTabs .tabs__nav button').forEach((x) => x.classList.toggle('is-on', x === b));
      $$('#pdpTabs .tabs__panel').forEach((x) => x.classList.toggle('is-on', x.dataset.panel === b.dataset.tab));
    }));
    $('[data-scroll]').addEventListener('click', (e) => {
      e.preventDefault();
      $('#pdpTabs [data-tab=rev]').click();
      const t = $('#pdpTabs');
      lenis ? lenis.scrollTo(t, { offset: -100 }) : t.scrollIntoView({ behavior: 'smooth' });
    });
    $('#sizeGuide') && $('#sizeGuide').addEventListener('click', () => openModal(`
      <div class="mpad"><h3 class="h3">Size guide</h3><p class="muted">Measurements in inches. Between sizes? Size up for a relaxed fit.</p>
      ${p.cat === 'footwear' ? `<table class="specs"><tr><th>US</th><th>UK</th><th>EU</th><th>Foot length</th></tr>${[7, 8, 9, 10, 11, 12].map((s) => `<tr><td>${s}</td><td>${s - 1}</td><td>${s + 33}</td><td>${(9.25 + (s - 7) * 0.33).toFixed(2)}"</td></tr>`).join('')}</table>`
        : `<table class="specs"><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Length</th></tr>${[['S', 36, 30, 27], ['M', 39, 32, 28], ['L', 42, 34, 29], ['XL', 45, 37, 30]].map((x) => `<tr><td>${x[0]}</td><td>${x[1]}"</td><td>${x[2]}"</td><td>${x[3]}"</td></tr>`).join('')}</table>`}</div>`));
    $('[data-share]').addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(location.href); e.target.textContent = 'Link copied'; } catch (err) { e.target.textContent = 'Copy failed'; }
      setTimeout(() => (e.target.textContent = 'Copy link'), 2000);
    });
    // write a review
    $('#writeRev').addEventListener('click', () => {
      openModal(`<form class="mpad form" id="revForm"><h3 class="h3">Review ${esc(p.name)}</h3>
        <div class="rate-pick" id="ratePick">${[1, 2, 3, 4, 5].map((i) => `<button type="button" data-r="${i}" aria-label="${i} stars">★</button>`).join('')}</div>
        <label class="f"><span>Headline</span><input required maxlength="60" id="rvTitle" placeholder="Sum it up in a few words"/></label>
        <label class="f"><span>Your review</span><textarea required maxlength="400" rows="4" id="rvText" placeholder="What did you like? How is the fit?"></textarea></label>
        <label class="f"><span>Name</span><input required maxlength="30" id="rvName" value="${esc(state.user ? state.user.name : '')}"/></label>
        <button class="btn btn--dark btn--block">Post review</button></form>`);
      let rating = 5;
      const paint = () => $$('#ratePick button').forEach((b) => b.classList.toggle('is-on', +b.dataset.r <= rating));
      paint();
      $('#ratePick').addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { rating = +b.dataset.r; paint(); } });
      $('#revForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const rv = { stars: rating, title: $('#rvTitle').value.trim(), text: $('#rvText').value.trim(), name: $('#rvName').value.trim(), loc: 'Just now' };
        state.reviews[p.id] = [rv, ...(state.reviews[p.id] || [])];
        save('reviews');
        closeModal();
        toast('Thanks for your review!', { type: 'ok' });
        renderRoute(true);
        setTimeout(() => $('#pdpTabs [data-tab=rev]').click(), 50);
      });
    });
    // sticky buy bar on scroll (mobile)
    const bar = $('#stickyBuy'), btn = $('#pdpAdd');
    const obs = new IntersectionObserver(([e]) => bar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0));
    obs.observe(btn);
    cleanup.push(() => obs.disconnect());
  };

  /* ---------- CART PAGE ---------- */
  const lineHTML = (l, big) => `
    <div class="line ${big ? 'line--big' : ''}" data-key="${esc(l.key)}">
      <a href="#/product/${l.p.id}" class="line__img"><img src="${img(l.p.img)}" alt="${esc(l.p.name)}" /></a>
      <div class="line__info">
        <a href="#/product/${l.p.id}"><b>${esc(l.p.name)}</b></a>
        <small>${esc(l.color)}${l.size !== 'One size' ? ' · Size ' + esc(l.size) : ''}</small>
        <div class="line__row">
          <div class="qty qty--sm"><button data-dq="-1" aria-label="Decrease">${icon.minus}</button><span>${l.qty}</span><button data-dq="1" aria-label="Increase">${icon.plus}</button></div>
          <button class="line__rm" data-rm aria-label="Remove">${icon.trash}${big ? ' Remove' : ''}</button>
        </div>
      </div>
      <div class="line__price"><b>${money(l.p.price * l.qty)}</b>${l.p.was ? `<s>${money(l.p.was * l.qty)}</s>` : ''}</div>
    </div>`;
  const summaryHTML = (t, opts = {}) => `
    <div class="summary">
      ${opts.items ? `<div class="summary__items">${t.lines.map((l) => `<div class="sitem"><span class="sitem__img"><img src="${img(l.p.img)}" alt=""/><em>${l.qty}</em></span><div><b>${esc(l.p.name)}</b><small>${esc(l.color)}${l.size !== 'One size' ? ' · ' + esc(l.size) : ''}</small></div><span>${money(l.p.price * l.qty)}</span></div>`).join('')}</div>` : ''}
      <form class="coupon" id="couponForm"><input id="couponIn" placeholder="Discount code" value="${state.coupon || ''}" aria-label="Discount code"/><button class="btn btn--outline">${state.coupon ? 'Change' : 'Apply'}</button></form>
      ${state.coupon ? `<div class="coupon__on"><span>${icon.check} <b>${state.coupon}</b> · ${D.coupons[state.coupon].label}</span><button id="couponRm" aria-label="Remove code">${icon.close}</button></div>` : '<p class="fine">Try <b>WELCOME10</b>, <b>VELORA20</b> or <b>FREESHIP</b></p>'}
      ${t.couponNote ? `<p class="fine warn">${t.couponNote}</p>` : ''}
      <div class="summary__rows">
        <div><span>Subtotal</span><b>${money(t.sub)}</b></div>
        ${t.disc ? `<div class="green"><span>Discount</span><b>−${money(t.disc)}</b></div>` : ''}
        <div><span>Shipping${opts.shipName ? ` (${t.method.name})` : ''}</span><b>${t.ship ? money(t.ship) : 'Free'}</b></div>
        <div><span>Estimated tax</span><b>${money(t.tax)}</b></div>
        <div class="total"><span>Total</span><b>${money(t.total)}</b></div>
      </div>
      ${opts.cta || ''}
      <div class="summary__trust">${icon.lock}<span>Secure SSL checkout</span>${icon.ret}<span>30-day returns</span></div>
    </div>`;
  function bindCoupon(rerender) {
    const f = $('#couponForm');
    if (!f) return;
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = $('#couponIn').value.trim().toUpperCase();
      if (!code) return;
      if (!D.coupons[code]) { toast('That code isn’t valid', { type: 'err', sub: 'Check the spelling and try again' }); if (window.gsap) gsap.fromTo(f, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }); return; }
      state.coupon = code; save('coupon');
      toast(`${code} applied`, { type: 'ok', sub: D.coupons[code].label });
      rerender(); renderCart();
    });
    $('#couponRm') && $('#couponRm').addEventListener('click', () => { state.coupon = null; save('coupon'); rerender(); renderCart(); });
  }
  views.cart = () => {
    const t = totals();
    if (!t.lines.length) return `<section class="container empty-page"><div class="empty-page__icon">${icon.bag}</div><h1 class="h1">Your bag is empty</h1><p class="muted">Looks like you haven’t added anything yet.</p><a href="#/shop" class="btn btn--dark btn--lg">Start shopping ${icon.arrow}</a></section>`;
    return `
    <section class="page-head"><div class="container"><nav class="crumbs"><a href="#/">Home</a><span>/</span><b>Bag</b></nav><h1 class="h1">Your bag <small>(${cartQty()})</small></h1></div></section>
    <section class="container cart-page">
      <div class="cart-page__lines">${shipMeterHTML(t)}${t.lines.map((l) => lineHTML(l, true)).join('')}
        <a href="#/shop" class="link">${icon.arrow} Continue shopping</a></div>
      ${summaryHTML(t, { cta: `<a href="#/checkout" class="btn btn--dark btn--lg btn--block">Checkout · ${money(t.total)}</a><div class="express"><span>Express checkout</span><div><button class="xpay xpay--apple" data-xpay> Pay</button><button class="xpay xpay--paypal" data-xpay>PayPal</button></div></div>` })}
    </section>`;
  };
  views.cart.after = () => bindCoupon(() => renderRoute(true));

  /* ---------- CHECKOUT ---------- */
  const ck = { step: 1, info: {}, ship: 'standard' };
  const US_STATES = ['AL', 'AZ', 'CA', 'CO', 'CT', 'FL', 'GA', 'IL', 'MA', 'MD', 'MI', 'MN', 'NC', 'NJ', 'NV', 'NY', 'OH', 'OR', 'PA', 'TN', 'TX', 'UT', 'VA', 'WA'];
  views.checkout = () => {
    const t = totals(ck.ship);
    if (!t.lines.length) return views.cart();
    const i = ck.info;
    const stepCls = (n) => (ck.step === n ? 'is-on' : ck.step > n ? 'is-done' : '');
    return `
    <section class="container checkout">
      <div class="checkout__main">
        <nav class="crumbs"><a href="#/cart">Bag</a><span>/</span><b>Checkout</b></nav>
        <ol class="steps"><li class="${stepCls(1)}"><span>1</span>Information</li><li class="${stepCls(2)}"><span>2</span>Shipping</li><li class="${stepCls(3)}"><span>3</span>Payment</li></ol>
        <div class="express express--top"><span>Express checkout</span><div><button class="xpay xpay--apple" data-xpay> Pay</button><button class="xpay xpay--paypal" data-xpay>PayPal</button><button class="xpay xpay--gpay" data-xpay>G Pay</button></div></div>
        <div class="or"><span>or continue below</span></div>

        <form class="cstep ${stepCls(1)}" id="step1" novalidate>
          <div class="cstep__head"><h3>Contact &amp; delivery</h3>${ck.step > 1 ? `<button type="button" class="link" data-edit="1">Edit</button>` : ''}</div>
          ${ck.step > 1 ? `<p class="cstep__sum">${esc(i.email)}<br/>${esc(i.first)} ${esc(i.last)}, ${esc(i.address)}, ${esc(i.city)}, ${esc(i.state)} ${esc(i.zip)}</p>` : `
          <div class="fgrid">
            <label class="f f--full"><span>Email</span><input type="email" name="email" required autocomplete="email" value="${esc(i.email || (state.user ? state.user.email : ''))}"/></label>
            <label class="f"><span>First name</span><input name="first" required autocomplete="given-name" value="${esc(i.first || (state.user ? state.user.name.split(' ')[0] : ''))}"/></label>
            <label class="f"><span>Last name</span><input name="last" required autocomplete="family-name" value="${esc(i.last || '')}"/></label>
            <label class="f f--full"><span>Address</span><input name="address" required autocomplete="address-line1" placeholder="Street and number" value="${esc(i.address || '')}"/></label>
            <label class="f"><span>City</span><input name="city" required autocomplete="address-level2" value="${esc(i.city || '')}"/></label>
            <label class="f"><span>State</span><select name="state" required>${US_STATES.map((s) => `<option ${s === (i.state || 'NY') ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
            <label class="f"><span>ZIP code</span><input name="zip" required pattern="\\d{5}" inputmode="numeric" maxlength="5" autocomplete="postal-code" value="${esc(i.zip || '')}"/></label>
            <label class="f"><span>Phone</span><input name="phone" type="tel" required autocomplete="tel" placeholder="(555) 123-4567" value="${esc(i.phone || '')}"/></label>
          </div>
          <label class="check check--inline"><input type="checkbox" checked/><span>Email me with news and offers</span></label>
          <button class="btn btn--dark btn--lg">Continue to shipping ${icon.arrow}</button>`}
        </form>

        <form class="cstep ${stepCls(2)}" id="step2">
          <div class="cstep__head"><h3>Shipping method</h3>${ck.step > 2 ? `<button type="button" class="link" data-edit="2">Edit</button>` : ''}</div>
          ${ck.step === 2 ? `<div class="radios">${D.shipping.map((s) => { const tt = totals(s.id); return `<label class="radio"><input type="radio" name="ship" value="${s.id}" ${ck.ship === s.id ? 'checked' : ''}/><span class="radio__dot"></span><div><b>${s.name}</b><small>${s.eta}</small></div><em>${tt.ship ? money(tt.ship) : 'Free'}</em></label>`; }).join('')}</div>
          <button class="btn btn--dark btn--lg">Continue to payment ${icon.arrow}</button>`
            : ck.step > 2 ? `<p class="cstep__sum">${t.method.name} · ${t.method.eta} · ${t.ship ? money(t.ship) : 'Free'}</p>` : ''}
        </form>

        <form class="cstep ${stepCls(3)}" id="step3" novalidate>
          <div class="cstep__head"><h3>Payment</h3><span class="secure">${icon.lock} Encrypted</span></div>
          ${ck.step === 3 ? `
          <div class="demo-note">Demo checkout: use test card <b>4242 4242 4242 4242</b>, any future date and any CVC. Nothing is charged and card details are never stored.</div>
          <div class="cardui">
            <div class="cardui__card" id="cardVis"><span class="cardui__brand" id="cardBrand">CARD</span><span class="cardui__chip"></span><b id="cardNumV">•••• •••• •••• ••••</b><div><small>Card holder</small><span id="cardNameV">YOUR NAME</span></div><div><small>Expires</small><span id="cardExpV">MM/YY</span></div></div>
          </div>
          <div class="fgrid">
            <label class="f f--full"><span>Card number</span><input id="ccNum" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234" maxlength="19" required/></label>
            <label class="f"><span>Expiry</span><input id="ccExp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5" required/></label>
            <label class="f"><span>CVC</span><input id="ccCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4" required/></label>
            <label class="f f--full"><span>Name on card</span><input id="ccName" autocomplete="cc-name" required value="${esc((i.first || '') + ' ' + (i.last || ''))}"/></label>
          </div>
          <label class="check check--inline"><input type="checkbox" checked/><span>Billing address same as shipping</span></label>
          <button class="btn btn--dark btn--lg btn--block" id="placeOrder">${icon.lock} Pay ${money(t.total)}</button>` : ''}
        </form>
      </div>
      <aside class="checkout__side">${summaryHTML(t, { items: true, shipName: true })}</aside>
    </section>`;
  };
  views.checkout.after = () => {
    bindCoupon(() => renderRoute(true));
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => { ck.step = +b.dataset.edit; renderRoute(true); }));
    const s1 = $('#step1');
    if (ck.step === 1) s1.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('input[required], select[required]', s1).forEach((f) => { const bad = !f.checkValidity(); f.closest('.f').classList.toggle('is-err', bad); if (bad) ok = false; });
      if (!ok) { toast('Please complete the highlighted fields', { type: 'err' }); return; }
      ck.info = Object.fromEntries(new FormData(s1));
      ck.step = 2; renderRoute(true);
    });
    const s2 = $('#step2');
    if (ck.step === 2) {
      s2.addEventListener('change', (e) => { if (e.target.name === 'ship') { ck.ship = e.target.value; const side = $('.checkout__side'); side.innerHTML = summaryHTML(totals(ck.ship), { items: true, shipName: true }); bindCoupon(() => renderRoute(true)); } });
      s2.addEventListener('submit', (e) => { e.preventDefault(); ck.step = 3; renderRoute(true); });
    }
    if (ck.step === 3) {
      const num = $('#ccNum'), exp = $('#ccExp'), cvc = $('#ccCvc'), name = $('#ccName');
      const brand = (n) => (/^4/.test(n) ? 'VISA' : /^5[1-5]/.test(n) ? 'MASTERCARD' : /^3[47]/.test(n) ? 'AMEX' : /^6/.test(n) ? 'DISCOVER' : 'CARD');
      const paint = () => {
        const d = num.value.replace(/\D/g, '');
        $('#cardNumV').textContent = (d + '•'.repeat(Math.max(0, 16 - d.length))).replace(/(.{4})/g, '$1 ').trim();
        $('#cardBrand').textContent = brand(d);
        $('#cardNameV').textContent = name.value.trim().toUpperCase() || 'YOUR NAME';
        $('#cardExpV').textContent = exp.value || 'MM/YY';
      };
      num.addEventListener('input', () => { num.value = num.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); paint(); });
      exp.addEventListener('input', () => { let v = exp.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); exp.value = v; paint(); });
      cvc.addEventListener('input', () => { cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4); });
      cvc.addEventListener('focus', () => $('#cardVis').classList.add('is-flip'));
      cvc.addEventListener('blur', () => $('#cardVis').classList.remove('is-flip'));
      name.addEventListener('input', paint);
      paint();
      const luhn = (s) => { let sum = 0, alt = false; for (let k = s.length - 1; k >= 0; k--) { let n = +s[k]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; };
      $('#step3').addEventListener('submit', (e) => {
        e.preventDefault();
        const d = num.value.replace(/\D/g, '');
        const [mm, yy] = exp.value.split('/').map(Number);
        const now = new Date(); const expOk = mm >= 1 && mm <= 12 && yy && new Date(2000 + yy, mm) > now;
        const checks = [[num, d.length >= 15 && luhn(d)], [exp, expOk], [cvc, cvc.value.length >= 3], [name, name.value.trim().length > 1]];
        checks.forEach(([f, ok]) => f.closest('.f').classList.toggle('is-err', !ok));
        if (checks.some(([, ok]) => !ok)) { toast('Check your card details', { type: 'err', sub: 'Tip: use test card 4242 4242 4242 4242' }); return; }
        placeOrder({ method: `${brand(d)} ending ${d.slice(-4)}` });
      });
    }
    $$('[data-xpay]').forEach((b) => b.addEventListener('click', () => {
      if (!ck.info.email) { toast('Add your contact details first', { type: 'err', sub: 'Express pay is simulated in this demo' }); return; }
      placeOrder({ method: b.textContent.trim() });
    }));
  };
  function placeOrder({ method }) {
    const btn = $('#placeOrder');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Processing payment…'; }
    const t = totals(ck.ship);
    setTimeout(() => {
      const id = 'VL' + Math.floor(100000 + Math.random() * 900000);
      const order = {
        id, date: new Date().toISOString(), items: t.lines.map((l) => ({ id: l.id, name: l.p.name, img: l.p.img, qty: l.qty, size: l.size, color: l.color, price: l.p.price })),
        sub: t.sub, disc: t.disc, ship: t.ship, tax: t.tax, total: t.total, currency: state.currency, method, shipping: t.method.name, to: { ...ck.info }, coupon: state.coupon,
      };
      state.orders = [order, ...state.orders];
      state.cart = []; state.coupon = null;
      save('orders', 'cart', 'coupon');
      ck.step = 1;
      renderCart();
      location.hash = '#/order/' + id;
    }, 1600);
  }

  /* ---------- ORDER CONFIRMATION ---------- */
  views.order = (r) => {
    const o = state.orders.find((x) => x.id === r.params.id);
    if (!o) return views.notfound();
    const eta = new Date(o.date); eta.setDate(eta.getDate() + (o.shipping === 'Express' ? 2 : 5));
    const hrs = (Date.now() - new Date(o.date)) / 3600000;
    const stage = hrs > 48 ? 3 : hrs > 6 ? 2 : 1;
    return `
    <section class="container success">
      <canvas id="confetti"></canvas>
      <div class="success__icon">${icon.check}</div>
      <p class="eyebrow">Order ${o.id}</p>
      <h1 class="h1">Thank you${o.to.first ? ', ' + esc(o.to.first) : ''}!</h1>
      <p class="muted">Your order is confirmed. A receipt is on its way to <b>${esc(o.to.email || 'your inbox')}</b>.</p>
      <ol class="track"><li class="is-done"><span></span>Confirmed</li><li class="${stage >= 2 ? 'is-done' : ''}"><span></span>Packed</li><li class="${stage >= 3 ? 'is-done' : ''}"><span></span>Shipped</li><li><span></span>Delivered by ${eta.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</li></ol>
      <div class="success__grid">
        <div class="success__box"><h4>Items</h4>${o.items.map((it) => `<div class="sitem"><span class="sitem__img"><img src="${img(it.img)}" alt=""/><em>${it.qty}</em></span><div><b>${esc(it.name)}</b><small>${esc(it.color)}${it.size !== 'One size' ? ' · ' + esc(it.size) : ''}</small></div><span>${money(it.price * it.qty)}</span></div>`).join('')}</div>
        <div class="success__box"><h4>Details</h4>
          <dl><dt>Ship to</dt><dd>${esc(o.to.first || '')} ${esc(o.to.last || '')}<br/>${esc(o.to.address || '')}<br/>${esc(o.to.city || '')} ${esc(o.to.state || '')} ${esc(o.to.zip || '')}</dd>
          <dt>Delivery</dt><dd>${o.shipping}</dd><dt>Payment</dt><dd>${esc(o.method)}</dd>
          <dt>Total</dt><dd><b>${money(o.total)}</b>${o.disc ? ` <small class="green">(saved ${money(o.disc)})</small>` : ''}</dd></dl>
        </div>
      </div>
      <div class="success__cta"><a href="#/shop" class="btn btn--dark btn--lg">Continue shopping</a><a href="#/account" class="btn btn--outline btn--lg">View my orders</a></div>
    </section>`;
  };
  views.order.after = () => {
    const c = $('#confetti'); if (!c || reduced) return;
    const ctx = c.getContext('2d');
    const W = (c.width = c.offsetWidth * devicePixelRatio), H = (c.height = c.offsetHeight * devicePixelRatio);
    const cols = ['#e8c9a0', '#111111', '#c2703d', '#7a8c6e', '#e9e4dc'];
    const bits = Array.from({ length: 140 }, () => ({ x: W / 2, y: H * 0.25, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 20 - 6, r: Math.random() * 6 + 4, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 }));
    let raf, t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      bits.forEach((b) => { b.vy += 0.5; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.a += b.va; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); ctx.restore(); });
      if (++t < 220) raf = requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    };
    tick();
    cleanup.push(() => cancelAnimationFrame(raf));
  };

  /* ---------- WISHLIST ---------- */
  views.wishlist = () => {
    const list = state.wish.map(byId).filter(Boolean);
    return `
    <section class="page-head"><div class="container"><nav class="crumbs"><a href="#/">Home</a><span>/</span><b>Wishlist</b></nav><h1 class="h1">Wishlist <small>(${list.length})</small></h1></div></section>
    <section class="container section section--flush">
      ${list.length ? `<div class="grid">${list.map(card).join('')}</div><div class="center"><button class="btn btn--dark btn--lg" id="wishAll">${icon.bag} Add all to bag</button></div>`
        : `<div class="empty-page"><div class="empty-page__icon">${icon.heart}</div><h2 class="h2">Nothing saved yet</h2><p class="muted">Tap the heart on any product to save it here.</p><a href="#/shop" class="btn btn--dark btn--lg">Discover products</a></div>`}
    </section>`;
  };
  views.wishlist.after = () => {
    $('#wishAll') && $('#wishAll').addEventListener('click', (e) => {
      const list = state.wish.map(byId).filter(Boolean);
      list.forEach((p, i) => setTimeout(() => addToCart(p.id, { size: p.sizes ? p.sizes[Math.floor(p.sizes.length / 2)] : null }, i ? null : e.currentTarget), i * 180));
    });
  };

  /* ---------- ACCOUNT ---------- */
  views.account = () => {
    const u = state.user;
    const orders = state.orders;
    if (!u) return `
    <section class="container auth">
      <div class="auth__art"><img src="${img('riviera-knit-set')}" alt="" /><div><h2 class="h2 h2--light">Members get<br/><em>more.</em></h2><ul class="ticks"><li>${icon.check} Early access to every drop</li><li>${icon.check} Free express shipping over $150</li><li>${icon.check} Birthday reward and order tracking</li></ul></div></div>
      <div class="auth__box">
        <div class="pills pills--full" id="authTabs"><button class="is-on" data-a="in">Sign in</button><button data-a="up">Create account</button></div>
        <form class="form" id="authForm">
          <label class="f auth__name" hidden><span>Full name</span><input name="name" autocomplete="name"/></label>
          <label class="f"><span>Email</span><input name="email" type="email" required autocomplete="email"/></label>
          <label class="f"><span>Password</span><input name="password" type="password" required minlength="6" autocomplete="current-password"/></label>
          <button class="btn btn--dark btn--lg btn--block" id="authBtn">Sign in</button>
          <p class="fine">Demo accounts live only in this browser. Passwords are never saved.</p>
        </form>
        ${orders.length ? `<div class="guest-orders"><h4>Recent orders on this device</h4>${orders.slice(0, 3).map((o) => `<a href="#/order/${o.id}" class="orow"><b>${o.id}</b><span>${new Date(o.date).toLocaleDateString('en-US')}</span><span>${money(o.total)}</span></a>`).join('')}</div>` : ''}
      </div>
    </section>`;
    return `
    <section class="page-head"><div class="container"><nav class="crumbs"><a href="#/">Home</a><span>/</span><b>Account</b></nav><h1 class="h1">Hello, <em>${esc(u.name.split(' ')[0])}</em></h1><p class="muted">${esc(u.email)} · Member since ${new Date(u.since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p></div></section>
    <section class="container account">
      <div class="account__stats">
        <div><b>${orders.length}</b><small>Orders</small></div>
        <div><b>${state.wish.length}</b><small>Wishlist</small></div>
        <div><b>${Math.round(orders.reduce((s, o) => s + o.total, 0))}</b><small>Reward points</small></div>
        <div><b>${orders.length >= 3 ? 'Gold' : 'Silver'}</b><small>Member tier</small></div>
      </div>
      <h2 class="h3">Order history</h2>
      ${orders.length ? `<div class="orders">${orders.map((o) => `
        <a href="#/order/${o.id}" class="order">
          <div class="order__imgs">${o.items.slice(0, 3).map((it) => `<img src="${img(it.img)}" alt=""/>`).join('')}</div>
          <div><b>${o.id}</b><small>${new Date(o.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${o.items.reduce((n, it) => n + it.qty, 0)} items</small></div>
          <span class="status">${(Date.now() - new Date(o.date)) / 3600000 > 48 ? 'Shipped' : 'Processing'}</span>
          <b>${money(o.total)}</b>
        </a>`).join('')}</div>` : `<p class="muted">No orders yet. <a class="link" href="#/shop">Start shopping</a></p>`}
      <button class="btn btn--outline" id="logout">Sign out</button>
    </section>`;
  };
  views.account.after = () => {
    const f = $('#authForm');
    if (f) {
      let mode = 'in';
      $('#authTabs').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        mode = b.dataset.a;
        $$('#authTabs button').forEach((x) => x.classList.toggle('is-on', x === b));
        $('.auth__name').hidden = mode === 'in';
        $('.auth__name input').required = mode === 'up';
        $('#authBtn').textContent = mode === 'in' ? 'Sign in' : 'Create account';
      });
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(f);
        const email = String(fd.get('email'));
        const name = String(fd.get('name') || '') || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        state.user = { name, email, since: Date.now() };
        save('user');
        toast(mode === 'in' ? 'Welcome back!' : 'Account created', { type: 'ok', sub: 'Your bag and wishlist are synced' });
        renderRoute(true);
      });
    }
    $('#logout') && $('#logout').addEventListener('click', () => { state.user = null; save('user'); toast('Signed out'); renderRoute(true); });
  };

  /* ---------- INFO PAGES ---------- */
  const INFO = {
    shipping: ['Shipping', '<p>Orders placed before 3pm ET on business days ship the same day. Standard shipping takes 4 to 6 business days and is free over $75. Express arrives in 1 to 2 business days for $14.95.</p><p>We ship to all 50 US states. International shipping is coming soon.</p>'],
    returns: ['Returns', '<p>Changed your mind? Return unworn items within 30 days for a full refund. Every order includes a prepaid return label.</p><p>Refunds are processed within 3 business days after your parcel arrives back with us.</p>'],
    faq: ['FAQ', ['How long does delivery take?|Standard: 4 to 6 business days. Express: 1 to 2 business days.', 'Can I change my order?|Yes, within one hour of placing it. Contact us with your order number.', 'Do watches come with a warranty?|Every watch has a 2-year warranty covering movement defects.', 'How do discount codes work?|Enter the code in your bag or at checkout. One code per order.'].map((q) => { const [a, b] = q.split('|'); return `<details class="faq"><summary>${a}</summary><p>${b}</p></details>`; }).join('')],
    contact: ['Contact', '<p>Our team replies within 24 hours, seven days a week.</p><form class="form" data-contact><label class="f"><span>Name</span><input required/></label><label class="f"><span>Email</span><input type="email" required/></label><label class="f"><span>Message</span><textarea rows="4" required></textarea></label><button class="btn btn--dark">Send message</button></form>'],
    privacy: ['Privacy', '<p>This is a demo storefront. Everything you enter stays in your own browser (localStorage) and is never sent to a server.</p>'],
    terms: ['Terms', '<p>Demo storefront for portfolio purposes. Products, prices and reviews are illustrative, and no real orders are fulfilled.</p>'],
  };
  views.info = (r) => {
    const pg = INFO[r.params.id];
    if (!pg) return views.notfound();
    return `<section class="page-head"><div class="container"><nav class="crumbs"><a href="#/">Home</a><span>/</span><b>${pg[0]}</b></nav><h1 class="h1">${pg[0]}</h1></div></section><section class="container prose">${pg[1]}</section>`;
  };
  views.info.after = () => {
    const f = $('[data-contact]');
    f && f.addEventListener('submit', (e) => { e.preventDefault(); f.reset(); toast('Message sent', { type: 'ok', sub: 'We’ll reply within 24 hours' }); });
  };

  views.notfound = () => `<section class="container empty-page"><h1 class="h1">Page not found</h1><p class="muted">The page you’re looking for has moved or never existed.</p><a href="#/" class="btn btn--dark btn--lg">Back home</a></section>`;

  /* ================= CART DRAWER ================= */
  function shipMeterHTML(t) {
    const left = D.freeShippingAt - (t.sub - t.disc);
    const pct = Math.min(100, ((t.sub - t.disc) / D.freeShippingAt) * 100);
    return `<div class="meter"><p>${left > 0 ? `You’re <b>${money(left)}</b> away from free shipping` : `${icon.check} You’ve unlocked <b>free shipping</b>`}</p><div class="meter__bar"><i style="width:${pct}%"></i></div></div>`;
  }
  function renderCart() {
    const t = totals();
    $('#shipMeter').innerHTML = t.lines.length ? shipMeterHTML(t) : '';
    if (!t.lines.length) {
      $('#cartItems').innerHTML = `<div class="drawer__empty">${icon.bag}<h4>Your bag is empty</h4><p>Discover something you’ll love.</p><a href="#/shop" class="btn btn--dark">Shop now</a></div>`;
      $('#cartFoot').innerHTML = '';
    } else {
      const inCart = new Set(t.lines.map((l) => l.id));
      const ups = D.products.filter((p) => !inCart.has(p.id) && !p.sizes).slice(0, 2);
      $('#cartItems').innerHTML = t.lines.map((l) => lineHTML(l)).join('') + (ups.length ? `
        <div class="upsell"><h5>Complete your order</h5>${ups.map((p) => `<div class="upsell__item" data-card><img src="${img(p.img)}" alt=""/><div><b>${esc(p.name)}</b><span>${money(p.price)}</span></div><button class="btn btn--outline btn--sm" data-add="${p.id}">Add</button></div>`).join('')}</div>` : '');
      $('#cartFoot').innerHTML = `
        ${t.disc ? `<div class="row green"><span>Discount (${state.coupon})</span><b>−${money(t.disc)}</b></div>` : ''}
        <div class="row"><span>Subtotal</span><b>${money(t.sub - t.disc)}</b></div>
        <p class="fine">Shipping and taxes calculated at checkout.</p>
        <a href="#/checkout" class="btn btn--dark btn--lg btn--block">Checkout · ${money(t.sub - t.disc)}</a>
        <a href="#/cart" class="btn btn--outline btn--block">View bag</a>`;
    }
    syncCounts();
  }

  /* ================= OVERLAYS ================= */
  const scrim = $('#scrim');
  function openDrawer(el) { closeAll(); el.classList.add('is-open'); scrim.classList.add('is-on'); lenis && lenis.stop(); document.documentElement.classList.add('no-scroll'); }
  function closeAll() {
    $$('.drawer.is-open, .filters.is-open').forEach((d) => d.classList.remove('is-open'));
    $('#search').classList.remove('is-open');
    closeModal(true);
    scrim.classList.remove('is-on');
    document.documentElement.classList.remove('no-scroll');
    lenis && lenis.start();
  }
  function openModal(html, cls = '') {
    const m = $('#modal');
    $('#modalBox').className = 'modal__box ' + cls;
    $('#modalBox').innerHTML = `<button class="icon-btn modal__x" data-close aria-label="Close">${icon.close}</button>${html}`;
    m.classList.add('is-open'); m.setAttribute('aria-hidden', 'false');
    scrim.classList.add('is-on'); lenis && lenis.stop();
    document.documentElement.classList.add('no-scroll');
  }
  function closeModal(silent) {
    const m = $('#modal');
    if (!m.classList.contains('is-open')) return;
    m.classList.remove('is-open'); m.setAttribute('aria-hidden', 'true');
    if (!silent) { scrim.classList.remove('is-on'); lenis && lenis.start(); document.documentElement.classList.remove('no-scroll'); }
  }
  function quickView(id, note) {
    const p = byId(id);
    if (!p) return;
    openModal(`
      <div class="qv">
        <div class="qv__img"><img src="${img(p.img)}" alt="${esc(p.name)}"/>${p.badges[0] ? `<span class="badge ${p.was ? 'badge--sale' : ''}">${p.badges[0]}</span>` : ''}</div>
        <div class="qv__info">
          <p class="eyebrow">${catName(p.cat)}</p>
          <h3 class="h3">${esc(p.name)}</h3>
          <p class="muted">${esc(p.sub)}</p>
          <div class="pdp__rating">${stars(p.rating)} <b>${p.rating}</b> <span>${p.reviews} reviews</span></div>
          <div class="pdp__price"><b>${money(p.price)}</b>${p.was ? `<s>${money(p.was)}</s><span class="save">Save ${off(p)}%</span>` : ''}</div>
          <p class="qv__desc">${esc(p.desc)}</p>
          ${p.colors.length > 1 ? `<div class="opt"><div class="opt__head"><b>Colour</b><span id="qvColorName">${esc(p.colors[0].n)}</span></div><div class="opt__colors">${p.colors.map((c, i) => `<button class="${i ? '' : 'is-on'}" data-qvcolor="${esc(c.n)}" style="--c:${c.c}" aria-label="${esc(c.n)}"></button>`).join('')}</div></div>` : ''}
          ${p.sizes ? `<div class="opt"><div class="opt__head"><b>Size</b>${note ? `<span class="warn">${note}</span>` : ''}</div><div class="opt__sizes">${p.sizes.map((s) => `<button data-qvsize="${s}">${s}</button>`).join('')}</div></div>` : ''}
          <div class="buy"><button class="btn btn--dark btn--lg buy__add" id="qvAdd">${icon.bag} Add to bag</button><button class="icon-btn icon-btn--box ${state.wish.includes(p.id) ? 'is-on' : ''}" data-wish="${p.id}" aria-label="Save to wishlist">${icon.heart}</button></div>
          <a href="#/product/${p.id}" class="link">View full details ${icon.arrow}</a>
        </div>
      </div>`, 'modal__box--wide');
    const sel = { size: null, color: p.colors[0].n };
    $$('[data-qvsize]').forEach((b) => b.addEventListener('click', () => { sel.size = b.dataset.qvsize; $$('[data-qvsize]').forEach((x) => x.classList.toggle('is-on', x === b)); }));
    $$('[data-qvcolor]').forEach((b) => b.addEventListener('click', () => { sel.color = b.dataset.qvcolor; $('#qvColorName').textContent = sel.color; $$('[data-qvcolor]').forEach((x) => x.classList.toggle('is-on', x === b)); }));
    $('#qvAdd').addEventListener('click', (e) => {
      if (p.sizes && !sel.size) { if (window.gsap) gsap.fromTo('.qv .opt__sizes', { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' }); return; }
      addToCart(p.id, sel, e.currentTarget);
      setTimeout(closeAll, 350);
    });
  }

  /* ---------------- search ---------------- */
  const sIn = $('#searchInput');
  function openSearch() { closeAll(); $('#search').classList.add('is-open'); scrim.classList.add('is-on'); lenis && lenis.stop(); setTimeout(() => sIn.focus(), 60); drawSearch(); }
  function drawSearch() {
    const q = sIn.value.trim().toLowerCase();
    const res = $('#searchResults');
    if (!q) {
      const recent = state.viewed.map(byId).filter(Boolean).slice(0, 4);
      res.innerHTML = `<h5>${recent.length ? 'Recently viewed' : 'Trending'}</h5><div class="sres">${(recent.length ? recent : D.products.slice(0, 4)).map(sItem).join('')}</div>`;
      return;
    }
    const list = D.products.filter((p) => `${p.name} ${p.sub} ${catName(p.cat)} ${p.desc}`.toLowerCase().includes(q));
    const cats = D.categories.filter((c) => c.name.toLowerCase().includes(q));
    res.innerHTML = `${cats.length ? `<div class="scats">${cats.map((c) => `<a href="#/shop?cat=${c.id}">${c.name} ${icon.arrow}</a>`).join('')}</div>` : ''}
      ${list.length ? `<h5>${list.length} product${list.length > 1 ? 's' : ''}</h5><div class="sres">${list.slice(0, 6).map(sItem).join('')}</div><a class="btn btn--outline btn--block" href="#/shop?q=${encodeURIComponent(q)}">See all results for “${esc(q)}”</a>`
        : `<p class="muted">No results for “${esc(q)}”. Try “watch”, “sneaker” or “cap”.</p>`}`;
  }
  const sItem = (p) => `<a class="sitem2" href="#/product/${p.id}"><img src="${img(p.img)}" alt=""/><div><b>${esc(p.name)}</b><small>${esc(p.sub)}</small></div><span>${money(p.price)}</span></a>`;
  sIn.addEventListener('input', drawSearch);
  sIn.addEventListener('keydown', (e) => { if (e.key === 'Enter' && sIn.value.trim()) location.hash = '#/shop?q=' + encodeURIComponent(sIn.value.trim()); });
  $('#searchHints').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { sIn.value = b.textContent; drawSearch(); } });

  /* ---------------- global delegated events ---------------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    const add = t.closest('[data-add]');
    if (add) { e.preventDefault(); const p = byId(add.dataset.add); if (p && p.sizes) quickView(p.id); else addToCart(add.dataset.add, {}, add); return; }
    const wish = t.closest('[data-wish]');
    if (wish) { e.preventDefault(); toggleWish(wish.dataset.wish, wish); return; }
    const qv = t.closest('[data-qv]');
    if (qv) { e.preventDefault(); quickView(qv.dataset.qv); return; }
    const line = t.closest('.line');
    if (line) {
      const key = line.dataset.key;
      const l = state.cart.find((x) => x.key === key);
      if (t.closest('[data-dq]') && l) { setQty(key, l.qty + +t.closest('[data-dq]').dataset.dq); return; }
      if (t.closest('[data-rm]')) {
        if (window.gsap) gsap.to(line, { x: 40, autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, onComplete: () => setQty(key, 0) });
        else setQty(key, 0);
        return;
      }
    }
    if (t.closest('[data-close]') || t === scrim || t === $('#modal') || t === $('#search')) { closeAll(); return; }
    const link = t.closest('a[href^="#/"]');
    if (link && link.getAttribute('href') === location.hash) { e.preventDefault(); closeAll(); renderRoute(); return; }
    if (link && (t.closest('.drawer') || t.closest('.search'))) closeAll();
  });
  // clear a field's error state as soon as the shopper edits it
  document.addEventListener('input', (e) => { const f = e.target.closest && e.target.closest('.f.is-err'); if (f) f.classList.remove('is-err'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
  $('#openCart').addEventListener('click', () => openDrawer($('#cartDrawer')));
  $('#tabCart').addEventListener('click', () => openDrawer($('#cartDrawer')));
  $('#burger').addEventListener('click', () => openDrawer($('#menuDrawer')));
  $('#openSearch').addEventListener('click', openSearch);
  $('#currency').value = state.currency;
  $('#currency').addEventListener('change', (e) => { state.currency = e.target.value; save('currency'); renderCart(); renderRoute(true); toast(`Prices now shown in ${state.currency}`); });
  $$('[data-newsletter]').forEach((f) => f.addEventListener('submit', (e) => { e.preventDefault(); f.reset(); toast('You’re on the list', { type: 'ok', sub: 'Check your inbox for 10% off' }); }));

  // header state on scroll
  let lastY = 0;
  const header = $('#header');
  addEventListener('scroll', () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    header.classList.toggle('is-hidden', y > 400 && y > lastY + 2 && !document.documentElement.classList.contains('no-scroll'));
    if (y < lastY - 2) header.classList.remove('is-hidden');
    lastY = y;
    document.body.classList.toggle('on-hero', route.name === 'home' && y < innerHeight * 0.8);
  }, { passive: true });

  // countdowns
  setInterval(() => {
    $$('[data-countdown]').forEach((el) => {
      let s = Math.max(0, Math.floor((+el.dataset.countdown - Date.now()) / 1000));
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60); s %= 60;
      const set = (u, v) => { const b = el.querySelector(`[data-u="${u}"]`); if (b) b.textContent = String(v).padStart(2, '0'); };
      set('d', d); set('h', el.querySelector('[data-u="d"]') ? h : h + d * 24); set('m', m); set('s', s);
    });
  }, 1000);

  // magnetic buttons
  if (fine && window.gsap && !reduced) {
    document.addEventListener('pointermove', (e) => {
      const m = e.target.closest && e.target.closest('.magnetic');
      if (!m) return;
      const r = m.getBoundingClientRect();
      gsap.to(m, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.4 });
    });
    document.addEventListener('pointerout', (e) => { const m = e.target.closest && e.target.closest('.magnetic'); if (m && !m.contains(e.relatedTarget)) gsap.to(m, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.4)' }); });
  }

  /* ---------------- smooth scroll + boot ---------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, prevent: (node) => !!node.closest && !!node.closest('[data-lenis-prevent], .drawer, .modal, .search, .filters') });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  renderCart();
  if (!location.hash) history.replaceState(null, '', '#/');
  renderRoute(true);
  document.body.classList.toggle('on-hero', route.name === 'home');

  // loader
  const bar = $('#loaderBar');
  let prog = 0;
  const imgs = $$('img', app).slice(0, 10);
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    bar.style.width = '100%';
    setTimeout(() => {
      $('#loader').classList.add('is-done');
      setTimeout(() => $('#loader').remove(), 900);
    }, 250);
  };
  let loaded = 0;
  imgs.forEach((im) => { if (im.complete) loaded++; else im.addEventListener('load', () => { loaded++; bar.style.width = (loaded / imgs.length) * 100 + '%'; if (loaded >= imgs.length) done(); }, { once: true }); });
  bar.style.width = (loaded / Math.max(1, imgs.length)) * 100 + '%';
  if (loaded >= imgs.length) setTimeout(done, 400);
  setTimeout(done, 3500);
})();
