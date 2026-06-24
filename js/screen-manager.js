class ScreenManager {
  constructor(screens, defaultScreen) {
    this.screens = screens
    this.current = null
    window.addEventListener('hashchange', () => this.navigate(window.location.hash))
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = defaultScreen
    } else {
      this.navigate(window.location.hash)
    }
  }

  navigate(hash) {
    const name = hash.replace('#', '').split('/')[0]
    if (this.current && this.current.el && this.current.el.parentNode) {
      this.current.el.remove()
    }
    const screen = this.screens[name]
    if (!screen) { window.location.hash = '#start'; return }
    document.getElementById('app').appendChild(screen.el)
    this.current = screen
    screen.onShow && screen.onShow(hash)
  }
}

function createScreen(html, onShow) {
  const div = document.createElement('div')
  div.innerHTML = html.trim()
  return { el: div.firstElementChild || div, onShow }
}
