import { Game } from './Game.js'

export class View {
  constructor() {
    this.game = Game.getInstance()
    this.camera = this.game.rendering.camera
    this.offset = { x: 0, y: 14, z: 20 }
    this.lookAtTarget = { x: 0, y: 2, z: 0 }
    this.smoothness = 4
    this.shakeIntensity = 0
    this.shakeDecay = 5
  }

  shake(intensity = 0.3) {
    this.shakeIntensity = intensity
  }

  update(delta) {
    if (!this.game.player) return

    const pos = this.game.player.position
    const inputs = this.game.inputs?.keys || {}

    const dynamicY = inputs.sprint ? this.offset.y - 2 : this.offset.y
    const dynamicZ = inputs.sprint ? this.offset.z - 3 : this.offset.z

    const targetX = pos.x + this.offset.x
    const targetY = pos.y + dynamicY
    const targetZ = pos.z + dynamicZ

    const t = 1 - Math.exp(-this.smoothness * delta)
    this.camera.position.x += (targetX - this.camera.position.x) * t
    this.camera.position.y += (targetY - this.camera.position.y) * t
    this.camera.position.z += (targetZ - this.camera.position.z) * t

    this.lookAtTarget.x += (pos.x - this.lookAtTarget.x) * t
    this.lookAtTarget.y += (pos.y + 1.5 - this.lookAtTarget.y) * t
    this.lookAtTarget.z += (pos.z - this.lookAtTarget.z) * t

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity
      this.shakeIntensity *= Math.exp(-this.shakeDecay * delta)
    }

    this.camera.lookAt(
      this.lookAtTarget.x,
      this.lookAtTarget.y,
      this.lookAtTarget.z
    )
  }
}
