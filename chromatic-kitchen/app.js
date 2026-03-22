const palette = [
  { id: "ruby", name: "Ruby", hint: "warm spark", rgb: [245, 62, 73], background: "linear-gradient(135deg, #ff7185 0%, #e42c3d 100%)" },
  { id: "coral", name: "Coral", hint: "peach glow", rgb: [255, 132, 93], background: "linear-gradient(135deg, #ffb095 0%, #ff6f47 100%)" },
  { id: "sun", name: "Sun", hint: "bright glow", rgb: [255, 207, 61], background: "linear-gradient(135deg, #ffe17a 0%, #ffb900 100%)" },
  { id: "honey", name: "Honey", hint: "gold drip", rgb: [235, 173, 59], background: "linear-gradient(135deg, #f6d17e 0%, #d9971b 100%)" },
  { id: "mint", name: "Mint", hint: "fresh twist", rgb: [78, 220, 170], background: "linear-gradient(135deg, #92f0cf 0%, #28c189 100%)" },
  { id: "leaf", name: "Leaf", hint: "garden pop", rgb: [76, 180, 83], background: "linear-gradient(135deg, #91d68f 0%, #339645 100%)" },
  { id: "lagoon", name: "Lagoon", hint: "cool splash", rgb: [65, 117, 255], background: "linear-gradient(135deg, #86a6ff 0%, #3560ec 100%)" },
  { id: "sky", name: "Sky", hint: "airy tint", rgb: [102, 194, 255], background: "linear-gradient(135deg, #aee2ff 0%, #4db8ff 100%)" },
  { id: "violet", name: "Violet", hint: "jam swirl", rgb: [143, 93, 222], background: "linear-gradient(135deg, #c5a6ff 0%, #6e3ed5 100%)" },
  { id: "bubblegum", name: "Bubblegum", hint: "sweet blush", rgb: [255, 154, 198], background: "linear-gradient(135deg, #ffd1e4 0%, #ff77b3 100%)" },
  { id: "cloud", name: "Cloud", hint: "soften mix", rgb: [250, 248, 239], background: "linear-gradient(135deg, #ffffff 0%, #e8e3db 100%)" },
  { id: "midnight", name: "Midnight", hint: "deep shadow", rgb: [39, 42, 60], background: "linear-gradient(135deg, #4e536c 0%, #181b28 100%)" },
];

const challengeRecipes = [
  { name: "Sunset Orange", formula: ["ruby", "sun"] },
  { name: "Grape Soda", formula: ["ruby", "lagoon"] },
  { name: "Forest Green", formula: ["sun", "lagoon", "midnight"] },
  { name: "Cotton Candy", formula: ["ruby", "cloud", "cloud"] },
  { name: "Peachy Keen", formula: ["coral", "cloud"] },
  { name: "Deep Sea", formula: ["lagoon", "midnight"] },
  { name: "Spring Bud", formula: ["mint", "sun"] },
  { name: "Electric Lime", formula: ["mint", "leaf", "sun"] },
  { name: "Midnight Sky", formula: ["sky", "midnight", "midnight"] },
  { name: "Berry Smoothie", formula: ["ruby", "violet", "cloud"] },
  { name: "Teal Glow", formula: ["mint", "lagoon"] },
  { name: "Icy Blue", formula: ["sky", "cloud", "cloud"] },
  { name: "Golden Aura", formula: ["sun", "honey", "cloud"] },
  { name: "Plum Jam", formula: ["ruby", "violet", "midnight"] },
];

let currentMix = [];
let score = 0;
let streak = 0;
let discoveredRecipes = new Set();
let currentChallengeIndex = 0;
let audioContext = null;
let isMuted = false;
let hintLevel = 0;
let sparkleTimeout = null;

function averageColors(colors) {
  if (colors.length === 0) return [200, 205, 220];
  const sums = colors.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
  return sums.map(s => Math.round(s / colors.length));
}

function rgbToCss(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function isLightColor(rgb) {
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return brightness > 155;
}

function mixtureGradient(colors) {
  if (colors.length === 0) return "linear-gradient(180deg, #d7dbe6 0%, #9ea8be 100%)";
  const avg = averageColors(colors);
  const colorStr = rgbToCss(avg);
  return `linear-gradient(180deg, ${colorStr} 0%, ${rgbToCss(avg.map(v => Math.max(0, v - 40)))} 100%)`;
}

function toCounts(items) {
  return items.reduce((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function formatColorList(ids) {
  const names = ids.map(id => palette.find(p => p.id === id)?.name || id);
  if (names.length === 0) return "nothing";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function analyzeCurrentMix() {
  const recipe = challengeRecipes[currentChallengeIndex];
  const recipeCounts = toCounts(recipe.formula);
  const mixIds = currentMix.map(color => color.id);
  const mixCounts = toCounts(mixIds);
  const missing = [];
  const extra = [];
  const matched = [];

  Object.entries(recipeCounts).forEach(([id, neededCount]) => {
    const usedCount = mixCounts[id] || 0;
    const keptCount = Math.min(neededCount, usedCount);
    const missingCount = Math.max(0, neededCount - usedCount);

    for (let index = 0; index < keptCount; index += 1) {
      matched.push(id);
    }

    for (let index = 0; index < missingCount; index += 1) {
      missing.push(id);
    }
  });

  Object.entries(mixCounts).forEach(([id, mixCount]) => {
    const allowedCount = recipeCounts[id] || 0;
    const extraCount = Math.max(0, mixCount - allowedCount);
    for (let index = 0; index < extraCount; index += 1) {
      extra.push(id);
    }
  });

  return {
    recipe,
    mixIds,
    missing,
    extra,
    matched,
  };
}

function setStatus(msg, type = "") {
  const el = document.getElementById("statusMessage");
  el.textContent = msg;
  el.className = "status-message " + (type ? `is-${type}` : "");
}

function renderPalette() {
  const container = document.getElementById("paletteButtons");
  const template = document.getElementById("paletteButtonTemplate");
  container.innerHTML = "";

  palette.forEach(color => {
    const btn = template.content.cloneNode(true).querySelector(".palette-button");
    btn.style.background = color.background;
    btn.querySelector(".palette-topline").textContent = color.hint;
    btn.querySelector(".palette-bottomline").textContent = color.name;
    if (isLightColor(color.rgb)) btn.style.color = "#1a1a2e";
    btn.onclick = () => addDrop(color);
    container.appendChild(btn);
  });
}

function renderMixSlots() {
  const container = document.getElementById("mixSlots");
  const template = document.getElementById("mixSlotTemplate");
  const counter = document.getElementById("dropCounter");
  container.innerHTML = "";

  for (let i = 0; i < 4; i++) {
    const slot = template.content.cloneNode(true).querySelector(".mix-slot");
    if (currentMix[i]) {
      slot.classList.add("is-filled");
      const swatch = slot.querySelector(".mix-slot-swatch");
      swatch.style.background = currentMix[i].background;
      slot.querySelector(".mix-slot-name").textContent = currentMix[i].name;
    } else {
      slot.querySelector(".mix-slot-name").textContent = "Empty";
    }
    container.appendChild(slot);
  }
  counter.textContent = `${currentMix.length} / 4 drops`;
}

function renderRecipeBook() {
  const container = document.getElementById("recipeBook");
  const template = document.getElementById("recipeCardTemplate");
  container.innerHTML = "";

  if (discoveredRecipes.size === 0) {
    container.innerHTML = `<p class="recipe-placeholder">Match your first target to unlock a recipe card here!</p>`;
    container.classList.add("is-empty");
  } else {
    container.classList.remove("is-empty");
    discoveredRecipes.forEach(idx => {
      const recipe = challengeRecipes[idx];
      const card = template.content.cloneNode(true).querySelector(".recipe-card");
      const avg = averageColors(recipe.formula.map(id => palette.find(p => p.id === id).rgb));
      card.querySelector(".recipe-swatch").style.background = rgbToCss(avg);
      card.querySelector(".recipe-card-title").textContent = recipe.name;
      card.querySelector(".recipe-card-formula").textContent = recipe.formula.map(id => palette.find(p => p.id === id).name).join(" + ");
      container.appendChild(card);
    });
  }
}

function getRandomChallengeIndex(excludedIndex = -1) {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * challengeRecipes.length);
    } while (newIndex === excludedIndex && challengeRecipes.length > 1);
    return newIndex;
}

function renderChallenge() {
  const challenge = challengeRecipes[currentChallengeIndex];
  const targetRgb = averageColors(challenge.formula.map(id => palette.find(p => p.id === id).rgb));
  document.getElementById("targetName").textContent = challenge.name;
  document.getElementById("targetSwatch").style.background = rgbToCss(targetRgb);
  document.getElementById("challengeTitle").textContent = `Mix ${challenge.name}`;
  hintLevel = 0;
}

function renderMixture() {
  const surface = document.getElementById("mixtureSurface");
  const glow = document.getElementById("cauldronGlow");
  const rgbs = currentMix.map(c => c.rgb);
  surface.style.background = mixtureGradient(rgbs);
  
  if (currentMix.length > 0) {
    const avg = averageColors(rgbs);
    glow.style.background = rgbToCss(avg);
    glow.style.opacity = "0.6";
  } else {
    glow.style.opacity = "0";
  }
}

function addDrop(color) {
  if (currentMix.length >= 4) {
    setStatus("The bowl is full!", "warning");
    playSound("warning");
    return;
  }
  currentMix.push(color);
  hintLevel = 0;
  renderMixSlots();
  renderMixture();
  playSound("drop", 1 + currentMix.length * 0.1);
  if (currentMix.length === 1) setStatus("Keep going!");
}

function undoDrop() {
  if (currentMix.length === 0) return;
  currentMix.pop();
  hintLevel = 0;
  renderMixSlots();
  renderMixture();
  playSound("undo");
  setStatus("Last drop removed.");
}

function resetMix({ silent = false } = {}) {
  currentMix = [];
  hintLevel = 0;
  renderMixSlots();
  renderMixture();
  if (!silent) {
    playSound("reset");
    setStatus("Bowl cleared. Ready for a new mix!");
  }
}

function calculateDistance(rgb1, rgb2) {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

function checkMix() {
  if (currentMix.length === 0) {
    setStatus("Add some paint first!", "warning");
    playSound("warning");
    return;
  }

  const challenge = challengeRecipes[currentChallengeIndex];
  const targetRgb = averageColors(challenge.formula.map(id => palette.find(p => p.id === id).rgb));
  const currentRgb = averageColors(currentMix.map(c => c.rgb));
  
  const distance = calculateDistance(targetRgb, currentRgb);
  
  if (distance < 15) {
    celebrateSuccess();
  } else {
    streak = 0;
    updateScoreboard();
    setStatus("Not quite! Try a different combination.", "error");
    playSound("error");
  }
}

function celebrateSuccess() {
  score += 100 + (streak * 20);
  streak++;
  discoveredRecipes.add(currentChallengeIndex);
  
  updateScoreboard();
  renderRecipeBook();
  setStatus("Perfect Match! You unlocked the card!", "success");
  playSound("success");
  showSuccessBurst();

  const panel = document.querySelector(".cauldron-panel");
  panel.classList.add("is-celebrating");
  setTimeout(() => panel.classList.remove("is-celebrating"), 600);

  setTimeout(() => {
    advanceChallenge();
  }, 1800);
}

function advanceChallenge() {
    currentChallengeIndex = getRandomChallengeIndex(currentChallengeIndex);
    resetMix({ silent: true });
    renderChallenge();
    setStatus("New challenge ready!");
}

function updateScoreboard() {
  document.getElementById("scoreValue").textContent = score;
  document.getElementById("streakValue").textContent = streak;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, type, duration, volume) {
  if (isMuted) return;
  ensureAudioContext();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioContext.destination);
  
  osc.start();
  osc.stop(audioContext.currentTime + duration);
}

function playSound(action, pitchScale = 1) {
  switch(action) {
    case 'drop':
      playTone(200 * pitchScale, 'sine', 0.2, 0.3);
      break;
    case 'undo':
      playTone(150, 'sine', 0.15, 0.2);
      break;
    case 'reset':
      playTone(100, 'sawtooth', 0.3, 0.1);
      break;
    case 'success':
      playTone(392, 'triangle', 0.14, 0.18);
      setTimeout(() => playTone(523.25, 'triangle', 0.16, 0.2), 90);
      setTimeout(() => playTone(659.25, 'triangle', 0.18, 0.22), 180);
      setTimeout(() => playTone(783.99, 'triangle', 0.22, 0.2), 280);
      setTimeout(() => playTone(1046.5, 'sine', 0.5, 0.12), 360);
      setTimeout(() => playTone(1318.5, 'sine', 0.45, 0.08), 390);
      break;
    case 'error':
      playTone(120, 'square', 0.4, 0.1);
      break;
    case 'warning':
      playTone(300, 'sine', 0.1, 0.2);
      break;
    case 'shuffle':
      playTone(400, 'sine', 0.05, 0.1);
      setTimeout(() => playTone(500, 'sine', 0.05, 0.1), 50);
      break;
  }
}

function showSuccessBurst() {
  const burst = document.getElementById("successBurst");
  if (!burst) return;

  if (sparkleTimeout) {
    clearTimeout(sparkleTimeout);
  }

  burst.innerHTML = "";

  for (let index = 0; index < 18; index += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${8 + Math.random() * 84}%`;
    sparkle.style.top = `${12 + Math.random() * 66}%`;
    sparkle.style.setProperty("--sparkle-delay", `${Math.random() * 160}ms`);
    sparkle.style.setProperty("--sparkle-drift-x", `${-70 + Math.random() * 140}px`);
    sparkle.style.setProperty("--sparkle-drift-y", `${-90 - Math.random() * 90}px`);
    sparkle.style.setProperty("--sparkle-rotate", `${Math.random() * 220}deg`);
    burst.appendChild(sparkle);
  }

  burst.classList.remove("is-active");
  void burst.offsetWidth;
  burst.classList.add("is-active");

  sparkleTimeout = setTimeout(() => {
    burst.classList.remove("is-active");
    burst.innerHTML = "";
  }, 1200);
}

function toggleSound() {
  isMuted = !isMuted;
  const btn = document.getElementById("soundToggleButton");
  btn.textContent = isMuted ? "Sound Off" : "Sound On";
  btn.classList.toggle("is-muted", isMuted);
}

function getRecipeHint() {
  const { recipe, missing, extra, matched } = analyzeCurrentMix();
  const uniqueRecipeColors = [...new Set(recipe.formula)];

  if (hintLevel === 0) {
    if (currentMix.length === 0) {
      return `${recipe.name} needs ${recipe.formula.length} drops. Use colors from ${formatColorList(uniqueRecipeColors)}.`;
    }

    if (extra.length > 0 && missing.length > 0) {
      return `Good start: ${matched.length} right. Remove ${formatColorList(extra)} and add ${formatColorList(missing)}.`;
    }

    if (missing.length > 0) {
      return `Good start: ${matched.length} right. Add ${formatColorList(missing)} next.`;
    }

    if (extra.length > 0) {
      return `Almost there. Remove ${formatColorList(extra)} and check again.`;
    }

    return `That mix has all the right colors. Try Check Mix.`;
  }

  if (hintLevel === 1) {
    const recipeNames = recipe.formula.map(id => palette.find(p => p.id === id).name);
    return `Recipe pattern: ${recipeNames.join(" + ")}. Watch for repeated colors.`;
  }

  return `Exact recipe: ${recipe.formula.map(id => palette.find(p => p.id === id).name).join(", ")}.`;
}

function showHint() {
  hintLevel += 1;
    setStatus(getRecipeHint(), "warning");
    playSound("warning");
}

function goToNextChallenge() {
    currentChallengeIndex = getRandomChallengeIndex(currentChallengeIndex);
    resetMix({ silent: true });
    renderChallenge();
    setStatus("Skipped! Here is a new one.");
    playSound("shuffle");
}

function pickRandomChallenge() {
    currentChallengeIndex = getRandomChallengeIndex(currentChallengeIndex);
    resetMix({ silent: true });
    renderChallenge();
    setStatus("New order received!");
    playSound("shuffle");
}

document.getElementById("undoButton").onclick = undoDrop;
document.getElementById("resetButton").onclick = () => resetMix();
document.getElementById("checkButton").onclick = checkMix;
document.getElementById("soundToggleButton").onclick = toggleSound;
document.getElementById("hintButton").onclick = showHint;
document.getElementById("nextButton").onclick = goToNextChallenge;
document.getElementById("shuffleChallengeButton").onclick = pickRandomChallenge;

// Initial Setup
currentChallengeIndex = getRandomChallengeIndex();
renderPalette();
renderMixSlots();
renderChallenge();
renderRecipeBook();
updateScoreboard();
