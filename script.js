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
    let token = 0;

    const scrollDown = () => thread.scrollTo({ top: thread.scrollHeight, behavior: 'smooth' });
    const reveal = el => { el.hidden = false; requestAnimationFrame(() => el.classList.add('show')); };

    function resetDemo() {
      demo.classList.remove('typing');
      typedEl.textContent = '';
      for (const el of [...userMsgs, ...botMsgs]) { el.hidden = true; el.classList.remove('show'); }
      for (const c of demo.querySelectorAll('.d-card')) c.classList.add('building');
      thread.scrollTop = 0;
    }

    async function run() {
      const me = ++token; resetDemo();
      if (reduce) {                                     // show the finished conversation, no animation
        for (let i = 0; i < PROMPTS.length; i++) { userMsgs[i].textContent = PROMPTS[i]; reveal(userMsgs[i]); reveal(botMsgs[i]); }
        for (const c of demo.querySelectorAll('.d-card')) c.classList.remove('building');
        return;
      }
      const alive = () => me === token;
      await sleep(600); if (!alive()) return;
      for (let i = 0; i < PROMPTS.length; i++) {
        const p = PROMPTS[i];
        demo.classList.add('typing');                   // type the prompt into the composer
        for (let k = 1; k <= p.length; k++) { typedEl.textContent = p.slice(0, k); await sleep(34 + Math.random() * 44); if (!alive()) return; }
        await sleep(520); if (!alive()) return;
        demo.classList.remove('typing'); typedEl.textContent = '';   // send -> user bubble
        userMsgs[i].textContent = p; reveal(userMsgs[i]); scrollDown();
        await sleep(620); if (!alive()) return;
        const bot = botMsgs[i]; reveal(bot); scrollDown();            // assistant reply (text + building card)
        await sleep(1500); if (!alive()) return;
        bot.querySelector('.d-card').classList.remove('building'); scrollDown();   // the model arrives
        await sleep(i < PROMPTS.length - 1 ? 1700 : 5200); if (!alive()) return;
      }
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
})();
