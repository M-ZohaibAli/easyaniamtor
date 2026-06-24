let animationInterval = null

function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

function init() {
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      currentTool = btn.dataset.tool
      stage.style.cursor = currentTool === 'pose' ? 'grab' :
        currentTool === 'fill' ? 'crosshair' : 'crosshair'
    })
  })

  document.getElementById('showStickman').addEventListener('change', render)
  document.getElementById('onionSkin').addEventListener('change', render)

  document.getElementById('addFrameBtn').addEventListener('click', addFrame)
  document.getElementById('dupFrameBtn').addEventListener('click', duplicateFrame)
  document.getElementById('delFrameBtn').addEventListener('click', deleteFrame)

  document.getElementById('playBtn').addEventListener('click', play)
  document.getElementById('pauseBtn').addEventListener('click', pause)
  document.getElementById('resetBtn').addEventListener('click', reset)

  document.getElementById('fpsInput').addEventListener('change', e => {
    project.fps = parseInt(e.target.value) || 12
    if (project.playing) { pause(); play() }
  })

  stage.addEventListener('pointerdown', onPointerDown)
  stage.addEventListener('pointermove', onPointerMove)
  stage.addEventListener('pointerup', onPointerUp)
  stage.addEventListener('pointerleave', onPointerUp)

  initProject()
}

function play() {
  if (project.playing) return
  if (project.frames.length < 2) {
    showToast('Add more frames to animate')
    return
  }
  project.playing = true
  document.getElementById('playBtn').textContent = 'Playing...'
  const interval = 1000 / project.fps
  animationInterval = setInterval(() => {
    let next = project.currentFrame + 1
    if (next >= project.frames.length) next = 0
    selectFrame(next)
  }, interval)
}

function pause() {
  project.playing = false
  document.getElementById('playBtn').textContent = 'Play'
  if (animationInterval) {
    clearInterval(animationInterval)
    animationInterval = null
  }
}

function reset() {
  pause()
  selectFrame(0)
}

document.addEventListener('DOMContentLoaded', init)
