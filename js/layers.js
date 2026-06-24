function createLayer(name) {
  if (name === undefined) name = 'Layer 1'
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

function getActiveLayer(frame) {
  return frame.layers.find(l => !l.locked) || frame.layers[0]
}
