import * as THREE from 'three'
import { Game } from '../Game.js'

export class World {
  constructor() {
    this.game = Game.getInstance()
    this.scene = this.game.rendering.scene
    this.rapier = this.game.rapier
    this.physicsWorld = null
    this.time = 0

    this.floatingObjects = []
    this.drones = []
    this.holograms = []
    this.lightBeams = []
    this.dataParticles = null
    this.electricArcs = []

    this.setupPhysics()
    this.setupLighting()
    this.setupGround()
    this.setupBuildings()
    this.setupNeonTubes()
    this.setupHolograms()
    this.setupDrones()
    this.setupLightBeams()
    this.setupRain()
    this.setupDataParticles()
    this.setupElectricArcs()
    this.setupFloatingDebris()
    this.setupSkybox()
  }

  setupPhysics() {
    if (!this.rapier) return
    this.physicsWorld = new this.rapier.World({ x: 0, y: -25, z: 0 })
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x0a0a12, 0.2)
    this.scene.add(ambient)

    const hemi = new THREE.HemisphereLight(0x7b2ff7, 0x0a0a12, 0.3)
    this.scene.add(hemi)

    const mainLight = new THREE.DirectionalLight(0x7b2ff7, 0.3)
    mainLight.position.set(-10, 25, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.set(2048, 2048)
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.camera.left = -40
    mainLight.shadow.camera.right = 40
    mainLight.shadow.camera.top = 40
    mainLight.shadow.camera.bottom = -40
    this.scene.add(mainLight)

    const colors = [0xff2a6d, 0x05d9e8, 0x7b2ff7, 0xff2a6d, 0x05d9e8, 0x7b2ff7, 0x00ff9f]
    const positions = [
      [5, 10, -5], [-8, 8, 3], [0, 12, -12],
      [15, 6, 10], [-12, 14, -8], [8, 4, 15], [0, 3, 0]
    ]
    for (let i = 0; i < colors.length; i++) {
      const light = new THREE.PointLight(colors[i], 2.5, 35)
      light.position.set(...positions[i])
      this.scene.add(light)
    }
  }

  setupGround() {
    const geo = new THREE.BoxGeometry(60, 0.5, 60)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x08081a,
      metalness: 0.95,
      roughness: 0.1,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.position.y = -0.25
    ground.receiveShadow = true
    this.scene.add(ground)

    if (this.physicsWorld) {
      const bodyDesc = this.rapier.RigidBodyDesc.fixed().setTranslation(0, -0.25, 0)
      const body = this.physicsWorld.createRigidBody(bodyDesc)
      this.physicsWorld.createCollider(this.rapier.ColliderDesc.cuboid(30, 0.25, 30), body)
    }

    this.setupGrid()
    this.setupGroundGlow()
  }

  setupGrid() {
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x05d9e8,
      transparent: true,
      opacity: 0.12,
    })
    for (let i = -30; i <= 30; i += 2) {
      const pts1 = [new THREE.Vector3(i, 0.01, -30), new THREE.Vector3(i, 0.01, 30)]
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), gridMat))
      const pts2 = [new THREE.Vector3(-30, 0.01, i), new THREE.Vector3(30, 0.01, i)]
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), gridMat))
    }

    const accentMat = new THREE.LineBasicMaterial({
      color: 0xff2a6d,
      transparent: true,
      opacity: 0.08,
    })
    for (let i = -30; i <= 30; i += 10) {
      const pts1 = [new THREE.Vector3(i, 0.02, -30), new THREE.Vector3(i, 0.02, 30)]
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1), accentMat))
      const pts2 = [new THREE.Vector3(-30, 0.02, i), new THREE.Vector3(30, 0.02, i)]
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2), accentMat))
    }
  }

  setupGroundGlow() {
    const glowGeo = new THREE.PlaneGeometry(60, 60)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x05d9e8,
      transparent: true,
      opacity: 0.02,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.03
    this.groundGlow = glow
    this.scene.add(glow)
  }

  setupBuildings() {
    const data = [
      { x: -18, z: -18, w: 7, h: 16, d: 7 },
      { x: 15, z: -15, w: 9, h: 24, d: 6 },
      { x: -12, z: 14, w: 6, h: 10, d: 8 },
      { x: 18, z: 10, w: 8, h: 20, d: 7 },
      { x: 0, z: -22, w: 12, h: 30, d: 5 },
      { x: -22, z: 0, w: 5, h: 14, d: 10 },
      { x: 22, z: -4, w: 6, h: 18, d: 6 },
      { x: -6, z: 22, w: 7, h: 8, d: 7 },
      { x: 25, z: 18, w: 5, h: 12, d: 5 },
      { x: -25, z: -10, w: 4, h: 22, d: 6 },
      { x: 10, z: 22, w: 6, h: 15, d: 4 },
      { x: -15, z: -25, w: 8, h: 28, d: 5 },
    ]

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a1e,
      metalness: 0.8,
      roughness: 0.3,
    })

    for (const b of data) {
      const group = new THREE.Group()
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d)
      const mesh = new THREE.Mesh(geo, baseMat)
      mesh.position.y = b.h / 2 - 1
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)

      this.addWindows(group, b)
      this.addRooftopDetails(group, b)
      this.addEdgeStrips(group, b)

      group.position.set(b.x, 0, b.z)
      this.scene.add(group)
    }
  }

  addWindows(group, b) {
    const colors = [0x05d9e8, 0xff2a6d, 0x7b2ff7, 0x00ff9f]
    const rows = Math.floor(b.h / 2.2)
    const cols = Math.floor(b.w / 1.6)

    for (const face of ['front', 'back', 'left', 'right']) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (Math.random() > 0.55) continue
          const color = colors[Math.floor(Math.random() * colors.length)]
          const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.5,
          })
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), mat)
          const yPos = b.h / 2 - 1 - b.h / 2 + 1.5 + r * 2.2
          const offset = -b.w / 2 + 0.8 + c * 1.6

          if (face === 'front') {
            win.position.set(offset, yPos, b.d / 2 + 0.01)
          } else if (face === 'back') {
            win.position.set(offset, yPos, -b.d / 2 - 0.01)
            win.rotation.y = Math.PI
          } else if (face === 'left') {
            win.position.set(-b.w / 2 - 0.01, yPos, -b.d / 2 + 0.8 + c * 1.6)
            win.rotation.y = -Math.PI / 2
          } else {
            win.position.set(b.w / 2 + 0.01, yPos, -b.d / 2 + 0.8 + c * 1.6)
            win.rotation.y = Math.PI / 2
          }
          group.add(win)
        }
      }
    }
  }

  addRooftopDetails(group, b) {
    const topY = b.h - 1

    if (Math.random() > 0.4) {
      const antennaGeo = new THREE.CylinderGeometry(0.04, 0.04, 4, 6)
      const antennaMat = new THREE.MeshStandardMaterial({
        color: 0x333344,
        metalness: 0.9,
        roughness: 0.2,
      })
      const antenna = new THREE.Mesh(antennaGeo, antennaMat)
      antenna.position.set(
        (Math.random() - 0.5) * b.w * 0.6,
        topY + 2,
        (Math.random() - 0.5) * b.d * 0.6
      )
      group.add(antenna)

      const tipMat = new THREE.MeshBasicMaterial({
        color: 0xff2a6d,
        transparent: true,
        opacity: 0.8,
      })
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tipMat)
      tip.position.copy(antenna.position)
      tip.position.y += 2.1
      group.add(tip)
      this.floatingObjects.push({ mesh: tip, speed: 2 + Math.random() * 3, type: 'blink' })
    }

    if (Math.random() > 0.5) {
      const dishGeo = new THREE.SphereGeometry(0.5, 8, 8, 0, Math.PI)
      const dishMat = new THREE.MeshStandardMaterial({
        color: 0x222233,
        metalness: 0.9,
        roughness: 0.1,
      })
      const dish = new THREE.Mesh(dishGeo, dishMat)
      dish.position.set(
        (Math.random() - 0.5) * b.w * 0.4,
        topY + 0.5,
        (Math.random() - 0.5) * b.d * 0.4
      )
      dish.rotation.x = -0.3
      group.add(dish)
    }
  }

  addEdgeStrips(group, b) {
    const stripMat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0x05d9e8 : 0xff2a6d,
      transparent: true,
      opacity: 0.4,
    })

    const edges = [
      { pos: [-b.w / 2, b.h / 2 - 1, b.d / 2], h: b.h },
      { pos: [b.w / 2, b.h / 2 - 1, b.d / 2], h: b.h },
      { pos: [-b.w / 2, b.h / 2 - 1, -b.d / 2], h: b.h },
      { pos: [b.w / 2, b.h / 2 - 1, -b.d / 2], h: b.h },
    ]

    for (const edge of edges) {
      if (Math.random() > 0.6) continue
      const geo = new THREE.BoxGeometry(0.06, edge.h, 0.06)
      const strip = new THREE.Mesh(geo, stripMat.clone())
      strip.position.set(...edge.pos)
      group.add(strip)
    }
  }

  setupNeonTubes() {
    const tubes = [
      { points: [[-20, 3, -10], [-10, 5, -12], [0, 4, -8]], color: 0xff2a6d },
      { points: [[5, 6, -20], [10, 8, -15], [15, 5, -10]], color: 0x05d9e8 },
      { points: [[-15, 2, 5], [-8, 4, 8], [0, 3, 12]], color: 0x7b2ff7 },
      { points: [[10, 7, 5], [15, 5, 10], [20, 8, 15]], color: 0x00ff9f },
    ]

    for (const tube of tubes) {
      const curve = new THREE.CatmullRomCurve3(
        tube.points.map(p => new THREE.Vector3(...p))
      )
      const geo = new THREE.TubeGeometry(curve, 32, 0.04, 8, false)
      const mat = new THREE.MeshBasicMaterial({
        color: tube.color,
        transparent: true,
        opacity: 0.8,
      })
      const mesh = new THREE.Mesh(geo, mat)
      this.scene.add(mesh)

      const light = new THREE.PointLight(tube.color, 1, 15)
      const mid = curve.getPoint(0.5)
      light.position.copy(mid)
      this.scene.add(light)
    }
  }

  setupHolograms() {
    const hologramData = [
      { x: -2, z: -4, size: 2, color: 0x05d9e8 },
      { x: 6, z: 3, size: 1.5, color: 0x7b2ff7 },
      { x: -8, z: -2, size: 1.8, color: 0xff2a6d },
    ]

    for (const h of hologramData) {
      const group = new THREE.Group()

      const ringGeo = new THREE.TorusGeometry(h.size, 0.03, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: h.color,
        transparent: true,
        opacity: 0.4,
      })

      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(ringGeo, ringMat.clone())
        ring.position.y = 3 + i * 0.8
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3
        group.add(ring)
      }

      const coreGeo = new THREE.IcosahedronGeometry(h.size * 0.3, 1)
      const coreMat = new THREE.MeshBasicMaterial({
        color: h.color,
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      core.position.y = 3.8
      group.add(core)

      const light = new THREE.PointLight(h.color, 1.5, 10)
      light.position.y = 4
      group.add(light)

      group.position.set(h.x, 0, h.z)
      this.scene.add(group)
      this.holograms.push({ group, speed: 0.5 + Math.random() * 0.5, color: h.color })
    }
  }

  setupDrones() {
    const droneMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.2,
    })

    for (let i = 0; i < 5; i++) {
      const group = new THREE.Group()
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), droneMat)
      group.add(body)

      const eyeColor = [0xff2a6d, 0x05d9e8, 0x00ff9f][i % 3]
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({ color: eyeColor })
      )
      eye.position.set(0, -0.05, 0.25)
      group.add(eye)

      const droneLight = new THREE.PointLight(eyeColor, 0.5, 8)
      droneLight.position.copy(eye.position)
      group.add(droneLight)

      const angle = (i / 5) * Math.PI * 2
      const radius = 15 + Math.random() * 10
      group.position.set(
        Math.cos(angle) * radius,
        8 + Math.random() * 12,
        Math.sin(angle) * radius
      )

      this.scene.add(group)
      this.drones.push({
        mesh: group,
        angle: angle,
        radius: radius,
        height: group.position.y,
        speed: 0.1 + Math.random() * 0.2,
        bobSpeed: 1 + Math.random() * 2,
      })
    }
  }

  setupLightBeams() {
    const beamPositions = [
      { x: -15, z: -15, color: 0xff2a6d, h: 40 },
      { x: 15, z: -15, color: 0x05d9e8, h: 50 },
      { x: 0, z: -22, color: 0x7b2ff7, h: 60 },
      { x: 18, z: 10, color: 0xff2a6d, h: 45 },
      { x: -22, z: 0, color: 0x05d9e8, h: 35 },
    ]

    for (const beam of beamPositions) {
      const geo = new THREE.CylinderGeometry(0.1, 0.5, beam.h, 8, 1, true)
      const mat = new THREE.MeshBasicMaterial({
        color: beam.color,
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(beam.x, beam.h / 2, beam.z)
      this.scene.add(mesh)
      this.lightBeams.push({ mesh, baseOpacity: 0.04, speed: 0.5 + Math.random() })
    }
  }

  setupRain() {
    const count = 3000
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80
      positions[i * 3 + 1] = Math.random() * 50
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80
      velocities[i] = 12 + Math.random() * 8
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x05d9e8,
      size: 0.04,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })

    this.rain = new THREE.Points(geo, mat)
    this.rainVelocities = velocities
    this.scene.add(this.rain)
  }

  setupDataParticles() {
    const count = 400
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const palette = [
      new THREE.Color(0x05d9e8),
      new THREE.Color(0xff2a6d),
      new THREE.Color(0x7b2ff7),
      new THREE.Color(0x00ff9f),
    ]

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 30 + 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      sizes[i] = 0.05 + Math.random() * 0.15
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.dataParticles = new THREE.Points(geo, mat)
    this.scene.add(this.dataParticles)
  }

  setupElectricArcs() {
    for (let i = 0; i < 4; i++) {
      const points = []
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        2 + Math.random() * 8,
        (Math.random() - 0.5) * 30
      )
      for (let j = 0; j < 8; j++) {
        points.push(new THREE.Vector3(
          start.x + (Math.random() - 0.5) * 3,
          start.y + j * 0.5 + (Math.random() - 0.5) * 0.5,
          start.z + (Math.random() - 0.5) * 3
        ))
      }

      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.3,
      })
      const line = new THREE.Line(geo, mat)
      this.scene.add(line)
      this.electricArcs.push({ mesh: line, points, start, timer: Math.random() * 5 })
    }
  }

  setupFloatingDebris() {
    const geos = [
      new THREE.TetrahedronGeometry(0.15),
      new THREE.OctahedronGeometry(0.1),
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
    ]

    const mat = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x05d9e8,
      emissiveIntensity: 0.3,
    })

    for (let i = 0; i < 30; i++) {
      const geo = geos[Math.floor(Math.random() * geos.length)]
      const mesh = new THREE.Mesh(geo, mat.clone())
      mesh.material.emissive = new THREE.Color(
        [0x05d9e8, 0xff2a6d, 0x7b2ff7][Math.floor(Math.random() * 3)]
      )
      mesh.position.set(
        (Math.random() - 0.5) * 50,
        2 + Math.random() * 15,
        (Math.random() - 0.5) * 50
      )
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      this.scene.add(mesh)
      this.floatingObjects.push({
        mesh,
        speed: 0.3 + Math.random() * 0.8,
        rotSpeed: 0.5 + Math.random(),
        type: 'float',
        baseY: mesh.position.y,
      })
    }
  }

  setupSkybox() {
    const geo = new THREE.SphereGeometry(100, 32, 32)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x030308,
      side: THREE.BackSide,
    })
    this.scene.add(new THREE.Mesh(geo, mat))

    const starCount = 300
    const starPositions = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI * 0.4
      const r = 90
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = r * Math.cos(phi)
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.3,
      transparent: true,
      opacity: 0.4,
    })
    this.scene.add(new THREE.Points(starGeo, starMat))
  }

  update(delta) {
    this.time += delta

    if (this.rain) {
      const pos = this.rain.geometry.attributes.position.array
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] -= this.rainVelocities[i] * delta
        if (pos[i * 3 + 1] < -1) pos[i * 3 + 1] = 50
      }
      this.rain.geometry.attributes.position.needsUpdate = true
    }

    if (this.dataParticles) {
      const pos = this.dataParticles.geometry.attributes.position.array
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += Math.sin(this.time + i) * 0.01
        pos[i + 1] += Math.cos(this.time * 0.5 + i) * 0.008
        pos[i + 2] += Math.sin(this.time * 0.7 + i) * 0.01
      }
      this.dataParticles.geometry.attributes.position.needsUpdate = true
    }

    for (const h of this.holograms) {
      for (const child of h.group.children) {
        if (child.isMesh) {
          child.rotation.y += h.speed * delta
          child.rotation.z += h.speed * 0.3 * delta
        }
      }
      const pulse = 0.3 + Math.sin(this.time * 2) * 0.15
      h.group.children.forEach(c => {
        if (c.isMesh && c.material.opacity !== undefined) {
          c.material.opacity = pulse
        }
      })
    }

    for (const drone of this.drones) {
      drone.angle += drone.speed * delta
      drone.mesh.position.x = Math.cos(drone.angle) * drone.radius
      drone.mesh.position.z = Math.sin(drone.angle) * drone.radius
      drone.mesh.position.y = drone.height + Math.sin(this.time * drone.bobSpeed) * 0.5
      drone.mesh.rotation.y = -drone.angle + Math.PI / 2
    }

    for (const beam of this.lightBeams) {
      beam.mesh.material.opacity = beam.baseOpacity + Math.sin(this.time * beam.speed) * 0.02
    }

    for (const obj of this.floatingObjects) {
      if (obj.type === 'blink') {
        obj.mesh.material.opacity = Math.sin(this.time * obj.speed) > 0 ? 0.8 : 0.1
      } else if (obj.type === 'float') {
        obj.mesh.position.y = obj.baseY + Math.sin(this.time * obj.speed) * 0.5
        obj.mesh.rotation.x += obj.rotSpeed * delta
        obj.mesh.rotation.y += obj.rotSpeed * 0.7 * delta
      }
    }

    for (const arc of this.electricArcs) {
      arc.timer += delta
      if (arc.timer > 0.15) {
        arc.timer = 0
        const positions = arc.mesh.geometry.attributes.position.array
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] = arc.start.x + (Math.random() - 0.5) * 3
          positions[i + 1] = arc.start.y + (i / 3) * 0.5 + (Math.random() - 0.5) * 0.5
          positions[i + 2] = arc.start.z + (Math.random() - 0.5) * 3
        }
        arc.mesh.geometry.attributes.position.needsUpdate = true
        arc.mesh.material.opacity = 0.1 + Math.random() * 0.4
      }
    }

    if (this.groundGlow) {
      this.groundGlow.material.opacity = 0.015 + Math.sin(this.time * 0.5) * 0.005
    }
  }
}
