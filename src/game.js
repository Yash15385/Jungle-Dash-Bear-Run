import { resizeScene, updateScene } from './scene3d.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const playerCanvas = document.querySelector('#player');
const playerCtx = playerCanvas.getContext('2d');
const shell = document.querySelector('#gameShell');
const $ = id => document.getElementById(id);
const screens = { start: $('startScreen'), pause: $('pauseScreen'), over: $('gameOverScreen'), settings: $('settingsScreen') };

const bear = new Image();
bear.src = '../data/player_data/player-sprites.svg';
const settings = { sound: localStorage.getItem('jungle-dash-sound') !== 'off' };
const game = {
  state: 'start', previousState: 'start', lane: 1, visualLane: 1, jump: 0, slide: 0, climb: 0,
  distance: 0, score: 0, coins: 0, speed: 13, objects: [], spawnAt: 42,
  lastTime: 0, width: 0, height: 0, dpr: 1, soundReady: false, toastTimer: 0,
};
let audioContext;
const HORIZON_RATIO = .39;
const RUNNER_GROUND_RATIO = .81;
const RUNNER_ROAD_DEPTH = Math.pow((RUNNER_GROUND_RATIO-HORIZON_RATIO)/(1-HORIZON_RATIO),1/1.65);

const bestScore = () => Number(localStorage.getItem('jungle-dash-best') || 0);
const laneX = lane => lane - 1;
function showScreen(name) {
  for (const [key, element] of Object.entries(screens)) element.hidden = key !== name;
  $('hud').hidden = name !== 'playing';
  $('touchHint').hidden = name !== 'playing' || game.width > 760;
  game.state = name;
  shell.dataset.state = name;
  if (name === 'start') $('bestStart').textContent = bestScore().toLocaleString();
}
function toast(message) {
  const el = $('toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(game.toastTimer); game.toastTimer = setTimeout(() => el.classList.remove('show'), 1050);
}
function resize() {
  const rect = shell.getBoundingClientRect();
  game.width = rect.width; game.height = rect.height; game.dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(game.width * game.dpr); canvas.height = Math.round(game.height * game.dpr);
  canvas.style.width = `${game.width}px`; canvas.style.height = `${game.height}px`;
  ctx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
  playerCanvas.width = Math.round(game.width * game.dpr); playerCanvas.height = Math.round(game.height * game.dpr);
  playerCanvas.style.width = `${game.width}px`; playerCanvas.style.height = `${game.height}px`;
  playerCtx.setTransform(game.dpr, 0, 0, game.dpr, 0, 0);
  resizeScene(game.width, game.height);
}
window.addEventListener('resize', resize); resize();

function roundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, rr);
}
function drawTree(x, y, scale, variant = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const trunk = variant % 2 ? '#68442d' : '#805236';
  ctx.fillStyle = trunk; roundedRect(-5, -64, 10, 70, 5); ctx.fill();
  ctx.strokeStyle = '#a9824e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-30);ctx.lineTo(-17,-48);ctx.moveTo(1,-42);ctx.lineTo(18,-59);ctx.stroke();
  const greens = ['#1e7048','#258154','#348e4c','#176545'];
  for(let i=0;i<5;i++) { const angle = (i/5)*Math.PI*2; const cx=Math.cos(angle)*22, cy=-69+Math.sin(angle)*17;
    ctx.fillStyle=greens[(i+variant)%greens.length];ctx.beginPath();ctx.ellipse(cx,cy,22,11,angle,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#a7d665';ctx.beginPath();ctx.ellipse(0,-70,12,13,0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}
function drawJungle() {
  const w=game.width,h=game.height;
  const sky=ctx.createLinearGradient(0,0,0,h*.55);sky.addColorStop(0,'#7bc5a1');sky.addColorStop(.55,'#b8d788');sky.addColorStop(1,'#5d9b5d');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const forestFloor=ctx.createLinearGradient(0,h*.58,0,h);forestFloor.addColorStop(0,'#4e8b50');forestFloor.addColorStop(1,'#285e3a');ctx.fillStyle=forestFloor;ctx.fillRect(0,h*.58,w,h*.42);
  // Sunlight opening in the canopy
  const glow=ctx.createRadialGradient(w*.55,h*.24,4,w*.55,h*.24,h*.42);glow.addColorStop(0,'#fff0b352');glow.addColorStop(1,'#fff0b300');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h*.7);
  // Distant jungle ridge silhouettes
  ctx.fillStyle='#6aa66a';ctx.beginPath();ctx.moveTo(0,h*.46);for(let x=0;x<=w+30;x+=30)ctx.lineTo(x,h*(.31+Math.sin(x*.013)*.035+Math.sin(x*.031)*.018));ctx.lineTo(w,h*.65);ctx.lineTo(0,h*.65);ctx.fill();
  ctx.fillStyle='#39794d';ctx.beginPath();ctx.moveTo(0,h*.52);for(let x=0;x<=w+20;x+=20)ctx.lineTo(x,h*(.39+Math.sin(x*.019+1)*.04+Math.sin(x*.047)*.017));ctx.lineTo(w,h*.69);ctx.lineTo(0,h*.69);ctx.fill();
  // Canopy framing and hanging vines
  const top=ctx.createLinearGradient(0,0,0,h*.2);top.addColorStop(0,'#123c2c');top.addColorStop(1,'#123c2c00');ctx.fillStyle=top;ctx.fillRect(0,0,w,h*.22);
  for(let i=0;i<12;i++){let x=(i/11)*w;ctx.fillStyle=i%2?'#185339':'#216642';ctx.beginPath();ctx.ellipse(x,0,Math.min(75,w*.14),34,0,0,Math.PI*2);ctx.fill();}
  for(let i=0;i<7;i++){const x=(i*137+game.distance*3)%(w+60);ctx.strokeStyle='#315f35';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+12,h*.08,x-15,h*.12,x+Math.sin(game.distance*.04+i)*12,h*(.14+(i%3)*.025));ctx.stroke();}
  // Side foliage scroll
  for(let side=0;side<2;side++)for(let i=0;i<7;i++){const depth=i/6;const y=h*(.70+depth*.29);const s=.34+depth*.86;const x=side?w*(.91+depth*.12):w*(.09-depth*.12);drawTree(x,y,s,i+side*3);}
  // Ferns and broad leaves at the near track edges
  for(let side=0;side<2;side++){const x=side?w*.98:w*.02;for(let j=0;j<5;j++){const y=h*(.62+j*.1)+((game.distance*5+j*61)%85);ctx.save();ctx.translate(x,y);ctx.scale(side?-1:1,1);ctx.fillStyle=j%2?'#246c42':'#39844a';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-30,-28,-49,-3);ctx.quadraticCurveTo(-28,9,0,0);ctx.quadraticCurveTo(-26,17,-38,25);ctx.quadraticCurveTo(-14,24,0,0);ctx.fill();ctx.restore();}}
}
function project(distance, lane) {
  const w=game.width,h=game.height;
  // The runner's ground point is the near edge of the playable perspective.
  // Obstacles reach that same row at distance zero, instead of sliding below the runner.
  const approach=Math.max(0,Math.min(1,1-distance/90));
  const p=RUNNER_ROAD_DEPTH*approach;
  const horizon=h*HORIZON_RATIO;const y=horizon+Math.pow(p,1.65)*(h-horizon);
  const trackHalf=w*(.09+.47*p);const laneSpacing=trackHalf*2/3;
  const x=w*.5+laneX(lane)*laneSpacing;
  return {x,y,p,scale:.35+p*1.45};
}
function drawPlayer(dt) {
  const w=game.width,h=game.height;game.visualLane+=(game.lane-game.visualLane)*Math.min(1,dt*12);
  const baseY=h*RUNNER_GROUND_RATIO;
  const roadHalf=w*(.09+.47*RUNNER_ROAD_DEPTH);
  const playerX=w*.5+laneX(game.visualLane)*roadHalf*2/3;
  const runPhase=performance.now()*.01745;
  const running=game.state==='playing'&&game.jump<=0&&game.slide<=0&&game.climb<=0;
  const bob=running?Math.sin(runPhase)*1.5:0;
  let y=baseY-bob;
  if(game.jump>0)y-=Math.sin((1-game.jump/.68)*Math.PI)*h*.17;
  if(game.climb>0){const progress=1-game.climb/1.15;y-=Math.sin(progress*Math.PI)*h*.08;}
  const width=Math.min(148,w*.29);const height=width;
  if(bear.complete&&bear.naturalWidth){let frame=4;if(game.state==='over')frame=3;else if(game.slide>0)frame=2;else if(game.climb>0)frame=6;else if(game.jump>0)frame=1;else if(running)frame=Math.floor(performance.now()/180)%2?5:0;
    playerCtx.drawImage(bear,frame*128,0,128,128,playerX-width*.5,y-height*.9,width,height);}
  else {playerCtx.fillStyle='#9e543b';playerCtx.beginPath();playerCtx.ellipse(playerX,y-40,33,42,0,0,Math.PI*2);playerCtx.fill();}
  // Small runner ground shadow
  playerCtx.fillStyle='#17241b66';playerCtx.beginPath();playerCtx.ellipse(playerX,baseY+5,28,7,0,0,Math.PI*2);playerCtx.fill();
}
function render(dt) {
  ctx.clearRect(0,0,game.width,game.height);drawJungle();
  playerCtx.clearRect(0,0,game.width,game.height);
  drawPlayer(dt);
  updateScene(game.objects,game.distance,performance.now()/1000);
}
function spawnObject() {
  const roll=Math.random();let type;
  if(roll<.38){type='coin';}
  else if(roll<.58){type='jump';}
  else if(roll<.71){type='climb';}
  else if(roll<.82){type='solid';}
  else if(roll<.92){type='slide';}
  else type='slideDouble';
  let lane=Math.floor(Math.random()*3);
  // Give players a little runway at the beginning and never surprise them in the starting lane.
  if(type!=='coin'&&game.distance<24&&lane===game.lane)lane=Math.random()<.5?0:2;
  game.objects.push({kind:type==='coin'?'coin':'obstacle',type,lane,distance:game.spawnAt,hit:false});
  // Small collectible trails make it clear that lanes are navigable.
  if(type!=='coin'&&Math.random()<.55){const safe=(lane+1+Math.floor(Math.random()*2))%3;for(let i=1;i<=3;i++)game.objects.push({kind:'coin',type:'coin',lane:safe,distance:game.spawnAt+i*3,hit:false});}
  game.spawnAt+=16+Math.random()*8;
}
function startRun() {
  game.lane=1;game.visualLane=1;game.jump=0;game.slide=0;game.climb=0;game.distance=0;game.score=0;game.coins=0;game.speed=13;game.objects=[];game.spawnAt=42;game.lastTime=performance.now();
  showScreen('playing');toast('GO!');
}
function endRun() {
  game.state='over';const score=Math.floor(game.distance*4+game.coins*20);game.score=score;
  const best=Math.max(bestScore(),Math.floor(game.distance));localStorage.setItem('jungle-dash-best',String(best));
  $('finalScore').textContent=score.toLocaleString();$('finalDistance').textContent=Math.floor(game.distance).toLocaleString();$('finalCoins').textContent=game.coins.toLocaleString();$('bestStart').textContent=best.toLocaleString();
  $('resultMessage').textContent=Math.floor(game.distance)>=best&&best>0?'A new best through the canopy!':'The jungle is calling you back.';
  showScreen('over');beep(180,.16,'sawtooth');
}
function act(direction) {
  if(game.state!=='playing')return;
  if(direction==='left')game.lane=Math.max(0,game.lane-1);
  else if(direction==='right')game.lane=Math.min(2,game.lane+1);
  else if(direction==='jump'&&game.jump<=0&&game.slide<=0&&game.climb<=0){
    const ladder=game.objects.find(obj=>obj.kind==='obstacle'&&obj.type==='climb'&&obj.lane===game.lane&&obj.distance-game.distance<=9&&obj.distance-game.distance>=-1);
    if(ladder){game.climb=1.15;beep(420,.08,'triangle');toast('CLIMB!');}
    else game.jump=.68;
  }
  else if(direction==='slide'&&game.slide<=0&&game.jump<=0&&game.climb<=0)game.slide=.82;
}
function update(dt) {
  if(game.state==='playing'){
    game.distance+=game.speed*dt;game.speed=Math.min(25,13+game.distance*.008);
    if(game.jump>0)game.jump=Math.max(0,game.jump-dt);if(game.slide>0)game.slide=Math.max(0,game.slide-dt);if(game.climb>0)game.climb=Math.max(0,game.climb-dt);
    while(game.spawnAt<game.distance+100)spawnObject();
    for(const obj of game.objects){const contact=obj.distance-game.distance;if(obj.hit||contact>.7||contact<-.7)continue;
      if(obj.kind==='coin'&&obj.lane===game.lane){obj.hit=true;game.coins++;beep(720,.055,'sine');toast('+1 FRUIT');}
      else if(obj.kind==='obstacle'&&obj.lane===game.lane){
        const clearedByJump=obj.type==='jump'&&game.jump>0;
        const clearedByClimb=obj.type==='climb'&&game.climb>0;
        const clearedBySlide=(obj.type==='slide'||obj.type==='slideDouble')&&game.slide>0;
        if(clearedByJump||clearedByClimb||clearedBySlide){}
        else {obj.hit=true;endRun();break;}
      }
    }
    game.objects=game.objects.filter(o=>!o.hit&&o.distance>game.distance-2);
    $('score').textContent=Math.floor(game.distance*4+game.coins*20).toLocaleString();$('distance').textContent=Math.floor(game.distance).toLocaleString();$('coins').textContent=game.coins.toLocaleString();
  }
}
function loop(now) {
  const dt=Math.max(0,Math.min(.05,(now-(game.lastTime||now))/1000));game.lastTime=now;
  update(dt);render(dt);requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function beep(freq=500,duration=.07,type='sine') {
  if(!settings.sound)return;
  try { audioContext ||= new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(.035,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration); } catch {}
}
function togglePause() { if(game.state==='playing')showScreen('pause');else if(game.state==='pause')showScreen('playing'); }
function openSettings() { game.previousState=game.state;showScreen('settings'); }

$('playButton').addEventListener('click',()=>{beep(560);startRun();});
$('pauseButton').addEventListener('click',togglePause);
$('resumeButton').addEventListener('click',()=>showScreen('playing'));
$('restartButton').addEventListener('click',startRun);$('runAgainButton').addEventListener('click',startRun);
$('homeButton').addEventListener('click',()=>showScreen('start'));
$('closeSettings').addEventListener('click',()=>showScreen(game.previousState));$('settingsDone').addEventListener('click',()=>showScreen(game.previousState));
document.querySelectorAll('[data-open-settings]').forEach(btn=>btn.addEventListener('click',openSettings));
$('soundToggle').checked=settings.sound;
$('soundToggle').addEventListener('change',event=>{settings.sound=event.target.checked;localStorage.setItem('jungle-dash-sound',settings.sound?'on':'off');beep(620);});
document.addEventListener('keydown',event=>{
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(event.key))event.preventDefault();
  if(event.repeat)return;
  if(event.key==='Escape'||event.key.toLowerCase()==='p'){if(game.state==='playing'||game.state==='pause')togglePause();return;}
  if(game.state==='playing'){
    if(event.key==='ArrowLeft'||event.key.toLowerCase()==='a')act('left');
    if(event.key==='ArrowRight'||event.key.toLowerCase()==='d')act('right');
    if(event.key==='ArrowUp'||event.key.toLowerCase()==='w'||event.key===' ')act('jump');
    if(event.key==='ArrowDown'||event.key.toLowerCase()==='s')act('slide');
  }
});
let touchStart=null;
canvas.addEventListener('pointerdown',event=>{if(game.state==='playing')touchStart={x:event.clientX,y:event.clientY};});
canvas.addEventListener('pointerup',event=>{if(!touchStart||game.state!=='playing')return;const dx=event.clientX-touchStart.x,dy=event.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;if(Math.abs(dx)>Math.abs(dy))act(dx<0?'left':'right');else act(dy<0?'jump':'slide');});
canvas.addEventListener('pointercancel',()=>touchStart=null);
showScreen('start');
