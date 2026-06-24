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

function renderSprite(ctx, sprite, x, y, scaleX, scaleY) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scaleX || 1, scaleY || 1)
  for (const p of sprite.paths) {
    const path = new Path2D(p.d)
    if (p.fill && p.fill !== 'none') { ctx.fillStyle = p.fill; ctx.fill(path) }
    if (p.stroke && p.stroke !== 'none') { ctx.strokeStyle = p.stroke; ctx.lineWidth = p.width || 2; ctx.stroke(path) }
  }
  ctx.restore()
}

function findSprite(id) {
  for (const cat of ['characters', 'objects']) {
    const found = SPRITES[cat].find(s => s.id === id)
    if (found) return found
  }
  return null
}
