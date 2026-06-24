const MAX_UNDO = 50
let undoStack = []
let redoStack = []

function saveState() {
  undoStack.push(JSON.stringify(project.frames))
  if (undoStack.length > MAX_UNDO) undoStack.shift()
  redoStack = []
}

function undo() {
  if (undoStack.length < 2) return
  redoStack.push(undoStack.pop())
  project.frames = JSON.parse(undoStack[undoStack.length - 1])
  currentLayerId = project.frames[project.currentFrame]?.layers?.[project.frames[project.currentFrame].layers.length - 1]?.id
  if (typeof renderFrameThumbs === 'function') renderFrameThumbs()
  if (typeof render === 'function') render()
  if (typeof updateFrameIndicator === 'function') updateFrameIndicator()
  if (typeof renderLayers === 'function') renderLayers()
}

function redo() {
  if (redoStack.length === 0) return
  const state = redoStack.pop()
  undoStack.push(state)
  project.frames = JSON.parse(state)
  currentLayerId = project.frames[project.currentFrame]?.layers?.[project.frames[project.currentFrame].layers.length - 1]?.id
  if (typeof renderFrameThumbs === 'function') renderFrameThumbs()
  if (typeof render === 'function') render()
  if (typeof updateFrameIndicator === 'function') updateFrameIndicator()
  if (typeof renderLayers === 'function') renderLayers()
}

document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
  if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
})
