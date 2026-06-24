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
      <div id="sprite-panel">
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

let currentLayerId = null
let _pendingEditorLoad = null

async function init() {
  try {
    await openDB()
  } catch (e) {
    showToast('Failed to open database: ' + e.message)
    return
  }

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
    const newProject = {
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
    try {
      await ProjectStore.save(newProject)
    } catch (e) {
      showToast('Failed to save project: ' + e.message)
      return
    }
    modal.classList.add('hidden')
    window.location.hash = 'editor/' + newProject.id
  }
}

function createEmptyFrame() {
  return {
    layers: [{
      id: 'l_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      name: 'Layer 1',
      visible: true,
      locked: false,
      strokes: [],
      sprites: [],
      texts: []
    }]
  }
}

async function loadProjectIntoEditor(id) {
  const data = await ProjectStore.get(id)
  if (!data) { window.location.hash = '#projects'; return }

  Object.assign(project, data)
  project.playing = false
  currentLayerId = null
  resizeCanvas(project.width, project.height)

  document.getElementById('editor-project-name').textContent = project.name

  // Navigation
  document.getElementById('back-to-projects').onclick = async () => {
    await saveCurrentProject()
    window.location.hash = '#projects'
  }

  // Export
  document.getElementById('export-btn').onclick = showExportDialog

  // Undo/Redo
  document.getElementById('undo-btn').onclick = undo
  document.getElementById('redo-btn').onclick = redo

  // Transport controls
  document.getElementById('playBtn').onclick = play
  document.getElementById('pauseBtn').onclick = pause
  document.getElementById('resetBtn').onclick = reset

  // Frame controls
  document.getElementById('addFrameBtn').onclick = () => { saveState(); addFrame() }
  document.getElementById('dupFrameBtn').onclick = () => { saveState(); duplicateFrame() }
  document.getElementById('delFrameBtn').onclick = () => { saveState(); deleteFrame() }
  document.getElementById('tweenBtn').onclick = () => {
    if (project.frames.length < 2) { showToast('Need at least 2 frames for tweening'); return }
    saveState()
    tweenFrames(0, project.frames.length - 1)
  }

  // FPS
  document.getElementById('fpsInput').onchange = e => {
    project.fps = parseInt(e.target.value) || 12
    if (project.playing) { pause(); play() }
  }

  // Settings
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

  // Sprite panel
  document.getElementById('sp-toggle').onclick = () => {
    const panel = document.getElementById('sprite-panel')
    panel.classList.toggle('collapsed')
  }
  document.querySelectorAll('.sp-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'))
      tab.classList.add('active')
      renderSpriteGrid(tab.dataset.cat)
    }
  })

  // Layer controls
  document.getElementById('add-layer-btn').onclick = () => {
    saveState()
    addLayer(project.frames[project.currentFrame], 'Layer ' + (project.frames[project.currentFrame].layers.length + 1))
    currentLayerId = project.frames[project.currentFrame].layers[project.frames[project.currentFrame].layers.length - 1].id
    renderLayers(); render()
  }
  document.getElementById('del-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState()
    const frame = project.frames[project.currentFrame]
    removeLayer(frame, currentLayerId)
    currentLayerId = frame.layers[frame.layers.length - 1]?.id || null
    renderLayers(); render()
  }
  document.getElementById('up-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState()
    moveLayer(project.frames[project.currentFrame], currentLayerId, -1)
    renderLayers(); render()
  }
  document.getElementById('down-layer-btn').onclick = () => {
    if (!currentLayerId) return
    saveState()
    moveLayer(project.frames[project.currentFrame], currentLayerId, 1)
    renderLayers(); render()
  }
  document.getElementById('lp-toggle').onclick = () => {
    const panel = document.getElementById('layers-panel')
    panel.classList.toggle('collapsed')
  }

  setupCanvasControls()
  renderSpriteGrid('characters')
  renderFrameThumbs()
  renderLayers()
  render()
  updateFrameIndicator()
}

function renderSpriteGrid(category) {
  const grid = document.getElementById('sp-grid')
  const items = SPRITES[category] || []
  grid.innerHTML = items.map(s => {
    const svgPaths = s.paths.map(p => {
      let path = '<path d="' + escHtml(p.d) + '"'
      if (p.fill && p.fill !== 'none') path += ' fill="' + escHtml(p.fill) + '"'
      if (p.stroke && p.stroke !== 'none') path += ' stroke="' + escHtml(p.stroke) + '"'
      if (p.width) path += ' stroke-width="' + p.width + '"'
      path += ' fill-opacity="' + ((p.fill && p.fill !== 'none') ? '1' : '0') + '"'
      if (!p.fill || p.fill === 'none') path += ' fill="none"'
      path += ' />'
      return path
    }).join('')
    return '<div class="sp-item" data-id="' + escHtml(s.id) + '" data-category="' + escHtml(category) + '"><svg viewBox="0 0 40 80" width="36" height="64">' + svgPaths + '</svg></div>'
  }).join('')

  grid.querySelectorAll('.sp-item').forEach(el => {
    el.addEventListener('click', () => {
      const frame = project.frames[project.currentFrame]
      if (!frame) return
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
      render(); renderFrameThumbs()
    })
  })
}

function renderLayers() {
  const list = document.getElementById('layer-list')
  const frame = project.frames[project.currentFrame]
  if (!frame) return
  list.innerHTML = ''
  const layersCopy = [...frame.layers].reverse()
  layersCopy.forEach(layer => {
    const item = document.createElement('div')
    item.className = 'layer-item' + (layer.id === currentLayerId ? ' active' : '')
    item.innerHTML = '<button class="l-vis" data-id="' + layer.id + '">' + (layer.visible ? '👁' : '−') + '</button><span class="l-name">' + escHtml(layer.name) + '</span><button class="l-lock" data-id="' + layer.id + '">' + (layer.locked ? '🔒' : '○') + '</button>'
    item.addEventListener('click', () => {
      currentLayerId = layer.id
      document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('active'))
      item.classList.add('active')
    })
    item.querySelector('.l-vis').addEventListener('click', e => {
      e.stopPropagation()
      layer.visible = !layer.visible
      renderLayers(); render()
    })
    item.querySelector('.l-lock').addEventListener('click', e => {
      e.stopPropagation()
      layer.locked = !layer.locked
      renderLayers()
    })
    list.appendChild(item)
  })
  if (!currentLayerId && frame.layers.length > 0) {
    currentLayerId = frame.layers[frame.layers.length - 1].id
  }
}

async function saveCurrentProject() {
  project.updatedAt = Date.now()
  try {
    await ProjectStore.save(JSON.parse(JSON.stringify(project)))
  } catch (e) {
    // Silently handle - not critical
  }
}

setInterval(() => {
  if (project.id && document.getElementById('editor-screen') && document.getElementById('editor-screen').parentNode) {
    saveCurrentProject()
  }
}, 30000)

function play() {
  if (project.playing) return
  if (project.frames.length < 2) {
    showToast('Add more frames to animate')
    return
  }
  project.playing = true
  document.getElementById('playBtn').textContent = '⏸'
  const interval = 1000 / project.fps
  animationInterval = setInterval(() => {
    let next = project.currentFrame + 1
    if (next >= project.frames.length) next = 0
    selectFrame(next)
  }, interval)
}

function pause() {
  project.playing = false
  document.getElementById('playBtn').textContent = '▶'
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

function reset() {
  pause()
  selectFrame(0)
}

document.addEventListener('DOMContentLoaded', init)
