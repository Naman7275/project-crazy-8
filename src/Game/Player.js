import * as THREE from 'three'
import { Game } from './Game.js'

export class Player {
  constructor() {
    this.game = Game.getInstance()
    this.rapier = this.game.rapier
    this.scene = this.game.rendering.scene

    this.position = { x: 0, y: 1, z: 0 }
    this.velocity = { x: 0, y: 0, z: 0 }
    this.rotation = 0
    this.targetRotation = 0
    this.grounded = true
    this.lean = 0

    this.speed = 12
    this.sprintMultiplier = 1.8
    this.jumpForce = 10
    this.time = 0

    this.setupPhysics()
    this.buildRider()
    this.buildHoverBike()
    this.setupTrails()
    this.setupExhaust()
    this.setupSpeedLines()
  }

  setupPhysics() {
    const world = this.game.world.physicsWorld
    if (!world) return

    const bodyDesc = this.rapier.RigidBodyDesc.dynamic()
      .setTranslation(0, 2, 0)
      .lockRotations()
    this.body = world.createRigidBody(bodyDesc)

    const colliderDesc = this.rapier.ColliderDesc.cuboid(0.8, 0.6, 1.2)
      .setFriction(0.3)
      .setRestitution(0.0)
    this.collider = world.createCollider(colliderDesc, this.body)
  }

  buildRider() {
    this.rider = new THREE.Group()

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.7,
      roughness: 0.3,
    })
    const jacketMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      metalness: 0.8,
      roughness: 0.2,
    })

    // torso — jacket
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.4), jacketMat)
    torso.position.y = 1.8
    torso.rotation.x = -0.15
    torso.castShadow = true
    this.rider.add(torso)

    // jacket collar / high neck
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.3, 0.2, 8),
      jacketMat
    )
    collar.position.set(0, 2.25, 0)
    this.rider.add(collar)

    // neon strips on jacket
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xff2a6d })
    const stripGeo = new THREE.BoxGeometry(0.04, 0.6, 0.04)
    for (const xOff of [-0.32, 0.32]) {
      const strip = new THREE.Mesh(stripGeo, stripMat)
      strip.position.set(xOff, 1.8, 0.21)
      this.rider.add(strip)
    }

    // jacket back neon accent
    const backStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.04, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x05d9e8 })
    )
    backStrip.position.set(0, 1.6, -0.21)
    this.rider.add(backStrip)

    // helmet
    const helmetMat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 0.95,
      roughness: 0.1,
    })
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), helmetMat)
    helmet.scale.set(1, 1.1, 1.05)
    helmet.position.set(0, 2.55, 0)
    helmet.castShadow = true
    this.rider.add(helmet)

    // visor — wide glowing strip
    const visorMat = new THREE.MeshBasicMaterial({
      color: 0xff2a6d,
      transparent: true,
      opacity: 0.9,
    })
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.28), visorMat)
    visor.position.set(0, 2.52, 0.08)
    this.rider.add(visor)
    this.visor = visor

    // visor glow light
    const visorLight = new THREE.PointLight(0xff2a6d, 1.5, 4)
    visorLight.position.set(0, 2.52, 0.3)
    this.rider.add(visorLight)
    this.visorLight = visorLight

    // arms
    const armMat = bodyMat
    for (const side of [-1, 1]) {
      const upperArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.07, 0.5, 8),
        armMat
      )
      upperArm.position.set(side * 0.45, 1.9, 0.05)
      upperArm.rotation.x = -0.8
      upperArm.rotation.z = side * 0.2
      this.rider.add(upperArm)

      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.06, 0.45, 8),
        armMat
      )
      forearm.position.set(side * 0.42, 1.55, 0.25)
      forearm.rotation.x = -0.4
      this.rider.add(forearm)

      // cyber arm strip
      const armStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.4, 0.03),
        new THREE.MeshBasicMaterial({ color: 0x05d9e8 })
      )
      armStrip.position.copy(forearm.position)
      armStrip.rotation.copy(forearm.rotation)
      this.rider.add(armStrip)

      // gloves
      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x0a0a1e, metalness: 0.9, roughness: 0.1 })
      )
      glove.position.set(side * 0.4, 1.35, 0.35)
      this.rider.add(glove)
    }

    // legs
    for (const side of [-1, 1]) {
      const thigh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8),
        bodyMat
      )
      thigh.position.set(side * 0.2, 1.15, 0.1)
      thigh.rotation.x = -0.6
      this.rider.add(thigh)

      const shin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8),
        bodyMat
      )
      shin.position.set(side * 0.22, 0.8, 0.25)
      shin.rotation.x = 0.3
      this.rider.add(shin)

      // knee guard neon
      const kneeGuard = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.08, 0.12),
        new THREE.MeshBasicMaterial({
          color: side > 0 ? 0x05d9e8 : 0xff2a6d,
          transparent: true,
          opacity: 0.7,
        })
      )
      kneeGuard.position.set(side * 0.22, 0.95, 0.2)
      this.rider.add(kneeGuard)

      // boots
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.15, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x0a0a1e, metalness: 0.9, roughness: 0.1 })
      )
      boot.position.set(side * 0.22, 0.6, 0.35)
      this.rider.add(boot)
    }

    this.scene.add(this.rider)
  }

  buildHoverBike() {
    this.bike = new THREE.Group()

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      metalness: 0.9,
      roughness: 0.15,
    })

    // main body — sleek elongated shape
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.3, 2.4)
    const body = new THREE.Mesh(bodyGeo, frameMat)
    body.position.y = 0.4
    body.castShadow = true
    this.bike.add(body)

    // front fairing — wedge
    const fairingGeo = new THREE.ConeGeometry(0.35, 1.2, 4)
    const fairing = new THREE.Mesh(fairingGeo, frameMat)
    fairing.rotation.x = Math.PI / 2
    fairing.rotation.y = Math.PI / 4
    fairing.position.set(0, 0.5, 1.5)
    fairing.castShadow = true
    this.bike.add(fairing)

    // rear section — tapered
    const rearGeo = new THREE.BoxGeometry(0.6, 0.25, 0.8)
    const rear = new THREE.Mesh(rearGeo, frameMat)
    rear.position.set(0, 0.35, -1.3)
    this.bike.add(rear)

    // handlebar
    const barMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.95,
      roughness: 0.1,
    })
    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), barMat)
    handlebar.rotation.z = Math.PI / 2
    handlebar.position.set(0, 0.75, 0.9)
    this.bike.add(handlebar)

    // handlebar grips
    for (const side of [-1, 1]) {
      const grip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.12, 8),
        new THREE.MeshBasicMaterial({ color: 0xff2a6d })
      )
      grip.rotation.z = Math.PI / 2
      grip.position.set(side * 0.45, 0.75, 0.9)
      this.bike.add(grip)
    }

    // neon underglow strips
    const underglowColors = [0x05d9e8, 0xff2a6d]
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1
      const glowStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 2.2),
        new THREE.MeshBasicMaterial({ color: underglowColors[i] })
      )
      glowStrip.position.set(side * 0.38, 0.2, 0)
      this.bike.add(glowStrip)
    }

    // center underglow
    const centerGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.02, 2.0),
      new THREE.MeshBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.3,
      })
    )
    centerGlow.position.y = 0.15
    this.bike.add(centerGlow)

    // underglow light
    this.bikeLight = new THREE.PointLight(0x05d9e8, 2, 6)
    this.bikeLight.position.set(0, 0.1, 0)
    this.bike.add(this.bikeLight)

    // headlight
    const headlight = new THREE.SpotLight(0x05d9e8, 3, 20, 0.4, 0.5)
    headlight.position.set(0, 0.5, 1.8)
    headlight.target.position.set(0, 0, 10)
    this.bike.add(headlight)
    this.bike.add(headlight.target)

    // headlight visual
    const headlightGeo = new THREE.CircleGeometry(0.12, 16)
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0x05d9e8 })
    const headlightMesh = new THREE.Mesh(headlightGeo, headlightMat)
    headlightMesh.position.set(0, 0.5, 1.81)
    this.bike.add(headlightMesh)

    // taillight
    const tailGeo = new THREE.BoxGeometry(0.5, 0.06, 0.04)
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a6d })
    const taillight = new THREE.Mesh(tailGeo, tailMat)
    taillight.position.set(0, 0.4, -1.7)
    this.bike.add(taillight)
    this.taillight = taillight

    // thruster exhausts
    this.thrusters = []
    for (const xOff of [-0.25, 0.25]) {
      const thrusterGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.3, 8, 1, true)
      const thrusterMat = new THREE.MeshBasicMaterial({
        color: 0x7b2ff7,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
      const thruster = new THREE.Mesh(thrusterGeo, thrusterMat)
      thruster.rotation.x = Math.PI / 2
      thruster.position.set(xOff, 0.35, -1.75)
      this.bike.add(thruster)
      this.thrusters.push(thruster)

      const thrusterLight = new THREE.PointLight(0x7b2ff7, 1, 4)
      thrusterLight.position.set(xOff, 0.35, -1.9)
      this.bike.add(thrusterLight)
      this.thrusters.push(thrusterLight)
    }

    // hover pads (4 corners — glowing discs underneath)
    const padMat = new THREE.MeshBasicMaterial({
      color: 0x05d9e8,
      transparent: true,
      opacity: 0.4,
    })
    const padPositions = [
      [-0.3, 0.05, 0.8],
      [0.3, 0.05, 0.8],
      [-0.3, 0.05, -0.8],
      [0.3, 0.05, -0.8],
    ]
    this.hoverPads = []
    for (const pos of padPositions) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), padMat.clone())
      pad.rotation.x = -Math.PI / 2
      pad.position.set(...pos)
      this.bike.add(pad)
      this.hoverPads.push(pad)
    }

    // side panels with accent
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.2, 1.5),
        new THREE.MeshStandardMaterial({
          color: 0x111122,
          metalness: 0.9,
          roughness: 0.1,
        })
      )
      panel.position.set(side * 0.42, 0.4, -0.1)
      this.bike.add(panel)

      const panelAccent = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.04, 1.0),
        new THREE.MeshBasicMaterial({
          color: side > 0 ? 0x05d9e8 : 0xff2a6d,
        })
      )
      panelAccent.position.set(side * 0.44, 0.45, -0.1)
      this.bike.add(panelAccent)
    }

    this.scene.add(this.bike)
  }

  setupTrails() {
    this.trailPoints = []
    const maxTrailLength = 60

    this.trailGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(maxTrailLength * 3)
    this.trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    this.trailLeft = new THREE.Line(
      this.trailGeo.clone(),
      new THREE.LineBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.4,
      })
    )

    this.trailRight = new THREE.Line(
      this.trailGeo.clone(),
      new THREE.LineBasicMaterial({
        color: 0xff2a6d,
        transparent: true,
        opacity: 0.4,
      })
    )

    this.scene.add(this.trailLeft)
    this.scene.add(this.trailRight)
    this.trailIndex = 0
    this.maxTrailLength = maxTrailLength
  }

  update(delta) {
    this.time += delta
    const inputs = this.game.inputs.keys
    const world = this.game.world.physicsWorld

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
      this.targetRotation = Math.atan2(moveX, moveZ)
    }

    // smooth rotation
    let rotDiff = this.targetRotation - this.rotation
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
    this.rotation += rotDiff * Math.min(1, 8 * delta)

    // lean into turns
    const targetLean = -rotDiff * 0.8
    this.lean += (targetLean - this.lean) * Math.min(1, 6 * delta)

    const isSprinting = inputs.sprint
    const currentSpeed = isSprinting ? this.speed * this.sprintMultiplier : this.speed
    const isMoving = len > 0

    if (this.body && world) {
      world.step()
      const pos = this.body.translation()
      const vel = this.body.linvel()

      this.grounded = pos.y <= 1.5

      let newVelY = vel.y
      if (inputs.jump && this.grounded) {
        newVelY = this.jumpForce
        this.game.view?.shake(0.2)
      }

      this.body.setLinvel(
        { x: moveX * currentSpeed, y: newVelY, z: moveZ * currentSpeed },
        true
      )

      this.position.x = pos.x
      this.position.y = pos.y
      this.position.z = pos.z

      if (pos.y < -20) {
        this.body.setTranslation({ x: 0, y: 3, z: 0 }, true)
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, true)
      }
    } else {
      this.position.x += moveX * currentSpeed * delta
      this.position.z += moveZ * currentSpeed * delta
    }

    // hover bob
    const hoverY = this.position.y + 0.3 + Math.sin(this.time * 3) * 0.08

    // update bike
    if (this.bike) {
      this.bike.position.set(this.position.x, hoverY, this.position.z)
      this.bike.rotation.y = this.rotation
      this.bike.rotation.z = this.lean * 0.3

      // thruster pulse
      for (const t of this.thrusters) {
        if (t.isMesh) {
          const intensity = isMoving ? (isSprinting ? 0.9 : 0.6) : 0.3
          t.material.opacity = intensity + Math.sin(this.time * 15) * 0.15
          t.scale.y = intensity + 0.3 + Math.sin(this.time * 20) * 0.1
        } else if (t.isLight) {
          t.intensity = isMoving ? (isSprinting ? 2 : 1) : 0.3
        }
      }

      // hover pad pulse
      for (const pad of this.hoverPads) {
        pad.material.opacity = 0.3 + Math.sin(this.time * 5 + pad.position.x * 10) * 0.15
      }

      // underglow intensity
      if (this.bikeLight) {
        this.bikeLight.intensity = isMoving ? (isSprinting ? 3 : 2) : 1
        this.bikeLight.color.setHex(isSprinting ? 0xff2a6d : 0x05d9e8)
      }

      // taillight brightness
      if (this.taillight) {
        this.taillight.material.opacity = isMoving ? 0.6 : 1.0
      }
    }

    // update rider
    if (this.rider) {
      this.rider.position.set(this.position.x, hoverY, this.position.z)
      this.rider.rotation.y = this.rotation
      this.rider.rotation.z = this.lean * 0.2

      // visor flicker
      if (this.visor) {
        const flicker = Math.sin(this.time * 30) > 0.95 ? 0.4 : 0.9
        this.visor.material.opacity = flicker
      }
    }

    // exhaust particles from thrusters
    if (this.exhaustParticles) {
      this.updateExhaust(delta, isMoving, isSprinting)
    }

    // speed lines when sprinting
    if (this.speedLines) {
      this.updateSpeedLines(delta, isMoving, isSprinting)
    }

    // sprint FOV + distortion
    const rendering = this.game.rendering
    const targetFov = isSprinting && isMoving ? 78 : 65
    rendering.camera.fov += (targetFov - rendering.camera.fov) * Math.min(1, 4 * delta)
    rendering.camera.updateProjectionMatrix()
    rendering.setSprintDistortion(isSprinting && isMoving ? 1.0 : 0.0)

    // update trails
    this.updateTrails(isMoving)
  }

  updateTrails(isMoving) {
    if (!isMoving) return

    const sinR = Math.sin(this.rotation)
    const cosR = Math.cos(this.rotation)
    const perpX = cosR
    const perpZ = -sinR
    const offset = 0.35
    const trailY = this.position.y + 0.15

    const leftPos = [
      this.position.x - perpX * offset,
      trailY,
      this.position.z - perpZ * offset,
    ]
    const rightPos = [
      this.position.x + perpX * offset,
      trailY,
      this.position.z + perpZ * offset,
    ]

    this.trailPoints.push({ left: leftPos, right: rightPos })
    if (this.trailPoints.length > this.maxTrailLength) {
      this.trailPoints.shift()
    }

    const updateTrailLine = (line, side) => {
      const posArr = line.geometry.attributes.position.array
      for (let i = 0; i < this.maxTrailLength; i++) {
        if (i < this.trailPoints.length) {
          const p = this.trailPoints[i][side]
          posArr[i * 3] = p[0]
          posArr[i * 3 + 1] = p[1]
          posArr[i * 3 + 2] = p[2]
        }
      }
      line.geometry.attributes.position.needsUpdate = true
      line.geometry.setDrawRange(0, this.trailPoints.length)
    }

    updateTrailLine(this.trailLeft, 'left')
    updateTrailLine(this.trailRight, 'right')
  }

  setupExhaust() {
    const exhaustCount = 80
    const positions = new Float32Array(exhaustCount * 3)
    const colors = new Float32Array(exhaustCount * 3)
    const sizes = new Float32Array(exhaustCount)

    for (let i = 0; i < exhaustCount; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      colors[i * 3] = 0.48
      colors[i * 3 + 1] = 0.18
      colors[i * 3 + 2] = 0.97
      sizes[i] = 0
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.exhaustParticles = new THREE.Points(geo, mat)
    this.scene.add(this.exhaustParticles)
    this.exhaustIndex = 0
    this.exhaustCount = exhaustCount
    this.exhaustVelocities = new Float32Array(exhaustCount * 3)
    this.exhaustLife = new Float32Array(exhaustCount)
  }

  setupSpeedLines() {
    const lineCount = 40
    this.speedLines = []
    const mat = new THREE.LineBasicMaterial({
      color: 0x05d9e8,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    })

    for (let i = 0; i < lineCount; i++) {
      const geo = new THREE.BufferGeometry()
      const positions = new Float32Array(6)
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      const line = new THREE.Line(geo, mat.clone())
      line.frustumCulled = false
      this.scene.add(line)
      this.speedLines.push({
        line,
        offset: { x: (Math.random() - 0.5) * 6, y: Math.random() * 4 + 1, z: (Math.random() - 0.5) * 6 },
        length: 1 + Math.random() * 3,
      })
    }
  }

  updateExhaust(delta, isMoving, isSprinting) {
    const pos = this.exhaustParticles.geometry.attributes.position.array
    const col = this.exhaustParticles.geometry.attributes.color.array

    // emit new particles from thrusters
    if (isMoving) {
      const emitCount = isSprinting ? 4 : 2
      for (let e = 0; e < emitCount; e++) {
        const i = this.exhaustIndex % this.exhaustCount
        const sinR = Math.sin(this.rotation)
        const cosR = Math.cos(this.rotation)
        const side = (e % 2 === 0) ? -0.25 : 0.25

        pos[i * 3] = this.position.x - sinR * 1.75 + cosR * side + (Math.random() - 0.5) * 0.1
        pos[i * 3 + 1] = this.position.y + 0.35 + (Math.random() - 0.5) * 0.1
        pos[i * 3 + 2] = this.position.z - cosR * 1.75 - sinR * side + (Math.random() - 0.5) * 0.1

        this.exhaustVelocities[i * 3] = -sinR * (-3 - Math.random() * 2)
        this.exhaustVelocities[i * 3 + 1] = (Math.random() - 0.3) * 0.5
        this.exhaustVelocities[i * 3 + 2] = -cosR * (-3 - Math.random() * 2)

        this.exhaustLife[i] = 1.0

        if (isSprinting) {
          col[i * 3] = 1
          col[i * 3 + 1] = 0.16
          col[i * 3 + 2] = 0.43
        } else {
          col[i * 3] = 0.48
          col[i * 3 + 1] = 0.18
          col[i * 3 + 2] = 0.97
        }
        this.exhaustIndex++
      }
    }

    // update all particles
    for (let i = 0; i < this.exhaustCount; i++) {
      if (this.exhaustLife[i] > 0) {
        pos[i * 3] += this.exhaustVelocities[i * 3] * delta
        pos[i * 3 + 1] += this.exhaustVelocities[i * 3 + 1] * delta
        pos[i * 3 + 2] += this.exhaustVelocities[i * 3 + 2] * delta
        this.exhaustLife[i] -= delta * 2.5
        if (this.exhaustLife[i] <= 0) {
          pos[i * 3 + 1] = -100
        }
      }
    }

    this.exhaustParticles.geometry.attributes.position.needsUpdate = true
    this.exhaustParticles.geometry.attributes.color.needsUpdate = true
    this.exhaustParticles.material.opacity = isSprinting ? 0.8 : 0.5
  }

  updateSpeedLines(delta, isMoving, isSprinting) {
    const targetOpacity = (isMoving && isSprinting) ? 0.3 : 0
    const camera = this.game.rendering.camera

    for (const sl of this.speedLines) {
      const mat = sl.line.material
      mat.opacity += (targetOpacity - mat.opacity) * Math.min(1, 5 * delta)

      if (mat.opacity > 0.01) {
        const posArr = sl.line.geometry.attributes.position.array
        const cx = camera.position.x + sl.offset.x
        const cy = camera.position.y + sl.offset.y
        const cz = camera.position.z + sl.offset.z

        const sinR = Math.sin(this.rotation)
        const cosR = Math.cos(this.rotation)

        posArr[0] = cx
        posArr[1] = cy
        posArr[2] = cz
        posArr[3] = cx - sinR * sl.length
        posArr[4] = cy
        posArr[5] = cz - cosR * sl.length

        sl.line.geometry.attributes.position.needsUpdate = true
        mat.color.setHex(isSprinting ? 0xff2a6d : 0x05d9e8)
      }
    }
  }
}
