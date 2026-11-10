// Type-on demo: types a prompt, "sends" it, shows a two-part build, then reveals the model. Loops while in view.
(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const demo = document.getElementById('demo');
  if (!demo) return;

  const typedEl = demo.querySelector('.demo-typed');
  const msgEl = demo.querySelector('.demo-msg');
  const statusLabel = demo.querySelector('.demo-status-label');
  const parts = demo.querySelectorAll('.demo-part');
  const PROMPT = 'create a snap-fit enclosure for a Raspberry Pi 5';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  let token = 0;                                   // bumping it cancels any in-flight cycle

  function reset() {
    demo.classList.remove('is-typing', 'is-sent', 'is-building', 'is-done');
    typedEl.textContent = '';
    msgEl.hidden = true; msgEl.textContent = '';
    parts[0].classList.add('is-on');
    parts[1].classList.remove('is-on');
    if (statusLabel) statusLabel.textContent = 'Building Base…';
  }

  async function cycle() {
    const me = ++token;
    reset();
    if (reduce) {                                  // show the finished state, skip the animation
      msgEl.textContent = PROMPT; msgEl.hidden = false;
      demo.classList.add('is-done');
      return;
    }
    const alive = () => me === token;

    await sleep(700); if (!alive()) return;
    demo.classList.add('is-typing');
    for (let i = 1; i <= PROMPT.length; i++) {
      typedEl.textContent = PROMPT.slice(0, i);
      await sleep(36 + Math.random() * 46); if (!alive()) return;
    }

    await sleep(650); if (!alive()) return;
    demo.classList.replace('is-typing', 'is-sent');          // "send" the prompt as a chat bubble
    msgEl.textContent = PROMPT; msgEl.hidden = false; typedEl.textContent = '';

    await sleep(500); if (!alive()) return;
    demo.classList.add('is-building');                        // build Base, then Lid
    await sleep(1500); if (!alive()) return;
    if (statusLabel) statusLabel.textContent = 'Building Lid…';
    parts[0].classList.remove('is-on'); parts[1].classList.add('is-on');
    await sleep(1500); if (!alive()) return;

    parts[0].classList.add('is-on');                          // both parts built
    demo.classList.remove('is-building'); demo.classList.add('is-done');

    await sleep(4400); if (!alive()) return;
    cycle();
  }

  // Run only while the demo is on screen.
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) cycle();
      else token++;                                           // pause: cancel the running cycle
    }
  }, { threshold: 0.35 });
  io.observe(demo);
})();
