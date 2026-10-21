import { Game } from './Game.js'

export class UI {
  constructor() {
    this.game = Game.getInstance()

    this.loadingScreen = document.getElementById('loading-screen')
    this.loadingBar = document.getElementById('loading-bar')
    this.loadingText = document.getElementById('loading-text')
    this.locationDisplay = document.getElementById('location-display')
    this.interactHint = document.getElementById('interact-hint')
    this.panel = document.getElementById('interaction-panel')
    this.panelTitle = document.getElementById('panel-title')
    this.panelContent = document.getElementById('panel-content')
    this.panelClose = document.getElementById('panel-close')

    this.panelOpen = false

    this.setupEvents()
  }

  setupEvents() {
    if (this.panelClose) {
      this.panelClose.addEventListener('click', () => this.hidePanel())
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.panelOpen) {
        this.hidePanel()
      }
      if (e.key === 'e' || e.key === 'E') {
        this.handleInteract()
      }
    })
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

  hideLoading() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0'
      setTimeout(() => {
        this.loadingScreen.style.display = 'none'
      }, 800)
    }
  }

  updateLocation(text) {
    if (this.locationDisplay) {
      this.locationDisplay.textContent = text
    }
  }

  showInteractHint(show) {
    if (this.interactHint) {
      this.interactHint.style.opacity = show ? '1' : '0'
    }
  }

  handleInteract() {
    const zone = this.game.zones?.activeZone
    if (!zone) return

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
        <p>Navigate through Night City to explore my work.</p>
        <p>Use <span class="key-badge">WASD</span> to move, <span class="key-badge">SPACE</span> to jump, <span class="key-badge">E</span> to interact.</p>
      `,
      projects: `
        <h3>Featured Projects</h3>
        <div class="project-card">
          <h4>// PROJECT_01</h4>
          <p>Details coming soon...</p>
        </div>
        <div class="project-card">
          <h4>// PROJECT_02</h4>
          <p>Details coming soon...</p>
        </div>
      `,
      skills: `
        <h3>Tech Stack</h3>
        <div class="skill-bar"><span>JavaScript / TypeScript</span><div class="bar"><div class="fill" style="width:90%"></div></div></div>
        <div class="skill-bar"><span>Three.js / WebGL</span><div class="bar"><div class="fill" style="width:80%"></div></div></div>
        <div class="skill-bar"><span>React / Next.js</span><div class="bar"><div class="fill" style="width:85%"></div></div></div>
        <div class="skill-bar"><span>Node.js</span><div class="bar"><div class="fill" style="width:85%"></div></div></div>
      `,
      about: `
        <h3>About Me</h3>
        <p>Creative developer based in the digital frontier.</p>
        <p>Content coming soon...</p>
      `,
      contact: `
        <h3>Get In Touch</h3>
        <p>Connect with me:</p>
        <ul>
          <li>GitHub: Naman7275</li>
          <li>Email: coming soon</li>
        </ul>
      `,
      lab: `
        <h3>Experiments</h3>
        <p>Side projects and prototypes.</p>
        <p>Content coming soon...</p>
      `,
    }

    return content[zoneId] || '<p>Zone data not found.</p>'
  }

  update(delta) {
    // future: animated UI elements, notification queue
  }
}
