/**
 * Veggie Slice Studio - Orbit Arcade Kitchen
 * Interactive realistic vegetable chopping game with fractions, crispy crunch physics, and procedural Web Audio.
 */

// --- Procedural Web Audio Engine ---
class VeggieAudioEngine {
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
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(900 * intensity, now);
      filter.frequency.exponentialRampToValueAtTime(3400 * intensity, now + 0.07);
      filter.frequency.exponentialRampToValueAtTime(350, now + 0.14);
      filter.Q.setValueAtTime(3.2, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2 * intensity, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);
      noise.stop(now + 0.15);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  // Crisp, tactile vegetable crunch & cutting board thud
  playChop(veggieType = "carrot") {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Layer 1: Cutting board wood tap / thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = "triangle";
      thudOsc.frequency.setValueAtTime(220, now);
      thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.09);

      // Layer 2: Crispy cell snap / crackle
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.11);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const snapNoise = this.ctx.createBufferSource();
      snapNoise.buffer = buffer;

      const snapFilter = this.ctx.createBiquadFilter();
      snapFilter.type = "highpass";
      const snapCut = veggieType === "carrot" || veggieType === "cucumber" ? 3200 : 2200;
      snapFilter.frequency.setValueAtTime(snapCut, now);
      snapFilter.frequency.exponentialRampToValueAtTime(600, now + 0.1);

      const snapGain = this.ctx.createGain();
      snapGain.gain.setValueAtTime(0.35, now);
      snapGain.gain.exponentialRampToValueAtTime(0.005, now + 0.1);

      snapNoise.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(this.ctx.destination);

      snapNoise.start(now);
      snapNoise.stop(now + 0.11);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
}

// --- Vegetable Catalog with Detailed 3D Botanical Textures ---
const VEGGIE_CATALOG = [
  {
    id: "aubergine",
    name: "Royal Aubergine",
    scientific: "Solanum melongena",
    fact: "Also called eggplant or brinjal, aubergines are botanically berries! They have tender sponge-like flesh that absorbs flavors beautifully.",
    icon: "🍆",
    tag: "Glossy Violet",
    outerSkinColor: "#35144b",
    outerSkinHighlight: "#6b2c8a",
    rimColor: "#220a32",
    interiorColor: "#faf4e6",
    innerCoreColor: "#efe5cb",
    juiceColor: "#d8cbb0",
    seedColor: "#9c8b6e",
    calyxColor: "#43893e",
    calyxHighlight: "#5dbb56",
    baseRadius: 105,
    aspectY: 1.15,
    seedStyle: "ring",
  },
  {
    id: "pumpkin",
    name: "Harvest Pumpkin",
    scientific: "Cucurbita pepo",
    fact: "Pumpkins have thick, ribbed rinds with nutrient-rich golden flesh and edible seeds inside the central fiber cavity.",
    icon: "🎃",
    tag: "Autumn Gold",
    outerSkinColor: "#d95f02",
    outerSkinHighlight: "#f88d2a",
    rimColor: "#a34100",
    interiorColor: "#ff9d2e",
    innerCoreColor: "#ffb852",
    juiceColor: "#e67300",
    seedColor: "#f7eedb",
    calyxColor: "#5c4028",
    calyxHighlight: "#825d3b",
    baseRadius: 110,
    aspectY: 0.95,
    seedStyle: "cavity",
  },
  {
    id: "carrot",
    name: "Crispy Carrot",
    scientific: "Daucus carota",
    fact: "Carrots are crisp taproots packed with beta-carotene. Slicing into rounds reveals distinct xylem and phloem rings!",
    icon: "🥕",
    tag: "Sweet Taproot",
    outerSkinColor: "#ea580c",
    outerSkinHighlight: "#fb923c",
    rimColor: "#c2410c",
    interiorColor: "#f97316",
    innerCoreColor: "#fdba74",
    juiceColor: "#fb923c",
    seedColor: "#ea580c",
    calyxColor: "#22c55e",
    calyxHighlight: "#4ade80",
    baseRadius: 95,
    aspectY: 1.1,
    seedStyle: "core_ring",
  },
  {
    id: "broccoli",
    name: "Fresh Broccoli",
    scientific: "Brassica oleracea",
    fact: "Broccoli heads consist of hundreds of tiny, unopened flower buds forming a dense emerald tree-like crown.",
    icon: "🥦",
    tag: "Emerald Crown",
    outerSkinColor: "#1e5c2b",
    outerSkinHighlight: "#2e8b40",
    rimColor: "#14401e",
    interiorColor: "#74b87f",
    innerCoreColor: "#b2e0ba",
    juiceColor: "#4ade80",
    seedColor: "#166534",
    calyxColor: "#86efac",
    calyxHighlight: "#bbf7d0",
    baseRadius: 100,
    aspectY: 1.0,
    seedStyle: "florets",
  },
  {
    id: "tomato",
    name: "Vine Ripe Tomato",
    scientific: "Solanum lycopersicum",
    fact: "Juicy tomatoes feature 2 to 5 internal seed cavities (locules) filled with flavorful jelly surrounding tiny seeds.",
    icon: "🍅",
    tag: "Juicy Locules",
    outerSkinColor: "#dc2626",
    outerSkinHighlight: "#f87171",
    rimColor: "#991b1b",
    interiorColor: "#ef4444",
    innerCoreColor: "#fca5a5",
    juiceColor: "#ef4444",
    seedColor: "#fef08a",
    calyxColor: "#16a34a",
    calyxHighlight: "#4ade80",
    baseRadius: 100,
    aspectY: 0.96,
    seedStyle: "locules",
  },
  {
    id: "corn",
    name: "Sweet Golden Corn",
    scientific: "Zea mays",
    fact: "Each ear of corn has an average of 800 kernels arranged in 16 rows, held securely on a firm central cob.",
    icon: "🌽",
    tag: "Golden Cob",
    outerSkinColor: "#eab308",
    outerSkinHighlight: "#fde047",
    rimColor: "#ca8a04",
    interiorColor: "#facc15",
    innerCoreColor: "#fef08a",
    juiceColor: "#fef08a",
    seedColor: "#ca8a04",
    calyxColor: "#65a30d",
    calyxHighlight: "#84cc16",
    baseRadius: 105,
    aspectY: 1.15,
    seedStyle: "kernels",
  },
  {
    id: "cucumber",
    name: "Cool Cucumber",
    scientific: "Cucumis sativus",
    fact: "Cucumbers are 96% water! The inner temperature can be up to 20 degrees cooler than the outside air.",
    icon: "🥒",
    tag: "Crisp & Cool",
    outerSkinColor: "#15803d",
    outerSkinHighlight: "#22c55e",
    rimColor: "#14532d",
    interiorColor: "#dcfce7",
    innerCoreColor: "#f0fdf4",
    juiceColor: "#86efac",
    seedColor: "#bbf7d0",
    calyxColor: "#166534",
    calyxHighlight: "#22c55e",
    baseRadius: 95,
    aspectY: 1.1,
    seedStyle: "cucumber_seeds",
  },
  {
    id: "bell_pepper",
    name: "Sweet Bell Pepper",
    scientific: "Capsicum annuum",
    fact: "Bell peppers are hollow inside with thick, crunchy walls and a central white placenta that holds tiny seeds.",
    icon: "🫑",
    tag: "Sweet & Crunchy",
    outerSkinColor: "#b91c1c",
    outerSkinHighlight: "#ef4444",
    rimColor: "#7f1d1d",
    interiorColor: "#f87171",
    innerCoreColor: "#fef2f2",
    juiceColor: "#f87171",
    seedColor: "#fef9c3",
    calyxColor: "#15803d",
    calyxHighlight: "#22c55e",
    baseRadius: 100,
    aspectY: 1.05,
    seedStyle: "pepper_hollow",
  },
  {
    id: "red_onion",
    name: "Crisp Red Onion",
    scientific: "Allium cepa",
    fact: "Red onions grow in concentric fleshy layers or tunic rings. Slicing reveals stunning magenta and pearly white arcs.",
    icon: "🧅",
    tag: "Layered Rings",
    outerSkinColor: "#701a75",
    outerSkinHighlight: "#a21caf",
    rimColor: "#4a044e",
    interiorColor: "#fdf4ff",
    innerCoreColor: "#fae8ff",
    juiceColor: "#e879f9",
    seedColor: "#c026d3",
    calyxColor: "#a8a29e",
    calyxHighlight: "#d6d3d1",
    baseRadius: 98,
    aspectY: 0.98,
    seedStyle: "onion_rings",
  },
  {
    id: "avocado",
    name: "Creamy Avocado",
    scientific: "Persea americana",
    fact: "Avocados are rich in healthy oils. A cross-section shows lime-green margins fading to butter yellow with a smooth seed.",
    icon: "🥑",
    tag: "Rich & Silky",
    outerSkinColor: "#1c2b18",
    outerSkinHighlight: "#36532b",
    rimColor: "#0f170d",
    interiorColor: "#bef264",
    innerCoreColor: "#fef08a",
    juiceColor: "#a3e635",
    seedColor: "#78350f",
    calyxColor: "#36532b",
    calyxHighlight: "#4d7c3f",
    baseRadius: 102,
    aspectY: 1.12,
    seedStyle: "avocado_pit",
  },
  {
    id: "potato",
    name: "Golden Russet Potato",
    scientific: "Solanum tuberosum",
    fact: "Potatoes are starchy tubers. First cultivated in the Andes mountains, they are the world's 4th largest food crop.",
    icon: "🥔",
    tag: "Earthy & Starchy",
    outerSkinColor: "#854d0e",
    outerSkinHighlight: "#a16207",
    rimColor: "#593306",
    interiorColor: "#fef9c3",
    innerCoreColor: "#fef08a",
    juiceColor: "#fde047",
    seedColor: "#713f12",
    calyxColor: "#ca8a04",
    calyxHighlight: "#eab308",
    baseRadius: 100,
    aspectY: 0.9,
    seedStyle: "potato_dots",
  },
  {
    id: "mushroom",
    name: "Forest Portobello",
    scientific: "Agaricus bisporus",
    fact: "Mushrooms are fungi! Underneath the smooth velvety cap lies a series of delicate radial gills that release spores.",
    icon: "🍄",
    tag: "Velvet Cap & Gills",
    outerSkinColor: "#78350f",
    outerSkinHighlight: "#9a3412",
    rimColor: "#451a03",
    interiorColor: "#f5ebe0",
    innerCoreColor: "#e6ccb2",
    juiceColor: "#d4a373",
    seedColor: "#582f0e",
    calyxColor: "#ddb892",
    calyxHighlight: "#ede0d4",
    baseRadius: 100,
    aspectY: 0.95,
    seedStyle: "mushroom_gills",
  },
];

// --- Fraction Math Missions ---
const FRACTION_MISSIONS = [
  { targetCount: 2, fractionName: "2 Halves (1/2)", fractionStr: "1/2", desc: "Chop the vegetable directly down the center to make 2 equal halves." },
  { targetCount: 4, fractionName: "4 Quarters (1/4)", fractionStr: "1/4", desc: "Chop horizontally and vertically into 4 equal quarters." },
  { targetCount: 8, fractionName: "8 Wedges (1/8)", fractionStr: "1/8", desc: "Chop into 8 equal sharing salad portions." },
];

class VeggieSliceApp {
  constructor() {
    this.audio = new VeggieAudioEngine();
    this.canvas = document.getElementById("cuttingCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.splatterCanvas = document.getElementById("splatterCanvas");
    this.splatterCtx = this.splatterCanvas.getContext("2d");

    this.boardWidth = 900;
    this.boardHeight = 600;

    this.activeVeggie = VEGGIE_CATALOG[0]; // Aubergine
    this.knifeStyle = "chef";
    this.gameMode = "free"; // free | mission
    this.missionIndex = 0;
    this.showGuides = false;

    this.pieces = [];
    this.splatters = [];
    this.knifeTrail = [];

    this.score = 0;
    this.streak = 0;
    this.totalSlices = 0;

    this.isDragging = false;
    this.dragStart = null;
    this.dragCurrent = null;

    this.initPantry();
    this.initEventListeners();
    this.resetBoard();
    this.startAnimationLoop();
    this.renderFractionPie();
  }

  // --- Pantry & Veggie Selector ---
  initPantry() {
    const container = document.getElementById("veggieSelector");
    container.innerHTML = "";

    VEGGIE_CATALOG.forEach((veggie, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `veggie-choice-btn ${idx === 0 ? "is-active" : ""}`;
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", idx === 0 ? "true" : "false");
      btn.setAttribute("aria-label", `Select ${veggie.name}`);
      btn.dataset.id = veggie.id;

      btn.innerHTML = `
        <span class="veggie-emoji">${veggie.icon}</span>
        <strong class="veggie-name">${veggie.name}</strong>
        <span class="veggie-tag">${veggie.tag}</span>
      `;

      btn.addEventListener("click", () => {
        this.selectVeggie(veggie);
      });

      container.appendChild(btn);
    });
  }

  selectVeggie(veggie) {
    this.activeVeggie = veggie;

    document.querySelectorAll(".veggie-choice-btn").forEach((btn) => {
      const isSelected = btn.dataset.id === veggie.id;
      btn.classList.toggle("is-active", isSelected);
      btn.setAttribute("aria-checked", isSelected ? "true" : "false");
    });

    document.getElementById("currentVeggieIcon").textContent = veggie.icon;
    document.getElementById("currentVeggieName").textContent = veggie.name;
    document.getElementById("veggieFactTitle").textContent = `${veggie.name} (${veggie.scientific})`;
    document.getElementById("veggieFactText").textContent = veggie.fact;

    this.audio.playWhoosh(1.1);
    this.resetBoard();
    this.setStatus(`Selected fresh ${veggie.name}. Ready to chop!`);
  }

  // --- Board Reset & Initialization ---
  resetBoard() {
    this.pieces = [];
    this.splatters = [];
    this.splatterCtx.clearRect(0, 0, this.boardWidth, this.boardHeight);

    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;

    this.pieces.push({
      id: "v-whole-1",
      veggie: this.activeVeggie,
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      rotation: 0,
      vRot: 0,
      radius: this.activeVeggie.baseRadius,
      aspectY: this.activeVeggie.aspectY,
      fraction: 1.0,
      startAngle: 0,
      endAngle: Math.PI * 2,
      cutCount: 0,
    });

    this.updatePiecesUI();
    this.renderFractionPie();

    const promptEl = document.getElementById("slicePrompt");
    if (promptEl) promptEl.style.display = "block";
  }

  // --- UI Event Listeners ---
  initEventListeners() {
    // Mode toggles
    const modeFreeBtn = document.getElementById("modeFreeBtn");
    const modeMissionBtn = document.getElementById("modeMissionBtn");
    const missionCard = document.getElementById("missionCard");

    modeFreeBtn.addEventListener("click", () => {
      this.gameMode = "free";
      modeFreeBtn.classList.add("is-active");
      modeMissionBtn.classList.remove("is-active");
      missionCard.hidden = true;
      this.setStatus("Free Chop mode: Slice any direction & discover fractions!");
    });

    modeMissionBtn.addEventListener("click", () => {
      this.gameMode = "mission";
      modeMissionBtn.classList.add("is-active");
      modeFreeBtn.classList.remove("is-active");
      missionCard.hidden = false;
      this.missionIndex = 0;
      this.updateMissionCard();
      this.setStatus("Fraction Quest: Follow targets to become Master Veggie Chef!");
    });

    // Action buttons
    document.getElementById("freshVeggieBtn").addEventListener("click", () => {
      this.audio.playWhoosh(1.2);
      this.resetBoard();
      this.setStatus("Refreshed with a whole vegetable!");
    });

    document.getElementById("clearBoardBtn").addEventListener("click", () => {
      this.resetBoard();
    });

    document.getElementById("guideToggleBtn").addEventListener("click", () => {
      this.showGuides = !this.showGuides;
      document.getElementById("guideToggleBtn").classList.toggle("button-primary", this.showGuides);
      this.setStatus(this.showGuides ? "Guides ON" : "Guides OFF");
    });

    document.getElementById("plateBtn").addEventListener("click", () => {
      this.openServeModal();
    });

    // Quick Cut Preset Buttons
    document.getElementById("cutHalfBtn").addEventListener("click", () => {
      this.quickCutHalves();
    });
    document.getElementById("cutQuartersBtn").addEventListener("click", () => {
      this.quickCutQuarters();
    });
    document.getElementById("cutEighthsBtn").addEventListener("click", () => {
      this.quickCutEighths();
    });

    // Serve Platter Dialog buttons
    document.getElementById("closeServeBtn").addEventListener("click", () => {
      this.closeServeModal();
    });

    document.getElementById("nextVeggieServeBtn").addEventListener("click", () => {
      this.closeServeModal();
      const currentIdx = VEGGIE_CATALOG.findIndex((v) => v.id === this.activeVeggie.id);
      const nextVeggie = VEGGIE_CATALOG[(currentIdx + 1) % VEGGIE_CATALOG.length];
      this.selectVeggie(nextVeggie);
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

    // Mouse, Stylus & Touch Slice Event Handling on Canvas
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
      if (e.changedTouches && e.changedTouches.length > 0) {
        return {
          x: (e.changedTouches[0].clientX - rect.left) * scaleX,
          y: (e.changedTouches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const handlePointerDown = (e) => {
      if (e.cancelable && e.type.startsWith("touch")) {
        e.preventDefault();
      }
      this.audio.init();
      this.isDragging = true;
      const pos = getPos(e);
      this.dragStart = pos;
      this.dragCurrent = pos;
      this.knifeTrail = [{ x: pos.x, y: pos.y, time: Date.now() }];
      const promptEl = document.getElementById("slicePrompt");
      if (promptEl) promptEl.style.display = "none";
    };

    const handlePointerMove = (e) => {
      if (!this.isDragging) return;
      if (e.cancelable && e.type.startsWith("touch")) {
        e.preventDefault();
      }
      const pos = getPos(e);
      this.dragCurrent = pos;
      this.knifeTrail.push({ x: pos.x, y: pos.y, time: Date.now() });

      if (this.knifeTrail.length > 12) {
        this.knifeTrail.shift();
      }

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
        if (dist > 18) {
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
    window.addEventListener("touchend", handlePointerUp, { passive: false });
    window.addEventListener("touchcancel", handlePointerUp, { passive: false });

    // Keyboard Shortcuts for accessibility
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "2") {
        this.quickCutHalves();
      } else if (e.key === "4") {
        this.quickCutQuarters();
      } else if (e.key === "8") {
        this.quickCutEighths();
      } else if (e.key.toLowerCase() === "r") {
        this.resetBoard();
      } else if (e.key.toLowerCase() === "p" || e.key.toLowerCase() === "s") {
        this.openServeModal();
      } else if (e.key === "Escape") {
        this.closeServeModal();
      }
    });
  }

  // --- Quick Cut Presets ---
  quickCutHalves() {
    this.resetBoard();
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;
    this.performSlice({
      p1: { x: cx, y: cy - 200 },
      p2: { x: cx, y: cy + 200 },
    });
    this.setStatus("Chopped into 2 equal halves (1/2 + 1/2)!");
  }

  quickCutQuarters() {
    this.quickCutHalves();
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;
    setTimeout(() => {
      this.performSlice({
        p1: { x: cx - 200, y: cy },
        p2: { x: cx + 200, y: cy },
      });
      this.setStatus("Chopped into 4 equal quarters (1/4 each)!");
    }, 150);
  }

  quickCutEighths() {
    this.quickCutQuarters();
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;
    setTimeout(() => {
      this.performSlice({
        p1: { x: cx - 180, y: cy - 180 },
        p2: { x: cx + 180, y: cy + 180 },
      });
      this.performSlice({
        p1: { x: cx - 180, y: cy + 180 },
        p2: { x: cx + 180, y: cy - 180 },
      });
      this.setStatus("Chopped into 8 sharing portions (1/8 each)!");
    }, 320);
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
      // Check distance from piece center to slice line
      const dist = this.pointLineDistance(piece.x, piece.y, p1, p2);
      const isWithinBounds = this.isPointNearSegment(piece.x, piece.y, p1, p2, piece.radius);

      if (dist < piece.radius && isWithinBounds && piece.fraction > 0.03) {
        cutSomething = true;
        this.totalSlices++;

        // Calculate push force
        const impulse = 11;
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
          veggie: piece.veggie,
          x: piece.x + push1X,
          y: piece.y + push1Y,
          vx: push1X * 0.7,
          vy: push1Y * 0.7,
          rotation: piece.rotation,
          vRot: (Math.random() - 0.5) * 0.08,
          radius: piece.radius * 0.96,
          aspectY: piece.aspectY,
          fraction: halfFrac,
          startAngle: piece.startAngle,
          endAngle: piece.startAngle + halfAngleSpan,
          cutCount: piece.cutCount + 1,
        });

        // Piece 2
        newPieces.push({
          id: `${piece.id}-b`,
          veggie: piece.veggie,
          x: piece.x + push2X,
          y: piece.y + push2Y,
          vx: push2X * 0.7,
          vy: push2Y * 0.7,
          rotation: piece.rotation,
          vRot: (Math.random() - 0.5) * 0.08,
          radius: piece.radius * 0.96,
          aspectY: piece.aspectY,
          fraction: halfFrac,
          startAngle: piece.startAngle + halfAngleSpan,
          endAngle: piece.endAngle,
          cutCount: piece.cutCount + 1,
        });

        // Spawn crisp bits & droplets
        this.spawnVeggieParticles(piece.x, piece.y, piece.veggie, nx, ny);
      } else {
        newPieces.push(piece);
      }
    });

    if (cutSomething) {
      this.pieces = newPieces;
      this.audio.playChop(this.activeVeggie.id);
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

  // --- Juice & Crisp Particle System ---
  spawnVeggieParticles(x, y, veggie, nx, ny) {
    const count = 12 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const splashDist = 15 + Math.random() * 45;
      const sx = x + Math.cos(angle) * splashDist + nx * (Math.random() * 20 - 10);
      const sy = y + Math.sin(angle) * splashDist + ny * (Math.random() * 20 - 10);
      const r = 2 + Math.random() * 5;

      this.splatters.push({
        x: sx,
        y: sy,
        radius: r,
        color: Math.random() > 0.4 ? veggie.juiceColor : veggie.outerSkinHighlight,
      });
    }

    this.renderSplatters();
  }

  renderSplatters() {
    this.splatters.forEach((drop) => {
      this.splatterCtx.beginPath();
      this.splatterCtx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      this.splatterCtx.fillStyle = drop.color;
      this.splatterCtx.fill();

      // Crisp highlight
      this.splatterCtx.beginPath();
      this.splatterCtx.arc(drop.x - drop.radius * 0.3, drop.y - drop.radius * 0.3, drop.radius * 0.35, 0, Math.PI * 2);
      this.splatterCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
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

    const count = this.pieces.length;
    document.getElementById("targetPiecesCount").textContent = `Pieces: ${count} / ${mission.targetCount}`;

    if (count >= mission.targetCount) {
      this.audio.playChime();
      this.score += 200;
      this.streak += 2;
      this.updateScoreUI();
      this.setStatus(`🌟 Master Chop! Successfully completed ${mission.fractionName}!`);

      if (this.missionIndex < FRACTION_MISSIONS.length - 1) {
        this.missionIndex++;
        setTimeout(() => {
          this.updateMissionCard();
          this.resetBoard();
        }, 1200);
      } else {
        setTimeout(() => {
          this.openServeModal();
        }, 600);
      }
    }
  }

  // --- UI Updates ---
  updateScoreUI() {
    document.getElementById("scoreValue").textContent = this.score;
    document.getElementById("streakValue").textContent = this.streak;
    document.getElementById("sliceCountValue").textContent = this.totalSlices;
  }

  updatePiecesUI() {
    const container = document.getElementById("piecesList");
    container.innerHTML = "";

    document.getElementById("pieceCountLabel").textContent = this.pieces.length;
    document.getElementById("currentVeggieStats").textContent = `${this.pieces.length} active portion${this.pieces.length > 1 ? "s" : ""}`;

    this.pieces.forEach((piece, idx) => {
      const row = document.createElement("div");
      row.className = "piece-row";

      const fracStr = this.formatFraction(piece.fraction);
      const percentStr = `${Math.round(piece.fraction * 100)}%`;

      row.innerHTML = `
        <span class="piece-tag">Portion #${idx + 1}</span>
        <span class="piece-fraction">${fracStr} (${percentStr})</span>
      `;
      container.appendChild(row);
    });

    // Update Fraction equation
    if (this.pieces.length === 1) {
      document.getElementById("fractionEquation").textContent = "1 = 1/1 Whole";
    } else {
      const fracs = this.pieces.map((p) => this.formatFraction(p.fraction)).join(" + ");
      document.getElementById("fractionEquation").textContent = `1 = ${fracs}`;
    }
  }

  formatFraction(val) {
    if (val >= 0.98) return "1/1 Whole";
    if (Math.abs(val - 0.5) < 0.04) return "1/2 Half";
    if (Math.abs(val - 0.25) < 0.03) return "1/4 Quarter";
    if (Math.abs(val - 0.125) < 0.02) return "1/8 Eighth";
    if (Math.abs(val - 0.0625) < 0.015) return "1/16 Sixteenth";
    const denom = Math.round(1 / val);
    return `1/${denom}`;
  }

  setStatus(msg) {
    const el = document.getElementById("statusMessage");
    if (el) el.textContent = msg;
  }

  // --- Fraction Pie Chart Visualizer ---
  renderFractionPie() {
    const pieCanvas = document.getElementById("fractionPieCanvas");
    if (!pieCanvas) return;
    const ctx = pieCanvas.getContext("2d");
    const cx = pieCanvas.width / 2;
    const cy = pieCanvas.height / 2;
    const r = cx - 8;

    ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

    let currentAngle = -Math.PI / 2;
    const colors = [
      "#10b981",
      "#f59e0b",
      "#3b82f6",
      "#ec4899",
      "#8b5cf6",
      "#14b8a6",
      "#f97316",
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
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  // --- Serve Modal Platter Preview ---
  openServeModal() {
    const dialog = document.getElementById("serveDialog");
    dialog.hidden = false;
    dialog.classList.add("is-open");

    const modalCanvas = document.getElementById("platterCanvas");
    const mCtx = modalCanvas.getContext("2d");
    const mw = modalCanvas.width;
    const mh = modalCanvas.height;

    mCtx.clearRect(0, 0, mw, mh);

    // Ceramic Salad Platter
    mCtx.save();
    mCtx.shadowColor = "rgba(0, 0, 0, 0.15)";
    mCtx.shadowBlur = 12;
    mCtx.shadowOffsetY = 4;
    mCtx.beginPath();
    mCtx.ellipse(mw / 2, mh / 2, mw * 0.44, mh * 0.38, 0, 0, Math.PI * 2);
    mCtx.fillStyle = "#ffffff";
    mCtx.fill();
    mCtx.lineWidth = 4;
    mCtx.strokeStyle = "#cbd5e1";
    mCtx.stroke();
    mCtx.restore();

    // Decorative Platter Rim
    mCtx.beginPath();
    mCtx.ellipse(mw / 2, mh / 2, mw * 0.38, mh * 0.32, 0, 0, Math.PI * 2);
    mCtx.strokeStyle = "rgba(16, 185, 129, 0.25)";
    mCtx.lineWidth = 2;
    mCtx.stroke();

    // Draw veggie portions arranged on plate
    this.pieces.forEach((piece, idx) => {
      const angle = (idx / Math.max(1, this.pieces.length)) * Math.PI * 2;
      const dist = Math.min(70, 20 + this.pieces.length * 4);
      const px = mw / 2 + Math.cos(angle) * dist;
      const py = mh / 2 + Math.sin(angle) * dist * 0.7;

      this.renderVeggiePiece(mCtx, {
        ...piece,
        x: px,
        y: py,
        radius: Math.min(38, piece.radius * 0.5),
      });
    });

    document.getElementById("serveAccuracy").textContent = `${96 + Math.floor(Math.random() * 4)}%`;
    document.getElementById("serveFractions").textContent = `${this.pieces.length} Portions`;
    document.getElementById("serveBonus").textContent = `+${this.pieces.length * 30} pts`;
  }

  closeServeModal() {
    const dialog = document.getElementById("serveDialog");
    dialog.hidden = true;
    dialog.classList.remove("is-open");
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

    // 1. Draw Wooden Cutting Board Texture
    this.renderCuttingBoardTexture();

    // 2. Draw Guides if enabled
    if (this.showGuides) {
      this.renderCutGuides();
    }

    // 3. Draw All Veggie Pieces
    this.pieces.forEach((piece) => {
      this.renderVeggiePiece(this.ctx, piece);
    });

    // 4. Draw Active Blade / Drag Line
    if (this.isDragging && this.dragStart && this.dragCurrent) {
      this.renderBladeAction();
    }
  }

  // --- Wooden Cutting Board Grain Texture ---
  renderCuttingBoardTexture() {
    const w = this.boardWidth;
    const h = this.boardHeight;

    // Board wood slats
    for (let y = 0; y < h; y += 45) {
      this.ctx.fillStyle = y % 90 === 0 ? "rgba(107, 68, 35, 0.08)" : "rgba(255, 255, 255, 0.04)";
      this.ctx.fillRect(0, y, w, 44);
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.strokeStyle = "rgba(107, 68, 35, 0.15)";
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    }

    // Subtle knife chop marks
    this.ctx.strokeStyle = "rgba(90, 50, 20, 0.1)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const mx = 200 + ((i * 47) % (w - 400));
      const my = 150 + ((i * 31) % (h - 300));
      this.ctx.beginPath();
      this.ctx.moveTo(mx - 15, my - 8);
      this.ctx.lineTo(mx + 15, my + 8);
      this.ctx.stroke();
    }
  }

  renderCutGuides() {
    const cx = this.boardWidth / 2;
    const cy = this.boardHeight / 2;

    this.ctx.save();
    this.ctx.strokeStyle = "rgba(177, 31, 75, 0.6)";
    this.ctx.setLineDash([8, 6]);
    this.ctx.lineWidth = 2.5;

    // Vertical cut guide
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - 180);
    this.ctx.lineTo(cx, cy + 180);
    this.ctx.stroke();

    // Horizontal cut guide
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 180, cy);
    this.ctx.lineTo(cx + 180, cy);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // --- Realistic 3D Vegetable Piece Rendering ---
  renderVeggiePiece(ctx, piece) {
    const { veggie, x, y, rotation, radius, fraction, startAngle, endAngle, cutCount } = piece;
    const isWhole = cutCount === 0 || fraction >= 0.99;
    const aspectY = piece.aspectY || 1.0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // 1. Drop shadow under piece
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    if (isWhole) {
      ctx.ellipse(0, 0, radius, radius * aspectY, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fill();
    ctx.restore();

    // 2. Render Whole Vegetable vs Sliced Section
    if (isWhole) {
      this.renderWholeVeggie3D(ctx, veggie, radius, aspectY);
    } else {
      this.renderSlicedVeggieCrossSection(ctx, veggie, radius, startAngle, endAngle, aspectY);
    }

    ctx.restore();
  }

  // --- 3D Exterior Skin & Stems for Whole Vegetables ---
  renderWholeVeggie3D(ctx, veggie, radius, aspectY) {
    // 3D Sphere / Ellipse Gradient
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.35, radius * 0.1, 0, 0, radius * 1.05);
    grad.addColorStop(0, veggie.outerSkinHighlight);
    grad.addColorStop(0.7, veggie.outerSkinColor);
    grad.addColorStop(1, veggie.rimColor);

    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * aspectY, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = veggie.rimColor;
    ctx.stroke();

    // Distinct Vegetable Details:
    if (veggie.id === "aubergine") {
      // Glossy sheen reflection
      ctx.beginPath();
      ctx.ellipse(-radius * 0.35, -radius * 0.35, radius * 0.35, radius * 0.2, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.fill();

      // Green leafy calyx at top
      ctx.beginPath();
      ctx.moveTo(0, -radius * aspectY);
      ctx.lineTo(-20, -radius * aspectY + 30);
      ctx.lineTo(-5, -radius * aspectY + 22);
      ctx.lineTo(0, -radius * aspectY + 35);
      ctx.lineTo(10, -radius * aspectY + 22);
      ctx.lineTo(22, -radius * aspectY + 28);
      ctx.closePath();
      ctx.fillStyle = veggie.calyxColor;
      ctx.fill();
      ctx.strokeStyle = veggie.calyxHighlight;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Thick green stem
      ctx.beginPath();
      ctx.moveTo(-6, -radius * aspectY);
      ctx.quadraticCurveTo(-15, -radius * aspectY - 25, -2, -radius * aspectY - 32);
      ctx.lineTo(6, -radius * aspectY - 30);
      ctx.quadraticCurveTo(-2, -radius * aspectY - 20, 6, -radius * aspectY);
      ctx.closePath();
      ctx.fillStyle = veggie.calyxColor;
      ctx.fill();
    } else if (veggie.id === "pumpkin") {
      // Pumpkin vertical ribs / segments
      for (let r = -radius * 0.75; r <= radius * 0.75; r += radius * 0.38) {
        ctx.beginPath();
        ctx.ellipse(r, 0, Math.abs(r * 0.3) + 12, radius * aspectY * 0.98, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(110, 40, 0, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Woody brown stem
      ctx.beginPath();
      ctx.moveTo(-10, -radius * aspectY + 5);
      ctx.quadraticCurveTo(-18, -radius * aspectY - 24, -4, -radius * aspectY - 35);
      ctx.lineTo(8, -radius * aspectY - 32);
      ctx.quadraticCurveTo(0, -radius * aspectY - 18, 10, -radius * aspectY + 5);
      ctx.closePath();
      ctx.fillStyle = veggie.calyxColor;
      ctx.fill();
      ctx.strokeStyle = veggie.calyxHighlight;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (veggie.id === "carrot") {
      // Horizontal ridges on carrot skin
      ctx.strokeStyle = "rgba(180, 50, 0, 0.35)";
      ctx.lineWidth = 2;
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(0, i * 22, radius * 0.7, 0, Math.PI);
        ctx.stroke();
      }

      // Leafy green carrot top
      ctx.beginPath();
      ctx.moveTo(0, -radius * aspectY);
      ctx.lineTo(-24, -radius * aspectY - 35);
      ctx.lineTo(-8, -radius * aspectY - 20);
      ctx.lineTo(0, -radius * aspectY - 45);
      ctx.lineTo(10, -radius * aspectY - 22);
      ctx.lineTo(24, -radius * aspectY - 38);
      ctx.closePath();
      ctx.fillStyle = veggie.calyxColor;
      ctx.fill();
    } else if (veggie.id === "broccoli") {
      // Emerald floret clusters
      ctx.fillStyle = veggie.outerSkinHighlight;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const d = (i % 3 + 1) * (radius * 0.28);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = veggie.rimColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (veggie.id === "tomato") {
      // Glossy highlight
      ctx.beginPath();
      ctx.ellipse(-radius * 0.3, -radius * 0.3, radius * 0.3, radius * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fill();

      // Star-shaped green calyx
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const outerX = Math.cos(a) * 32;
        const outerY = -radius * aspectY * 0.85 + Math.sin(a) * 32;
        const innerA = a + Math.PI / 5;
        const innerX = Math.cos(innerA) * 12;
        const innerY = -radius * aspectY * 0.85 + Math.sin(innerA) * 12;
        if (i === 0) ctx.moveTo(outerX, outerY);
        else ctx.lineTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
      }
      ctx.closePath();
      ctx.fillStyle = veggie.calyxColor;
      ctx.fill();
    } else if (veggie.id === "corn") {
      // Golden kernel rows
      ctx.fillStyle = veggie.seedColor;
      for (let y = -radius * 0.7; y <= radius * 0.7; y += 18) {
        for (let x = -radius * 0.6; x <= radius * 0.6; x += 16) {
          ctx.beginPath();
          ctx.ellipse(x, y, 6, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    } else if (veggie.id === "avocado") {
      // Dark bumpy texture
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * radius * 0.7;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (veggie.id === "mushroom") {
      // White speckles on cap
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const d = (i % 2 === 0 ? 0.35 : 0.65) * radius;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d * aspectY, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- Rich Cross-Section Rendering for Sliced Vegetables ---
  renderSlicedVeggieCrossSection(ctx, veggie, radius, startAngle, endAngle, aspectY) {
    // 1. Thick Outer Skin / Rind Arc
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = veggie.outerSkinColor;
    ctx.fill();

    // 2. Vegetable Flesh / Pulp Layer
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.92, startAngle, endAngle);
    ctx.closePath();

    const pulpGrad = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius * 0.92);
    pulpGrad.addColorStop(0, veggie.innerCoreColor);
    pulpGrad.addColorStop(1, veggie.interiorColor);
    ctx.fillStyle = pulpGrad;
    ctx.fill();

    // 3. Central Inner Core / Cavity
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.45, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = veggie.innerCoreColor;
    ctx.fill();

    // 4. Botanical Sliced Seeds & Structures
    const midAngle = (startAngle + endAngle) / 2;
    const span = endAngle - startAngle;

    if (veggie.seedStyle === "ring") {
      // Aubergine spongy seed arcs
      ctx.fillStyle = veggie.seedColor;
      for (let i = 0; i < 8; i++) {
        const sa = startAngle + (i / 7) * span;
        const sx = Math.cos(sa) * radius * 0.52;
        const sy = Math.sin(sa) * radius * 0.52;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 3, 2, sa, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (veggie.seedStyle === "cavity") {
      // Pumpkin seeds in fiber cavity
      ctx.fillStyle = veggie.seedColor;
      for (let i = 0; i < 7; i++) {
        const sa = startAngle + ((i + 0.5) / 7) * span;
        const sx = Math.cos(sa) * radius * 0.48;
        const sy = Math.sin(sa) * radius * 0.48;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 6, 3, sa, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#d97706";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (veggie.seedStyle === "core_ring") {
      // Carrot xylem/phloem rings
      ctx.strokeStyle = veggie.outerSkinHighlight;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.38, startAngle, endAngle);
      ctx.stroke();
    } else if (veggie.seedStyle === "locules") {
      // Tomato jelly seed chambers
      ctx.fillStyle = "rgba(220, 38, 38, 0.4)";
      for (let i = 0; i < 4; i++) {
        const sa = startAngle + ((i + 0.5) / 4) * span;
        const sx = Math.cos(sa) * radius * 0.55;
        const sy = Math.sin(sa) * radius * 0.55;
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = veggie.seedColor;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (veggie.seedStyle === "cucumber_seeds") {
      // Cucumber pale seed arcs
      ctx.fillStyle = "rgba(187, 247, 208, 0.85)";
      for (let i = 0; i < 9; i++) {
        const sa = startAngle + (i / 8) * span;
        const sx = Math.cos(sa) * radius * 0.5;
        const sy = Math.sin(sa) * radius * 0.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy, 6, 2, sa, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (veggie.seedStyle === "onion_rings") {
      // Onion concentric violet tunic rings
      for (let r = 0.25; r <= 0.85; r += 0.15) {
        ctx.strokeStyle = veggie.outerSkinColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, radius * r, startAngle, endAngle);
        ctx.stroke();
      }
    } else if (veggie.seedStyle === "avocado_pit") {
      // Avocado smooth round pit
      ctx.fillStyle = veggie.seedColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius * 0.4, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#451a03";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (veggie.seedStyle === "mushroom_gills") {
      // Radial portobello gills
      ctx.strokeStyle = veggie.seedColor;
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 12; i++) {
        const sa = startAngle + (i / 11) * span;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sa) * radius * 0.35, Math.sin(sa) * radius * 0.35);
        ctx.lineTo(Math.cos(sa) * radius * 0.88, Math.sin(sa) * radius * 0.88);
        ctx.stroke();
      }
    }

    // 5. Crisp Edge Outline
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = veggie.rimColor;
    ctx.stroke();
  }

  // --- Blade Interaction & Trail ---
  renderBladeAction() {
    const p1 = this.dragStart;
    const p2 = this.dragCurrent;

    this.ctx.save();

    if (this.knifeStyle === "laser") {
      // Laser Katana Blade
      this.ctx.strokeStyle = "#22d3ee";
      this.ctx.shadowColor = "#06b6d4";
      this.ctx.shadowBlur = 15;
      this.ctx.lineWidth = 5;
    } else if (this.knifeStyle === "cleaver") {
      // Heavy Cleaver Blade
      this.ctx.strokeStyle = "#cbd5e1";
      this.ctx.shadowColor = "rgba(0,0,0,0.4)";
      this.ctx.shadowBlur = 8;
      this.ctx.lineWidth = 6;
    } else {
      // Chef Santoku Blade
      this.ctx.strokeStyle = "#f1f5f9";
      this.ctx.shadowColor = "rgba(0,0,0,0.3)";
      this.ctx.shadowBlur = 6;
      this.ctx.lineWidth = 3.5;
    }

    // Draw main blade line
    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.lineTo(p2.x, p2.y);
    this.ctx.stroke();

    // Draw trail
    if (this.knifeTrail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.knifeTrail[0].x, this.knifeTrail[0].y);
      for (let i = 1; i < this.knifeTrail.length; i++) {
        this.ctx.lineTo(this.knifeTrail[i].x, this.knifeTrail[i].y);
      }
      this.ctx.strokeStyle = this.knifeStyle === "laser" ? "rgba(34, 211, 238, 0.4)" : "rgba(255, 255, 255, 0.4)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}

// Launch app on load
window.addEventListener("DOMContentLoaded", () => {
  window.veggieSliceApp = new VeggieSliceApp();
});
