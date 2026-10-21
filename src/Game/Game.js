import { Ticker } from './Ticker.js'
import { Rendering } from './Rendering.js'
import { View } from './View.js'
import { World } from './World/World.js'
import { Inputs } from './Inputs/Inputs.js'
import { Player } from './Player.js'
import { Zones } from './Zones.js'
import { UI } from './UI.js'

let instance = null

export class Game {
  constructor() {
    if (instance) return instance
    instance = this

    this.canvas = null
    this.ticker = new Ticker()
    this.ready = false

    this.init()
  }

  async init() {
    const rapier = await import('@dimforge/rapier3d')
    this.rapier = rapier

    this.ui = new UI()
    this.ui.setLoadingProgress(10)
    this.ui.setLoadingText('BOOTING RENDER PIPELINE...')
    this.ui.addBootLine('[GPU] WebGL 2.0 context acquired')

    await this.delay(100)

    this.rendering = new Rendering()
    this.canvas = this.rendering.canvas
    this.ui.setLoadingProgress(30)
    this.ui.setLoadingText('LOADING RAPIER3D WASM...')
    this.ui.addBootLine('[PHX] Rapier3D physics engine loaded')

    await this.delay(80)

    this.view = new View()
    this.inputs = new Inputs()
    this.ui.setLoadingProgress(45)
    this.ui.setLoadingText('CONSTRUCTING WORLD...')
    this.ui.addBootLine('[WLD] building Night City geometry...')

    this.world = new World()
    this.ui.setLoadingProgress(65)
    this.ui.setLoadingText('SPAWNING PLAYER...')
    this.ui.addBootLine('[PLR] character controller online')

    await this.delay(60)

    this.player = new Player()
    this.ui.setLoadingProgress(80)
    this.ui.setLoadingText('MAPPING ZONES...')
    this.ui.addBootLine('[ZNE] 6 spatial zones registered')

    this.zones = new Zones()
    this.ui.setLoadingProgress(95)
    this.ui.setLoadingText('NEURAL LINK ESTABLISHED')
    this.ui.addBootLine('[SYS] all subsystems nominal')

    await this.delay(300)

    this.ui.setLoadingProgress(100)
    await this.delay(200)

    this.ready = true
    this.ui.hideLoading()

    this.ticker.on('tick', (delta) => {
      if (!this.ready) return
      this.inputs.update(delta)
      this.player.update(delta)
      this.world.update(delta)
      this.zones.update(delta)
      this.ui.update(delta)
      this.view.update(delta)
      this.rendering.update(delta)
    })
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static getInstance() {
    return instance
  }
}
