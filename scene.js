// ==================== 建筑场景系统 V2 ====================
var SceneGames = {};
var currentScene = null;
var SCENE_CD = {};

function sceneCd(id) {
  if (SCENE_CD[id] && Date.now() < SCENE_CD[id]) return Math.ceil((SCENE_CD[id] - Date.now()) / 1000);
  return 0;
}
function setSceneCd(id) { SCENE_CD[id] = Date.now() + 60000; }

function openScene(bid) {
  var b = BD.find(function(x) { return x.id === bid; });
  if (!b) return;
  currentScene = bid;
  var lv = S.lvs[bid] || 0;
  if (lv === 0) { showBldPopup(bid); return; }

  document.getElementById('scroll').style.display = 'none';
  document.getElementById('bottom').style.display = 'none';
  document.getElementById('top').style.display = 'none';
  document.getElementById('rate').style.display = 'none';

  var panel = document.getElementById('scene-panel');
  if (!panel) { panel = document.createElement('div'); panel.id = 'scene-panel'; document.getElementById('game').appendChild(panel); }

  var inc = b.bi + b.ig * (lv - 1);
  var isMax = lv >= b.ml;

  panel.innerHTML =
    '<div class="bscene show" id="scn-root">' +
    '<div class="bscene-hdr">' +
      '<button class="back" id="scn-back">← 返回</button>' +
      '<span class="btitle">' + (ICONS[bid] || '') + ' ' + b.n + ' Lv.' + lv + '/' + b.ml + '</span>' +
    '</div>' +
    '<div class="bscene-body" id="scn-body"></div>' +
    '<div class="bscene-overlay"><div class="scene-stats">产率 <span id="scn-rate">' + fmt(inc) + '</span>/秒 | 升级 <span id="scn-cost">' + fmt(cost(bid)) + '</span></div><div id="scn-game-area"></div></div>' +
    '<div class="bscene-foot">' +
      '<div class="uinfo">下一级 <b>Lv.' + (lv + 1) + '</b> → <b>' + fmt(b.bi + b.ig * lv) + '</b>/秒</div>' +
      (isMax ? '<button class="ubtn max" disabled>已满级</button>' : '<button class="ubtn" id="scn-upgrade">升级 ' + fmt(cost(bid)) + '</button>') +
    '</div></div>';
  panel.style.display = 'block';

  renderScene(bid, lv);
  document.getElementById('scn-back').onclick = closeScene;
  var ub = document.getElementById('scn-upgrade');
  if (ub) ub.onclick = function() { if (doBuild(bid)) { closeScene(); setTimeout(function() { openScene(bid); }, 150); } };
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

// ==================== 场景渲染 + 小游戏 ====================
function renderScene(bid, lv) {
  var body = document.getElementById('scn-body');
  if (!body) return;
  body.innerHTML = '';

  var renderers = { tree: rTree, mine: rMine, farm: rFarm, fish: rFish, mill: rMill, bar: rBar, temple: rTemple, forge: rForge, wizard: rWizard, market: rMarket, dragon: rDragon, castle: rCastle };
  if (renderers[bid]) renderers[bid](body, lv, bid);
}

// ====== 1. 浆果树 - 果园场景 + 摘果子 ======
function rTree(body, lv, bid) {
  var trees = [
    {x: 10, h: 50, c: 'c1'},
    {x: 140, h: 70, c: 'c2'},
    {x: 260, h: 55, c: 'c3'},
    {x: 60, h: 45, c: 'c2'},
    {x: 200, h: 60, c: 'c1'},
    {x: 310, h: 40, c: 'c3'}
  ];

  var h = '';
  trees.forEach(function(t, i) {
    h += '<div class="scene-tree-trunk" style="left:' + (t.x + 8) + 'px;bottom:35%;height:' + t.h + 'px"></div>';
    h += '<div class="scene-tree-crown ' + t.c + '" style="left:' + (t.x - 16) + 'px;bottom:' + (35 + t.h) + '%"></div>';
  });
  h += '<div class="scene-grass"></div>';

  var fruits = [
    {x: 30, y: 15, color: '#e44'}, {x: 155, y: 8, color: '#f90'},
    {x: 275, y: 16, color: '#e44'}, {x: 80, y: 18, color: '#fc0'},
    {x: 220, y: 10, color: '#e44'}, {x: 330, y: 20, color: '#f90'},
    {x: 50, y: 22, color: '#fc0'}, {x: 180, y: 6, color: '#e44'}
  ];
  fruits.forEach(function(f) {
    h += '<div class="scene-fruit" style="left:' + f.x + 'px;top:' + f.y + '%;background:' + f.color + ';box-shadow:0 0 4px ' + f.color + '" data-fruit="1"></div>';
  });

  body.innerHTML = h;

  // 摘果子小游戏
  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🍎 摘果子 (10秒)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, timeLeft = 10, running = true;
    ga.innerHTML = '<div style="display:flex;justify-content:space-between;padding:0 6px"><span style="color:#ffd700;font-weight:700">🍎 <b id="gs">0</b></span><span style="color:#f66;font-weight:700" id="gt">⏱ 10s</span></div>';

    var ti = setInterval(function() {
      timeLeft--; var t = document.getElementById('gt'); if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(ti); clearInterval(di); running = false; endGame(score, lv, bid, '🍎', '个果子'); }
    }, 1000);

    // 刷新果实
    var di = setInterval(function() {
      if (!running) return;
      var fs = body.querySelectorAll('.scene-fruit');
      fs.forEach(function(f) {
        if (Math.random() < .3) { f.style.display = Math.random() < .5 ? 'block' : 'block'; f.style.animationDelay = Math.random() * 2 + 's'; }
      });
    }, 800);

    body.addEventListener('click', function(e) {
      var f = e.target.closest('[data-fruit]');
      if (f && running) { score++; f.style.transform = 'scale(0)'; f.style.transition = 'transform .15s'; sfxClick();
        setTimeout(function() { f.style.transform = ''; f.style.transition = ''; }, 200);
        var s = document.getElementById('gs'); if (s) s.textContent = score;
      }
    });
  };
}

function endGame(score, lv, bid, icon, unit) {
  var gold = Math.max(1, score) * lv * 40;
  S.gold += gold; save(); updateUI();
  sfxGold();
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = '<div class="result-block"><div class="rscore">' + icon + ' x' + score + '</div><div class="rgold">+'+fmt(gold)+' 💰</div></div>';
  var cd = sceneCd(bid);
  var btn = document.createElement('button'); btn.className = 'scene-play-btn mini'; btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次';
  if (cd <= 0) btn.onclick = function() { renderScene(bid, S.lvs[bid] || 1); };
  ga.appendChild(btn);
}

// ====== 2. 矿场 - 矿洞场景 + 挖矿 ======
function rMine(body, lv, bid) {
  var h = '';
  // 宝石光斑
  for (var i = 0; i < 8; i++) {
    h += '<div class="scene-gem-glow" style="left:' + (10 + Math.random() * 80) + '%;top:' + (10 + Math.random() * 40) + '%;animation-delay:' + (Math.random() * 2) + 's"></div>';
  }
  h += '<div class="scene-rail"></div>';
  h += '<div class="scene-cart" style="left:60px"></div>';
  // 可敲矿石
  var rocks = [
    {x: 30, y: 40, s: 24, c: '#555'},
    {x: 120, y: 50, s: 30, c: '#666'},
    {x: 220, y: 35, s: 20, c: '#777'},
    {x: 300, y: 48, s: 28, c: '#555'},
    {x: 80, y: 60, s: 22, c: '#696'},
    {x: 180, y: 55, s: 26, c: '#595'},
  ];
  rocks.forEach(function(r) {
    h += '<div class="scene-rock" data-rock="1" style="left:' + r.x + 'px;top:' + r.y + '%;width:' + r.s + 'px;height:' + (r.s * .75) + 'px;background:' + r.c + ';animation-delay:' + (Math.random() * 2) + 's;border-radius:' + (30 + Math.random() * 20) + '% ' + (40 + Math.random() * 20) + '% ' + (30 + Math.random() * 20) + '% ' + (40 + Math.random() * 20) + '%"></div>';
  });
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">⛏️ 挖矿 (10秒)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, gems = 0, timeLeft = 10, running = true;
    ga.innerHTML = '<div style="display:flex;justify-content:space-between;padding:0 6px"><span style="color:#ddd;font-weight:700">⛏️ <b id="gs">0</b></span><span style="color:#6cf;font-weight:700">💠 <b id="gg">0</b></span><span style="color:#f66;font-weight:700" id="gt">⏱ 10s</span></div>';

    var ti = setInterval(function() {
      timeLeft--; var t = document.getElementById('gt'); if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(ti); running = false; endMine(score, gems, lv, bid); }
    }, 1000);

    body.addEventListener('click', function(e) {
      var r = e.target.closest('[data-rock]');
      if (r && running) {
        r.style.transform = 'scale(0.3)'; r.style.transition = 'transform .2s'; r.style.opacity = '.3';
        setTimeout(function() { r.style.transform = ''; r.style.transition = ''; r.style.opacity = '1'; }, 300);
        if (Math.random() < .12) { gems++; sfxBuild(); var gg = document.getElementById('gg'); if (gg) gg.textContent = gems; }
        else { score++; sfxHit(); var gs = document.getElementById('gs'); if (gs) gs.textContent = score; }
      }
    });
  };
}

function endMine(score, gems, lv, bid) {
  var gold = score * lv * 60 + gems * lv * 400;
  S.gold += gold; S.gems += gems; save(); updateUI();
  sfxGold();
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = '<div class="result-block"><div class="rscore">⛏️ ' + score + ' 💠 ' + gems + '</div><div class="rgold">+'+fmt(gold)+' 💰</div></div>';
  var cd = sceneCd(bid);
  var btn = document.createElement('button'); btn.className = 'scene-play-btn mini'; btn.textContent = cd > 0 ? '冷却 ' + cd + 's' : '再来一次';
  if (cd <= 0) btn.onclick = function() { renderScene(bid, S.lvs[bid] || 1); };
  ga.appendChild(btn);
}

// ====== 3. 农田 - 农场场景 + 浇水 ======
function rFarm(body, lv, bid) {
  var h = '';
  // 麦穗行
  for (var row = 0; row < 4; row++) {
    for (var col = 0; col < 8; col++) {
      h += '<div class="scene-wheat" style="left:' + (20 + col * 40) + 'px;bottom:' + (25 + row * 8) + '%;animation-delay:' + (col * .2 + row * .3) + 's">' + ['🌾','🌿','🌾','🌿','🌾','🌾','🌿','🌾'][col] + '</div>';
    }
  }
  // 风车
  h += '<div class="scene-windmill" style="left:280px;bottom:25%"><div class="scene-windmill-blades" style="position:absolute;top:-24px;left:-10px"></div></div>';
  h += '<div class="scene-canal"></div>';
  // 稻草人
  h += '<div style="position:absolute;left:30px;bottom:25%;font-size:28px">🧑‍🌾</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">💧 浇水 (15秒)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var water = 50, score = 0, timeLeft = 15, running = true;
    var target = 35 + Math.random() * 30;
    ga.innerHTML =
      '<div style="display:flex;justify-content:space-between;padding:0 6px"><span style="color:#6cf;font-weight:700">💧 <b id="gs">0</b></span><span style="color:#f66;font-weight:700" id="gt">⏱ 15s</span></div>' +
      '<div class="water-bar-bg"><div class="water-bar-fill" id="wf" style="width:50%"></div></div>' +
      '<div style="position:relative;height:24px"><div class="water-zone" id="wz" style="left:' + (target / 100 * 300) + 'px;top:0"></div></div>' +
      '<button class="scene-play-btn" id="gm-tap" style="padding:8px 20px;font-size:13px;margin-top:4px">💧 浇水！</button>';

    var di = setInterval(function() {
      if (!running) return;
      water -= 4; if (water < 0) water = 0; if (water > 100) water = 100;
      var wf = document.getElementById('wf'); if (wf) wf.style.width = water + '%';
    }, 300);

    var ti = setInterval(function() {
      timeLeft--; var t = document.getElementById('gt'); if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(ti); clearInterval(di); running = false; endGame(score, lv, bid, '💧', '次浇水'); }
    }, 1000);

    document.getElementById('gm-tap').onclick = function() {
      if (!running) return;
      water = Math.min(100, water + 14);
      var wf = document.getElementById('wf'); if (wf) wf.style.width = water + '%';
      if (Math.abs(water - target) < 12) { score++; sfxGold(); document.getElementById('gs').textContent = score; target = 20 + Math.random() * 60;
        var wz = document.getElementById('wz'); if (wz) wz.style.left = (target / 100 * 300) + 'px'; }
      else { sfxClick(); }
    };
  };
}

// ====== 4. 渔场 - 海洋场景 + 钓鱼 ======
function rFish(body, lv, bid) {
  var h = '';
  h += '<div class="scene-beach"></div>';
  h += '<div class="scene-boat" style="left:40px;top:38%"></div>';
  h += '<div class="scene-boat" style="left:250px;top:42%"></div>';
  // 水下鱼
  for (var i = 0; i < 4; i++) {
    h += '<div class="scene-fish-swim" style="top:' + (55 + i * 8) + '%;animation-delay:' + (i * 1.2) + 's;font-size:' + (14 + i * 4) + 'px">' + ['🐟','🐠','🐡','🦈'][i] + '</div>';
  }
  h += '<div class="scene-rod" style="right:40px;top:25%"></div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🎣 钓鱼 (5次)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var tries = 5, score = 0, running = true, fishPos = 50;
    ga.innerHTML =
      '<div style="text-align:center;color:#ffd700;font-weight:700;margin-bottom:4px">🎣 <b id="gs">0</b>/5</div>' +
      '<div style="position:relative;height:50px;background:rgba(5,20,40,.6);border-radius:8px;overflow:hidden;margin:0 20px">' +
      '<div id="fishT" style="font-size:22px;position:absolute;top:50%;transform:translateY(-50%);left:-30px;transition:left .6s linear">🐟</div>' +
      '<div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#6cf;box-shadow:0 0 4px #6cf"></div></div>' +
      '<button class="scene-play-btn" id="gm-cast" style="padding:6px 16px;font-size:13px;margin-top:6px">🎣 收竿！</button>';

    function move() {
      if (!running) return;
      fishPos = 15 + Math.random() * 70;
      var ft = document.getElementById('fishT'); if (ft) ft.style.left = fishPos + '%';
    }
    move();

    document.getElementById('gm-cast').onclick = function() {
      if (!running) return;
      if (Math.abs(fishPos - 50) < 12) { score++; sfxBuild(); } else { sfxHit(); }
      document.getElementById('gs').textContent = score + '/5';
      tries--;
      if (tries <= 0) { running = false; endGame(score, lv, bid, '🎣', '条鱼'); return; }
      move();
    };
  };
}

// ====== 5. 磨坊 - 风车场景 + 磨面 ======
function rMill(body, lv, bid) {
  body.innerHTML = '<div style="position:absolute;left:20px;bottom:25%;font-size:20px">🌾</div><div style="position:absolute;left:60px;bottom:25%;font-size:20px">🌾</div><div style="position:absolute;left:100px;bottom:25%;font-size:20px">🌾</div><div style="position:absolute;left:200px;bottom:25%;font-size:20px">🌾</div><div style="position:absolute;left:240px;bottom:25%;font-size:20px">🌾</div>';

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">💨 磨面 (8秒连点)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var clicks = 0, timeLeft = 8, running = true;
    ga.innerHTML =
      '<div style="text-align:center;font-size:50px" id="mw">💨</div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700;font-size:16px">⚙️ <b id="gs">0</b> 转</div>' +
      '<div style="text-align:center;color:#f66;font-weight:700" id="gt">⏱ 8s</div>' +
      '<button class="scene-play-btn" id="gm-tap" style="padding:10px 36px;margin-top:4px">👆 快按！</button>';

    var deg = 0;
    document.getElementById('gm-tap').onclick = function() {
      if (!running) return;
      clicks++; deg += 36;
      var mw = document.getElementById('mw'); if (mw) mw.style.transform = 'rotate(' + deg + 'deg)';
      document.getElementById('gs').textContent = Math.floor(clicks / 6);
      sfxClick();
    };

    var ti = setInterval(function() {
      timeLeft--; var t = document.getElementById('gt'); if (t) t.textContent = '⏱ ' + timeLeft + 's';
      if (timeLeft <= 0) { clearInterval(ti); running = false; endGame(Math.floor(clicks / 6), lv, bid, '⚙️', '转'); }
    }, 1000);
  };
}

// ====== 6. 酒馆 - 酒馆场景 + 招待客人 ======
function rBar(body, lv, bid) {
  var h = '';
  for (var i = 0; i < 3; i++) { h += '<div class="scene-lantern" style="left:' + (30 + i * 100) + 'px;top:6%;animation-delay:' + (i * .7) + 's"></div>'; }
  h += '<div class="scene-barrel" style="left:20px;bottom:27%"></div><div class="scene-barrel" style="left:260px;bottom:27%"></div>';
  h += '<div style="position:absolute;left:160px;bottom:28%;font-size:24px">🪑</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🍺 招待客人 (8位)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, total = 8, round = 0, running = true;
    var menu = [
      {order: '🍕', opts: '🍕\u00a0🍔\u00a0🥗', ans: '🍕'},
      {order: '🍜', opts: '🍝\u00a0🍜\u00a0🍚', ans: '🍜'},
      {order: '🍰', opts: '🧁\u00a0🍩\u00a0🍰', ans: '🍰'},
      {order: '🍺', opts: '🍷\u00a0🍺\u00a0☕', ans: '🍺'},
      {order: '🥩', opts: '🍗\u00a0🥩\u00a0🧀', ans: '🥩'},
      {order: '🍣', opts: '🍣\u00a0🍤\u00a0🥟', ans: '🍣'},
      {order: '🍦', opts: '🍨\u00a0🍰\u00a0🍦', ans: '🍦'},
      {order: '🌮', opts: '🥙\u00a0🌮\u00a0🥪', ans: '🌮'}
    ];

    function next() {
      if (round >= total || !running) { endGame(score, lv, bid, '🍺', '位客人'); return; }
      var m = menu[round];
      ga.innerHTML =
        '<div style="text-align:center;color:#fc6;font-size:22px;margin-bottom:2px">' + m.order + ' 想要这个！</div>' +
        '<div style="text-align:center;font-size:10px;color:#888;margin-bottom:4px">第 ' + (round + 1) + '/8 位 · 3秒内选择</div>' +
        '<div style="display:flex;justify-content:center;gap:6px">' +
        '<button class="scene-play-btn mini gm-choice" data-a="' + m.ans + '" style="font-size:22px;padding:6px 14px">🍕</button>' +
        '<button class="scene-play-btn mini gm-choice" data-a="' + m.ans + '" style="font-size:22px;padding:6px 14px">🍜</button>' +
        '<button class="scene-play-btn mini gm-choice" data-a="' + m.ans + '" style="font-size:22px;padding:6px 14px">🍰</button></div>' +
        '<div style="text-align:center;margin-top:2px;color:#ffd700">✅ <b id="gs">' + score + '</b>/8</div>';
      round++;
    }
    next();

    ga.addEventListener('click', function(e) {
      var b = e.target.closest('.gm-choice'); if (!b || !running) return;
      if (b.textContent.trim() === menu[round - 1].ans) { score++; sfxGold(); } else { sfxHit(); }
      document.getElementById('gs').textContent = score + '/8';
      next();
    });
  };
}

// ====== 7. 神殿 - 神殿场景 + 祈福 ======
function rTemple(body, lv, bid) {
  var h = '';
  for (var i = 0; i < 5; i++) { h += '<div class="scene-holy-light" style="left:' + (20 + i * 60) + 'px;top:15%;animation-delay:' + (i * .4) + 's;transform-origin:top center"></div>'; }
  h += '<div style="position:absolute;bottom:20%;left:50%;transform:translateX(-50%);font-size:42px">🏛️</div>';
  h += '<div style="position:absolute;bottom:32%;left:50%;transform:translateX(-50%);font-size:14px;color:#fc6;text-shadow:0 0 8px #fc6">✦ ✦ ✦</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🙏 祈福 (3轮)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var round = 0, score = 0, power = 0, charging = false, chargeInt = null, running = true;

    function startRound() {
      if (round >= 3 || !running) { endGame(score, lv, bid, '✨', '次祈福'); return; }
      round++; power = 0;
      ga.innerHTML =
        '<div style="text-align:center;font-size:28px;margin-bottom:2px">🙏 ' + round + '/3</div>' +
        '<div class="pray-bar-bg"><div class="pray-bar-fill" id="pf" style="width:0%"></div></div>' +
        '<div style="text-align:center;color:#ffd700;font-weight:700;font-size:13px">⚡ <b id="pw">0</b>%</div>' +
        '<button class="scene-play-btn" id="gm-hold" style="padding:8px 28px;margin-top:4px">按住蓄力</button>';
    }
    startRound();

    ga.addEventListener('pointerdown', function(e) {
      if (!e.target.closest('#gm-hold') || !running) return;
      charging = true;
      chargeInt = setInterval(function() {
        power += 3; if (power > 100) power = 0;
        var pf = document.getElementById('pf'); if (pf) pf.style.width = power + '%';
        var pw = document.getElementById('pw'); if (pw) pw.textContent = power;
      }, 50);
    });

    ga.addEventListener('pointerup', function() {
      if (!charging || !running) return;
      charging = false; clearInterval(chargeInt);
      if (power >= 85 && power <= 100) { score += 2; sfxGold(); } else if (power >= 65) { score += 1; sfxBuild(); } else { sfxHit(); }
      startRound();
    });
  };
}

// ====== 8. 铁匠铺 - 熔炉场景 + 打铁 ======
function rForge(body, lv, bid) {
  var h = '';
  for (var i = 0; i < 6; i++) { h += '<div class="scene-spark" style="left:' + (40 + Math.random() * 260) + 'px;top:' + (20 + Math.random() * 30) + '%;--dx:' + ((Math.random() - .5) * 40) + ';animation-delay:' + (Math.random() * 1) + 's"></div>'; }
  h += '<div style="position:absolute;bottom:30%;left:50%;transform:translateX(-50%);font-size:28px">🔨</div>';
  h += '<div style="position:absolute;bottom:35%;left:50%;transform:translateX(-30px);font-size:20px">🔥</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🔨 打铁 (5锤)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var hits = 5, score = 0, running = true, hammerAt = 0, ready = false;

    ga.innerHTML =
      '<div style="text-align:center;font-size:10px;color:#888;margin-bottom:2px">锤子到尽头时点击！</div>' +
      '<div style="position:relative;height:30px;background:#222;border-radius:15px;margin:0 10px;overflow:hidden">' +
      '<div id="hmr" style="position:absolute;top:5px;left:0;width:60px;height:20px;background:linear-gradient(90deg,#777,#bbb);border-radius:3px;transition:left .7s cubic-bezier(.3,.7,.7,.3)"></div>' +
      '<div style="position:absolute;right:0;top:0;bottom:0;width:35px;background:rgba(100,200,100,.2);border-radius:0 15px 15px 0"></div></div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700;margin-top:2px">✅ <b id="gs">0</b>/5</div>' +
      '<button class="scene-play-btn" id="gm-hit" style="padding:6px 20px;font-size:13px;margin-top:2px">🔨 砸！</button>';

    function swing() {
      if (!running) return;
      var hmr = document.getElementById('hmr');
      if (hmr) hmr.style.left = '0px';
      setTimeout(function() {
        if (!running) return;
        hammerAt = 80;
        var hmr2 = document.getElementById('hmr');
        if (hmr2) hmr2.style.left = 'calc(100% - 65px)';
      }, 400);
    }
    swing();

    var si = setInterval(function() {
      if (!running) { clearInterval(si); return; }
      var hmr = document.getElementById('hmr');
      if (hmr && parseFloat(hmr.style.left) > (hmr.parentElement.clientWidth - 90)) hammerAt = 1; else hammerAt = 0;
      swing();
    }, 1500);

    document.getElementById('gm-hit').onclick = function() {
      if (!running) return;
      if (hammerAt) { score++; sfxBuild(); } else { sfxHit(); }
      document.getElementById('gs').textContent = Math.min(score, hits) + '/' + hits;
      hits--;
      if (hits <= 0) { clearInterval(si); running = false; endGame(Math.min(score, 5), lv, bid, '🔨', '锤'); }
    };
  };
}

// ====== 9. 法师塔 - 魔法塔场景 + 施法 ======
function rWizard(body, lv, bid) {
  var h = '';
  var runes = ['✦','✧','◈','⬥','⬩','✶'];
  for (var i = 0; i < 8; i++) { h += '<div class="scene-rune" style="left:' + (10 + Math.random() * 80) + '%;top:' + (10 + Math.random() * 50) + '%;animation-delay:' + (Math.random() * 3) + 's;animation-duration:' + (2 + Math.random() * 3) + 's">' + runes[Math.floor(Math.random() * runes.length)] + '</div>'; }
  h += '<div style="position:absolute;top:20%;left:50%;transform:translateX(-50%);font-size:32px">🔮</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🔮 施法 (3轮)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var round = 0, score = 0, running = true;
    var dots = [{x:30,y:30},{x:70,y:20},{x:50,y:55}];

    function next() {
      if (round >= 3 || !running) { endGame(score, lv, bid, '🔮', '次施法'); return; }
      round++;
      var cx = 50 + (Math.random() - .5) * 20, cy = 35 + (Math.random() - .5) * 10;
      dots = [
        {x:cx - 20, y:cy - 10, n:1},
        {x:cx + 20, y:cy - 15, n:2},
        {x:cx + 15, y:cy + 15, n:3},
        {x:cx - 15, y:cy + 10, n:4}
      ];
      var ni = 1;

      ga.innerHTML =
        '<div style="text-align:center;font-size:11px;color:#b9f;margin-bottom:2px">按数字顺序点击魔法阵 (' + round + '/3)</div>' +
        '<div style="position:relative;height:140px;width:100%;background:rgba(15,0,35,.5);border-radius:10px;margin:0 auto">' +
        dots.map(function(d) { return '<div class="spell-circle gm-dot" data-dn="' + d.n + '" style="left:' + d.x + '%;top:' + d.y + '%"></div>'; }).join('') +
        '</div>' +
        '<div style="text-align:center;margin-top:2px;color:#ffd700;font-weight:700">🔮 <b id="gs">' + score + '</b>/3</div>';

      ga.addEventListener('click', function(e) {
        var d = e.target.closest('.gm-dot'); if (!d || !running) return;
        var dn = parseInt(d.dataset.dn);
        if (dn === ni) { ni++; d.style.background = 'rgba(150,255,150,.3)'; d.style.borderColor = '#8f8'; sfxClick();
          if (ni > dots.length) { score++; sfxGold(); setTimeout(next, 400); } }
        else { sfxHit(); }
      });
    }
    next();
  };
}

// ====== 10. 贸易中心 - 市场场景 + 贸易 ======
function rMarket(body, lv, bid) {
  var h = '<div class="scene-scale" style="left:50%;top:20%;transform:translateX(-50%)">⚖️</div>';
  h += '<div style="position:absolute;left:40px;bottom:30%;font-size:16px">🏺</div><div style="position:absolute;left:120px;bottom:30%;font-size:16px">📦</div>';
  h += '<div style="position:absolute;left:220px;bottom:30%;font-size:16px">🎪</div><div style="position:absolute;left:300px;bottom:30%;font-size:16px">🛒</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">📊 开始贸易 (6轮)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, round = 0, running = true, price = 50;

    function next() {
      if (round >= 6 || !running) { endGame(score, lv, bid, '📊', '笔交易'); return; }
      round++;
      price = Math.max(10, Math.min(90, 50 + (Math.random() - .5) * 50));
      ga.innerHTML =
        '<div style="text-align:center;font-size:10px;color:#888;margin-bottom:2px">' + round + '/6 · 低价买，高价卖</div>' +
        '<div style="text-align:center;font-size:28px;font-weight:700;margin:2px 0;color:' + (price < 40 ? '#5b8' : price > 60 ? '#e55' : '#ccc') + '">💰 ' + Math.floor(price) + '</div>' +
        '<div style="display:flex;justify-content:center;gap:10px">' +
        '<button class="scene-play-btn mini gmtrade" data-a="buy" style="font-size:16px;padding:8px 20px">📈 买入</button>' +
        '<button class="scene-play-btn mini gmtrade" data-a="sell" style="font-size:16px;padding:8px 20px;background:linear-gradient(135deg,#a55,#833)">📉 卖出</button></div>' +
        '<div style="text-align:center;margin-top:2px;color:#ffd700">📊 <b id="gs">' + score + '</b>/6</div>';

      ga.addEventListener('click', function handler(e) {
        var b = e.target.closest('.gmtrade'); if (!b || !running) return;
        var act = b.dataset.a;
        if ((act === 'buy' && price < 40) || (act === 'sell' && price > 60)) { score++; sfxGold(); } else { sfxHit(); }
        document.getElementById('gs').textContent = score + '/6';
        ga.removeEventListener('click', handler);
        next();
      });
    }
    next();
  };
}

// ====== 11. 龙巢 - 火山场景 + 喂龙 ======
function rDragon(body, lv, bid) {
  var h = '';
  h += '<div class="scene-dragon-body" style="left:50%;top:30%;transform:translateX(-50%)">🐉</div>';
  for (var i = 0; i < 6; i++) { h += '<div class="scene-coins" style="left:' + (20 + i * 40) + 'px;bottom:32%;animation-delay:' + (i * .3) + 's">💰</div>'; }
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🐉 喂龙 (8次)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var score = 0, total = 8, running = true, mouseOpen = false;

    ga.innerHTML =
      '<div style="text-align:center;font-size:10px;color:#888;margin-bottom:2px">龙张嘴时点击喂食！</div>' +
      '<div id="dMouth" style="text-align:center;font-size:32px;transition:transform .3s">👄</div>' +
      '<div style="text-align:center;color:#ffd700;font-weight:700;margin-top:2px">🍖 <b id="gs">0</b>/8</div>';

    function toggle() {
      if (!running) return;
      mouseOpen = !mouseOpen;
      var dm = document.getElementById('dMouth');
      if (dm) dm.style.transform = mouseOpen ? 'scaleY(1.5)' : 'scaleY(1)';
      setTimeout(toggle, 500 + Math.random() * 800);
    }
    toggle();

    ga.addEventListener('click', function(e) {
      if (!e.target.closest('#dMouth') || !running) return;
      if (mouseOpen) { score++; sfxGold(); document.getElementById('gs').textContent = score + '/8';
        if (score >= total) { running = false; endGame(score, lv, bid, '🐉', '次喂食'); } }
      else { sfxHit(); }
    });
  };
}

// ====== 12. 城堡 - 城堡场景 + 宝库老虎机 ======
function rCastle(body, lv, bid) {
  var h = '';
  h += '<div class="scene-tower" style="left:25%;bottom:30%"></div>';
  h += '<div class="scene-tower" style="right:25%;bottom:30%"></div>';
  h += '<div class="scene-flag" style="left:44%;bottom:calc(30% + 44px)"></div>';
  h += '<div class="scene-moat"></div>';
  h += '<div style="position:absolute;bottom:30%;left:50%;transform:translateX(-50%);font-size:36px">🏰</div>';
  h += '<div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);font-size:14px;color:#ffd700">👑 熊爪城堡</div>';
  body.innerHTML = h;

  var cd = sceneCd(bid);
  var ga = document.getElementById('scn-game-area');
  ga.innerHTML = cd > 0
    ? '<button class="scene-play-btn" disabled style="opacity:.5">冷却中 ' + cd + 's</button>'
    : '<button class="scene-play-btn" id="scn-start">🎰 宝库转盘 (3次)</button>';

  if (cd > 0) return;
  document.getElementById('scn-start').onclick = function() {
    setSceneCd(bid);
    var spins = 3, score = 0, running = true;
    var icons = ['💎','👑','💰','🏆','⭐','🎁'];

    function next() {
      if (spins <= 0 || !running) { endGame(score, lv, bid, '🎰', '次转盘'); return; }
      spins--;
      var r = [icons[Math.floor(Math.random() * icons.length)], icons[Math.floor(Math.random() * icons.length)], icons[Math.floor(Math.random() * icons.length)]];

      ga.innerHTML =
        '<div style="display:flex;justify-content:center;gap:6px;margin:4px 0">' +
        '<div class="slot-reel"><div>' + r[0] + '</div></div>' +
        '<div class="slot-reel"><div>' + r[1] + '</div></div>' +
        '<div class="slot-reel"><div>' + r[2] + '</div></div></div>' +
        '<div style="text-align:center;color:#ffd700;font-weight:700">🍀 <b id="gs">' + score + '</b></div>' +
        '<button class="scene-play-btn" id="gm-spin" style="padding:6px 20px;font-size:13px;margin-top:2px">🎰 转动！(' + (spins + 1) + '次)</button>';

      document.getElementById('gm-spin').onclick = function() {
        if (!running) return;
        var match = r[0] === r[1] && r[1] === r[2] ? 3 : (r[0] === r[1] || r[1] === r[2] || r[0] === r[2] ? 1 : 0);
        score += match;
        if (match >= 3) sfxWin(); else if (match >= 1) sfxGold(); else sfxHit();
        next();
      };
    }
    next();
  };
}
