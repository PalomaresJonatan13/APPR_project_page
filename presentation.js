(() => {
  const deck = document.querySelector('#presentation');
  const full = document.querySelector('#full-version');
  const slides = [...deck.querySelectorAll('.deck-slide')];
  const previous = document.querySelector('#deck-prev');
  const next = document.querySelector('#deck-next');
  const originalBrand = full.querySelector('.brand');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let busy = false;
  let fullScroll = 0;
  let wheelTotal = 0;
  let lastWheel = 0;
  let touchStart = null;
  const presenting = () => document.body.classList.contains('presentation-mode');
  originalBrand.setAttribute('role', 'button');
  originalBrand.setAttribute('aria-label', 'APPR: cambiar a la presentación');
  originalBrand.title = 'Cambiar a la presentación';
  // Without JavaScript, the existing document remains readable.
  full.inert = true;

  async function animate(element, frames, duration) {
    if (reducedMotion.matches || !element.animate) return;
    await element.animate(frames, { duration, easing: 'ease-out' }).finished;
  }

  async function toggleView(event) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    const wasPresenting = presenting();
    const outgoing = wasPresenting ? deck : full;
    const incoming = wasPresenting ? full : deck;
    if (!wasPresenting) fullScroll = window.scrollY;
    await animate(outgoing, [{ opacity: 1 }, { opacity: 0 }], 140);
    document.body.classList.toggle('presentation-mode', !wasPresenting);
    full.inert = !wasPresenting;
    deck.inert = wasPresenting;
    window.scrollTo(0, wasPresenting ? fullScroll : 0);
    await animate(incoming, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], 220);
    (wasPresenting ? originalBrand : deck.querySelector('.deck-brand')).focus({ preventScroll: true });
    wheelTotal = 0;
    busy = false;
  }
  deck.querySelector('[data-toggle-view]').addEventListener('click', toggleView);
  originalBrand.addEventListener('click', toggleView);
  originalBrand.addEventListener('keydown', event => {
    if (event.key === ' ') toggleView(event);
  });

  function updateControls() {
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.querySelector('#deck-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    document.querySelector('.deck-progress span').style.width = `${(current + 1) / slides.length * 100}%`;
  }
  updateControls();

  async function goTo(index, focus = false) {
    if (busy || !presenting() || index < 0 || index >= slides.length || index === current) return;
    busy = true;
    const direction = index > current ? 1 : -1;
    await animate(slides[current], [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${-direction * 12}px)` }], 130);
    slides[current].hidden = true;
    current = index;
    slides[current].hidden = false;
    slides[current].scrollTop = 0;
    updateControls();
    if (focus || deck.contains(document.activeElement)) slides[current].querySelector('h1, h2').focus({ preventScroll: true });
    await animate(slides[current], [{ opacity: 0, transform: `translateY(${direction * 12}px)` }, { opacity: 1, transform: 'translateY(0)' }], 230);
    busy = false;
  }
  previous.addEventListener('click', () => goTo(current - 1, true));
  next.addEventListener('click', () => goTo(current + 1, true));
  document.addEventListener('keydown', event => {
    if (!presenting() || event.altKey || event.ctrlKey || event.metaKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[event.key];
    if (!step && !['Home', 'End'].includes(event.key)) return;
    // Let long slides scroll vertically before moving to another slide.
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && canScroll(step)) return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + step, true);
  });
  function canScroll(direction) {
    const slide = slides[current];
    return direction > 0 ? slide.scrollTop + slide.clientHeight < slide.scrollHeight - 2 : slide.scrollTop > 2;
  }
  deck.addEventListener('wheel', event => {
    if (!presenting() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const direction = Math.sign(event.deltaY);
    if (canScroll(direction)) { wheelTotal = 0; return; }
    event.preventDefault();
    const now = performance.now();
    const gap = now - lastWheel;
    lastWheel = now;
    // Consume the rest of a trackpad gesture so inertia cannot skip slides.
    if (busy || (gap < 180 && wheelTotal === Infinity)) return;
    if (gap > 180 || Math.sign(wheelTotal) !== direction) wheelTotal = 0;
    wheelTotal += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? deck.clientHeight : 1);
    if (Math.abs(wheelTotal) >= 45) { wheelTotal = Infinity; goTo(current + direction); }
  }, { passive: false });
  deck.addEventListener('touchstart', event => {
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }, { passive: true });
  deck.addEventListener('touchend', event => {
    if (!touchStart) return;
    const dx = touchStart.x - event.changedTouches[0].clientX;
    const dy = touchStart.y - event.changedTouches[0].clientY;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const delta = horizontal ? dx : dy;
    if (Math.abs(delta) > 60 && (horizontal || !canScroll(Math.sign(delta)))) goTo(current + Math.sign(delta));
    touchStart = null;
  }, { passive: true });
})();
