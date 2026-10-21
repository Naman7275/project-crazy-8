import { Game } from './Game.js'

export class View {
  constructor() {
    this.game = Game.getInstance()
    this.camera = this.game.rendering.camera
    this.offset = { x: 0, y: 12, z: 18 }
    this.lookAtTarget = { x: 0, y: 2, z: 0 }
    this.smoothness = 5
  }

  update(delta) {
    if (!this.game.player) return

    const pos = this.game.player.position
    const targetX = pos.x + this.offset.x
    const targetY = pos.y + this.offset.y
    const targetZ = pos.z + this.offset.z

    const t = 1 - Math.exp(-this.smoothness * delta)
    this.camera.position.x += (targetX - this.camera.position.x) * t
    this.camera.position.y += (targetY - this.camera.position.y) * t
    this.camera.position.z += (targetZ - this.camera.position.z) * t

    this.lookAtTarget.x += (pos.x - this.lookAtTarget.x) * t
    this.lookAtTarget.y += (pos.y + 2 - this.lookAtTarget.y) * t
    this.lookAtTarget.z += (pos.z - this.lookAtTarget.z) * t

    this.camera.lookAt(
      this.lookAtTarget.x,
      this.lookAtTarget.y,
      this.lookAtTarget.z
    )
  }
}
