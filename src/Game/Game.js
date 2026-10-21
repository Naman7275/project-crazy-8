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
    this.ui.setLoadingProgress(20)
    this.ui.setLoadingText('BOOTING RENDERER...')

    this.rendering = new Rendering()
    this.canvas = this.rendering.canvas
    this.ui.setLoadingProgress(40)
    this.ui.setLoadingText('LOADING PHYSICS...')

    this.view = new View()
    this.inputs = new Inputs()
    this.world = new World()
    this.ui.setLoadingProgress(60)
    this.ui.setLoadingText('SPAWNING PLAYER...')

    this.player = new Player()
    this.zones = new Zones()

    this.ui.setLoadingProgress(80)
    this.ui.setLoadingText('INITIALIZING SYSTEMS...')

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

  static getInstance() {
    return instance
  }
}
