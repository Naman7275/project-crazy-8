import * as THREE from 'three'
import { Game } from './Game.js'

export class Player {
  constructor() {
    this.game = Game.getInstance()
    this.rapier = this.game.rapier
    this.scene = this.game.rendering.scene

    this.position = { x: 0, y: 5, z: 0 }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.rotation = 0
    this.grounded = false

    this.speed = 8
    this.sprintMultiplier = 1.8
    this.jumpForce = 8
    this.gravity = -25

    this.setupPhysics()
    this.setupVisual()
  }

  setupPhysics() {
    const world = this.game.world.physicsWorld
    if (!world) return

    const bodyDesc = this.rapier.RigidBodyDesc.dynamic()
      .setTranslation(0, 5, 0)
      .lockRotations()
    this.body = world.createRigidBody(bodyDesc)

    const colliderDesc = this.rapier.ColliderDesc.capsule(0.5, 0.3)
      .setFriction(0.5)
      .setRestitution(0.0)
    this.collider = world.createCollider(colliderDesc, this.body)
  }

  setupVisual() {
    const group = new THREE.Group()

    const bodyGeo = new THREE.CapsuleGeometry(0.3, 1.0, 8, 16)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.8,
      roughness: 0.3,
    })
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
    bodyMesh.position.y = 0.8
    bodyMesh.castShadow = true
    group.add(bodyMesh)

    const visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.35)
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xff2a6d,
      emissive: 0xff2a6d,
      emissiveIntensity: 2,
      metalness: 1,
      roughness: 0,
    })
    const visor = new THREE.Mesh(visorGeo, visorMat)
    visor.position.set(0, 1.5, 0.15)
    group.add(visor)

    const stripGeo = new THREE.BoxGeometry(0.05, 0.8, 0.05)
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x05d9e8,
      emissive: 0x05d9e8,
      emissiveIntensity: 1.5,
    })
    const stripL = new THREE.Mesh(stripGeo, stripMat)
    stripL.position.set(-0.25, 0.8, 0)
    group.add(stripL)

    const stripR = stripL.clone()
    stripR.position.set(0.25, 0.8, 0)
    group.add(stripR)

    this.mesh = group
    this.scene.add(this.mesh)
  }

  update(delta) {
    const inputs = this.game.inputs.keys
    const world = this.game.world.physicsWorld

    if (!this.body || !world) {
      this.updateWithoutPhysics(delta, inputs)
      return
    }

    world.step()

    const pos = this.body.translation()
    const vel = this.body.linvel()

    this.grounded = pos.y <= 1.1

    let moveX = 0
    let moveZ = 0
    if (inputs.forward) moveZ -= 1
    if (inputs.backward) moveZ += 1
    if (inputs.left) moveX -= 1
    if (inputs.right) moveX += 1

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (len > 0) {
      moveX /= len
      moveZ /= len
      this.rotation = Math.atan2(moveX, moveZ)
    }

    const currentSpeed = inputs.sprint ? this.speed * this.sprintMultiplier : this.speed

    let newVelY = vel.y
    if (inputs.jump && this.grounded) {
      newVelY = this.jumpForce
    }

    this.body.setLinvel(
      { x: moveX * currentSpeed, y: newVelY, z: moveZ * currentSpeed },
      true
    )

    this.position.x = pos.x
    this.position.y = pos.y
    this.position.z = pos.z

    if (this.mesh) {
      this.mesh.position.set(pos.x, pos.y, pos.z)
      this.mesh.rotation.y = this.rotation
    }

    if (pos.y < -20) {
      this.body.setTranslation({ x: 0, y: 5, z: 0 }, true)
      this.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }
  }

  updateWithoutPhysics(delta, inputs) {
    let moveX = 0
    let moveZ = 0
    if (inputs.forward) moveZ -= 1
    if (inputs.backward) moveZ += 1
    if (inputs.left) moveX -= 1
    if (inputs.right) moveX += 1

    const len = Math.sqrt(moveX * moveX + moveZ * moveZ)
    if (len > 0) {
      moveX /= len
      moveZ /= len
      this.rotation = Math.atan2(moveX, moveZ)
    }

    const speed = inputs.sprint ? this.speed * this.sprintMultiplier : this.speed
    this.position.x += moveX * speed * delta
    this.position.z += moveZ * speed * delta

    if (this.mesh) {
      this.mesh.position.set(this.position.x, this.position.y, this.position.z)
      this.mesh.rotation.y = this.rotation
    }
  }
}
