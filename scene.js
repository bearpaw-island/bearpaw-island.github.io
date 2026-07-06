// ==================== 建筑场景系统 ====================
var SceneGames = {};
var currentScene = null;
var SCENE_CD = {}; // cooldowns

function sceneCd(id) {
  if (SCENE_CD[id] && Date.now() < SCENE_CD[id]) {
    return Math.ceil((SCENE_CD[id] - Date.now()) / 1000);
  }
  return 0;
}
function setSceneCd(id) {
  SCENE_CD[id] = Date.now() + 60000; // 60s cooldown
}

function openScene(bid) {
  var b = BD.find(function(x) { return x.id === bid; });
  if (!b) return;
  currentScene = bid;
  var lv = S.lvs[bid] || 0;
  if (lv === 0) {
    // 未建造，显示建造提示
    showBldPopup(bid);
    return;
  }
  // 隐藏主界面
  document.getElementById('scroll').style.display = 'none';
  document.getElementById('bottom').style.display = 'none';
  document.getElementById('top').style.display = 'none';
  document.getElementById('rate').style.display = 'none';
  
  // 生成场景面板
  var panel = document.getElementById('scene-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'scene-panel';
    document.getElementById('game').appendChild(panel);
  }
  
  var inc = lv > 0 ? b.bi + b.ig * (lv - 1) : 0;
  var isMax = lv >= b.ml;
  var cd = sceneCd(bid);
  
  panel.innerHTML = 
    '<div class="bscene show" id="bscene-'+bid+'">' +
    '<div class="bscene-hdr">' +
      '<button class="back" id="scn-back">← 返回</button>' +
      '<span class="btitle">' + (ICONS[bid] || '🏠') + ' ' + b.n + ' Lv.' + lv + '/' + b.ml + '</span>' +
    '</div>' +
    '<div class="bscene-bg" id="scn-bg"></div>' +
    '<div class="bscene-stats">' +
      '<div class="ss"><span class="sv gold">' + fmt(inc) + '</span><br>金币/秒</div>' +
      '<div class="ss"><span class="sv green">' + fmt(cost(bid)) + '</span><br>升级花费</div>' +
      '<div class="ss"><span class="sv" style="color:#cc8">Lv.' + lv + '</span><br>当前等级</div>' +
    '</div>' +
    '<div class="bscene-game" id="scn-game"></div>' +
    '<div class="bscene-upgrade">' +
      '<span class="uinfo">升级到 Lv.' + (lv + 1) + ' → ' + fmt(b.bi + b.ig * lv) + '/秒</span>' +
      (isMax ? '<button class="ubtn max" disabled>已满级</button>' : '<button class="ubtn" id="scn-upgrade">升级 ' + fmt(cost(bid)) + '</button>') +
    '</div>' +
    '</div>';
  panel.style.display = 'block';
  
  // 渲染场景背景
  renderSceneBg(bid);
  // 渲染小游戏
  renderMinigame(bid);
  
  // 事件监听
  document.getElementById('scn-back').onclick = closeScene;
  var upgBtn = document.getElementById('scn-upgrade');
  if (upgBtn) {
    upgBtn.onclick = function() {
      if (doBuild(bid)) {
        closeScene();
        setTimeout(function() { openScene(bid); }, 100);
      }
    };
  }
}

function closeScene() {
  currentScene = null;
  var panel = document.getElementById('scene-panel');
  if (panel) panel.style.display = 'none';
  document.getElementById('scroll').style.display = '';
  document.getElementById('bottom').style.display = '';
  document.getElementById('top').style.display = '';
  document.getElementById('rate').style.display = '';
  switchTab('home');
}

function renderSceneBg(bid) {
  var bg = document.getElementById('scn-bg');
  var bgMap = {
    tree: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🌳\u00a0\u00a0🌳\u00a0\u00a0🌳</div><div style="text-align:center;font-size:14px;color:#8a8">🍎 果树茂盛，果子挂满枝头</div>',
    mine: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">⛰️\u00a0\u00a0💎\u00a0\u00a0⛰️</div><div style="text-align:center;font-size:14px;color:#8a8">⛏️ 深邃矿洞，宝石闪烁</div>',
    farm: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🌾\u00a0🌻\u00a0🌾</div><div style="text-align:center;font-size:14px;color:#8a8">☀️ 金色麦田，阳光灿烂</div>',
    fish: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🌊\u00a0🐟\u00a0🌊</div><div style="text-align:center;font-size:14px;color:#8a8">🎣 碧海蓝天，鱼儿欢跃</div>',
    mill: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🌾\u00a0🏠\u00a0🌾</div><div style="text-align:center;font-size:14px;color:#8a8">💨 风车转动，麦香四溢</div>',
    bar: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🏮\u00a0🍺\u00a0🏮</div><div style="text-align:center;font-size:14px;color:#8a8">🎵 酒馆热闹，觥筹交错</div>',
    temple: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🏛️\u00a0✨\u00a0🏛️</div><div style="text-align:center;font-size:14px;color:#8a8">🙏 神殿庄严，灵气萦绕</div>',
    forge: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🔥\u00a0⚒️\u00a0🔥</div><div style="text-align:center;font-size:14px;color:#8a8">🔨 炉火正旺，铁砧待铸</div>',
    wizard: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🔮\u00a0📜\u00a0🔮</div><div style="text-align:center;font-size:14px;color:#8a8">⚡ 魔法涌动，奥术闪烁</div>',
    market: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🏪\u00a0💱\u00a0🏬</div><div style="text-align:center;font-size:14px;color:#8a8">📊 市场繁忙，机会无限</div>',
    dragon: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🌋\u00a0🐉\u00a0🔥</div><div style="text-align:center;font-size:14px;color:#8a8">🐉 巨龙盘踞，金币如山</div>',
    castle: '<div style="font-size:48px;text-align:center;width:100%;padding:20px 0">🏰\u00a0👑\u00a0🏰</div><div style="text-align:center;font-size:14px;color:#8a8">🏆 熊爪城堡，荣耀巅峰</div>'
  };
  if (bg) bg.innerHTML = (bgMap[bid] || '<div style="color:#aaa;text-align:center;padding-top:60px">建设中...</div>');
}

// ==================== 渲染小游戏 ====================
function renderMinigame(bid) {
  var area = document.getElementById('scn-game');
  if (!area) return;
  var cd = sceneCd(bid);
  
  var games = {
    tree: renderTreeGame,
    mine: renderMineGame,
    farm: renderFarmGame,
    fish: renderFishGame,
    mill: renderMillGame,
    bar: renderBarGame,
    temple: renderTempleGame,
    forge: renderForgeGame,
    wizard: renderWizardGame,
    market: renderMarketGame,
    dragon: renderDragonGame,
    castle: renderCastleGame
  };
  
  if (games[bid]) {
    games[bid](area, bid, cd);
  } else {
    area.innerHTML = '<div class="gm-title">建设中</div><div class="gm-info">该建筑的小游戏正在开发中...</div>';
  }
}
// ==================== 1. 浆果树 - 摘果子 ====================
function renderTreeGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🍎 摘果子</div>' +
    '<div class="gm-info">点击掉落的水果！越多越好！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" id="gm-start" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🎯 开始 (10秒)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, timeLeft = 10, fruits = ['🍎','🍊','🍋','🍐','🍇','🍑'], running = true;
    var el = document.getElementById('scn-bg');
    el.style.position = 'relative';
    el.style.pointerEvents = 'auto';
    
    area.innerHTML = 
      '<div class="gm-title">🍎 摘果子</div>' +
      '<div style="display:flex;justify-content:space-between;padding:0 8px">' +
      '<span style="color:#ffd700;font-weight:700;font-size:16px">🍎 x<span id="gmscore">0</span></span>' +
      '<span style="color:#e55;font-weight:700;font-size:16px" id="gmtimer">⏱ 10s</span></div>';
    
    var timerInt = setInterval(function() {
      timeLeft--;
      var t = document.getElementById('gmtimer');
      if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(timerInt); running = false; endTreeGame(el, score, lv); }
    }, 1000);
    
    function dropFruit() {
      if (!running) return;
      var f = document.createElement('div');
      f.className = 'tree-fruit';
      f.textContent = fruits[Math.floor(Math.random() * fruits.length)];
      f.style.left = (10 + Math.random() * (el.clientWidth - 50)) + 'px';
      f.style.top = '-40px';
      f.onclick = function(e) { e.stopPropagation(); score++; f.remove(); document.getElementById('gmscore').textContent = score; sfxClick(); };
      el.appendChild(f);
      setTimeout(function() { if (f.parentNode) f.remove(); }, 2600);
      if (running) setTimeout(dropFruit, 400 + Math.random() * 500);
    }
    dropFruit();
  };
}

function endTreeGame(el, score, lv) {
  el.style.pointerEvents = 'none';
  el.querySelectorAll('.tree-fruit').forEach(function(f) { f.remove(); });
  var gold = score * lv * 50;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🍎 x' + score + '</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<div class="rbest">Lv.'+lv+' 果树加成</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次 (60s冷却)</button></div>';
  var cd = sceneCd('tree');
  var btn = document.getElementById('gm-restart');
  if (btn) btn.textContent = cd > 0 ? '冷却中 ' + cd + 's' : '再来一次';
  if (btn && cd <= 0) btn.onclick = function() { renderMinigame('tree'); };
}

// ==================== 2. 矿场 - 挖矿 ====================
function renderMineGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">💎 挖矿</div>' +
    '<div class="gm-info">点击出现的矿石化开！有概率挖到宝石！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">⚒️ 开始挖矿 (10秒)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, gems = 0, timeLeft = 10, running = true;
    var el = document.getElementById('scn-bg');
    el.style.position = 'relative';
    el.style.pointerEvents = 'auto';
    
    area.innerHTML = 
      '<div class="gm-title">💎 挖矿</div>' +
      '<div style="display:flex;justify-content:space-around;padding:0 8px">' +
      '<span style="color:#ccc;font-weight:700;font-size:14px">⛏️ <span id="gmscore">0</span></span>' +
      '<span style="color:#6cf;font-weight:700;font-size:14px">💠 <span id="gmgem">0</span></span>' +
      '<span style="color:#e55;font-weight:700;font-size:14px" id="gmtimer">⏱ 10s</span></div>';
    
    var timerInt = setInterval(function() {
      timeLeft--;
      var t = document.getElementById('gmtimer');
      if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(timerInt); running = false; endMineGame(el, score, gems, lv); }
    }, 1000);
    
    function spawnRock() {
      if (!running) return;
      var rock = document.createElement('div');
      rock.className = 'mine-rock';
      var isGem = Math.random() < 0.15;
      rock.textContent = isGem ? '💎' : '🪨';
      rock.style.left = (10 + Math.random() * (el.clientWidth - 50)) + 'px';
      rock.style.top = (15 + Math.random() * (el.clientHeight - 80)) + 'px';
      rock.onclick = function(e) { 
        e.stopPropagation();
        if (isGem) { gems++; var ge = document.getElementById('gmgem'); if (ge) ge.textContent = gems; }
        else { score++; var se = document.getElementById('gmscore'); if (se) se.textContent = score; }
        rock.style.transform = 'scale(0)'; rock.style.transition = 'transform .2s';
        setTimeout(function() { rock.remove(); }, 200);
        if (isGem) sfxBuild(); else sfxHit();
      };
      el.appendChild(rock);
      setTimeout(function() { if (rock.parentNode) rock.remove(); }, 3000);
      if (running) setTimeout(spawnRock, 500 + Math.random() * 800);
    }
    spawnRock();
  };
}

function endMineGame(el, score, gems, lv) {
  el.style.pointerEvents = 'none';
  el.querySelectorAll('.mine-rock').forEach(function(r) { r.remove(); });
  var gold = score * lv * 80 + gems * lv * 500;
  S.gold += gold; S.gems += gems; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">⛏️ x' + score + ' + 💠 x' + gems + '</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('mine');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('mine'); }; }
}

// ==================== 3. 农田 - 浇水 ====================
function renderFarmGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">💧 浇水</div>' +
    '<div class="gm-info">不停点击保持水位在绿色区域！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">💧 开始浇水 (15秒)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var water = 50, timeLeft = 15, score = 0, running = true;
    var targetZone = 40 + Math.random() * 20; // green zone center
    
    area.innerHTML = 
      '<div class="gm-title">💧 浇水</div>' +
      '<div style="display:flex;justify-content:space-between;padding:0 8px;margin-bottom:4px">' +
      '<span style="color:#6cf;font-weight:700;font-size:14px">💧 <span id="gmscore">0</span></span>' +
      '<span style="color:#e55;font-weight:700;font-size:14px" id="gmtimer">⏱ 15s</span></div>' +
      '<div class="water-bar-bg">' +
      '<div class="water-bar-fill" id="waterfill" style="width:50%"></div>' +
      '</div>' +
      '<div style="position:relative;height:30px">' +
      '<div class="water-zone" id="waterzone" style="left:'+(targetZone/100*330)+'px;top:3px"></div>' +
      '</div>' +
      '<div style="text-align:center;font-size:11px;color:#888;margin-top:4px">绿色区域 = 成功 | 快速点击保持水位</div>' +
      '<div style="text-align:center;margin-top:6px">' +
      '<button class="game-btn play" id="gm-tap" style="width:120px;height:50px;font-size:18px">💧 浇水！</button></div>';
    
    var timerInt = setInterval(function() {
      timeLeft--;
      var t = document.getElementById('gmtimer');
      if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(timerInt); running = false; endFarmGame(score, lv); }
    }, 1000);
    
    // water decays over time
    var decayInt = setInterval(function() {
      if (!running) { clearInterval(decayInt); return; }
      water -= 3;
      if (water < 0) water = 0;
      if (water > 100) water = 100;
      var wf = document.getElementById('waterfill');
      if (wf) wf.style.width = water + '%';
    }, 200);
    
    document.getElementById('gm-tap').onclick = function() {
      if (!running) return;
      water = Math.min(100, water + 12);
      var wf = document.getElementById('waterfill');
      if (wf) wf.style.width = water + '%';
      if (Math.abs(water - targetZone) < 15) {
        score++;
        sfxGold();
        document.getElementById('gmscore').textContent = score;
        targetZone = 20 + Math.random() * 60;
        var wz = document.getElementById('waterzone');
        if (wz) wz.style.left = (targetZone / 100 * 330) + 'px';
      } else {
        sfxClick();
      }
    };
  };
}

function endFarmGame(score, lv) {
  var gold = score * lv * 60;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">💧 x' + score + '</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('farm');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('farm'); }; }
}

// ==================== 4. 渔场 - 钓鱼 ====================
function renderFishGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🎣 钓鱼</div>' +
    '<div class="gm-info">鱼游过钓钩标记时点击收竿！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🎣 开始钓鱼 (5次)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var tries = 5, score = 0, running = true, fishPos = 0;
    var el = document.getElementById('scn-bg');
    
    area.innerHTML = 
      '<div class="gm-title">🎣 钓鱼</div>' +
      '<div style="text-align:center;margin-bottom:6px">' +
      '<span style="color:#ffd700;font-weight:700">🎣 <span id="gmscore">0</span>/5</span></div>' +
      '<div style="position:relative;height:80px;background:linear-gradient(180deg,rgba(10,30,60,.5),rgba(5,15,30,.5));border-radius:10px;overflow:hidden">' +
      '<div id="fishswim" style="font-size:24px;position:absolute;top:50%;transform:translateY(-50%);left:-30px;transition:left .8s linear">🐟</div>' +
      '<div style="position:absolute;left:50%;top:0;bottom:0;width:3px;background:#6cf;transform:translateX(-50%);box-shadow:0 0 6px #6cf"></div>' +
      '</div>' +
      '<div style="text-align:center;margin-top:8px">' +
      '<button class="game-btn play" id="gm-cast" style="width:120px;height:45px">🎣 收竿！</button></div>';
    
    function moveFish() {
      if (!running) return;
      fishPos = 10 + Math.random() * 70;
      var f = document.getElementById('fishswim');
      if (f) f.style.left = fishPos + '%';
    }
    moveFish();
    
    document.getElementById('gm-cast').onclick = function() {
      if (!running) return;
      if (Math.abs(fishPos - 50) < 10) {
        score++; sfxBuild();
        var s = document.getElementById('gmscore'); if (s) s.textContent = score + '/5';
        flyText('🎣 钓到了！(' + score + '/5)');
      } else {
        sfxHit();
        flyText('😅 差一点...');
      }
      tries--;
      if (tries <= 0) { running = false; endFishGame(score, lv); return; }
      moveFish();
    };
  };
}

function endFishGame(score, lv) {
  var gold = score * lv * 200;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🎣 ' + score + '/5</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('fish');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('fish'); }; }
}

// ==================== 5. 磨坊 - 磨面 ====================
function renderMillGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">💨 磨面</div>' +
    '<div class="gm-info">快速点击让风车转起来！比谁转得多！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">💨 开始磨面 (8秒)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var clicks = 0, timeLeft = 8, running = true;
    
    area.innerHTML = 
      '<div class="gm-title">💨 磨面</div>' +
      '<div style="text-align:center;font-size:64px;margin:10px 0" id="millwheel">💨</div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700;font-size:18px">⚙️ <span id="gmscore">0</span> 转</div>' +
      '<div style="text-align:center;color:#e55;font-weight:700;margin-top:4px" id="gmtimer">⏱ 8s</div>' +
      '<div style="text-align:center;margin-top:10px">' +
      '<button class="game-btn play" id="gm-tap" style="width:160px;height:60px;font-size:22px">👆 快按！</button></div>';
    
    var deg = 0;
    document.getElementById('gm-tap').onclick = function() {
      if (!running) return;
      clicks++;
      deg += 36;
      var w = document.getElementById('millwheel');
      if (w) w.style.transform = 'rotate(' + deg + 'deg)';
      var s = document.getElementById('gmscore'); if (s) s.textContent = Math.floor(clicks / 5);
      sfxClick();
    };
    
    var timerInt = setInterval(function() {
      timeLeft--;
      var t = document.getElementById('gmtimer'); if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(timerInt); running = false; endMillGame(clicks, lv); }
    }, 1000);
  };
}

function endMillGame(clicks, lv) {
  var gold = Math.floor(clicks / 5) * lv * 40;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">⚙️ ' + Math.floor(clicks/5) + ' 转</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<div class="rbest">点击 ' + clicks + ' 次</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('mill');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('mill'); }; }
}

// ==================== 6. 酒馆 - 招待客人 ====================
function renderBarGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🍺 招待客人</div>' +
    '<div class="gm-info">顾客来了！快速选择正确的食物给他们</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🍺 接待 (8位)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, total = 8, running = true;
    var menu = [
      {order: '🍕', options: ['🍕','🍔','🥗'], correct: 0},
      {order: '🍜', options: ['🍝','🍜','🍚'], correct: 1},
      {order: '🍰', options: ['🧁','🍩','🍰'], correct: 2},
      {order: '🍺', options: ['🍷','🍺','☕'], correct: 1},
      {order: '🥩', options: ['🍗','🥩','🧀'], correct: 1},
      {order: '🍣', options: ['🍣','🍤','🥟'], correct: 0},
      {order: '🍦', options: ['🍨','🍰','🍦'], correct: 2},
      {order: '🌮', options: ['🥙','🌮','🥪'], correct: 1},
    ];
    var currentRound = 0, orderData = null, startTime = 0;
    
    function showNext() {
      if (currentRound >= total || !running) { endBarGame(score, lv); return; }
      orderData = menu[Math.floor(Math.random() * menu.length)];
      startTime = Date.now();
      
      area.innerHTML = 
        '<div class="gm-title">🍺 顾客 #' + (currentRound + 1) + '/8</div>' +
        '<div class="customer-order">' + orderData.order + ' 这位客人想要这个！</div>' +
        '<div style="font-size:11px;color:#888;text-align:center;margin-bottom:8px">⏱ 3秒内回答！</div>' +
        '<div class="btn-2col" style="flex-wrap:wrap">' +
        '<button class="game-btn go gm-choice" data-idx="0" style="font-size:28px;min-width:60px">' + orderData.options[0] + '</button>' +
        '<button class="game-btn go gm-choice" data-idx="1" style="font-size:28px;min-width:60px">' + orderData.options[1] + '</button>' +
        '<button class="game-btn go gm-choice" data-idx="2" style="font-size:28px;min-width:60px">' + orderData.options[2] + '</button></div>' +
        '<div style="text-align:center;margin-top:6px;color:#888;font-size:12px">✅ <span id="gmscore">' + score + '</span>/' + total + '</div>';
    }
    showNext();
    
    area.addEventListener('click', function(e) {
      var btn = e.target.closest('.gm-choice');
      if (!btn || !running) return;
      var choice = parseInt(btn.dataset.idx);
      if (choice === orderData.correct && Date.now() - startTime < 3000) {
        score++; sfxGold();
      } else {
        sfxHit();
      }
      currentRound++;
      showNext();
    });
  };
}

function endBarGame(score, lv) {
  var gold = score * lv * 120;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🍺 ' + score + '/8</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('bar');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('bar'); }; }
}

// ==================== 7. 神殿 - 祈福 ====================
function renderTempleGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🙏 祈福</div>' +
    '<div class="gm-info">按住按钮蓄力，在满能量时松手！3轮</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🙏 开始祈福</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var round = 0, totalScore = 0, power = 0, charging = false, chargeInt = null, running = true;
    
    function startRound() {
      if (round >= 3 || !running) { endTempleGame(totalScore, lv); return; }
      round++;
      power = 0;
      area.innerHTML = 
        '<div class="gm-title">🙏 祈福 (' + round + '/3)</div>' +
        '<div style="text-align:center;font-size:40px;margin:4px 0">✨</div>' +
        '<div class="pray-bar-bg"><div class="pray-bar-fill" id="prayfill" style="width:0%"></div></div>' +
        '<div style="text-align:center;color:#ffd700;font-weight:700;font-size:14px">⚡ <span id="praypower">0</span>%</div>' +
        '<div style="text-align:center;margin-top:10px">' +
        '<button class="game-btn play" id="gm-hold" style="width:120px;height:50px;font-size:16px">按住蓄力</button></div>';
    }
    startRound();
    
    area.addEventListener('pointerdown', function(e) {
      var btn = e.target.closest('#gm-hold');
      if (!btn || !running) return;
      charging = true;
      chargeInt = setInterval(function() {
        power += 2;
        if (power > 100) power = 0;
        var pf = document.getElementById('prayfill'); if (pf) pf.style.width = power + '%';
        var pp = document.getElementById('praypower'); if (pp) pp.textContent = power;
      }, 40);
    });
    
    area.addEventListener('pointerup', function() {
      if (!charging || !running) return;
      charging = false; clearInterval(chargeInt);
      if (power >= 85 && power <= 100) {
        totalScore += 2; sfxGold(); flyText('💫 完美！');
      } else if (power >= 65 && power < 85) {
        totalScore += 1; sfxBuild(); flyText('✨ 不错！');
      } else {
        sfxHit(); flyText('😣 偏了...');
      }
      startRound();
    });
  };
}

function endTempleGame(score, lv) {
  var gold = score * lv * 150;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">✨ ' + Math.min(score, 6) + '/6</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('temple');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('temple'); }; }
}

// ==================== 8. 铁匠铺 - 打铁 ====================
function renderForgeGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🔨 打铁</div>' +
    '<div class="gm-info">锤子摆到最右侧时点击！5次</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🔨 开始打铁</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var hits = 5, score = 0, running = true, hammerPos = 0, swinging = false;
    
    area.innerHTML = 
      '<div class="gm-title">🔨 打铁 ('+hits+'次)</div>' +
      '<div style="text-align:center;font-size:40px;margin:8px 0">⚒️</div>' +
      '<div style="position:relative;height:40px;background:#222;border-radius:20px;margin:10px 8px;overflow:hidden">' +
      '<div class="hammer-swing" id="hammer" style="right:90px;top:15px;width:80px;height:8px;background:linear-gradient(90deg,#999,#ddd);border-radius:4px;position:absolute;transition:right .8s cubic-bezier(.3,.7,.7,.3)"></div>' +
      '<div style="position:absolute;right:5px;top:0;bottom:0;width:30px;background:rgba(100,200,100,.3);border-radius:0 20px 20px 0" title="击中区域"></div>' +
      '</div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700" id="gmscore">✅ 0/'+hits+'</div>' +
      '<div style="text-align:center;margin-top:8px">' +
      '<button class="game-btn play" id="gm-hit" style="width:100px;height:40px">🔨 砸！</button></div>';
    
    function swing() {
      if (!running) return;
      var hammer = document.getElementById('hammer');
      if (hammer) hammer.style.right = '80px';
      swinging = true;
      setTimeout(function() {
        if (!running) return;
        swinging = false;
        var hammer2 = document.getElementById('hammer');
        if (hammer2) hammer2.style.right = '5px'; // target zone
      }, 600);
    }
    swing();
    
    var swingInt = setInterval(function() {
      if (!running) { clearInterval(swingInt); return; }
      swing();
    }, 1800);
    
    document.getElementById('gm-hit').onclick = function() {
      if (!running) return;
      var hammer = document.getElementById('hammer');
      var rightVal = hammer ? parseFloat(hammer.style.right) : 100;
      if (rightVal < 20 && rightVal > 0) {
        score++; sfxBuild();
      } else {
        sfxHit();
      }
      var s = document.getElementById('gmscore'); if (s) s.textContent = '✅ ' + Math.min(score, hits) + '/' + hits;
      hits--;
      if (hits <= 0) { clearInterval(swingInt); running = false; endForgeGame(score, lv); }
    };
  };
}

function endForgeGame(score, lv) {
  var gold = score * lv * 100;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🔨 ' + score + '/5</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('forge');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('forge'); }; }
}

// ==================== 9. 法师塔 - 施法 ====================
function renderWizardGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🔮 施法</div>' +
    '<div class="gm-info">按照数字顺序点击魔法阵的节点！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🔮 开始施法 (3轮)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var round = 0, maxRound = 3, score = 0, running = true;
    var patterns = [
      { dots: [{x:25,y:30,n:1},{x:50,y:20,n:2},{x:75,y:30,n:3}], name:'火球术' },
      { dots: [{x:20,y:20,n:1},{x:80,y:20,n:2},{x:80,y:60,n:3},{x:20,y:60,n:4}], name:'冰霜箭' },
      { dots: [{x:50,y:15,n:1},{x:25,y:50,n:2},{x:75,y:50,n:3},{x:50,y:70,n:4}], name:'雷电链' },
    ];
    var currentPattern = null, nextDotIdx = 1, startTime = 0;
    
    function nextRound() {
      if (round >= maxRound || !running) { endWizardGame(score, lv); return; }
      round++;
      currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
      nextDotIdx = 1;
      startTime = Date.now();
      
      var dotsHtml = currentPattern.dots.map(function(d) {
        return '<div class="spell-circle" data-n="'+d.n+'" style="left:'+d.x+'%;top:'+d.y+'%"></div>';
      }).join('');
      
      area.innerHTML = 
        '<div class="gm-title">🔮 ' + currentPattern.name + ' (' + round + '/' + maxRound + ')</div>' +
        '<div style="position:relative;height:180px;width:100%;background:rgba(20,0,40,.4);border-radius:12px;margin:0 auto">' +
        dotsHtml +
        '</div>' +
        '<div style="text-align:center;color:#888;font-size:11px;margin-top:4px">按数字顺序点击魔法阵</div>' +
        '<div style="text-align:center;color:#ffd700;font-weight:700;font-size:14px">✅ <span id="gmscore">' + score + '</span></div>';
    }
    nextRound();
    
    area.addEventListener('click', function(e) {
      var dot = e.target.closest('.spell-circle');
      if (!dot || !running) return;
      var n = parseInt(dot.dataset.n);
      if (n === nextDotIdx) {
        nextDotIdx++;
        dot.style.background = 'rgba(150,255,150,.3)';
        dot.style.borderColor = '#8f8';
        sfxClick();
        if (nextDotIdx > currentPattern.dots.length) {
          score++; sfxGold();
          flyText('🔮 ' + currentPattern.name + ' 施放成功！');
          nextRound();
        }
      } else {
        sfxHit();
      }
    });
  };
}

function endWizardGame(score, lv) {
  var gold = score * lv * 180;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🔮 ' + score + '/3</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('wizard');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('wizard'); }; }
}

// ==================== 10. 贸易中心 - 低买高卖 ====================
function renderMarketGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">📊 低买高卖</div>' +
    '<div class="gm-info">价格波动时判断买卖时机！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">📊 开始贸易</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, rounds = 6, running = true, currentPrice = 50, trend = 0;
    
    function nextRound() {
      if (rounds <= 0 || !running) { endMarketGame(score, lv); return; }
      rounds--;
      
      // random price movement
      trend = (Math.random() - 0.5) * 40;
      currentPrice = Math.max(10, Math.min(90, 50 + trend));
      var nextPrice = Math.max(10, Math.min(90, currentPrice + (Math.random() - 0.5) * 30));
      var isUp = nextPrice > currentPrice;
      var color = isUp ? '#5b8' : '#e55';
      
      area.innerHTML = 
        '<div class="gm-title">📊 贸易 (' + (6 - rounds) + '/6)</div>' +
        '<div style="text-align:center;font-size:40px;margin:8px 0">💱</div>' +
        '<div style="text-align:center;font-size:24px;font-weight:700;color:'+color+'" id="tradePrice">💰 ' + Math.floor(currentPrice) + '</div>' +
        '<div style="text-align:center;color:#888;font-size:11px;margin:2px 0">价格持续波动</div>' +
        '<div class="btn-2col">' +
        '<button class="game-btn go gmtrade" data-act="buy" style="font-size:18px;padding:14px">📈 买入</button>' +
        '<button class="game-btn no gmtrade" data-act="sell" style="font-size:18px;padding:14px">📉 卖出</button></div>' +
        '<div style="text-align:center;color:#ffd700;margin-top:4px">✅ <span id="gmscore">' + score + '</span></div>';
    }
    nextRound();
    
    area.addEventListener('click', function(e) {
      var btn = e.target.closest('.gmtrade');
      if (!btn || !running) return;
      var act = btn.dataset.act;
      // simple: buy if price < 40, sell if price > 60
      if ((act === 'buy' && currentPrice < 40) || (act === 'sell' && currentPrice > 60)) {
        score++; sfxGold();
      } else {
        sfxHit();
      }
      nextRound();
    });
  };
}

function endMarketGame(score, lv) {
  var gold = score * lv * 160;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">📊 ' + score + '/6</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('market');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('market'); }; }
}

// ==================== 11. 龙巢 - 喂龙 ====================
function renderDragonGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🐉 喂龙</div>' +
    '<div class="gm-info">把食物拖到龙嘴里！龙嘴会一开一合</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🐉 喂龙 (8个)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, total = 8, running = true, mouthOpen = false;
    
    var el = document.getElementById('scn-bg');
    el.style.position = 'relative';
    
    area.innerHTML = 
      '<div class="gm-title">🐉 喂龙</div>' +
      '<div style="font-size:40px;text-align:center;margin:4px 0">🐉</div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700">🍖 <span id="gmscore">0</span>/8</div>' +
      '<div style="text-align:center;margin-top:6px;position:relative;height:50px">' +
      '<div id="dragonMouth" style="font-size:28px;display:inline-block;transition:transform .3s">👄</div>' +
      '</div>' +
      '<div style="text-align:center;margin-top:4px"><span style="font-size:10px;color:#888">张嘴时点击喂食！</span></div>';
    
    function toggleMouth() {
      if (!running) return;
      mouthOpen = !mouthOpen;
      var dm = document.getElementById('dragonMouth');
      if (dm) dm.style.transform = mouthOpen ? 'scaleY(1.6)' : 'scaleY(1)';
      setTimeout(toggleMouth, 600 + Math.random() * 1000);
    }
    toggleMouth();
    
    area.addEventListener('click', function(e) {
      var mouth = e.target.closest('#dragonMouth');
      if (!mouth || !running) return;
      if (mouthOpen) {
        score++; sfxGold();
        var s = document.getElementById('gmscore'); if (s) s.textContent = score + '/8';
        flyText('🍖 好吃！');
        if (score >= total) { running = false; endDragonGame(score, lv); }
      } else {
        sfxHit(); flyText('💢 嘴没张开！');
      }
    });
  };
}

function endDragonGame(score, lv) {
  var gold = score * lv * 250;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🐉 ' + score + '/8</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('dragon');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('dragon'); }; }
}

// ==================== 12. 城堡 - 宝库老虎机 ====================
function renderCastleGame(area, bid, cd) {
  var lv = S.lvs[bid] || 1;
  area.innerHTML = 
    '<div class="gm-title">🎰 宝库转盘</div>' +
    '<div class="gm-info">三个图标相同 = 大奖！</div>' +
    (cd > 0 ? '<div style="text-align:center;color:#e55;font-size:12px">⏳ 冷却中 '+cd+'秒</div>' +
    '<div style="text-align:center;margin-top:8px"><button class="game-btn go" disabled>冷却中...</button></div>' :
    '<div style="text-align:center;margin-top:8px"><button class="game-btn play" id="gm-start">🎰 开始转动 (3次)</button></div>');
  
  if (cd > 0) return;
  
  document.getElementById('gm-start').onclick = function() {
    setSceneCd(bid);
    var spinsLeft = 3, score = 0, running = true;
    
    function nextSpin() {
      if (spinsLeft <= 0 || !running) { endCastleGame(score, lv); return; }
      spinsLeft--;
      
      var icons = ['💎','👑','💰','🏆','⭐','🎁'];
      var reel1 = icons[Math.floor(Math.random() * icons.length)];
      var reel2 = icons[Math.floor(Math.random() * icons.length)];
      var reel3 = icons[Math.floor(Math.random() * icons.length)];
      
      area.innerHTML = 
        '<div class="gm-title">🎰 宝库 (' + (3 - spinsLeft) + '/3)</div>' +
        '<div style="display:flex;justify-content:center;gap:8px;margin:12px 0">' +
        '<div class="slot-reel"><div id="r1">'+reel1+'</div></div>' +
        '<div class="slot-reel"><div id="r2">'+reel2+'</div></div>' +
        '<div class="slot-reel"><div id="r3">'+reel3+'</div></div>' +
        '</div>' +
        '<div style="text-align:center;color:#ffd700;font-weight:700">🍀 得分: <span id="gmscore">' + score + '</span></div>' +
        '<div style="text-align:center;margin-top:8px">' +
        '<button class="game-btn play" id="gm-spin">🎰 转动！ (' + (spinsLeft + 1) + '次)</button></div>';
      
      document.getElementById('gm-spin').onclick = function() {
        if (!running) return;
        // check match
        if (reel1 === reel2 && reel2 === reel3) {
          score += 3; sfxWin(); flyText('🎉 JACKPOT！三连！');
        } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
          score += 1; sfxGold(); flyText('✨ 一对！');
        } else {
          sfxHit(); flyText('😕 没中...');
        }
        nextSpin();
      };
    }
    nextSpin();
  };
}

function endCastleGame(score, lv) {
  var gold = score * lv * 300;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var area = document.getElementById('scn-game');
  area.innerHTML = 
    '<div class="result-block">' +
    '<div class="rscore">🎰 ' + score + ' 分</div>' +
    '<div class="rgold">+'+fmt(gold)+' 💰</div>' +
    '<button class="game-btn play" style="margin-top:10px" id="gm-restart">再来一次</button></div>';
  var cd = sceneCd('castle');
  var btn = document.getElementById('gm-restart');
  if (btn) { btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次'; if (cd <= 0) btn.onclick = function() { renderMinigame('castle'); }; }
}
