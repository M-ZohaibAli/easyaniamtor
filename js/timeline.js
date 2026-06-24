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
  if (el) el.textContent = 'Frame: ' + (project.currentFrame + 1) + '/' + project.frames.length
}

function renderFrameThumbs() {
  const strip = document.getElementById('frameStrip')
  if (!strip) return
  strip.innerHTML = ''
  project.frames.forEach((frame, i) => {
    const tc = document.createElement('canvas')
    tc.width = 64; tc.height = 48
    const tctx = tc.getContext('2d')
    tctx.save()
    tctx.scale(64 / project.width, 48 / project.height)
    renderFrameData(tctx, frame)
    tctx.restore()
    const thumb = document.createElement('div')
    thumb.className = 'frame-thumb' + (i === project.currentFrame ? ' active' : '')
    thumb.style.backgroundImage = 'url(' + tc.toDataURL() + ')'
    thumb.title = 'Frame ' + (i + 1)
    thumb.addEventListener('click', () => selectFrame(i))
    strip.appendChild(thumb)
  })
  strip.scrollLeft = strip.scrollWidth
}

function tweenFrames(fromIdx, toIdx) {
  if (fromIdx === toIdx) return
  const from = project.frames[fromIdx]
  const to = project.frames[toIdx]
  if (!from || !to) return

  const steps = Math.abs(toIdx - fromIdx) * 3 - 1
  if (steps < 1) return

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

  project.frames.splice(fromIdx + 1, 0, ...newFrames)
  project.currentFrame = fromIdx
  renderFrameThumbs(); render(); updateFrameIndicator()
}

function lerp(a, b, t) { return a + (b - a) * t }
