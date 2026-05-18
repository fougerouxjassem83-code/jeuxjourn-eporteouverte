// ══════════════════════════════════════
//   ZOMBIE SHOOTER — SMA MAYOTTE
//   game.js  (+ Web Audio sounds)
// ══════════════════════════════════════
 
// ──────────────────────────────────────
//  AUDIO ENGINE
// ──────────────────────────────────────
let _audioCtx = null;
function getAudioCtx(){
  if(!_audioCtx) _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  // Resume if suspended (autoplay policy)
  if(_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}
 
// Master volume (gain node shared by all sounds)
let _masterGain = null;
function getMaster(){
  const ac = getAudioCtx();
  if(!_masterGain){
    _masterGain = ac.createGain();
    _masterGain.gain.value = 0.55;
    _masterGain.connect(ac.destination);
  }
  return _masterGain;
}
 
// Low-level helper: play a shaped oscillator burst
function playTone({ type='square', freq=440, freqEnd=null, duration=0.12,
                    attack=0.004, decay=0.08, volume=0.4,
                    filterType=null, filterFreq=3000, filterQ=1,
                    detune=0 }={}){
  try{
    const ac = getAudioCtx();
    const t  = ac.currentTime;
    const osc = ac.createOscillator();
    const env = ac.createGain();
 
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if(freqEnd !== null)
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd,1), t+duration);
    if(detune) osc.detune.setValueAtTime(detune, t);
 
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(volume, t+attack);
    env.gain.exponentialRampToValueAtTime(0.001, t+attack+decay);
 
    let chain = env;
 
    if(filterType){
      const filt = ac.createBiquadFilter();
      filt.type = filterType;
      filt.frequency.value = filterFreq;
      filt.Q.value = filterQ;
      env.connect(filt);
      filt.connect(getMaster());
    } else {
      env.connect(getMaster());
    }
 
    osc.connect(env);
    osc.start(t);
    osc.stop(t + attack + decay + 0.02);
  }catch(e){}
}
 
// Noise burst helper (for shotgun / impact / reload click)
function playNoise({ duration=0.15, attack=0.003, decay=0.12,
                     volume=0.35, filterType='bandpass',
                     filterFreq=1200, filterQ=0.8 }={}){
  try{
    const ac  = getAudioCtx();
    const t   = ac.currentTime;
    const len = Math.ceil(ac.sampleRate * (duration + 0.05));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data= buf.getChannelData(0);
    for(let i=0;i<len;i++) data[i]=(Math.random()*2-1);
 
    const src  = ac.createBufferSource();
    src.buffer = buf;
    const env  = ac.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(volume, t+attack);
    env.gain.exponentialRampToValueAtTime(0.001, t+attack+decay);
 
    const filt = ac.createBiquadFilter();
    filt.type  = filterType;
    filt.frequency.value = filterFreq;
    filt.Q.value = filterQ;
 
    src.connect(env);
    env.connect(filt);
    filt.connect(getMaster());
    src.start(t);
    src.stop(t + attack + decay + 0.05);
  }catch(e){}
}
 
// ── Individual sound functions ──────────────────────────────
 
function sfxShoot(weapon){
  switch(weapon){
    case 'pistolet':
      // Sharp mid crack
      playTone({ type:'square', freq:320, freqEnd:80, duration:0.14,
                 attack:0.003, decay:0.11, volume:0.45, filterType:'highpass', filterFreq:180 });
      playNoise({ duration:0.08, attack:0.002, decay:0.06, volume:0.28, filterFreq:2200, filterQ:0.9 });
      break;
 
    case 'fusil':
      // Rapid punchy crack
      playTone({ type:'sawtooth', freq:260, freqEnd:60, duration:0.11,
                 attack:0.002, decay:0.09, volume:0.5, filterType:'lowpass', filterFreq:2400 });
      playNoise({ duration:0.07, attack:0.001, decay:0.05, volume:0.32, filterFreq:1800, filterQ:1.1 });
      break;
 
    case 'shotgun':
      // Boomy wide blast — two noise layers
      playNoise({ duration:0.22, attack:0.003, decay:0.18, volume:0.55,
                  filterType:'lowpass', filterFreq:700, filterQ:0.6 });
      playNoise({ duration:0.14, attack:0.002, decay:0.10, volume:0.38,
                  filterType:'bandpass', filterFreq:2800, filterQ:0.7 });
      playTone({ type:'sine', freq:90, freqEnd:30, duration:0.22,
                 attack:0.003, decay:0.18, volume:0.4 });
      break;
 
    case 'sniper':
      // Long high-velocity crack + tail
      playTone({ type:'sawtooth', freq:500, freqEnd:40, duration:0.28,
                 attack:0.002, decay:0.22, volume:0.55, filterType:'highpass', filterFreq:220 });
      playNoise({ duration:0.18, attack:0.002, decay:0.14, volume:0.25,
                  filterType:'highpass', filterFreq:3000, filterQ:0.5 });
      break;
  }
}
 
function sfxReload(weapon){
  // Metallic click-clack — two short tones
  playNoise({ duration:0.07, attack:0.002, decay:0.055, volume:0.28,
              filterType:'bandpass', filterFreq:4000, filterQ:3 });
  setTimeout(()=>{
    playNoise({ duration:0.06, attack:0.002, decay:0.045, volume:0.22,
                filterType:'bandpass', filterFreq:3200, filterQ:2.5 });
  }, weapon==='shotgun' ? 260 : 140);
  // Soft low thud (mag seat)
  setTimeout(()=>{
    playTone({ type:'sine', freq:95, freqEnd:50, duration:0.1,
               attack:0.004, decay:0.08, volume:0.3 });
  }, weapon==='shotgun' ? 400 : 220);
}
 
function sfxZombieDie(){
  // Guttural descending groan
  playTone({ type:'sawtooth', freq:180, freqEnd:55, duration:0.35,
             attack:0.01, decay:0.30, volume:0.5,
             filterType:'lowpass', filterFreq:600, filterQ:2 });
  playNoise({ duration:0.2, attack:0.005, decay:0.16, volume:0.3,
              filterType:'bandpass', filterFreq:500, filterQ:1.2 });
}
 
function sfxPlayerHit(){
  // Painful impact thud + high-freq sting
  playTone({ type:'sine', freq:80, freqEnd:35, duration:0.22,
             attack:0.005, decay:0.18, volume:0.55 });
  playTone({ type:'square', freq:1100, freqEnd:300, duration:0.14,
             attack:0.003, decay:0.11, volume:0.2, filterType:'lowpass', filterFreq:1400 });
}
 
function sfxNewWave(waveNum){
  // Triumphant two-note sting
  const ac = getAudioCtx();
  const t  = ac.currentTime;
  const notes = [440, 660, 880];
  notes.forEach((f,i)=>{
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    env.gain.setValueAtTime(0, t+i*0.12);
    env.gain.linearRampToValueAtTime(0.35, t+i*0.12+0.02);
    env.gain.exponentialRampToValueAtTime(0.001, t+i*0.12+0.28);
    osc.connect(env); env.connect(getMaster());
    osc.start(t+i*0.12);
    osc.stop(t+i*0.12+0.32);
  });
}
 
// ══════════════════════════════════════
//   WEAPONS / GRADES / CORE DATA
// ══════════════════════════════════════
 
const WEAPONS = {
  pistolet:{ name:'Pistolet', emoji:'🔫', ammo:12, damage:1, rate:18, spread:0.06, speed:14, reload:65,  bulletR:3,   auto:false, color:'#a0c0ff', desc:'12 balles · Précis' },
  fusil:   { name:'Fusil AR', emoji:'🪖', ammo:8,  damage:1, rate:7,  spread:0.05, speed:16, reload:80,  bulletR:3.5, auto:true,  color:'#80ff80', desc:'8 balles · Auto' },
  shotgun: { name:'Shotgun',  emoji:'💥', ammo:5,  damage:1, rate:28, spread:0.38, speed:12, reload:110, bulletR:4,   auto:false, color:'#ffaa40', pellets:6, desc:'5 coups · Large' },
  sniper:  { name:'Sniper',   emoji:'🎯', ammo:4,  damage:3, rate:45, spread:0.01, speed:22, reload:75,  bulletR:2.5, auto:false, color:'#60e0e0', desc:'4 balles · 3 dégâts' },
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
function getGrade(score){ let g=GRADES[0]; for(const gr of GRADES){ if(score>=gr.min) g=gr; } return g; }
 
let soldierName = '';
let currentWeapon = 'fusil';
let G = null;
let animId = null;
let leaderboard = [];
try { leaderboard = JSON.parse(localStorage.getItem('sma_lb')||'[]'); } catch(e){ leaderboard=[]; }
 
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  if(id) document.getElementById(id).classList.add('show');
}
 
document.getElementById('btn-name').addEventListener('click', goToWeapon);
document.getElementById('name-input').addEventListener('keydown', e=>{ if(e.key==='Enter') goToWeapon(); });
document.getElementById('btn-leaderboard-open').addEventListener('click',()=>{ renderLeaderboard(); showScreen('screen-leaderboard'); });
document.getElementById('btn-lb-back').addEventListener('click',()=>showScreen('screen-name'));
 
function goToWeapon(){
  const v = document.getElementById('name-input').value.trim();
  soldierName = v || 'Inconnu';
  document.getElementById('weapon-title').textContent = `Choisis ton arme, Soldat ${soldierName} !`;
  buildWeaponGrid();
  showScreen('screen-weapon');
}
 
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-weapon-back').addEventListener('click',()=>showScreen('screen-name'));
 
function buildWeaponGrid(){
  const grid = document.getElementById('weapon-grid');
  grid.innerHTML='';
  WEAPON_KEYS.forEach(key=>{
    const w=WEAPONS[key];
    const div=document.createElement('div');
    div.className='weapon-card-item'+(key===currentWeapon?' active':'');
    div.innerHTML=`<div class="w-emoji">${w.emoji}</div><div class="w-name">${w.name}</div><div class="w-desc">${w.desc}</div>`;
    div.addEventListener('click',()=>{ currentWeapon=key; buildWeaponGrid(); });
    grid.appendChild(div);
  });
}
 
function saveScore(name,score,wave,kills){
  leaderboard.push({name,score,wave,kills,date:new Date().toLocaleDateString('fr-FR')});
  leaderboard.sort((a,b)=>b.score-a.score);
  if(leaderboard.length>20) leaderboard=leaderboard.slice(0,20);
  try{ localStorage.setItem('sma_lb',JSON.stringify(leaderboard)); }catch(e){}
}
 
function renderLeaderboard(){
  const list=document.getElementById('lb-list');
  if(!leaderboard.length){ list.innerHTML='<div class="lb-empty">Aucun score encore.<br>Sois le premier, soldat !</div>'; return; }
  list.innerHTML=leaderboard.slice(0,10).map((e,i)=>{
    const g=getGrade(e.score);
    const cls=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'';
    const medal=i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`;
    return `<div class="lb-row ${cls}">
      <div class="lb-rank">${medal}</div>
      <div class="lb-name">Sdt ${e.name}</div>
      <div class="lb-grade" style="color:${g.color}">${g.label}</div>
      <div class="lb-score">${e.score} pts</div>
    </div>`;
  }).join('');
}
 
document.getElementById('btn-replay').addEventListener('click',()=>{ buildWeaponGrid(); showScreen('screen-weapon'); });
document.getElementById('btn-go-lb').addEventListener('click',()=>{ renderLeaderboard(); showScreen('screen-leaderboard'); });
document.getElementById('btn-go-name').addEventListener('click',()=>showScreen('screen-name'));
 
function showGameOver(score,wave,kills){
  saveScore(soldierName,score,wave,kills);
  const g=getGrade(score);
  document.getElementById('go-grade').textContent=g.label;
  document.getElementById('go-grade').style.color=g.color;
  document.getElementById('go-name-label').textContent=`Soldat ${soldierName} — Bien combattu !`;
  document.getElementById('go-score').textContent=score;
  document.getElementById('go-wave').textContent=wave;
  document.getElementById('go-kills').textContent=kills;
  showScreen('screen-gameover');
}
 
const canvas=document.getElementById('gc');
const ctx=canvas.getContext('2d');
 
function resizeCanvas(){
  canvas.width=window.innerWidth;
  const hudH=document.querySelector('.hud').offsetHeight||44;
  canvas.height=window.innerHeight-hudH;
}
window.addEventListener('resize',()=>{ if(G) resizeCanvas(); });
 
function initGame(){
  resizeCanvas();
  const wdef=WEAPONS[currentWeapon];
  return {
    player:{ x:canvas.width/2, y:canvas.height/2, hp:5, maxHp:5, angle:0, speed:3, iframes:0, walkCycle:0, moving:false },
    bullets:[], zombies:[], particles:[], bloodDecals:[],
    score:0, kills:0, wave:1, waveSpawned:0, waveTotal:6, waveTimer:0, waveBanner:0,
    weapon:currentWeapon,
    ammo:wdef.ammo, maxAmmo:wdef.ammo,
    reloading:false, reloadTimer:0, fireTimer:0,
    keys:{}, mouse:{x:canvas.width/2, y:canvas.height/2}, mouseDown:false,
    running:true,
  };
}
 
function startGame(){
  // Unlock AudioContext on first user gesture
  getAudioCtx();
  showScreen('screen-game');
  if(animId) cancelAnimationFrame(animId);
  G=initGame();
  buildHudWeapons();
  updateHudHp();
  updateHudAmmo();
  document.getElementById('hud-name').innerHTML=`🪖 <span>Sdt ${soldierName}</span>`;
  document.getElementById('hud-score').textContent='0';
  document.getElementById('hud-wave').textContent='1';
  G.lastTime=performance.now();
  animId=requestAnimationFrame(loop);
}
 
function buildHudWeapons(){
  const wrap=document.getElementById('hud-weapons');
  wrap.innerHTML='<div class="whud">'+WEAPON_KEYS.map(k=>{
    const w=WEAPONS[k];
    return `<button class="whud-btn${k===G.weapon?' active':''}" data-key="${k}">${w.emoji} ${w.name}</button>`;
  }).join('')+'</div>';
  wrap.querySelectorAll('.whud-btn').forEach(btn=>btn.addEventListener('click',()=>switchWeapon(btn.dataset.key)));
}
 
function updateHudHp(){
  const p=G.player;
  document.getElementById('hud-hp').innerHTML='<div class="hearts">'+
    Array.from({length:p.maxHp},(_,i)=>`<span class="heart${i<p.hp?'':' empty'}">❤️</span>`).join('')+
  '</div>';
}
 
function updateHudAmmo(){
  const bar=Array.from({length:G.maxAmmo},(_,i)=>`<div class="ammo-b${i>=G.ammo?' empty':''}"></div>`).join('');
  document.getElementById('hud-ammo').innerHTML=`<div class="ammo-wrap">${bar}</div>${G.reloading?'&nbsp;🔄':''}`;
}
 
function switchWeapon(key){
  if(!G||!G.running) return;
  const wdef=WEAPONS[key];
  G.weapon=key; G.ammo=wdef.ammo; G.maxAmmo=wdef.ammo;
  G.reloading=false; G.reloadTimer=0; G.fireTimer=0;
  updateHudAmmo();
  document.querySelectorAll('.whud-btn').forEach(b=>b.classList.toggle('active',b.dataset.key===key));
}
 
canvas.addEventListener('mousemove',e=>{ if(!G) return; const r=canvas.getBoundingClientRect(); G.mouse.x=e.clientX-r.left; G.mouse.y=e.clientY-r.top; });
canvas.addEventListener('mousedown',()=>{ if(G){ G.mouseDown=true; tryShoot(); } });
canvas.addEventListener('mouseup',()=>{ if(G) G.mouseDown=false; });
document.addEventListener('keydown',e=>{
  if(!G) return;
  G.keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==='r') startReload();
  const map={'1':'pistolet','2':'fusil','3':'shotgun','4':'sniper'};
  if(map[e.key]) switchWeapon(map[e.key]);
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
});
document.addEventListener('keyup',e=>{ if(G) G.keys[e.key.toLowerCase()]=false; });
 
function tryShoot(){
  if(!G||!G.running||G.reloading||G.fireTimer>0) return;
  if(G.ammo<=0){ startReload(); return; }
  doShoot();
}
function doShoot(){
  const p=G.player, wdef=WEAPONS[G.weapon];
  const base=Math.atan2(G.mouse.y-p.y,G.mouse.x-p.x);
  const pellets=wdef.pellets||1;
  for(let i=0;i<pellets;i++){
    const a=base+(Math.random()-0.5)*wdef.spread*2;
    G.bullets.push({x:p.x+Math.cos(base)*26,y:p.y+Math.sin(base)*26,vx:Math.cos(a)*wdef.speed,vy:Math.sin(a)*wdef.speed,life:65,damage:wdef.damage,color:wdef.color,r:wdef.bulletR});
  }
  // 🔊 Shoot sound
  sfxShoot(G.weapon);
 
  G.ammo--; G.fireTimer=wdef.rate;
  for(let i=0;i<9;i++){
    const a=base+(Math.random()-0.5)*1.0;
    G.particles.push({x:p.x+Math.cos(base)*30,y:p.y+Math.sin(base)*30,vx:Math.cos(a)*(2+Math.random()*5),vy:Math.sin(a)*(2+Math.random()*5),life:10,r:2+Math.random()*2.5,color:'#ffe090'});
  }
  updateHudAmmo();
  if(G.ammo<=0) startReload();
}
 
function startReload(){
  if(!G||G.reloading||G.ammo===G.maxAmmo) return;
  G.reloading=true; G.reloadTimer=WEAPONS[G.weapon].reload;
  // 🔊 Reload sound
  sfxReload(G.weapon);
}
 
function spawnZombie(){
  const CW=canvas.width, CH=canvas.height;
  const side=Math.floor(Math.random()*4);
  let x,y;
  if(side===0){x=Math.random()*CW;y=-35;}
  else if(side===1){x=CW+35;y=Math.random()*CH;}
  else if(side===2){x=Math.random()*CW;y=CH+35;}
  else{x=-35;y=Math.random()*CH;}
  const hp=1+Math.floor(G.wave/3);
  const spd=0.7+G.wave*0.1+Math.random()*0.35;
  G.zombies.push({x,y,hp,maxHp:hp,speed:spd,wobble:Math.random()*Math.PI*2,armSwing:0});
}
 
function update(dt){
  const g=G, p=g.player;
  const CW=canvas.width, CH=canvas.height;
  if(p.iframes>0) p.iframes-=dt;
  if(g.fireTimer>0) g.fireTimer-=dt;
  const wdef=WEAPONS[g.weapon];
  if(wdef.auto&&g.mouseDown&&g.fireTimer<=0&&!g.reloading&&g.ammo>0) doShoot();
  if(g.reloading){ g.reloadTimer-=dt; if(g.reloadTimer<=0){ g.ammo=g.maxAmmo; g.reloading=false; updateHudAmmo(); } }
  let dx=0,dy=0;
  if(g.keys['z']||g.keys['arrowup'])    dy=-1;
  if(g.keys['s']||g.keys['arrowdown'])  dy=1;
  if(g.keys['q']||g.keys['arrowleft'])  dx=-1;
  if(g.keys['d']||g.keys['arrowright']) dx=1;
  if(dx&&dy){dx*=0.707;dy*=0.707;}
  p.moving=dx!==0||dy!==0;
  if(p.moving) p.walkCycle+=0.18*dt;
  p.x=Math.max(20,Math.min(CW-20,p.x+dx*p.speed*dt));
  p.y=Math.max(20,Math.min(CH-20,p.y+dy*p.speed*dt));
  p.angle=Math.atan2(g.mouse.y-p.y,g.mouse.x-p.x);
  g.waveTimer+=dt;
  if(g.waveBanner>0) g.waveBanner-=dt;
  const interval=Math.max(28,70-g.wave*4);
  if(g.waveSpawned<g.waveTotal&&g.waveTimer>=interval){ spawnZombie(); g.waveSpawned++; g.waveTimer=0; }
  if(g.waveSpawned>=g.waveTotal&&g.zombies.length===0){
    g.wave++; g.waveTotal=6+g.wave*2; g.waveSpawned=0; g.waveTimer=0; g.waveBanner=110;
    p.hp=Math.min(p.maxHp,p.hp+1); updateHudHp();
    document.getElementById('hud-wave').textContent=g.wave;
    // 🔊 New wave jingle
    sfxNewWave(g.wave);
  }
  for(let i=g.bullets.length-1;i>=0;i--){
    const b=g.bullets[i];
    b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
    if(b.life<=0||b.x<-10||b.x>CW+10||b.y<-10||b.y>CH+10){g.bullets.splice(i,1);continue;}
    let hit=false;
    for(let j=g.zombies.length-1;j>=0;j--){
      const z=g.zombies[j];
      if(Math.hypot(b.x-z.x,b.y-z.y)<18){
        z.hp-=b.damage;
        for(let k=0;k<10;k++){const a=Math.random()*Math.PI*2;g.particles.push({x:z.x,y:z.y,vx:Math.cos(a)*(1+Math.random()*4),vy:Math.sin(a)*(1+Math.random()*4),life:22,r:3+Math.random()*3,color:'#8b1a1a'});}
        g.bloodDecals.push({x:z.x+(Math.random()-0.5)*24,y:z.y+(Math.random()-0.5)*24,r:5+Math.random()*9,alpha:0.6});
        if(g.bloodDecals.length>120) g.bloodDecals.shift();
        if(z.hp<=0){
          g.zombies.splice(j,1);
          g.score+=10*g.wave;
          g.kills++;
          document.getElementById('hud-score').textContent=g.score;
          // 🔊 Zombie death
          sfxZombieDie();
        }
        hit=true; break;
      }
    }
    if(hit) g.bullets.splice(i,1);
  }
  for(let i=g.zombies.length-1;i>=0;i--){
    const z=g.zombies[i];
    z.wobble+=0.06*dt; z.armSwing+=0.13*dt;
    const angle=Math.atan2(p.y-z.y,p.x-z.x);
    const wa=angle+Math.sin(z.wobble)*0.26;
    z.x+=Math.cos(wa)*z.speed*dt; z.y+=Math.sin(wa)*z.speed*dt;
    if(Math.hypot(z.x-p.x,z.y-p.y)<22&&p.iframes<=0){
      p.hp--; p.iframes=55; g.zombies.splice(i,1);
      for(let k=0;k<14;k++){const a=Math.random()*Math.PI*2;g.particles.push({x:p.x,y:p.y,vx:Math.cos(a)*3.5,vy:Math.sin(a)*3.5,life:24,r:4,color:'#e03030'});}
      // 🔊 Player hit
      sfxPlayerHit();
      updateHudHp();
      if(p.hp<=0){g.running=false;showGameOver(g.score,g.wave,g.kills);return;}
    }
  }
  for(let i=g.particles.length-1;i>=0;i--){
    const pt=g.particles[i];
    pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vx*=0.87; pt.vy*=0.87; pt.life-=dt;
    if(pt.life<=0) g.particles.splice(i,1);
  }
}
 
function drawScene(){
  const g=G, p=g.player;
  const CW=canvas.width, CH=canvas.height;
  ctx.clearRect(0,0,CW,CH);
  ctx.fillStyle='#172213'; ctx.fillRect(0,0,CW,CH);
  for(let i=0;i<24;i++){
    const px=(i*137+60)%CW, py=(i*97+70)%CH;
    ctx.fillStyle=`rgba(28,46,18,${0.5+((i*13)%10)*0.04})`;
    ctx.beginPath();ctx.ellipse(px,py,65+(i%3)*25,40+(i%4)*15,(i*0.3)%Math.PI,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='rgba(40,70,25,0.07)'; ctx.lineWidth=1;
  for(let x=0;x<CW;x+=52){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
  for(let y=0;y<CH;y+=52){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
  for(const d of g.bloodDecals){ctx.fillStyle=`rgba(80,8,8,${d.alpha})`;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();}
  for(const pt of g.particles){ctx.globalAlpha=Math.max(0,pt.life/25);ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  for(const b of g.bullets){ctx.fillStyle=b.color;ctx.shadowColor=b.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
  for(const z of g.zombies) drawZombie(z);
  drawPlayer();
  drawCrosshair();
  if(g.reloading){
    const pct=1-(g.reloadTimer/WEAPONS[g.weapon].reload);
    ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(p.x-32,p.y+28,64,9);
    ctx.fillStyle='#50b0d0';ctx.fillRect(p.x-32,p.y+28,64*pct,9);
    ctx.fillStyle='#c8e8c0';ctx.font='bold 11px Rajdhani,sans-serif';ctx.textAlign='center';
    ctx.fillText('RECHARGEMENT',p.x,p.y+50);
  }
  if(g.waveBanner>0){
    const t=g.waveBanner;
    const alpha=Math.min(1,t/35)*Math.min(1,t/35);
    ctx.globalAlpha=alpha;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(CW/2-180,CH/2-38,360,66);
    ctx.strokeStyle='#3a6020';ctx.lineWidth=1.5;ctx.strokeRect(CW/2-180,CH/2-38,360,66);
    ctx.fillStyle='#ffe060';ctx.font='bold 32px "Black Ops One",cursive';ctx.textAlign='center';
    ctx.fillText(`⚔️  VAGUE ${g.wave}  ⚔️`,CW/2,CH/2+10);
    ctx.globalAlpha=1;
  }
}
 
function drawPlayer(){
  const p=G.player;
  const flash=p.iframes>0&&Math.floor(p.iframes/5)%2===0;
  const wk=G.weapon;
  const bob=p.moving?Math.sin(p.walkCycle)*2.5:0;
  const legSwing=p.moving?Math.sin(p.walkCycle)*0.35:0;
  ctx.save();ctx.translate(p.x,p.y+bob);ctx.rotate(p.angle+Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,0.22)';ctx.beginPath();ctx.ellipse(3,10,15,7,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.rotate(legSwing);
  ctx.fillStyle=flash?'#ff9090':'#3a4a28';ctx.fillRect(-8,8,8,18);
  ctx.fillStyle='#111';ctx.fillRect(-9,24,10,6);ctx.fillRect(-10,27,12,3);
  ctx.restore();
  ctx.save();ctx.rotate(-legSwing);
  ctx.fillStyle=flash?'#ff9090':'#3a4a28';ctx.fillRect(1,8,8,18);
  ctx.fillStyle='#111';ctx.fillRect(0,24,10,6);ctx.fillRect(-1,27,12,3);
  ctx.restore();
  ctx.fillStyle=flash?'#ff9090':'#485f2c';ctx.beginPath();ctx.roundRect(-11,-10,22,24,4);ctx.fill();
  if(!flash){
    ctx.fillStyle='rgba(28,42,10,0.55)';
    ctx.beginPath();ctx.ellipse(-4,0,4,3,0.6,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(5,6,3,4,-0.4,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(-6,8,3,2,0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(3,-4,2,3,0.1,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle=flash?'#ff9090':'#2e3e18';ctx.lineWidth=1.5;ctx.strokeRect(-11,-10,22,24);
  ctx.fillStyle=flash?'#ff9090':'#282e18';ctx.fillRect(-11,10,22,4);
  ctx.fillStyle='#4a5030';ctx.fillRect(-4,10,6,4);
  const armSwing=p.moving?Math.sin(p.walkCycle+Math.PI)*0.3:0;
  ctx.save();ctx.rotate(-0.35+armSwing);
  ctx.fillStyle=flash?'#c09090':'#c8a070';ctx.fillRect(-16,-4,10,6);
  ctx.fillStyle=flash?'#ff9090':'#485f2c';ctx.fillRect(-16,-5,8,7);
  ctx.restore();
  ctx.save();ctx.rotate(0.35-armSwing);
  ctx.fillStyle=flash?'#ff9090':'#485f2c';ctx.fillRect(6,-5,8,7);
  ctx.fillStyle=flash?'#c09090':'#c8a070';ctx.fillRect(12,-4,5,6);
  ctx.restore();
  drawWeaponOnPlayer(wk,flash);
  ctx.fillStyle=flash?'#ffcccc':'#c8a070';ctx.fillRect(-3,-18,6,9);
  ctx.fillStyle=flash?'#ffcccc':'#c8a070';ctx.beginPath();ctx.arc(0,-26,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=flash?'#88aa60':'#384f1c';ctx.beginPath();ctx.arc(0,-28,11.5,Math.PI,0);ctx.fill();ctx.fillRect(-11.5,-28,23,5);
  ctx.fillStyle=flash?'#70943a':'#2e4018';ctx.fillRect(-13.5,-23,27,3.5);ctx.beginPath();ctx.ellipse(0,-23,13.5,2,0,0,Math.PI);ctx.fill();
  if(!flash){
    ctx.fillStyle='rgba(22,34,8,0.55)';
    ctx.beginPath();ctx.ellipse(-5,-30,3,2,0.5,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(4,-29,2,2,-0.3,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle=flash?'#88aa60':'#2e3e18';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-11,-23);ctx.lineTo(-8,-18);ctx.stroke();
  ctx.beginPath();ctx.moveTo(11,-23);ctx.lineTo(8,-18);ctx.stroke();
  ctx.fillStyle='#1a0a04';
  ctx.beginPath();ctx.arc(-4,-26,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(4,-26,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.beginPath();ctx.arc(-3.5,-26.5,1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(4.5,-26.5,1,0,Math.PI*2);ctx.fill();
  ctx.restore();
  ctx.save();ctx.translate(p.x,p.y+bob);
  const tag=`🪖 Sdt ${soldierName}`;
  const tw=ctx.measureText(tag).width+22;
  ctx.fillStyle='rgba(0,0,0,0.65)';
  const tagW=Math.max(tw,90);
  ctx.fillRect(-tagW/2,-54,tagW,18);
  ctx.strokeStyle='rgba(60,120,30,0.4)';ctx.lineWidth=0.5;ctx.strokeRect(-tagW/2,-54,tagW,18);
  ctx.fillStyle='#60e0a0';ctx.font='bold 11px Rajdhani,sans-serif';ctx.textAlign='center';
  ctx.fillText(tag,0,-40);
  ctx.restore();
}
 
function drawWeaponOnPlayer(wk,flash){
  if(wk==='pistolet'){
    ctx.fillStyle=flash?'#9090a0':'#2e2e3e';ctx.fillRect(-2,-24,5,15);
    ctx.fillStyle=flash?'#7070a0':'#1e1e2e';ctx.fillRect(-3,-11,8,10);
    ctx.fillStyle='#111';ctx.fillRect(-1,-26,3,4);
  } else if(wk==='fusil'){
    ctx.fillStyle=flash?'#909090':'#1e1e1e';ctx.fillRect(-2.5,-34,6,26);
    ctx.fillStyle=flash?'#707060':'#2e2c1a';ctx.fillRect(-3.5,-14,8,18);
    ctx.fillStyle='#111';ctx.fillRect(-1.5,-36,4,5);
    ctx.fillStyle=flash?'#707060':'#252015';ctx.fillRect(-2,-6,5,8);
    ctx.fillStyle=flash?'#808080':'#333';ctx.fillRect(-1,-32,3,4);
  } else if(wk==='shotgun'){
    ctx.fillStyle=flash?'#705040':'#2e1808';ctx.fillRect(-4,-34,4,12);ctx.fillRect(1,-34,4,12);
    ctx.fillStyle=flash?'#806050':'#3e2810';ctx.fillRect(-5,-22,11,20);
    ctx.fillStyle='#111';ctx.fillRect(-4,-36,4,5);ctx.fillRect(1,-36,4,5);
  } else if(wk==='sniper'){
    ctx.fillStyle=flash?'#405050':'#101e1e';ctx.fillRect(-2,-40,5,34);
    ctx.fillStyle=flash?'#506060':'#1e3030';ctx.fillRect(-3,-16,7,20);
    ctx.fillStyle=flash?'#405050':'#0e1818';ctx.fillRect(-5,-42,10,8);
    ctx.fillStyle=flash?'rgba(80,160,160,0.4)':'rgba(40,180,180,0.3)';ctx.beginPath();ctx.arc(0,-38,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=flash?'#405050':'#1e3030';ctx.fillRect(-6,-12,3,6);ctx.fillRect(4,-12,3,6);
  }
}
 
function drawZombie(z){
  const angle=Math.atan2(G.player.y-z.y,G.player.x-z.x);
  const sw=Math.sin(z.armSwing)*0.45;
  const bodyBob=Math.sin(z.armSwing*0.7)*1.5;
  ctx.save();ctx.translate(z.x,z.y+bodyBob);ctx.rotate(angle+Math.PI/2);
  ctx.fillStyle='rgba(0,0,0,0.18)';ctx.beginPath();ctx.ellipse(2,12,12,6,0,0,Math.PI*2);ctx.fill();
  const legL=Math.sin(z.armSwing)*0.3;
  ctx.save();ctx.rotate(legL);
  ctx.fillStyle='#243018';ctx.fillRect(-7,6,7,20);
  ctx.fillStyle='#181a10';ctx.fillRect(-8,22,9,6);
  ctx.restore();
  ctx.save();ctx.rotate(-legL);
  ctx.fillStyle='#243018';ctx.fillRect(1,6,7,20);
  ctx.fillStyle='#181a10';ctx.fillRect(0,22,9,6);
  ctx.restore();
  ctx.fillStyle='#253018';ctx.beginPath();ctx.roundRect(-10,-8,20,20,3);ctx.fill();
  ctx.fillStyle='rgba(120,10,10,0.65)';ctx.fillRect(-3,-1,5,8);
  ctx.beginPath();ctx.ellipse(5,-3,3,4,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(-6,4,2,3,-0.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(10,14,8,0.4)';ctx.fillRect(-10,6,5,6);ctx.fillRect(6,8,4,4);
  ctx.save();ctx.rotate(-0.6+sw);
  ctx.fillStyle='#607038';ctx.fillRect(-20,-5,14,7);
  ctx.fillStyle='#506028';ctx.beginPath();ctx.arc(-20,0,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#252510';for(let c=-2;c<=2;c++) ctx.fillRect(-24+c*2,-2,2.5,9);
  ctx.restore();
  ctx.save();ctx.rotate(0.6-sw);
  ctx.fillStyle='#607038';ctx.fillRect(6,-5,14,7);
  ctx.fillStyle='#506028';ctx.beginPath();ctx.arc(20,0,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#252510';for(let c=-2;c<=2;c++) ctx.fillRect(17+c*2,-2,2.5,9);
  ctx.restore();
  ctx.fillStyle='#485820';ctx.fillRect(-4,-13,8,7);
  ctx.strokeStyle='rgba(100,30,30,0.6)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(-2,-13);ctx.lineTo(-2,-6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(2,-13);ctx.lineTo(2,-6);ctx.stroke();
  ctx.fillStyle='#5a6a28';ctx.beginPath();ctx.arc(0,-22,12,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(0,0,0,0.38)';
  ctx.beginPath();ctx.ellipse(-5,-22,4,5,0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(5,-22,4,5,-0.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(0,-18,3,2,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(130,20,20,0.5)';ctx.beginPath();ctx.arc(-8,-19,3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#cc0000';ctx.shadowColor='#ff1010';ctx.shadowBlur=10;
  ctx.beginPath();ctx.arc(-4,-24,4,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(4,-24,4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
  ctx.fillStyle='#ff4040';
  ctx.beginPath();ctx.arc(-4,-24,2,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(4,-24,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111005';ctx.fillRect(-7,-15,14,6);
  ctx.fillStyle='#d8d0b0';for(let t=0;t<5;t++) ctx.fillRect(-6+t*2.8,-15,2.2,4);
  ctx.fillStyle='#111005';ctx.fillRect(-1,-15,2.5,4);
  ctx.fillStyle='#151208';
  ctx.fillRect(-11,-33,5,12);ctx.fillRect(4,-34,4,10);ctx.fillRect(-3,-35,3,11);ctx.fillRect(8,-30,3,6);
  ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-14,-40,28,6);
  ctx.fillStyle=z.hp/z.maxHp>0.5?'#30b030':'#e02020';ctx.fillRect(-14,-40,28*(z.hp/z.maxHp),6);
  ctx.strokeStyle='rgba(0,0,0,0.5)';ctx.lineWidth=0.5;ctx.strokeRect(-14,-40,28,6);
  ctx.restore();
}
 
function drawCrosshair(){
  const mx=G.mouse.x, my=G.mouse.y;
  const CW=canvas.width, CH=canvas.height;
  const isSniper=G.weapon==='sniper';
  ctx.strokeStyle=isSniper?'rgba(80,210,210,0.85)':'rgba(255,70,70,0.85)';
  ctx.lineWidth=1.5;
  if(isSniper){
    ctx.globalAlpha=0.25;
    ctx.beginPath();ctx.moveTo(0,my);ctx.lineTo(CW,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,0);ctx.lineTo(mx,CH);ctx.stroke();
    ctx.globalAlpha=1;
    ctx.beginPath();ctx.arc(mx,my,26,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(mx,my,4,0,Math.PI*2);ctx.stroke();
    [0,Math.PI/2,Math.PI,Math.PI*1.5].forEach(a=>{
      ctx.beginPath();ctx.moveTo(mx+Math.cos(a)*20,my+Math.sin(a)*20);ctx.lineTo(mx+Math.cos(a)*32,my+Math.sin(a)*32);ctx.stroke();
    });
  } else {
    ctx.beginPath();ctx.moveTo(mx-15,my);ctx.lineTo(mx-5,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx+5,my);ctx.lineTo(mx+15,my);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,my-15);ctx.lineTo(mx,my-5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(mx,my+5);ctx.lineTo(mx,my+15);ctx.stroke();
    ctx.beginPath();ctx.arc(mx,my,5,0,Math.PI*2);ctx.stroke();
  }
}
 
function loop(now){
  if(!G||!G.running) return;
  const dt=Math.min((now-G.lastTime)/16.67,3);
  G.lastTime=now;
  update(dt);
  drawScene();
  animId=requestAnimationFrame(loop);
}
 
showScreen('screen-name');
buildWeaponGrid();
 