# EasyAnimation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page frame-by-frame 2D animation web app with a jointed stickman and drawing tools.

**Architecture:** Multi-file vanilla JS app — `index.html` loads CSS/JS modules. Canvas renders frames from a data model (`Frame[]`). Each frame stores stickman joint angles + drawing strokes. UI layers: toolbar (left), canvas (center), properties (right), timeline (bottom).

**Tech Stack:** Vanilla JS, HTML5 Canvas, CSS3, no frameworks/libraries.

---

### Task 1: Project Scaffold & HTML Shell

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/app.js`
- Create: `js/engine.js`
- Create: `js/stickman.js`
- Create: `js/timeline.js`
- Create: `js/tools.js`

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p css js` (or `New-Item -ItemType Directory -Force css; New-Item -ItemType Directory -Force js`)

- [ ] **Step 2: Create `index.html` with layout skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>EasyAnimation</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="app">
    <div id="header">
      <span class="logo">EasyAnimation</span>
      <div class="header-controls">
        <label>FPS: <input type="number" id="fpsInput" value="12" min="1" max="60" /></label>
        <button id="playBtn">Play</button>
        <button id="pauseBtn">Pause</button>
        <button id="resetBtn">Reset</button>
      </div>
    </div>
    <div id="main">
      <div id="toolbar">
        <button class="tool-btn active" data-tool="pose" title="Pose Stickman">&#x1F9CD;</button>
        <button class="tool-btn" data-tool="select" title="Select">&#x1F4CB;</button>
        <button class="tool-btn" data-tool="pencil" title="Pencil">&#x270F;</button>
        <button class="tool-btn" data-tool="line" title="Line">&#x2571;</button>
        <button class="tool-btn" data-tool="circle" title="Circle">&#x25CB;</button>
        <button class="tool-btn" data-tool="rect" title="Rectangle">&#x25A1;</button>
        <button class="tool-btn" data-tool="eraser" title="Eraser">&#x2B1B;</button>
        <button class="tool-btn" data-tool="fill" title="Fill">&#x2B1C;</button>
      </div>
      <div id="canvas-wrap">
        <canvas id="stage"></canvas>
      </div>
      <div id="properties">
        <h3>Properties</h3>
        <div class="prop-group">
          <label>Stroke <input type="color" id="strokeColor" value="#ffffff" /></label>
        </div>
        <div class="prop-group">
          <label>Fill <input type="color" id="fillColor" value="#1e90ff" /></label>
        </div>
        <div class="prop-group">
          <label>Size <input type="range" id="lineWidth" min="1" max="20" value="3" /></label>
        </div>
        <hr />
        <div class="prop-group">
          <label><input type="checkbox" id="showStickman" checked /> Show Stickman</label>
        </div>
        <div class="prop-group">
          <label><input type="checkbox" id="onionSkin" /> Onion Skin</label>
        </div>
      </div>
    </div>
    <div id="timeline">
      <div class="timeline-controls">
        <button id="addFrameBtn">+ Frame</button>
        <button id="dupFrameBtn">Duplicate</button>
        <button id="delFrameBtn">Delete</button>
      </div>
      <div id="frameStrip"></div>
      <span id="frameIndicator">Frame: 1/1</span>
    </div>
  </div>
  <div id="toast"></div>
  <script src="js/stickman.js"></script>
  <script src="js/tools.js"></script>
  <script src="js/timeline.js"></script>
  <script src="js/engine.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `css/style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; background: #0f1720; color: #e2e8f0; }

#app { display: flex; flex-direction: column; height: 100vh; }

#header { display: flex; align-items: center; justify-content: space-between; padding: 10px 20px; background: #111827; border-bottom: 1px solid rgba(255,255,255,.08); }
.logo { font-size: 1.3rem; font-weight: 700; background: linear-gradient(135deg,#1e90ff,#a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.header-controls { display: flex; align-items: center; gap: 12px; }
.header-controls label { font-size: .85rem; color: #94a3b8; }
.header-controls input[type=number] { width: 50px; padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,.1); background: #1e293b; color: #e2e8f0; text-align: center; }
.header-controls button { padding: 6px 16px; border: none; border-radius: 8px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: .85rem; }
.header-controls button:hover { background: #334155; }
.header-controls button#playBtn { background: #1e90ff; color: #fff; }
.header-controls button#playBtn:hover { background: #3b82f6; }

#main { flex: 1; display: flex; overflow: hidden; }

#toolbar { display: flex; flex-direction: column; padding: 8px; gap: 4px; background: #111827; border-right: 1px solid rgba(255,255,255,.08); }
.tool-btn { width: 40px; height: 40px; border: none; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; font-size: 1.1rem; display: grid; place-items: center; transition: background .15s, color .15s; }
.tool-btn:hover { background: #1e293b; color: #e2e8f0; }
.tool-btn.active { background: rgba(30,144,255,.2); color: #1e90ff; }

#canvas-wrap { flex: 1; display: flex; align-items: center; justify-content: center; background: #0a0f16; position: relative; }
#stage { width: 800px; height: 500px; background: #141d2f; border: 1px solid rgba(255,255,255,.08); border-radius: 12px; cursor: crosshair; }

#properties { width: 200px; padding: 16px; background: #111827; border-left: 1px solid rgba(255,255,255,.08); overflow-y: auto; }
#properties h3 { font-size: .9rem; margin-bottom: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
.prop-group { margin-bottom: 12px; }
.prop-group label { display: block; font-size: .8rem; color: #94a3b8; margin-bottom: 4px; }
.prop-group input[type=color] { width: 100%; height: 32px; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; background: #1e293b; cursor: pointer; }
.prop-group input[type=range] { width: 100%; }
.prop-group input[type=checkbox] { margin-right: 6px; }
hr { border: none; border-top: 1px solid rgba(255,255,255,.06); margin: 12px 0; }

#timeline { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #111827; border-top: 1px solid rgba(255,255,255,.08); }
.timeline-controls { display: flex; gap: 6px; }
.timeline-controls button { padding: 5px 12px; border: none; border-radius: 6px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: .8rem; }
.timeline-controls button:hover { background: #334155; }
.timeline-controls button#delFrameBtn { color: #ef4444; }
#frameStrip { flex: 1; display: flex; gap: 4px; overflow-x: auto; padding: 4px 0; }
.frame-thumb { width: 64px; height: 48px; border: 2px solid transparent; border-radius: 6px; background: #1e293b; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: .75rem; color: #64748b; transition: border-color .15s; }
.frame-thumb:hover { border-color: #475569; }
.frame-thumb.active { border-color: #1e90ff; }
#frameIndicator { font-size: .8rem; color: #94a3b8; white-space: nowrap; }
```

---

### Task 2: Stickman Model & Renderer

**Files:**
- Create: `js/stickman.js`

- [ ] **Step 1: Define the stickman data model**

```js
const STICKMAN_PARTS = {
  head:     { parent: null,   length: 20, angle: 0,  x: 400, y: 80,  thickness: 3 },
  neck:     { parent: 'head', length: 8,  angle: 90, x: 0,   y: 0,   thickness: 3 },
  torso:    { parent: 'neck', length: 60, angle: 90, x: 0,   y: 0,   thickness: 4 },
  upperArmL:{ parent: 'torso',length: 25, angle: 150,x: 0,   y: 0,   thickness: 3 },
  upperArmR:{ parent: 'torso',length: 25, angle: 30, x: 0,   y: 0,   thickness: 3 },
  forearmL: { parent: 'upperArmL',length: 25, angle: 180, x: 0, y: 0, thickness: 3 },
  forearmR: { parent: 'upperArmR',length: 25, angle: 0,   x: 0, y: 0, thickness: 3 },
  thighL:   { parent: 'torso',length: 30, angle: 120, x: 0,   y: 0,   thickness: 4 },
  thighR:   { parent: 'torso',length: 30, angle: 60,  x: 0,   y: 0,   thickness: 4 },
  calfL:    { parent: 'thighL',length: 30, angle: 180, x: 0,  y: 0,   thickness: 3 },
  calfR:    { parent: 'thighR',length: 30, angle: 0,   x: 0,  y: 0,   thickness: 3 }
};

function createDefaultStickman() {
  return JSON.parse(JSON.stringify(STICKMAN_PARTS));
}
```

- [ ] **Step 2: Compute world positions for all joints**

```js
function computeJointPositions(parts) {
  const positions = {};
  for (const [name, part] of Object.entries(parts)) {
    if (!part.parent) {
      positions[name] = { x: part.x, y: part.y };
    } else {
      const parentPos = positions[part.parent];
      const rad = part.angle * Math.PI / 180;
      positions[name] = {
        x: parentPos.x + Math.cos(rad) * part.length,
        y: parentPos.y - Math.sin(rad) * part.length  // screen coords: y down
      };
    }
  }
  return positions;
}
```

- [ ] **Step 3: Render stickman on canvas**

```js
function drawStickman(ctx, parts) {
  const pos = computeJointPositions(parts);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Head
  const head = parts.head;
  const hp = pos.head;
  ctx.beginPath();
  ctx.arc(hp.x, hp.y, head.length, 0, Math.PI * 2);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = head.thickness;
  ctx.stroke();

  // Body parts (lines)
  const drawOrder = ['neck','torso','upperArmL','upperArmR','forearmL','forearmR','thighL','thighR','calfL','calfR'];
  for (const name of drawOrder) {
    const part = parts[name];
    const p = pos[name];
    const pp = pos[part.parent];
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = part.thickness;
    ctx.stroke();
  }
}
```

- [ ] **Step 4: Hit testing for joint selection**

```js
function hitTestJoint(parts, mx, my, threshold = 15) {
  const pos = computeJointPositions(parts);
  let closest = null;
  let closestDist = threshold;
  for (const [name, p] of Object.entries(pos)) {
    const dx = mx - p.x;
    const dy = my - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = name;
    }
  }
  return closest;
}
```

- [ ] **Step 5: Export from module**

Just leave these as global functions available after the script loads (no module system needed for single-page app).

---

### Task 3: Drawing Tools System

**Files:**
- Create: `js/tools.js`

- [ ] **Step 1: Tool state and stroke model**

```js
const TOOLS = ['pose','select','pencil','line','circle','rect','eraser','fill'];
let currentTool = 'pose';
let currentStroke = null;
let isDrawing = false;

function createStroke(type, x, y, color, width) {
  return { type, points: [{x,y}], color, width, fillColor: null };
}
```

- [ ] **Step 2: Pointer event handlers**

```js
function onPointerDown(e) {
  const rect = stage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const frame = project.frames[project.currentFrame];
  if (!frame) return;

  if (currentTool === 'pose') {
    const hit = hitTestJoint(frame.stickman, x, y);
    if (hit) { currentJoint = hit; isDraggingJoint = true; }
    return;
  }

  isDrawing = true;
  currentStroke = createStroke(currentTool, x, y, strokeColor, lineWidth);
  if (currentTool === 'fill') {
    floodFill(frame, x, y, fillColor);
    currentStroke = null;
    isDrawing = false;
    render();
    return;
  }
  frame.strokes.push(currentStroke);
}

function onPointerMove(e) {
  const rect = stage.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const frame = project.frames[project.currentFrame];
  if (!frame) return;

  if (isDraggingJoint && currentJoint) {
    const parts = frame.stickman;
    // Rotate the joint to follow cursor
    const pos = computeJointPositions(parts);
    const jointPos = pos[currentJoint];
    const parentName = parts[currentJoint].parent;
    const parentPos = parentName ? pos[parentName] : { x: parts[currentJoint].x, y: parts[currentJoint].y };
    const dx = x - parentPos.x;
    const dy = parentPos.y - y; // invert for screen
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    parts[currentJoint].angle = angle;
    render();
    return;
  }

  if (!isDrawing || !currentStroke) return;
  currentStroke.points.push({x, y});
  if (currentTool === 'line' || currentTool === 'circle' || currentTool === 'rect') {
    currentStroke.points = [currentStroke.points[0], {x, y}];
  }
  render();
}

function onPointerUp(e) {
  if (isDraggingJoint) { isDraggingJoint = false; currentJoint = null; renderFrameThumbs(); return; }
  if (!isDrawing) return;
  isDrawing = false;
  if (currentTool === 'line' || currentTool === 'circle' || currentTool === 'rect') {
    const pts = currentStroke.points;
    if (pts.length >= 2) {
      currentStroke.points = [pts[0], pts[pts.length - 1]];
    }
  }
  if (currentStroke && currentStroke.points.length < 2 && currentTool !== 'fill') {
    const frame = project.frames[project.currentFrame];
    if (frame) frame.strokes.pop();
  }
  currentStroke = null;
  renderFrameThumbs();
  render();
}
```

This defines the tool interaction model. The actual render function will be in engine.js.

---

### Task 4: Canvas Engine

**Files:**
- Create: `js/engine.js`

- [ ] **Step 1: Canvas setup and render loop**

```js
const stage = document.getElementById('stage');
const ctx = stage.getContext('2d');

const CANVAS_W = 800;
const CANVAS_H = 500;
stage.width = CANVAS_W;
stage.height = CANVAS_H;

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  const frame = project.frames[project.currentFrame];
  if (!frame) return;

  // Onion skin: draw previous frame ghosted
  if (document.getElementById('onionSkin').checked && project.currentFrame > 0) {
    const prev = project.frames[project.currentFrame - 1];
    ctx.save();
    ctx.globalAlpha = 0.3;
    renderFrameData(ctx, prev);
    ctx.restore();
  }

  // Current frame
  renderFrameData(ctx, frame);
}

function renderFrameData(ctx, frame) {
  // Draw strokes
  for (const stroke of frame.strokes) {
    drawStroke(ctx, stroke);
  }
  // Draw stickman
  if (document.getElementById('showStickman').checked && frame.stickman) {
    drawStickman(ctx, frame.stickman);
  }
}
```

- [ ] **Step 2: Stroke drawing functions**

```js
function drawStroke(ctx, s) {
  if (!s.points || s.points.length < 1) return;
  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.fillColor || 'transparent';
  ctx.lineWidth = s.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (s.type === 'line' && s.points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    ctx.lineTo(s.points[1].x, s.points[1].y);
    ctx.stroke();
  }
  else if (s.type === 'circle' && s.points.length >= 2) {
    const dx = s.points[1].x - s.points[0].x;
    const dy = s.points[1].y - s.points[0].y;
    const r = Math.sqrt(dx * dx + dy * dy);
    ctx.beginPath();
    ctx.arc(s.points[0].x, s.points[0].y, r, 0, Math.PI * 2);
    if (s.fillColor) ctx.fill();
    ctx.stroke();
  }
  else if (s.type === 'rect' && s.points.length >= 2) {
    const x = Math.min(s.points[0].x, s.points[1].x);
    const y = Math.min(s.points[0].y, s.points[1].y);
    const w = Math.abs(s.points[1].x - s.points[0].x);
    const h = Math.abs(s.points[1].y - s.points[0].y);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if (s.fillColor) ctx.fill();
    ctx.stroke();
  }
  else if (s.type === 'eraser') {
    ctx.strokeStyle = '#141d2f'; // erase by drawing bg color
    ctx.lineWidth = s.width * 2;
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }
  else { // pencil / freeform
    ctx.beginPath();
    ctx.moveTo(s.points[0].x, s.points[0].y);
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x, s.points[i].y);
    }
    ctx.stroke();
  }
}
```

- [ ] **Step 3: Flood fill**

```js
function floodFill(frame, startX, startY, color) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const c = canvas.getContext('2d');

  // Render current frame to temp canvas
  renderFrameData(c, frame);

  const imageData = c.getImageData(0, 0, CANVAS_W, CANVAS_H);
  const data = imageData.data;
  const w = CANVAS_W;

  const startIdx = (Math.floor(startY) * w + Math.floor(startX)) * 4;
  const targetR = data[startIdx];
  const targetG = data[startIdx + 1];
  const targetB = data[startIdx + 2];
  const targetA = data[startIdx + 3];

  // Parse fill color
  const tmp = document.createElement('canvas');
  const tc = tmp.getContext('2d');
  tc.fillStyle = color;
  const hex = tc.fillStyle;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);

  if (r === targetR && g === targetG && b === targetB && targetA === 255) return;

  const stack = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Set();
  const maxStack = 100000;
  let count = 0;

  while (stack.length > 0 && count < maxStack) {
    const [cx, cy] = stack.pop();
    const key = `${cx},${cy}`;
    if (visited.has(key)) continue;
    if (cx < 0 || cx >= CANVAS_W || cy < 0 || cy >= CANVAS_H) continue;
    visited.add(key);

    const idx = (cy * w + cx) * 4;
    if (Math.abs(data[idx] - targetR) > 10 || Math.abs(data[idx+1] - targetG) > 10 ||
        Math.abs(data[idx+2] - targetB) > 10 || data[idx+3] < 128) continue;

    data[idx] = r;
    data[idx+1] = g;
    data[idx+2] = b;
    data[idx+3] = 255;
    count++;

    stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
  }

  // Add fill as a rect stroke covering the filled area (stored as a stroke)
  frame.strokes.push({
    type: 'fill-data',
    imageData: imageData,
    color: color
  });
}
```

For fill, we'll just re-render on top. A simpler approach: add a filled rect background stroke or store the pixel data.

Actually, let me simplify flood fill — just redraw the image data on top:

```js
function floodFill(frame, startX, startY, color) {
  canvas.width = CANVAS_W; canvas.height = CANVAS_H;
  const c = canvas.getContext('2d');
  renderFrameData(c, frame);
  const imageData = c.getImageData(0, 0, CANVAS_W, CANVAS_H);
  const data = imageData.data;
  const w = CANVAS_W;
  const si = (Math.floor(startY) * w + Math.floor(startX)) * 4;
  const tr = data[si], tg = data[si+1], tb = data[si+2], ta = data[si+3];

  const tc = document.createElement('canvas').getContext('2d');
  tc.fillStyle = color;
  const hex = tc.fillStyle;
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);

  if (r===tr && g===tg && b===tb && ta===255) return;

  const stack = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Set();
  let count = 0;
  while (stack.length && count < 50000) {
    const [cx, cy] = stack.pop();
    const key = cx+','+cy;
    if (visited.has(key) || cx<0 || cx>=CANVAS_W || cy<0 || cy>=CANVAS_H) continue;
    visited.add(key);
    const idx = (cy*w+cx)*4;
    if (Math.abs(data[idx]-tr)>10 || Math.abs(data[idx+1]-tg)>10 || Math.abs(data[idx+2]-tb)>10 || data[idx+3]<128) continue;
    data[idx]=r; data[idx+1]=g; data[idx+2]=b; data[idx+3]=255;
    count++;
    stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
  }
  frame.strokes.push({ type:'flood', imageData, color, x:0, y:0, w:CANVAS_W, h:CANVAS_H });
}

// In renderFrameData, add:
// for (const s of frame.strokes) {
//   if (s.type === 'flood') { c.putImageData(s.imageData, 0, 0); continue; }
//   drawStroke(c, s);
// }
```

---

### Task 5: Frame Timeline

**Files:**
- Create: `js/timeline.js`

- [ ] **Step 1: Project data model and frame management**

```js
const project = {
  frames: [],
  currentFrame: 0,
  fps: 12,
  playing: false
};

function initProject() {
  project.frames = [];
  addFrame();
}

function addFrame() {
  const newFrame = {
    stickman: createDefaultStickman(),
    strokes: []
  };
  project.frames.push(newFrame);
  project.currentFrame = project.frames.length - 1;
  renderFrameThumbs();
  render();
  updateFrameIndicator();
}

function duplicateFrame() {
  const src = project.frames[project.currentFrame];
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  project.frames.splice(project.currentFrame + 1, 0, copy);
  project.currentFrame++;
  renderFrameThumbs();
  render();
  updateFrameIndicator();
}

function deleteFrame() {
  if (project.frames.length <= 1) return;
  project.frames.splice(project.currentFrame, 1);
  if (project.currentFrame >= project.frames.length) {
    project.currentFrame = project.frames.length - 1;
  }
  renderFrameThumbs();
  render();
  updateFrameIndicator();
}

function selectFrame(index) {
  if (index < 0 || index >= project.frames.length) return;
  project.currentFrame = index;
  renderFrameThumbs();
  render();
  updateFrameIndicator();
}

function updateFrameIndicator() {
  document.getElementById('frameIndicator').textContent =
    `Frame: ${project.currentFrame + 1}/${project.frames.length}`;
}
```

- [ ] **Step 2: Frame thumbnails rendering**

```js
function renderFrameThumbs() {
  const strip = document.getElementById('frameStrip');
  strip.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 48;
  const c = canvas.getContext('2d');

  project.frames.forEach((frame, i) => {
    c.clearRect(0, 0, 64, 48);
    // Scale frame into thumbnail
    c.save();
    c.scale(64/CANVAS_W, 48/CANVAS_H);
    renderFrameData(c, frame);
    c.restore();

    const thumb = document.createElement('div');
    thumb.className = 'frame-thumb' + (i === project.currentFrame ? ' active' : '');
    thumb.style.backgroundImage = `url(${canvas.toDataURL()})`;
    thumb.style.backgroundSize = 'cover';
    thumb.title = `Frame ${i + 1}`;
    thumb.addEventListener('click', () => selectFrame(i));
    strip.appendChild(thumb);
  });
}
```

---

### Task 6: Main App Controller

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: App initialization**

```js
let isDraggingJoint = false;
let currentJoint = null;
let animationInterval = null;

// UI elements
const strokeColor = '#ffffff';
const fillColor = '#1e90ff';
let lineWidth = 3;
let canvas = document.createElement('canvas'); // for flood fill

function init() {
  // Setup canvas
  stage.width = CANVAS_W;
  stage.height = CANVAS_H;

  // Setup tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTool = btn.dataset.tool;
      stage.style.cursor = currentTool === 'fill' ? 'crosshair' :
        currentTool === 'pose' ? 'grab' : 'crosshair';
    });
  });

  // Properties
  document.getElementById('strokeColor').addEventListener('input', e => {
    window.strokeColor = e.target.value;
  });
  document.getElementById('fillColor').addEventListener('input', e => {
    window.fillColor = e.target.value;
  });
  document.getElementById('lineWidth').addEventListener('input', e => {
    window.lineWidth = parseInt(e.target.value);
  });
  document.getElementById('showStickman').addEventListener('change', render);
  document.getElementById('onionSkin').addEventListener('change', render);

  // Timeline buttons
  document.getElementById('addFrameBtn').addEventListener('click', addFrame);
  document.getElementById('dupFrameBtn').addEventListener('click', duplicateFrame);
  document.getElementById('delFrameBtn').addEventListener('click', deleteFrame);

  // Playback
  document.getElementById('playBtn').addEventListener('click', play);
  document.getElementById('pauseBtn').addEventListener('click', pause);
  document.getElementById('resetBtn').addEventListener('click', reset);

  // FPS
  document.getElementById('fpsInput').addEventListener('change', e => {
    project.fps = parseInt(e.target.value) || 12;
    if (project.playing) { pause(); play(); }
  });

  // Pointer events
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointerleave', onPointerUp);

  // Init
  initProject();
  renderFrameThumbs();
  render();
}
```

- [ ] **Step 2: Playback controls**

```js
function play() {
  if (project.playing) return;
  if (project.frames.length < 2) return;
  project.playing = true;
  document.getElementById('playBtn').textContent = 'Playing...';
  const interval = 1000 / project.fps;
  animationInterval = setInterval(() => {
    let next = project.currentFrame + 1;
    if (next >= project.frames.length) next = 0;
    selectFrame(next);
  }, interval);
}

function pause() {
  project.playing = false;
  document.getElementById('playBtn').textContent = 'Play';
  if (animationInterval) { clearInterval(animationInterval); animationInterval = null; }
}

function reset() {
  pause();
  selectFrame(0);
}
```

- [ ] **Step 3: Bootstrap**

```js
document.addEventListener('DOMContentLoaded', init);
```

---

### Task 7: Final Integration & Style Polish

**Files:**
- Modify: `css/style.css` (polish)

- [ ] **Step 1: Add missing CSS refinements**

Add to style.css:
```css
/* Scrollbar styling */
#frameStrip::-webkit-scrollbar { height: 4px; }
#frameStrip::-webkit-scrollbar-track { background: transparent; }
#frameStrip::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

/* Toast notification */
#toast { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); padding: 8px 20px; border-radius: 8px; background: #1e293b; color: #e2e8f0; font-size: .85rem; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 100; }
#toast.show { opacity: 1; }

/* Responsive canvas */
@media (max-height: 700px) { #stage { width: 600px; height: 375px; } }
@media (max-height: 500px) { #stage { width: 400px; height: 250px; } }
```

- [ ] **Step 2: Add toast helper**

In `app.js`:
```js
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
```

- [ ] **Step 3: Verify all event listeners and data flow**

Check:
- Tool buttons toggle correctly
- Pointer events fire on canvas
- Frame operations (add/dup/del) work
- Playback cycles through frames
- Stickman joint dragging updates angle
- Stroke drawing appears on canvas
- Onion skin & show stickman toggles work
- Thumbnails update on frame change
