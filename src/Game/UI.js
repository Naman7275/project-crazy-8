import { Game } from './Game.js'

const DATA_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ{}[]<>=/+*&^%$#@!'

export class UI {
  constructor() {
    this.game = Game.getInstance()

    this.loadingScreen = document.getElementById('loading-screen')
    this.loadingBar = document.getElementById('loading-bar')
    this.loadingText = document.getElementById('loading-text')
    this.bootLog = document.getElementById('boot-log')
    this.locationDisplay = document.getElementById('location-display')
    this.interactHint = document.getElementById('interact-hint')
    this.panel = document.getElementById('interaction-panel')
    this.panelTitle = document.getElementById('panel-title')
    this.panelContent = document.getElementById('panel-content')
    this.panelClose = document.getElementById('panel-close')
    this.coordsDisplay = document.getElementById('hud-coords')
    this.fpsDisplay = document.getElementById('hud-fps')
    this.chromaticFlash = document.getElementById('chromatic-flash')
    this.dataStream = document.getElementById('data-stream')

    this.panelOpen = false
    this.fpsFrames = 0
    this.fpsTime = 0
    this.currentFps = 60

    this.setupEvents()
    this.setupDataStream()
  }

  setupEvents() {
    if (this.panelClose) {
      this.panelClose.addEventListener('click', () => this.hidePanel())
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panelOpen) {
        this.hidePanel()
      }
      if ((e.key === 'e' || e.key === 'E') && !this.panelOpen) {
        this.handleInteract()
      }
    })
  }

  setupDataStream() {
    if (!this.dataStream) return
    for (let i = 0; i < 12; i++) {
      const col = document.createElement('div')
      col.className = 'data-column'
      col.style.left = `${5 + i * 8}%`
      col.style.animationDuration = `${8 + Math.random() * 12}s`
      col.style.animationDelay = `${-Math.random() * 10}s`

      let text = ''
      for (let j = 0; j < 60; j++) {
        text += DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)]
        if (j % 8 === 0) text += '\n'
      }
      col.textContent = text
      this.dataStream.appendChild(col)
    }
  }

  setLoadingProgress(progress) {
    if (this.loadingBar) {
      this.loadingBar.style.width = `${progress}%`
    }
  }

  setLoadingText(text) {
    if (this.loadingText) {
      this.loadingText.textContent = text
    }
  }

  addBootLine(text) {
    if (this.bootLog) {
      this.bootLog.innerHTML += `<br>${text}`
    }
  }

  hideLoading() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0'
      this.loadingScreen.style.visibility = 'hidden'
      this.loadingScreen.style.pointerEvents = 'none'
    }
    this.triggerChromaticFlash()
  }

  triggerChromaticFlash() {
    if (!this.chromaticFlash) return
    this.chromaticFlash.classList.add('active')
    setTimeout(() => this.chromaticFlash.classList.remove('active'), 300)
  }

  updateLocation(text) {
    if (this.locationDisplay) {
      this.locationDisplay.textContent = text
    }
  }

  showInteractHint(show) {
    if (this.interactHint) {
      this.interactHint.classList.toggle('visible', show)
    }
  }

  handleInteract() {
    const zone = this.game.zones?.activeZone
    if (!zone) return
    this.triggerChromaticFlash()
    this.showPanel(zone.id, zone.label)
  }

  showPanel(zoneId, title) {
    if (!this.panel) return
    this.panelOpen = true
    if (this.panelTitle) this.panelTitle.textContent = title
    if (this.panelContent) this.panelContent.innerHTML = this.getZoneContent(zoneId)
    this.panel.classList.add('active')
  }

  hidePanel() {
    if (!this.panel) return
    this.panelOpen = false
    this.panel.classList.remove('active')
  }

  getZoneContent(zoneId) {
    const content = {
      landing: `
        <h3>Welcome to the Grid</h3>
        <p>Navigate through Night City to explore my work. Each zone holds a piece of who I am.</p>
        <p>Use <span class="key">WASD</span> to move, <span class="key">SPACE</span> to jump, <span class="key">E</span> to interact with zones.</p>
      `,
      projects: `
        <h3>Featured Projects</h3>
        <div class="project-card">
          <h4>// PROJECT_01</h4>
          <p>Coming soon...</p>
          <div class="tech-tags">
            <span class="tech-tag">LOADING</span>
          </div>
        </div>
      `,
      skills: `
        <h3>Tech Stack</h3>
        <div class="skill-row">
          <div class="skill-label"><span>JavaScript / TypeScript</span><span>LOADING</span></div>
          <div class="skill-bar"><div class="fill" style="width:0%"></div></div>
        </div>
      `,
      about: `
        <h3>About Me</h3>
        <p>Content incoming...</p>
      `,
      contact: `
        <h3>Get In Touch</h3>
        <p>Links incoming...</p>
      `,
      lab: `
        <h3>Experiments</h3>
        <p>Side projects and prototypes incoming...</p>
      `,
    }
    return content[zoneId] || '<p>Zone data not found.</p>'
  }

  update(delta) {
    this.fpsFrames++
    this.fpsTime += delta
    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.fpsFrames / this.fpsTime)
      this.fpsFrames = 0
      this.fpsTime = 0
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `${this.currentFps} FPS`
      }
    }

    const player = this.game.player
    if (player && this.coordsDisplay) {
      const spans = this.coordsDisplay.querySelectorAll('span')
      if (spans.length >= 3) {
        spans[0].textContent = player.position.x.toFixed(1)
        spans[1].textContent = player.position.y.toFixed(1)
        spans[2].textContent = player.position.z.toFixed(1)
      }
    }
  }
}
