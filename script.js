// Landing interactions: the conversational demo thread + the parametric slider viz. Both pause when off screen.
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- Demo: play conversation chapters, each ending in a 3D spin of its final part ---------- */
  const demo = document.getElementById('demo');
  if (demo) {
    const thread = demo.querySelector('.demo-thread');
    const typedEl = demo.querySelector('.demo-typed');
    const tabEl = demo.querySelector('.demo-tab');
    const spinVid = demo.querySelector('.demo-spin-vid');
    const spinPhoto = demo.querySelector('.demo-spin-photo');
    const spinTag = demo.querySelector('.demo-spin-tag');
    let token = 0;
    const scrollDown = () => thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    const reveal = el => { el.hidden = false; requestAnimationFrame(() => el.classList.add('show')); return el; };

    const CHAPTERS = [
      { tab: 'BVM UAT Cradle', spin: 'assets/spin/uat.mp4', spinLabel: 'BVM UAT Cradle · drag to rotate', turns: [
        { u: 'A UAT cradle mount for an RC jet — like a BVM UAT, with M3 mounting holes.',
          b: 'I’ll make a strap-retained UAT cradle on a flat screw-down base, with a four-hole M3 pattern and an adjustable saddle.',
          img: 'assets/demo/uat1.png', cap: 'BVM UAT Cradle', tag: 'RC jet mount' },
        { u: 'Give it a 23° tilt.',
          b: 'Done — the cradle now sits 23° above the base. Straps, saddle, and M3 holes unchanged.',
          img: 'assets/demo/uat2.png', cap: 'Updated · 23° tilt', tag: 'rev 2' },
      ] },
      { tab: 'Oven Knob', spin: 'assets/spin/knob.mp4', spinLabel: 'Oven Knob · drag to rotate',
        photo: 'assets/demo/knob-real.jpg', photoLabel: 'Printed, and back on the oven', turns: [
        { u: 'Design a replacement oven knob for a GE Profile range.',
          b: 'Here’s a push-on knob with a knurled grip and a D-shaft socket sized to the GE Profile stem.',
          img: 'assets/demo/knob.png', cap: 'Oven Knob', tag: 'GE Profile' },
      ] },
      { tab: 'Pi 5 Enclosure', spin: 'assets/spin/lid.mp4', spinLabel: 'Raspberry Pi 5 Enclosure · drag to rotate', turns: [
        { u: 'create a snap-fit enclosure for a Raspberry Pi 5',
          b: 'I’ll make a two-piece enclosure — a snap-fit lid over a base, with ventilation and cutouts for the ports, microSD, and power button. Building 2 parts: a Base tray and a ventilated Lid.',
          img: 'assets/demo/step1.png', cap: 'Raspberry Pi 5 Enclosure', tag: 'Base · Lid' },
        { u: 'make the cooling vents hexagonal',
          b: 'Done — switched the cooling vents on the Base and Lid to hexagonal holes. The shell, ports, and snap-fit features are unchanged.',
          img: 'assets/demo/step2.png', cap: 'Updated · hexagonal vents', tag: 'rev 2' },
      ] },
    ];

    const userBubble = text => { const d = document.createElement('div'); d.className = 'd-msg user'; d.textContent = text; return d; };
    function botBubble(turn) {
      const d = document.createElement('div'); d.className = 'd-msg bot';
      const p = document.createElement('p'); p.textContent = turn.b; d.appendChild(p);
      const fig = document.createElement('figure'); fig.className = 'd-card building';
      const st = document.createElement('div'); st.className = 'd-card-stage';
      const sp = document.createElement('span'); sp.className = 'spinner';
      const img = document.createElement('img'); img.src = turn.img; img.alt = '';
      st.append(sp, img); fig.appendChild(st);
      const cap = document.createElement('figcaption');
      const c1 = document.createElement('span'); c1.textContent = turn.cap;
      const c2 = document.createElement('span'); c2.className = 'd-tag'; c2.textContent = turn.tag;
      cap.append(c1, c2); fig.appendChild(cap); d.appendChild(fig);
      return d;
    }
    function clearThread() {
      for (const n of [...thread.querySelectorAll('.d-msg')]) n.remove();
      demo.classList.remove('typing', 'spinning', 'photo'); demo.classList.add('empty');
      typedEl.textContent = ''; thread.scrollTop = 0;
    }

    async function playChapter(ch, alive) {
      clearThread();
      tabEl.textContent = 'shapecraft · ' + ch.tab;
      await sleep(650); if (!alive()) return;
      for (const turn of ch.turns) {
        demo.classList.add('typing'); demo.classList.remove('empty');
        for (let k = 1; k <= turn.u.length; k++) { typedEl.textContent = turn.u.slice(0, k); await sleep(32 + Math.random() * 42); if (!alive()) return; }
        await sleep(470); if (!alive()) return;
        demo.classList.remove('typing'); typedEl.textContent = '';
        reveal(thread.appendChild(userBubble(turn.u))); scrollDown();
        await sleep(600); if (!alive()) return;
        const bb = reveal(thread.appendChild(botBubble(turn))); scrollDown();
        await sleep(1350); if (!alive()) return;
        bb.querySelector('.d-card').classList.remove('building'); scrollDown();   // the model arrives
        await sleep(1100); if (!alive()) return;
      }
      spinVid.src = ch.spin; spinTag.textContent = ch.spinLabel;                  // full-window spin of the final part
      demo.classList.add('spinning'); spinVid.play && spinVid.play().catch(() => {});
      await sleep(3900); if (!alive()) return;
      if (ch.photo) {                                                             // then the real, printed part
        spinPhoto.src = ch.photo; spinTag.textContent = ch.photoLabel;
        demo.classList.add('photo');
        await sleep(3600); if (!alive()) return;
        demo.classList.remove('photo');
      }
      demo.classList.remove('spinning'); spinVid.pause && spinVid.pause();
      await sleep(450); if (!alive()) return;
    }

    async function run() {
      const me = ++token;
      const alive = () => me === token;
      if (reduce) {                                       // reduced motion: render the last chapter, statically
        clearThread(); demo.classList.remove('empty');
        for (const turn of CHAPTERS[CHAPTERS.length - 1].turns) {
          reveal(thread.appendChild(userBubble(turn.u)));
          const bb = thread.appendChild(botBubble(turn)); bb.querySelector('.d-card').classList.remove('building'); reveal(bb);
        }
        return;
      }
      for (const ch of CHAPTERS) { await playChapter(ch, alive); if (!alive()) return; }
      run();
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
    const promptText = modal.querySelector('.viewer-prompt-text');
    const refsWrap = modal.querySelector('.viewer-refs');
    const dlLink = modal.querySelector('.viewer-dl');
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

    async function open(card) {
      const url = card.dataset.model, title = card.dataset.title;
      const me = ++loadToken;
      titleEl.textContent = title || '';
      promptText.textContent = card.dataset.prompt || '';
      refsWrap.innerHTML = '';
      const refs = (card.dataset.refs || '').split(',').map(s => s.trim()).filter(Boolean);
      refsWrap.hidden = !refs.length;
      for (const src of refs) {
        const a = document.createElement('a'); a.href = src; a.target = '_blank'; a.rel = 'noopener';
        const im = document.createElement('img'); im.src = src; im.alt = 'Reference image'; im.loading = 'lazy';
        a.appendChild(im); refsWrap.appendChild(a);
      }
      dlLink.href = url; dlLink.setAttribute('download', (title || 'model').replace(/[^\w.-]+/g, '-') + '.stl');
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
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(card); } });
    }
    for (const dl of document.querySelectorAll('.listing-dl')) dl.addEventListener('click', e => e.stopPropagation());
    for (const el of modal.querySelectorAll('[data-close]')) el.addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });
  }

  /* ---------- Early-access form: open a pre-filled email to the inbox ---------- */
  const accessForm = document.getElementById('accessForm');
  if (accessForm) {
    accessForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = (document.getElementById('accessEmail').value || '').trim();
      const subject = encodeURIComponent('Shapecraft early access');
      const body = encodeURIComponent('I’d like early access to Shapecraft.' + (email ? '\n\nMy email: ' + email : ''));
      location.href = 'mailto:das.anupam@gmail.com?subject=' + subject + '&body=' + body;
    });
  }
})();
