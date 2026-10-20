const DEFAULTS = { lane: 1, laneGap: null, jumpDuration: 560, slideDuration: 520, hitDuration: 480 };

/** Attach runner controls to a .runner-player element. Lanes are 0 (left), 1 (middle), 2 (right). */
export function createPlayerController(element, options = {}) {
  if (!(element instanceof HTMLElement)) throw new TypeError('Pass a player HTMLElement.');
  const config = { ...DEFAULTS, ...options };
  const stage = config.stage ?? element.parentElement;
  if (!stage) throw new Error('Player needs a parent stage element.');
  stage.classList.add('runner-stage');
  let lane = Math.max(0, Math.min(2, config.lane));
  let state = 'run';
  let timer;
  let touchStart = null;
  let paused = false;

  function renderLane() {
    element.style.left = `${50 + (lane - 1) * (config.laneGap ?? 22)}%`;
    element.dataset.lane = String(lane);
    config.onLaneChange?.(lane);
  }
  function setState(next, duration = 0) {
    if (paused && next !== 'hit') return;
    clearTimeout(timer);
    state = next;
    element.dataset.state = next;
    config.onAction?.(next);
    if (duration) timer = setTimeout(() => setState('run'), duration);
  }
  function move(direction) {
    if (paused) return;
    const next = Math.max(0, Math.min(2, lane + direction));
    if (next !== lane) { lane = next; renderLane(); }
    config.onAction?.(direction < 0 ? 'left' : 'right');
  }
  function jump() { if (!paused && state === 'run') setState('jump', config.jumpDuration); }
  function slide() { if (!paused && state === 'run') setState('slide', config.slideDuration); }
  function hit() { setState('hit', config.hitDuration); }
  function onKeyDown(event) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
    if (event.repeat) return;
    switch (event.key.toLowerCase()) {
      case 'arrowleft': case 'a': move(-1); break;
      case 'arrowright': case 'd': move(1); break;
      case 'arrowup': case 'w': case ' ': jump(); break;
      case 'arrowdown': case 's': slide(); break;
      case 'p': case 'escape': api.setPaused(!paused); break;
    }
  }
  function onTouchStart(event) {
    const t = event.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(event) {
    if (!touchStart || paused) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? -1 : 1);
    else if (dy < 0) jump(); else slide();
  }
  window.addEventListener('keydown', onKeyDown);
  stage.addEventListener('touchstart', onTouchStart, { passive: true });
  stage.addEventListener('touchend', onTouchEnd, { passive: true });
  const api = {
    get lane() { return lane; },
    get state() { return state; },
    moveLeft: () => move(-1), moveRight: () => move(1), jump, slide, hit,
    setPaused(value) { paused = Boolean(value); if (paused) setState('idle'); else setState('run'); },
    destroy() {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchend', onTouchEnd);
    },
  };
  renderLane();
  setState('run');
  return api;
}
