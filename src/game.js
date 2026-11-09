import {
  update3DScene,
  resizeScene,
  triggerCameraShake,
  spawnParticles,
  setCustomization,
  TRAIN_HEIGHT,
  TRAIN_LENGTH,
  RAMP_LENGTH,
} from './scene3d.js';

import {
  playCoinSound,
  playJumpSound,
  playSlideSound,
  playLaneChangeSound,
  playPowerupSound,
  playHoverboardSound,
  playHoverboardBreakSound,
  playTrainHornSound,
  playCrashSound,
  playButtonSound,
  playChaChing,
  playFanfare,
  playMysteryBoxOpen,
  playReviveSound,
  playCloseCallSound,
  playRocketBoostSound,
  playCountdownTick,
  playRecordBrokenSound,
  playLetterCollectSound,
  startMusic,
  stopMusic,
  setMuted,
} from './audio.js';

const shell = document.querySelector('#gameShell');
const canvas3d = document.querySelector('#scene3d');
const $ = id => document.getElementById(id);

const screens = {
  start: $('startScreen'),
  pause: $('pauseScreen'),
  over: $('gameOverScreen'),
  settings: $('settingsScreen'),
  shop: $('shopScreen'),
  missions: $('missionsScreen'),
  saveMe: $('saveMeScreen'),
};

const settings = { sound: localStorage.getItem('jungle-dash-sound') !== 'off' };
setMuted(!settings.sound);

// -------------------------------------------------------------
// PERSISTENT PROGRESSION & SHOP STORAGE
// -------------------------------------------------------------
const SAVE_KEYS = {
  best: 'jungle-dash-best',
  bank: 'jungle-dash-bank-coins',
  profile: 'jungle-dash-profile-v2',
  missions: 'jungle-dash-missions-v2',
};

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEYS.profile)) || {
      char: 'jake',
      board: 'blueWave',
      unlockedChars: ['jake'],
      unlockedBoards: ['blueWave'],
      magnetLvl: 1,
      jetpackLvl: 1,
      multiplier: 1,
      hoverboardCount: 3,
      keys: 3,
      headstarts: 2,
    };
  } catch {
    return {
      char: 'jake',
      board: 'blueWave',
      unlockedChars: ['jake'],
      unlockedBoards: ['blueWave'],
      magnetLvl: 1,
      jetpackLvl: 1,
      multiplier: 1,
      hoverboardCount: 3,
      keys: 3,
      headstarts: 2,
    };
  }
}

function saveProfile(p) {
  try { localStorage.setItem(SAVE_KEYS.profile, JSON.stringify(p)); } catch {}
}

const profile = loadProfile();
let bankCoins = Number(localStorage.getItem(SAVE_KEYS.bank) || 150);

function addBankCoins(amount) {
  bankCoins += amount;
  try { localStorage.setItem(SAVE_KEYS.bank, String(bankCoins)); } catch {}
  updateHeaderStats();
}

function bestScore() {
  return Number(localStorage.getItem(SAVE_KEYS.best) || 0);
}

// -------------------------------------------------------------
// MISSIONS SYSTEM
// -------------------------------------------------------------
const MISSION_TEMPLATES = [
  { id: 'coins_50', desc: 'Collect 50 coins in a single run', target: 50, type: 'coins' },
  { id: 'jump_6', desc: 'Jump over 6 hurdles', target: 6, type: 'jump' },
  { id: 'dist_350', desc: 'Reach 350 meters in one run', target: 350, type: 'distance' },
  { id: 'hoverboard_1', desc: 'Activate a hoverboard', target: 1, type: 'hoverboard' },
  { id: 'coins_100', desc: 'Collect 100 coins in a single run', target: 100, type: 'coins' },
  { id: 'jump_12', desc: 'Jump over 12 hurdles', target: 12, type: 'jump' },
  { id: 'dist_700', desc: 'Reach 700 meters in one run', target: 700, type: 'distance' },
];

let activeMissions = [];
function loadMissions() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEYS.missions));
    if (Array.isArray(saved) && saved.length === 3) return saved;
  } catch {}
  return [
    { ...MISSION_TEMPLATES[0], current: 0, done: false },
    { ...MISSION_TEMPLATES[1], current: 0, done: false },
    { ...MISSION_TEMPLATES[3], current: 0, done: false },
  ];
}
activeMissions = loadMissions();

function saveMissions() {
  try { localStorage.setItem(SAVE_KEYS.missions, JSON.stringify(activeMissions)); } catch {}
}

function trackMissionEvent(type, amount = 1) {
  let changed = false;
  for (const m of activeMissions) {
    if (m.done || m.type !== type) continue;
    if (type === 'coins' || type === 'distance') {
      m.current = Math.max(m.current, amount);
    } else {
      m.current += amount;
    }
    if (m.current >= m.target) {
      m.done = true;
      changed = true;
      toast(`🎯 MISSION COMPLETE: ${m.desc}!`);
      playFanfare();
    }
  }

  if (activeMissions.every(m => m.done)) {
    profile.multiplier++;
    saveProfile(profile);
    toast(`⭐ LEVEL UP! MULTIPLIER NOW x${profile.multiplier}!`);
    playFanfare();
    const nextOffset = (profile.multiplier - 1) * 3;
    activeMissions = [
      { ...MISSION_TEMPLATES[(nextOffset) % MISSION_TEMPLATES.length], current: 0, done: false },
      { ...MISSION_TEMPLATES[(nextOffset + 1) % MISSION_TEMPLATES.length], current: 0, done: false },
      { ...MISSION_TEMPLATES[(nextOffset + 2) % MISSION_TEMPLATES.length], current: 0, done: false },
    ];
    changed = true;
  }

  if (changed) {
    saveMissions();
    updateHeaderStats();
  }
}

// -------------------------------------------------------------
// GAME STATE
// -------------------------------------------------------------
const game = {
  state: 'start',
  previousState: 'start',
  lane: 1,
  y: 0,
  groundY: 0,
  vy: 0,
  isJumping: false,
  slide: 0,
  speed: 14,
  distance: 0,
  score: 0,
  coins: 0,
  mysteryBoxesInRun: 0,
  objects: [],
  spawnAt: 32,
  lastTime: 0,
  width: 0,
  height: 0,

  // Track if runner is on an incline ramp
  onRamp: false,

  // Headstart
  headstart: 0,

  // Revive Save Me
  revivesUsed: 0,
  saveMeCountdown: 4,
  saveMeTimerId: null,

  magnet: 0,
  hoverboard: 0,
  jetpack: 0,
  sneakers: 0,
  multiplier: 0,
  invincible: 0,

  coinCombo: 0,
  coinComboTimer: 0,
  toastTimer: 0,
  closeCallCooldown: 0,
};

// Initial 3D Character & Hoverboard Customization
setCustomization(profile.char, profile.board);

// -------------------------------------------------------------
// UI SCREEN MANAGEMENT
// -------------------------------------------------------------
function updateHeaderStats() {
  const bankEl = $('bankCoins');
  if (bankEl) bankEl.textContent = bankCoins.toLocaleString();
  const shopBank = $('shopBankCoins');
  if (shopBank) shopBank.textContent = bankCoins.toLocaleString();
  const multEl = $('startMultiplier');
  if (multEl) multEl.textContent = `x${profile.multiplier}`;
  const rankMult = $('missionRankMultiplier');
  if (rankMult) rankMult.textContent = `x${profile.multiplier}`;
}

function updateWordHuntHUD() {
  const bar = $('wordHuntBar');
  if (!bar) return;
  if (game.state !== 'playing') {
    bar.hidden = true;
    return;
  }
  bar.hidden = false;
  ['D', 'A', 'S', 'H'].forEach(letter => {
    const el = $('huntLetter_' + letter);
    if (el) {
      if (game.collectedLetters && game.collectedLetters.has(letter)) {
        el.classList.add('collected');
      } else {
        el.classList.remove('collected');
      }
    }
  });
}

function showScreen(name) {
  for (const [key, element] of Object.entries(screens)) {
    if (element) element.hidden = key !== name;
  }
  const isPlaying = name === 'playing';
  $('hud').hidden = !isPlaying;
  $('touchHint').hidden = !isPlaying || game.width > 760;
  $('hoverboardBtn').hidden = !isPlaying;
  updateWordHuntHUD();

  game.state = name;
  shell.dataset.state = name;

  updateHeaderStats();

  if (name === 'start') {
    $('bestStart').textContent = bestScore().toLocaleString();
    stopMusic();
  } else if (name === 'playing') {
    startMusic();
  } else if (name === 'shop') {
    renderShop();
    stopMusic();
  } else if (name === 'missions') {
    renderMissions();
    stopMusic();
  } else {
    stopMusic();
  }
}

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(game.toastTimer);
  game.toastTimer = setTimeout(() => el.classList.remove('show'), 1300);
}

function showCloseCall() {
  const banner = $('closeCallBanner');
  if (!banner) return;
  banner.hidden = false;
  playCloseCallSound();
  triggerCameraShake(0.25);
  setTimeout(() => (banner.hidden = true), 800);
}

function updatePowerupsHUD() {
  const container = $('hudPowerups');
  if (!container) return;

  const activePills = [];
  if (game.headstart > 0) activePills.push(`<div class="powerup-pill jetpack">🚀 BOOST ${Math.ceil(game.headstart)}s</div>`);
  if (game.hoverboard > 0) activePills.push(`<div class="powerup-pill hoverboard">🛹 ${Math.ceil(game.hoverboard)}s</div>`);
  if (game.jetpack > 0) activePills.push(`<div class="powerup-pill jetpack">🚀 ${Math.ceil(game.jetpack)}s</div>`);
  if (game.magnet > 0) activePills.push(`<div class="powerup-pill magnet">🧲 ${Math.ceil(game.magnet)}s</div>`);
  if (game.sneakers > 0) activePills.push(`<div class="powerup-pill sneakers">👟 ${Math.ceil(game.sneakers)}s</div>`);
  if (game.multiplier > 0) activePills.push(`<div class="powerup-pill multiplier">2X ${Math.ceil(game.multiplier)}s</div>`);

  container.innerHTML = activePills.join('');
  const hbCount = $('hoverboardCount');
  if (hbCount) hbCount.textContent = `×${profile.hoverboardCount}`;

  // Headstart button visibility (first 4 seconds of run or distance < 35m)
  const headstartBtn = $('headstartBtn');
  if (headstartBtn) {
    headstartBtn.hidden = game.distance > 35 || game.headstart > 0 || game.state !== 'playing';
  }
}

// -------------------------------------------------------------
// HEADSTART ACTIVATION
// -------------------------------------------------------------
function activateHeadstart() {
  if (game.state !== 'playing' || game.headstart > 0) return;
  if (profile.headstarts <= 0 && bankCoins < 100) {
    toast('NEED 100 COINS FOR HEADSTART!');
    return;
  }
  if (profile.headstarts > 0) profile.headstarts--;
  else bankCoins -= 100;
  saveProfile(profile);

  game.headstart = 3.5;
  game.invincible = 4.2;
  game.speed = 46.0; // Supersonic launch
  playRocketBoostSound();
  triggerCameraShake(0.5);
  toast('🚀 SUPER HEADSTART BOOST!');
  updatePowerupsHUD();
}
$('headstartBtn').addEventListener('click', activateHeadstart);

// -------------------------------------------------------------
// "SAVE ME!" REVIVE SYSTEM
// -------------------------------------------------------------
function promptSaveMe() {
  if (game.revivesUsed >= 3) {
    endRun();
    return;
  }

  showScreen('saveMe');
  stopMusic();

  const keyCost = Math.pow(2, game.revivesUsed); // 1, 2, 4 keys
  const coinCost = 100 * Math.pow(2, game.revivesUsed); // 100, 200, 400 coins
  const hasKeys = profile.keys >= keyCost;
  const costLabel = hasKeys ? `${keyCost} Key${keyCost > 1 ? 's' : ''}` : `${coinCost} Coins`;
  $('saveMeCost').textContent = costLabel;

  game.saveMeCountdown = 4;
  $('saveMeNum').textContent = '4';
  const circle = $('saveMeCircle');
  if (circle) circle.style.strokeDashoffset = '0';

  clearInterval(game.saveMeTimerId);
  game.saveMeTimerId = setInterval(() => {
    game.saveMeCountdown--;
    playCountdownTick();
    $('saveMeNum').textContent = String(game.saveMeCountdown);
    if (circle) {
      circle.style.strokeDashoffset = String(276 * ((4 - game.saveMeCountdown) / 4));
    }
    if (game.saveMeCountdown <= 0) {
      clearInterval(game.saveMeTimerId);
      endRun();
    }
  }, 1000);
}

$('saveMeBtn').addEventListener('click', () => {
  clearInterval(game.saveMeTimerId);
  const keyCost = Math.pow(2, game.revivesUsed);
  const coinCost = 100 * Math.pow(2, game.revivesUsed);

  if (profile.keys >= keyCost) {
    profile.keys -= keyCost;
  } else if (bankCoins >= coinCost) {
    bankCoins -= coinCost;
  } else {
    toast('NOT ENOUGH KEYS OR COINS!');
    endRun();
    return;
  }

  saveProfile(profile);
  game.revivesUsed++;
  game.invincible = 2.8;

  // Clear colliding obstacles within 15 meters
  game.objects = game.objects.filter(o => Math.abs(o.distance - game.distance) > 15);

  playReviveSound();
  triggerCameraShake(0.5);
  spawnParticles(0, 1.2, 0, 0x76ff03, 30, 6.0);
  showScreen('playing');
  toast('⚡ RESURRECTED! KEEP RUNNING!');
});

$('skipSaveMeBtn').addEventListener('click', () => {
  clearInterval(game.saveMeTimerId);
  endRun();
});

// -------------------------------------------------------------
// SHOP MODAL
// -------------------------------------------------------------
const SHOP_ITEMS = {
  chars: [
    { id: 'jake', name: 'Jake', desc: 'Classic subway runner', price: 0, icon: '🧢' },
    { id: 'tricky', name: 'Tricky', desc: 'Street rebel with flair', price: 450, icon: '🎀' },
    { id: 'shadow', name: 'Shadow Ninja', desc: 'Cyber stealth gear', price: 950, icon: '🥷' },
  ],
  boards: [
    { id: 'blueWave', name: 'Blue Wave', desc: 'Classic cyan hoverboard', price: 0, icon: '🛹' },
    { id: 'starfire', name: 'Starfire', desc: 'Fiery crimson speedboard', price: 350, icon: '🔥' },
    { id: 'viper', name: 'Viper', desc: 'Toxic neon green deck', price: 750, icon: '⚡' },
  ],
};

function renderShop() {
  updateHeaderStats();

  const charGrid = $('charShopGrid');
  charGrid.innerHTML = SHOP_ITEMS.chars.map(c => {
    const isUnlocked = profile.unlockedChars.includes(c.id);
    const isEquipped = profile.char === c.id;
    return `
      <div class="shop-item ${isEquipped ? 'equipped' : ''}">
        <div class="shop-item-preview">${c.icon}</div>
        <strong>${c.name}</strong>
        <small>${c.desc}</small>
        ${
          isEquipped
            ? `<button disabled>EQUIPPED</button>`
            : isUnlocked
            ? `<button onclick="window.equipChar('${c.id}')">EQUIP</button>`
            : `<button onclick="window.buyChar('${c.id}', ${c.price})">✦ ${c.price}</button>`
        }
      </div>
    `;
  }).join('');

  const boardGrid = $('boardShopGrid');
  boardGrid.innerHTML = SHOP_ITEMS.boards.map(b => {
    const isUnlocked = profile.unlockedBoards.includes(b.id);
    const isEquipped = profile.board === b.id;
    return `
      <div class="shop-item ${isEquipped ? 'equipped' : ''}">
        <div class="shop-item-preview">${b.icon}</div>
        <strong>${b.name}</strong>
        <small>${b.desc}</small>
        ${
          isEquipped
            ? `<button disabled>EQUIPPED</button>`
            : isUnlocked
            ? `<button onclick="window.equipBoard('${b.id}')">EQUIP</button>`
            : `<button onclick="window.buyBoard('${b.id}', ${b.price})">✦ ${b.price}</button>`
        }
      </div>
    `;
  }).join('');

  const upGrid = $('upgradesShopGrid');
  upGrid.innerHTML = `
    <div class="shop-item">
      <div class="shop-item-preview">🛹</div>
      <strong>+3 Hoverboards</strong>
      <small>Current stash: ${profile.hoverboardCount}</small>
      <button onclick="window.buyHoverboards(120)">✦ 120</button>
    </div>
    <div class="shop-item">
      <div class="shop-item-preview">🗝️</div>
      <strong>+2 Golden Keys</strong>
      <small>Current keys: ${profile.keys}</small>
      <button onclick="window.buyKeys(180)">✦ 180</button>
    </div>
    <div class="shop-item">
      <div class="shop-item-preview">🧲</div>
      <strong>Magnet Lvl ${profile.magnetLvl}</strong>
      <small>Duration: ${10 + (profile.magnetLvl - 1) * 3}s (+3s)</small>
      <button onclick="window.upgradeMagnet(${150 * profile.magnetLvl})">✦ ${150 * profile.magnetLvl}</button>
    </div>
    <div class="shop-item">
      <div class="shop-item-preview">🚀</div>
      <strong>Jetpack Lvl ${profile.jetpackLvl}</strong>
      <small>Duration: ${7 + (profile.jetpackLvl - 1) * 2}s (+2s)</small>
      <button onclick="window.upgradeJetpack(${200 * profile.jetpackLvl})">✦ ${200 * profile.jetpackLvl}</button>
    </div>
  `;
}

window.buyChar = (id, price) => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.unlockedChars.push(id);
  profile.char = id;
  saveProfile(profile);
  setCustomization(profile.char, profile.board);
  playChaChing();
  renderShop();
};
window.equipChar = id => {
  profile.char = id;
  saveProfile(profile);
  setCustomization(profile.char, profile.board);
  playButtonSound();
  renderShop();
};
window.buyBoard = (id, price) => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.unlockedBoards.push(id);
  profile.board = id;
  saveProfile(profile);
  setCustomization(profile.char, profile.board);
  playChaChing();
  renderShop();
};
window.equipBoard = id => {
  profile.board = id;
  saveProfile(profile);
  setCustomization(profile.char, profile.board);
  playButtonSound();
  renderShop();
};
window.buyHoverboards = price => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.hoverboardCount += 3;
  saveProfile(profile);
  playChaChing();
  renderShop();
};
window.buyKeys = price => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.keys += 2;
  saveProfile(profile);
  playChaChing();
  renderShop();
};
window.upgradeMagnet = price => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.magnetLvl++;
  saveProfile(profile);
  playChaChing();
  renderShop();
};
window.upgradeJetpack = price => {
  if (bankCoins < price) return toast('NEED MORE COINS!');
  bankCoins -= price;
  profile.jetpackLvl++;
  saveProfile(profile);
  playChaChing();
  renderShop();
};

// -------------------------------------------------------------
// MISSIONS MODAL
// -------------------------------------------------------------
function renderMissions() {
  updateHeaderStats();
  const list = $('missionList');
  list.innerHTML = activeMissions.map(m => {
    const pct = Math.min(100, Math.round((m.current / m.target) * 100));
    return `
      <div class="mission-row ${m.done ? 'done' : ''}">
        <div class="mission-header">
          <span>${m.desc}</span>
          ${m.done ? `<b class="mission-check">✔ DONE</b>` : `<span>${m.current} / ${m.target}</span>`}
        </div>
        <div class="mission-bar">
          <div class="mission-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------
// RESIZING
// -------------------------------------------------------------
function resize() {
  const rect = shell.getBoundingClientRect();
  game.width = rect.width;
  game.height = rect.height;
  canvas3d.width = Math.round(game.width);
  canvas3d.height = Math.round(game.height);
  resizeScene(game.width, game.height);
}
window.addEventListener('resize', resize);
resize();

// -------------------------------------------------------------
// HOVERBOARD ACTIVATION
// -------------------------------------------------------------
function activateHoverboard() {
  if (game.state !== 'playing') return;
  if (game.hoverboard > 0) return;
  if (profile.hoverboardCount <= 0) {
    toast('NO HOVERBOARDS LEFT! BUY MORE IN SHOP!');
    return;
  }
  profile.hoverboardCount--;
  saveProfile(profile);
  game.hoverboard = 25.0;
  trackMissionEvent('hoverboard', 1);
  playHoverboardSound();
  toast('🛹 HOVERBOARD ACTIVE!');
  updatePowerupsHUD();
}

// -------------------------------------------------------------
// PLAYER INPUTS & ACTIONS
// -------------------------------------------------------------
function act(direction) {
  if (game.state !== 'playing') return;

  if (direction === 'left') {
    if (game.lane > 0) {
      game.lane--;
      playLaneChangeSound();
      checkCloseCall();
    }
  } else if (direction === 'right') {
    if (game.lane < 2) {
      game.lane++;
      playLaneChangeSound();
      checkCloseCall();
    }
  } else if (direction === 'jump') {
    if (game.y <= game.groundY + 0.15 && game.slide <= 0) {
      const isSuper = game.sneakers > 0;
      game.vy = isSuper ? 17.5 : 12.0;
      game.isJumping = true;
      playJumpSound(isSuper);
      spawnParticles(0, game.groundY + 0.1, 0, 0xffffff, 4, 1.5);
    }
  } else if (direction === 'slide') {
    if (game.slide <= 0) {
      game.slide = 0.75;
      playSlideSound();
      if (game.y > game.groundY) {
        game.vy = -18.0;
      }
    }
  }
}

function checkCloseCall() {
  if (game.closeCallCooldown > 0) return;
  for (const obj of game.objects) {
    const relDist = obj.distance - game.distance;
    if (Math.abs(relDist) < 2.4 && obj.lane !== game.lane) {
      game.score += 250;
      game.closeCallCooldown = 1.2;
      showCloseCall();
      break;
    }
  }
}

// -------------------------------------------------------------
// SUBWAY SURFERS OBSTACLE & POWER-UP SPAWNER
// -------------------------------------------------------------
function spawnHurdle(lane, distance, onRoof = false) {
  game.objects.push({
    kind: 'obstacle',
    type: 'hurdle',
    lane,
    distance,
    roof: onRoof,
    hit: false,
  });

  // Parabolic coin jump arc soaring high up and over the hurdle fence
  const offsets = [-3.6, -1.8, 0, 1.8, 3.6];
  for (const off of offsets) {
    const arcY = Math.max(0.32, 1.70 - 0.104 * (off * off));
    const arcSlope = -0.208 * off;
    game.objects.push({
      kind: 'coin',
      lane,
      distance: distance + off,
      arcY,
      arcSlope,
      roof: onRoof,
      hit: false,
    });
  }
}

function spawnTrain(lane, hasRamp = false, isMoving = false, distance) {
  game.objects.push({
    kind: 'train',
    type: isMoving ? 'trainMoving' : (hasRamp ? 'trainRamp' : 'train'),
    lane,
    distance,
    hasRamp,
    isMoving,
    hit: false,
  });

  for (let i = -5; i <= 5; i += 2.2) {
    game.objects.push({
      kind: 'coin',
      lane,
      distance: distance + i,
      hit: false,
      roof: true,
    });
  }

  if (hasRamp) {
    for (let i = 0; i <= 3; i++) {
      const p = i / 3;
      game.objects.push({
        kind: 'coin',
        lane,
        distance: distance - (TRAIN_LENGTH * 0.5 + RAMP_LENGTH * (1 - p)),
        hit: false,
        rampHeight: p * TRAIN_HEIGHT,
      });
    }
  }
}

function spawnObjectCluster() {
  if (game.jetpack > 0 || game.headstart > 0) {
    const waveLane = Math.floor(Math.random() * 3);
    for (let i = 0; i < 5; i++) {
      game.objects.push({
        kind: 'coin',
        lane: (waveLane + (i % 2)) % 3,
        distance: game.spawnAt + i * 2.4,
        arcY: 5.8,
        skyCoin: true,
        hit: false,
      });
    }
    game.spawnAt += 14;
    return;
  }

  // 0. High Score Arch Spawning at Previous Record
  if (game.highScoreDist > 120 && !game.archSpawned && game.spawnAt >= game.highScoreDist - 25) {
    game.archSpawned = true;
    game.objects.push({
      kind: 'highScoreArch',
      type: 'highScoreArch',
      lane: 1,
      distance: game.highScoreDist,
      hit: false,
    });
  }

  // 0b. Daily Word Hunt Letter Spawning ('D', 'A', 'S', 'H')
  const letterMilestones = [
    { char: 'D', dist: 110 },
    { char: 'A', dist: 280 },
    { char: 'S', dist: 480 },
    { char: 'H', dist: 720 },
  ];
  for (const m of letterMilestones) {
    if (!game.spawnedLetters[m.char] && game.spawnAt >= m.dist) {
      game.spawnedLetters[m.char] = true;
      const letterLane = Math.floor(Math.random() * 3);
      game.objects.push({
        kind: 'letter',
        type: 'letter_' + m.char,
        char: m.char,
        lane: letterLane,
        distance: game.spawnAt,
        hit: false,
      });
      break;
    }
  }

  const roll = Math.random();

  // 1. Train Encounter
  if (roll < 0.36) {
    const trainLane = Math.floor(Math.random() * 3);
    const hasRamp = Math.random() < 0.65;
    const isMoving = !hasRamp && Math.random() < 0.45 && game.distance > 60;

    spawnTrain(trainLane, hasRamp, isMoving, game.spawnAt);

    if (isMoving) {
      playTrainHornSound();
      toast('HONK! TRAIN INCOMING!');
    }

    const openLane = (trainLane + 1 + Math.floor(Math.random() * 2)) % 3;
    if (Math.random() < 0.5) {
      spawnHurdle(openLane, game.spawnAt);
    } else {
      for (let i = 0; i < 4; i++) {
        game.objects.push({ kind: 'coin', lane: openLane, distance: game.spawnAt + i * 2.5, hit: false });
      }
    }
    game.spawnAt += TRAIN_LENGTH + 12;
  }
  // 2. Hurdle / Low Barrier
  else if (roll < 0.58) {
    const lane = Math.floor(Math.random() * 3);
    spawnHurdle(lane, game.spawnAt);
    game.spawnAt += 14 + Math.random() * 6;
  }
  // 3. High Overhead Barrier
  else if (roll < 0.74) {
    const lane = Math.floor(Math.random() * 3);
    game.objects.push({ kind: 'obstacle', type: 'highBarrier', lane, distance: game.spawnAt, hit: false });

    for (let i = 0; i < 3; i++) {
      game.objects.push({ kind: 'coin', lane, distance: game.spawnAt + (i - 1) * 2.0, hit: false });
    }
    game.spawnAt += 15 + Math.random() * 5;
  }
  // 4. Solid Roadblock Crates
  else if (roll < 0.84) {
    const blockedLane = Math.floor(Math.random() * 3);
    game.objects.push({ kind: 'obstacle', type: 'solid', lane: blockedLane, distance: game.spawnAt, hit: false });

    const safeLane = (blockedLane + 1) % 3;
    for (let i = 0; i < 4; i++) {
      game.objects.push({ kind: 'coin', lane: safeLane, distance: game.spawnAt + i * 2.5, hit: false });
    }
    game.spawnAt += 16 + Math.random() * 6;
  }
  // 5. Mystery Box!
  else if (roll < 0.90) {
    const lane = Math.floor(Math.random() * 3);
    game.objects.push({ kind: 'mysteryBox', type: 'mysteryBox', lane, distance: game.spawnAt, hit: false });
    game.spawnAt += 16 + Math.random() * 6;
  }
  // 6. Power-Up Pickups
  else {
    const powerups = ['magnet', 'hoverboard', 'jetpack', 'sneakers', 'multiplier'];
    const selected = powerups[Math.floor(Math.random() * powerups.length)];
    const lane = Math.floor(Math.random() * 3);

    game.objects.push({ kind: selected, type: selected, lane, distance: game.spawnAt, hit: false });
    game.spawnAt += 18 + Math.random() * 8;
  }
}

// -------------------------------------------------------------
// RUN LIFECYCLE
// -------------------------------------------------------------
function startRun() {
  game.lane = 1;
  game.y = 0;
  game.groundY = 0;
  game.vy = 0;
  game.isJumping = false;
  game.slide = 0;
  game.distance = 0;
  game.score = 0;
  game.coins = 0;
  game.mysteryBoxesInRun = 0;
  game.speed = 14;
  game.objects = [];
  game.spawnAt = 30;
  game.lastTime = performance.now();

  game.headstart = 0;
  game.onRamp = false;
  game.revivesUsed = 0;
  game.closeCallCooldown = 0;
  game.magnet = 0;
  game.hoverboard = 0;
  game.jetpack = 0;
  game.sneakers = 0;
  game.multiplier = 0;
  game.invincible = 0;

  // Word Hunt and High Score Arch
  game.collectedLetters = new Set();
  game.spawnedLetters = { D: false, A: false, S: false, H: false };
  game.wordHuntCompleted = false;
  game.highScoreDist = Number(localStorage.getItem('jungle-dash-best-dist') || 0);
  game.archSpawned = false;
  game.passedHighScore = false;

  $('mysteryRewardCard').hidden = true;
  showScreen('playing');
  toast('READY... GO!');
  updatePowerupsHUD();
  updateWordHuntHUD();
}

function endRun() {
  game.state = 'over';
  triggerCameraShake(0.65);
  playCrashSound();
  stopMusic();

  const finalScore = Math.floor(game.score);
  const best = Math.max(bestScore(), finalScore);
  localStorage.setItem(SAVE_KEYS.best, String(best));

  const bestDist = Math.max(
    Number(localStorage.getItem('jungle-dash-best-dist') || 0),
    Math.floor(game.distance)
  );
  try { localStorage.setItem('jungle-dash-best-dist', String(bestDist)); } catch {}

  addBankCoins(game.coins);
  trackMissionEvent('distance', Math.floor(game.distance));
  trackMissionEvent('coins', game.coins);

  $('finalScore').textContent = finalScore.toLocaleString();
  $('finalDistance').textContent = Math.floor(game.distance).toLocaleString();
  $('finalCoins').textContent = game.coins.toLocaleString();
  $('bestStart').textContent = best.toLocaleString();
  updateWordHuntHUD();

  if (game.mysteryBoxesInRun > 0) {
    $('mysteryRewardCard').hidden = false;
    $('mysteryRewardDesc').textContent = `You found ${game.mysteryBoxesInRun} Mystery Box! Tap to open!`;
  } else {
    $('mysteryRewardCard').hidden = true;
  }

  $('resultMessage').textContent =
    finalScore >= best && best > 0
      ? 'A new best on the subway trail!'
      : 'The subway track calls you back!';

  showScreen('over');
}

// Open Mystery Box Button
$('openMysteryBtn').addEventListener('click', () => {
  if (game.mysteryBoxesInRun <= 0) return;
  game.mysteryBoxesInRun--;
  playMysteryBoxOpen();
  triggerCameraShake(0.4);

  const rewardRoll = Math.random();
  let rewardText = '';
  if (rewardRoll < 0.6) {
    const coinsWon = 250;
    addBankCoins(coinsWon);
    rewardText = `+${coinsWon} BONUS COINS!`;
    spawnParticles(0, 1.2, 0, 0xffd54f, 25, 4.0);
  } else {
    profile.hoverboardCount += 2;
    saveProfile(profile);
    rewardText = `+2 HOVERBOARDS ADDED!`;
    spawnParticles(0, 1.2, 0, 0x00e5ff, 25, 4.0);
  }

  $('mysteryRewardDesc').textContent = `REWARD: ${rewardText}`;
  $('openMysteryBtn').textContent = game.mysteryBoxesInRun > 0 ? 'OPEN NEXT BOX' : 'CLAIMED ✔';
  if (game.mysteryBoxesInRun <= 0) {
    $('openMysteryBtn').disabled = true;
  }
  updateHeaderStats();
});

// -------------------------------------------------------------
// PHYSICS, POWER-UPS & COLLISION UPDATE
// -------------------------------------------------------------
function update(dt) {
  if (game.state !== 'playing') return;

  // 1. ADVANCE RUN & SPEED SCALING
  const scoreMult = (game.multiplier > 0 ? 2 : 1) * profile.multiplier;
  game.distance += game.speed * dt;
  if (game.headstart <= 0) {
    game.speed = Math.min(28, 14 + game.distance * 0.007);
  }
  game.score += game.speed * dt * 4 * scoreMult;

  // 2. TIMERS & POWER-UP TICKS
  if (game.slide > 0) game.slide = Math.max(0, game.slide - dt);
  if (game.headstart > 0) game.headstart = Math.max(0, game.headstart - dt);
  if (game.magnet > 0) game.magnet = Math.max(0, game.magnet - dt);
  if (game.hoverboard > 0) game.hoverboard = Math.max(0, game.hoverboard - dt);
  if (game.jetpack > 0) game.jetpack = Math.max(0, game.jetpack - dt);
  if (game.sneakers > 0) game.sneakers = Math.max(0, game.sneakers - dt);
  if (game.multiplier > 0) game.multiplier = Math.max(0, game.multiplier - dt);
  if (game.invincible > 0) game.invincible = Math.max(0, game.invincible - dt);
  if (game.closeCallCooldown > 0) game.closeCallCooldown -= dt;

  if (game.coinComboTimer > 0) {
    game.coinComboTimer -= dt;
    if (game.coinComboTimer <= 0) game.coinCombo = 0;
  }

  // 3. MOVING TRAINS ADVANCE
  for (const obj of game.objects) {
    if (obj.isMoving) {
      obj.distance -= 11.5 * dt;
    }
  }

  // 4. VERTICALITY & TRAIN ROOF RUNNING RESOLUTION
  let currentGroundY = 0;
  let onRamp = false;

  if (game.jetpack > 0 || game.headstart > 0) {
    currentGroundY = 5.8;
  } else {
    for (const obj of game.objects) {
      if (obj.kind === 'train' && obj.lane === game.lane) {
        const halfLen = TRAIN_LENGTH * 0.5;
        const rampStart = obj.distance - (halfLen + RAMP_LENGTH);
        const rampEnd = obj.distance - halfLen;
        const roofEnd = obj.distance + halfLen;

        // Player ascending the ramp smoothly
        if (obj.hasRamp && game.distance >= rampStart && game.distance < rampEnd) {
          const progress = (game.distance - rampStart) / RAMP_LENGTH;
          currentGroundY = Math.max(currentGroundY, progress * TRAIN_HEIGHT);
          onRamp = true;
        }
        // Player running on top of the train roof
        else if (game.distance >= rampEnd && game.distance <= roofEnd) {
          if (obj.hasRamp || game.y >= TRAIN_HEIGHT - 0.45) {
            currentGroundY = Math.max(currentGroundY, TRAIN_HEIGHT);
          }
        }
      }
    }
  }
  game.groundY = currentGroundY;
  game.onRamp = onRamp;

  // Gravity & vertical movement
  if (game.jetpack > 0 || game.headstart > 0) {
    game.y = THREE.MathUtils.lerp(game.y, currentGroundY, dt * 6);
    game.vy = 0;
  } else {
    // If running smoothly up the ramp and not jumping, stick directly to the ramp incline without jitter!
    if (onRamp && !game.isJumping) {
      game.y = currentGroundY;
      game.vy = 0;
    } else {
      game.vy -= 32 * dt;
      game.y += game.vy * dt;

      if (game.y <= game.groundY) {
        game.y = game.groundY;
        if (game.vy < -2.0) {
          spawnParticles(0, game.groundY + 0.05, 0, 0xcccccc, 3, 1.2);
        }
        game.vy = 0;
        game.isJumping = false;
      }
    }
  }

  // 5. SPAWN AHEAD
  while (game.spawnAt < game.distance + 110) {
    spawnObjectCluster();
  }

  // 6. COLLISION RESOLUTION
  for (const obj of game.objects) {
    if (obj.hit) continue;
    const relDist = obj.distance - game.distance;

    // COIN COLLECTION
    if (obj.kind === 'coin') {
      const isSuperMagnet = game.magnet > 0 || game.headstart > 0 || game.jetpack > 0;
      const magnetRange = isSuperMagnet && Math.abs(relDist) < 14;
      const coinY = (obj.roof ? TRAIN_HEIGHT : 0) + (obj.arcY || obj.rampHeight || 0);
      const vertDist = Math.abs((game.y + 0.85) - coinY);
      const inRange = (obj.lane === game.lane && Math.abs(relDist) < 1.15 && (vertDist < 1.45 || obj.arcY === undefined)) || magnetRange;

      if (inRange) {
        obj.hit = true;
        const coinVal = game.multiplier > 0 ? 2 : 1;
        game.coins += coinVal;
        game.score += coinVal * 25;

        playCoinSound(game.coinCombo);
        game.coinCombo = Math.min(5, game.coinCombo + 1);
        game.coinComboTimer = 1.1;

        spawnParticles(0, coinY + 0.15, 0, 0xffd54f, 6, 2.5);
      }
      continue;
    }

    // MYSTERY BOX
    if (obj.kind === 'mysteryBox') {
      if (obj.lane === game.lane && Math.abs(relDist) < 1.2) {
        obj.hit = true;
        game.mysteryBoxesInRun++;
        playFanfare();
        toast('🎁 MYSTERY BOX FOUND!');
        spawnParticles(0, 1.2, 0, 0xab47bc, 18, 4.0);
      }
      continue;
    }

    // WORD HUNT LETTER
    if (obj.kind === 'letter') {
      if (obj.lane === game.lane && Math.abs(relDist) < 1.25) {
        const canReach = obj.roof ? (game.y >= TRAIN_HEIGHT - 0.45) : true;
        if (canReach) {
          obj.hit = true;
          const char = obj.char;
          const letterIdx = ['D', 'A', 'S', 'H'].indexOf(char);
          game.collectedLetters.add(char);
          playLetterCollectSound(letterIdx);
          triggerCameraShake(0.3);
          spawnParticles(0, game.y + 1.0, 0, 0xffea00, 18, 3.8);
          toast(`✨ LETTER "${char}" COLLECTED!`);
          updateWordHuntHUD();

          if (game.collectedLetters.size === 4 && !game.wordHuntCompleted) {
            game.wordHuntCompleted = true;
            playFanfare();
            triggerCameraShake(0.6);
            addBankCoins(500);
            game.mysteryBoxesInRun++;
            toast('🎉 WORD "DASH" COMPLETED! +500 COINS & MYSTERY BOX!');
            spawnParticles(0, 2.5, 0, 0xffd700, 40, 6.0);
            spawnParticles(0, 2.0, 0, 0x00e5ff, 30, 5.0);
          }
        }
      }
      continue;
    }

    // HIGH SCORE FINISH ARCH
    if (obj.kind === 'highScoreArch') {
      if (!game.passedHighScore && game.distance >= obj.distance) {
        game.passedHighScore = true;
        playRecordBrokenSound();
        triggerCameraShake(0.65);
        toast('🏆 NEW BEST RECORD BEATEN!');
        spawnParticles(0, 3.0, 0, 0xffd700, 45, 6.5);
        spawnParticles(0, 2.2, 0, 0x00e5ff, 35, 5.5);
        spawnParticles(0, 1.8, 0, 0xff1744, 35, 5.5);
      }
      continue;
    }

    // POWER-UP PICKUPS
    if (['magnet', 'hoverboard', 'jetpack', 'sneakers', 'multiplier'].includes(obj.kind)) {
      if (obj.lane === game.lane && Math.abs(relDist) < 1.2) {
        obj.hit = true;
        playPowerupSound();
        spawnParticles(0, 1.0, 0, 0x00e5ff, 14, 3.5);

        if (obj.kind === 'magnet') {
          game.magnet = 10.0 + (profile.magnetLvl - 1) * 3;
          toast('🧲 COIN MAGNET!');
        } else if (obj.kind === 'hoverboard') {
          profile.hoverboardCount++;
          saveProfile(profile);
          toast('🛹 +1 HOVERBOARD!');
        } else if (obj.kind === 'jetpack') {
          game.jetpack = 7.0 + (profile.jetpackLvl - 1) * 2;
          toast('🚀 JETPACK SKY FLIGHT!');
        } else if (obj.kind === 'sneakers') {
          game.sneakers = 14.0;
          toast('👟 SUPER SNEAKERS!');
        } else if (obj.kind === 'multiplier') {
          game.multiplier = 14.0;
          toast('⚡ 2X MULTIPLIER!');
        }
        updatePowerupsHUD();
      }
      continue;
    }

    // OBSTACLES & TRAINS
    if (obj.kind === 'train') {
      const halfLen = TRAIN_LENGTH * 0.5;
      const tNear = obj.distance - halfLen;
      const tFar = obj.distance + halfLen;

      if (obj.lane === game.lane) {
        if (obj.hasRamp) {
          // If train has a ramp, the player runs smoothly up the ramp (rampStart to tNear)
          // and onto the roof (tNear to tFar). Only crash if below roof height inside carriage bounds.
          if (game.distance >= tNear + 0.1 && game.distance <= tFar) {
            const onRoof = game.y >= TRAIN_HEIGHT - 0.4;
            const airborne = game.jetpack > 0 || game.headstart > 0;
            if (!onRoof && !airborne && game.invincible <= 0) {
              handleCrash(obj);
              break;
            }
          }
        } else {
          // Train without ramp: crash into front or sides if not on roof or flying
          if (game.distance >= tNear - 0.4 && game.distance <= tFar) {
            const onRoof = game.y >= TRAIN_HEIGHT - 0.35;
            const airborne = game.jetpack > 0 || game.headstart > 0;
            if (!onRoof && !airborne && game.invincible <= 0) {
              handleCrash(obj);
              break;
            }
          }
        }
      }
      continue;
    }

    if (obj.kind === 'obstacle') {
      if (obj.lane === game.lane && Math.abs(relDist) < 0.75) {
        let cleared = false;
        if (game.jetpack > 0 || game.headstart > 0) cleared = true;
        else if (obj.type === 'hurdle' && game.y > 0.65) {
          cleared = true;
          trackMissionEvent('jump', 1);
        } else if (obj.type === 'highBarrier' && game.slide > 0) {
          cleared = true;
        }

        if (!cleared && game.invincible <= 0) {
          handleCrash(obj);
          break;
        }
      }
    }
  }

  // 7. PRUNE DESPAWNED OBJECTS
  game.objects = game.objects.filter(o => !o.hit && o.distance > game.distance - 12);

  // 8. UPDATE HUD VALUES
  $('score').textContent = Math.floor(game.score).toLocaleString();
  $('distance').textContent = Math.floor(game.distance).toLocaleString();
  $('coins').textContent = game.coins.toLocaleString();
  updatePowerupsHUD();
}

function handleCrash(obstacle) {
  if (game.hoverboard > 0) {
    game.hoverboard = 0;
    game.invincible = 1.3;
    obstacle.hit = true;
    triggerCameraShake(0.5);
    playHoverboardBreakSound();
    spawnParticles(0, 1.2, 0, 0x00e5ff, 20, 5.0);
    toast('🛡️ HOVERBOARD SAVED YOU!');
    updatePowerupsHUD();
    return;
  }

  obstacle.hit = true;
  triggerCameraShake(0.7);
  playCrashSound();

  // Trigger Save Me countdown
  promptSaveMe();
}

// -------------------------------------------------------------
// RENDER LOOP
// -------------------------------------------------------------
function loop(now) {
  const dt = Math.max(0, Math.min(0.05, (now - (game.lastTime || now)) / 1000));
  game.lastTime = now;

  update(dt);

  update3DScene(
    {
      state: game.state,
      lane: game.lane,
      y: game.y,
      groundY: game.groundY,
      vy: game.vy,
      onRamp: game.onRamp,
      jump: game.isJumping ? 1 : 0,
      slide: game.slide,
      speed: game.speed,
      headstartActive: game.headstart > 0,
      hoverboardActive: game.hoverboard > 0,
      jetpackActive: game.jetpack > 0,
      sneakersActive: game.sneakers > 0,
      magnetActive: game.magnet > 0,
    },
    game.objects,
    game.distance,
    now / 1000,
    dt
  );

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// -------------------------------------------------------------
// EVENT LISTENERS & MODALS
// -------------------------------------------------------------
function togglePause() {
  if (game.state === 'playing') showScreen('pause');
  else if (game.state === 'pause') showScreen('playing');
}
function openSettings() {
  game.previousState = game.state;
  showScreen('settings');
}

$('playButton').addEventListener('click', () => {
  playButtonSound();
  startRun();
});
$('pauseButton').addEventListener('click', togglePause);
$('resumeButton').addEventListener('click', () => showScreen('playing'));
$('restartButton').addEventListener('click', startRun);
$('runAgainButton').addEventListener('click', startRun);
$('homeButton').addEventListener('click', () => showScreen('start'));
$('closeSettings').addEventListener('click', () => showScreen(game.previousState));
$('settingsDone').addEventListener('click', () => showScreen(game.previousState));
document.querySelectorAll('[data-open-settings]').forEach(btn => btn.addEventListener('click', openSettings));

$('openShopBtn').addEventListener('click', () => {
  playButtonSound();
  game.previousState = 'start';
  showScreen('shop');
});
$('closeShop').addEventListener('click', () => {
  playButtonSound();
  showScreen('start');
});

$('openMissionsBtn').addEventListener('click', () => {
  playButtonSound();
  game.previousState = 'start';
  showScreen('missions');
});
$('closeMissions').addEventListener('click', () => {
  playButtonSound();
  showScreen('start');
});

$('hoverboardBtn').addEventListener('click', activateHoverboard);

$('soundToggle').checked = settings.sound;
$('soundToggle').addEventListener('change', event => {
  settings.sound = event.target.checked;
  localStorage.setItem('jungle-dash-sound', settings.sound ? 'on' : 'off');
  setMuted(!settings.sound);
  playButtonSound();
});

// Keyboard controls
document.addEventListener('keydown', event => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) {
    event.preventDefault();
  }
  if (event.repeat) return;

  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
    if (game.state === 'playing' || game.state === 'pause') togglePause();
    return;
  }

  if (game.state === 'playing') {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') act('left');
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') act('right');
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') act('jump');
    if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') act('slide');
    if (event.key === ' ' || event.key.toLowerCase() === 'b') activateHoverboard();
  }
});

// Touch and Swipe Controls + Double-Tap for Hoverboard
let touchStart = null;
let lastTouchTapTime = 0;

canvas3d.addEventListener('pointerdown', event => {
  if (game.state !== 'playing') return;
  touchStart = { x: event.clientX, y: event.clientY };

  const now = performance.now();
  if (now - lastTouchTapTime < 320) {
    activateHoverboard();
  }
  lastTouchTapTime = now;
});

canvas3d.addEventListener('pointerup', event => {
  if (!touchStart || game.state !== 'playing') return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    act(dx < 0 ? 'left' : 'right');
  } else {
    act(dy < 0 ? 'jump' : 'slide');
  }
});

canvas3d.addEventListener('pointercancel', () => (touchStart = null));

showScreen('start');
