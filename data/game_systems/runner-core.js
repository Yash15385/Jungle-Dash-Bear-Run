const SAVE_KEY = 'runner-game-save-v1';

export function createRun() {
  return { state: 'ready', elapsed: 0, distance: 0, score: 0, coins: 0, speed: 8, shield: false, multiplierUntil: 0 };
}

export function advanceRun(run, deltaSeconds) {
  if (run.state !== 'running') return run;
  const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
  run.elapsed += dt;
  run.speed = Math.min(20, 8 + run.elapsed * 0.12);
  run.distance += run.speed * dt;
  run.score = Math.floor(run.distance * (run.elapsed < run.multiplierUntil ? 2 : 1)) + run.coins * 10;
  return run;
}

export function collectCoin(run, value = 1) { run.coins += value; run.score += value * 10; }
export function startRun(run) { run.state = 'running'; return run; }
export function pauseRun(run) { if (run.state === 'running') run.state = 'paused'; return run; }
export function resumeRun(run) { if (run.state === 'paused') run.state = 'running'; return run; }
export function endRun(run) { run.state = 'over'; return run; }

export function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) ?? { bestScore: 0, settings: { sound: true } }; }
  catch { return { bestScore: 0, settings: { sound: true } }; }
}
export function saveRun(run, previous = loadSave()) {
  const save = { ...previous, bestScore: Math.max(previous.bestScore ?? 0, run.score) };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* Storage can be unavailable in private or restricted contexts. */ }
  return save;
}
