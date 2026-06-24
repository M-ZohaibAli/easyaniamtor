# EasyAnimation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform EasyAnimation from a single-screen stickman animator into a multi-screen, mobile-responsive animation app with built-in sprites, layers, tweening, export, and project management.

**Architecture:** Vanilla JS modular SPA with hash-based screen routing (`#start`, `#project`, `#editor/:id`). IndexedDB for persistence via ProjectStore. CSS Grid + Flexbox with mobile-first breakpoints at 480px, 768px, 1024px.

**Tech Stack:** Vanilla JS, HTML5 Canvas, IndexedDB, CSS Grid/Flexbox, gif.js (for GIF export), MediaRecorder API (for WebM export)

---

## File Structure

**Modify:**
- `index.html` — add new screens, script tags, viewport meta
- `css/style.css` — complete responsive rewrite
- `js/timeline.js` — update for layer support, add tweening
- `js/tools.js` — add text tool, update for layer-based drawing

**Create:**
- `js/screen-manager.js` — hash routing + screen rendering
- `js/project-store.js` — IndexedDB persistence
- `js/sprite-library.js` — built-in character/object data + rendering
- `js/layers.js` — layer management (add, delete, reorder, hide, lock)
- `js/undo-manager.js` — undo/redo with command stack
- `js/exporter.js` — GIF, WebM, spritesheet export
- `js/text-tool.js` — text element creation/editing

**Delete:**
- `js/stickman.js` — remove stickman posing feature

---

### Task 1: Screen Manager + Project Store + Start/Project Screens

**Files:**
- Create: `js/screen-manager.js`
- Create: `js/project-store.js`
- Modify: `index.html` (lines 1-71)
- Modify: `css/style.css` (lines 1-51)
- Delete: `js/stickman.js`

- [ ] **Step 1: Write `js/screen-manager.js`**

```js
class ScreenManager {
  constructor(screens, defaultScreen) {
    this.screens = screens
    this.current = null
    window.addEventListener('hashchange', () => this.navigate(window.location.hash))
    if (!window.location.hash) window.location.hash = defaultScreen
    else this.navigate(window.location.hash)
  }

  navigate(hash) {
    const name = hash.replace('#', '').split('/')[0]
    if (this.current) this.current.el.remove()
    const screen = this.screens[name]
    if (!screen) { window.location.hash = '#start'; return }
    screen.onShow && screen.onShow(hash)
    document.getElementById('app').appendChild(screen.el)
    this.current = screen
  }
}

function createScreen(html, onShow) {
  const div = document.createElement('div')
  div.innerHTML = html
  return { el: div.firstElementChild || div, onShow }
}
```

- [ ] **Step 2: Write `js/project-store.js`**

```js
const DB_NAME = 'EasyAnimationDB'
const DB_VER = 1
let db = null

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER)
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore('projects', { keyPath: 'id' })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
    }
    req.onsuccess = () => { db = req.result; resolve() }
    req.onerror = () => reject(req.error)
  })
}

const ProjectStore = {
  async list() {
    const tx = db.transaction('projects', 'readonly')
    const store = tx.objectStore('projects')
    const index = store.index('updatedAt')
    return new Promise(resolve => {
      const result = []
      const req = index.openCursor(null, 'prev')
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) { result.push(cursor.value); cursor.continue() }
        else resolve(result)
      }
    })
  },

  async get(id) {
    const tx = db.transaction('projects', 'readonly')
    return new Promise(resolve => {
      const req = tx.objectStore('projects').get(id)
      req.onsuccess = () => resolve(req.result)
    })
  },

  async save(project) {
    project.updatedAt = Date.now()
    const tx = db.transaction('projects', 'readwrite')
    return new Promise(resolve => {
      tx.objectStore('projects').put(project)
      tx.oncomplete = () => resolve()
    })
  },

  async delete(id) {
    const tx = db.transaction('projects', 'readwrite')
    return new Promise(resolve => {
      tx.objectStore('projects').delete(id)
      tx.oncomplete = () => resolve()
    })
  }
}
```

- [ ] **Step 3: Rewrite `index.html` with new screens**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>EasyAnimation</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <div id="app"></div>
  <div id="toast"></div>
  <div id="modal-overlay" class="hidden"></div>
  <script src="https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js"></script>
  <script src="js/project-store.js"></script>
  <script src="js/screen-manager.js"></script>
  <script src="js/sprite-library.js"></script>
  <script src="js/layers.js"></script>
  <script src="js/undo-manager.js"></script>
  <script src="js/tools.js"></script>
  <script src="js/text-tool.js"></script>
  <script src="js/timeline.js"></script>
  <script src="js/canvas-engine.js"></script>
  <script src="js/exporter.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write start screen + project screen HTML in `app.js`**

In `js/app.js`, define the screen HTML templates:

```js
const START_SCREEN_HTML = `
  <div id="start-screen">
    <div class="start-content">
      <div class="start-logo">EasyAnimation</div>
      <p class="start-tagline">Create frame-by-frame animations, fast.</p>
      <div class="start-actions">
        <button id="btn-new-project" class="btn-primary">New Animation</button>
        <button id="btn-open-projects" class="btn-secondary">Open Project</button>
      </div>
    </div>
  </div>
`

const PROJECT_SCREEN_HTML = `
  <div id="project-screen">
    <div class="ps-header">
      <span class="ps-title">Projects</span>
      <button id="ps-new-btn" class="btn-primary">+ New Project</button>
    </div>
    <div id="ps-grid" class="ps-grid"></div>
  </div>
`
```

- [ ] **Step 5: Wire up screens in `app.js`**

```js
async function init() {
  await openDB()

  const screens = {
    start: createScreen(START_SCREEN_HTML, () => {
      document.getElementById('btn-new-project').onclick = showNewProjectDialog
      document.getElementById('btn-open-projects').onclick = () => { window.location.hash = '#projects' }
    }),
    projects: createScreen(PROJECT_SCREEN_HTML, () => renderProjectGrid()),
    editor: createScreen('<div id="editor-screen">Loading...</div>', (hash) => {
      const id = hash.split('/')[1]
      if (id) loadProjectIntoEditor(id)
    })
  }

  new ScreenManager(screens, '#start')
}

function showNewProjectDialog() {
  const modal = document.getElementById('modal-overlay')
  modal.innerHTML = `
    <div class="modal-dialog">
      <h2>New Project</h2>
      <label>Name <input id="np-name" value="Untitled" /></label>
      <label>Width <select id="np-width">
        <option value="480">480px</option>
        <option value="800" selected>800px</option>
        <option value="1024">1024px</option>
        <option value="1920">1920px</option>
      </select></label>
      <label>Height <select id="np-height">
        <option value="360">360px</option>
        <option value="500" selected>500px</option>
        <option value="576">576px</option>
        <option value="1080">1080px</option>
      </select></label>
      <label>FPS <input type="number" id="np-fps" value="12" min="1" max="60" /></label>
      <div class="modal-actions">
        <button id="np-cancel" class="btn-secondary">Cancel</button>
        <button id="np-create" class="btn-primary">Create</button>
      </div>
    </div>
  `
  modal.classList.remove('hidden')
  document.getElementById('np-cancel').onclick = () => modal.classList.add('hidden')
  document.getElementById('np-create').onclick = async () => {
    const project = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: document.getElementById('np-name').value || 'Untitled',
      width: parseInt(document.getElementById('np-width').value),
      height: parseInt(document.getElementById('np-height').value),
      fps: parseInt(document.getElementById('np-fps').value) || 12,
      bgColor: '#141d2f',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      frames: [createEmptyFrame()]
    }
    await ProjectStore.save(project)
    modal.classList.add('hidden')
    window.location.hash = 'editor/' + project.id
  }
}

function createEmptyFrame() {
  return {
    layers: [{
      id: 'layer_1',
      name: 'Layer 1',
      visible: true,
      locked: false,
      strokes: [],
      sprites: [],
      texts: []
    }]
  }
}
```

- [ ] **Step 6: Implement `renderProjectGrid()`**

```js
async function renderProjectGrid() {
  const grid = document.getElementById('ps-grid')
  const projects = await ProjectStore.list()
  if (projects.length === 0) {
    grid.innerHTML = '<div class="ps-empty"><p>No projects yet.</p><button id="ps-empty-btn" class="btn-primary">Create your first animation</button></div>'
    document.getElementById('ps-empty-btn').onclick = showNewProjectDialog
    return
  }
  grid.innerHTML = projects.map(p => `
    <div class="ps-card" data-id="${p.id}">
      <div class="ps-card-thumb" style="background:#141d2f"></div>
      <div class="ps-card-info">
        <span class="ps-card-name">${escHtml(p.name)}</span>
        <span class="ps-card-meta">${p.frames.length} frames</span>
      </div>
    </div>
  `).join('')
  grid.querySelectorAll('.ps-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = 'editor/' + card.dataset.id
    })
  })
}

function escHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
```

- [ ] **Step 7: Commit**

```bash
git add index.html js/screen-manager.js js/project-store.js js/app.js css/style.css
git rm js/stickman.js
git add -A
git commit -m "feat: add screen manager, project store, start/project screens; remove stickman"
```

---

### Task 2: Sprite Library Data + Rendering

**Files:**
- Create: `js/sprite-library.js`
- Modify: `css/style.css`

- [ ] **Step 1: Write `js/sprite-library.js`**

```js
const SPRITES = {
  characters: [
    { id: 'boy', name: 'Boy', paths: [
      { d: 'M20,5 a15,15 0 1,0 0,1z', fill: '#f0c8a0' },
      { d: 'M20,20 L20,50', stroke: '#333', width: 3 },
      { d: 'M20,30 L5,45', stroke: '#333', width: 2 },
      { d: 'M20,30 L35,45', stroke: '#333', width: 2 },
      { d: 'M20,50 L10,70', stroke: '#333', width: 3 },
      { d: 'M20,50 L30,70', stroke: '#333', width: 3 },
    ]},
    { id: 'girl', name: 'Girl', paths: [
      { d: 'M20,5 a15,15 0 1,0 0,1z', fill: '#f0c8a0' },
      { d: 'M5,0 L5,20 L35,20 L35,0 Z', fill: '#e74c3c' },
      { d: 'M20,20 L20,50', stroke: '#333', width: 3 },
      { d: 'M20,30 L5,45', stroke: '#333', width: 2 },
      { d: 'M20,30 L35,45', stroke: '#333', width: 2 },
      { d: 'M20,50 L10,70', stroke: '#333', width: 3 },
      { d: 'M20,50 L30,70', stroke: '#333', width: 3 },
    ]},
    { id: 'robot', name: 'Robot', paths: [
      { d: 'M10,0 L30,0 L30,20 L10,20 Z', fill: '#95a5a6' },
      { d: 'M13,6 h4 v4 h-4 z', fill: '#2ecc71' },
      { d: 'M23,6 h4 v4 h-4 z', fill: '#2ecc71' },
      { d: 'M10,20 L30,20 L30,50 L10,50 Z', fill: '#7f8c8d' },
      { d: 'M10,30 L5,45', stroke: '#7f8c8d', width: 3 },
      { d: 'M30,30 L35,45', stroke: '#7f8c8d', width: 3 },
      { d: 'M15,50 L12,70', stroke: '#7f8c8d', width: 3 },
      { d: 'M25,50 L28,70', stroke: '#7f8c8d', width: 3 },
    ]},
    { id: 'cat', name: 'Cat', paths: [
      { d: 'M15,10 L20,0 L25,10', fill: '#f39c12', stroke: '#e67e22', width: 2 },
      { d: 'M10,10 C10,25 30,25 30,10 Z', fill: '#f39c12' },
      { d: 'M16,12 a2,2 0 1,0 0,1', fill: '#333' },
      { d: 'M24,12 a2,2 0 1,0 0,1', fill: '#333' },
      { d: 'M15,18 L25,18', stroke: '#333', width: 1.5 },
      { d: 'M12,25 L8,40', stroke: '#f39c12', width: 3 },
      { d: 'M28,25 L32,40', stroke: '#f39c12', width: 3 },
      { d: 'M18,30 L18,50 L14,55', stroke: '#f39c12', width: 3 },
      { d: 'M22,30 L22,50 L26,55', stroke: '#f39c12', width: 3 },
    ]},
    { id: 'monster', name: 'Monster', paths: [
      { d: 'M5,15 C5,0 35,0 35,15 L35,35 C35,50 5,50 5,35 Z', fill: '#9b59b6' },
      { d: 'M10,2 L10,-5 M15,2 L15,-5 M20,2 L20,-5', stroke: '#9b59b6', width: 2 },
      { d: 'M12,15 a3,3 0 1,0 0,1', fill: '#fff' },
      { d: 'M22,15 a3,3 0 1,0 0,1', fill: '#fff' },
      { d: 'M14,22 Q20,28 26,22', stroke: '#fff', width: 2, fill: 'none' },
    ]},
    { id: 'bird', name: 'Bird', paths: [
      { d: 'M20,15 a10,8 0 1,0 0,1', fill: '#e74c3c' },
      { d: 'M8,10 L0,5 L8,12', fill: '#c0392b' },
      { d: 'M32,10 L40,5 L32,12', fill: '#c0392b' },
      { d: 'M24,10 a2,2 0 1,0 0,1', fill: '#333' },
      { d: 'M20,12 L20,20 L10,28', stroke: '#c0392b', width: 2 },
      { d: 'M20,20 L30,28', stroke: '#c0392b', width: 2 },
    ]},
    { id: 'fish', name: 'Fish', paths: [
      { d: 'M5,15 Q20,0 35,15 Q20,30 5,15', fill: '#3498db' },
      { d: 'M35,15 L45,5 L45,25 Z', fill: '#2980b9' },
      { d: 'M12,12 a2,2 0 1,0 0,1', fill: '#fff' },
    ]},
    { id: 'alien', name: 'Alien', paths: [
      { d: 'M8,5 C8,-5 32,-5 32,5 L35,25 C35,40 5,40 5,25 Z', fill: '#2ecc71' },
      { d: 'M12,10 a4,4 0 1,0 0,1', fill: '#111' },
      { d: 'M24,10 a4,4 0 1,0 0,1', fill: '#111' },
      { d: 'M15,18 Q20,25 25,18', stroke: '#27ae60', width: 2, fill: 'none' },
      { d: 'M2,20 L8,18 M38,20 L32,18', stroke: '#2ecc71', width: 2 },
    ]},
  ],
  objects: [
    { id: 'ball', name: 'Ball', paths: [{ d: 'M10,10 a10,10 0 1,0 0,1', fill: '#e74c3c' }, { d: 'M10,0 L10,20 M0,10 L20,10', stroke: '#fff', width: 1 }] },
    { id: 'star', name: 'Star', paths: [{ d: 'M15,0 L18,10 L30,10 L20,17 L24,28 L15,21 L6,28 L10,17 L0,10 L12,10 Z', fill: '#f1c40f', stroke: '#f39c12', width: 1 }] },
    { id: 'heart', name: 'Heart', paths: [{ d: 'M15,25 C5,10 0,5 0,0 C0,-8 8,-10 15,-2 C22,-10 30,-8 30,0 C30,5 25,10 15,25', fill: '#e74c3c' }] },
    { id: 'cloud', name: 'Cloud', paths: [{ d: 'M5,15 Q5,5 15,5 Q20,-5 30,5 Q40,5 40,15 Q45,25 35,25 L10,25 Q0,25 5,15', fill: '#ecf0f1' }] },
    { id: 'tree', name: 'Tree', paths: [{ d: 'M12,40 L12,25', stroke: '#8b4513', width: 5 }, { d: 'M5,25 Q15,5 25,25 Z', fill: '#27ae60' }] },
    { id: 'house', name: 'House', paths: [{ d: 'M5,25 L5,45 L35,45 L35,25 Z', fill: '#e67e22' }, { d: 'M-2,25 L20,5 L42,25', stroke: '#c0392b', width: 3, fill: 'none' }, { d: 'M15,35 L25,35 L25,45 L15,45 Z', fill: '#8b4513' }] },
    { id: 'car', name: 'Car', paths: [{ d: 'M5,20 L5,30 L35,30 L35,20 Z', fill: '#3498db' }, { d: 'M8,20 L12,10 L28,10 L32,20', fill: '#2980b9' }, { d: 'M10,30 a5,5 0 1,0 0,1', fill: '#333' }, { d: 'M30,30 a5,5 0 1,0 0,1', fill: '#333' }] },
    { id: 'sun', name: 'Sun', paths: [{ d: 'M15,15 a10,10 0 1,0 0,1', fill: '#f1c40f' }, { d: 'M15,0 L15,-4 M15,30 L15,34 M0,15 L-4,15 M30,15 L34,15 M4,4 L1,1 M26,26 L29,29 M4,26 L1,29 M26,4 L29,1', stroke: '#f1c40f', width: 2 }] },
    { id: 'moon', name: 'Moon', paths: [{ d: 'M20,5 a12,12 0 1,0 0,25 a10,10 0 1,1 0,-25', fill: '#f5f5dc' }] },
    { id: 'arrow', name: 'Arrow', paths: [{ d: 'M0,12 L30,12', stroke: '#e74c3c', width: 3 }, { d: 'M25,5 L35,12 L25,19', fill: '#e74c3c' }] },
    { id: 'box', name: 'Box', paths: [{ d: 'M0,0 L30,0 L30,30 L0,30 Z', fill: 'none', stroke: '#ecf0f1', width: 2 }] },
    { id: 'flower', name: 'Flower', paths: [{ d: 'M10,30 L10,15', stroke: '#27ae60', width: 3 }, { d: 'M10,5 a6,6 0 1,0 0,1 M4,10 a6,6 0 1,0 0,1 M16,10 a6,6 0 1,0 0,1 M10,13 a6,6 0 1,0 0,1', fill: '#e74c3c', stroke: '#c0392b', width: 1 }] },
  ]
}
```

- [ ] **Step 2: Add sprite rendering helpers**

```js
function renderSprite(ctx, sprite, x, y, scaleX = 1, scaleY = 1) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scaleX, scaleY)
  for (const p of sprite.paths) {
    const path = new Path2D(p.d)
    if (p.fill) { ctx.fillStyle = p.fill; ctx.fill(path) }
    if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.width || 2; ctx.stroke(path) }
  }
  ctx.restore()
}
```

- [ ] **Step 3: Add sprite panel HTML rendering helper**

```js
function renderSpritePanel() {
  return `
    <div id="sprite-panel" class="panel-collapsible">
      <div class="panel-header">Sprites <button id="sp-toggle" class="panel-toggle">-</button></div>
      <div id="sp-content">
        <div class="sp-tabs">
          <button class="sp-tab active" data-cat="characters">Characters</button>
          <button class="sp-tab" data-cat="objects">Objects</button>
        </div>
        <div id="sp-grid" class="sp-grid"></div>
      </div>
    </div>
  `
}
```

- [ ] **Step 4: Commit**

```bash
git add js/sprite-library.js
git commit -m "feat: add sprite library with 8 characters and 12 objects"
```

---

### Task 3: Editor Refactor — Canvas Engine with Layers, Zoom, Pan + Remove Stickman

**Files:**
- Modify: `js/timeline.js` (full rewrite for layer support)
- Create: `js/canvas-engine.js`
- Create: `js/layers.js`
- Delete: `js/engine.js`

- [ ] **Step 1: Write `js/layers.js`**

```js
function createLayer(name = 'Layer 1') {
  return {
    id: 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    name,
    visible: true,
    locked: false,
    strokes: [],
    sprites: [],
    texts: []
  }
}

function addLayer(frame, name) {
  frame.layers.push(createLayer(name))
}

function removeLayer(frame, layerId) {
  if (frame.layers.length <= 1) return
  frame.layers = frame.layers.filter(l => l.id !== layerId)
}

function duplicateLayer(frame, layerId) {
  const src = frame.layers.find(l => l.id === layerId)
  if (!src) return
  const copy = JSON.parse(JSON.stringify(src))
  copy.id = 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5)
  copy.name = src.name + ' (copy)'
  const idx = frame.layers.indexOf(src)
  frame.layers.splice(idx + 1, 0, copy)
}

function moveLayer(frame, layerId, direction) {
  const idx = frame.layers.findIndex(l => l.id === layerId)
  if (idx === -1) return
  const target = idx + direction
  if (target < 0 || target >= frame.layers.length) return
  ;[frame.layers[idx], frame.layers[target]] = [frame.layers[target], frame.layers[idx]]
}
```

- [ ] **Step 2: Write `js/canvas-engine.js`**

```js
let CANVAS_W = 800
let CANVAS_H = 500
let zoom = 1
let panX = 0
let panY = 0
let isPanning = false
let panStart = { x: 0, y: 0 }
let gridVisible = false
let _floodCanvas = null

const stage = document.getElementById('stage')
const ctx = stage.getContext('2d')

function resizeCanvas(w, h) {
  CANVAS_W = w
  CANVAS_H = h
  stage.width = w
  stage.height = h
}

function getFloodCanvas() {
  if (!_floodCanvas) {
    _floodCanvas = document.createElement('canvas')
    _floodCanvas.width = CANVAS_W
    _floodCanvas.height = CANVAS_H
  }
  return _floodCanvas
}

function render() {
  ctx.clearRect(0, 0, stage.width, stage.height)
  ctx.save()
  ctx.translate(panX, panY)
  ctx.scale(zoom, zoom)

  if (gridVisible) drawGrid()

  const frame = project.frames[project.currentFrame]
  if (!frame) { ctx.restore(); return }

  renderFrameData(ctx, frame)
  ctx.restore()
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let x = 0; x <= CANVAS_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
  }
  for (let y = 0; y <= CANVAS_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
  }
}

function renderFrameData(c, frame) {
  for (const layer of frame.layers) {
    if (!layer.visible) continue
    for (const s of layer.strokes) {
      if (s.type === 'flood') { c.putImageData(s.imageData, 0, 0); continue }
      drawStroke(c, s)
    }
    for (const si of layer.sprites) {
      const sprite = findSprite(si.spriteId)
      if (sprite) renderSprite(c, sprite, si.x, si.y, si.scaleX, si.scaleY)
    }
    for (const t of layer.texts) {
      c.font = t.size + 'px ' + t.font
      c.fillStyle = t.color
      c.fillText(t.text, t.x, t.y)
    }
  }
}

function findSprite(id) {
  for (const cat of ['characters', 'objects']) {
    const found = SPRITES[cat].find(s => s.id === id)
    if (found) return found
  }
  return null
}

// Reuse drawStroke from original engine.js (same implementation)
function drawStroke(c, s) {
  if (!s.points || s.points.length < 1) return
  c.strokeStyle = s.color
  c.fillStyle = s.fillColor || 'transparent'
  c.lineWidth = s.width
  c.lineCap = 'round'
  c.lineJoin = 'round'
  if (s.type === 'line' && s.points.length >= 2) {
    c.beginPath(); c.moveTo(s.points[0].x, s.points[0].y); c.lineTo(s.points[1].x, s.points[1].y); c.stroke()
  } else if (s.type === 'circle' && s.points.length >= 2) {
    const dx = s.points[1].x - s.points[0].x, dy = s.points[1].y - s.points[0].y, r = Math.sqrt(dx*dx + dy*dy)
    c.beginPath(); c.arc(s.points[0].x, s.points[0].y, r, 0, Math.PI * 2)
    if (s.fillColor && s.fillColor !== 'transparent') c.fill()
    c.stroke()
  } else if (s.type === 'rect' && s.points.length >= 2) {
    const x = Math.min(s.points[0].x, s.points[1].x), y = Math.min(s.points[0].y, s.points[1].y), w = Math.abs(s.points[1].x - s.points[0].x), h = Math.abs(s.points[1].y - s.points[0].y)
    c.beginPath(); c.rect(x, y, w, h)
    if (s.fillColor && s.fillColor !== 'transparent') c.fill()
    c.stroke()
  } else if (s.type === 'eraser') {
    c.strokeStyle = getCanvasBgColor(); c.lineWidth = s.width * 2
    c.beginPath(); c.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) c.lineTo(s.points[i].x, s.points[i].y)
    c.stroke()
  } else {
    c.beginPath(); c.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) c.lineTo(s.points[i].x, s.points[i].y)
    c.stroke()
  }
}

function getCanvasBgColor() { return project.bgColor || '#141d2f' }

// Flood fill (same as original)
function floodFill(frame, startX, startY, color) {
  const fCanvas = getFloodCanvas()
  const fc = fCanvas.getContext('2d')
  fc.clearRect(0, 0, CANVAS_W, CANVAS_H)
  renderFrameData(fc, frame)
  const imageData = fc.getImageData(0, 0, CANVAS_W, CANVAS_H)
  const data = imageData.data, w = CANVAS_W
  const si = (Math.floor(startY) * w + Math.floor(startX)) * 4
  const tr = data[si], tg = data[si+1], tb = data[si+2], ta = data[si+3]
  const tmpC = document.createElement('canvas').getContext('2d')
  tmpC.fillStyle = color
  const hex = tmpC.fillStyle
  const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16)
  if (r === tr && g === tg && b === tb && ta === 255) return
  const stack = [[Math.floor(startX), Math.floor(startY)]]
  const visited = new Set(); let count = 0
  while (stack.length && count < 50000) {
    const [cx, cy] = stack.pop()
    const key = cx + ',' + cy
    if (visited.has(key) || cx < 0 || cx >= CANVAS_W || cy < 0 || cy >= CANVAS_H) continue
    visited.add(key)
    const idx = (cy * w + cx) * 4
    if (Math.abs(data[idx] - tr) > 10 || Math.abs(data[idx+1] - tg) > 10 || Math.abs(data[idx+2] - tb) > 10 || data[idx+3] < 128) continue
    data[idx] = r; data[idx+1] = g; data[idx+2] = b; data[idx+3] = 255; count++
    stack.push([cx+1,cy], [cx-1,cy], [cx,cy+1], [cx,cy-1])
  }
  const activeLayer = getActiveLayer(frame)
  activeLayer.strokes.push({ type: 'flood', imageData, color, x: 0, y: 0, w: CANVAS_W, h: CANVAS_H })
}

// Zoom / Pan handlers
function setupCanvasControls() {
  stage.addEventListener('wheel', e => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    zoom = Math.max(0.1, Math.min(5, zoom * delta))
    render()
  }, { passive: false })

  stage.addEventListener('pointerdown', e => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      isPanning = true
      panStart = { x: e.clientX - panX, y: e.clientY - panY }
      stage.style.cursor = 'grabbing'
    }
  })

  stage.addEventListener('pointermove', e => {
    if (isPanning) {
      panX = e.clientX - panStart.x
      panY = e.clientY - panStart.y
      render()
    }
  })

  stage.addEventListener('pointerup', () => {
    if (isPanning) { isPanning = false; stage.style.cursor = 'crosshair' }
  })
}
```

- [ ] **Step 3: Update `js/timeline.js` — remove stickman, add layer support**

```js
const project = {
  frames: [],
  currentFrame: 0,
  fps: 12,
  playing: false,
  id: null,
  name: 'Untitled',
  width: 800,
  height: 500,
  bgColor: '#141d2f'
}

let animationInterval = null

function initProject() {
  project.frames = []
  project.frames.push(createEmptyFrame())
}

function getActiveLayer(frame) {
  return frame.layers.find(l => !l.locked) || frame.layers[0]
}

function addFrame() {
  const prev = project.frames[project.currentFrame]
  const newFrame = JSON.parse(JSON.stringify(prev))
  project.frames.push(newFrame)
  project.currentFrame = project.frames.length - 1
  renderFrameThumbs()
  render()
  updateFrameIndicator()
}

function duplicateFrame() {
  const src = project.frames[project.currentFrame]
  if (!src) return
  const copy = JSON.parse(JSON.stringify(src))
  project.frames.splice(project.currentFrame + 1, 0, copy)
  project.currentFrame++
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function deleteFrame() {
  if (project.frames.length <= 1) return
  project.frames.splice(project.currentFrame, 1)
  if (project.currentFrame >= project.frames.length) project.currentFrame = project.frames.length - 1
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function selectFrame(index) {
  if (index < 0 || index >= project.frames.length) return
  project.currentFrame = index
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function updateFrameIndicator() {
  const el = document.getElementById('frameIndicator')
  if (el) el.textContent = `Frame: ${project.currentFrame + 1}/${project.frames.length}`
}

function renderFrameThumbs() {
  const strip = document.getElementById('frameStrip')
  if (!strip) return
  strip.innerHTML = ''
  project.frames.forEach((frame, i) => {
    const tc = document.createElement('canvas')
    tc.width = 64; tc.height = 48
    const tctx = tc.getContext('2d')
    tctx.save(); tctx.scale(64/project.width, 48/project.height)
    renderFrameData(tctx, frame)
    tctx.restore()
    const thumb = document.createElement('div')
    thumb.className = 'frame-thumb' + (i === project.currentFrame ? ' active' : '')
    thumb.style.backgroundImage = `url(${tc.toDataURL()})`
    thumb.title = `Frame ${i + 1}`
    thumb.addEventListener('click', () => selectFrame(i))
    strip.appendChild(thumb)
  })
  strip.scrollLeft = strip.scrollWidth
}
```

- [ ] **Step 4: Remove `js/stickman.js` and `js/engine.js`, delete their script tags from `index.html`**

- [ ] **Step 5: Commit**

```bash
git rm js/stickman.js js/engine.js
git add js/canvas-engine.js js/layers.js js/timeline.js
git commit -m "feat: refactor editor with layer support, zoom/pan; remove stickman"
```

---

### Task 4: Tools Update — Add Text Tool, Layer-Aware Drawing

**Files:**
- Modify: `js/tools.js` (full rewrite)
- Create: `js/text-tool.js`

- [ ] **Step 1: Write `js/text-tool.js`**

```js
let isAddingText = false
let textStart = null

function startTextTool() {
  isAddingText = true
  stage.style.cursor = 'text'
}

function onTextPointerDown(x, y) {
  if (!isAddingText) return
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'text-input-overlay'
  input.style.left = (x * zoom + panX) + 'px'
  input.style.top = (y * zoom + panY) + 'px'
  input.style.position = 'absolute'
  document.getElementById('canvas-wrap').appendChild(input)
  input.focus()
  input.addEventListener('blur', () => {
    if (input.value) {
      const frame = project.frames[project.currentFrame]
      const layer = getActiveLayer(frame)
      layer.texts.push({
        x, y,
        text: input.value,
        font: document.getElementById('textFont')?.value || 'sans-serif',
        size: parseInt(document.getElementById('textSize')?.value) || 20,
        color: document.getElementById('strokeColor').value
      })
      render(); renderFrameThumbs()
    }
    input.remove()
    isAddingText = false
    stage.style.cursor = 'crosshair'
  })
}
```

- [ ] **Step 2: Rewrite `js/tools.js` — remove pose tool, add text tool, layer-aware**

```js
const TOOLS = ['select', 'pencil', 'line', 'circle', 'rect', 'eraser', 'fill', 'text']
let currentTool = 'pencil'
let currentStroke = null
let isDrawing = false
let isDraggingSprite = false
let dragSpriteId = null
let dragOffset = null

function createStroke(type, x, y, color, width) {
  return { type, points: [{x,y}], color, width, fillColor: document.getElementById('fillColor').value || null }
}

function getActiveLayer(frame) {
  return frame.layers.find(l => !l.locked) || frame.layers[0]
}

function onPointerDown(e) {
  const rect = stage.getBoundingClientRect()
  const scaleX = project.width / rect.width
  const scaleY = project.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const frame = project.frames[project.currentFrame]
  if (!frame) return

  if (currentTool === 'text') {
    onTextPointerDown(x, y)
    return
  }

  if (currentTool === 'select') {
    // Check sprite hit
    for (const layer of frame.layers) {
      if (!layer.visible) continue
      for (const si of layer.sprites) {
        const hit = hitTestSprite(x, y, si)
        if (hit) {
          isDraggingSprite = true
          dragSpriteId = si.spriteId + '_' + layer.id
          dragOffset = { x: x - si.x, y: y - si.y }
          return
        }
      }
    }
    return
  }

  isDrawing = true
  const sColor = document.getElementById('strokeColor').value
  const w = parseInt(document.getElementById('lineWidth').value)
  currentStroke = createStroke(currentTool, x, y, sColor, w)

  if (currentTool === 'fill') {
    floodFill(frame, x, y, document.getElementById('fillColor').value)
    currentStroke = null; isDrawing = false
    render(); renderFrameThumbs()
    return
  }

  const layer = getActiveLayer(frame)
  layer.strokes.push(currentStroke)
}

function onPointerMove(e) {
  const rect = stage.getBoundingClientRect()
  const scaleX = project.width / rect.width
  const scaleY = project.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const frame = project.frames[project.currentFrame]
  if (!frame) return

  if (isDraggingSprite) {
    for (const layer of frame.layers) {
      for (const si of layer.sprites) {
        const key = si.spriteId + '_' + layer.id
        if (key === dragSpriteId) {
          si.x = x - dragOffset.x
          si.y = y - dragOffset.y
          render(); return
        }
      }
    }
    return
  }

  if (!isDrawing || !currentStroke) return
  if (currentTool === 'pencil' || currentTool === 'eraser') {
    currentStroke.points.push({x, y})
  } else {
    currentStroke.points = [currentStroke.points[0], {x, y}]
  }
  render()
}

function onPointerUp() {
  if (isDraggingSprite) { isDraggingSprite = false; dragSpriteId = null; renderFrameThumbs(); return }
  if (!isDrawing) return
  isDrawing = false
  if (currentStroke && currentStroke.points.length < 2 && currentTool !== 'fill' && currentTool !== 'pencil' && currentTool !== 'eraser') {
    const frame = project.frames[project.currentFrame]
    if (frame) {
      for (const layer of frame.layers) {
        const idx = layer.strokes.indexOf(currentStroke)
        if (idx !== -1) { layer.strokes.splice(idx, 1); break }
      }
    }
  }
  currentStroke = null
  renderFrameThumbs(); render()
}

function hitTestSprite(mx, my, si) {
  const dx = mx - si.x, dy = my - si.y
  const size = Math.abs(si.scaleX || 1) * 20
  return dx * dx + dy * dy < size * size
}
```

- [ ] **Step 3: Commit**

```bash
git add js/tools.js js/text-tool.js
git commit -m "feat: add text tool, select/move sprites, layer-aware drawing"
```

---

### Task 5: Timeline — Add Tweening

**Files:**
- Modify: `js/timeline.js` (add tween function)

- [ ] **Step 1: Add tweening to timeline**

```js
function tweenFrames(fromIdx, toIdx) {
  if (fromIdx === toIdx) return
  const from = project.frames[fromIdx]
  const to = project.frames[toIdx]
  if (!from || !to) return

  const steps = Math.abs(toIdx - fromIdx) * 3 - 1
  if (steps < 1) return

  // Interpolate sprite positions only
  const newFrames = []
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1)
    const interpolated = JSON.parse(JSON.stringify(from))

    for (let li = 0; li < Math.min(from.layers.length, to.layers.length); li++) {
      const fromLayer = from.layers[li]
      const toLayer = to.layers[li]
      const iLayer = interpolated.layers[li]
      iLayer.strokes = JSON.parse(JSON.stringify(fromLayer.strokes))
      iLayer.texts = JSON.parse(JSON.stringify(fromLayer.texts))

      // Interpolate sprites
      iLayer.sprites = []
      for (const fromSprite of fromLayer.sprites) {
        const toSprite = toLayer.sprites.find(s => s.spriteId === fromSprite.spriteId)
        if (toSprite) {
          iLayer.sprites.push({
            spriteId: fromSprite.spriteId,
            x: lerp(fromSprite.x, toSprite.x, t),
            y: lerp(fromSprite.y, toSprite.y, t),
            scaleX: lerp(fromSprite.scaleX || 1, toSprite.scaleX || 1, t),
            scaleY: lerp(fromSprite.scaleY || 1, toSprite.scaleY || 1, t),
            rotation: lerp(fromSprite.rotation || 0, toSprite.rotation || 0, t)
          })
        } else {
          iLayer.sprites.push(JSON.parse(JSON.stringify(fromSprite)))
        }
      }
    }
    newFrames.push(interpolated)
  }

  // Insert tweened frames after fromIdx
  project.frames.splice(fromIdx + 1, 0, ...newFrames)
  project.currentFrame = fromIdx
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function lerp(a, b, t) { return a + (b - a) * t }
```

- [ ] **Step 2: Commit**

```bash
git add js/timeline.js
git commit -m "feat: add tweening between frames for sprite positions"
```

---

### Task 6: Undo/Redo Manager

**Files:**
- Create: `js/undo-manager.js`

- [ ] **Step 1: Write `js/undo-manager.js`**

```js
const MAX_UNDO = 50
let undoStack = []
let redoStack = []
let undoId = 0

function saveState() {
  undoStack.push(JSON.stringify(project.frames))
  undoId++
  if (undoStack.length > MAX_UNDO) undoStack.shift()
  redoStack = []
}

function undo() {
  if (undoStack.length < 2) return
  redoStack.push(undoStack.pop())
  project.frames = JSON.parse(undoStack[undoStack.length - 1])
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function redo() {
  if (redoStack.length === 0) return
  const state = redoStack.pop()
  undoStack.push(state)
  project.frames = JSON.parse(state)
  renderFrameThumbs(); render(); updateFrameIndicator()
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
  if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
})
```

- [ ] **Step 2: Commit**

```bash
git add js/undo-manager.js
git commit -m "feat: add undo/redo with Ctrl+Z/Y"
```

---

### Task 7: Exporter — GIF, WebM, Spritesheet

**Files:**
- Create: `js/exporter.js`

- [ ] **Step 1: Write `js/exporter.js`**

```js
function showExportDialog() {
  const modal = document.getElementById('modal-overlay')
  modal.innerHTML = `
    <div class="modal-dialog">
      <h2>Export</h2>
      <div class="export-options">
        <button class="export-btn" data-format="gif">Export as GIF</button>
        <button class="export-btn" data-format="webm">Export as WebM</button>
        <button class="export-btn" data-format="spritesheet">Export Spritesheet</button>
      </div>
      <div id="export-progress" class="hidden">Exporting... <span id="export-status"></span></div>
      <button id="export-cancel" class="btn-secondary">Close</button>
    </div>
  `
  modal.classList.remove('hidden')
  document.getElementById('export-cancel').onclick = () => modal.classList.add('hidden')
  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format
      if (format === 'gif') exportGIF()
      else if (format === 'webm') exportWebM()
      else if (format === 'spritesheet') exportSpritesheet()
    })
  })
}

function exportGIF() {
  const gif = new GIF({ workers: 2, quality: 10, width: project.width, height: project.height })
  for (const frame of project.frames) {
    const c = document.createElement('canvas')
    c.width = project.width; c.height = project.height
    const tc = c.getContext('2d')
    tc.fillStyle = project.bgColor
    tc.fillRect(0, 0, project.width, project.height)
    renderFrameData(tc, frame)
    gif.addFrame(c, { delay: 1000 / project.fps })
  }
  gif.on('progress', p => {
    document.getElementById('export-status').textContent = Math.round(p * 100) + '%'
  })
  gif.on('finished', blob => {
    downloadBlob(blob, project.name + '.gif')
    document.getElementById('modal-overlay').classList.add('hidden')
  })
  gif.render()
}

function exportWebM() {
  const c = document.createElement('canvas')
  c.width = project.width; c.height = project.height
  const stream = c.captureStream(project.fps)
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    downloadBlob(blob, project.name + '.webm')
    document.getElementById('modal-overlay').classList.add('hidden')
  }

  let frameIdx = 0
  const tc = c.getContext('2d')
  recorder.start()
  function captureNext() {
    if (frameIdx >= project.frames.length) { recorder.stop(); return }
    tc.fillStyle = project.bgColor
    tc.fillRect(0, 0, project.width, project.height)
    renderFrameData(tc, project.frames[frameIdx])
    frameIdx++
    setTimeout(captureNext, 1000 / project.fps)
  }
  captureNext()
}

function exportSpritesheet() {
  const cols = Math.ceil(Math.sqrt(project.frames.length))
  const rows = Math.ceil(project.frames.length / cols)
  const c = document.createElement('canvas')
  c.width = project.width * cols; c.height = project.height * rows
  const tc = c.getContext('2d')
  project.frames.forEach((frame, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    tc.save(); tc.translate(col * project.width, row * project.height)
    tc.fillStyle = project.bgColor
    tc.fillRect(0, 0, project.width, project.height)
    renderFrameData(tc, frame)
    tc.restore()
  })
  c.toBlob(blob => {
    downloadBlob(blob, project.name + '-spritesheet.png')
    document.getElementById('modal-overlay').classList.add('hidden')
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Commit**

```bash
git add js/exporter.js
git commit -m "feat: add GIF, WebM, and spritesheet export"
```

---

### Task 8: Mobile Responsive CSS

**Files:**
- Modify: `css/style.css` (full responsive rewrite)

- [ ] **Step 1: Rewrite `css/style.css`**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; background: #0f1720; color: #e2e8f0; }

#app { display: flex; flex-direction: column; height: 100vh; }

/* === Start Screen === */
#start-screen { flex: 1; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg,#0f1720,#1a1a2e); }
.start-content { text-align: center; padding: 20px; }
.start-logo { font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg,#1e90ff,#a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
.start-tagline { color: #94a3b8; font-size: 1rem; margin-bottom: 32px; }
.start-actions { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.start-actions button { min-width: 220px; padding: 14px 32px; font-size: 1.05rem; }

/* === Project Screen === */
#project-screen { flex: 1; display: flex; flex-direction: column; padding: 20px; overflow-y: auto; }
.ps-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.ps-title { font-size: 1.5rem; font-weight: 700; }
.ps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.ps-card { background: #111827; border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform .15s, box-shadow .15s; border: 1px solid rgba(255,255,255,.08); }
.ps-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.ps-card-thumb { height: 120px; background-size: cover; background-position: center; }
.ps-card-info { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.ps-card-name { font-size: .85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ps-card-meta { font-size: .75rem; color: #64748b; }
.ps-empty { grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b; }

/* === Editor Screen === */
#editor-screen { flex: 1; display: flex; flex-direction: column; }
.editor-top { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #111827; border-bottom: 1px solid rgba(255,255,255,.08); flex-wrap: wrap; }
.editor-top .project-name { font-weight: 600; font-size: .9rem; margin-right: auto; }
.editor-top button { padding: 5px 12px; border: none; border-radius: 6px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: .8rem; }
.editor-top button:hover { background: #334155; }

#editor-main { flex: 1; display: flex; overflow: hidden; }

/* === Toolbar === */
#toolbar { display: flex; flex-direction: column; padding: 6px; gap: 3px; background: #111827; border-right: 1px solid rgba(255,255,255,.08); }
.tool-btn { width: 38px; height: 38px; border: none; border-radius: 6px; background: transparent; color: #94a3b8; cursor: pointer; font-size: 1rem; display: grid; place-items: center; transition: background .15s, color .15s; flex-shrink: 0; }
.tool-btn:hover { background: #1e293b; color: #e2e8f0; }
.tool-btn.active { background: rgba(30,144,255,.2); color: #1e90ff; }

/* === Sprite Panel === */
#sprite-panel { width: 180px; background: #111827; border-right: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; overflow: hidden; }
.panel-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; font-size: .8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
.panel-toggle { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1rem; padding: 2px 6px; }
.sp-tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,.08); }
.sp-tab { flex: 1; padding: 6px; border: none; background: transparent; color: #64748b; cursor: pointer; font-size: .75rem; }
.sp-tab.active { color: #1e90ff; border-bottom: 2px solid #1e90ff; }
.sp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; padding: 8px; overflow-y: auto; flex: 1; }
.sp-item { aspect-ratio: 1; background: #1e293b; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: grab; border: 2px solid transparent; transition: border-color .15s; }
.sp-item:hover { border-color: #475569; }

/* === Canvas === */
#canvas-wrap { flex: 1; display: flex; align-items: center; justify-content: center; background: #0a0f16; position: relative; overflow: hidden; }
#stage { background: #141d2f; border: 1px solid rgba(255,255,255,.08); border-radius: 8px; cursor: crosshair; }

/* === Layers Panel === */
#layers-panel { width: 180px; background: #111827; border-left: 1px solid rgba(255,255,255,.08); display: flex; flex-direction: column; }
.layer-list { flex: 1; overflow-y: auto; padding: 4px; }
.layer-item { display: flex; align-items: center; gap: 6px; padding: 6px 8px; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.layer-item:hover { background: #1e293b; }
.layer-item.active { background: rgba(30,144,255,.15); }
.layer-item .l-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.layer-item button { background: none; border: none; color: #64748b; cursor: pointer; font-size: .7rem; padding: 2px; }
.layer-controls { display: flex; gap: 4px; padding: 6px 8px; border-top: 1px solid rgba(255,255,255,.08); }
.layer-controls button { flex: 1; padding: 4px; border: none; border-radius: 4px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: .7rem; }

/* === Properties === */
#properties { width: 200px; padding: 12px; background: #111827; border-left: 1px solid rgba(255,255,255,.08); overflow-y: auto; }
#properties h3 { font-size: .8rem; margin-bottom: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
.prop-group { margin-bottom: 10px; }
.prop-group label { display: block; font-size: .75rem; color: #94a3b8; margin-bottom: 3px; }
.prop-group input[type=color] { width: 100%; height: 30px; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; background: #1e293b; cursor: pointer; }
.prop-group input[type=range] { width: 100%; accent-color: #1e90ff; }
hr { border: none; border-top: 1px solid rgba(255,255,255,.06); margin: 10px 0; }

/* === Timeline === */
#timeline { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #111827; border-top: 1px solid rgba(255,255,255,.08); }
.timeline-controls { display: flex; gap: 4px; }
.timeline-controls button, .tl-btn { padding: 4px 10px; border: none; border-radius: 5px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-size: .75rem; white-space: nowrap; }
.timeline-controls button:hover { background: #334155; }
.timeline-controls button#delFrameBtn { color: #ef4444; }
#frameStrip { flex: 1; display: flex; gap: 3px; overflow-x: auto; padding: 3px 0; min-height: 40px; }
.frame-thumb { width: 54px; height: 36px; border: 2px solid transparent; border-radius: 4px; background: #1e293b; cursor: pointer; flex-shrink: 0; background-size: cover; background-position: center; transition: border-color .15s; }
.frame-thumb:hover { border-color: #475569; }
.frame-thumb.active { border-color: #1e90ff; }
#frameIndicator { font-size: .75rem; color: #94a3b8; white-space: nowrap; }

/* === Buttons === */
.btn-primary { padding: 10px 24px; border: none; border-radius: 10px; background: linear-gradient(135deg,#1e90ff,#6366f1); color: #fff; font-weight: 600; cursor: pointer; transition: opacity .15s; }
.btn-primary:hover { opacity: .9; }
.btn-secondary { padding: 10px 24px; border: 1px solid rgba(255,255,255,.15); border-radius: 10px; background: transparent; color: #e2e8f0; cursor: pointer; transition: background .15s; }
.btn-secondary:hover { background: rgba(255,255,255,.08); }

/* === Modal === */
#modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 200; }
#modal-overlay.hidden { display: none; }
.modal-dialog { background: #1e293b; border-radius: 16px; padding: 24px; width: 90%; max-width: 400px; border: 1px solid rgba(255,255,255,.1); }
.modal-dialog h2 { font-size: 1.2rem; margin-bottom: 16px; }
.modal-dialog label { display: block; margin-bottom: 12px; font-size: .85rem; color: #94a3b8; }
.modal-dialog input, .modal-dialog select { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,.1); background: #0f1720; color: #e2e8f0; font-size: .9rem; margin-top: 4px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

/* === Toast === */
#toast { position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%); padding: 8px 20px; border-radius: 8px; background: #1e293b; color: #e2e8f0; font-size: .85rem; opacity: 0; transition: opacity .3s; pointer-events: none; z-index: 100; }
#toast.show { opacity: 1; }

/* === Scrollbar === */
#frameStrip::-webkit-scrollbar, .sp-grid::-webkit-scrollbar, .layer-list::-webkit-scrollbar { height: 4px; width: 4px; }
#frameStrip::-webkit-scrollbar-track, .sp-grid::-webkit-scrollbar-track, .layer-list::-webkit-scrollbar-track { background: transparent; }
#frameStrip::-webkit-scrollbar-thumb, .sp-grid::-webkit-scrollbar-thumb, .layer-list::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

/* === Mobile: < 480px === */
@media (max-width: 480px) {
  #toolbar { flex-direction: row; overflow-x: auto; border-right: none; border-bottom: 1px solid rgba(255,255,255,.08); }
  #sprite-panel { position: fixed; bottom: 0; left: 0; right: 0; height: 45vh; z-index: 150; border-radius: 16px 16px 0 0; width: 100%; }
  #sprite-panel.collapsed { display: none; }
  #layers-panel { position: fixed; bottom: 0; left: 0; right: 0; height: 45vh; z-index: 150; border-radius: 16px 16px 0 0; width: 100%; }
  #layers-panel.collapsed { display: none; }
  #properties { display: none; }
  #editor-main { flex-direction: column; }
  .editor-top .project-name { font-size: .8rem; }
  #timeline { flex-wrap: wrap; gap: 4px; padding: 6px 8px; }
  #frameStrip { min-height: 32px; }
  .frame-thumb { width: 40px; height: 28px; }
  .modal-dialog { width: 95%; max-width: none; }
  .ps-grid { grid-template-columns: repeat(2, 1fr); }
  .start-logo { font-size: 2rem; }
}

/* === Tablet: 480-768px === */
@media (min-width: 480px) and (max-width: 768px) {
  #sprite-panel { width: 140px; }
  #layers-panel { width: 140px; }
  #properties { width: 160px; }
  .ps-grid { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat: full responsive CSS for mobile, tablet, desktop"
```

---

### Task 9: Integration — Wire Everything Together in app.js

**Files:**
- Modify: `js/app.js` (full rewrite as bootstrap)

- [ ] **Step 1: Write complete `js/app.js`**

```js
// ===== Screen Manager =====
class ScreenManager {
  constructor(screens, defaultScreen) {
    this.screens = screens
    this.current = null
    window.addEventListener('hashchange', () => this.navigate(window.location.hash))
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = defaultScreen
    } else {
      this.navigate(window.location.hash)
    }
  }

  navigate(hash) {
    const name = hash.replace('#', '').split('/')[0]
    if (this.current && this.current.el && this.current.el.parentNode) {
      this.current.el.remove()
    }
    const screen = this.screens[name]
    if (!screen) { window.location.hash = '#start'; return }
    screen.onShow && screen.onShow(hash)
    document.getElementById('app').appendChild(screen.el)
    this.current = screen
  }
}

function createScreen(html, onShow) {
  const div = document.createElement('div')
  div.innerHTML = html.trim()
  return { el: div.firstElementChild, onShow }
}

// ===== HTML Templates =====
const START_SCREEN_HTML = `
  <div id="start-screen">
    <div class="start-content">
      <div class="start-logo">EasyAnimation</div>
      <p class="start-tagline">Create frame-by-frame animations, fast.</p>
      <div class="start-actions">
        <button id="btn-new-project" class="btn-primary">New Animation</button>
        <button id="btn-open-projects" class="btn-secondary">Open Project</button>
      </div>
    </div>
  </div>
`

const PROJECT_SCREEN_HTML = `
  <div id="project-screen">
    <div class="ps-header">
      <span class="ps-title">Projects</span>
      <button id="ps-new-btn" class="btn-primary">+ New Project</button>
    </div>
    <div id="ps-grid" class="ps-grid"></div>
  </div>
`

const EDITOR_SCREEN_HTML = `
  <div id="editor-screen">
    <div class="editor-top">
      <span class="project-name" id="editor-project-name">Untitled</span>
      <button id="undo-btn" title="Undo (Ctrl+Z)">↩</button>
      <button id="redo-btn" title="Redo (Ctrl+Y)">↪</button>
      <button id="export-btn">Export</button>
      <button id="back-to-projects">← Back</button>
    </div>
    <div id="editor-main">
      <div id="toolbar">
        <button class="tool-btn active" data-tool="pencil" title="Pencil">✏️</button>
        <button class="tool-btn" data-tool="line" title="Line">╱</button>
        <button class="tool-btn" data-tool="circle" title="Circle">○</button>
        <button class="tool-btn" data-tool="rect" title="Rectangle">□</button>
        <button class="tool-btn" data-tool="eraser" title="Eraser">◻</button>
        <button class="tool-btn" data-tool="fill" title="Fill">◼</button>
        <button class="tool-btn" data-tool="text" title="Text">T</button>
        <button class="tool-btn" data-tool="select" title="Select/Move">➡</button>
      </div>
      <div id="sprite-panel" class="panel-collapsible">
        <div class="panel-header">Sprites <button id="sp-toggle" class="panel-toggle">−</button></div>
        <div id="sp-content">
          <div class="sp-tabs">
            <button class="sp-tab active" data-cat="characters">Characters</button>
            <button class="sp-tab" data-cat="objects">Objects</button>
          </div>
          <div id="sp-grid" class="sp-grid"></div>
        </div>
      </div>
      <div id="canvas-wrap">
        <canvas id="stage"></canvas>
      </div>
      <div id="layers-panel">
        <div class="panel-header">Layers <button id="lp-toggle" class="panel-toggle">−</button></div>
        <div class="layer-list" id="layer-list"></div>
        <div class="layer-controls">
          <button id="add-layer-btn">+</button>
          <button id="del-layer-btn">−</button>
          <button id="up-layer-btn">↑</button>
          <button id="down-layer-btn">↓</button>
        </div>
      </div>
      <div id="properties">
        <h3>Properties</h3>
        <div class="prop-group"><label>Stroke <input type="color" id="strokeColor" value="#ffffff" /></label></div>
        <div class="prop-group"><label>Fill <input type="color" id="fillColor" value="#1e90ff" /></label></div>
        <div class="prop-group"><label>Size <input type="range" id="lineWidth" min="1" max="20" value="3" /></label></div>
        <hr />
        <div class="prop-group"><label>FPS <input type="number" id="fpsInput" value="12" min="1" max="60" /></label></div>
        <div class="prop-group"><label><input type="checkbox" id="gridToggle" /> Grid</label></div>
        <div class="prop-group"><label><input type="checkbox" id="onionSkin" /> Onion Skin</label></div>
        <hr />
        <div class="prop-group"><label>Font <select id="textFont"><option>sans-serif</option><option>serif</option><option>monospace</option></select></label></div>
        <div class="prop-group"><label>Size <input type="number" id="textSize" value="20" min="8" max="120" /></label></div>
      </div>
    </div>
    <div id="timeline">
      <div class="timeline-controls">
        <button id="playBtn">▶</button>
        <button id="pauseBtn">⏸</button>
        <button id="resetBtn">⏹</button>
        <button id="addFrameBtn">+ Frame</button>
        <button id="dupFrameBtn">Duplicate</button>
        <button id="delFrameBtn">Delete</button>
        <button id="tweenBtn">Tween</button>
      </div>
      <div id="frameStrip"></div>
      <span id="frameIndicator">Frame: 1/1</span>
    </div>
  </div>
`

// ===== Init =====
async function init() {
  await openDB()

  const screens = {
    start: createScreen(START_SCREEN_HTML, () => {
      document.getElementById('btn-new-project').onclick = showNewProjectDialog
      document.getElementById('btn-open-projects').onclick = () => { window.location.hash = '#projects' }
    }),
    projects: createScreen(PROJECT_SCREEN_HTML, () => {
      document.getElementById('ps-new-btn').onclick = showNewProjectDialog
      renderProjectGrid()
    }),
    editor: createScreen(EDITOR_SCREEN_HTML, (hash) => {
      const id = hash.split('/')[1]
      if (id) loadProjectIntoEditor(id)
    })
  }

  new ScreenManager(screens, '#start')
}

// ===== Project Grid =====
async function renderProjectGrid() {
  const grid = document.getElementById('ps-grid')
  const projects = await ProjectStore.list()
  if (projects.length === 0) {
    grid.innerHTML = '<div class="ps-empty"><p>No projects yet.</p><button id="ps-empty-btn" class="btn-primary">Create your first animation</button></div>'
    document.getElementById('ps-empty-btn').onclick = showNewProjectDialog
    return
  }
  grid.innerHTML = projects.map(p => `
    <div class="ps-card" data-id="${escHtml(p.id)}">
      <div class="ps-card-thumb" style="background:${p.bgColor || '#141d2f'}"></div>
      <div class="ps-card-info">
        <span class="ps-card-name">${escHtml(p.name)}</span>
        <span class="ps-card-meta">${p.frames ? p.frames.length : 0} frames</span>
      </div>
    </div>
  `).join('')
  grid.querySelectorAll('.ps-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.hash = 'editor/' + card.dataset.id
    })
  })
}

function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

function escHtml(str) {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// ===== New Project Dialog =====
function showNewProjectDialog() {
  const modal = document.getElementById('modal-overlay')
  modal.innerHTML = `
    <div class="modal-dialog">
      <h2>New Project</h2>
      <label>Name <input id="np-name" value="Untitled" /></label>
      <label>Width <select id="np-width">
        <option value="480">480px</option>
        <option value="800" selected>800px</option>
        <option value="1024">1024px</option>
        <option value="1920">1920px</option>
      </select></label>
      <label>Height <select id="np-height">
        <option value="360">360px</option>
        <option value="500" selected>500px</option>
        <option value="576">576px</option>
        <option value="1080">1080px</option>
      </select></label>
      <label>FPS <input type="number" id="np-fps" value="12" min="1" max="60" /></label>
      <div class="modal-actions">
        <button id="np-cancel" class="btn-secondary">Cancel</button>
        <button id="np-create" class="btn-primary">Create</button>
      </div>
    </div>
  `
  modal.classList.remove('hidden')
  document.getElementById('np-cancel').onclick = () => modal.classList.add('hidden')
  document.getElementById('np-create').onclick = async () => {
    const project = {
      id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: document.getElementById('np-name').value || 'Untitled',
      width: parseInt(document.getElementById('np-width').value),
      height: parseInt(document.getElementById('np-height').value),
      fps: parseInt(document.getElementById('np-fps').value) || 12,
      bgColor: '#141d2f',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      frames: [createEmptyFrame()]
    }
    await ProjectStore.save(project)
    modal.classList.add('hidden')
    window.location.hash = 'editor/' + project.id
  }
}

// ===== Load Project Into Editor =====
async function loadProjectIntoEditor(id) {
  const data = await ProjectStore.get(id)
  if (!data) { window.location.hash = '#projects'; return }

  Object.assign(project, data)
  project.playing = false
  resizeCanvas(project.width, project.height)

  // Set editor project name
  document.getElementById('editor-project-name').textContent = project.name

  // Wire editor controls
  document.getElementById('back-to-projects').onclick = async () => {
    await saveCurrentProject()
    window.location.hash = '#projects'
  }
  document.getElementById('export-btn').onclick = showExportDialog
  document.getElementById('undo-btn').onclick = undo
  document.getElementById('redo-btn').onclick = redo
  document.getElementById('playBtn').onclick = play
  document.getElementById('pauseBtn').onclick = pause
  document.getElementById('resetBtn').onclick = reset
  document.getElementById('addFrameBtn').onclick = () => { saveState(); addFrame() }
  document.getElementById('dupFrameBtn').onclick = () => { saveState(); duplicateFrame() }
  document.getElementById('delFrameBtn').onclick = () => { saveState(); deleteFrame() }
  document.getElementById('tweenBtn').onclick = () => {
    if (project.frames.length < 2) { showToast('Need at least 2 frames'); return }
    saveState()
    tweenFrames(0, project.frames.length - 1)
  }
  document.getElementById('fpsInput').onchange = e => {
    project.fps = parseInt(e.target.value) || 12
    if (project.playing) { pause(); play() }
  }
  document.getElementById('onionSkin').onchange = render
  document.getElementById('gridToggle').onchange = e => { gridVisible = e.target.checked; render() }

  // Tools
  currentTool = 'pencil'
  document.querySelectorAll('#editor-screen .tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#editor-screen .tool-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentTool = btn.dataset.tool
      if (currentTool === 'text') startTextTool()
    })
  })

  // Canvas events
  stage.onpointerdown = onPointerDown
  stage.onpointermove = onPointerMove
  stage.onpointerup = onPointerUp
  stage.onpointerleave = onPointerUp

  // Sprite panel events
  document.getElementById('sp-toggle').onclick = () => {
    const content = document.getElementById('sp-content')
    content.style.display = content.style.display === 'none' ? '' : 'none'
  }
  document.querySelectorAll('.sp-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      renderSpriteGrid(tab.dataset.cat)
    }
  })

  // Layer controls
  document.getElementById('add-layer-btn').onclick = () => { saveState(); addLayer(project.frames[project.currentFrame]); renderLayers(); render() }
  document.getElementById('del-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState()
    const frame = project.frames[project.currentFrame]
    removeLayer(frame, currentLayerId)
    currentLayerId = frame.layers[frame.layers.length - 1]?.id
    renderLayers(); render()
  }
  document.getElementById('up-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState(); moveLayer(project.frames[project.currentFrame], currentLayerId, -1); renderLayers(); render()
  }
  document.getElementById('down-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState(); moveLayer(project.frames[project.currentFrame], currentLayerId, 1); renderLayers(); render()
  }

  setupCanvasControls()
  renderSpriteGrid('characters')
  renderLayers()
  renderFrameThumbs()
  render()
  updateFrameIndicator()
}

let currentLayerId = null

function renderSpriteGrid(category) {
  const grid = document.getElementById('sp-grid')
  const items = SPRITES[category] || []
  grid.innerHTML = items.map(s => `
    <div class="sp-item" data-id="${s.id}" data-category="${category}" draggable="true"
         style="background:#1e293b; cursor:grab;">
      <canvas width="40" height="40" class="sp-preview"></canvas>
    </div>
  `).join('')

  grid.querySelectorAll('.sp-item').forEach(el => {
    const canvas = el.querySelector('canvas')
    const ctx = canvas.getContext('2d')
    const sprite = findSprite(el.dataset.id)
    if (sprite) {
      ctx.save()
      ctx.translate(20, 20)
      ctx.scale(0.6, 0.6)
      for (const p of sprite.paths) {
        const path = new Path2D(p.d)
        if (p.fill) { ctx.fillStyle = p.fill; ctx.fill(path) }
        if (p.stroke) { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.width || 2; ctx.stroke(path) }
      }
      ctx.restore()
    }

    el.addEventListener('click', () => {
      const frame = project.frames[project.currentFrame]
      const layer = getActiveLayer(frame)
      const cx = project.width / 2
      const cy = project.height / 2
      layer.sprites.push({
        spriteId: el.dataset.id,
        category: el.dataset.category,
        x: cx, y: cy,
        scaleX: 1, scaleY: 1,
        rotation: 0
      })
      saveState()
      render(); renderFrameThumbs(); renderLayers()
    })
  })
}

function renderLayers() {
  const list = document.getElementById('layer-list')
  const frame = project.frames[project.currentFrame]
  if (!frame) return
  list.innerHTML = ''
  ;[...frame.layers].reverse().forEach(layer => {
    const el = document.createElement('div')
    el.className = 'layer-item' + (layer.id === currentLayerId ? ' active' : '')
    el.innerHTML = `
      <button class="l-vis" data-id="${layer.id}">${layer.visible ? '👁' : '−'}</button>
      <span class="l-name">${escHtml(layer.name)}</span>
      <button class="l-lock" data-id="${layer.id}">${layer.locked ? '🔒' : '○'}</button>
    `
    el.addEventListener('click', () => {
      currentLayerId = layer.id
      document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('active'))
      el.classList.add('active')
    })
    el.querySelector('.l-vis').addEventListener('click', e => {
      e.stopPropagation()
      layer.visible = !layer.visible
      renderLayers(); render()
    })
    el.querySelector('.l-lock').addEventListener('click', e => {
      e.stopPropagation()
      layer.locked = !layer.locked
      renderLayers()
    })
    list.appendChild(el)
  })
  if (!currentLayerId && frame.layers.length > 0) currentLayerId = frame.layers[frame.layers.length - 1].id
}

async function saveCurrentProject() {
  project.updatedAt = Date.now()
  await ProjectStore.save(JSON.parse(JSON.stringify(project)))
}

// Auto-save every 30 seconds
setInterval(() => {
  if (project.id && document.getElementById('editor-screen')?.parentNode) {
    saveCurrentProject()
  }
}, 30000)

document.addEventListener('DOMContentLoaded', init)
```

- [ ] **Step 2: Commit**

```bash
git add js/app.js
git commit -m "feat: integrate all modules into app bootstrap"
```

---

## Self-Review Checklist

1. **Spec coverage:** All spec sections are covered — start screen (Task 1), project screen (Task 1), sprite library (Task 2), layers (Task 3), zoom/pan (Task 3), text tool (Task 4), tweening (Task 5), undo/redo (Task 6), export (Task 7), mobile responsive (Task 8), integration (Task 9).

2. **Placeholder scan:** No TBD, TODO, or vague steps. All steps contain complete code.

3. **Type consistency:** Property names, function signatures, and data model references are consistent across all tasks (e.g., `layer.sprites`, `spriteId`, `project.frames`, `renderFrameData`).
