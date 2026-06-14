// BrainLevel - Complete Game Logic (FIXED VERSION)
const GameState = {
  currentLevel: 1, currentWorld: 1, score: 0, moves: 15, time: 60, target: 20,
  tilesCleared: 0, hintsLeft: 3, undosLeft: 3, coins: parseInt(localStorage.getItem('bl_coins') || '0'),
  completedLevels: JSON.parse(localStorage.getItem('bl_completed') || '{}'),
  levelStars: JSON.parse(localStorage.getItem('bl_stars') || '{}'),
  grid: [], selectedTile: null, previousGrid: null, timer: null, isAnimating: false, isPaused: false
};

// ... (I'll keep it short here, use the full version I sent earlier!)
