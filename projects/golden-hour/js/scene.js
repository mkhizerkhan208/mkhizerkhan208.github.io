/* =========================================================
   Golden Hour · Hero 3D scene (Three.js)
   The real "pour" photograph turned into a living 3D shot:
   - a hand-built depth map drives per-pixel parallax, so the
     scoop, cup, saucer and bean pile move at different depths
   - the chocolate splash ripples like liquid
   - real 3D coffee beans keep pouring from the scoop; each one
     that lands kicks up chocolate droplets
   - a few beans float in front of the frame for a pop-out feel
   The photo is embedded as a data URI (js/hero-photo.js) so it
   can be used as a WebGL texture even from file://.
   ========================================================= */
(async function () {
  const canvas = document.getElementById('webgl');
  const ready = () => window.dispatchEvent(new Event('scene:ready'));

  let THREE, RoomEnvironment;
  try {
    const m = await Promise.all([import('three'), import('three/addons/environments/RoomEnvironment.js')]);
    THREE = m[0];
    ({ RoomEnvironment } = m[1]);
  } catch (e) {
    console.warn('3D scene unavailable:', e);
    ready();
    return;
  }
  if (!window.HERO_PHOTO) { ready(); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('WebGL unavailable:', e);
    ready();
    return;
  }
  const isSmall = () => innerWidth < 900;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall() ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  /* ---------- Load photo ---------- */
  const IMG_W = 736, IMG_H = 1308, ASPECT = IMG_W / IMG_H;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = window.HERO_PHOTO; }).catch(() => null);
  if (!img) { ready(); return; }
  const photoTex = new THREE.Texture(img);
  photoTex.colorSpace = THREE.SRGBColorSpace;
  photoTex.minFilter = THREE.LinearMipmapLinearFilter;
  photoTex.anisotropy = 4;
  photoTex.needsUpdate = true;

  /* ---------- Hand-built depth map (0 = far, 1 = near) ---------- */
  const depthTex = (() => {
    const w = 368, h = 654, s = w / IMG_W;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgb(20,20,20)');
    grad.addColorStop(0.66, 'rgb(45,45,45)');
    grad.addColorStop(0.78, 'rgb(120,120,120)');
    grad.addColorStop(1, 'rgb(235,235,235)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    const blob = (x, y, rx, ry, v, rot = 0) => {
      g.save(); g.translate(x * s, y * s); g.rotate(rot);
      g.beginPath(); g.ellipse(0, 0, rx * s, ry * s, 0, 0, Math.PI * 2);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fill(); g.restore();
    };
    blob(505, 150, 190, 150, 120, -0.35);           // scoop
    for (let i = 0; i <= 10; i++) {                  // stream of beans
      const t = i / 10;
      blob(440 - t * 65, 270 + t * 320, 42, 34, 140);
    }
    blob(378, 705, 215, 105, 160);                   // splash crown
    blob(372, 905, 212, 140, 165);                   // cup body
    blob(612, 905, 62, 95, 150);                     // handle
    blob(365, 1015, 335, 78, 175);                   // saucer
    blob(360, 1215, 440, 130, 225);                  // front bean pile
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const o = out.getContext('2d');
    o.filter = 'blur(9px)';
    o.drawImage(c, 0, 0);
    const t = new THREE.CanvasTexture(out);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  })();

  /* ---------- Photo card ---------- */
  const card = new THREE.Group();
  scene.add(card);
  const uniforms = {
    uPhoto: { value: photoTex },
    uDepth: { value: depthTex },
    uMouse: { value: new THREE.Vector2() },
    uTime: { value: 0 },
    uHit: { value: 0 },
    uIntro: { value: 0 },
    uSize: { value: new THREE.Vector2(3, 5.3) },
    uRadius: { value: 0.28 },
    uBorder: { value: 1 },
  };
  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1, 1),
    new THREE.ShaderMaterial({
      uniforms, transparent: true, toneMapped: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform sampler2D uPhoto; uniform sampler2D uDepth;
        uniform vec2 uMouse; uniform float uTime; uniform float uHit; uniform float uIntro;
        uniform vec2 uSize; uniform float uRadius; uniform float uBorder;
        varying vec2 vUv;
        void main(){
          // two-step parallax lookup: near pixels shift more than far ones
          vec2 uv = vUv;
          float d = texture2D(uDepth, uv).r;
          vec2 k = uMouse * 0.03;
          uv = vUv - k * (d - 0.4);
          d = texture2D(uDepth, uv).r;
          uv = vUv - k * (d - 0.4);
          // living chocolate splash (above the rim only)
          vec2 sp = (uv - vec2(0.513, 0.465)) * vec2(1.0, 1.78);
          float m = smoothstep(0.2, 0.03, length(sp)) * smoothstep(0.375, 0.405, uv.y);
          float amp = 0.0022 + uHit * 0.004;
          uv += vec2(sin(uv.y * 70.0 + uTime * 6.0), cos(uv.x * 55.0 - uTime * 5.0)) * amp * m;
          vec3 col = texture2D(uPhoto, clamp(uv, 0.001, 0.999)).rgb;
          // soft moving light sweep across the scene
          float sweep = smoothstep(0.35, 0.0, abs(vUv.x + vUv.y * 0.5 - fract(uTime * 0.06) * 2.2 + 0.4));
          col += col * sweep * 0.12;
          // rounded-card mask + thin gold inner line
          vec2 p = (vUv - 0.5) * uSize;
          vec2 q = abs(p) - (uSize * 0.5 - uRadius);
          float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
          float alpha = smoothstep(0.012, -0.012, dist);
          float line = smoothstep(0.012, 0.0, abs(dist + 0.09)) * uBorder;
          col = mix(col, vec3(0.86, 0.7, 0.45), line * 0.85);
          col *= 1.0 - smoothstep(-0.6, 0.0, dist) * 0.25 * uBorder;
          gl_FragColor = vec4(col, alpha * uIntro);
          #include <colorspace_fragment>
        }`,
    })
  );
  card.add(photo);

  // soft drop shadow behind the card
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uIntro: uniforms.uIntro },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uIntro; void main(){ vec2 p = abs(vUv - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.55, 1.0, max(p.x, p.y))) * 0.55 * uIntro; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }`,
    })
  );
  shadow.position.set(0.18, -0.28, -0.4);
  card.add(shadow);

  /* ---------- Bean geometry + materials ---------- */
  const beanGeo = new THREE.SphereGeometry(1, 28, 18);
  const bp = beanGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    let x = bp.getX(i), y = bp.getY(i), z = bp.getZ(i);
    if (z > 0) z -= 0.5 * Math.exp(-(x * x) / 0.01) * z;   // the centre crease
    bp.setXYZ(i, x * 0.36, y * 0.5, z * 0.26);
  }
  beanGeo.computeVertexNormals();
  const beanMat = new THREE.MeshPhysicalMaterial({ color: '#4a2410', roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.35 });
  const chocMat = new THREE.MeshPhysicalMaterial({ color: '#4d2410', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
  const dropGeo = new THREE.SphereGeometry(1, 20, 14);

  scene.add(new THREE.HemisphereLight('#ffe2c2', '#2a160c', 1.0));
  const key = new THREE.DirectionalLight('#ffd6a8', 2.6);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#ffb070', 1.4);
  rim.position.set(4, 2, -2);
  scene.add(rim);

  // photo pixel -> card-local position
  const toLocal = (px, py, z = 0.12) => new THREE.Vector3((px / IMG_W - 0.5) * uniforms.uSize.value.x, (0.5 - py / IMG_H) * uniforms.uSize.value.y, z);
  const pxScale = () => uniforms.uSize.value.y / IMG_H;

  /* ---------- Pouring beans ---------- */
  const pour = [];
  for (let i = 0; i < 16; i++) {
    const b = new THREE.Mesh(beanGeo, beanMat);
    b.visible = false;
    card.add(b);
    pour.push({ mesh: b, t: -1, jitter: 0, spin: new THREE.Vector3() });
  }
  const drops = [];
  for (let i = 0; i < 40; i++) {
    const d = new THREE.Mesh(dropGeo, chocMat);
    d.visible = false;
    card.add(d);
    drops.push({ mesh: d, life: -1, v: new THREE.Vector3(), s: 1 });
  }
  const splash = () => {
    let n = 0;
    for (const d of drops) {
      if (d.life >= 0) continue;
      const a = Math.PI * (0.1 + Math.random() * 0.8);
      const sp = 0.9 + Math.random() * 1.1;
      d.v.set(Math.cos(a) * sp * (Math.random() < 0.5 ? -1 : 1) * 0.9, 1.2 + Math.random() * 1.4, (Math.random() - 0.3) * 1.2).multiplyScalar(pxScale() * 260);
      d.mesh.position.copy(toLocal(378 + (Math.random() - 0.5) * 120, 650 + Math.random() * 40, 0.2));
      d.s = pxScale() * (5 + Math.random() * 7);
      d.life = 0;
      d.mesh.visible = true;
      if (++n >= 5) break;
    }
    uniforms.uHit.value = 1;
  };
  let spawnT = 0;

  /* ---------- Floating beans in front of the card ---------- */
  const floaters = [];
  const fPos = [[-1.9, 1.9, 1.2], [1.95, 1.2, 1.6], [-2.2, -1.1, 2.0], [2.1, -1.9, 1.1], [-1.4, 2.8, 0.6], [1.5, 2.9, 2.2], [2.5, 0.2, 0.4]];
  fPos.forEach(([x, y, z], i) => {
    const m = new THREE.Mesh(beanGeo, beanMat);
    m.userData = { base: new THREE.Vector3(x, y, z), ph: i * 1.3, spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5) };
    m.scale.setScalar(0.0001);
    card.add(m);
    floaters.push(m);
  });

  /* ---------- Layout ---------- */
  const cardBase = new THREE.Vector3();
  function layout() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const vh = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
    const vw = vh * camera.aspect;
    if (isSmall()) {
      const ph = vh * 0.41, pw = ph * ASPECT;
      uniforms.uSize.value.set(pw, ph);
      uniforms.uRadius.value = 0.16;
      uniforms.uBorder.value = 1;
      cardBase.set(0, vh * 0.215, 0);
      shadow.visible = true;
    } else {
      const ph = Math.min(vh * 0.84, (vw * 0.4) / ASPECT);
      const pw = ph * ASPECT;
      uniforms.uSize.value.set(pw, ph);
      uniforms.uRadius.value = 0.3;
      uniforms.uBorder.value = 1;
      cardBase.set(Math.min(vw * 0.23, vw / 2 - pw / 2 - vw * 0.08), -vh * 0.02, 0);
      shadow.visible = true;
    }
    photo.scale.set(uniforms.uSize.value.x, uniforms.uSize.value.y, 1);
    shadow.scale.set(uniforms.uSize.value.x * 1.15, uniforms.uSize.value.y * 1.08, 1);
    const k = uniforms.uSize.value.y / 5.3;
    floaters.forEach((m) => (m.userData.k = k));
  }
  layout();
  addEventListener('resize', layout);

  /* ---------- Input ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / innerHeight) * 2 - 1;
    mouse.active = true;
  }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    mouse.tx = Math.max(-1, Math.min(1, e.gamma / 25));
    mouse.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
    mouse.active = true;
  });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  let introStart = -1;
  const startIntro = () => { if (introStart < 0) introStart = clock.getElapsedTime(); };
  addEventListener('scene:start', startIntro);
  if (window.__sceneStarted) startIntro();
  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

  /* ---------- Loop ---------- */
  let first = true, last = 0;
  const from = new THREE.Vector3(), to = new THREE.Vector3();
  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last); last = t;
    if ((!visible || document.hidden) && !first) return;
    const it = introStart < 0 ? 0 : t - introStart;
    const sp = Math.min(Math.max(scrollY / innerHeight, 0), 1);
    uniforms.uTime.value = t;

    // idle sway when nobody is moving the mouse
    const ax = mouse.active ? mouse.tx : Math.sin(t * 0.5) * 0.55;
    const ay = mouse.active ? mouse.ty : Math.cos(t * 0.37) * 0.35;
    mouse.x += (ax - mouse.x) * 0.05;
    mouse.y += (ay - mouse.y) * 0.05;
    uniforms.uMouse.value.set(mouse.x, -mouse.y);

    // intro: card swings in from a 3D angle
    const k = ease(it / 1.6);
    uniforms.uIntro.value = k;
    card.position.set(cardBase.x, cardBase.y - (1 - k) * 0.6 + sp * 1.2, cardBase.z - (1 - k) * 2 - sp * 1.5);
    card.rotation.y = (1 - k) * -0.6 + mouse.x * 0.16;
    card.rotation.x = mouse.y * 0.1;
    uniforms.uHit.value *= 0.94;

    // pouring beans: scoop mouth -> splash, accelerating like gravity
    if (it > 1.4) {
      spawnT -= dt;
      if (spawnT <= 0) {
        const free = pour.find((b) => b.t < 0);
        if (free) {
          free.t = 0;
          free.jitter = (Math.random() - 0.5) * 30;
          free.spin.set(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
          free.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
          free.mesh.visible = true;
        }
        spawnT = 0.24 + Math.random() * 0.18;
      }
    }
    const bs = pxScale() * 44;
    for (const b of pour) {
      if (b.t < 0) continue;
      b.t += dt / 0.95;
      const e = b.t * b.t;
      from.copy(toLocal(448 + b.jitter * 0.3, 255, 0.18));
      to.copy(toLocal(380 + b.jitter, 655, 0.22));
      b.mesh.position.lerpVectors(from, to, e);
      b.mesh.position.x += Math.sin(b.t * 3 + b.jitter) * pxScale() * 6;
      b.mesh.rotation.x += b.spin.x * dt; b.mesh.rotation.y += b.spin.y * dt; b.mesh.rotation.z += b.spin.z * dt;
      b.mesh.scale.setScalar(bs * Math.min(1, b.t * 6) * (b.t > 0.92 ? (1 - b.t) / 0.08 : 1) + 0.0001);
      if (b.t >= 1) { b.t = -1; b.mesh.visible = false; splash(); }
    }
    const gAcc = pxScale() * 900;
    for (const d of drops) {
      if (d.life < 0) continue;
      d.life += dt;
      d.v.y -= gAcc * dt;
      d.mesh.position.addScaledVector(d.v, dt);
      const f = 1 - d.life / 0.75;
      d.mesh.scale.set(d.s * f * 0.9, d.s * f * 1.25, d.s * f * 0.9);
      if (d.life > 0.75) { d.life = -1; d.mesh.visible = false; }
    }

    // floating beans drift in front of the frame
    floaters.forEach((m, i) => {
      const u = m.userData;
      const fk = ease((it - 0.9 - i * 0.1) / 1.2);
      const kk = u.k || 1;
      m.position.set(
        u.base.x * kk * (isSmall() ? 1.25 : 1) + Math.sin(t * 0.6 + u.ph) * 0.12,
        u.base.y * kk + Math.cos(t * 0.8 + u.ph) * 0.15,
        u.base.z + sp * 1.5
      );
      m.rotation.set(t * u.spin.x + u.ph, t * u.spin.y, t * u.spin.z);
      m.scale.setScalar(0.19 * kk * fk + 0.0001);
    });

    camera.position.x = mouse.x * 0.25;
    camera.position.y = -mouse.y * 0.15;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    if (first) { first = false; ready(); }
  }
  tick();
})();
