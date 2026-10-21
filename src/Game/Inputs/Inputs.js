export class Inputs {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      sprint: false,
      interact: false,
    }

    this.setupKeyboard()
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => this.onKey(e, true))
    window.addEventListener('keyup', (e) => this.onKey(e, false))
  }

  onKey(e, pressed) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = pressed
        break
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = pressed
        break
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = pressed
        break
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = pressed
        break
      case 'Space':
        this.keys.jump = pressed
        if (pressed) e.preventDefault()
        break
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.sprint = pressed
        break
      case 'KeyE':
        this.keys.interact = pressed
        break
    }
  }

  update() {}
}
