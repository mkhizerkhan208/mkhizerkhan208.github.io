/* =========================================================
   Velvet Bean · Three.js hero scenes
   One canvas per page: <canvas data-scene="orb|beans|ice|bonbons|cup">
   Classic script + dynamic import() so it also runs from file://
   ========================================================= */
(async function () {
  const canvas = document.querySelector('canvas[data-scene]');
  if (!canvas) return;
  const ready = () => dispatchEvent(new Event('scene:ready'));
  const name = canvas.dataset.scene;

  let THREE, RoomEnvironment, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    const a = 'three/addons/';
    const m = await Promise.all([
      import('three'),
      import(a + 'environments/RoomEnvironment.js'),
      import(a + 'geometries/RoundedBoxGeometry.js'),
      import(a + 'postprocessing/EffectComposer.js'),
      import(a + 'postprocessing/RenderPass.js'),
      import(a + 'postprocessing/UnrealBloomPass.js'),
      import(a + 'postprocessing/OutputPass.js'),
    ]);
    THREE = m[0];
    ({ RoomEnvironment } = m[1]); ({ RoundedBoxGeometry } = m[2]); ({ EffectComposer } = m[3]);
    ({ RenderPass } = m[4]); ({ UnrealBloomPass } = m[5]); ({ OutputPass } = m[6]);
  } catch (e) { console.warn('3D unavailable', e); ready(); return; }

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { console.warn('WebGL unavailable', e); ready(); return; }

  const isSmall = () => innerWidth < 900;
  const low = isSmall() || (navigator.hardwareConcurrency || 8) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.4 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  const root = new THREE.Group();
  scene.add(root);

  /* ---------- shared helpers ---------- */
  const rand = (() => { let s = 1234567; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const back = (t) => { t = clamp(t, 0, 1); const c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

  function gradientBg(inner, outer, cx = 0.62, cy = 0.45) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(c.width * cx, c.height * cy, 10, c.width * cx, c.height * cy, c.width * 0.75);
    grd.addColorStop(0, inner); grd.addColorStop(1, outer);
    g.fillStyle = grd; g.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  function beanGeometry(detail = 1) {
    const geo = new THREE.SphereGeometry(1, 28 * detail, 18 * detail);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (z > 0) z -= 0.55 * Math.exp(-(x * x) / 0.012) * z;   // centre crease
      p.setXYZ(i, x * 0.36, y * 0.5, z * 0.27);
    }
    geo.computeVertexNormals();
    return geo;
  }
  const beanMat = () => new THREE.MeshPhysicalMaterial({ color: '#4b2612', roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.3, sheen: 0.4, sheenColor: new THREE.Color('#a8663a') });
  const iceMat = () => new THREE.MeshPhysicalMaterial({ color: '#ffffff', envMapIntensity: 1.6, roughness: 0.08, transmission: 1, thickness: 1.1, ior: 1.31, clearcoat: 1, attenuationColor: new THREE.Color('#ffe7cc'), attenuationDistance: 2.5 });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.4, 0.6, 0.88);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const NOISE = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

  /* =========================================================
     SCENES
     ========================================================= */
  const SCENES = {};

  /* ---------- HOME: liquid coffee orb ---------- */
  SCENES.orb = () => {
    scene.background = gradientBg('#3d2213', '#0f0906', 0.66, 0.42);
    const u = { uTime: { value: 0 }, uAmp: { value: 0.45 }, uPush: { value: 0 }, uMouse: { value: new THREE.Vector2() } };
    const mat = new THREE.MeshPhysicalMaterial({ color: '#6e3b1c', roughness: 0.14, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.5, sheenColor: new THREE.Color('#ffb070'), sheenRoughness: 0.4 });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = 'uniform float uTime; uniform float uAmp; uniform float uPush; uniform vec2 uMouse;\n' + NOISE + `
        vec3 displaceP(vec3 p){
          vec3 n = normalize(p); float t = uTime * 0.32;
          float d = snoise(n * 1.3 + vec3(t, t * 0.7, -t * 0.45)) * uAmp;
          d += snoise(n * 2.4 - vec3(t * 0.9)) * uAmp * 0.14;
          float m = max(dot(n, normalize(vec3(uMouse, 0.85))), 0.0);
          d += pow(m, 7.0) * uPush;
          return n * (1.0 + d);
        }\n` + sh.vertexShader
        .replace('#include <beginnormal_vertex>', `
          vec3 nrm = normalize(position);
          vec3 up = abs(nrm.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
          vec3 tng = normalize(cross(nrm, up)); vec3 btg = normalize(cross(nrm, tng));
          float e = 0.012;
          vec3 pc = displaceP(position); vec3 pa = displaceP(position + tng * e); vec3 pb = displaceP(position + btg * e);
          vec3 objectNormal = normalize(cross(pa - pc, pb - pc));
          #ifdef USE_TANGENT
            vec3 objectTangent = tng;
          #endif`)
        .replace('#include <begin_vertex>', 'vec3 transformed = displaceP(position);');
    };
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1, low ? 48 : 90), mat);
    root.add(orb);

    // orbiting beans
    const N = low ? 34 : 56;
    const beans = new THREE.InstancedMesh(beanGeometry(), beanMat(), N);
    const bd = Array.from({ length: N }, () => ({ r: 1.9 + rand() * 1.5, a: rand() * Math.PI * 2, s: 0.12 + rand() * 0.22, y: (rand() - 0.5) * 1.2, sc: 0.13 + rand() * 0.09, rot: new THREE.Vector3(rand() * 6, rand() * 6, rand() * 6), spin: rand() * 2 + 0.5 }));
    root.add(beans);
    // ice cubes
    const ice = [];
    const iceGeo = new RoundedBoxGeometry(1, 1, 1, 4, 0.16);
    [[-2.3, 1.3, 1.2, 0.55], [2.6, -1.2, 0.8, 0.5], [1.9, 1.8, -1.2, 0.42], [-1.8, -1.6, 0.4, 0.45], [0.4, 2.3, 1.6, 0.34]].forEach(([x, y, z, s], i) => {
      const m = new THREE.Mesh(iceGeo, iceMat());
      m.userData = { base: new THREE.Vector3(x, y, z), s, ph: i * 1.7 };
      root.add(m); ice.push(m);
    });
    const warm = new THREE.PointLight('#ffb070', 30, 0, 2); warm.position.set(-2.5, 2, 3);
    const rimL = new THREE.PointLight('#ff8a3c', 40, 0, 2); rimL.position.set(2.5, -1, -2.5);
    const key = new THREE.DirectionalLight('#fff0dc', 1.6); key.position.set(-3, 4, 5);
    scene.add(warm, rimL, key, new THREE.AmbientLight('#5a3620', 0.6));
    const dummy = new THREE.Object3D();
    return {
      layout(w, h) {
        if (isSmall()) { root.position.set(0, 2.55, 0); root.scale.setScalar(0.62); }
        else { root.position.set(Math.min(3.1, 1.9 + (w / h - 1.2) * 2.2), 0.25, 0); root.scale.setScalar(1); }
      },
      update({ t, it, sp, mouse }) {
        u.uTime.value = t;
        const k = back((it - 0.1) / 1.5);
        orb.scale.setScalar(Math.max(0.001, 1.45 * k * (1 - sp * 0.25)));
        u.uAmp.value = lerp(0.34, 0.12, ease(it / 3)) + sp * 0.2 + Math.sin(t * 0.7) * 0.015;
        u.uMouse.value.set(mouse.x, -mouse.y);
        u.uPush.value = lerp(u.uPush.value, mouse.active ? 0.22 : 0, 0.05);
        orb.rotation.y = t * 0.12 + mouse.x * 0.4;
        orb.rotation.x = mouse.y * 0.25;
        const bk = ease((it - 0.6) / 1.6);
        for (let i = 0; i < N; i++) {
          const d = bd[i];
          const a = d.a + t * d.s;
          const r = d.r * (0.4 + 0.6 * bk) * (1 + sp * 0.9);
          dummy.position.set(Math.cos(a) * r, d.y + Math.sin(a * 2 + t) * 0.15 + Math.sin(a) * r * 0.28, Math.sin(a) * r * 0.6);
          dummy.rotation.set(d.rot.x + t * d.spin, d.rot.y + t * d.spin * 0.7, d.rot.z);
          dummy.scale.setScalar(d.sc * bk + 0.0001);
          dummy.updateMatrix();
          beans.setMatrixAt(i, dummy.matrix);
        }
        beans.instanceMatrix.needsUpdate = true;
        beans.rotation.x = 0.35 + mouse.y * 0.1;
        beans.rotation.z = -0.2;
        ice.forEach((m, i) => {
          const d = m.userData, kk = ease((it - 0.9 - i * 0.12) / 1.3);
          m.position.set(d.base.x * (1 + sp * 0.6) + mouse.x * 0.2 * (d.base.z + 2), d.base.y + Math.sin(t * 0.8 + d.ph) * 0.18 - mouse.y * 0.15, d.base.z);
          m.rotation.set(t * 0.25 + d.ph, t * 0.3 + d.ph, 0);
          m.scale.setScalar(d.s * kk + 0.0001);
        });
        warm.position.x = -2.5 + Math.sin(t * 0.4) * 1.5;
      },
    };
  };

  /* ---------- MENU: bean rain that parts around the cursor ---------- */
  SCENES.beans = () => {
    scene.background = gradientBg('#2e1a10', '#0d0805', 0.7, 0.4);
    scene.fog = new THREE.Fog('#0f0906', 9, 22);
    const N = low ? 130 : 260;
    const mesh = new THREE.InstancedMesh(beanGeometry(), beanMat(), N);
    const B = Array.from({ length: N }, () => ({
      p: new THREE.Vector3((rand() - 0.5) * 20, (rand() - 0.5) * 13, -8 + rand() * 10),
      v: new THREE.Vector3(), fall: 0.5 + rand() * 1.1, rot: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6), spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(3), s: 0.2 + rand() * 0.16,
    }));
    root.add(mesh);
    // cocoa dust
    const DN = low ? 300 : 700, dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dp[i * 3] = (rand() - 0.5) * 22; dp[i * 3 + 1] = (rand() - 0.5) * 14; dp[i * 3 + 2] = -8 + rand() * 10; }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#e2b77a', size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    root.add(dust);
    scene.add(new THREE.AmbientLight('#6a4128', 0.7));
    const key = new THREE.DirectionalLight('#ffe2bf', 2.2); key.position.set(-4, 5, 6); scene.add(key);
    const glow = new THREE.PointLight('#ff9a4a', 60, 0, 2); glow.position.set(3, 0, 3); scene.add(glow);
    const dummy = new THREE.Object3D(), hit = new THREE.Vector3(), ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), mv = new THREE.Vector2();
    return {
      layout() {},
      update({ t, dt, it, sp, mouse }) {
        mv.set(mouse.x, -mouse.y);
        ray.setFromCamera(mv, camera);
        ray.ray.intersectPlane(plane, hit);
        const k = ease(it / 1.6);
        const speed = 1 + sp * 2.5;
        for (let i = 0; i < N; i++) {
          const b = B[i];
          b.p.y -= b.fall * dt * speed;
          if (b.p.y < -7) { b.p.y = 7; b.p.x = (rand() - 0.5) * 20; }
          const dx = b.p.x - hit.x, dy = b.p.y - hit.y, dz = b.p.z;
          const d2 = dx * dx + dy * dy + dz * dz * 0.3;
          if (mouse.active && d2 < 5) { const f = (5 - d2) * 0.9 * dt; b.v.x += dx * f; b.v.y += dy * f; }
          b.v.multiplyScalar(0.94);
          b.p.add(b.v);
          dummy.position.copy(b.p);
          dummy.rotation.set(b.rot.x + t * b.spin.x, b.rot.y + t * b.spin.y, b.rot.z + t * b.spin.z);
          dummy.scale.setScalar(b.s * k + 0.0001);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        dust.rotation.y = t * 0.02;
        dust.position.y = -((t * 0.15) % 2);
        glow.position.set(hit.x || 3, hit.y || 0, 3);
        camera.position.z = 10 - sp * 2;
      },
    };
  };

  /* ---------- EXPERIENCES: ice + caramel cubes ---------- */
  SCENES.ice = () => {
    scene.background = gradientBg('#4a2a15', '#0f0906', 0.64, 0.5);
    const geo = new RoundedBoxGeometry(1, 1, 1, 5, 0.14);
    const caramel = new THREE.MeshPhysicalMaterial({ color: '#c77a2e', roughness: 0.22, transmission: 0.55, thickness: 1.4, ior: 1.45, clearcoat: 1, clearcoatRoughness: 0.1, attenuationColor: new THREE.Color('#8a4a15'), attenuationDistance: 0.8, sheen: 0.4, sheenColor: new THREE.Color('#ffc27a') });
    const items = [];
    const spots = low ? 12 : 18;
    for (let i = 0; i < spots; i++) {
      const isIce = i % 3 !== 0;
      const m = new THREE.Mesh(geo, isIce ? iceMat() : caramel);
      const a = (i / spots) * Math.PI * 2 + rand();
      const r = 1.2 + rand() * 2.6;
      m.userData = { base: new THREE.Vector3(Math.cos(a) * r, (rand() - 0.5) * 4.2, (rand() - 0.5) * 3), s: isIce ? 0.5 + rand() * 0.35 : 0.42 + rand() * 0.25, ph: rand() * 6, spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5) };
      root.add(m); items.push(m);
    }
    const BN = 22;
    const beans = new THREE.InstancedMesh(beanGeometry(), beanMat(), BN);
    const bd = Array.from({ length: BN }, () => ({ p: new THREE.Vector3((rand() - 0.5) * 7, (rand() - 0.5) * 5, (rand() - 0.5) * 4), ph: rand() * 6, s: 0.14 + rand() * 0.08 }));
    root.add(beans);
    // droplets
    const DN = 140, dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) { dp[i * 3] = (rand() - 0.5) * 9; dp[i * 3 + 1] = (rand() - 0.5) * 6; dp[i * 3 + 2] = (rand() - 0.5) * 5; }
    const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    const drops = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffd9a8', size: 0.05, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    root.add(drops);
    scene.add(new THREE.AmbientLight('#7a4a2a', 0.5));
    const key = new THREE.DirectionalLight('#fff1dc', 2.4); key.position.set(-3, 5, 5); scene.add(key);
    const back_ = new THREE.PointLight('#ff9d4d', 70, 0, 2); back_.position.set(1, 0.5, -3); scene.add(back_);
    const dummy = new THREE.Object3D();
    return {
      layout(w, h) {
        if (isSmall()) { root.position.set(0, 2.6, 0); root.scale.setScalar(0.58); }
        else { root.position.set(Math.min(2.8, 1.4 + (w / h - 1.2) * 1.8), 0, 0); root.scale.setScalar(1); }
      },
      update({ t, it, sp, mouse }) {
        items.forEach((m, i) => {
          const d = m.userData, k = back((it - i * 0.05) / 1.3);
          const spread = 1 + sp * 0.8;
          m.position.set(d.base.x * spread + mouse.x * (d.base.z + 2) * 0.12, d.base.y * spread + Math.sin(t * 0.7 + d.ph) * 0.22 - mouse.y * (d.base.z + 2) * 0.1, d.base.z);
          m.rotation.set(d.ph + t * d.spin.x * 0.6, d.ph + t * d.spin.y * 0.6, t * d.spin.z * 0.4);
          m.scale.setScalar(Math.max(0.001, d.s * k));
        });
        const bk = ease((it - 0.5) / 1.4);
        bd.forEach((b, i) => {
          dummy.position.set(b.p.x, b.p.y + Math.sin(t + b.ph) * 0.25, b.p.z);
          dummy.rotation.set(t * 0.8 + b.ph, t * 0.6, b.ph);
          dummy.scale.setScalar(b.s * bk + 0.0001);
          dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix);
        });
        beans.instanceMatrix.needsUpdate = true;
        drops.rotation.y = t * 0.05;
        root.rotation.y = mouse.x * 0.15 + Math.sin(t * 0.2) * 0.1;
        root.rotation.x = mouse.y * 0.08;
      },
    };
  };

  /* ---------- STORY: tumbling bonbons ---------- */
  SCENES.bonbons = () => {
    scene.background = gradientBg('#3a2014', '#0e0805', 0.62, 0.5);
    const truffle = new THREE.IcosahedronGeometry(1, low ? 10 : 16);
    const tp = truffle.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const v = new THREE.Vector3(tp.getX(i), tp.getY(i), tp.getZ(i)).normalize();
      const n = 1 + 0.035 * Math.sin(v.x * 11 + v.y * 7) * Math.cos(v.z * 9 - v.y * 5) + 0.02 * Math.sin(v.y * 23);
      v.multiplyScalar(n); v.y *= 0.9;
      tp.setXYZ(i, v.x, v.y, v.z);
    }
    truffle.computeVertexNormals();
    const cube = new RoundedBoxGeometry(1.3, 0.8, 1.3, 4, 0.14);
    const mats = [
      new THREE.MeshPhysicalMaterial({ color: '#2b150b', roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
      new THREE.MeshPhysicalMaterial({ color: '#6b381b', roughness: 0.32, clearcoat: 0.7, sheen: 0.6, sheenColor: new THREE.Color('#c98a47') }),
      new THREE.MeshPhysicalMaterial({ color: '#b9a488', roughness: 0.45, clearcoat: 0.4 }),
      new THREE.MeshStandardMaterial({ color: '#5a321c', roughness: 0.98 }),
    ];
    const gold = new THREE.MeshStandardMaterial({ color: '#e2b060', metalness: 1, roughness: 0.25 });
    const flakeGeo = new THREE.CircleGeometry(0.3, 6);
    const items = [];
    const count = low ? 18 : 28;
    for (let i = 0; i < count; i++) {
      const g = new THREE.Group();
      const isCube = i % 5 === 4;
      const body = new THREE.Mesh(isCube ? cube : truffle, mats[isCube ? 0 : i % 4]);
      g.add(body);
      if (!isCube && i % 3 === 0) {
        const f = new THREE.Mesh(flakeGeo, gold);
        f.position.y = 0.88; f.rotation.x = -Math.PI / 2 + 0.2; f.rotation.z = rand() * 3;
        g.add(f);
      }
      const t = i / count;
      const a = t * Math.PI * 5;
      g.userData = { a, r: 1.2 + t * 2.4, y: (t - 0.5) * 7, s: 0.34 + rand() * 0.22, ph: rand() * 6, spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5) };
      root.add(g); items.push(g);
    }
    scene.add(new THREE.AmbientLight('#6b4128', 0.45));
    const key = new THREE.DirectionalLight('#fff0dc', 1.8); key.position.set(-4, 6, 5); scene.add(key);
    const rimL = new THREE.PointLight('#ff9448', 70, 0, 2); rimL.position.set(3, -1, -3); scene.add(rimL);
    const fill = new THREE.PointLight('#ffcf9a', 25, 0, 2); fill.position.set(-2, -2, 4); scene.add(fill);
    return {
      layout(w, h) {
        if (isSmall()) { root.position.set(0, 2.5, -1); root.scale.setScalar(0.55); }
        else { root.position.set(Math.min(2.8, 1.4 + (w / h - 1.2) * 1.8), 0, 0); root.scale.setScalar(0.95); }
      },
      update({ t, it, sp, mouse }) {
        const spinAll = t * 0.12 + sp * 2.2;
        items.forEach((g, i) => {
          const d = g.userData, k = back((it - i * 0.035) / 1.3);
          const a = d.a + spinAll;
          g.position.set(Math.cos(a) * d.r, d.y * 0.62 + Math.sin(t * 0.6 + d.ph) * 0.12 + sp * 2, Math.sin(a) * d.r);
          g.rotation.set(d.ph + t * d.spin.x, d.ph + t * d.spin.y, t * d.spin.z * 0.5);
          g.scale.setScalar(Math.max(0.001, d.s * k));
        });
        root.rotation.x = 0.25 + mouse.y * 0.15;
        root.rotation.z = -0.15 + mouse.x * 0.1;
      },
    };
  };

  /* ---------- CONTACT: latte cup with steam ---------- */
  SCENES.cup = () => {
    scene.background = gradientBg('#3e2314', '#0f0906', 0.64, 0.46);
    const cupG = new THREE.Group();
    root.add(cupG);
    const glaze = new THREE.MeshPhysicalMaterial({ color: '#1a120e', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
    const goldM = new THREE.MeshStandardMaterial({ color: '#e2b060', metalness: 1, roughness: 0.22 });
    const V = (a) => a.map(([x, y]) => new THREE.Vector2(x, y));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(V([[0, 0.12], [0.5, 0.12], [0.56, 0.2], [0.72, 0.5], [0.86, 0.92], [0.93, 1.25], [0.95, 1.32], [0.91, 1.34], [0.88, 1.26], [0.8, 0.92], [0.66, 0.52], [0.52, 0.3], [0, 0.26]]), 96), glaze);
    cupG.add(cup);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.017, 12, 96), goldM);
    rim.rotation.x = Math.PI / 2; rim.position.y = 1.33; cupG.add(rim);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 20, 60, Math.PI * 1.25), glaze);
    handle.position.set(0.9, 0.78, 0); handle.rotation.z = -Math.PI * 0.62; cupG.add(handle);
    const saucer = new THREE.Mesh(new THREE.LatheGeometry(V([[0, 0], [1.1, 0], [1.4, 0.05], [1.6, 0.16], [1.64, 0.2], [1.58, 0.21], [1.4, 0.13], [1.1, 0.09], [0.58, 0.09], [0, 0.1]]), 96), glaze);
    cupG.add(saucer);
    const srim = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.014, 10, 120), goldM);
    srim.rotation.x = Math.PI / 2; srim.position.y = 0.2; cupG.add(srim);
    const uT = { value: 0 };
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.88, 96), new THREE.ShaderMaterial({
      uniforms: { uTime: uT },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        float dot2(vec2 v){ return dot(v,v); }
        float sdHeart(vec2 p){ p.x = abs(p.x); if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25,0.75))) - sqrt(2.0)/4.0; return sqrt(min(dot2(p - vec2(0.0,1.0)), dot2(p - 0.5*max(p.x+p.y,0.0)))) * sign(p.x-p.y); }
        void main(){
          vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
          vec3 crema = mix(vec3(0.66,0.4,0.2), vec3(0.3,0.15,0.06), smoothstep(0.3,1.0,r));
          crema = mix(crema, vec3(0.8,0.56,0.32), smoothstep(0.85,0.98,r)*0.7);
          vec2 q = p * 1.4 + vec2(0.0, 0.6); q.x += sin(q.y*8.0 + uTime*0.7)*0.012;
          float d = sdHeart(q), aa = 0.012;
          float art = smoothstep(aa,-aa,d);
          art -= smoothstep(-0.1-aa,-0.1+aa,d)*smoothstep(-0.16+aa,-0.16-aa,d);
          art -= smoothstep(-0.27-aa,-0.27+aa,d)*smoothstep(-0.32+aa,-0.32-aa,d);
          art = clamp(art,0.0,1.0);
          art = max(art, smoothstep(0.022,0.0,abs(p.x))*smoothstep(-0.72,-0.6,p.y)*smoothstep(0.2,0.05,p.y)*0.85);
          vec3 col = mix(crema, vec3(0.97,0.91,0.82), art);
          gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
          #include <colorspace_fragment>
        }`,
    }));
    coffee.rotation.x = -Math.PI / 2; coffee.position.y = 1.2; cupG.add(coffee);
    const steams = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uTime: uT, uPh: { value: i * 2.1 }, uA: { value: 0 } },
        vertexShader: 'varying vec2 vUv; uniform float uTime; uniform float uPh; void main(){ vUv = uv; vec3 p = position; p.x += sin(p.y*2.4 - uTime*1.2 + uPh)*0.16*uv.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uTime; uniform float uPh; uniform float uA;
          float h(vec2 i){ return fract(sin(dot(i, vec2(12.9,78.2)))*43758.5); }
          float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
          void main(){ vec2 q = vec2(vUv.x*3.0, vUv.y*2.2 - uTime*0.32 + uPh);
            float w = smoothstep(0.45,0.85, n(q)*0.6 + n(q*2.1)*0.4);
            float a = w*sin(3.14159*vUv.x)*smoothstep(0.0,0.15,vUv.y)*(1.0-smoothstep(0.5,1.0,vUv.y));
            gl_FragColor = vec4(vec3(1.0,0.95,0.9)*a*0.12*uA, 1.0); }`,
      });
      const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 2.6, 1, 48), m);
      s.position.set((i - 1) * 0.22, 2.6, (i - 1) * 0.1); s.rotation.y = (i - 1) * 0.9;
      cupG.add(s); steams.push(m);
    }
    const BN = low ? 22 : 34;
    const beans = new THREE.InstancedMesh(beanGeometry(), beanMat(), BN);
    const bd = Array.from({ length: BN }, () => ({ a: rand() * Math.PI * 2, r: 2.2 + rand() * 1.2, y: 0.2 + rand() * 2.2, sp: 0.1 + rand() * 0.2, sc: 0.13 + rand() * 0.07, ph: rand() * 6 }));
    root.add(beans);
    const sugarGeo = new RoundedBoxGeometry(0.34, 0.34, 0.34, 3, 0.05);
    const sugarMat = new THREE.MeshStandardMaterial({ color: '#b8aea2', roughness: 0.95 });
    const sugars = [[-2.1, 2.3, 0.8], [2.3, 2.8, -0.4], [-1.7, 0.2, 1.8]].map(([x, y, z], i) => { const m = new THREE.Mesh(sugarGeo, sugarMat); m.userData = { base: new THREE.Vector3(x, y, z), ph: i * 2 }; root.add(m); return m; });
    scene.add(new THREE.AmbientLight('#6b4128', 0.5));
    const key = new THREE.DirectionalLight('#fff0dc', 2.2); key.position.set(-3, 5, 5); scene.add(key);
    const rimL = new THREE.PointLight('#ff9448', 70, 0, 2); rimL.position.set(2.5, 2, -3); scene.add(rimL);
    const top = new THREE.PointLight('#ffd4a0', 18, 0, 2); top.position.set(0, 4, 2); scene.add(top);
    const dummy = new THREE.Object3D();
    return {
      layout(w, h) {
        if (isSmall()) { root.position.set(0, 1.75, 0); root.scale.setScalar(0.6); camera.position.set(0, 2.6, 10); camera.lookAt(0, 0.6, 0); }
        else { root.position.set(Math.min(2.8, 1.4 + (w / h - 1.2) * 1.8), -1.3, 0); root.scale.setScalar(1.12); camera.position.set(0, 2.2, 10); camera.lookAt(0, 0, 0); }
      },
      update({ t, it, sp, mouse }) {
        uT.value = t;
        const k = back((it - 0.1) / 1.4);
        cupG.position.y = (1 - k) * -3;
        cupG.rotation.y = -0.6 + (1 - k) * 2 + mouse.x * 0.35 + Math.sin(t * 0.3) * 0.08 + sp * 1.2;
        cupG.rotation.x = 0.1 + mouse.y * 0.08;
        steams.forEach((s) => (s.uniforms.uA.value = ease((it - 1.1) / 1.5) * (1 - sp)));
        const bk = ease((it - 0.6) / 1.5);
        bd.forEach((b, i) => {
          const a = b.a + t * b.sp;
          dummy.position.set(Math.cos(a) * b.r * (1 + sp * 0.6), b.y + Math.sin(t + b.ph) * 0.15, Math.sin(a) * b.r * 0.7);
          dummy.rotation.set(t + b.ph, t * 0.7, b.ph);
          dummy.scale.setScalar(b.sc * bk + 0.0001);
          dummy.updateMatrix(); beans.setMatrixAt(i, dummy.matrix);
        });
        beans.instanceMatrix.needsUpdate = true;
        sugars.forEach((m, i) => {
          const d = m.userData;
          m.position.set(d.base.x, d.base.y + Math.sin(t * 0.8 + d.ph) * 0.2, d.base.z);
          m.rotation.set(t * 0.4 + d.ph, t * 0.3, d.ph);
          m.scale.setScalar(ease((it - 1 - i * 0.15) / 1.2) + 0.0001);
        });
      },
    };
  };

  const api = (SCENES[name] || SCENES.orb)();

  /* ---------- layout / input / loop ---------- */
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h;
    camera.fov = isSmall() ? 44 : 35;
    camera.updateProjectionMatrix();
    api.layout(w, h);
  }
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouse.tx = (e.clientX / innerWidth) * 2 - 1; mouse.ty = (e.clientY / innerHeight) * 2 - 1; mouse.active = true;
  }, { passive: true });
  addEventListener('deviceorientation', (e) => {
    if (e.gamma == null) return;
    mouse.tx = clamp(e.gamma / 30, -1, 1); mouse.ty = clamp((e.beta - 45) / 30, -1, 1);
  });

  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
  const clock = new THREE.Clock();
  let introAt = -1;
  const startIntro = () => { if (introAt < 0) introAt = clock.getElapsedTime(); };
  if (window.__pageReady) startIntro(); else addEventListener('page:ready', startIntro);

  let first = true, last = 0;
  function tick() {
    requestAnimationFrame(tick);
    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - last); last = t;
    if ((!visible || document.hidden) && !first) return;
    const it = introAt < 0 ? 0 : t - introAt;
    const heroH = canvas.parentElement.offsetHeight || innerHeight;
    const sp = clamp(scrollY / heroH, 0, 1);
    const idleX = Math.sin(t * 0.45) * 0.35, idleY = Math.cos(t * 0.35) * 0.2;
    mouse.x += ((mouse.active ? mouse.tx : idleX) - mouse.x) * 0.05;
    mouse.y += ((mouse.active ? mouse.ty : idleY) - mouse.y) * 0.05;
    api.update({ t, dt, it, sp, mouse });
    if (name !== 'cup') { camera.position.x = mouse.x * 0.35; camera.position.y = -mouse.y * 0.22 - sp * 0.6; camera.lookAt(0, -sp * 0.4, 0); }
    composer.render();
    if (first) { first = false; ready(); }
  }
  tick();
})();
