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
}

function createDefaultStickman() {
  return JSON.parse(JSON.stringify(STICKMAN_PARTS))
}

function computeJointPositions(parts) {
  const positions = {}
  for (const [name, part] of Object.entries(parts)) {
    if (!part.parent) {
      positions[name] = { x: part.x, y: part.y }
    } else {
      const parentPos = positions[part.parent]
      const rad = part.angle * Math.PI / 180
      positions[name] = {
        x: parentPos.x + Math.cos(rad) * part.length,
        y: parentPos.y - Math.sin(rad) * part.length
      }
    }
  }
  return positions
}

function drawStickman(ctx, parts) {
  const pos = computeJointPositions(parts)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const head = parts.head
  const hp = pos.head
  ctx.beginPath()
  ctx.arc(hp.x, hp.y, head.length, 0, Math.PI * 2)
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = head.thickness
  ctx.stroke()

  const drawOrder = ['neck','torso','upperArmL','upperArmR','forearmL','forearmR','thighL','thighR','calfL','calfR']
  for (const name of drawOrder) {
    const part = parts[name]
    const p = pos[name]
    const pp = pos[part.parent]
    ctx.beginPath()
    ctx.moveTo(pp.x, pp.y)
    ctx.lineTo(p.x, p.y)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = part.thickness
    ctx.stroke()
  }
}

function hitTestJoint(parts, mx, my, threshold) {
  if (threshold === undefined) threshold = 15
  const pos = computeJointPositions(parts)
  let closest = null
  let closestDist = threshold
  for (const [name, p] of Object.entries(pos)) {
    const dx = mx - p.x
    const dy = my - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < closestDist) {
      closestDist = dist
      closest = name
    }
  }
  return closest
}
