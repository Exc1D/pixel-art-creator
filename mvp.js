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

// Cyberpunk-themed color palettes
const CYBERPUNK_PALETTES = {
  neon: {
    name: "⚡ Neon Nights",
    colors: [
      "#ff006e",
      "#00f5ff",
      "#9d4edd",
      "#3a86ff",
      "#ffbe0b",
      "#0a0e27",
      "#ff006e",
      "#00f5ff",
    ],
  },
  matrix: {
    name: "🟢 Matrix Code",
    colors: [
      "#000000",
      "#003b00",
      "#008f11",
      "#00ff41",
      "#39ff14",
      "#00ff00",
      "#003b00",
      "#000000",
    ],
  },
  vaporwave: {
    name: "🌸 Vaporwave",
    colors: [
      "#ff71ce",
      "#01cdfe",
      "#05ffa1",
      "#b967ff",
      "#fffb96",
      "#ff006e",
      "#f72585",
      "#7209b7",
    ],
  },
  outrun: {
    name: "🏎️ Outrun",
    colors: [
      "#ff006e",
      "#fb5607",
      "#ffbe0b",
      "#8338ec",
      "#3a86ff",
      "#ff006e",
      "#fb5607",
      "#ffbe0b",
    ],
  },
  blade: {
    name: "🗡️ Blade Runner",
    colors: [
      "#ff0040",
      "#ff8c00",
      "#00f0ff",
      "#001eff",
      "#8000ff",
      "#ff0040",
      "#001eff",
      "#000000",
    ],
  },
  ghost: {
    name: "👻 Ghost Protocol",
    colors: [
      "#00ffff",
      "#0080ff",
      "#8000ff",
      "#ff00ff",
      "#ff0080",
      "#ff0000",
      "#000000",
      "#ffffff",
    ],
  },
};

// ============================================
// STATE
// ============================================

let gridSize = 16;
let currentColor = "#000000";
let currentTool = "pen";
let isDrawing = false;
let showGrid = true;
let gridData = []; // Store pixel colors for save/load

console.log("🎨 Pixel Art Creator initializing...");

// ============================================
// 1. GRID CREATION
// ============================================

function createGrid(size) {
  console.log(`📐 Creating ${size}×${size} pixel canvas...`);

  // Clear canvas
  pixelCanvas.innerHTML = "";

  // Reset grid data
  gridData = Array(size)
    .fill(null)
    .map(() => Array(size).fill("#ffffff"));

  // Set grid size
  const cellSize = 400 / size; // Fixed 400px canvas
  pixelCanvas.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
  pixelCanvas.style.gridTemplateRows = `repeat(${size}, ${cellSize}px)`;

  // Apply grid styling
  if (showGrid) {
    pixelCanvas.style.gap = "1px";
    pixelCanvas.style.background = "#2d3436";
  } else {
    pixelCanvas.style.gap = "0";
    pixelCanvas.style.background = "white";
  }

  // Create pixels
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

  // Update info
  const total = size * size;
  pixelCount.textContent = `${total} pixels`;
  gridSizeDisplay.textContent = `${size}×${size}`;

  console.log("✅ Canvas created!");
}

// ============================================
// 2. TOOL FUNCTIONS
// ============================================

function paintPixel(pixel) {
  const row = parseInt(pixel.dataset.row);
  const col = parseInt(pixel.dataset.col);

  if (currentTool === "pen") {
    pixel.style.background = currentColor;
    gridData[row][col] = currentColor;
  } else if (currentTool === "eraser") {
    pixel.style.background = "white";
    gridData[row][col] = "#ffffff";
  } else if (currentTool === "eyedropper") {
    // Pick color from pixel
    const pickedColor = rgb2hex(pixel.style.background) || "#ffffff";
    currentColor = pickedColor;
    colorPicker.value = pickedColor;
    updateColorDisplay(pickedColor);
    switchTool("pen"); // Auto-switch back to pen
    console.log(`💧 Picked color: ${pickedColor}`);
  } else if (currentTool === "fill") {
    const targetColor = gridData[row][col];
    if (targetColor !== currentColor) {
      floodFill(row, col, targetColor, currentColor);
    }
  }
}

// ============================================
// 3. FLOOD FILL ALGORITHM (for fill tool)
// ============================================

function floodFill(row, col, targetColor, replacementColor) {
  // Boundary checks
  if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;
  if (gridData[row][col] !== targetColor) return;
  if (targetColor === replacementColor) return;

  // Fill this pixel
  gridData[row][col] = replacementColor;
  const pixel = document.querySelector(
    `[data-row="${row}"][data-col="${col}"]`
  );
  if (pixel) {
    pixel.style.background = replacementColor;
  }

  // Recursively fill neighbors (4-directional)
  floodFill(row - 1, col, targetColor, replacementColor); // Up
  floodFill(row + 1, col, targetColor, replacementColor); // Down
  floodFill(row, col - 1, targetColor, replacementColor); // Left
  floodFill(row, col + 1, targetColor, replacementColor); // Right
}

// ============================================
// 4. TOOL SWITCHING
// ============================================

function switchTool(tool) {
  currentTool = tool;

  // Update button states
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
// 5. COLOR MANAGEMENT
// ============================================

function updateColorDisplay(color) {
  currentColor = color;
  currentColorSwatch.style.background = color;
  currentColorCode.textContent = color.toUpperCase();
}

// Helper: Convert RGB to Hex
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
// 6. GRID TOGGLE
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
// 7. CLEAR CANVAS
// ============================================

function clearCanvas() {
  const confirmed = confirm("Clear entire canvas? This cannot be undone!");
  if (!confirmed) return;

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
// 8. EVENT LISTENERS
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
  btn.addEventListener("click", () => {
    switchTool(btn.dataset.tool);
  });
});

// Action buttons
clearBtn.addEventListener("click", clearCanvas);
gridToggleBtn.addEventListener("click", toggleGrid);

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();

  if (key === "p") switchTool("pen");
  if (key === "e") switchTool("eraser");
  if (key === "i") switchTool("eyedropper");
  if (key === "f") switchTool("fill");
  if (key === "g") toggleGrid();
  if (key === "c") clearCanvas();
});

// ============================================
// 9. INITIALIZATION
// ============================================

console.log("🎨 Pixel Art Creator starting...");
updateColorDisplay("#000000");
switchTool("pen");
createGrid(16);
console.log("✅ Ready to create pixel art!");
console.log(
  "⌨️ Shortcuts: P (Pen) | E (Eraser) | I (Eyedropper) | F (Fill) | G (Grid) | C (Clear)"
);

// Play cyberpunk sounds on interactions
const hoverSound = new Audio("cyber-hover.mp3");
button.addEventListener("mouseenter", () => hoverSound.play());

// At top of your script.js
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

// Mute by default (let user enable)
Object.values(SOUNDS).forEach((sound) => (sound.volume = 0.3));

// Add to your event listeners
toolButtons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    SOUNDS.hover.currentTime = 0;
    SOUNDS.hover.play().catch(() => {}); // Catch autoplay errors
  });

  btn.addEventListener("click", () => {
    SOUNDS.click.currentTime = 0;
    SOUNDS.click.play().catch(() => {});
  });
});

// Update clearCanvas function
function clearCanvas() {
  const confirmed = confirm("⚠️ WIPE ALL DATA? This cannot be undone!");
  if (!confirmed) return;

  SOUNDS.clear.play().catch(() => {});

  // ... rest of clear logic
}

let soundEnabled = false;

document
  .getElementById("soundToggleBtn")
  .addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    Object.values(SOUNDS).forEach(
      (sound) => (sound.volume = soundEnabled ? 0.3 : 0)
    );
    this.textContent = soundEnabled ? "🔊 SOUND: ON" : "🔇 SOUND: OFF";
  });
