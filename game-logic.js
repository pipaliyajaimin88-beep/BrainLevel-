// BrainLevel - ULTIMATE FINAL MASTER VERSION
// game-logic.js

// ========================
// EMBEDDED LEVELS
// ========================
const levelsData = {
  "worlds": [
    {
      "id": 1, "name": "The Beginning", "locked": false,
      "levels": [
        {"id": 1, "difficulty": "easy", "moves": 15, "time": 60, "target": 15, "grid": [[1,2,1,2],[2,1,2,1],[1,2,1,2],[2,1,2,1]]},
        {"id": 2, "difficulty": "easy", "moves": 12, "time": 45, "target": 20, "grid": [[3,3,4,4],[4,4,3,3],[3,3,4,4],[4,4,3,3]]},
        {"id": 3, "difficulty": "medium", "moves": 20, "time": 90, "target": 30, "grid": [[1,2,3,4],[4,3,2,1],[1,2,3,4],[4,3,2,1]]},
        {"id": 4, "difficulty": "medium", "moves": 15, "time": 60, "target": 25, "grid": [[5,1,5,1],[1,"L","L",5],[5,"L","L",1],[1,5,1,5]]},
        {"id": 5, "difficulty": "hard", "moves": 10, "time": 30, "target": 40, "grid": [["B",1,2,"B"],[3,4,5,1],[2,3,4,5],["B",1,2,"B"]]},
        {"id": 6, "difficulty": "hard", "moves": 25, "time": 120, "target": 60, "grid": [["R","L","L","R"],["L",1,2,"L"],["L",3,4,"L"],["R","L","L","R"]]}
      ]
    }
  ]
};

// ========================
// GAME STATE
// ========================
const GameState = {
  currentLevel: 1, currentWorld: 1, score: 0, moves: 15, time: 60, target: 20,
  tilesCleared: 0, hintsLeft: 3, undosLeft: 3,
  coins: parseInt(localStorage.getItem('bl_coins') || '0'),
  completedLevels: JSON.parse(localStorage.getItem('bl_completed') || '{}'),
  levelStars: JSON.parse(localStorage.getItem('bl_stars') || '{}'),
  settings: JSON.parse(localStorage.getItem('bl_settings') || '{"music":true,"sound":true,"vibration":true}'),
  grid: [], selectedTile: null, previousGrid: null, timer: null, isAnimating: false, isPaused: false
};

// ========================
// AUDIO SYSTEM (Beeps)
// ========================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(freq = 440, type = 'sine', duration = 0.1) {
  if (!GameState.settings.sound) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ========================
// CORE FUNCTIONS
// ========================
function saveProgress() {
  localStorage.setItem('bl_coins', GameState.coins);
  localStorage.setItem('bl_completed', JSON.stringify(GameState.completedLevels));
  localStorage.setItem('bl_stars', JSON.stringify(GameState.levelStars));
  localStorage.setItem('bl_settings', JSON.stringify(GameState.settings));
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
    s.style.pointerEvents = 'none';
  });
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'flex';
    target.style.pointerEvents = 'auto';
  }
  updateCoinDisplay();
}

// ========================
// GAMEPLAY LOGIC
// ========================
function startLevel(worldIdx, levelIdx) {
  playSound(600, 'square');
  const level = levelsData.worlds[worldIdx].levels[levelIdx];
  GameState.currentLevel = level.id;
  GameState.currentWorld = worldIdx + 1;
  GameState.score = 0;
  GameState.moves = level.moves;
  GameState.time = level.time;
  GameState.target = level.target;
  GameState.tilesCleared = 0;
  GameState.grid = JSON.parse(JSON.stringify(level.grid));
  GameState.isPaused = false;
  GameState.isAnimating = false;
  showScreen('gameplay');
  initGameplay();
}

function initGameplay() {
  updateHUD();
  renderGrid();
  startTimer();
  const nameEl = document.getElementById('gp-level-name');
  if (nameEl) nameEl.textContent = `Level ${GameState.currentLevel}`;
}

function updateHUD() {
  const ids = {
    'score-val': GameState.score,
    'moves-val': GameState.moves,
    'time-val': GameState.time,
    'target-text': `${GameState.tilesCleared}/${GameState.target} tiles`,
    'hint-btn': `💡 Hint (${GameState.hintsLeft})`,
    'undo-btn': `↩ Undo (${GameState.undosLeft})`
  };
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
  const fill = document.getElementById('target-fill');
  if (fill) fill.style.width = Math.min((GameState.tilesCleared / GameState.target) * 100, 100) + '%';
}

function renderGrid() {
  const grid = document.getElementById('game-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = GameState.grid[r][c];
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (val === 'L') { tile.classList.add('tile-locked'); tile.textContent = '🔒'; }
      else if (val === 'B') { tile.classList.add('tile-bomb'); tile.textContent = '💣'; }
      else if (val === 'R') { tile.classList.add('tile-rainbow'); tile.textContent = '🌈'; }
      else if (val !== 0) { tile.classList.add(`tile-${val}`); }
      
      if (GameState.selectedTile && GameState.selectedTile.row === r && GameState.selectedTile.col === c) {
        tile.classList.add('selected');
      }
      tile.onclick = () => { playSound(300); handleTileClick(r, c); };
      grid.appendChild(tile);
    }
  }
}

function handleTileClick(r, c) {
  if (GameState.isAnimating || GameState.isPaused || GameState.moves <= 0) return;
  if (!GameState.selectedTile) {
    GameState.selectedTile = {row: r, col: c};
    renderGrid();
  } else {
    const s = GameState.selectedTile;
    const isAdj = (Math.abs(s.row - r) === 1 && s.col === c) || (Math.abs(s.col - c) === 1 && s.row === r);
    if (isAdj) {
      GameState.previousGrid = JSON.parse(JSON.stringify(GameState.grid));
      swap(s.row, s.col, r, c);
      GameState.moves--;
      updateHUD();
    }
    GameState.selectedTile = null;
    renderGrid();
  }
}

function swap(r1, c1, r2, c2) {
  GameState.isAnimating = true;
  const t = GameState.grid[r1][c1];
  GameState.grid[r1][c1] = GameState.grid[r2][c2];
  GameState.grid[r2][c2] = t;
  renderGrid();
  setTimeout(checkMatches, 300);
}

function checkMatches() {
  const matched = findMatches();
  if (matched.length === 0) {
    GameState.isAnimating = false;
    if (GameState.tilesCleared >= GameState.target) { winLevel(); }
    else if (GameState.moves <= 0) { loseLevel("OUT OF MOVES!"); }
    return;
  }
  
  playSound(800, 'triangle', 0.2);
  matched.forEach(group => {
    group.forEach(([r, c]) => {
      if (GameState.grid[r][c] === 'L') { GameState.grid[r][c] = ((r + c) % 5) + 1; }
      else if (GameState.grid[r][c] !== 0) { GameState.grid[r][c] = 0; GameState.tilesCleared++; }
    });
    GameState.score += (group.length * 10);
  });
  
  updateHUD();
  setTimeout(() => { dropAndFill(); }, 300);
}

function findMatches() {
  const matched = [];
  const grid = GameState.grid;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 2; c++) {
      const v = grid[r][c];
      if (v && v !== 'L' && v === grid[r][c+1] && v === grid[r][c+2]) matched.push([[r, c], [r, c+1], [r, c+2]]);
    }
  }
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 2; r++) {
      const v = grid[r][c];
      if (v && v !== 'L' && v === grid[r+1][c] && v === grid[r+2][c]) matched.push([[r, c], [r+1, c], [r+2, c]]);
    }
  }
  return matched;
}

function dropAndFill() {
  for (let c = 0; c < 4; c++) {
    let emptyRow = 3;
    for (let r = 3; r >= 0; r--) {
      if (GameState.grid[r][c] !== 0) {
        const val = GameState.grid[r][c];
        GameState.grid[r][c] = 0;
        GameState.grid[emptyRow][c] = val;
        emptyRow--;
      }
    }
    for (let r = emptyRow; r >= 0; r--) GameState.grid[r][c] = Math.floor(Math.random() * 5) + 1;
  }
  renderGrid();
  setTimeout(checkMatches, 300);
}

function startTimer() {
  clearInterval(GameState.timer);
  GameState.timer = setInterval(() => {
    if (GameState.isPaused) return;
    GameState.time--;
    updateHUD();
    if (GameState.time <= 0) { clearInterval(GameState.timer); loseLevel("OUT OF TIME!"); }
  }, 1000);
}

function winLevel() {
  clearInterval(GameState.timer);
  playSound(1000, 'sine', 0.5);
  const stars = GameState.moves >= 10 ? 3 : GameState.moves >= 5 ? 2 : 1;
  const key = `w${GameState.currentWorld}_l${GameState.currentLevel}`;
  GameState.completedLevels[key] = true;
  GameState.levelStars[key] = Math.max(GameState.levelStars[key] || 0, stars);
  GameState.coins += (stars * 10);
  saveProgress();
  
  const starEl = document.getElementById('win-stars');
  if (starEl) starEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
  document.getElementById('win-score').textContent = GameState.score + ' pts';
  document.getElementById('win-coins').textContent = '+' + (stars * 10) + ' 🪙';
  showScreen('win');
}

function loseLevel(reason) {
  clearInterval(GameState.timer);
  playSound(200, 'sawtooth', 0.5);
  document.getElementById('lose-reason').textContent = reason;
  document.getElementById('lose-score').textContent = 'Score: ' + GameState.score;
  showScreen('lose');
}

function updateCoinDisplay() {
  const text = '🪙 ' + GameState.coins;
  document.querySelectorAll('.coin-display, .shop-coins').forEach(el => el.textContent = text);
}

// ========================
// SHOP & SETTINGS LOGIC
// ========================
window.buyItem = (type, price, item) => {
  if (GameState.coins >= price) {
    GameState.coins -= price;
    if (item === 'hint') GameState.hintsLeft += 5;
    if (item === 'undo') GameState.undosLeft += 5;
    if (item === 'time') GameState.time += 30;
    playSound(1200, 'sine', 0.2);
    saveProgress();
    updateHUD();
    updateCoinDisplay();
    alert("Purchase Successful!");
  } else {
    alert("Not enough coins!");
  }
};

function setupSettings() {
  const toggles = document.querySelectorAll('#settings input[type="checkbox"]');
  const keys = ['music', 'sound', 'vibration', 'notifications'];
  toggles.forEach((t, i) => {
    t.checked = GameState.settings[keys[i]];
    t.onchange = () => {
      GameState.settings[keys[i]] = t.checked;
      saveProgress();
      playSound(500);
    };
  });
}

// ========================
// BUTTON BINDING
// ========================
window.addEventListener('load', () => {
  loadProgress();
  setupSettings();
  
  const fill = document.getElementById('splash-loader-fill');
  let p = 0;
  const inv = setInterval(() => {
    p += 10;
    if (fill) fill.style.width = p + '%';
    if (p >= 100) { clearInterval(inv); showScreen('home'); }
  }, 50);

  const bind = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = () => { playSound(440); fn(); }; };
  
  bind('play-btn', () => { showScreen('levelselect'); renderLevelGrid(); });
  bind('leaderboard-btn', () => showScreen('leaderboard'));
  bind('shop-btn', () => showScreen('shop'));
  bind('settings-btn', () => showScreen('settings'));
  
  bind('pause-btn', () => { GameState.isPaused = true; document.getElementById('pause-overlay').style.display = 'flex'; });
  bind('resume-btn', () => { GameState.isPaused = false; document.getElementById('pause-overlay').style.display = 'none'; });
  
  bind('hint-btn', () => { if (GameState.hintsLeft > 0) { GameState.hintsLeft--; updateHUD(); alert("Hint: Match 3 colors!"); } });
  bind('undo-btn', () => { if (GameState.undosLeft > 0 && GameState.previousGrid) { GameState.grid = JSON.parse(JSON.stringify(GameState.previousGrid)); GameState.undosLeft--; updateHUD(); renderGrid(); } });
  
  bind('next-level-btn', () => {
    const nextIdx = GameState.currentLevel;
    if (nextIdx < levelsData.worlds[0].levels.length) startLevel(0, nextIdx);
    else { showScreen('levelselect'); renderLevelGrid(); }
  });
  
  bind('replay-btn', () => startLevel(0, GameState.currentLevel - 1));
  bind('retry-btn', () => startLevel(0, GameState.currentLevel - 1));
  bind('win-home-btn', () => showScreen('home'));
  bind('lose-home-btn', () => showScreen('home'));
  
  // Watch Ad Button Fix
  const adBtn = document.querySelector('#lose .btn-golden');
  if (adBtn) adBtn.onclick = () => {
    alert("Ad watched! +5 Moves added.");
    GameState.moves += 5;
    updateHUD();
    showScreen('gameplay');
    startTimer();
  };

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.onclick = () => { playSound(400); clearInterval(GameState.timer); showScreen('home'); };
  });
});

function renderLevelGrid() {
  const grid = document.getElementById('level-grid');
  if (!grid) return;
  grid.innerHTML = '';
  levelsData.worlds[0].levels.forEach((l, i) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const key = `w1_l${l.id}`;
    if (GameState.completedLevels[key]) btn.classList.add('completed');
    btn.textContent = l.id;
    btn.onclick = () => startLevel(0, i);
    grid.appendChild(btn);
  });
  }
