/**
 * Fruit Slice Studio - Orbit Arcade
 * Interactive realistic fruit slicing with fractions, juicy physics, and procedural Web Audio.
 */

// --- Audio Synthesis Engine ---
class FruitAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // Blade swoosh through the air
  playWhoosh(intensity = 1.0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800 * intensity, now);
      filter.frequency.exponentialRampToValueAtTime(3200 * intensity, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18 * intensity, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.16);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Crunchy, juicy slice sound when cutting fruit
  playSlice(fruitType = "watermelon") {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Layer 1: Crisp crunch / chop
      const crunchOsc = this.ctx.createOscillator();
      const crunchGain = this.ctx.createGain();
      crunchOsc.type = "triangle";
      crunchOsc.frequency.setValueAtTime(240, now);
      crunchOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      crunchGain.gain.setValueAtTime(0.25, now);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      crunchOsc.connect(crunchGain);
      crunchGain.connect(this.ctx.destination);
      crunchOsc.start(now);
      crunchOsc.stop(now + 0.1);

      // Layer 2: Wet squish / juice burst
      const bufferSize = this.ctx.sampleRate * 0.12;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const wetNoise = this.ctx.createBufferSource();
      wetNoise.buffer = buffer;

      const wetFilter = this.ctx.createBiquadFilter();
      wetFilter.type = "lowpass";
      const cutFreq = fruitType === "grapes" ? 3800 : fruitType === "watermelon" ? 1800 : 2600;
      wetFilter.frequency.setValueAtTime(cutFreq, now);
      wetFilter.frequency.exponentialRampToValueAtTime(400, now + 0.12);

      const wetGain = this.ctx.createGain();
      wetGain.gain.setValueAtTime(0.3, now);
      wetGain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

      wetNoise.connect(wetFilter);
      wetFilter.connect(wetGain);
      wetGain.connect(this.ctx.destination);

      wetNoise.start(now);
      wetNoise.stop(now + 0.13);

      // Layer 3: Solid cutting board thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = "sine";
      thudOsc.frequency.setValueAtTime(110, now);
      thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

      thudGain.gain.setValueAtTime(0.35, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.14);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Grape pop / pluck sound
  playPop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Mission success chime
  playChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

// --- Fruit Catalog & Configurations ---
const FRUITS_CATALOG = {
  grapes: {
    id: "grapes",
    name: "Purple Grapes",
    emoji: "🍇",
    color: "#6b21a8",
    fleshColor: "#a855f7",
    rindColor: "#3b0764",
    juiceColor: "rgba(168, 85, 247, 0.45)",
    tag: "Juicy Cluster",
    factTitle: "Grapes (Vitis vinifera)",
    fact: "Grapes grow in clusters of 15 to 300 berries. They can be cut into smaller mini-bunches or sliced in half for healthy salads!",
    baseRadius: 110,
    isGrapeCluster: true,
  },
  watermelon: {
    id: "watermelon",
    name: "Watermelon",
    emoji: "🍉",
    color: "#ef4444",
    fleshColor: "#f87171",
    rindColor: "#15803d",
    rindInnerColor: "#ecfccb",
    juiceColor: "rgba(239, 68, 68, 0.5)",
    tag: "Sweet & Giant",
    factTitle: "Watermelon (Citrullus lanatus)",
    fact: "Watermelon is 92% water! Slicing it in halves (1/2), quarters (1/4), and wedges (1/8) makes sharing super easy.",
    baseRadius: 130,
    hasSeeds: true,
  },
  apple: {
    id: "apple",
    name: "Red Apple",
    emoji: "🍎",
    color: "#dc2626",
    fleshColor: "#fef9c3",
    rindColor: "#b91c1c",
    juiceColor: "rgba(254, 240, 138, 0.4)",
    tag: "Crisp & Crunchy",
    factTitle: "Red Apple (Malus domestica)",
    fact: "When cut in half horizontally, apple seed pockets form a natural 5-pointed star pattern!",
    baseRadius: 105,
    hasCore: true,
  },
  orange: {
    id: "orange",
    name: "Juicy Orange",
    emoji: "🍊",
    color: "#f97316",
    fleshColor: "#fb923c",
    rindColor: "#ea580c",
    rindInnerColor: "#ffedd5",
    juiceColor: "rgba(249, 115, 22, 0.45)",
    tag: "Citrus Slices",
    factTitle: "Orange (Citrus sinensis)",
    fact: "Oranges naturally grow in 10 to 12 segment wedges inside their peel, packed with Vitamin C.",
    baseRadius: 110,
    isCitrus: true,
  },
  strawberry: {
    id: "strawberry",
    name: "Strawberry",
    emoji: "🍓",
    color: "#e11d48",
    fleshColor: "#f43f5e",
    rindColor: "#be123c",
    juiceColor: "rgba(225, 29, 72, 0.4)",
    tag: "Berry Sweet",
    factTitle: "Strawberry (Fragaria ananassa)",
    fact: "Strawberries are the only fruit with seeds on the outside—around 200 tiny seeds per berry!",
    baseRadius: 95,
    isBerry: true,
  },
  kiwi: {
    id: "kiwi",
    name: "Emerald Kiwi",
    emoji: "🥝",
    color: "#84cc16",
    fleshColor: "#65a30d",
    rindColor: "#78350f",
    juiceColor: "rgba(132, 204, 22, 0.45)",
    tag: "Vibrant Core",
    factTitle: "Kiwifruit (Actinidia deliciosa)",
    fact: "Kiwi cross-sections reveal a creamy white core surrounded by tiny black edible seeds radiating outward like rays.",
    baseRadius: 95,
    isKiwi: true,
  },
  lemon: {
    id: "lemon",
    name: "Zesty Lemon",
    emoji: "🍋",
    color: "#eab308",
    fleshColor: "#fde047",
    rindColor: "#ca8a04",
    rindInnerColor: "#fef9c3",
    juiceColor: "rgba(234, 179, 8, 0.4)",
    tag: "Sour & Zesty",
    factTitle: "Lemon (Citrus limon)",
    fact: "Lemons are high in citric acid. Slicing lemons into 1/4 wedges or 1/8 wheels is popular for cooking and refreshing drinks.",
    baseRadius: 100,
    isCitrus: true,
  },
  pineapple: {
    id: "pineapple",
    name: "Golden Pineapple",
    emoji: "🍍",
    color: "#ca8a04",
    fleshColor: "#facc15",
    rindColor: "#854d0e",
    juiceColor: "rgba(250, 204, 21, 0.45)",
    tag: "Tropical Rings",
    factTitle: "Pineapple (Ananas comosus)",
    fact: "A single pineapple is actually a collection of many individual berries fused together around a central fibrous core!",
    baseRadius: 120,
    isPineapple: true,
  },
};

// Mission Targets for Fraction Quest
const FRACTION_MISSIONS = [
  { targetCount: 2, fractionName: "1/2 Halves", desc: "Cut the fruit across the center into 2 equal halves." },
  { targetCount: 4, fractionName: "1/4 Quarters", desc: "Slice across both ways to create 4 equal quarters." },
  { targetCount: 8, fractionName: "1/8 Wedges", desc: "Slice each quarter into 8 equal sharing wedges." },
];

// --- Main Game Class ---
class FruitSliceStudio {
  constructor() {
    this.audio = new FruitAudioEngine();
    this.canvas = document.getElementById("cuttingCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.splatterCanvas = document.getElementById("splatterCanvas");
    this.splatterCtx = this.splatterCanvas.getContext("2d");
    this.fractionPieCanvas = document.getElementById("fractionPieCanvas");
    this.pieCtx = this.fractionPieCanvas.getContext("2d");

    // Board Dimensions
    this.boardWidth = 900;
    this.boardHeight = 600;

    // State
    this.activeFruitId = "grapes";
    this.activeFruit = FRUITS_CATALOG.grapes;
    this.gameMode = "free"; // 'free' | 'mission'
    this.missionIndex = 0;
    this.knifeStyle = "chef"; // 'chef' | 'cleaver' | 'laser'
    this.showGuides = true;

    this.score = 0;
    this.streak = 0;
    this.totalSlices = 0;
    this.stars = 1;

    // Pieces on Board
    this.pieces = [];

    // Juice Splatters on board
    this.splatters = [];

    // Knife dragging state
    this.isDragging = false;
    this.dragStart = null;
    this.dragCurrent = null;
    this.knifeTrail = [];

    // Bindings
    this.initDOM();
    this.resetBoard();
    this.setupListeners();
    this.startAnimationLoop();
  }

  initDOM() {
    // Render Fruit Selector
    const selector = document.getElementById("fruitSelector");
    selector.innerHTML = "";
    Object.values(FRUITS_CATALOG).forEach((fruit) => {
      const btn = document.createElement("button");
      btn.className = `fruit-choice-btn ${fruit.id === this.activeFruitId ? "is-active" : ""}`;
      btn.dataset.fruitId = fruit.id;
      btn.type = "button";
      btn.innerHTML = `
        <span class="fruit-emoji">${fruit.emoji}</span>
        <span class="fruit-name">${fruit.name}</span>
        <span class="fruit-tag">${fruit.tag}</span>
      `;
      btn.addEventListener("click", () => this.selectFruit(fruit.id));
      selector.appendChild(btn);
    });

    this.updateFruitBadge();
    this.updateFruitFact();
  }

  selectFruit(fruitId) {
    if (!FRUITS_CATALOG[fruitId]) return;
    this.activeFruitId = fruitId;
    this.activeFruit = FRUITS_CATALOG[fruitId];

    // Update active button state
    document.querySelectorAll(".fruit-choice-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.fruitId === fruitId);
    });

    this.updateFruitBadge();
    this.updateFruitFact();
    this.resetBoard();
    this.audio.playPop();
  }

  updateFruitBadge() {
    document.getElementById("currentFruitIcon").textContent = this.activeFruit.emoji;
    document.getElementById("currentFruitName").textContent = this.activeFruit.name;
    this.updatePiecesUI();
  }

  updateFruitFact() {
    document.getElementById("fruitFactTitle").textContent = this.activeFruit.factTitle;
    document.getElementById("fruitFactText").textContent = this.activeFruit.fact;
  }

  resetBoard() {
    this.pieces = [];
    const centerX = this.boardWidth / 2;
    const centerY = this.boardHeight / 2;

    if (this.activeFruit.isGrapeCluster) {
      this.initGrapeCluster(centerX, centerY);
    } else {
      // Create initial whole fruit piece
      this.pieces.push({
        id: "piece-1",
        fruit: this.activeFruit,
        x: centerX,
        y: centerY,
        vx: 0,
        vy: 0,
        rotation: 0,
        vRot: 0,
        radius: this.activeFruit.baseRadius,
        fraction: 1.0, // 1 whole
        startAngle: 0,
        endAngle: Math.PI * 2,
        cutCount: 0,
      });
    }

    this.updatePiecesUI();
    this.renderFractionPie();
    this.clearSplatters();
    this.updateMissionCard();
  }

  // Generate a realistic cluster of grapes
  initGrapeCluster(cx, cy) {
    const grapeOffsets = [
      { x: 0, y: -40, r: 24, frac: 1 / 10 },
      { x: -30, y: -20, r: 23, frac: 1 / 10 },
      { x: 30, y: -20, r: 23, frac: 1 / 10 },
      { x: -50, y: 10, r: 22, frac: 1 / 10 },
      { x: 0, y: 5, r: 24, frac: 1 / 10 },
      { x: 50, y: 10, r: 22, frac: 1 / 10 },
      { x: -28, y: 40, r: 21, frac: 1 / 10 },
      { x: 28, y: 40, r: 21, frac: 1 / 10 },
      { x: 0, y: 65, r: 20, frac: 1 / 10 },
      { x: 0, y: 90, r: 18, frac: 1 / 10 },
    ];

    grapeOffsets.forEach((pos, idx) => {
      this.pieces.push({
        id: `grape-${idx}`,
        fruit: this.activeFruit,
        x: cx + pos.x,
        y: cy + pos.y,
        vx: 0,
        vy: 0,
        rotation: 0,
        vRot: 0,
        radius: pos.r,
        fraction: pos.frac,
        startAngle: 0,
        endAngle: Math.PI * 2,
        cutCount: 0,
        isGrapeBerry: true,
      });
    });
  }

  clearSplatters() {
    this.splatters = [];
    this.splatterCtx.clearRect(0, 0, this.boardWidth, this.boardHeight);
  }

  setupListeners() {
    // Mode Buttons
    const modeFreeBtn = document.getElementById("modeFreeBtn");
    const modeMissionBtn = document.getElementById("modeMissionBtn");
    const missionCard = document.getElementById("missionCard");

    modeFreeBtn.addEventListener("click", () => {
      this.gameMode = "free";
      modeFreeBtn.classList.add("is-active");
      modeMissionBtn.classList.remove("is-active");
      missionCard.hidden = true;
      this.setStatus("Free Slice Mode: Cut anywhere and explore shapes & fractions!");
    });

    modeMissionBtn.addEventListener("click", () => {
      this.gameMode = "mission";
      modeMissionBtn.classList.add("is-active");
      modeFreeBtn.classList.remove("is-active");
      missionCard.hidden = false;
      this.updateMissionCard();
      this.setStatus("Fraction Quest: Follow the guides to cut the target fraction!");
    });

    // Fresh Fruit Button
    document.getElementById("freshFruitBtn").addEventListener("click", () => {
      this.resetBoard();
      this.audio.playPop();
      this.setStatus("Fresh fruit placed on the cutting board!");
    });

    // Guide Toggle Button
    const guideToggleBtn = document.getElementById("guideToggleBtn");
    guideToggleBtn.addEventListener("click", () => {
      this.showGuides = !this.showGuides;
      guideToggleBtn.classList.toggle("is-active", this.showGuides);
      this.setStatus(this.showGuides ? "Cutting guides enabled." : "Cutting guides hidden.");
    });

    // Reset Board Button
    document.getElementById("clearBoardBtn").addEventListener("click", () => {
      this.resetBoard();
      this.setStatus("Cutting board cleaned!");
    });

    // Plate & Serve Button
    document.getElementById("plateBtn").addEventListener("click", () => {
      this.openServeModal();
    });

    // Close Serve Modal Buttons
    document.getElementById("closeServeBtn").addEventListener("click", () => {
      document.getElementById("serveDialog").hidden = true;
    });

    document.getElementById("nextFruitServeBtn").addEventListener("click", () => {
      document.getElementById("serveDialog").hidden = true;
      const fruitKeys = Object.keys(FRUITS_CATALOG);
      const nextIdx = (fruitKeys.indexOf(this.activeFruitId) + 1) % fruitKeys.length;
      this.selectFruit(fruitKeys[nextIdx]);
    });

    // Knife Style Selector
    document.querySelectorAll(".knife-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".knife-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        this.knifeStyle = btn.dataset.knife;
        this.audio.playWhoosh(1.2);
        this.setStatus(`Equipped ${btn.textContent} blade.`);
      });
    });

    // Sound Toggle Button
    const soundButton = document.getElementById("soundButton");
    soundButton.addEventListener("click", () => {
      const isSoundOn = this.audio.toggle();
      soundButton.textContent = isSoundOn ? "Sound On" : "Sound Off";
      soundButton.classList.toggle("button-primary", isSoundOn);
      soundButton.classList.toggle("button-secondary", !isSoundOn);
    });

    // Mouse & Touch Slice Event Handling on Canvas
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      if (e.touches && e.touches.length > 0) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handlePointerDown = (e) => {
      this.audio.init();
      this.isDragging = true;
      const pos = getPos(e);
      this.dragStart = pos;
      this.dragCurrent = pos;
      this.knifeTrail = [{ x: pos.x, y: pos.y, time: Date.now() }];
      document.getElementById("slicePrompt").style.display = "none";
    };

    const handlePointerMove = (e) => {
      if (!this.isDragging) return;
      const pos = getPos(e);
      this.dragCurrent = pos;
      this.knifeTrail.push({ x: pos.x, y: pos.y, time: Date.now() });

      // Keep recent trail
      if (this.knifeTrail.length > 12) {
        this.knifeTrail.shift();
      }

      // Check distance for whoosh sound
      if (this.knifeTrail.length > 3) {
        const p1 = this.knifeTrail[0];
        const p2 = this.knifeTrail[this.knifeTrail.length - 1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (dist > 180 && Math.random() < 0.15) {
          this.audio.playWhoosh(1.0);
        }
      }
    };

    const handlePointerUp = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const pos = getPos(e);

      if (this.dragStart) {
        const sliceLine = { p1: this.dragStart, p2: pos };
        const dist = Math.hypot(pos.x - this.dragStart.x, pos.y - this.dragStart.y);
        if (dist > 25) {
          this.performSlice(sliceLine);
        }
      }

      this.dragStart = null;
      this.dragCurrent = null;
    };

    this.canvas.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    this.canvas.addEventListener("touchstart", handlePointerDown, { passive: false });
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
  }

  // --- Slicing Engine ---
  performSlice(line) {
    const p1 = line.p1;
    const p2 = line.p2;
    let cutSomething = false;
    const newPieces = [];

    // Slice vector & normal
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;
    const nx = -dy / len;
    const ny = dx / len;

    this.pieces.forEach((piece) => {
      // Check distance from piece center to line
      const dist = this.pointLineDistance(piece.x, piece.y, p1, p2);
      const isWithinBounds = this.isPointNearSegment(piece.x, piece.y, p1, p2, piece.radius);

      if (dist < piece.radius && isWithinBounds && piece.fraction > 0.03) {
        cutSomething = true;
        this.totalSlices++;

        // Calculate push force
        const impulse = 8.5;
        const push1X = nx * impulse;
        const push1Y = ny * impulse;
        const push2X = -nx * impulse;
        const push2Y = -ny * impulse;

        // Half fractions
        const halfFrac = piece.fraction / 2;
        const halfAngleSpan = (piece.endAngle - piece.startAngle) / 2;

        // Piece 1
        newPieces.push({
          id: `${piece.id}-a`,
          fruit: piece.fruit,
          x: piece.x + push1X,
          y: piece.y + push1Y,
          vx: push1X * 0.6,
          vy: push1Y * 0.6,
          rotation: piece.rotation,
          vRot: (Math.random() - 0.5) * 0.1,
          radius: piece.radius * 0.95,
          fraction: halfFrac,
          startAngle: piece.startAngle,
          endAngle: piece.startAngle + halfAngleSpan,
          cutCount: piece.cutCount + 1,
          isGrapeBerry: piece.isGrapeBerry,
        });

        // Piece 2
        newPieces.push({
          id: `${piece.id}-b`,
          fruit: piece.fruit,
          x: piece.x + push2X,
          y: piece.y + push2Y,
          vx: push2X * 0.6,
          vy: push2Y * 0.6,
          rotation: piece.rotation,
          vRot: (Math.random() - 0.5) * 0.1,
          radius: piece.radius * 0.95,
          fraction: halfFrac,
          startAngle: piece.startAngle + halfAngleSpan,
          endAngle: piece.endAngle,
          cutCount: piece.cutCount + 1,
          isGrapeBerry: piece.isGrapeBerry,
        });

        // Spawn juicy splash particles
        this.spawnJuiceSplatter(piece.x, piece.y, piece.fruit, nx, ny);
      } else {
        newPieces.push(piece);
      }
    });

    if (cutSomething) {
      this.pieces = newPieces;
      this.audio.playSlice(this.activeFruit.id);
      this.score += 50 * (this.streak + 1);
      this.streak++;
      this.updateScoreUI();
      this.updatePiecesUI();
      this.renderFractionPie();

      // Mission progress check
      if (this.gameMode === "mission") {
        this.checkMissionProgress();
      }
    } else {
      this.audio.playWhoosh(1.2);
    }
  }

  pointLineDistance(px, py, l1, l2) {
    const A = px - l1.x;
    const B = py - l1.y;
    const C = l2.x - l1.x;
    const D = l2.y - l1.y;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = l1.x;
      yy = l1.y;
    } else if (param > 1) {
      xx = l2.x;
      yy = l2.y;
    } else {
      xx = l1.x + param * C;
      yy = l1.y + param * D;
    }

    const dX = px - xx;
    const dY = py - yy;
    return Math.hypot(dX, dY);
  }

  isPointNearSegment(px, py, l1, l2, radius) {
    const minX = Math.min(l1.x, l2.x) - radius;
    const maxX = Math.max(l1.x, l2.x) + radius;
    const minY = Math.min(l1.y, l2.y) - radius;
    const maxY = Math.max(l1.y, l2.y) + radius;
    return px >= minX && px <= maxX && py >= minY && py <= maxY;
  }

  // --- Juice Particles & Board Splatters ---
  spawnJuiceSplatter(x, y, fruit, nx, ny) {
    const count = 10 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      const splashDist = 15 + Math.random() * 45;
      const sx = x + Math.cos(angle) * splashDist + nx * (Math.random() * 20 - 10);
      const sy = y + Math.sin(angle) * splashDist + ny * (Math.random() * 20 - 10);
      const r = 2 + Math.random() * 6;

      this.splatters.push({
        x: sx,
        y: sy,
        radius: r,
        color: fruit.juiceColor,
        alpha: 0.6 + Math.random() * 0.3,
      });
    }

    // Paint onto persistent splatter canvas
    this.renderSplatters();
  }

  renderSplatters() {
    this.splatters.forEach((drop) => {
      this.splatterCtx.beginPath();
      this.splatterCtx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      this.splatterCtx.fillStyle = drop.color;
      this.splatterCtx.fill();

      // Droplet highlight
      this.splatterCtx.beginPath();
      this.splatterCtx.arc(drop.x - drop.radius * 0.3, drop.y - drop.radius * 0.3, drop.radius * 0.3, 0, Math.PI * 2);
      this.splatterCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
      this.splatterCtx.fill();
    });
  }

  // --- Mission System ---
  updateMissionCard() {
    const mission = FRACTION_MISSIONS[this.missionIndex];
    if (!mission) return;

    document.getElementById("targetFractionTitle").textContent = `Cut into ${mission.fractionName}`;
    document.getElementById("targetFractionDesc").textContent = mission.desc;
    document.getElementById("targetPiecesCount").textContent = `Pieces: ${this.pieces.length} / ${mission.targetCount}`;
  }

  checkMissionProgress() {
    const mission = FRACTION_MISSIONS[this.missionIndex];
    if (!mission) return;

    document.getElementById("targetPiecesCount").textContent = `Pieces: ${this.pieces.length} / ${mission.targetCount}`;

    if (this.pieces.length >= mission.targetCount) {
      this.audio.playChime();
      this.score += 200;
      this.streak += 2;
      this.stars = Math.min(3, this.stars + 1);
      this.updateScoreUI();
      this.setStatus(`🌟 Great job! Sliced into ${mission.fractionName}!`);

      setTimeout(() => {
        this.openServeModal();
        this.missionIndex = (this.missionIndex + 1) % FRACTION_MISSIONS.length;
        this.updateMissionCard();
      }, 600);
    }
  }

  // --- UI & Metrics Updates ---
  updateScoreUI() {
    document.getElementById("scoreValue").textContent = this.score;
    document.getElementById("streakValue").textContent = this.streak;
    document.getElementById("sliceCountValue").textContent = this.totalSlices;

    // Stars
    const starEls = document.querySelectorAll("#masteryStars .star");
    starEls.forEach((el, idx) => {
      el.classList.toggle("is-earned", idx < this.stars);
    });
    document.getElementById("starCounterText").textContent = `${this.stars} / 3 Stars Earned`;
  }

  updatePiecesUI() {
    const count = this.pieces.length;
    document.getElementById("pieceCountLabel").textContent = count;
    document.getElementById("currentFruitStats").textContent = `${count} pieces on board`;

    const list = document.getElementById("piecesList");
    list.innerHTML = "";

    this.pieces.forEach((p, idx) => {
      const fracStr = this.fractionToText(p.fraction);
      const row = document.createElement("div");
      row.className = "piece-row";
      row.innerHTML = `
        <span>Piece #${idx + 1}</span>
        <strong>${fracStr} (${Math.round(p.fraction * 100)}%)</strong>
      `;
      list.appendChild(row);
    });

    // Equation
    const fracTerms = this.pieces.map((p) => this.fractionToText(p.fraction));
    if (fracTerms.length <= 6) {
      document.getElementById("fractionEquation").textContent = `${fracTerms.join(" + ")} = 1 Whole`;
    } else {
      document.getElementById("fractionEquation").textContent = `${fracTerms.length} × 1/${fracTerms.length} = 1 Whole`;
    }
  }

  fractionToText(val) {
    if (Math.abs(val - 1.0) < 0.01) return "1/1";
    if (Math.abs(val - 0.5) < 0.01) return "1/2";
    if (Math.abs(val - 0.25) < 0.01) return "1/4";
    if (Math.abs(val - 0.125) < 0.01) return "1/8";
    if (Math.abs(val - 0.0625) < 0.01) return "1/16";
    if (Math.abs(val - 0.1) < 0.01) return "1/10";
    return `${Math.round(val * 100)}%`;
  }

  setStatus(msg) {
    document.getElementById("statusMessage").textContent = msg;
  }

  // --- Fraction Pie Visualizer ---
  renderFractionPie() {
    const ctx = this.pieCtx;
    const w = this.fractionPieCanvas.width;
    const h = this.fractionPieCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = w / 2 - 8;

    ctx.clearRect(0, 0, w, h);

    if (this.pieces.length === 0) return;

    let currentAngle = -Math.PI / 2;
    const colors = [
      "#ef4444",
      "#f97316",
      "#f59e0b",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#8b5cf6",
      "#ec4899",
      "#84cc16",
      "#a855f7",
    ];

    this.pieces.forEach((piece, idx) => {
      const sliceAngle = piece.fraction * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Inner circle ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "var(--cp-surface)";
    ctx.fill();
  }

  // --- Serve Modal Platter Preview ---
  openServeModal() {
    const dialog = document.getElementById("serveDialog");
    dialog.hidden = false;

    const modalCanvas = document.getElementById("platterCanvas");
    const mCtx = modalCanvas.getContext("2d");
    const mw = modalCanvas.width;
    const mh = modalCanvas.height;

    mCtx.clearRect(0, 0, mw, mh);

    // Draw platter dish
    mCtx.beginPath();
    mCtx.ellipse(mw / 2, mh / 2, mw * 0.44, mh * 0.4, 0, 0, Math.PI * 2);
    mCtx.fillStyle = "#ffffff";
    mCtx.fill();
    mCtx.lineWidth = 6;
    mCtx.strokeStyle = "var(--cp-accent)";
    mCtx.stroke();

    // Draw pieces arranged on plate
    this.pieces.forEach((piece, idx) => {
      const angle = (idx / this.pieces.length) * Math.PI * 2;
      const dist = 40;
      const px = mw / 2 + Math.cos(angle) * dist;
      const py = mh / 2 + Math.sin(angle) * dist * 0.75;

      this.renderFruitPiece(mCtx, {
        ...piece,
        x: px,
        y: py,
        radius: piece.radius * 0.45,
      });
    });

    document.getElementById("serveAccuracy").textContent = `${95 + Math.floor(Math.random() * 5)}%`;
    document.getElementById("serveFractions").textContent = `${this.pieces.length} Pieces`;
    document.getElementById("serveBonus").textContent = `+${this.pieces.length * 30} pts`;
  }

  // --- Main Animation & Render Loop ---
  startAnimationLoop() {
    const loop = () => {
      this.updatePhysics();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updatePhysics() {
    this.pieces.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.vRot;

      // Friction
      piece.vx *= 0.88;
      piece.vy *= 0.88;
      piece.vRot *= 0.88;

      // Board boundary clamping
      const pad = piece.radius;
      if (piece.x < pad) {
        piece.x = pad;
        piece.vx *= -0.5;
      }
      if (piece.x > this.boardWidth - pad) {
        piece.x = this.boardWidth - pad;
        piece.vx *= -0.5;
      }
      if (piece.y < pad) {
        piece.y = pad;
        piece.vy *= -0.5;
      }
      if (piece.y > this.boardHeight - pad) {
        piece.y = this.boardHeight - pad;
        piece.vy *= -0.5;
      }
    });
  }

  render() {
    this.ctx.clearRect(0, 0, this.boardWidth, this.boardHeight);

    // 1. Draw Wooden Cutting Board Grain
    this.renderCuttingBoardTexture();

    // 2. Draw Guides if enabled
    if (this.showGuides) {
      this.renderCutGuides();
    }

    // 3. Draw All Fruit Pieces
    this.pieces.forEach((piece) => {
      this.renderFruitPiece(this.ctx, piece);
    });

    // 4. Draw Active Blade / Drag Line
    if (this.isDragging && this.dragStart && this.dragCurrent) {
      this.renderBladeAction();
    }
  }

  renderCuttingBoardTexture() {
    const ctx = this.ctx;
    // Wood background
    ctx.fillStyle = "#d2a679";
    ctx.fillRect(0, 0, this.boardWidth, this.boardHeight);

    // Wood Grain lines
    ctx.strokeStyle = "rgba(139, 90, 43, 0.12)";
    ctx.lineWidth = 3;
    for (let y = 30; y < this.boardHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(300, y + 10, 600, y - 10, this.boardWidth, y + 5);
      ctx.stroke();
    }

    // Inner board border groove
    ctx.strokeStyle = "#8b5a2b";
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, this.boardWidth - 32, this.boardHeight - 32);
  }

  renderCutGuides() {
    const ctx = this.ctx;
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;

    // Center Cross guides
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy);
    ctx.lineTo(cx + 160, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - 160);
    ctx.lineTo(cx, cy + 160);
    ctx.stroke();

    ctx.restore();
  }

  // --- Detailed Fruit Rendering ---
  renderFruitPiece(ctx, piece) {
    const fruit = piece.fruit;
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.rotation);

    // Drop shadow
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    if (fruit.isGrapeCluster || piece.isGrapeBerry) {
      this.renderGrapePiece(ctx, piece);
    } else if (fruit.id === "watermelon") {
      this.renderWatermelonPiece(ctx, piece);
    } else if (fruit.id === "apple") {
      this.renderApplePiece(ctx, piece);
    } else if (fruit.isCitrus) {
      this.renderCitrusPiece(ctx, piece);
    } else if (fruit.isBerry) {
      this.renderStrawberryPiece(ctx, piece);
    } else if (fruit.isKiwi) {
      this.renderKiwiPiece(ctx, piece);
    } else if (fruit.isPineapple) {
      this.renderPineapplePiece(ctx, piece);
    }

    ctx.restore();
    ctx.restore();
  }

  // 1. Watermelon Rendering
  renderWatermelonPiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;
    const isWhole = Math.abs(eA - sA - Math.PI * 2) < 0.01;

    // Green Rind
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindColor;
    ctx.fill();

    // White Pith
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.9, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindInnerColor;
    ctx.fill();

    // Red Flesh
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.82, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.color;
    ctx.fill();

    // Black seeds
    const seedCount = isWhole ? 14 : 4;
    ctx.fillStyle = "#1c1917";
    for (let i = 0; i < seedCount; i++) {
      const theta = sA + ((i + 0.5) / seedCount) * (eA - sA);
      const dist = r * 0.52;
      const sx = Math.cos(theta) * dist;
      const sy = Math.sin(theta) * dist;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 3, 5, theta, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. Grape Rendering
  renderGrapePiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    // Purple Skin
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.color;
    ctx.fill();

    // Translucent Juicy Flesh
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.85, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.fleshColor;
    ctx.fill();

    // Highlight sheen
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fill();
  }

  // 3. Apple Rendering
  renderApplePiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    // Red Skin
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindColor;
    ctx.fill();

    // Creamy Ivory Flesh
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.88, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.fleshColor;
    ctx.fill();

    // Central Core & Dark Seeds
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.18, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(180, 83, 9, 0.25)";
    ctx.fill();

    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.ellipse(-4, 0, 2.5, 4, -0.3, 0, Math.PI * 2);
    ctx.ellipse(4, 0, 2.5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Citrus (Orange / Lemon) Rendering
  renderCitrusPiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    // Zesty Outer Rind
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindColor;
    ctx.fill();

    // White Pith
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.9, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindInnerColor;
    ctx.fill();

    // Segment wedges
    const segCount = 8;
    for (let i = 0; i < segCount; i++) {
      const segStart = sA + (i / segCount) * (eA - sA);
      const segEnd = sA + ((i + 0.9) / segCount) * (eA - sA);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.82, segStart, segEnd);
      ctx.closePath();
      ctx.fillStyle = piece.fruit.color;
      ctx.fill();
    }

    // Center white core
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.1, 0, Math.PI * 2);
    ctx.fillStyle = piece.fruit.rindInnerColor;
    ctx.fill();
  }

  // 5. Strawberry Rendering
  renderStrawberryPiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.color;
    ctx.fill();

    // Tiny exterior seeds
    ctx.fillStyle = "#fef08a";
    for (let i = 0; i < 10; i++) {
      const theta = sA + (i / 10) * (eA - sA);
      const dist = r * 0.7;
      ctx.beginPath();
      ctx.arc(Math.cos(theta) * dist, Math.sin(theta) * dist, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 6. Kiwi Rendering
  renderKiwiPiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    // Fuzzy Brown Skin
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindColor;
    ctx.fill();

    // Emerald Flesh
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.9, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.color;
    ctx.fill();

    // Creamy center
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#fef08a";
    ctx.fill();

    // Black seed ring
    ctx.fillStyle = "#171717";
    for (let i = 0; i < 14; i++) {
      const theta = sA + (i / 14) * (eA - sA);
      const dist = r * 0.44;
      ctx.beginPath();
      ctx.ellipse(Math.cos(theta) * dist, Math.sin(theta) * dist, 1.6, 2.8, theta, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Pineapple Rendering
  renderPineapplePiece(ctx, piece) {
    const r = piece.radius;
    const sA = piece.startAngle;
    const eA = piece.endAngle;

    // Textured Golden Skin
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.rindColor;
    ctx.fill();

    // Yellow Flesh
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r * 0.88, sA, eA);
    ctx.closePath();
    ctx.fillStyle = piece.fruit.fleshColor;
    ctx.fill();

    // Center Core Ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = "#ca8a04";
    ctx.fill();
  }

  // --- Blade Drawing & Motion Trail ---
  renderBladeAction() {
    const ctx = this.ctx;
    const p1 = this.dragStart;
    const p2 = this.dragCurrent;

    // Laser / Katana / Steel Blade Glow
    ctx.save();
    if (this.knifeStyle === "laser") {
      ctx.strokeStyle = "#38bdf8";
      ctx.shadowColor = "#0284c7";
      ctx.shadowBlur = 16;
      ctx.lineWidth = 6;
    } else if (this.knifeStyle === "cleaver") {
      ctx.strokeStyle = "#e2e8f0";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 6;
      ctx.lineWidth = 7;
    } else {
      // Classic Chef Knife
      ctx.strokeStyle = "#f8fafc";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 4;
      ctx.lineWidth = 4;
    }

    // Cut line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Blade handle / cursor point
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.knifeStyle === "laser" ? "#38bdf8" : "#94a3b8";
    ctx.fill();

    ctx.restore();
  }
}

// Instantiate game when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  window.fruitGame = new FruitSliceStudio();
});
