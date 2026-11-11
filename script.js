// Landing interactions: the conversational demo thread + the parametric slider viz. Both pause when off screen.
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Demo: shaping a part through conversation ---------- */
  const demo = document.getElementById('demo');
  if (demo) {
    const thread = demo.querySelector('.demo-thread');
    const typedEl = demo.querySelector('.demo-typed');
    const userMsgs = [...demo.querySelectorAll('.d-msg.user')];
    const botMsgs = [...demo.querySelectorAll('.d-msg.bot')];
    const PROMPTS = ['create a snap-fit enclosure for a Raspberry Pi 5', 'make the cooling vents hexagonal'];
    const spinVid = demo.querySelector('.demo-spin-vid');
    if (reduce) spinVid?.pause();
    let token = 0;

    const scrollDown = () => thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    const reveal = el => { el.hidden = false; requestAnimationFrame(() => el.classList.add('show')); };

    function resetDemo() {
      demo.classList.remove('typing', 'spinning');
      demo.classList.add('empty');                      // "What would you like to make?" until the first prompt
      typedEl.textContent = '';
      for (const el of [...userMsgs, ...botMsgs]) { el.hidden = true; el.classList.remove('show'); }
      for (const c of demo.querySelectorAll('.d-card')) c.classList.add('building');
      thread.scrollTop = 0;
    }

    async function run() {
      const me = ++token; resetDemo();
      if (reduce) {                                     // show the finished conversation, no animation
        demo.classList.remove('empty');
        for (let i = 0; i < PROMPTS.length; i++) { userMsgs[i].textContent = PROMPTS[i]; reveal(userMsgs[i]); reveal(botMsgs[i]); }
        for (const c of demo.querySelectorAll('.d-card')) c.classList.remove('building');
        return;
      }
      const alive = () => me === token;
      await sleep(600); if (!alive()) return;
      for (let i = 0; i < PROMPTS.length; i++) {
        const p = PROMPTS[i];
        demo.classList.add('typing'); demo.classList.remove('empty');   // type the prompt into the composer
        for (let k = 1; k <= p.length; k++) { typedEl.textContent = p.slice(0, k); await sleep(34 + Math.random() * 44); if (!alive()) return; }
        await sleep(520); if (!alive()) return;
        demo.classList.remove('typing'); typedEl.textContent = '';   // send -> user bubble
        userMsgs[i].textContent = p; reveal(userMsgs[i]); scrollDown();
        await sleep(620); if (!alive()) return;
        const bot = botMsgs[i]; reveal(bot); scrollDown();            // assistant reply (text + building card)
        await sleep(1500); if (!alive()) return;
        bot.querySelector('.d-card').classList.remove('building'); scrollDown();   // the model arrives
        await sleep(i < PROMPTS.length - 1 ? 1700 : 1300); if (!alive()) return;
      }
      demo.classList.add('spinning'); spinVid && spinVid.play().catch(() => {});   // full-window spin of the finished part
      await sleep(5000); if (!alive()) return;
      demo.classList.remove('spinning');
      await sleep(500); if (!alive()) return;
      run();                                            // loop
    }

    new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) run(); else token++; } }, { threshold: 0.3 }).observe(demo);
  }

  /* ---------- Parametric slider viz: thumbs + values drift, part need not move ---------- */
  const panel = document.getElementById('paramPanel');
  if (panel) {
    const sliders = [...panel.querySelectorAll('.p-slider')].map(el => ({
      fill: el.querySelector('.p-fill'), thumb: el.querySelector('.p-thumb'), val: el.querySelector('.p-val'),
      min: +el.dataset.min, max: +el.dataset.max, unit: el.dataset.unit || '', dec: +el.dataset.dec || 0,
      phase: Math.random() * Math.PI * 2, speed: 0.22 + Math.random() * 0.3,
    }));
    let raf = 0, running = false;
    function frame(t) {
      for (const s of sliders) {
        const u = 0.5 + 0.5 * Math.sin(t / 1000 * s.speed + s.phase);
        let v = s.min + u * (s.max - s.min);
        if (s.dec === 0) v = Math.round(v);
        const pct = (v - s.min) / (s.max - s.min) * 100;
        s.fill.style.width = pct + '%';
        s.thumb.style.left = pct + '%';
        s.val.textContent = v.toFixed(s.dec) + (s.unit ? ' ' + s.unit : '');
      }
      raf = requestAnimationFrame(frame);
    }
    const start = () => { if (!running && !reduce) { running = true; raf = requestAnimationFrame(frame); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    new IntersectionObserver(es => { for (const e of es) e.isIntersecting ? start() : stop(); }, { threshold: 0.2 }).observe(panel);
  }

  /* ---------- Marketplace: rotate each part — hover-scrub on desktop, scroll-driven on touch ---------- */
  const spinThumbs = [...document.querySelectorAll('.listing-thumb.spin')];
  const setFrame = (t, frac) => {
    const frames = +t.dataset.frames || 24;
    const f = Math.round(Math.min(1, Math.max(0, frac)) * (frames - 1));
    t.style.backgroundPositionX = (f / (frames - 1) * 100) + '%';
  };
  for (const t of spinThumbs) t.style.backgroundSize = ((+t.dataset.frames || 24) * 100) + '% 100%';

  if (matchMedia('(hover: hover)').matches) {                 // desktop: horizontal mouse scrubs the turntable
    for (const t of spinThumbs) {
      t.addEventListener('pointermove', e => { const r = t.getBoundingClientRect(); setFrame(t, (e.clientX - r.left) / r.width); });
      t.addEventListener('pointerleave', () => { t.style.backgroundPositionX = '0%'; });
    }
  } else if (spinThumbs.length) {                             // touch: the part rotates as its card scrolls through the viewport
    let ticking = false;
    const onScroll = () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const vh = innerHeight || document.documentElement.clientHeight;
        for (const t of spinThumbs) {
          const r = t.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) continue;
          setFrame(t, (vh - r.top) / (vh + r.height));        // 0 as it enters the bottom → 1 as it leaves the top
        }
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- Skills: sim describing a build, then the AI offers a matching expert ---------- */
  const sim = document.getElementById('skillSim');
  if (sim) {
    const typedEl = sim.querySelector('.demo-typed');
    const userMsg = sim.querySelector('.d-msg.user');
    const botMsg = sim.querySelector('.d-msg.bot');
    const useBtn = sim.querySelector('.sim-use');
    const PROMPT = "I'd like to make a scale architectural model";
    const USE_LABEL = useBtn ? useBtn.textContent : '';
    let stoken = 0;
    const reveal = el => { el.hidden = false; requestAnimationFrame(() => el.classList.add('show')); };
    function reset() {
      sim.classList.remove('typing'); sim.classList.add('empty');
      typedEl.textContent = '';
      for (const el of [userMsg, botMsg]) { el.hidden = true; el.classList.remove('show'); }
      if (useBtn) { useBtn.classList.remove('used'); useBtn.textContent = USE_LABEL; }
    }
    async function run() {
      const me = ++stoken; reset();
      if (reduce) {
        userMsg.textContent = PROMPT; reveal(userMsg); reveal(botMsg); sim.classList.remove('empty');
        if (useBtn) { useBtn.classList.add('used'); useBtn.textContent = '✓ Active'; }
        return;
      }
      const alive = () => me === stoken;
      await sleep(700); if (!alive()) return;
      sim.classList.add('typing'); sim.classList.remove('empty');
      for (let k = 1; k <= PROMPT.length; k++) { typedEl.textContent = PROMPT.slice(0, k); await sleep(34 + Math.random() * 44); if (!alive()) return; }
      await sleep(520); if (!alive()) return;
      sim.classList.remove('typing'); typedEl.textContent = '';
      userMsg.textContent = PROMPT; reveal(userMsg);
      await sleep(700); if (!alive()) return;
      reveal(botMsg);                                   // AI offers the expert
      await sleep(1600); if (!alive()) return;
      if (useBtn) { useBtn.classList.add('used'); useBtn.textContent = '✓ Active'; }   // accepted
      await sleep(4200); if (!alive()) return;
      run();
    }
    new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) run(); else stoken++; } }, { threshold: 0.3 }).observe(sim);
  }

  /* ---------- Gallery: click a part to open the real STL in an interactive WebGL viewer ---------- */
  const modal = document.getElementById('viewer');
  if (modal) {
    const stage = modal.querySelector('.viewer-stage');
    const titleEl = modal.querySelector('.viewer-title');
    const statusEl = modal.querySelector('.viewer-status');
    let V = null, loadToken = 0;

    async function ensureThree() {
      if (V) return V;
      const THREE = await import('three');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      stage.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.enablePan = false; controls.autoRotate = true; controls.autoRotateSpeed = 1.3;
      controls.addEventListener('start', () => { controls.autoRotate = false; });
      scene.add(new THREE.HemisphereLight(0xffffff, 0x3a4046, 1.15));
      const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(1, 1.4, 1); scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.5); fill.position.set(-1, -0.4, -0.8); scene.add(fill);
      const material = new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.62, metalness: 0.08 });
      const loader = new STLLoader();
      let mesh = null, raf = 0, running = false;
      const resize = () => { const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      new ResizeObserver(resize).observe(stage);
      const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
      V = {
        start() { if (!running) { running = true; loop(); } },
        stop() { running = false; cancelAnimationFrame(raf); },
        async load(url) {
          const geo = await new Promise((res, rej) => loader.load(url, res, undefined, rej));
          if (mesh) { scene.remove(mesh); mesh.geometry.dispose(); }
          geo.computeVertexNormals(); geo.computeBoundingBox();
          const c = new THREE.Vector3(); geo.boundingBox.getCenter(c); geo.translate(-c.x, -c.y, -c.z);
          geo.computeBoundingSphere();
          const r = (geo.boundingSphere && geo.boundingSphere.radius) || 50;
          mesh = new THREE.Mesh(geo, material); mesh.rotation.x = -Math.PI / 2; scene.add(mesh);   // app geometry is Z-up
          const dist = (r / Math.sin((camera.fov * Math.PI / 180) / 2)) * 1.25;
          camera.position.set(dist * 0.6, dist * 0.45, dist * 0.85);
          controls.autoRotate = true; controls.target.set(0, 0, 0);
          controls.minDistance = r * 0.5; controls.maxDistance = dist * 4; controls.update();
          resize();
        },
      };
      return V;
    }

    async function open(url, title) {
      const me = ++loadToken;
      titleEl.textContent = title || '';
      statusEl.textContent = 'Loading 3D…';
      modal.hidden = false; document.body.style.overflow = 'hidden';
      try {
        const v = await ensureThree(); if (me !== loadToken) return;
        v.start(); await v.load(url); if (me !== loadToken) return;
        statusEl.textContent = '';
      } catch (err) { statusEl.textContent = 'Could not load the model.'; }
    }
    function close() { loadToken++; modal.hidden = true; document.body.style.overflow = ''; V && V.stop(); }

    for (const card of document.querySelectorAll('.listing[data-model]')) {
      card.addEventListener('click', () => open(card.dataset.model, card.dataset.title));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card.dataset.model, card.dataset.title); } });
    }
    for (const el of modal.querySelectorAll('[data-close]')) el.addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }
})();
