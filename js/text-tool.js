let isAddingText = false

function startTextTool() {
  isAddingText = true
  stage.style.cursor = 'text'
}

function onTextPointerDown(x, y) {
  if (!isAddingText) return
  const wrap = document.getElementById('canvas-wrap')
  const input = document.createElement('input')
  input.type = 'text'
  input.className = 'text-input-overlay'
  input.style.position = 'absolute'
  input.style.left = '20%'
  input.style.top = '40%'
  input.style.width = '60%'
  input.style.padding = '8px 12px'
  input.style.borderRadius = '8px'
  input.style.border = '2px solid #1e90ff'
  input.style.background = '#0f1720'
  input.style.color = '#e2e8f0'
  input.style.fontSize = '16px'
  input.style.outline = 'none'
  input.style.zIndex = '50'
  input.placeholder = 'Type text and press Enter...'
  wrap.appendChild(input)
  input.focus()

  input.addEventListener('keydown', function handler(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.value) {
        const frame = project.frames[project.currentFrame]
        const layer = getActiveLayer(frame)
        layer.texts.push({
          x: x,
          y: y,
          text: input.value,
          font: (document.getElementById('textFont') && document.getElementById('textFont').value) || 'sans-serif',
          size: parseInt((document.getElementById('textSize') && document.getElementById('textSize').value) || '20'),
          color: document.getElementById('strokeColor') ? document.getElementById('strokeColor').value : '#ffffff'
        })
        render()
        renderFrameThumbs()
      }
      input.remove()
      isAddingText = false
      stage.style.cursor = 'crosshair'
    }
  })

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (input.parentNode) {
        if (input.value) {
          const frame = project.frames[project.currentFrame]
          const layer = getActiveLayer(frame)
          layer.texts.push({
            x: x, y: y,
            text: input.value,
            font: (document.getElementById('textFont') && document.getElementById('textFont').value) || 'sans-serif',
            size: parseInt((document.getElementById('textSize') && document.getElementById('textSize').value) || '20'),
            color: document.getElementById('strokeColor') ? document.getElementById('strokeColor').value : '#ffffff'
          })
          render()
          renderFrameThumbs()
        }
        input.remove()
        isAddingText = false
        stage.style.cursor = 'crosshair'
      }
    }, 200)
  })
}
