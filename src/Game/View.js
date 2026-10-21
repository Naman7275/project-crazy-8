import { Game } from './Game.js'

export class View {
  constructor() {
    this.game = Game.getInstance()
    this.camera = this.game.rendering.camera
    this.offset = { x: 0, y: 10, z: 16 }
    this.lookAtTarget = { x: 0, y: 2, z: 0 }
    this.smoothness = 3.5
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
    const rotation = this.game.player.rotation || 0

    const behind = inputs.sprint ? 14 : 16
    const height = inputs.sprint ? 7 : 10
    const lookAhead = inputs.sprint ? 4 : 2

    const camX = pos.x - Math.sin(rotation) * behind
    const camZ = pos.z - Math.cos(rotation) * behind
    const camY = pos.y + height

    const t = 1 - Math.exp(-this.smoothness * delta)
    this.camera.position.x += (camX - this.camera.position.x) * t
    this.camera.position.y += (camY - this.camera.position.y) * t
    this.camera.position.z += (camZ - this.camera.position.z) * t

    const lookX = pos.x + Math.sin(rotation) * lookAhead
    const lookZ = pos.z + Math.cos(rotation) * lookAhead
    this.lookAtTarget.x += (lookX - this.lookAtTarget.x) * t
    this.lookAtTarget.y += (pos.y + 2 - this.lookAtTarget.y) * t
    this.lookAtTarget.z += (lookZ - this.lookAtTarget.z) * t

    if (this.shakeIntensity > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity * 0.5
      this.shakeIntensity *= Math.exp(-this.shakeDecay * delta)
    }

    // sprint micro-shake for speed feel
    if (inputs.sprint && (inputs.forward || inputs.backward || inputs.left || inputs.right)) {
      this.camera.position.x += (Math.random() - 0.5) * 0.04
      this.camera.position.y += (Math.random() - 0.5) * 0.02
    }

    this.camera.lookAt(
      this.lookAtTarget.x,
      this.lookAtTarget.y,
      this.lookAtTarget.z
    )
  }
}
