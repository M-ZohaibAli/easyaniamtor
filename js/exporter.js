function showExportDialog() {
  const modal = document.getElementById('modal-overlay')
  modal.innerHTML = `
    <div class="modal-dialog">
      <h2>Export</h2>
      <div class="export-options" style="display:flex;flex-direction:column;gap:8px;">
        <button class="export-btn btn-primary" data-format="gif">Export as GIF</button>
        <button class="export-btn btn-primary" data-format="webm">Export as WebM</button>
        <button class="export-btn btn-primary" data-format="spritesheet">Export Spritesheet</button>
      </div>
      <div id="export-progress" style="margin-top:12px;text-align:center;color:#94a3b8;" class="hidden">Exporting... <span id="export-status"></span></div>
      <div class="modal-actions" style="margin-top:16px;">
        <button id="export-cancel" class="btn-secondary">Close</button>
      </div>
    </div>
  `
  modal.classList.remove('hidden')
  document.getElementById('export-cancel').onclick = () => modal.classList.add('hidden')
  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format
      if (format === 'gif') exportGIF()
      else if (format === 'webm') exportWebM()
      else if (format === 'spritesheet') exportSpritesheet()
    })
  })
}

function exportGIF() {
  if (typeof GIF === 'undefined') { showToast('GIF library not loaded'); return }
  const gif = new GIF({ workers: 2, quality: 10, width: project.width, height: project.height })
  for (const frame of project.frames) {
    const c = document.createElement('canvas')
    c.width = project.width; c.height = project.height
    const tc = c.getContext('2d')
    renderFrameData(tc, frame)
    gif.addFrame(c, { delay: 1000 / project.fps })
  }
  gif.on('progress', p => {
    const el = document.getElementById('export-status')
    if (el) el.textContent = Math.round(p * 100) + '%'
  })
  gif.on('finished', blob => {
    downloadBlob(blob, project.name + '.gif')
    document.getElementById('modal-overlay').classList.add('hidden')
  })
  gif.render()
}

function exportWebM() {
  const c = document.createElement('canvas')
  c.width = project.width; c.height = project.height
  const stream = c.captureStream(project.fps)
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
  const chunks = []
  recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data) }
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    downloadBlob(blob, project.name + '.webm')
    document.getElementById('modal-overlay').classList.add('hidden')
  }
  let frameIdx = 0
  const tc = c.getContext('2d')
  recorder.start()
  function captureNext() {
    if (frameIdx >= project.frames.length) { recorder.stop(); return }
    renderFrameData(tc, project.frames[frameIdx])
    frameIdx++
    setTimeout(captureNext, 1000 / project.fps)
  }
  captureNext()
}

function exportSpritesheet() {
  const cols = Math.ceil(Math.sqrt(project.frames.length))
  const rows = Math.ceil(project.frames.length / cols)
  const c = document.createElement('canvas')
  c.width = project.width * cols; c.height = project.height * rows
  const tc = c.getContext('2d')
  project.frames.forEach((frame, i) => {
    const col = i % cols, row = Math.floor(i / cols)
    tc.save(); tc.translate(col * project.width, row * project.height)
    renderFrameData(tc, frame)
    tc.restore()
  })
  c.toBlob(blob => {
    downloadBlob(blob, project.name + '-spritesheet.png')
    document.getElementById('modal-overlay').classList.add('hidden')
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
