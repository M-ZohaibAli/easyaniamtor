const TOOLS = ['pose','select','pencil','line','circle','rect','eraser','fill']
let currentTool = 'pose'
let currentStroke = null
let isDrawing = false
let isDraggingJoint = false
let currentJoint = null
let selectedStroke = null

function createStroke(type, x, y, color, width) {
  return { type, points: [{x,y}], color, width, fillColor: document.getElementById('fillColor').value || null }
}

function onPointerDown(e) {
  const rect = stage.getBoundingClientRect()
  const scaleX = CANVAS_W / rect.width
  const scaleY = CANVAS_H / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const frame = project.frames[project.currentFrame]
  if (!frame) return

  if (currentTool === 'pose') {
    const hit = hitTestJoint(frame.stickman, x, y)
    if (hit) {
      currentJoint = hit
      isDraggingJoint = true
      stage.style.cursor = 'grabbing'
    }
    return
  }

  isDrawing = true
  const sColor = document.getElementById('strokeColor').value
  const w = parseInt(document.getElementById('lineWidth').value)
  currentStroke = createStroke(currentTool, x, y, sColor, w)

  if (currentTool === 'fill') {
    floodFill(frame, x, y, document.getElementById('fillColor').value)
    currentStroke = null
    isDrawing = false
    render()
    renderFrameThumbs()
    return
  }

  frame.strokes.push(currentStroke)
}

function onPointerMove(e) {
  const rect = stage.getBoundingClientRect()
  const scaleX = CANVAS_W / rect.width
  const scaleY = CANVAS_H / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  const frame = project.frames[project.currentFrame]
  if (!frame) return

  if (isDraggingJoint && currentJoint) {
    const parts = frame.stickman
    const pos = computeJointPositions(parts)
    const parentName = parts[currentJoint].parent
    const parentPos = parentName ? pos[parentName] : { x: parts[currentJoint].x, y: parts[currentJoint].y }
    const dx = x - parentPos.x
    const dy = parentPos.y - y
    let angle = Math.atan2(dy, dx) * 180 / Math.PI
    if (angle < 0) angle += 360
    parts[currentJoint].angle = Math.round(angle)
    render()
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
  if (isDraggingJoint) {
    isDraggingJoint = false
    currentJoint = null
    stage.style.cursor = currentTool === 'pose' ? 'grab' : 'crosshair'
    renderFrameThumbs()
    return
  }
  if (!isDrawing) return
  isDrawing = false
  if (currentStroke && currentStroke.points.length < 2 && currentTool !== 'fill' && currentTool !== 'pencil' && currentTool !== 'eraser') {
    const frame = project.frames[project.currentFrame]
    if (frame) {
      const idx = frame.strokes.indexOf(currentStroke)
      if (idx !== -1) frame.strokes.splice(idx, 1)
    }
  }
  currentStroke = null
  renderFrameThumbs()
  render()
}
