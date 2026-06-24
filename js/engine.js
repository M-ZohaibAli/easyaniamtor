const stage = document.getElementById('stage')
const ctx = stage.getContext('2d')
const CANVAS_W = 800
const CANVAS_H = 500
stage.width = CANVAS_W
stage.height = CANVAS_H

let _floodCanvas = null

function getFloodCanvas() {
  if (!_floodCanvas) {
    _floodCanvas = document.createElement('canvas')
    _floodCanvas.width = CANVAS_W
    _floodCanvas.height = CANVAS_H
  }
  return _floodCanvas
}

function render() {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
  const frame = project.frames[project.currentFrame]
  if (!frame) return

  if (document.getElementById('onionSkin').checked && project.currentFrame > 0) {
    const prev = project.frames[project.currentFrame - 1]
    ctx.save()
    ctx.globalAlpha = 0.3
    renderFrameData(ctx, prev)
    ctx.restore()
  }

  renderFrameData(ctx, frame)
}

function renderFrameData(c, frame) {
  for (const s of frame.strokes) {
    if (s.type === 'flood') {
      c.putImageData(s.imageData, 0, 0)
      continue
    }
    drawStroke(c, s)
  }
  if (document.getElementById('showStickman').checked && frame.stickman) {
    drawStickman(c, frame.stickman)
  }
}

function drawStroke(c, s) {
  if (!s.points || s.points.length < 1) return
  c.strokeStyle = s.color
  c.fillStyle = s.fillColor || 'transparent'
  c.lineWidth = s.width
  c.lineCap = 'round'
  c.lineJoin = 'round'

  if (s.type === 'line' && s.points.length >= 2) {
    c.beginPath()
    c.moveTo(s.points[0].x, s.points[0].y)
    c.lineTo(s.points[1].x, s.points[1].y)
    c.stroke()
  } else if (s.type === 'circle' && s.points.length >= 2) {
    const dx = s.points[1].x - s.points[0].x
    const dy = s.points[1].y - s.points[0].y
    const r = Math.sqrt(dx*dx + dy*dy)
    c.beginPath()
    c.arc(s.points[0].x, s.points[0].y, r, 0, Math.PI * 2)
    if (s.fillColor && s.fillColor !== 'transparent') c.fill()
    c.stroke()
  } else if (s.type === 'rect' && s.points.length >= 2) {
    const x = Math.min(s.points[0].x, s.points[1].x)
    const y = Math.min(s.points[0].y, s.points[1].y)
    const w = Math.abs(s.points[1].x - s.points[0].x)
    const h = Math.abs(s.points[1].y - s.points[0].y)
    c.beginPath()
    c.rect(x, y, w, h)
    if (s.fillColor && s.fillColor !== 'transparent') c.fill()
    c.stroke()
  } else if (s.type === 'eraser') {
    c.strokeStyle = '#141d2f'
    c.lineWidth = s.width * 2
    c.beginPath()
    c.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) {
      c.lineTo(s.points[i].x, s.points[i].y)
    }
    c.stroke()
  } else {
    c.beginPath()
    c.moveTo(s.points[0].x, s.points[0].y)
    for (let i = 1; i < s.points.length; i++) {
      c.lineTo(s.points[i].x, s.points[i].y)
    }
    c.stroke()
  }
}

function floodFill(frame, startX, startY, color) {
  const fCanvas = getFloodCanvas()
  const fc = fCanvas.getContext('2d')
  fc.clearRect(0, 0, CANVAS_W, CANVAS_H)
  renderFrameData(fc, frame)

  const imageData = fc.getImageData(0, 0, CANVAS_W, CANVAS_H)
  const data = imageData.data
  const w = CANVAS_W

  const si = (Math.floor(startY) * w + Math.floor(startX)) * 4
  const tr = data[si], tg = data[si+1], tb = data[si+2], ta = data[si+3]

  const tmpC = document.createElement('canvas').getContext('2d')
  tmpC.fillStyle = color
  const hex = tmpC.fillStyle
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)

  if (r === tr && g === tg && b === tb && ta === 255) return

  const stack = [[Math.floor(startX), Math.floor(startY)]]
  const visited = new Set()
  let count = 0
  while (stack.length && count < 50000) {
    const [cx, cy] = stack.pop()
    const key = cx + ',' + cy
    if (visited.has(key) || cx < 0 || cx >= CANVAS_W || cy < 0 || cy >= CANVAS_H) continue
    visited.add(key)
    const idx = (cy * w + cx) * 4
    if (Math.abs(data[idx] - tr) > 10 || Math.abs(data[idx+1] - tg) > 10 ||
        Math.abs(data[idx+2] - tb) > 10 || data[idx+3] < 128) continue
    data[idx] = r
    data[idx+1] = g
    data[idx+2] = b
    data[idx+3] = 255
    count++
    stack.push([cx+1,cy], [cx-1,cy], [cx,cy+1], [cx,cy-1])
  }

  frame.strokes.push({
    type: 'flood',
    imageData: imageData,
    color: color,
    x: 0, y: 0, w: CANVAS_W, h: CANVAS_H
  })
}
