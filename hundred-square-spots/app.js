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

const grid = document.getElementById('hundredGrid');
const palette = document.getElementById('palette');
const statsList = document.getElementById('statsList');
const customColorInput = document.getElementById('customColorInput');
const addColorBtn = document.getElementById('addColorBtn');
const brushLabel = document.getElementById('brushLabel');
const gridStatus = document.getElementById('gridStatus');

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
    tile.textContent = i;
    tile.dataset.num = i;

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
  const tile = grid.querySelector(`[data-num="${num}"]`);
  const existing = gridState.get(num);

  if (existing === selectedColor.value) {
    if (!onlyAdd) {
      gridState.delete(num);
      tile.style.background = "";
      tile.classList.remove('pushed');
    }
  } else {
    gridState.set(num, selectedColor.value);
    tile.style.background = selectedColor.value;
    tile.classList.add('pushed');
  }
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
        const tile = grid.querySelector(`[data-num="${i}"]`);
        gridState.set(i, selectedColor.value);
        tile.style.background = selectedColor.value;
        tile.classList.add('pushed');
      }
    }
    updateStats();
  };
});

document.getElementById('clearBtn').onclick = () => {
  gridState.clear();
  document.querySelectorAll('.grid-tile').forEach(t => {
    t.style.background = "";
    t.classList.remove('pushed');
  });
  gridStatus.textContent = 'Grid cleared. Pick or add a color to start again.';
  updateStats();
};

addColorBtn.onclick = addCustomColor;

window.onmouseup = () => window.isDragging = false;

renderPalette();
updateBrushLabel();
initGrid();
updateStats();
