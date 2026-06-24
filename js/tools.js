const TOOLS = ['select', 'pencil', 'line', 'circle', 'rect', 'eraser', 'fill', 'text']
let currentTool = 'pencil'
let currentStroke = null
let isDrawing = false
let isDraggingSprite = false
let dragSpriteKey = null
let dragOffset = null

function createStroke(type, x, y, color, width) {
  return { type, points: [{x,y}], color, width, fillColor: document.getElementById('fillColor') ? document.getElementById('fillColor').value : null }
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
    for (const layer of frame.layers) {
      if (!layer.visible) continue
      for (const si of layer.sprites) {
        const dx = x - si.x, dy = y - si.y
        const size = Math.abs(si.scaleX || 1) * 20
        if (dx * dx + dy * dy < size * size) {
          isDraggingSprite = true
          dragSpriteKey = si.spriteId + '_' + layer.id
          dragOffset = { x: x - si.x, y: y - si.y }
          return
        }
      }
    }
    return
  }

  isDrawing = true
  const sColor = document.getElementById('strokeColor') ? document.getElementById('strokeColor').value : '#ffffff'
  const w = parseInt((document.getElementById('lineWidth') && document.getElementById('lineWidth').value) || '3')
  currentStroke = createStroke(currentTool, x, y, sColor, w)

  if (currentTool === 'fill') {
    floodFill(frame, x, y, document.getElementById('fillColor') ? document.getElementById('fillColor').value : '#1e90ff')
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
        if (key === dragSpriteKey) {
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
  if (isDraggingSprite) { isDraggingSprite = false; dragSpriteKey = null; renderFrameThumbs(); return }
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
