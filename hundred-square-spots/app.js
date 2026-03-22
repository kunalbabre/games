const COLORS = [
  { id: 'electric-blue', value: '#4b82ff', label: 'Electric Blue' },
  { id: 'hot-pink', value: '#ff418b', label: 'Hot Pink' },
  { id: 'mint-pop', value: '#3cf285', label: 'Mint Pop' },
  { id: 'sun-gold', value: '#ffc61a', label: 'Sun Gold' },
  { id: 'grape-glow', value: '#9d45ff', label: 'Grape Glow' },
  { id: 'sky-cyan', value: '#47cfff', label: 'Sky Cyan' },
  { id: 'peach-flare', value: '#ff8a5b', label: 'Peach Flare' },
  { id: 'lime-zing', value: '#b9f227', label: 'Lime Zing' },
  { id: 'berry-pop', value: '#ff5fd2', label: 'Berry Pop' },
  { id: 'violet-dream', value: '#715dff', label: 'Violet Dream' },
  { id: 'lava-coral', value: '#ff5c6d', label: 'Lava Coral' },
  { id: 'aqua-splash', value: '#2ee6c6', label: 'Aqua Splash' }
];

let paletteColors = [...COLORS];
let selectedColor = paletteColors[0];
let gridState = new Map(); // Num -> ColorValue
let history = [];
const STORAGE_KEY = 'hundred-square-spots:saved-boards';

const grid = document.getElementById('hundredGrid');
const palette = document.getElementById('palette');
const statsList = document.getElementById('statsList');
const customColorInput = document.getElementById('customColorInput');
const addColorBtn = document.getElementById('addColorBtn');
const brushLabel = document.getElementById('brushLabel');
const gridStatus = document.getElementById('gridStatus');
const saveNameInput = document.getElementById('saveNameInput');
const saveBoardBtn = document.getElementById('saveBoardBtn');
const savedBoardsList = document.getElementById('savedBoardsList');

function getSavedBoards() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setSavedBoards(savedBoards) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedBoards));
}

function formatSavedBoardTime(savedAt) {
  return new Date(savedAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function collectBoardSnapshot() {
  return {
    paletteColors,
    selectedColorId: selectedColor.id,
    tiles: Array.from(gridState.entries()),
    savedAt: new Date().toISOString()
  };
}

function ensurePaletteColors(colors = []) {
  const knownValues = new Set(paletteColors.map(color => color.value.toUpperCase()));

  colors.forEach(color => {
    const normalizedValue = color.value.toUpperCase();
    if (!knownValues.has(normalizedValue)) {
      paletteColors.push({
        id: color.id || `custom-${Date.now()}-${knownValues.size}`,
        value: normalizedValue,
        label: color.label || `Custom ${normalizedValue}`
      });
      knownValues.add(normalizedValue);
    }
  });
}

function applyGridState() {
  document.querySelectorAll('.grid-tile').forEach(tile => {
    const num = Number(tile.dataset.num);
    const color = gridState.get(num);

    tile.style.removeProperty('background');
    tile.style.setProperty('--tile-color', color || 'transparent');
    tile.classList.toggle('pushed', Boolean(color));
  });
}

function loadBoardState(snapshot) {
  ensurePaletteColors(snapshot.paletteColors || []);
  gridState = new Map((snapshot.tiles || []).map(([num, color]) => [Number(num), color]));
  selectedColor = paletteColors.find(color => color.id === snapshot.selectedColorId)
    || paletteColors.find(color => color.value === (snapshot.paletteColors?.[0]?.value || '').toUpperCase())
    || paletteColors[0];

  renderPalette();
  updateBrushLabel();
  applyGridState();
  updateStats();
}

function renderSavedBoards() {
  const savedBoards = getSavedBoards();
  savedBoardsList.innerHTML = '';

  if (savedBoards.length === 0) {
    savedBoardsList.innerHTML = '<p class="empty-saves">No saved boards yet.</p>';
    return;
  }

  savedBoards.forEach(board => {
    const item = document.createElement('article');
    item.className = 'saved-board-item';

    const title = document.createElement('strong');
    title.className = 'saved-board-title';
    title.textContent = board.name;

    const meta = document.createElement('p');
    meta.className = 'saved-board-meta';
    meta.textContent = `${board.tiles.length} painted spot${board.tiles.length === 1 ? '' : 's'} · ${formatSavedBoardTime(board.savedAt)}`;

    const actions = document.createElement('div');
    actions.className = 'saved-board-actions';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'icon-btn save-action-btn';
    loadBtn.type = 'button';
    loadBtn.textContent = 'Load';
    loadBtn.onclick = () => {
      loadBoardState(board);
      gridStatus.textContent = `Loaded ${board.name}.`;
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn save-action-btn ghost';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      const nextBoards = getSavedBoards().filter(savedBoard => savedBoard.id !== board.id);
      setSavedBoards(nextBoards);
      renderSavedBoards();
      gridStatus.textContent = `Deleted ${board.name}.`;
    };

    actions.append(loadBtn, deleteBtn);
    item.append(title, meta, actions);
    savedBoardsList.appendChild(item);
  });
}

function saveCurrentBoard() {
  const trimmedName = saveNameInput.value.trim();
  const savedBoards = getSavedBoards();
  const boardName = trimmedName || `Board ${savedBoards.length + 1}`;
  const snapshot = collectBoardSnapshot();
  const nextBoard = {
    id: `board-${Date.now()}`,
    name: boardName,
    ...snapshot
  };

  savedBoards.unshift(nextBoard);
  setSavedBoards(savedBoards.slice(0, 20));
  renderSavedBoards();
  saveNameInput.value = '';
  gridStatus.textContent = `${boardName} saved to this browser.`;
}

function getColorLabel(colorValue) {
  return paletteColors.find(color => color.value.toLowerCase() === colorValue.toLowerCase())?.label || colorValue.toUpperCase();
}

function updateBrushLabel() {
  brushLabel.textContent = `Current brush: ${selectedColor.label}`;
}

function selectColor(color) {
  selectedColor = color;
  renderPalette();
  updateBrushLabel();
}

// Initialize Palette
function renderPalette() {
  palette.innerHTML = '';

  paletteColors.forEach(color => {
    const btn = document.createElement('button');
    btn.className = 'palette-swatch';
    btn.type = 'button';
    btn.style.setProperty('--swatch-color', color.value);
    btn.title = color.label;
    btn.setAttribute('aria-label', color.label);
    if (color.id === selectedColor.id) btn.classList.add('active');
    btn.onclick = () => selectColor(color);
    palette.appendChild(btn);
  });
}

function addCustomColor() {
  const value = customColorInput.value.toUpperCase();
  const existingColor = paletteColors.find(color => color.value.toUpperCase() === value);

  if (existingColor) {
    selectColor(existingColor);
    gridStatus.textContent = `${existingColor.label} is ready to use.`;
    return;
  }

  const customColor = {
    id: `custom-${Date.now()}`,
    value,
    label: `Custom ${value}`
  };

  paletteColors.push(customColor);
  selectColor(customColor);
  gridStatus.textContent = `${customColor.label} added to your brush palette.`;
}

// Check Math Rules
const isPrime = num => {
  for (let i = 2, s = Math.sqrt(num); i <= s; i++) if (num % i === 0) return false;
  return num > 1;
};
const isSquare = num => Math.sqrt(num) % 1 === 0;
const fibs = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
const isFib = num => fibs.includes(num);

// Logic: Identify Pattern Rule
function inferRule(numbers) {
  if (numbers.length === 0) return "None";
  if (numbers.every(n => n % 2 === 0)) return "All Evens";
  if (numbers.every(n => n % 2 !== 0)) return "All Odds";
  if (numbers.every(n => isPrime(n))) return "All Primes";
  if (numbers.every(n => isSquare(n))) return "All Squares";
  
  // Check Step Gap
  const sorted = [...numbers].sort((a, b) => a - b);
  const gaps = [];
  for(let i=1; i<sorted.length; i++) gaps.push(sorted[i] - sorted[i-1]);
  if (gaps.length > 0 && gaps.every(g => g === gaps[0])) return `Gap of ${gaps[0]}`;
  
  return "Mixed Patterns";
}

function updateStats() {
  statsList.innerHTML = "";
  const colorGroups = new Map();
  gridState.forEach((colorVal, num) => {
    if (!colorGroups.has(colorVal)) colorGroups.set(colorVal, []);
    colorGroups.get(colorVal).push(num);
  });

  if (colorGroups.size === 0) {
    statsList.innerHTML = '<p class="empty-stats">Select a color to see live rules.</p>';
    return;
  }

  const template = document.getElementById('statItemTemplate');
  colorGroups.forEach((nums, colorVal) => {
    const item = template.content.cloneNode(true).querySelector('.stat-item');
    item.querySelector('.stat-swatch').style.background = colorVal;
    item.querySelector('.stat-count').textContent = `${getColorLabel(colorVal)} · ${nums.length} spot${nums.length > 1 ? 's' : ''}`;
    item.querySelector('.stat-rule').textContent = inferRule(nums);
    
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    item.querySelector('.stat-mean').textContent = mean.toFixed(1);
    
    const sorted = [...nums].sort((a,b) => a-b);
    const minGap = sorted.length > 1 ? Math.min(...sorted.slice(1).map((n, i) => n - sorted[i])) : 0;
    item.querySelector('.stat-gap').textContent = minGap;
    
    statsList.appendChild(item);
  });
}

function initGrid() {
  for (let i = 1; i <= 100; i++) {
    const tile = document.createElement('div');
    tile.className = 'grid-tile';
    tile.dataset.num = i;

    const label = document.createElement('span');
    label.className = 'tile-number';
    label.textContent = i;
    tile.appendChild(label);

    tile.onmousedown = (e) => {
      e.preventDefault();
      toggleTile(i);
      window.isDragging = true;
    };
    tile.onmouseenter = () => {
      if (window.isDragging) toggleTile(i, true);
    };
    grid.appendChild(tile);
  }
}

function toggleTile(num, onlyAdd = false) {
  const existing = gridState.get(num);

  if (existing === selectedColor.value) {
    if (!onlyAdd) {
      gridState.delete(num);
    }
  } else {
    gridState.set(num, selectedColor.value);
  }
  applyGridState();
  updateStats();
}

// Pattern Tool Actions
document.querySelectorAll('[data-rule]').forEach(btn => {
  btn.onclick = () => {
    const rule = btn.dataset.rule;
    const val = parseInt(btn.dataset.val);
    for (let i = 1; i <= 100; i++) {
      let match = false;
      if (rule === 'even') match = i % 2 === 0;
      if (rule === 'odd') match = i % 2 !== 0;
      if (rule === 'prime') match = isPrime(i);
      if (rule === 'square') match = isSquare(i);
      if (rule === 'fib') match = isFib(i);
      if (rule === 'multiple') match = i % val === 0;

      if (match) {
        gridState.set(i, selectedColor.value);
      }
    }
    applyGridState();
    updateStats();
  };
});

document.getElementById('clearBtn').onclick = () => {
  gridState.clear();
  applyGridState();
  gridStatus.textContent = 'Grid cleared. Pick or add a color to start again.';
  updateStats();
};

addColorBtn.onclick = addCustomColor;
saveBoardBtn.onclick = saveCurrentBoard;

saveNameInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    saveCurrentBoard();
  }
});

window.onmouseup = () => window.isDragging = false;

renderPalette();
updateBrushLabel();
initGrid();
updateStats();
renderSavedBoards();
