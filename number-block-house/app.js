const BLOCKS = [
  { number: 1, name: "Red Brick" },
  { number: 2, name: "Golden Wood" },
  { number: 3, name: "Blue Glass" },
  { number: 4, name: "Green Garden" },
  { number: 5, name: "Rose Roof" },
  { number: 6, name: "Gray Stone" },
];

const MATH_CODES = {
  1: ["2³-7", "9/3-2", "5-2²"],
  2: ["√16/2", "3²-7", "10/5"],
  3: ["2³-5", "15/5", "√81/3"],
  4: ["3²-5", "2³/2", "√16"],
  5: ["3²-4", "15/3", "√25"],
  6: ["2³-2", "3x2", "18/3"],
};

const MISSIONS = [
  {
    name: "Tiny Cottage",
    description: "Build a bright starter home with a rose roof and blue windows.",
    rows: [
      "000005500000",
      "000055550000",
      "000555555000",
      "005555555500",
      "055555555550",
      "062233223360",
      "062222222260",
      "062221122260",
      "044444444440",
    ],
  },
  {
    name: "Garden Cabin",
    description: "Add stone, a tall chimney, and a wide garden to this colorful cabin.",
    rows: [
      "000000006600",
      "000005556600",
      "000055555500",
      "000555555550",
      "006666666660",
      "006322223360",
      "006322112360",
      "006222112260",
      "044444444440",
    ],
  },
  {
    name: "Number Manor",
    description: "Use all six block types to finish the biggest blueprint.",
    rows: [
      "000055555000",
      "000555555500",
      "005555555550",
      "055555555555",
      "066666666660",
      "063223322360",
      "062223322260",
      "062211112260",
      "044444444440",
    ],
  },
  {
    name: "Design Lab",
    description: "Create your own structure. Turn on symmetry to build mirrored patterns.",
    freeBuild: true,
    rows: Array(9).fill("777777777777"),
  },
];

const STORAGE_KEY = "number-block-house:progress";
const POWER_TARGET = 6;
const MILESTONES = [25, 50, 75];
const BUILD_MESSAGES = [
  "Nice placement!",
  "The walls are growing!",
  "Great color match!",
  "Keep that combo going!",
  "Pixel-perfect building!",
];

let currentMissionIndex = 0;
let selectedBlock = 1;
let placedCells = new Set();
let score = 0;
let streak = 0;
let comboCharge = 0;
let mistakes = 0;
let hintsUsed = 0;
let elapsedSeconds = 0;
let timerStartedAt = null;
let timerInterval = null;
let earnedMilestones = new Set();
let mathModeEnabled = true;
let symmetryEnabled = false;
let effectsEnabled = false;
let audioEnabled = false;
let audioContext = null;

const buildGrid = document.querySelector("#buildGrid");
const blockPalette = document.querySelector("#blockPalette");
const missionButtons = document.querySelector("#missionButtons");
const missionName = document.querySelector("#missionName");
const missionDescription = document.querySelector("#missionDescription");
const selectedLabel = document.querySelector("#selectedLabel");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const progressTrack = document.querySelector("#progressTrack");
const scoreValue = document.querySelector("#scoreValue");
const streakValue = document.querySelector("#streakValue");
const timerValue = document.querySelector("#timerValue");
const starValue = document.querySelector("#starValue");
const statusMessage = document.querySelector("#statusMessage");
const comboLabel = document.querySelector("#comboLabel");
const comboBar = document.querySelector("#comboBar");
const milestoneList = document.querySelector("#milestoneList");
const particleLayer = document.querySelector("#particleLayer");
const hintButton = document.querySelector("#hintButton");
const resetButton = document.querySelector("#resetButton");
const mathModeButton = document.querySelector("#mathModeButton");
const symmetryButton = document.querySelector("#symmetryButton");
const eraseButton = document.querySelector("#eraseButton");
const powerButton = document.querySelector("#powerButton");
const powerBar = document.querySelector("#powerBar");
const powerLabel = document.querySelector("#powerLabel");
const powerBadge = document.querySelector("#powerBadge");
const powerCard = powerButton.closest(".power-card");
const nextButton = document.querySelector("#nextButton");
const soundButton = document.querySelector("#soundButton");
const effectsButton = document.querySelector("#effectsButton");
const completionDialog = document.querySelector("#completionDialog");
const completionMessage = document.querySelector("#completionMessage");
const earnedStars = document.querySelector("#earnedStars");
const finalTime = document.querySelector("#finalTime");
const finalScore = document.querySelector("#finalScore");
const continueButton = document.querySelector("#continueButton");

function loadProgress() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      totalStars: Number(stored.totalStars) || 0,
      missionStars: stored.missionStars || {},
    };
  } catch {
    return { totalStars: 0, missionStars: {} };
  }
}

function saveProgress(starsEarned) {
  const progress = loadProgress();
  const previousStars = Number(progress.missionStars[currentMissionIndex]) || 0;
  const bestStars = Math.max(previousStars, starsEarned);

  progress.missionStars[currentMissionIndex] = bestStars;
  progress.totalStars = Object.values(progress.missionStars).reduce(
    (total, value) => total + Number(value),
    0
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  starValue.textContent = String(progress.totalStars);
}

function getMission() {
  return MISSIONS[currentMissionIndex];
}

function isFreeBuild() {
  return Boolean(getMission().freeBuild);
}

function getTargetCells() {
  return getMission().rows
    .join("")
    .split("")
    .filter((value) => value !== "0");
}

function getBlock(number) {
  return BLOCKS.find((block) => block.number === Number(number));
}

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

function playTone(frequency, duration, delay = 0) {
  const context = ensureAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.035, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSound(type) {
  if (type === "place") {
    playTone(280 + selectedBlock * 45, 0.08);
  } else if (type === "wrong") {
    playTone(150, 0.12);
  } else if (type === "complete") {
    playTone(392, 0.12);
    playTone(523, 0.12, 0.1);
    playTone(659, 0.18, 0.2);
  } else if (type === "select") {
    playTone(220 + selectedBlock * 35, 0.06);
  } else if (type === "milestone") {
    playTone(440, 0.08);
    playTone(587, 0.12, 0.07);
  } else if (type === "power") {
    playTone(330, 0.08);
    playTone(494, 0.1, 0.06);
    playTone(740, 0.16, 0.12);
  }
}

function setStatus(message, tone = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status-message";
  if (tone) {
    statusMessage.classList.add(`is-${tone}`);
  }
}

function updateScoreboard() {
  scoreValue.textContent = String(score);
  streakValue.textContent = String(streak);
  starValue.textContent = String(loadProgress().totalStars);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function updateTimer() {
  if (timerStartedAt !== null) {
    elapsedSeconds = Math.floor((Date.now() - timerStartedAt) / 1000);
  }
  timerValue.textContent = formatTime(elapsedSeconds);
}

function startTimer() {
  if (timerStartedAt !== null) {
    return;
  }

  timerStartedAt = Date.now() - elapsedSeconds * 1000;
  timerInterval = window.setInterval(updateTimer, 250);
}

function stopTimer() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
  updateTimer();
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  timerStartedAt = null;
  updateTimer();
}

function updateComboMeter() {
  if (isFreeBuild()) {
    comboLabel.textContent = symmetryEnabled ? "Vertical symmetry" : "Creative mode";
    comboBar.style.width = "0%";
    powerBar.style.width = "0%";
    powerLabel.textContent = "Available in blueprints";
    powerBadge.textContent = "Creative";
    powerCard.classList.remove("is-ready");
    powerButton.disabled = true;
    return;
  }

  const percentage = Math.round((comboCharge / POWER_TARGET) * 100);
  comboLabel.textContent = `Combo x${streak}`;
  comboBar.style.width = `${percentage}%`;
  powerBar.style.width = `${percentage}%`;
  powerLabel.textContent = `${comboCharge} / ${POWER_TARGET} charged`;
  powerBadge.textContent = comboCharge >= POWER_TARGET ? "Ready" : "Locked";
  powerCard.classList.toggle("is-ready", comboCharge >= POWER_TARGET);
  powerButton.disabled = comboCharge < POWER_TARGET;
}

function selectBlock(number, { silent = false } = {}) {
  selectedBlock = Number(number);
  const block = getBlock(selectedBlock);
  selectedLabel.textContent = block
    ? `Selected: Block ${block.number} - ${block.name}`
    : "Selected: Eraser";

  document.querySelectorAll(".palette-block").forEach((button) => {
    const isSelected = Number(button.dataset.number) === selectedBlock;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  eraseButton.classList.toggle("is-selected", selectedBlock === 0);
  eraseButton.setAttribute("aria-pressed", String(selectedBlock === 0));

  if (!silent) {
    playSound("select");
  }
}

function renderPalette() {
  blockPalette.innerHTML = "";

  BLOCKS.forEach((block) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `palette-block block-${block.number}`;
    button.dataset.number = String(block.number);
    button.setAttribute("aria-label", `Choose block ${block.number}, ${block.name}`);
    button.innerHTML = `
      <span class="palette-number">${block.number}</span>
      <span class="palette-name">${block.name}</span>
    `;
    button.addEventListener("click", () => selectBlock(block.number));
    blockPalette.appendChild(button);
  });

  selectBlock(selectedBlock, { silent: true });
}

function renderMissionButtons() {
  const progress = loadProgress();
  missionButtons.innerHTML = "";

  MISSIONS.forEach((mission, index) => {
    const stars = Number(progress.missionStars[index]) || 0;
    const progressLabel = mission.freeBuild ? "Creative grid" : `${stars} / 3 stars`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-button";
    button.classList.toggle("is-active", index === currentMissionIndex);
    button.setAttribute("aria-pressed", String(index === currentMissionIndex));
    button.innerHTML = `
      <span class="mission-number">${index + 1}</span>
      <span>
        <strong>${mission.name}</strong>
        <span>${progressLabel}</span>
      </span>
    `;
    button.addEventListener("click", () => startMission(index));
    missionButtons.appendChild(button);
  });
}

function updateProgress() {
  const total = getTargetCells().length;
  const placed = placedCells.size;
  const percentage = total ? Math.round((placed / total) * 100) : 0;

  progressText.textContent = isFreeBuild() ? `${placed} blocks` : `${placed} / ${total}`;
  progressBar.style.width = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
  milestoneList.hidden = isFreeBuild();

  milestoneList.querySelectorAll("[data-milestone]").forEach((badge) => {
    badge.classList.toggle("is-earned", earnedMilestones.has(Number(badge.dataset.milestone)));
  });
}

function awardMilestone() {
  if (isFreeBuild()) {
    return "";
  }

  const total = getTargetCells().length;
  const percentage = Math.round((placedCells.size / total) * 100);
  const unlocked = MILESTONES.find(
    (milestone) => percentage >= milestone && !earnedMilestones.has(milestone)
  );

  if (!unlocked) {
    return "";
  }

  earnedMilestones.add(unlocked);
  score += 15;
  playSound("milestone");
  return `Supply drop unlocked at ${unlocked}%! Bonus 15 points.`;
}

function spawnBlockParticles(cell, blockNumber) {
  if (!effectsEnabled) {
    return;
  }

  const cellRect = cell.getBoundingClientRect();
  const layerRect = particleLayer.getBoundingClientRect();
  const centerX = cellRect.left - layerRect.left + cellRect.width / 2;
  const centerY = cellRect.top - layerRect.top + cellRect.height / 2;

  for (let index = 0; index < 8; index += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 8;
    const distance = 24 + Math.random() * 24;
    particle.className = `block-particle block-${blockNumber}`;
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-spin", `${120 + index * 35}deg`);
    particleLayer.appendChild(particle);
    window.setTimeout(() => particle.remove(), 650);
  }
}

function renderGrid() {
  buildGrid.innerHTML = "";

  getMission().rows.forEach((row, rowIndex) => {
    row.split("").forEach((value, columnIndex) => {
      const cellIndex = rowIndex * 12 + columnIndex;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "build-cell";
      cell.dataset.index = String(cellIndex);
      cell.dataset.target = value;
      cell.setAttribute("role", "gridcell");

      if (value === "0") {
        cell.classList.add("is-air");
        cell.disabled = true;
        cell.setAttribute("aria-hidden", "true");
      } else if (value === "7") {
        cell.classList.add("is-free");
        cell.setAttribute("aria-label", "Empty creative build square");
        cell.innerHTML = '<span class="cell-number">+</span>';
        cell.addEventListener("click", () => placeBlock(cell));
      } else {
        const block = getBlock(value);
        const clue = getCellClue(value, cellIndex);
        cell.setAttribute(
          "aria-label",
          mathModeEnabled
            ? `Solve ${clue} and place the answer block`
            : `Empty blueprint square. Needs block ${block.number}, ${block.name}`
        );
        cell.innerHTML = `<span class="cell-number">${clue}</span>`;
        cell.addEventListener("click", () => placeBlock(cell));
      }

      buildGrid.appendChild(cell);
    });
  });

  updateProgress();
}

function getCellClue(value, cellIndex) {
  if (!mathModeEnabled) {
    return value;
  }

  const clues = MATH_CODES[Number(value)];
  return clues[cellIndex % clues.length];
}

function refreshBlueprintClues() {
  if (isFreeBuild()) {
    return;
  }

  document.querySelectorAll(".build-cell:not(.is-air):not(.is-filled)").forEach((cell) => {
    const value = cell.dataset.target;
    const cellIndex = Number(cell.dataset.index);
    const clue = getCellClue(value, cellIndex);
    cell.querySelector(".cell-number").textContent = clue;
    cell.setAttribute(
      "aria-label",
      mathModeEnabled
        ? `Solve ${clue} and place the answer block`
        : `Empty blueprint square. Needs block ${value}, ${getBlock(value).name}`
    );
  });
}

function paintCreativeCell(cell) {
  const index = Number(cell.dataset.index);
  cell.classList.remove(
    "block-1",
    "block-2",
    "block-3",
    "block-4",
    "block-5",
    "block-6",
    "is-filled"
  );

  if (selectedBlock === 0) {
    placedCells.delete(index);
    cell.innerHTML = '<span class="cell-number">+</span>';
    cell.setAttribute("aria-label", "Empty creative build square");
    return;
  }

  const isNewBlock = !placedCells.has(index);
  placedCells.add(index);
  cell.classList.add("is-filled", `block-${selectedBlock}`);
  cell.innerHTML = `<span class="cell-number">${selectedBlock}</span>`;
  cell.setAttribute("aria-label", `Creative block ${selectedBlock}, ${getBlock(selectedBlock).name}`);
  if (isNewBlock) {
    score += 2;
  }
  spawnBlockParticles(cell, selectedBlock);
}

function placeCreativeBlock(cell) {
  startTimer();
  paintCreativeCell(cell);

  if (symmetryEnabled) {
    const index = Number(cell.dataset.index);
    const row = Math.floor(index / 12);
    const column = index % 12;
    const mirrorIndex = row * 12 + (11 - column);
    const mirrorCell = buildGrid.querySelector(`[data-index="${mirrorIndex}"]`);
    if (mirrorCell && mirrorCell !== cell) {
      paintCreativeCell(mirrorCell);
    }
  }

  updateProgress();
  updateScoreboard();
  setStatus(
    selectedBlock === 0
      ? "Block removed. Continue refining your design."
      : symmetryEnabled
        ? "Mirrored blocks placed. Keep extending the pattern."
        : "Block placed. Build any structure or number pattern you can imagine.",
    "success"
  );
  playSound(selectedBlock === 0 ? "wrong" : "place");
}

function placeBlock(cell) {
  if (isFreeBuild()) {
    placeCreativeBlock(cell);
    return;
  }

  if (cell.classList.contains("is-filled")) {
    setStatus("That block is already in place. Choose another numbered square.");
    return;
  }

  startTimer();
  const target = Number(cell.dataset.target);
  if (target !== selectedBlock) {
    mistakes += 1;
    streak = 0;
    comboCharge = Math.max(0, comboCharge - 2);
    score = Math.max(0, score - 1);
    cell.classList.remove("is-wrong");
    void cell.offsetWidth;
    cell.classList.add("is-wrong");
    window.setTimeout(() => cell.classList.remove("is-wrong"), 260);
    setStatus(`Try again. This square needs block ${target}.`, "warning");
    updateScoreboard();
    updateComboMeter();
    playSound("wrong");
    return;
  }

  fillCell(cell);
}

function fillCell(cell, { powered = false } = {}) {
  const target = Number(cell.dataset.target);
  const index = Number(cell.dataset.index);
  placedCells.add(index);

  if (powered) {
    score += 4;
  } else {
    streak += 1;
    comboCharge = Math.min(POWER_TARGET, comboCharge + 1);
    score += 5 + Math.min(streak - 1, 5);
  }

  cell.classList.remove("is-hinted");
  cell.classList.add("is-filled", `block-${target}`);
  cell.disabled = true;
  cell.setAttribute("aria-label", `Placed block ${target}`);
  spawnBlockParticles(cell, target);

  const milestoneMessage = awardMilestone();
  const message = BUILD_MESSAGES[(placedCells.size - 1) % BUILD_MESSAGES.length];
  setStatus(milestoneMessage || `${message} Block ${target} locked in.`, "success");
  updateProgress();
  updateScoreboard();
  updateComboMeter();

  if (!powered) {
    playSound("place");
  }

  if (placedCells.size === getTargetCells().length) {
    completeMission();
  }
}

function usePowerBuild() {
  if (comboCharge < POWER_TARGET || isFreeBuild()) {
    return;
  }

  startTimer();
  const openCells = [...document.querySelectorAll(".build-cell:not(.is-air):not(.is-filled)")];
  if (!openCells.length) {
    return;
  }

  let matchingCells = openCells.filter(
    (cell) => Number(cell.dataset.target) === selectedBlock
  );

  if (!matchingCells.length) {
    selectedBlock = Number(openCells[0].dataset.target);
    selectBlock(selectedBlock, { silent: true });
    matchingCells = openCells.filter(
      (cell) => Number(cell.dataset.target) === selectedBlock
    );
  }

  comboCharge = 0;
  streak = 0;
  matchingCells.slice(0, 3).forEach((cell) => fillCell(cell, { powered: true }));
  updateComboMeter();

  if (placedCells.size < getTargetCells().length) {
    setStatus(`Power Build placed ${Math.min(3, matchingCells.length)} blocks at once!`, "success");
  }
  playSound("power");
}

function calculateStars() {
  if (mistakes === 0 && hintsUsed === 0) {
    return 3;
  }
  if (mistakes <= 3 && hintsUsed <= 2) {
    return 2;
  }
  return 1;
}

function completeMission() {
  stopTimer();
  const stars = calculateStars();
  saveProgress(stars);
  renderMissionButtons();
  nextButton.disabled = false;
  earnedStars.innerHTML = "";

  for (let index = 0; index < 3; index += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.classList.toggle("is-earned", index < stars);
    earnedStars.appendChild(star);
  }

  completionMessage.textContent =
    stars === 3
      ? "Perfect build! Every math code and color pattern was accurate."
      : `You earned ${stars} star${stars === 1 ? "" : "s"}. Replay to improve your build.`;
  finalTime.textContent = formatTime(elapsedSeconds);
  finalScore.textContent = String(score);
  completionDialog.hidden = false;
  continueButton.focus();
  setStatus("House complete! Choose the next blueprint or replay this one.", "success");
  playSound("complete");
}

function showHint() {
  if (isFreeBuild()) {
    setStatus("Design Lab has no required pattern. Build freely or switch on symmetry.");
    return;
  }

  const openCell = [...document.querySelectorAll(".build-cell:not(.is-air):not(.is-filled)")][0];
  if (!openCell) {
    setStatus("The house is already complete.", "success");
    return;
  }

  startTimer();
  document.querySelectorAll(".build-cell.is-hinted").forEach((cell) => {
    cell.classList.remove("is-hinted");
  });

  hintsUsed += 1;
  score = Math.max(0, score - 2);
  const target = Number(openCell.dataset.target);
  selectBlock(target, { silent: true });
  openCell.classList.add("is-hinted");
  openCell.focus();
  setStatus(`Hint: place block ${target} on the glowing square.`);
  updateScoreboard();
}

function startMission(index) {
  currentMissionIndex = index;
  placedCells = new Set();
  score = 0;
  streak = 0;
  comboCharge = 0;
  mistakes = 0;
  hintsUsed = 0;
  earnedMilestones = new Set();
  symmetryEnabled = false;
  nextButton.disabled = true;
  completionDialog.hidden = true;
  resetTimer();

  const mission = getMission();
  missionName.textContent = mission.name;
  missionDescription.textContent = mission.description;
  mathModeButton.disabled = isFreeBuild();
  mathModeButton.textContent = mathModeEnabled ? "Math Codes On" : "Numbers On";
  symmetryButton.disabled = !isFreeBuild();
  symmetryButton.textContent = "Symmetry Off";
  eraseButton.disabled = !isFreeBuild();
  hintButton.disabled = isFreeBuild();
  renderMissionButtons();
  renderGrid();
  updateScoreboard();
  updateComboMeter();
  selectBlock(1, { silent: true });
  setStatus(
    isFreeBuild()
      ? "Creative mode: build freely, or turn on symmetry for mirrored patterns."
      : mathModeEnabled
        ? "Solve each expression, choose its answer block, and build the pattern."
        : "Match each visible number with its colored block."
  );
}

function goToNextMission() {
  startMission((currentMissionIndex + 1) % MISSIONS.length);
}

function toggleSound() {
  audioEnabled = !audioEnabled;
  soundButton.textContent = audioEnabled ? "Sound On" : "Sound Off";
  if (audioEnabled) {
    playSound("select");
  }
}

function toggleEffects() {
  effectsEnabled = !effectsEnabled;
  document.body.classList.toggle("effects-on", effectsEnabled);
  effectsButton.textContent = effectsEnabled ? "Effects On" : "Effects Off";
}

function toggleMathMode() {
  if (isFreeBuild()) {
    return;
  }

  mathModeEnabled = !mathModeEnabled;
  mathModeButton.textContent = mathModeEnabled ? "Math Codes On" : "Numbers On";
  refreshBlueprintClues();
  setStatus(
    mathModeEnabled
      ? "Math Codes are on. Solve each expression to choose the block."
      : "Number labels are on for a more relaxed build."
  );
}

function toggleSymmetry() {
  if (!isFreeBuild()) {
    return;
  }

  symmetryEnabled = !symmetryEnabled;
  symmetryButton.textContent = symmetryEnabled ? "Symmetry On" : "Symmetry Off";
  updateComboMeter();
  setStatus(
    symmetryEnabled
      ? "Vertical symmetry is on. Each block is mirrored across the center."
      : "Symmetry is off. Each click places one block."
  );
}

hintButton.addEventListener("click", showHint);
resetButton.addEventListener("click", () => startMission(currentMissionIndex));
mathModeButton.addEventListener("click", toggleMathMode);
symmetryButton.addEventListener("click", toggleSymmetry);
eraseButton.addEventListener("click", () => selectBlock(0));
powerButton.addEventListener("click", usePowerBuild);
nextButton.addEventListener("click", goToNextMission);
continueButton.addEventListener("click", () => {
  completionDialog.hidden = true;
  nextButton.focus();
});
soundButton.addEventListener("click", toggleSound);
effectsButton.addEventListener("click", toggleEffects);

document.addEventListener("keydown", (event) => {
  const number = Number(event.key);
  if (number >= 1 && number <= BLOCKS.length) {
    selectBlock(number);
  }

  if (number === 0 && isFreeBuild()) {
    selectBlock(0);
  }

  if (event.key === "Escape" && !completionDialog.hidden) {
    completionDialog.hidden = true;
    nextButton.focus();
  }
});

renderPalette();
startMission(0);
