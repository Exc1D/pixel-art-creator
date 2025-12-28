// ============================================
// DOM ELEMENTS
// ============================================

const pixelCanvas = document.getElementById("pixelCanvas");
const gridSizeSlider = document.getElementById("gridSizeSlider");
const gridSizeDisplay = document.getElementById("gridSizeDisplay");
const pixelCount = document.getElementById("pixelCount");
const colorPicker = document.getElementById("colorPicker");
const currentColorSwatch = document.getElementById("currentColorSwatch");
const currentColorCode = document.getElementById("currentColorCode");
const clearBtn = document.getElementById("clearBtn");
const gridToggleBtn = document.getElementById("gridToggleBtn");
const toolButtons = document.querySelectorAll(".tool-btn");
const symmetryToggleBtn = document.getElementById("symmetryToggleBtn");
const symmetryOptions = document.getElementById("symmetryOptions");
const symmetryRadios = document.querySelectorAll('input[name="symmetryType"]');

// ============================================
// STATE
// ============================================

let gridSize = 16;
let currentColor = "#000000";
let currentTool = "pen";
let isDrawing = false;
let showGrid = true;
let gridData = [];
let symmetryEnabled = false;
let symmetryType = "vertical";

console.log("🎨 Pixel Art Creator initializing...");

// ============================================
// SOUNDS
// ============================================

const SOUNDS = {
  hover: new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-click-900.mp3"
  ),
  click: new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"
  ),
  clear: new Audio(
    "https://assets.mixkit.co/sfx/preview/mixkit-cyber-laser-245.mp3"
  ),
};

// Mute by default
Object.values(SOUNDS).forEach((sound) => (sound.volume = 0));

let soundEnabled = false;

// ============================================
// 1. GRID CREATION
// ============================================

function createGrid(size) {
  console.log(`📐 Creating ${size}×${size} pixel canvas...`);

  pixelCanvas.innerHTML = "";

  gridData = Array(size)
    .fill(null)
    .map(() => Array(size).fill("#ffffff"));

  const cellSize = 400 / size;
  pixelCanvas.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
  pixelCanvas.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;

  if (showGrid) {
    pixelCanvas.style.gap = "1px";
    pixelCanvas.style.background = "#2d3436";
  } else {
    pixelCanvas.style.gap = "0";
    pixelCanvas.style.background = "white";
  }

  const fragment = document.createDocumentFragment();

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const pixel = document.createElement("div");
      pixel.classList.add("pixel");
      pixel.dataset.row = row;
      pixel.dataset.col = col;
      pixel.style.width = `${cellSize}px`;
      pixel.style.height = `${cellSize}px`;

      if (!showGrid) {
        pixel.style.border = "none";
      }

      fragment.appendChild(pixel);
    }
  }

  pixelCanvas.appendChild(fragment);

  const total = size * size;
  pixelCount.textContent = `${total} pixels`;
  gridSizeDisplay.textContent = `${size}×${size}`;

  console.log("✅ Canvas created!");
}

// ============================================
// 2. SYMMETRY FUNCTIONS
// ============================================

function getMirroredPositions(row, col) {
  const positions = [];
  positions.push({ row, col });

  if (!symmetryEnabled) {
    return positions;
  }

  const mirrorCol = gridSize - 1 - col;
  const mirrorRow = gridSize - 1 - row;

  switch (symmetryType) {
    case "vertical":
      positions.push({ row, col: mirrorCol });
      break;

    case "horizontal":
      positions.push({ row: mirrorRow, col });
      break;

    case "quad":
      positions.push({ row, col: mirrorCol });
      positions.push({ row: mirrorRow, col });
      positions.push({ row: mirrorRow, col: mirrorCol });
      break;

    case "diagonal":
      positions.push({ row: col, col: row });
      positions.push({ row: mirrorRow, col: mirrorCol });
      positions.push({ row: mirrorCol, col: mirrorRow });
      break;
  }

  return positions;
}

function toggleSymmetry() {
  symmetryEnabled = !symmetryEnabled;

  if (symmetryEnabled) {
    symmetryOptions.style.display = "flex";
    symmetryToggleBtn.classList.add("active");
    symmetryToggleBtn.textContent = "🔄 SYMMETRY: ON";
    console.log(`✅ Symmetry enabled: ${symmetryType.toUpperCase()}`);
  } else {
    symmetryOptions.style.display = "none";
    symmetryToggleBtn.classList.remove("active");
    symmetryToggleBtn.textContent = "🔄 SYMMETRY: OFF";
    console.log("❌ Symmetry disabled");
  }
}

// ============================================
// 3. PAINTING LOGIC WITH SYMMETRY
// ============================================

function paintPixel(pixel) {
  const row = parseInt(pixel.dataset.row);
  const col = parseInt(pixel.dataset.col);

  // Handle eyedropper - only pick from original pixel
  if (currentTool === "eyedropper") {
    const pickedColor = rgb2hex(pixel.style.background) || "#ffffff";
    currentColor = pickedColor;
    colorPicker.value = pickedColor;
    updateColorDisplay(pickedColor);
    switchTool("pen");
    console.log(`💧 Picked color: ${pickedColor}`);
    return;
  }

  // Handle fill - only fill from original position
  if (currentTool === "fill") {
    const targetColor = gridData[row][col];
    if (targetColor !== currentColor) {
      floodFill(row, col, targetColor, currentColor);
    }
    return;
  }

  // Get all positions (original + mirrors)
  const positions = getMirroredPositions(row, col);

  // Paint all positions (pen/eraser with symmetry)
  positions.forEach((pos) => {
    const targetPixel = document.querySelector(
      `[data-row="${pos.row}"][data-col="${pos.col}"]`
    );

    if (!targetPixel) return;

    if (currentTool === "pen") {
      targetPixel.style.background = currentColor;
      gridData[pos.row][pos.col] = currentColor;
    } else if (currentTool === "eraser") {
      targetPixel.style.background = "white";
      gridData[pos.row][pos.col] = "#ffffff";
    }
  });
}

// ============================================
// 4. FLOOD FILL ALGORITHM
// ============================================

function floodFill(row, col, targetColor, replacementColor) {
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
  if (gridData[row][col] !== targetColor) return;
  if (targetColor === replacementColor) return;

  gridData[row][col] = replacementColor;
  const pixel = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (pixel) {
    pixel.style.background = replacementColor;
  }

  floodFill(row - 1, col, targetColor, replacementColor);
  floodFill(row + 1, col, targetColor, replacementColor);
  floodFill(row, col - 1, targetColor, replacementColor);
  floodFill(row, col + 1, targetColor, replacementColor);
}

// ============================================
// 5. TOOL SWITCHING
// ============================================

function switchTool(tool) {
  currentTool = tool;

  toolButtons.forEach((btn) => {
    if (btn.dataset.tool === tool) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  console.log(`🔧 Tool: ${tool.toUpperCase()}`);
}

// ============================================
// 6. COLOR MANAGEMENT
// ============================================

function updateColorDisplay(color) {
  currentColor = color;
  currentColorSwatch.style.background = color;
  currentColorCode.textContent = color.toUpperCase();
}

function rgb2hex(rgb) {
  if (!rgb) return null;
  if (rgb.startsWith("#")) return rgb;

  rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!rgb) return null;

  function hex(x) {
    return ("0" + parseInt(x).toString(16)).slice(-2);
  }
  return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

// ============================================
// 7. GRID TOGGLE
// ============================================

function toggleGrid() {
  showGrid = !showGrid;

  const pixels = document.querySelectorAll(".pixel");

  if (showGrid) {
    pixelCanvas.style.gap = "1px";
    pixelCanvas.style.background = "#2d3436";
    pixels.forEach((pixel) => {
      pixel.style.border = "";
    });
    gridToggleBtn.textContent = "🔲 Hide Grid";
  } else {
    pixelCanvas.style.gap = "0";
    pixelCanvas.style.background = "white";
    pixels.forEach((pixel) => {
      pixel.style.border = "none";
    });
    gridToggleBtn.textContent = "🔲 Show Grid";
  }

  console.log(`Grid: ${showGrid ? "ON" : "OFF"}`);
}

// ============================================
// 8. CLEAR CANVAS
// ============================================

function clearCanvas() {
  const confirmed = confirm("⚠️ WIPE ALL DATA? This cannot be undone!");
  if (!confirmed) return;

  if (soundEnabled) {
    SOUNDS.clear.currentTime = 0;
    SOUNDS.clear.play().catch(() => {});
  }

  const pixels = document.querySelectorAll(".pixel");
  pixels.forEach((pixel, index) => {
    setTimeout(() => {
      pixel.style.background = "white";
      const row = parseInt(pixel.dataset.row);
      const col = parseInt(pixel.dataset.col);
      gridData[row][col] = "#ffffff";
    }, index * 2);
  });

  console.log("🗑️ Canvas cleared!");
}

// ============================================
// 9. EVENT LISTENERS
// ============================================

// Drawing
pixelCanvas.addEventListener("mousedown", (e) => {
  if (e.target.classList.contains("pixel")) {
    isDrawing = true;
    paintPixel(e.target);
  }
});

pixelCanvas.addEventListener("mouseover", (e) => {
  if (
    isDrawing &&
    e.target.classList.contains("pixel") &&
    currentTool !== "eyedropper" &&
    currentTool !== "fill"
  ) {
    paintPixel(e.target);
  }
});

document.addEventListener("mouseup", () => {
  isDrawing = false;
});

// Grid size slider
gridSizeSlider.addEventListener("input", (e) => {
  gridSize = parseInt(e.target.value);
  createGrid(gridSize);
});

// Color picker
colorPicker.addEventListener("input", (e) => {
  updateColorDisplay(e.target.value);
  if (currentTool !== "pen") {
    switchTool("pen");
  }
});

// Tool buttons
toolButtons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    if (soundEnabled) {
      SOUNDS.hover.currentTime = 0;
      SOUNDS.hover.play().catch(() => {});
    }
  });

  btn.addEventListener("click", () => {
    switchTool(btn.dataset.tool);
    if (soundEnabled) {
      SOUNDS.click.currentTime = 0;
      SOUNDS.click.play().catch(() => {});
    }
  });
});

// Action buttons
clearBtn.addEventListener("click", clearCanvas);
gridToggleBtn.addEventListener("click", toggleGrid);

// Symmetry toggle
symmetryToggleBtn.addEventListener("click", toggleSymmetry);

// Symmetry type change
symmetryRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    symmetryType = e.target.value;
    console.log(`🔄 Symmetry type: ${symmetryType.toUpperCase()}`);
  });
});

// Sound toggle
const soundToggleBtn = document.getElementById("soundToggleBtn");
if (soundToggleBtn) {
  soundToggleBtn.addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    Object.values(SOUNDS).forEach(
      (sound) => (sound.volume = soundEnabled ? 0.3 : 0)
    );
    this.textContent = soundEnabled ? "🔊 SOUND: ON" : "🔇 SOUND: OFF";
    console.log(`Sound: ${soundEnabled ? "ON" : "OFF"}`);
  });
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "p") switchTool("pen");
  if (key === "e") switchTool("eraser");
  if (key === "i") switchTool("eyedropper");
  if (key === "f") switchTool("fill");
  if (key === "g") toggleGrid();
  if (key === "m") toggleSymmetry();
  if (key === "c") clearCanvas();
});

// ============================================
// 10. INITIALIZATION
// ============================================

console.log("🎨 Pixel Art Creator starting...");
updateColorDisplay("#000000");
switchTool("pen");
createGrid(16);
console.log("✅ Ready to create pixel art!");
console.log(
  "⌨️ Shortcuts: P (Pen) | E (Eraser) | I (Eyedropper) | F (Fill) | G (Grid) | M (Mirror) | C (Clear)"
);

// ============================================
// 11. LOADING SCREEN
// ============================================

window.addEventListener("load", () => {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
      setTimeout(() => loadingScreen.remove(), 500);
      console.log("🚀 Loading complete!");
    }
  }, 2000); // Show for 2 seconds
});

// ============================================
// 12. CONSOLE ART
// ============================================

console.log(
  `
%c
╔═══════════════════════════════════════╗
║   ⚡ PIXEL ART CREATOR - NEON ⚡     ║
║                                       ║
║   Initializing Neural Network...     ║
║   Loading Neon Matrix...             ║
║   Calibrating Holographic Display... ║
║                                       ║
║   System Status: ✅ ONLINE           ║
║   Version: 2077.1.0                  ║
╚═══════════════════════════════════════╝
`,
  "color: #00f5ff; font-family: monospace; font-size: 12px; font-weight: bold; text-shadow: 0 0 10px #00f5ff;"
);

console.log(
  "%c⚡ Welcome to the Grid, Creator...",
  "color: #ff006e; font-size: 16px; font-weight: bold; text-shadow: 0 0 10px #ff006e;"
);
