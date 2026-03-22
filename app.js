// Orbit Arcade home page does not require JavaScript yet.

const challengeRecipes = [
  { name: "Sunset Orange", drops: ["ruby", "sun"] },
  { name: "Meadow Pop", drops: ["sun", "mint"] },
  { name: "Jam Violet", drops: ["ruby", "lagoon"] },
  { name: "Sky Float", drops: ["lagoon", "cloud"] },
  { name: "Berry Milk", drops: ["ruby", "cloud", "cloud"] },
  { name: "Storm Truffle", drops: ["midnight", "cloud", "cloud"] },
  { name: "Peach Fizz", drops: ["ruby", "sun", "cloud"] },
  { name: "Ocean Candy", drops: ["lagoon", "mint"] },
  { name: "Moss Cookie", drops: ["sun", "mint", "midnight"] },
  { name: "Plum Pop", drops: ["ruby", "lagoon", "midnight"] },
  { name: "Sorbet Glow", drops: ["ruby", "sun", "cloud", "cloud"] },
  { name: "Moon Lagoon", drops: ["lagoon", "cloud", "cloud", "midnight"] },
  { name: "Coral Punch", drops: ["coral", "sun"] },
  { name: "Golden Peach", drops: ["coral", "honey", "cloud"] },
  { name: "Garden Jelly", drops: ["leaf", "mint"] },
  { name: "Sea Glass", drops: ["sky", "mint", "cloud"] },
  { name: "Lavender Soda", drops: ["violet", "cloud"] },
  { name: "Princess Frost", drops: ["bubblegum", "cloud"] },
  { name: "Royal Berry", drops: ["violet", "ruby"] },
  { name: "Blueberry Float", drops: ["lagoon", "violet", "cloud"] },
  { name: "Forest Glow", drops: ["leaf", "sun", "mint"] },
  { name: "Candy Sunrise", drops: ["bubblegum", "coral", "sun"] },
  { name: "Twilight Taffy", drops: ["violet", "bubblegum", "midnight"] },
  { name: "Aurora Mist", drops: ["sky", "violet", "cloud"] },
];

const maxDrops = 4;
const dropMix = [];
const unlockedRecipes = new Set();

let currentChallengeIndex = -1;
let score = 0;
let streak = 0;
let hintLevel = 0;
let audioEnabled = true;
let audioContext = null;

const paletteMap = Object.fromEntries(palette.map((color) => [color.id, color]));
const challenges = challengeRecipes.map((challenge) => ({
  ...challenge,
  targetRgb: averageColors(challenge.drops.map((id) => paletteMap[id].rgb)),
}));

const paletteButtons = document.querySelector("#paletteButtons");
const mixSlots = document.querySelector("#mixSlots");
const recipeBook = document.querySelector("#recipeBook");
const scoreValue = document.querySelector("#scoreValue");
const streakValue = document.querySelector("#streakValue");
const targetName = document.querySelector("#targetName");
const challengeTitle = document.querySelector("#challengeTitle");
const targetSwatch = document.querySelector("#targetSwatch");
const mixtureSurface = document.querySelector("#mixtureSurface");
const cauldronGlow = document.querySelector("#cauldronGlow");
const statusMessage = document.querySelector("#statusMessage");
const dropCounter = document.querySelector("#dropCounter");
const undoButton = document.querySelector("#undoButton");
const resetButton = document.querySelector("#resetButton");
const checkButton = document.querySelector("#checkButton");
const shuffleChallengeButton = document.querySelector("#shuffleChallengeButton");
const soundToggleButton = document.querySelector("#soundToggleButton");
const hintButton = document.querySelector("#hintButton");
const nextButton = document.querySelector("#nextButton");

const paletteButtonTemplate = document.querySelector("#paletteButtonTemplate");
const mixSlotTemplate = document.querySelector("#mixSlotTemplate");
const recipeCardTemplate = document.querySelector("#recipeCardTemplate");

function ensureAudioContext() {
  if (!audioEnabled) {
    return null;
  }

  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playTone({ frequency, duration = 0.16, type = "sine", volume = 0.05, delay = 0 }) {
  const context = ensureAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + delay;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

function playSound(effect) {
  if (!audioEnabled) {
    return;
  }

  switch (effect) {
    case "drop":
      playTone({ frequency: 420, duration: 0.08, type: "triangle", volume: 0.04 });
      playTone({ frequency: 560, duration: 0.12, type: "sine", volume: 0.025, delay: 0.04 });
      break;
    case "undo":
      playTone({ frequency: 350, duration: 0.09, type: "triangle", volume: 0.035 });
      playTone({ frequency: 260, duration: 0.12, type: "sine", volume: 0.025, delay: 0.05 });
      break;
    case "reset":
      playTone({ frequency: 520, duration: 0.08, type: "triangle", volume: 0.03 });
      playTone({ frequency: 390, duration: 0.1, type: "triangle", volume: 0.025, delay: 0.04 });
      playTone({ frequency: 280, duration: 0.12, type: "sine", volume: 0.02, delay: 0.08 });
      break;
    case "success":
      playTone({ frequency: 523.25, duration: 0.12, type: "triangle", volume: 0.05 });
      playTone({ frequency: 659.25, duration: 0.14, type: "triangle", volume: 0.045, delay: 0.08 });
      playTone({ frequency: 783.99, duration: 0.18, type: "sine", volume: 0.04, delay: 0.16 });
      break;
    case "warning":
      playTone({ frequency: 392, duration: 0.1, type: "square", volume: 0.02 });
      playTone({ frequency: 440, duration: 0.1, type: "square", volume: 0.018, delay: 0.09 });
      break;
    case "error":
      playTone({ frequency: 196, duration: 0.12, type: "sawtooth", volume: 0.02 });
      playTone({ frequency: 165, duration: 0.16, type: "sawtooth", volume: 0.018, delay: 0.08 });
      break;
    case "shuffle":
      playTone({ frequency: 466.16, duration: 0.08, type: "triangle", volume: 0.03 });
      playTone({ frequency: 587.33, duration: 0.11, type: "triangle", volume: 0.03, delay: 0.06 });
      break;
    case "hint":
      playTone({ frequency: 698.46, duration: 0.08, type: "triangle", volume: 0.028 });
      playTone({ frequency: 880, duration: 0.12, type: "sine", volume: 0.02, delay: 0.05 });
      break;
    default:
      break;
  }
}

function renderSoundToggle() {
  soundToggleButton.textContent = audioEnabled ? "Sound On" : "Sound Off";
  soundToggleButton.classList.toggle("is-muted", !audioEnabled);
}

function toggleSound() {
  audioEnabled = !audioEnabled;
  renderSoundToggle();

  if (audioEnabled) {
    ensureAudioContext();
    playSound("shuffle");
    setStatus("Sound feedback is on.");
    return;
  }

  setStatus("Sound feedback is off.");
}

function averageColors(colors) {
  const totals = colors.reduce(
    (result, color) => [result[0] + color[0], result[1] + color[1], result[2] + color[2]],
    [0, 0, 0]
  );

  return totals.map((value) => Math.round(value / colors.length));
}

function rgbToCss(rgb) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function isLightColor(rgb) {
  const luminance = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  return luminance > 175;
}

function mixtureGradient(rgb) {
  return `linear-gradient(180deg, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.95) 0%, rgba(${Math.max(
    rgb[0] - 32,
    0
  )}, ${Math.max(rgb[1] - 32, 0)}, ${Math.max(rgb[2] - 32, 0)}, 0.98) 100%)`;
}

function getCurrentMix() {
  if (!dropMix.length) {
    return [215, 219, 230];
  }

  return averageColors(dropMix.map((id) => paletteMap[id].rgb));
}

function getCurrentChallenge() {
  return challenges[currentChallengeIndex];
}

function getRandomChallengeIndex(excludedIndex = -1) {
  if (!challenges.length) {
    return -1;
  }

  if (challenges.length === 1) {
    return 0;
  }

  let nextIndex = excludedIndex;

  while (nextIndex === excludedIndex) {
    nextIndex = Math.floor(Math.random() * challenges.length);
  }

  return nextIndex;
}

function setStatus(message, tone = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";

  if (tone) {
    statusMessage.classList.add(`is-${tone}`);
  }
}

function renderPalette() {
  paletteButtons.innerHTML = "";

  palette.forEach((color) => {
    const fragment = paletteButtonTemplate.content.cloneNode(true);
    const button = fragment.querySelector("button");
    const [topline, bottomline] = button.querySelectorAll("span");

    button.dataset.colorId = color.id;
    button.style.background = color.background;
    topline.textContent = color.hint;
    bottomline.textContent = color.name;

    if (isLightColor(color.rgb)) {
      button.style.color = "#1f2231";
    } else {
      button.style.color = "white";
    }

    button.addEventListener("click", () => addDrop(color.id));
    paletteButtons.appendChild(fragment);
  });
}

function renderMixSlots() {
  mixSlots.innerHTML = "";

  for (let index = 0; index < maxDrops; index += 1) {
    const fragment = mixSlotTemplate.content.cloneNode(true);
    const slot = fragment.querySelector(".mix-slot");
    const swatch = fragment.querySelector(".mix-slot-swatch");
    const name = fragment.querySelector(".mix-slot-name");
    const colorId = dropMix[index];

    if (colorId) {
      const color = paletteMap[colorId];
      slot.classList.add("is-filled");
      swatch.style.background = color.background;
      name.textContent = color.name;
      name.style.color = "#1f2231";
    } else {
      swatch.style.background = "rgba(94, 98, 117, 0.12)";
      name.textContent = "Empty";
      name.style.color = "#7d8193";
    }

    mixSlots.appendChild(fragment);
  }

  dropCounter.textContent = `${dropMix.length} / ${maxDrops} drops`;
}

function renderRecipeBook() {
  recipeBook.innerHTML = "";
  recipeBook.classList.toggle("is-empty", !unlockedRecipes.size);

  if (!unlockedRecipes.size) {
    const placeholder = document.createElement("p");
    placeholder.className = "recipe-placeholder";
    placeholder.textContent = "Unlock a recipe by matching the target shade.";
    recipeBook.appendChild(placeholder);
    return;
  }

  [...unlockedRecipes]
    .map((index) => challenges[index])
    .forEach((recipe) => {
      const fragment = recipeCardTemplate.content.cloneNode(true);
      const swatch = fragment.querySelector(".recipe-swatch");
      const title = fragment.querySelector(".recipe-card-title");
      const formula = fragment.querySelector(".recipe-card-formula");

      swatch.style.background = mixtureGradient(recipe.targetRgb);
      title.textContent = recipe.name;
      formula.textContent = recipe.drops.map((id) => paletteMap[id].name).join(" + ");
      recipeBook.appendChild(fragment);
    });
}

function renderChallenge() {
  const challenge = getCurrentChallenge();
  targetName.textContent = challenge.name;
  challengeTitle.textContent = `Mix ${challenge.name}`;
  targetSwatch.style.background = mixtureGradient(challenge.targetRgb);
  hintLevel = 0;
}

function renderMixture() {
  const rgb = getCurrentMix();
  const gradient = mixtureGradient(rgb);

  mixtureSurface.style.background = gradient;
  cauldronGlow.style.background = rgbToCss(rgb);
}

function updateScoreboard() {
  scoreValue.textContent = String(score);
  streakValue.textContent = String(streak);
}

function addDrop(colorId) {
  if (dropMix.length >= maxDrops) {
    setStatus("The bowl is full. Undo a drop or reset the recipe.", "warning");
    playSound("warning");
    return;
  }

  dropMix.push(colorId);
  renderMixSlots();
  renderMixture();
  setStatus(`Added ${paletteMap[colorId].name}. Keep mixing or check the shade.`);
  playSound("drop");
}

function undoDrop() {
  if (!dropMix.length) {
    setStatus("There is nothing to undo yet.", "warning");
    playSound("warning");
    return;
  }

  const removed = dropMix.pop();
  renderMixSlots();
  renderMixture();
  setStatus(`Removed ${paletteMap[removed].name}.`);
  playSound("undo");
}

function resetMix({ silent = false } = {}) {
  dropMix.length = 0;
  renderMixSlots();
  renderMixture();
  setStatus("The bowl is clean. Start a new recipe.");

  if (!silent) {
    playSound("reset");
  }
}

function calculateDistance(a, b) {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) + Math.pow(a[2] - b[2], 2)
  );
}

function celebrateSuccess() {
  [mixtureSurface, targetSwatch, scoreValue].forEach((element) => {
    element.classList.remove("is-celebrating");
    void element.offsetWidth;
    element.classList.add("is-celebrating");
  });
}

function advanceChallenge() {
  currentChallengeIndex = getRandomChallengeIndex(currentChallengeIndex);
  renderChallenge();
  resetMix({ silent: true });
}

function getRecipeHint(challenge, level) {
  const recipeNames = challenge.drops.map((id) => paletteMap[id].name);

  if (level <= 1) {
    return `Hint: this recipe uses ${challenge.drops.length} drops and starts with ${recipeNames[0]}.`;
  }

  if (level === 2) {
    const revealed = recipeNames.slice(0, Math.min(2, recipeNames.length)).join(" + ");
    return `Hint: begin with ${revealed}.`;
  }

  return `Hint recipe: ${recipeNames.join(" + ")}.`;
}

function showHint() {
  const challenge = getCurrentChallenge();
  hintLevel = Math.min(hintLevel + 1, 3);
  setStatus(getRecipeHint(challenge, hintLevel), "warning");
  playSound("hint");
}

function goToNextChallenge() {
  advanceChallenge();
  setStatus("Skipped to the next order card.");
  playSound("shuffle");
}

function pickRandomChallenge() {
  currentChallengeIndex = getRandomChallengeIndex(currentChallengeIndex);
  renderChallenge();
  resetMix({ silent: true });
  setStatus("Fresh order card loaded. Mix the new target shade.");
  playSound("shuffle");
}

function checkMix() {
  if (!dropMix.length) {
    setStatus("Add at least one color before checking the bowl.", "warning");
    playSound("warning");
    return;
  }

  const challenge = getCurrentChallenge();
  const currentMix = getCurrentMix();
  const distance = calculateDistance(currentMix, challenge.targetRgb);

  if (distance <= 18) {
    score += 10;
    streak += 1;
    unlockedRecipes.add(currentChallengeIndex);
    updateScoreboard();
    renderRecipeBook();
    celebrateSuccess();
    setStatus(`Perfect mix! ${challenge.name} is now in your recipe book.`, "success");
    playSound("success");

    window.setTimeout(() => {
      advanceChallenge();
      setStatus("New order ready. See if you can keep the streak going.");
    }, 700);

    return;
  }

  streak = 0;
  updateScoreboard();

  if (distance <= 42) {
    setStatus("Close. Try adding Cloud to soften it, or Midnight to deepen it.", "warning");
    playSound("warning");
    return;
  }

  setStatus("That recipe is far from the target. Reset and test a new combination.", "error");
  playSound("error");
}

undoButton.addEventListener("click", undoDrop);
resetButton.addEventListener("click", resetMix);
checkButton.addEventListener("click", checkMix);
shuffleChallengeButton.addEventListener("click", pickRandomChallenge);
soundToggleButton.addEventListener("click", toggleSound);
hintButton.addEventListener("click", showHint);
nextButton.addEventListener("click", goToNextChallenge);

currentChallengeIndex = getRandomChallengeIndex();

renderPalette();
renderMixSlots();
renderRecipeBook();
renderChallenge();
renderMixture();
updateScoreboard();
renderSoundToggle();