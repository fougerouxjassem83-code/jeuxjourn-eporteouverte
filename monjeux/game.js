// ══════════════════════════════════════
//   ZOMBIE SHOOTER — SMA MAYOTTE
//   game.js
// ══════════════════════════════════════
 
// ─── CONFIG ───────────────────────────
const W = window.innerWidth;
const H = window.innerHeight - 46; // minus HUD
 
const WEAPONS = {
  pistolet: { name:'Pistolet',  emoji:'🔫', ammo:12, damage:1, rate:18, spread:0.06, speed:14, reload:65,  bulletR:3,   auto:false, color:'#a0c0ff', desc:'12 balles · Précis' },
  fusil:    { name:'Fusil AR',  emoji:'🪖', ammo:8,  damage:1, rate:7,  spread:0.05, speed:16, reload:80,  bulletR:3.5, auto:true,  color:'#80ff80', desc:'8 balles · Auto' },
  shotgun:  { name:'Shotgun',   emoji:'💥', ammo:5,  damage:1, rate:28, spread:0.38, speed:12, reload:110, bulletR:4,   auto:false, color:'#ffaa40', pellets:6, desc:'5 coups · Large' },
  sniper:   { name:'Sniper',    emoji:'🎯', ammo:4,  damage:3, rate:45, spread:0.01, speed:22, reload:75,  bulletR:2.5, auto:false, color:'#60e0e0', desc:'4 balles · 3 dégâts' },
};
const WEAPON_KEYS = ['pistolet','fusil','shotgun','sniper'];
 
const GRADES = [
  { min:0,    label:'Recrue',     color:'#aaaaaa' },
  { min:100,  label:'Caporal',    color:'#80d060' },
  { min:300,  label:'Sergent',    color:'#60c0ff' },
  { min:700,  label:'Lieutenant', color:'#ffc040' },
  { min:1500, label:'Capitaine',  color:'#ff8040' },
  { min:3000, label:'Colonel',    color:'#e060ff' },
];
 
function getGrade(score) {
  let g = GRADES[0];
  for (const gr of GRADES) { if (score >= gr.min) g = gr; }
  return g;
}
 
// ─── STATE ────────────────────────────
let soldierName = '';
let currentWeapon = 'fusil';
let G = null; // game state
let leaderboard = JSON.parse(localStorage.getItem('sma_lb') || '[]');
let animId = null;
 
// ─── SCREENS ──────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('show'));
  if (id) document.getElementById(id).classList.add('show');
}
 
// ─── NAME SCREEN ──────────────────────
document.getElementById('btn-name').addEventListener('click', goToWeapon);
document.getElementById('name-input').addEventListener('keydown', e => { if (e.key === 'Enter') goToWeapon(); });
document.getElementById('btn-leaderboard-open').addEventListener('click', () => { renderLeaderboard(); showScreen('screen-leaderboard'); });
document.getElementById('btn-lb-back').addEventListener('click', () => showScreen('screen-name'));
 
function goToWeapon() {
  const v = document.getElementById('name-input').value.trim();
  soldierName = v || 'Soldat';
  document.getElementById('weapon-title').textContent = `Choisis ton arme, Soldat ${soldierName} !`;
  buildWeaponGrid();
  showScreen('screen-weapon');
}
 
// ─── WEAPON SCREEN ────────────────────
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-weapon-back').addEventListener('click', () => showScreen('screen-name'));
 
function buildWeaponGrid() {
  const grid = document.getElementById('weapon-grid');
  grid.innerHTML = '';
  WEAPON_KEYS.forEach(key => {
    const w = WEAPONS[key];
    const div = document.createElement('div');
    div.className = 'weapon-card' + (key === currentWeapon ? ' active' : '');
    div.innerHTML = `<div class="w-emoji">${w.emoji}</div><div class="w-name">${w.name}</div><div class="w-desc">${w.desc}</div>`;
    div.addEventListener('click', () => { currentWeapon = key; buildWeaponGrid(); });
    grid.appendChild(div);
  });
}
 
// ─── LEADERBOARD ──────────────────────
function saveScore(name, score, wave, kills) {
  leaderboard.push({ name, score, wave, kills, date: new Date().toLocaleDateString('fr-FR') });
  leaderboard.sort((a, b) => b.score - a.score);
  if (leaderboard.length > 20) leaderboard = leaderboard.slice(0, 20);
  localStorage.setItem('sma_lb', JSON.stringify(leaderboard));
}
 
function renderLeaderboard() {
  const list = document.getElementById('lb-list');
  if (leaderboard.length === 0) {
    list.innerHTML = '<div class="lb-empty">Aucun score encore. Sois le premier !</div>';
    return;
  }
  list.innerHTML = leaderboard.slice(0, 10).map((e, i) => {
    const g = getGrade(e.score);
    const cls = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
    return `<div class="lb-row ${cls}">
      <div class="lb-rank">${medal}</div>
      <div class="lb-name">Sdt ${e.name}</div>
      <div class="lb-grade" style="color:${g.color}">${g.label}</div>
      <div class="lb-score">${e.score} pts</div>
    </div>`;
  }).join('');
}
 
// ─── GAME OVER SCREEN ─────────────────
document.getElementById('btn-replay').addEventListener('click', () => { showScreen('screen-weapon'); buildWeaponGrid(); });
document.getElementById('btn-go-lb').addEventListener('click', () => { renderLeaderboard(); showScreen('screen-leaderboard'); });
document.getElementById('btn-go-name').addEventListener('click', () => showScreen('screen-name'));
 
function showGameOver(score, wave, kills) {
  saveScore(soldierName, score, wave, kills);
  const g = getGrade(score);
  document.getElementById('go-grade').textContent = g.label;
  document.getElementById('go-grade').style.color = g.color;
  document.getElementById('go-name-label').textContent = `Soldat ${soldierName} — Bien combattu !`;
  document.getElementById('go-score').textContent = score;
  document.getElementById('go-wave').textContent = wave;
  document.getElementById('go-kills').textContent = kills;
  showScreen('screen-gameover');
}
 
// ─── CANVAS SETUP ─────────────────────
const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');
 
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight - canvas.getBoundingClientRect().top;
}
 
// ─── GAME STATE ───────────────────────
function initGame() {
  const wdef = WEAPONS[currentWeapon];
  return {
    player:  { x: canvas.width/2, y: canvas.height/2, hp:5, maxHp:5, angle:0, speed:3, iframes:0 },
    bullets: [], zombies: [], particles: [], bloodDecals: [],
    score:0, kills:0, wave:1, waveSpawned:0, waveTotal:6, waveTimer:0, waveBanner:0,
    weapon: currentWeapon,
    ammo: wdef.ammo, maxAmmo: wdef.ammo,
    reloading:false, reloadTimer:0, fireTimer:0,
    keys:{}, mouse:{x:canvas.width/2, y:canvas.height/2}, mouseDown:false,
    running:true,
  };
}
 
// ─── START GAME ───────────────────────
function startGame() {
  resizeCanvas();
  showScreen('screen-game');
  if (animId) cancelAnimationFrame(animId);
  G = initGame();
  buildHudWeapons();
  updateHudHp();
  updateHudAmmo();
  document.getElementById('hud-name').innerHTML = `🪖 <span>Soldat ${soldierName}</span>`;
  document.getElementById('hud-score').textContent = '0';
  document.getElementById('hud-wave').textContent  = '1';
  G.lastTime = performance.now();
  animId = requestAnimationFrame(loop);
}
 
// ─── HUD HELPERS ──────────────────────
function buildHudWeapons() {
  const wrap = document.getElementById('hud-weapons');
  wrap.innerHTML = '<div class="whud">' + WEAPON_KEYS.map(k => {
    const w = WEAPONS[k];
    return `<button class="whud-btn${k===G.weapon?' active':''}" data-key="${k}">${w.emoji} ${w.name}</button>`;
  }).join('') + '</div>';
  wrap.querySelectorAll('.whud-btn').forEach(btn => {
    btn.addEventListener('click', () => switchWeapon(btn.dataset.key));
  });
}
 
function updateHudHp() {
  const p = G.player;
  document.getElementById('hud-hp').innerHTML = '❤️ ' +
    Array.from({length: p.maxHp}, (_,i) =>
      `<span class="heart${i < p.hp ? '' : ' empty'}">❤️</span>`
    ).join('');
}
 
function updateHudAmmo() {
  const bar = Array.from({length: G.maxAmmo}, (_,i) =>
    `<div class="ammo-b${i >= G.ammo ? ' empty' : ''}"></div>`
  ).join('');
  document.getElementById('hud-ammo').innerHTML =
    `<div class="ammo-wrap">${bar}</div>${G.reloading ? '&nbsp;🔄' : ''}`;
}
 
function switchWeapon(key) {
  if (!G || !G.running) return;
  const wdef = WEAPONS[key];
  G.weapon = key; G.ammo = wdef.ammo; G.maxAmmo = wdef.ammo;
  G.reloading = false; G.reloadTimer = 0; G.fireTimer = 0;
  updateHudAmmo();
  document.querySelectorAll('.whud-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.key === key);
  });
}
 
// ─── INPUT ────────────────────────────
canvas.addEventListener('mousemove', e => {
  if (!G) return;
  const r = canvas.getBoundingClientRect();
  G.mouse.x = e.clientX - r.left;
  G.mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', () => { if (G) { G.mouseDown = true; tryShoot(); } });
canvas.addEventListener('mouseup',   () => { if (G) G.mouseDown = false; });
canvas.addEventListener('click',     () => { if (G && G.running) tryShoot(); });
 
document.addEventListener('keydown', e => {
  if (!G) return;
  G.keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r') startReload();
  const map = {'1':'pistolet','2':'fusil','3':'shotgun','4':'sniper'};
  if (map[e.key]) switchWeapon(map[e.key]);
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
});
document.addEventListener('keyup', e => { if (G) G.keys[e.key.toLowerCase()] = false; });
 
// ─── SHOOT ────────────────────────────
function tryShoot() {
  if (!G || !G.running) return;
  if (G.reloading || G.fireTimer > 0) return;
  if (G.ammo <= 0) { startReload(); return; }
  doShoot();
}
 
function doShoot() {
  const p = G.player, wdef = WEAPONS[G.weapon];
  const base = Math.atan2(G.mouse.y - p.y, G.mouse.x - p.x);
  const pellets = wdef.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const a = base + (Math.random() - 0.5) * wdef.spread * 2;
    G.bullets.push({
      x: p.x + Math.cos(base)*24, y: p.y + Math.sin(base)*24,
      vx: Math.cos(a)*wdef.speed,  vy: Math.sin(a)*wdef.speed,
      life:65, damage:wdef.damage, color:wdef.color, r:wdef.bulletR
    });
  }
  G.ammo--; G.fireTimer = wdef.rate;
  // muzzle flash
  for (let i = 0; i < 8; i++) {
    const a = base + (Math.random()-0.5)*0.9;
    G.particles.push({ x:p.x+Math.cos(base)*28, y:p.y+Math.sin(base)*28, vx:Math.cos(a)*(2+Math.random()*4), vy:Math.sin(a)*(2+Math.random()*4), life:10, r:2+Math.random()*2, color:'#ffe080' });
  }
  updateHudAmmo();
  if (G.ammo <= 0) startReload();
}
 
function startReload() {
  if (!G || G.reloading || G.ammo === G.maxAmmo) return;
  G.reloading = true; G.reloadTimer = WEAPONS[G.weapon].reload;
}
 
// ─── SPAWN ────────────────────────────
function spawnZombie() {
  const CW = canvas.width, CH = canvas.height;
  const side = Math.floor(Math.random()*4);
  let x, y;
  if (side===0){ x=Math.random()*CW; y=-35; }
  else if(side===1){ x=CW+35; y=Math.random()*CH; }
  else if(side===2){ x=Math.random()*CW; y=CH+35; }
  else { x=-35; y=Math.random()*CH; }
  const hp = 1 + Math.floor(G.wave/3);
  const spd = 0.7 + G.wave*0.1 + Math.random()*0.35;
  G.zombies.push({ x, y, hp, maxHp:hp, speed:spd, wobble:Math.random()*Math.PI*2, armSwing:0 });
}
 
// ─── UPDATE ───────────────────────────
function update(dt) {
  const g = G, p = g.player;
  const CW = canvas.width, CH = canvas.height;
  if (p.iframes > 0) p.iframes -= dt;
  if (g.fireTimer > 0) g.fireTimer -= dt;
 
  // auto fire
  const wdef = WEAPONS[g.weapon];
  if (wdef.auto && g.mouseDown && g.fireTimer <= 0 && !g.reloading && g.ammo > 0) {
    doShoot();
  }
 
  // reload
  if (g.reloading) {
    g.reloadTimer -= dt;
    if (g.reloadTimer <= 0) {
      g.ammo = g.maxAmmo; g.reloading = false;
      updateHudAmmo();
    }
  }
 
  // movement
  let dx=0, dy=0;
  if (g.keys['z']||g.keys['arrowup'])    dy=-1;
  if (g.keys['s']||g.keys['arrowdown'])  dy=1;
  if (g.keys['q']||g.keys['arrowleft'])  dx=-1;
  if (g.keys['d']||g.keys['arrowright']) dx=1;
  if (dx&&dy){dx*=0.707;dy*=0.707;}
  p.x = Math.max(18, Math.min(CW-18, p.x + dx*p.speed*dt));
  p.y = Math.max(18, Math.min(CH-18, p.y + dy*p.speed*dt));
  p.angle = Math.atan2(g.mouse.y - p.y, g.mouse.x - p.x);
 
  // wave
  g.waveTimer += dt;
  if (g.waveBanner > 0) g.waveBanner -= dt;
  const interval = Math.max(28, 70 - g.wave*4);
  if (g.waveSpawned < g.waveTotal && g.waveTimer >= interval) {
    spawnZombie(); g.waveSpawned++; g.waveTimer=0;
  }
  if (g.waveSpawned >= g.waveTotal && g.zombies.length === 0) {
    g.wave++; g.waveTotal=6+g.wave*2; g.waveSpawned=0; g.waveTimer=0; g.waveBanner=110;
    p.hp = Math.min(p.maxHp, p.hp+1);
    updateHudHp();
    document.getElementById('hud-wave').textContent = g.wave;
  }
 
  // bullets vs zombies
  for (let i = g.bullets.length-1; i >= 0; i--) {
    const b = g.bullets[i];
    b.x += b.vx*dt; b.y += b.vy*dt; b.life -= dt;
    if (b.life<=0||b.x<-10||b.x>CW+10||b.y<-10||b.y>CH+10) { g.bullets.splice(i,1); continue; }
    let hit = false;
    for (let j = g.zombies.length-1; j >= 0; j--) {
      const z = g.zombies[j];
      if (Math.hypot(b.x-z.x, b.y-z.y) < 18) {
        z.hp -= b.damage;
        for (let k=0;k<10;k++){
          const a=Math.random()*Math.PI*2;
          g.particles.push({x:z.x,y:z.y,vx:Math.cos(a)*(1+Math.random()*3.5),vy:Math.sin(a)*(1+Math.random()*3.5),life:22,r:3+Math.random()*3,color:'#8b1a1a'});
        }
        g.bloodDecals.push({x:z.x+(Math.random()-0.5)*22,y:z.y+(Math.random()-0.5)*22,r:5+Math.random()*9,alpha:0.65});
        if (g.bloodDecals.length > 100) g.bloodDecals.shift();
        if (z.hp <= 0) {
          g.zombies.splice(j,1);
          g.score += 10 * g.wave;
          g.kills++;
          document.getElementById('hud-score').textContent = g.score;
        }
        hit = true; break;
      }
    }
    if (hit) { g.bullets.splice(i,1); }
  }
 
  // zombies vs player
  for (let i = g.zombies.length-1; i >= 0; i--) {
    const z = g.zombies[i];
    z.wobble  += 0.06*dt;
    z.armSwing += 0.12*dt;
    const angle = Math.atan2(p.y-z.y, p.x-z.x);
    const wa = angle + Math.sin(z.wobble)*0.25;
    z.x += Math.cos(wa)*z.speed*dt;
    z.y += Math.sin(wa)*z.speed*dt;
    if (Math.hypot(z.x-p.x, z.y-p.y) < 22 && p.iframes <= 0) {
      p.hp--; p.iframes=55;
      g.zombies.splice(i,1);
      for(let k=0;k<14;k++){const a=Math.random()*Math.PI*2;g.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*3.5,vy:Math.sin(a)*3.5,life:24,r:4,color:'#e04040'});}
      updateHudHp();
      if (p.hp <= 0) { g.running=false; showGameOver(g.score, g.wave, g.kills); return; }
    }
  }
 
  // particles
  for (let i=g.particles.length-1;i>=0;i--) {
    const pt=g.particles[i];
    pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vx*=0.87; pt.vy*=0.87; pt.life-=dt;
    if(pt.life<=0) g.particles.splice(i,1);
  }
}
 
// ─── DRAW ─────────────────────────────
function drawScene() {
  const g=G, p=g.player;
  const CW=canvas.width, CH=canvas.height;
  ctx.clearRect(0,0,CW,CH);
 
  // ground
  ctx.fillStyle='#182414'; ctx.fillRect(0,0,CW,CH);
  // grass patches
  const patchCount = Math.floor((CW*CH)/(900*580)*18);
  // static patches based on canvas size
  for(let i=0;i<20;i++){
    const px=(i*137+50)%CW, py=(i*89+60)%CH;
    ctx.fillStyle='#1e2e14';
    ctx.beginPath();ctx.ellipse(px,py,70+i%30,45+i%25,0,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='rgba(50,80,30,0.08)'; ctx.lineWidth=1;
  for(let x=0;x<CW;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
  for(let y=0;y<CH;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
 
  // blood decals
  for(const d of g.bloodDecals){
    ctx.fillStyle=`rgba(80,10,10,${d.alpha})`;
    ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();
  }
 
  // particles
  for(const pt of g.particles){
    ctx.globalAlpha=Math.max(0,pt.life/25);
    ctx.fillStyle=pt.color;
    ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
 
  // bullets
  for(const b of g.bullets){
    ctx.fillStyle=b.color; ctx.shadowColor=b.color; ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
 
  // zombies
  for(const z of g.zombies) drawZombie(z);
 
  // player
  drawPlayer();
 
  // crosshair
  drawCrosshair();
 
  // reload bar
  if(g.reloading){
    const pct=1-(g.reloadTimer/WEAPONS[g.weapon].reload);
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(p.x-30,p.y+26,60,8);
    ctx.fillStyle='#60c0e0'; ctx.fillRect(p.x-30,p.y+26,60*pct,8);
    ctx.fillStyle='#d4e8c2'; ctx.font='bold 11px Rajdhani'; ctx.textAlign='center';
    ctx.fillText('RECHARGEMENT',p.x,p.y+46);
  }
 
  // wave banner
  if(g.waveBanner>0){
    const alpha=Math.min(1,g.waveBanner/35)*Math.min(1,(g.waveBanner)/35);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.65)';
    ctx.fillRect(CW/2-160,CH/2-32,320,58);
    ctx.fillStyle='#ffe060';
    ctx.font='bold 30px Black Ops One, cursive';
    ctx.textAlign='center';
    ctx.fillText(`⚔️ VAGUE ${g.wave} !`,CW/2,CH/2+8);
    ctx.globalAlpha=1;
  }
}
 
function drawPlayer() {
  const p=G.player;
  const flash = p.iframes>0 && Math.floor(p.iframes/4)%2===0;
  ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle+Math.PI/2);
 
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.2)';
  ctx.beginPath();ctx.ellipse(3,8,13,6,0,0,Math.PI*2);ctx.fill();
 
  // legs
  ctx.fillStyle=flash?'#ff9999':'#3a4a28';
  ctx.fillRect(-6,8,7,16); ctx.fillRect(2,8,7,16);
  ctx.fillStyle='#1a1a1a';
  ctx.fillRect(-7,22,9,5); ctx.fillRect(1,22,9,5);
 
  // body (uniform)
  ctx.fillStyle=flash?'#ff9999':'#4a6030';
  ctx.beginPath();ctx.roundRect(-10,-8,20,22,3);ctx.fill();
  // camo
  ctx.fillStyle='rgba(25,45,8,0.5)';
  ctx.beginPath();ctx.ellipse(-3,-1,4,2,0.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(4,5,2,3,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(-5,7,2,2,0,0,Math.PI*2);ctx.fill();
 
  // arms
  ctx.fillStyle=flash?'#c09090':'#c8a070';
  ctx.save();ctx.rotate(-0.3);ctx.fillRect(-14,-3,9,5);ctx.restore();
  ctx.save();ctx.rotate(0.3);ctx.fillRect(5,-3,9,5);ctx.restore();
 
  // weapon
  const wk=G.weapon;
  if(wk==='pistolet'){
    ctx.fillStyle='#3a3a4a';ctx.fillRect(-2,-22,4,14);ctx.fillRect(-4,-10,9,8);
  } else if(wk==='fusil'){
    ctx.fillStyle='#2a2a2a';ctx.fillRect(-2,-30,5,24);
    ctx.fillStyle='#3a3020';ctx.fillRect(-3,-12,7,16);
    ctx.fillStyle='#1a1a1a';ctx.fillRect(-1,-32,3,5);
  } else if(wk==='shotgun'){
    ctx.fillStyle='#3a2010';ctx.fillRect(-5,-30,9,12);ctx.fillRect(-4,-20,7,18);
    ctx.fillStyle='#1a1a1a';ctx.fillRect(-2,-32,5,6);ctx.fillRect(1,-32,5,6);
  } else if(wk==='sniper'){
    ctx.fillStyle='#1a2a2a';ctx.fillRect(-2,-36,4,30);
    ctx.fillStyle='#3a4a3a';ctx.fillRect(-3,-14,7,18);
    ctx.fillStyle='#50a0a0';ctx.fillRect(-4,-38,9,7);
    ctx.fillStyle='rgba(80,180,180,0.25)';ctx.beginPath();ctx.arc(0,-34,5,0,Math.PI*2);ctx.fill();
  }
 
  // neck + head
  ctx.fillStyle=flash?'#ffcccc':'#c8a070';
  ctx.fillRect(-3,-16,6,8);
  ctx.beginPath();ctx.arc(0,-22,10,0,Math.PI*2);ctx.fill();
 
  // helmet
  ctx.fillStyle=flash?'#88aa60':'#3a5020';
  ctx.beginPath();ctx.arc(0,-24,10,Math.PI,0);ctx.fill();
  ctx.fillRect(-10,-24,20,4);
  ctx.fillRect(-12,-20,24,3);
 
  // eyes
  ctx.fillStyle='#1a0a04';
  ctx.beginPath();ctx.arc(-3,-22,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(3,-22,2,0,Math.PI*2);ctx.fill();
 
  ctx.restore();
 
  // name tag above
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle='rgba(0,0,0,0.6)';
  ctx.fillRect(-48,-46,96,16);
  ctx.fillStyle='#60e0a0';
  ctx.font='bold 11px Rajdhani';
  ctx.textAlign='center';
  ctx.fillText(`🪖 Soldat ${soldierName}`,0,-33);
  ctx.restore();
}
 
function drawZombie(z) {
  const angle=Math.atan2(G.player.y-z.y,G.player.x-z.x);
  const sw=Math.sin(z.armSwing)*0.42;
  ctx.save();ctx.translate(z.x,z.y);ctx.rotate(angle+Math.PI/2);
 
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.beginPath();ctx.ellipse(2,10,11,5,0,0,Math.PI*2);ctx.fill();
 
  // legs
  ctx.fillStyle='#2a3a1a';
  ctx.fillRect(-6,6,7,18); ctx.fillRect(2,6,7,18);
  ctx.fillStyle='#1a2a10';
  ctx.fillRect(-7,20,6,6); ctx.fillRect(3,22,6,5);
 
  // body
  ctx.fillStyle='#2a3a1a';
  ctx.beginPath();ctx.roundRect(-9,-7,18,18,2);ctx.fill();
  ctx.fillStyle='rgba(100,10,10,0.6)';
  ctx.fillRect(-3,0,5,7);
  ctx.beginPath();ctx.ellipse(4,-2,3,4,0,0,Math.PI*2);ctx.fill();
 
  // left arm
  ctx.fillStyle='#6a7a3a';
  ctx.save();ctx.rotate(-0.55+sw);
  ctx.fillRect(-18,-5,13,6);
  ctx.fillStyle='#5a6a2a';
  ctx.beginPath();ctx.arc(-18,0,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2a2a0a';
  for(let c=-2;c<=2;c++) ctx.fillRect(-21+c*1.8,-1,2,8);
  ctx.restore();
 
  // right arm
  ctx.fillStyle='#6a7a3a';
  ctx.save();ctx.rotate(0.55-sw);
  ctx.fillRect(5,-5,13,6);
  ctx.fillStyle='#5a6a2a';
  ctx.beginPath();ctx.arc(18,0,6,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#2a2a0a';
  for(let c=-2;c<=2;c++) ctx.fillRect(16+c*1.8,-1,2,8);
  ctx.restore();
 
  // neck
  ctx.fillStyle='#4a5a20';ctx.fillRect(-3,-12,6,7);
 
  // head
  ctx.fillStyle='#5a6a28';
  ctx.beginPath();ctx.arc(0,-20,11,0,Math.PI*2);ctx.fill();
  // sunken cheeks
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath();ctx.ellipse(-4,-20,3,5,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(4,-20,3,5,-0.3,0,Math.PI*2);ctx.fill();
 
  // glowing eyes
  ctx.fillStyle='#ff1a1a';ctx.shadowColor='#ff2020';ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(-3,-22,3.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(3,-22,3.5,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
 
  // mouth / teeth
  ctx.fillStyle='#1a0505';ctx.fillRect(-6,-14,12,5);
  ctx.fillStyle='#ddd8c0';
  for(let t=0;t<4;t++) ctx.fillRect(-5+t*2.8,-14,2,4);
 
  // scraggly hair
  ctx.fillStyle='#151508';
  ctx.fillRect(-10,-30,5,10); ctx.fillRect(3,-31,4,8); ctx.fillRect(-3,-32,3,9);
 
  // HP bar
  ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(-13,-36,26,5);
  ctx.fillStyle=z.hp/z.maxHp>0.5?'#40c040':'#e03030';
  ctx.fillRect(-13,-36,26*(z.hp/z.maxHp),5);
 
  ctx.restore();
}
 
function drawCrosshair() {
  const mx=G.mouse.x, my=G.mouse.y;
  const isSniper = G.weapon==='sniper';
  const CW=canvas.width, CH=canvas.height;
  ctx.strokeStyle=isSniper?'rgba(96,224,224,0.85)':'rgba(255,80,80,0.85)';
  ctx.lineWidth=1.5;
  if(isSniper){
    ctx.globalAlpha=0.3;
    ctx.beginPath();ctx.moveTo(0,my);ctx.lineTo(CW,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx,CH);ctx.stroke();
    ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(mx,my,24,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(mx,my,4,0,Math.PI*2);ctx.stroke();
  } else {
    ctx.beginPath();ctx.moveTo(mx-14,my);ctx.lineTo(mx-5,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx+5,my);ctx.lineTo(mx+14,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,my-14);ctx.lineTo(mx,my-5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,my+5);ctx.lineTo(mx,my+14);ctx.stroke();
    ctx.beginPath();ctx.arc(mx,my,5,0,Math.PI*2);ctx.stroke();
  }
}
 
// ─── LOOP ─────────────────────────────
function loop(now) {
  if (!G || !G.running) return;
  const dt = Math.min((now - G.lastTime)/16.67, 3);
  G.lastTime = now;
  update(dt);
  drawScene();
  animId = requestAnimationFrame(loop);
}
 
// ─── INIT ─────────────────────────────
showScreen('screen-name');
buildWeaponGrid();
