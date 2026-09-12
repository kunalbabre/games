const BLOCKS = [
  { number: 1, name: "Red Brick" },
  { number: 2, name: "Golden Wood" },
  { number: 3, name: "Blue Glass" },
  { number: 4, name: "Green Garden" },
  { number: 5, name: "Rose Roof" },
  { number: 6, name: "Gray Stone" },
];

const MISSIONS = [
  {
    name: "Tiny Cottage",
    description: "Build a bright starter home with a rose roof and blue windows.",
    rows: [
      "000005500000",
      "000055550000",
      "000555555000",
      "005555555500",
      "002222222200",
      "002332332200",
      "002222222200",
      "002221122200",
      "004444444400",
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
];

const STORAGE_KEY = "number-block-house:progress";

let currentMissionIndex = 0;
let selectedBlock = 1;
let placedCells = new Set();
let score = 0;
let streak = 0;
let mistakes = 0;
let hintsUsed = 0;
let audioEnabled = true;
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
const starValue = document.querySelector("#starValue");
const statusMessage = document.querySelector("#statusMessage");
const hintButton = document.querySelector("#hintButton");
const resetButton = document.querySelector("#resetButton");
const nextButton = document.querySelector("#nextButton");
const soundButton = document.querySelector("#soundButton");
const completionDialog = document.querySelector("#completionDialog");
const completionMessage = document.querySelector("#completionMessage");
const earnedStars = document.querySelector("#earnedStars");
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

function selectBlock(number) {
  selectedBlock = Number(number);
  const block = getBlock(selectedBlock);
  selectedLabel.textContent = `Selected: Block ${block.number} - ${block.name}`;

  document.querySelectorAll(".palette-block").forEach((button) => {
    const isSelected = Number(button.dataset.number) === selectedBlock;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  playSound("select");
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

  selectBlock(selectedBlock);
}

function renderMissionButtons() {
  const progress = loadProgress();
  missionButtons.innerHTML = "";

  MISSIONS.forEach((mission, index) => {
    const stars = Number(progress.missionStars[index]) || 0;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mission-button";
    button.classList.toggle("is-active", index === currentMissionIndex);
    button.setAttribute("aria-pressed", String(index === currentMissionIndex));
    button.innerHTML = `
      <span class="mission-number">${index + 1}</span>
      <span>
        <strong>${mission.name}</strong>
        <span>${stars} / 3 stars</span>
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

  progressText.textContent = `${placed} / ${total}`;
  progressBar.style.width = `${percentage}%`;
  progressTrack.setAttribute("aria-valuenow", String(percentage));
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
      } else {
        const block = getBlock(value);
        cell.setAttribute(
          "aria-label",
          `Empty blueprint square. Needs block ${block.number}, ${block.name}`
        );
        cell.innerHTML = `<span class="cell-number">${value}</span>`;
        cell.addEventListener("click", () => placeBlock(cell));
      }

      buildGrid.appendChild(cell);
    });
  });

  updateProgress();
}

function placeBlock(cell) {
  if (cell.classList.contains("is-filled")) {
    setStatus("That block is already in place. Choose another numbered square.");
    return;
  }

  const target = Number(cell.dataset.target);
  if (target !== selectedBlock) {
    mistakes += 1;
    streak = 0;
    score = Math.max(0, score - 1);
    cell.classList.remove("is-wrong");
    void cell.offsetWidth;
    cell.classList.add("is-wrong");
    window.setTimeout(() => cell.classList.remove("is-wrong"), 260);
    setStatus(`Try again. This square needs block ${target}.`, "warning");
    updateScoreboard();
    playSound("wrong");
    return;
  }

  const index = Number(cell.dataset.index);
  placedCells.add(index);
  streak += 1;
  score += 5 + Math.min(streak - 1, 5);
  cell.classList.remove("is-hinted");
  cell.classList.add("is-filled", `block-${target}`);
  cell.disabled = true;
  cell.setAttribute("aria-label", `Placed block ${target}`);
  setStatus(`Block ${target} placed. Keep building!`, "success");
  updateProgress();
  updateScoreboard();
  playSound("place");

  if (placedCells.size === getTargetCells().length) {
    completeMission();
  }
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
      ? "Perfect match! Every color and number was placed correctly."
      : `You earned ${stars} star${stars === 1 ? "" : "s"}. Replay to improve your build.`;
  completionDialog.hidden = false;
  continueButton.focus();
  setStatus("House complete! Choose the next blueprint or replay this one.", "success");
  playSound("complete");
}

function showHint() {
  const openCell = [...document.querySelectorAll(".build-cell:not(.is-air):not(.is-filled)")][0];
  if (!openCell) {
    setStatus("The house is already complete.", "success");
    return;
  }

  document.querySelectorAll(".build-cell.is-hinted").forEach((cell) => {
    cell.classList.remove("is-hinted");
  });

  hintsUsed += 1;
  score = Math.max(0, score - 2);
  const target = Number(openCell.dataset.target);
  selectBlock(target);
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
  mistakes = 0;
  hintsUsed = 0;
  nextButton.disabled = true;
  completionDialog.hidden = true;

  const mission = getMission();
  missionName.textContent = mission.name;
  missionDescription.textContent = mission.description;
  renderMissionButtons();
  renderGrid();
  updateScoreboard();
  selectBlock(1);
  setStatus("Choose a numbered block, then place it on the matching square.");
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

hintButton.addEventListener("click", showHint);
resetButton.addEventListener("click", () => startMission(currentMissionIndex));
nextButton.addEventListener("click", goToNextMission);
continueButton.addEventListener("click", () => {
  completionDialog.hidden = true;
  nextButton.focus();
});
soundButton.addEventListener("click", toggleSound);

document.addEventListener("keydown", (event) => {
  const number = Number(event.key);
  if (number >= 1 && number <= BLOCKS.length) {
    selectBlock(number);
  }

  if (event.key === "Escape" && !completionDialog.hidden) {
    completionDialog.hidden = true;
    nextButton.focus();
  }
});

renderPalette();
startMission(0);
