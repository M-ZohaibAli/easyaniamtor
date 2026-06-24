const project = {
  frames: [],
  currentFrame: 0,
  fps: 12,
  playing: false
}

function initProject() {
  project.frames = []
  addFrame()
}

function addFrame() {
  const newFrame = {
    stickman: createDefaultStickman(),
    strokes: []
  }
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
  renderFrameThumbs()
  render()
  updateFrameIndicator()
}

function deleteFrame() {
  if (project.frames.length <= 1) return
  project.frames.splice(project.currentFrame, 1)
  if (project.currentFrame >= project.frames.length) {
    project.currentFrame = project.frames.length - 1
  }
  renderFrameThumbs()
  render()
  updateFrameIndicator()
}

function selectFrame(index) {
  if (index < 0 || index >= project.frames.length) return
  project.currentFrame = index
  renderFrameThumbs()
  render()
  updateFrameIndicator()
}

function updateFrameIndicator() {
  document.getElementById('frameIndicator').textContent =
    `Frame: ${project.currentFrame + 1}/${project.frames.length}`
}

function renderFrameThumbs() {
  const strip = document.getElementById('frameStrip')
  strip.innerHTML = ''

  project.frames.forEach((frame, i) => {
    const thumbCanvas = document.createElement('canvas')
    thumbCanvas.width = 64
    thumbCanvas.height = 48
    const tc = thumbCanvas.getContext('2d')
    tc.save()
    tc.scale(64/CANVAS_W, 48/CANVAS_H)
    renderFrameData(tc, frame)
    tc.restore()

    const thumb = document.createElement('div')
    thumb.className = 'frame-thumb' + (i === project.currentFrame ? ' active' : '')
    thumb.style.backgroundImage = `url(${thumbCanvas.toDataURL()})`
    thumb.title = `Frame ${i + 1}`
    thumb.addEventListener('click', () => selectFrame(i))
    strip.appendChild(thumb)
  })

  strip.scrollLeft = strip.scrollWidth
}
