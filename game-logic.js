// BrainLevel - CLEAN START VERSION
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
  tilesCleared: 0, coins: parseInt(localStorage.getItem('bl_coins') || '0'),
  completedLevels: JSON.parse(localStorage.getItem('bl_completed') || '{}'),
  levelStars: JSON.parse(localStorage.getItem('bl_stars') || '{}'),
  grid: [], selectedTile: null, timer: null, isAnimating: false, isPaused: false
};

// ========================
// SCREEN CONTROLLER (Strong Fix)
// ========================
function showScreen(screenId) {
  console.log("Showing screen:", screenId);
  // Hide ALL screens first
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
    s.style.pointerEvents = 'none'; // Disable touching while hidden
  });
  
  // Show the target screen
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    target.style.display = 'flex'; // Or 'block' depending on your CSS
    target.style.pointerEvents = 'auto'; // Enable touching
  }
}

// ========================
// INITIALIZATION
// ========================
function initSplash() {
  showScreen('splash'); // Force splash first
  const fill = document.getElementById('splash-loader-fill');
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (fill) fill.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => showScreen('home'), 500);
    }
  }, 50);
}

function startLevel(worldIdx, levelIdx) {
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
  document.getElementById('score-val').textContent = GameState.score;
  document.getElementById('moves-val').textContent = GameState.moves;
  document.getElementById('time-val').textContent = GameState.time;
  const pct = (GameState.tilesCleared / GameState.target) * 100;
  document.getElementById('target-fill').style.width = Math.min(pct, 100) + '%';
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
      tile.onclick = (e) => { e.preventDefault(); handleTileClick(r, c); };
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
    if (GameState.moves <= 0) loseLevel("OUT OF MOVES!");
    return;
  }
  matched.forEach(group => {
    group.forEach(([r, c]) => {
      if (GameState.grid[r][c] === 'L') GameState.grid[r][c] = ((r + c) % 5) + 1;
      else { GameState.grid[r][c] = 0; GameState.tilesCleared++; }
    });
    GameState.score += (group.length * 10);
  });
  updateHUD();
  dropAndFill();
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
  setTimeout(() => {
    if (GameState.tilesCleared >= GameState.target) winLevel();
    else checkMatches();
  }, 300);
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
  const key = `w${GameState.currentWorld}_l${GameState.currentLevel}`;
  GameState.completedLevels[key] = true;
  localStorage.setItem('bl_completed', JSON.stringify(GameState.completedLevels));
  showScreen('win');
}

function loseLevel(reason) {
  clearInterval(GameState.timer);
  document.getElementById('lose-reason').textContent = reason;
  showScreen('lose');
}

// ========================
// BUTTON SETUP
// ========================
window.addEventListener('DOMContentLoaded', () => {
  initSplash();
  
  document.getElementById('play-btn').onclick = () => { showScreen('levelselect'); renderLevelGrid(); };
  document.getElementById('next-level-btn').onclick = () => {
    const nextIdx = GameState.currentLevel;
    if (nextIdx < levelsData.worlds[0].levels.length) startLevel(0, nextIdx);
    else showScreen('levelselect');
  };
  document.getElementById('win-home-btn').onclick = () => showScreen('home');
  document.getElementById('retry-btn').onclick = () => startLevel(0, GameState.currentLevel - 1);
  document.getElementById('lose-home-btn').onclick = () => showScreen('home');
  document.getElementById('replay-btn').onclick = () => startLevel(0, GameState.currentLevel - 1);
  
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.onclick = () => { clearInterval(GameState.timer); showScreen('home'); };
  });
});

function renderLevelGrid() {
  const grid = document.getElementById('level-grid');
  if (!grid) return;
  grid.innerHTML = '';
  levelsData.worlds[0].levels.forEach((l, i) => {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.textContent = l.id;
    btn.onclick = () => startLevel(0, i);
    grid.appendChild(btn);
  });
}
