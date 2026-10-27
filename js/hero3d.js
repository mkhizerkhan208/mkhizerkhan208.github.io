/* =========================================================
   Portfolio hero · 3D point-field "digital sea"
   A grid of glowing points rippled by noise in a shader;
   the cursor sends a wave through it. Classic script with
   dynamic import() so it also works from file://.
   ========================================================= */
(async function () {
  const canvas = document.getElementById('webgl');
  if (!canvas) return;
  let THREE;
  try { THREE = await import('three'); } catch (e) { return; }
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  const small = innerWidth < 900;
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 3.2, 9);
  camera.lookAt(0, 0, 0);

  const COLS = small ? 110 : 190, ROWS = small ? 70 : 110, W = 26, D = 16;
  const pos = new Float32Array(COLS * ROWS * 3), rnd = new Float32Array(COLS * ROWS);
  let k = 0;
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    pos[k * 3] = (i / (COLS - 1) - 0.5) * W;
    pos[k * 3 + 1] = 0;
    pos[k * 3 + 2] = (j / (ROWS - 1) - 0.5) * D;
    rnd[k] = Math.random();
    k++;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  const uni = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(99, 99) }, uPulse: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uIntro: { value: 0 }, uScroll: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime, uPulse, uPR, uIntro, uScroll; uniform vec2 uMouse;
      attribute float aRnd; varying float vH; varying float vA;
      float wave(vec2 p, float t){
        return sin(p.x * 0.45 + t * 0.9) * 0.35 + sin(p.y * 0.6 - t * 0.7) * 0.3
             + sin((p.x + p.y) * 0.3 + t * 0.5) * 0.45 + sin(length(p) * 0.8 - t * 1.2) * 0.18;
      }
      void main(){
        vec3 p = position;
        float t = uTime;
        float h = wave(p.xz, t);
        float d = distance(p.xz, uMouse);
        h += sin(d * 2.2 - t * 5.0) * exp(-d * 0.4) * (0.8 + uPulse);
        h *= uIntro;
        p.y = h - uScroll * 2.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (2.2 + aRnd * 2.2 + max(h, 0.0) * 3.5) * uPR * (13.0 / -mv.z);
        vH = h;
        vA = smoothstep(28.0, 5.0, -mv.z) * (0.55 + aRnd * 0.45);
      }`,
    fragmentShader: `
      varying float vH; varying float vA;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, r) * vA;
        vec3 lo = vec3(0.30, 0.28, 0.42), mid = vec3(0.55, 0.48, 1.0), hi = vec3(0.83, 1.0, 0.25);
        vec3 col = mix(lo, mid, smoothstep(-0.6, 0.3, vH));
        col = mix(col, hi, smoothstep(0.35, 1.1, vH));
        gl_FragColor = vec4(col * a * 1.6, 1.0);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.rotation.x = 0.05;
  scene.add(points);

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3(), ndc = new THREE.Vector2();
  const target = new THREE.Vector2(99, 99);
  let pulse = 0, lx = 0, ly = 0, tilt = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z);
    pulse = Math.min(1.2, pulse + Math.hypot(e.clientX - lx, e.clientY - ly) * 0.004);
    lx = e.clientX; ly = e.clientY;
    tilt = { x: ndc.x, y: ndc.y };
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  let start = -1;
  const go = () => { if (start < 0) start = clock.getElapsedTime(); };
  if (window.__ready) go(); else addEventListener('page:ready', go);

  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const t = clock.getElapsedTime();
    uni.uTime.value = t;
    uni.uIntro.value = start < 0 ? 0 : 1 - Math.pow(1 - Math.min(1, (t - start) / 2.2), 3);
    if (target.x > 90) target.set(Math.sin(t * 0.3) * 6, Math.cos(t * 0.25) * 3); // idle wander before the mouse moves
    uni.uMouse.value.lerp(target, 0.08);
    pulse *= 0.96;
    uni.uPulse.value = pulse;
    uni.uScroll.value = Math.min(1, scrollY / innerHeight);
    camera.position.x += (tilt.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (3.2 + tilt.y * 0.6 - camera.position.y) * 0.04;
    camera.lookAt(0, -uni.uScroll.value, 0);
    renderer.render(scene, camera);
  })();
})();
