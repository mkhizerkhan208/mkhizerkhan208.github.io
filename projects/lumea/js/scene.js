/* =========================================================
   Luméa · Hero 3D scene (Three.js)
   A glowing arched niche (inspired by the treatment room),
   a sunset halo light, shelves of skincare, floating pearls,
   a glass serum drop and drifting light particles.
   Loaded with dynamic import() so the site also works when
   index.html is opened straight from disk (file://).
   ========================================================= */
(async function () {
  const canvas = document.getElementById('webgl');
  const ready = () => window.dispatchEvent(new Event('scene:ready'));

  let THREE, RoomEnvironment, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    const base = 'three/addons/';
    const mods = await Promise.all([
      import('three'),
      import(base + 'environments/RoomEnvironment.js'),
      import(base + 'postprocessing/EffectComposer.js'),
      import(base + 'postprocessing/RenderPass.js'),
      import(base + 'postprocessing/UnrealBloomPass.js'),
      import(base + 'postprocessing/OutputPass.js'),
    ]);
    THREE = mods[0];
    ({ RoomEnvironment } = mods[1]);
    ({ EffectComposer } = mods[2]);
    ({ RenderPass } = mods[3]);
    ({ UnrealBloomPass } = mods[4]);
    ({ OutputPass } = mods[5]);
  } catch (err) {
    console.warn('3D scene unavailable:', err);
    ready();
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    console.warn('WebGL unavailable:', err);
    ready();
    return;
  }

  const isSmall = () => window.innerWidth < 900;
  const lowPower = isSmall() || (navigator.hardwareConcurrency || 8) <= 4;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const BG = new THREE.Color('#140d12');
  const scene = new THREE.Scene();
  scene.background = BG;
  scene.fog = new THREE.Fog(BG, 12, 24);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const camBase = new THREE.Vector3(0, 0.2, 11);
  const lookAt = new THREE.Vector3(0, 0.1, 0);

  const root = new THREE.Group();
  scene.add(root);

  /* ---------- Halo (sunset lamp glow) ---------- */
  const haloMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uTime; uniform float uAlpha;
      void main(){
        vec2 p = vUv - 0.5;
        float d = length(p);
        float t = smoothstep(-0.35, 0.4, p.y + 0.08 * sin(uTime * 0.4 + p.x * 4.0));
        vec3 peach = vec3(1.0, 0.72, 0.62);
        vec3 pink  = vec3(1.0, 0.45, 0.70);
        vec3 lilac = vec3(0.60, 0.46, 1.0);
        vec3 col = mix(peach, pink, smoothstep(0.0, 0.5, t));
        col = mix(col, lilac, smoothstep(0.45, 1.0, t));
        float disc = 1.0 - smoothstep(0.0, 0.5, d);
        float a = pow(disc, 2.4) * 0.55 + pow(disc, 9.0) * 0.12;
        gl_FragColor = vec4(col * a * uAlpha, 1.0);
      }`,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), haloMat);
  halo.position.set(0, 0.4, -3.2);
  root.add(halo);

  /* ---------- Arch (neon tube + inner glow) ---------- */
  const W = 1.55, BOTTOM = -2.3, SPRING = 0.55;
  const archPts = [];
  for (let i = 0; i <= 24; i++) archPts.push(new THREE.Vector3(-W, BOTTOM + (SPRING - BOTTOM) * (i / 24), 0));
  for (let i = 1; i < 64; i++) {
    const a = Math.PI - (i / 64) * Math.PI;
    archPts.push(new THREE.Vector3(Math.cos(a) * W, SPRING + Math.sin(a) * W, 0));
  }
  for (let i = 0; i <= 24; i++) archPts.push(new THREE.Vector3(W, SPRING + (BOTTOM - SPRING) * (i / 24), 0));
  const archCurve = new THREE.CatmullRomCurve3(archPts, false, 'centripetal');
  const tubeGeo = new THREE.TubeGeometry(archCurve, 420, 0.03, 12, false);
  const tubeCount = tubeGeo.index.count;
  tubeGeo.setDrawRange(0, 0);
  const tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.74).multiplyScalar(3.2) }));
  root.add(tube);

  // Soft outer tube (wider, faint) for a volumetric feel
  const tube2Geo = new THREE.TubeGeometry(archCurve, 420, 0.11, 12, false);
  tube2Geo.setDrawRange(0, 0);
  const tube2 = new THREE.Mesh(tube2Geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.6, 0.72), transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(tube2);

  const archShape = new THREE.Shape();
  archShape.moveTo(-W, BOTTOM);
  archShape.lineTo(-W, SPRING);
  archShape.absarc(0, SPRING, W, Math.PI, 0, true);
  archShape.lineTo(W, BOTTOM);
  archShape.lineTo(-W, BOTTOM);
  const fillMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uAlpha: { value: 0 } },
    vertexShader: `varying vec3 vPos; void main(){ vPos = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPos; uniform float uAlpha;
      void main(){
        float edge = 1.0 - smoothstep(0.0, 0.9, ${W.toFixed(2)} - abs(vPos.x));
        float top = smoothstep(${BOTTOM.toFixed(2)}, 2.2, vPos.y);
        float a = (0.015 + 0.13 * edge + 0.05 * top) * uAlpha;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.7) * a, 1.0);
      }`,
  });
  const archFill = new THREE.Mesh(new THREE.ShapeGeometry(archShape, 48), fillMat);
  archFill.position.z = -0.25;
  root.add(archFill);

  /* ---------- Shelves with skincare bottles ---------- */
  const shelves = new THREE.Group();
  root.add(shelves);
  const woodMat = new THREE.MeshStandardMaterial({ color: '#7a4a2e', roughness: 0.55, metalness: 0.05 });
  const stripMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.62).multiplyScalar(3) });
  const bottleMats = [
    new THREE.MeshPhysicalMaterial({ color: '#f5ede6', roughness: 0.3, clearcoat: 0.6 }),
    new THREE.MeshPhysicalMaterial({ color: '#efe3d8', roughness: 0.25, clearcoat: 0.8 }),
    new THREE.MeshPhysicalMaterial({ color: '#b86b34', roughness: 0.12, clearcoat: 1, transmission: 0.25, thickness: 0.3 }),
    new THREE.MeshPhysicalMaterial({ color: '#e7bcc4', roughness: 0.2, clearcoat: 1 }),
  ];
  const capMats = [
    new THREE.MeshStandardMaterial({ color: '#2a1d20', roughness: 0.35 }),
    new THREE.MeshStandardMaterial({ color: '#c9a27a', roughness: 0.25, metalness: 0.9 }),
  ];
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  [0.62, -0.42].forEach((y) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.07, 0.5), woodMat);
    shelf.position.set(0, y, 0.1);
    shelves.add(shelf);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.012, 0.02), stripMat);
    strip.position.set(0, y - 0.045, 0.3);
    shelves.add(strip);
    let x = -1.0;
    while (x < 1.0) {
      const r = 0.055 + rand() * 0.05;
      const h = 0.2 + rand() * 0.32;
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24), bottleMats[Math.floor(rand() * bottleMats.length)]);
      bottle.position.set(x + r, y + 0.035 + h / 2, 0.08 + rand() * 0.12);
      shelves.add(bottle);
      const capH = 0.04 + rand() * 0.07;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.6, capH, 16), capMats[Math.floor(rand() * 2)]);
      cap.position.set(bottle.position.x, bottle.position.y + h / 2 + capH / 2, bottle.position.z);
      shelves.add(cap);
      x += r * 2 + 0.05 + rand() * 0.07;
    }
  });

  /* ---------- Floating pearls & glass orbs ---------- */
  const pearlMat = new THREE.MeshPhysicalMaterial({
    color: '#f6e6ee', roughness: 0.14, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [180, 700], sheen: 1, sheenColor: new THREE.Color('#ffc7da'),
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.04, transmission: 1, thickness: 0.9, ior: 1.5,
    iridescence: 0.8, iridescenceIOR: 1.3, attenuationColor: new THREE.Color('#ffc0d4'), attenuationDistance: 1.6, clearcoat: 1,
  });
  const orbDefs = [
    [-2.2, 2.2, 0.4, 0.26, pearlMat],
    [2.5, 0.05, 1.3, 0.46, glassMat],
    [-2.05, -1.85, 1.5, 0.2, pearlMat],
    [2.0, 2.2, -0.3, 0.3, pearlMat],
    [1.05, -2.05, 2.3, 0.19, pearlMat],
    [-0.7, 2.8, 0.5, 0.15, pearlMat],
    [3.4, 1.4, -1.2, 0.24, pearlMat],
  ];
  const sphereGeo = new THREE.SphereGeometry(1, 64, 48);
  const orbs = orbDefs.map(([x, y, z, r, m], i) => {
    const mesh = new THREE.Mesh(sphereGeo, m);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(0.0001);
    mesh.userData = { base: new THREE.Vector3(x, y, z), r, phase: i * 1.7, speed: 0.5 + (i % 3) * 0.18 };
    root.add(mesh);
    return mesh;
  });

  /* ---------- Serum drop (glass lathe) ---------- */
  const dropPts = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI;
    dropPts.push(new THREE.Vector2(Math.sin(t) * Math.pow(Math.sin(t / 2), 1.4) * 0.78, Math.cos(t)));
  }
  const drop = new THREE.Mesh(
    new THREE.LatheGeometry(dropPts, 64),
    new THREE.MeshPhysicalMaterial({
      color: '#ffe9f0', roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.45,
      attenuationColor: new THREE.Color('#f7a8c0'), attenuationDistance: 1.2, clearcoat: 1, iridescence: 0.5,
    })
  );
  drop.position.set(2.85, -1.75, 1.9);
  drop.scale.setScalar(0.0001);
  root.add(drop);

  /* ---------- Floor glow ---------- */
  const floorMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uAlpha: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform float uAlpha;
      void main(){ vec2 p = (vUv - 0.5) * vec2(1.0, 2.2); float a = pow(1.0 - smoothstep(0.0, 0.5, length(p)), 2.0) * 0.3 * uAlpha;
      gl_FragColor = vec4(vec3(1.0, 0.6, 0.72) * a, 1.0); }`,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = BOTTOM - 0.02;
  root.add(floor);

  /* ---------- Particles ---------- */
  const P = lowPower ? 260 : 560;
  const pPos = new Float32Array(P * 3);
  const pData = new Float32Array(P * 2);
  for (let i = 0; i < P; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 16;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 9;
    pData[i * 2] = 0.4 + Math.random() * 1.4;
    pData[i * 2 + 1] = Math.random() * 6.28;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('aData', new THREE.BufferAttribute(pData, 2));
  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uAlpha: { value: 0 } },
    vertexShader: `
      attribute vec2 aData; uniform float uTime; uniform float uPR; varying float vTw;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime * 0.12 * aData.x + 5.0, 10.0) - 5.0;
        p.x += sin(uTime * 0.3 + aData.y) * 0.25;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aData.x * 7.0 * uPR / -mv.z;
        vTw = 0.55 + 0.45 * sin(uTime * 1.5 + aData.y * 3.0);
      }`,
    fragmentShader: `
      varying float vTw; uniform float uAlpha;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vTw * uAlpha;
      gl_FragColor = vec4(vec3(1.0, 0.8, 0.86) * a, 1.0); }`,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight('#ffe8ee', 0.25));
  const pinkLight = new THREE.PointLight('#ff8fb8', 26, 0, 2);
  pinkLight.position.set(-3, 2.4, 3);
  const warmLight = new THREE.PointLight('#ffd2a8', 18, 0, 2);
  warmLight.position.set(3, -1, 3.2);
  const nicheLight = new THREE.PointLight('#ffe0c2', 5, 0, 2);
  nicheLight.position.set(0, 1.4, 1.1);
  const rimLight = new THREE.DirectionalLight('#b79ce2', 1.2);
  rimLight.position.set(2, 4, -4);
  root.add(pinkLight, warmLight, nicheLight, rimLight);

  /* ---------- Post-processing ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.7, 0.55, 0.9);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------- Layout / resize ---------- */
  function layout() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    if (isSmall()) {
      root.position.set(0, 2.3, 0);
      root.scale.setScalar(0.62);
      camBase.set(0, 0.2, 13.5);
      camera.fov = 42;
    } else {
      const shift = Math.min(3.1, 1.6 + (w / h - 1.2) * 1.6);
      root.position.set(shift, 0, 0);
      root.scale.setScalar(1);
      camBase.set(0, 0.2, 11);
      camera.fov = 35;
    }
    camera.updateProjectionMatrix();
  }
  layout();
  window.addEventListener('resize', layout);

  /* ---------- Input ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- Visibility (pause when off-screen) ---------- */
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas);

  /* ---------- Intro animation ---------- */
  let introStart = -1;
  const clock = new THREE.Clock();
  const startIntro = () => { if (introStart < 0) introStart = clock.getElapsedTime(); };
  window.addEventListener('scene:start', startIntro);
  if (window.__sceneStarted) startIntro(); // loader finished before the scene loaded
  const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

  /* ---------- Loop ---------- */
  const tmp = new THREE.Vector3();
  let first = true;

  function tick() {
    requestAnimationFrame(tick);
    if ((!visible || document.hidden) && !first) return;

    const t = clock.getElapsedTime();
    const it = introStart < 0 ? 0 : t - introStart;

    // intro timing
    const archK = ease(it / 2.4);
    const glowK = ease((it - 0.4) / 2.0);
    const orbK = (i) => ease((it - 0.9 - i * 0.12) / 1.2);
    tubeGeo.setDrawRange(0, Math.floor((tubeCount * archK) / 6) * 6);
    tube2Geo.setDrawRange(0, Math.floor((tube2Geo.index.count * archK) / 6) * 6);
    haloMat.uniforms.uAlpha.value = glowK;
    fillMat.uniforms.uAlpha.value = glowK;
    floorMat.uniforms.uAlpha.value = glowK;
    pMat.uniforms.uAlpha.value = glowK;
    shelves.position.y = (1 - glowK) * -0.4;

    // scroll progress through hero (0 → 1)
    const sp = Math.min(Math.max(window.scrollY / window.innerHeight, 0), 1);

    // mouse easing
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    camera.position.set(
      camBase.x + mouse.x * 0.7,
      camBase.y - mouse.y * 0.45 - sp * 0.6,
      camBase.z - sp * 3.2
    );
    tmp.copy(lookAt);
    if (!isSmall()) tmp.add(root.position).multiplyScalar(0.5);
    tmp.y -= sp * 0.3;
    camera.lookAt(tmp);

    root.rotation.y = mouse.x * 0.1 + Math.sin(t * 0.15) * 0.05;
    root.rotation.x = mouse.y * 0.04;

    haloMat.uniforms.uTime.value = t;
    halo.scale.setScalar(1 + Math.sin(t * 0.6) * 0.03 + sp * 0.35);
    pMat.uniforms.uTime.value = t;
    particles.rotation.y = t * 0.02;

    orbs.forEach((o, i) => {
      const d = o.userData;
      const k = orbK(i);
      o.scale.setScalar(Math.max(d.r * k, 0.0001));
      const spread = 1 + sp * 0.55;
      o.position.set(
        d.base.x * spread + Math.cos(t * d.speed * 0.7 + d.phase) * 0.08,
        d.base.y * spread + Math.sin(t * d.speed + d.phase) * 0.18,
        d.base.z + sp * 1.2
      );
      o.rotation.y = t * 0.3 + d.phase;
    });

    const dk = ease((it - 1.3) / 1.4);
    drop.scale.setScalar(Math.max(0.42 * dk, 0.0001));
    drop.position.y = -1.75 + Math.sin(t * 0.8) * 0.15;
    drop.rotation.y = t * 0.4;
    drop.rotation.z = Math.sin(t * 0.5) * 0.18;

    pinkLight.position.x = -3 + Math.sin(t * 0.5) * 1.2;
    warmLight.position.y = -1 + Math.cos(t * 0.4) * 0.8;

    composer.render();
    if (first) { first = false; ready(); }
  }
  tick();
})();
