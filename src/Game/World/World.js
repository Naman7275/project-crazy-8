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
    this.billboards = []
    this.skyStructures = []
    this.powerLines = []

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
    this.setupDistantCity()
    this.setupFlyingTraffic()
    this.setupBillboards()
    this.setupSkyStructures()
    this.setupGroundFog()
    this.setupPowerLines()
    this.setupGodRays()
    this.setupEnergyFields()
    this.setupHoloBeams()
    this.setupEmbers()
    this.setupLightning()
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

  setupDistantCity() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x060612,
      transparent: true,
      opacity: 0.8,
    })

    const windowColors = [0x05d9e8, 0xff2a6d, 0x7b2ff7]

    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2
      const dist = 50 + Math.random() * 30
      const w = 3 + Math.random() * 6
      const h = 15 + Math.random() * 45
      const d = 3 + Math.random() * 5

      const geo = new THREE.BoxGeometry(w, h, d)
      const building = new THREE.Mesh(geo, mat)
      building.position.set(
        Math.cos(angle) * dist,
        h / 2 - 5,
        Math.sin(angle) * dist
      )
      building.rotation.y = Math.random() * Math.PI
      this.scene.add(building)

      const winCount = Math.floor(Math.random() * 15) + 5
      for (let j = 0; j < winCount; j++) {
        const winMat = new THREE.MeshBasicMaterial({
          color: windowColors[Math.floor(Math.random() * 3)],
          transparent: true,
          opacity: 0.2 + Math.random() * 0.3,
        })
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat)
        const wy = -h / 2 + 2 + Math.random() * (h - 4)
        win.position.set(
          building.position.x + (Math.random() - 0.5) * w * 0.8,
          building.position.y + wy,
          building.position.z + d / 2 + 0.01
        )
        win.rotation.y = building.rotation.y
        this.scene.add(win)
      }
    }
  }

  setupFlyingTraffic() {
    this.flyingCars = []
    const colors = [0xff2a6d, 0x05d9e8, 0x7b2ff7, 0x00ff9f, 0xf9f002]

    for (let i = 0; i < 8; i++) {
      const group = new THREE.Group()

      const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.2, 1.2),
        new THREE.MeshBasicMaterial({
          color: 0x0a0a1e,
          transparent: true,
          opacity: 0.6,
        })
      )
      group.add(carBody)

      const trailColor = colors[i % colors.length]
      const tail = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.04, 0.6),
        new THREE.MeshBasicMaterial({
          color: trailColor,
          transparent: true,
          opacity: 0.5,
        })
      )
      tail.position.set(0, 0, -0.8)
      group.add(tail)

      const light = new THREE.PointLight(trailColor, 0.5, 8)
      light.position.set(0, 0, -0.5)
      group.add(light)

      const lane = 20 + Math.random() * 40
      const height = 15 + Math.random() * 25
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 8
      const direction = Math.random() > 0.5 ? 1 : -1

      group.position.set(
        Math.cos(angle) * lane,
        height,
        Math.sin(angle) * lane
      )

      this.scene.add(group)
      this.flyingCars.push({
        mesh: group,
        angle,
        lane,
        height,
        speed: speed * direction,
        bobSpeed: 0.5 + Math.random(),
      })
    }
  }

  setupBillboards() {
    const billboardData = [
      { x: -18, y: 12, z: -21, w: 5, h: 3, rot: 0.3, color: 0x05d9e8, text: 'SYSTEM//ONLINE' },
      { x: 16, y: 18, z: -18, w: 6, h: 3.5, rot: -0.5, color: 0xff2a6d, text: 'NIGHT_CITY' },
      { x: -24, y: 8, z: 3, w: 4, h: 2.5, rot: 1.2, color: 0x7b2ff7, text: 'NANOSPHERE' },
      { x: 20, y: 15, z: 13, w: 5, h: 3, rot: -1.0, color: 0x00ff9f, text: 'EXPLORE' },
      { x: 0, y: 25, z: -25, w: 8, h: 4, rot: 0, color: 0x05d9e8, text: 'WELCOME' },
      { x: -22, y: 18, z: -12, w: 4, h: 2.5, rot: 0.8, color: 0xff2a6d, text: 'PROJECTS' },
    ]

    for (const bb of billboardData) {
      const group = new THREE.Group()

      // screen frame
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0x111122,
        metalness: 0.9,
        roughness: 0.1,
      })
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(bb.w + 0.3, bb.h + 0.3, 0.1),
        frameMat
      )
      group.add(frame)

      // glowing screen
      const screenMat = new THREE.MeshBasicMaterial({
        color: bb.color,
        transparent: true,
        opacity: 0.15,
      })
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(bb.w, bb.h),
        screenMat
      )
      screen.position.z = 0.06
      group.add(screen)

      // scanline on screen
      const scanline = new THREE.Mesh(
        new THREE.PlaneGeometry(bb.w, 0.05),
        new THREE.MeshBasicMaterial({
          color: bb.color,
          transparent: true,
          opacity: 0.6,
        })
      )
      scanline.position.z = 0.07
      group.add(scanline)

      // border glow strips
      const borderMat = new THREE.MeshBasicMaterial({
        color: bb.color,
        transparent: true,
        opacity: 0.5,
      })
      const topBorder = new THREE.Mesh(new THREE.BoxGeometry(bb.w, 0.05, 0.05), borderMat)
      topBorder.position.set(0, bb.h / 2, 0.06)
      group.add(topBorder)
      const botBorder = topBorder.clone()
      botBorder.position.y = -bb.h / 2
      group.add(botBorder)
      const leftBorder = new THREE.Mesh(new THREE.BoxGeometry(0.05, bb.h, 0.05), borderMat)
      leftBorder.position.set(-bb.w / 2, 0, 0.06)
      group.add(leftBorder)
      const rightBorder = leftBorder.clone()
      rightBorder.position.x = bb.w / 2
      group.add(rightBorder)

      // light cast
      const light = new THREE.PointLight(bb.color, 1.5, 12)
      light.position.z = 2
      group.add(light)

      group.position.set(bb.x, bb.y, bb.z)
      group.rotation.y = bb.rot
      this.scene.add(group)
      this.billboards.push({
        group,
        scanline,
        screen,
        height: bb.h,
        speed: 0.8 + Math.random() * 1.5,
        flickerTimer: Math.random() * 10,
      })
    }
  }

  setupSkyStructures() {
    // massive rotating geometric structures in the sky
    const structures = [
      { x: 0, y: 45, z: -30, geo: 'icosa', size: 8, color: 0x05d9e8, speed: 0.15 },
      { x: -35, y: 55, z: 20, geo: 'octa', size: 6, color: 0xff2a6d, speed: 0.2 },
      { x: 30, y: 50, z: -15, geo: 'torus', size: 7, color: 0x7b2ff7, speed: 0.1 },
      { x: -15, y: 60, z: -40, geo: 'dodeca', size: 5, color: 0x00ff9f, speed: 0.18 },
    ]

    for (const s of structures) {
      const group = new THREE.Group()

      let geo
      if (s.geo === 'icosa') geo = new THREE.IcosahedronGeometry(s.size, 1)
      else if (s.geo === 'octa') geo = new THREE.OctahedronGeometry(s.size, 1)
      else if (s.geo === 'torus') geo = new THREE.TorusGeometry(s.size, s.size * 0.15, 8, 32)
      else geo = new THREE.DodecahedronGeometry(s.size, 0)

      // wireframe outer
      const wireMat = new THREE.MeshBasicMaterial({
        color: s.color,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      })
      const wire = new THREE.Mesh(geo, wireMat)
      group.add(wire)

      // solid inner (smaller)
      let innerGeo
      if (s.geo === 'torus') innerGeo = new THREE.TorusGeometry(s.size * 0.6, s.size * 0.08, 8, 32)
      else innerGeo = geo.clone().scale(0.5, 0.5, 0.5)

      const innerMat = new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
      })
      const inner = new THREE.Mesh(innerGeo || geo, innerMat)
      group.add(inner)

      // orbiting ring
      const ringGeo = new THREE.TorusGeometry(s.size * 1.3, 0.03, 8, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: s.color,
        transparent: true,
        opacity: 0.2,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = Math.PI / 3
      group.add(ring)

      // second ring at different angle
      const ring2 = new THREE.Mesh(ringGeo.clone(), ringMat.clone())
      ring2.rotation.x = -Math.PI / 4
      ring2.rotation.z = Math.PI / 5
      group.add(ring2)

      // glow
      const light = new THREE.PointLight(s.color, 2, 30)
      group.add(light)

      group.position.set(s.x, s.y, s.z)
      this.scene.add(group)
      this.skyStructures.push({ group, speed: s.speed, rotAxis: Math.random() * Math.PI })
    }
  }

  setupGroundFog() {
    // layered translucent planes for volumetric fog look
    const fogLayers = 5
    for (let i = 0; i < fogLayers; i++) {
      const fogGeo = new THREE.PlaneGeometry(80, 80)
      const fogMat = new THREE.MeshBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.008,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const fog = new THREE.Mesh(fogGeo, fogMat)
      fog.rotation.x = -Math.PI / 2
      fog.position.y = 0.1 + i * 0.15
      this.scene.add(fog)
    }

    // low-lying fog particles
    const fogCount = 200
    const fogPositions = new Float32Array(fogCount * 3)
    for (let i = 0; i < fogCount; i++) {
      fogPositions[i * 3] = (Math.random() - 0.5) * 60
      fogPositions[i * 3 + 1] = 0.2 + Math.random() * 1.5
      fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    const fogParticleGeo = new THREE.BufferGeometry()
    fogParticleGeo.setAttribute('position', new THREE.BufferAttribute(fogPositions, 3))
    const fogParticleMat = new THREE.PointsMaterial({
      color: 0x05d9e8,
      size: 1.5,
      transparent: true,
      opacity: 0.04,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.fogParticles = new THREE.Points(fogParticleGeo, fogParticleMat)
    this.scene.add(this.fogParticles)
  }

  setupPowerLines() {
    const connections = [
      { from: [-18, 14, -18], to: [0, 28, -22] },
      { from: [0, 28, -22], to: [15, 22, -15] },
      { from: [-22, 12, 0], to: [-12, 8, 14] },
      { from: [15, 22, -15], to: [22, 16, -4] },
      { from: [18, 18, 10], to: [10, 13, 22] },
      { from: [-18, 14, -18], to: [-22, 12, 0] },
    ]

    for (const conn of connections) {
      const start = new THREE.Vector3(...conn.from)
      const end = new THREE.Vector3(...conn.to)
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      mid.y -= 2 // sag

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      const points = curve.getPoints(30)

      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.15,
      })
      const line = new THREE.Line(geo, mat)
      this.scene.add(line)

      // spark traveling along wire
      const sparkMat = new THREE.MeshBasicMaterial({
        color: 0x05d9e8,
        transparent: true,
        opacity: 0.8,
      })
      const spark = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), sparkMat)
      this.scene.add(spark)

      this.powerLines.push({
        curve,
        spark,
        t: Math.random(),
        speed: 0.2 + Math.random() * 0.3,
        line,
      })
    }
  }

  setupGodRays() {
    this.godRays = []
    const rayData = [
      { x: -20, z: -20, h: 40, w: 3, color: 0x05d9e8, opacity: 0.015 },
      { x: 15, z: -15, h: 50, w: 4, color: 0xff2a6d, opacity: 0.012 },
      { x: -12, z: 14, h: 35, w: 2.5, color: 0x7b2ff7, opacity: 0.018 },
      { x: 18, z: 10, h: 45, w: 3.5, color: 0xff2a6d, opacity: 0.01 },
      { x: 0, z: -22, h: 55, w: 5, color: 0x00ff9f, opacity: 0.008 },
      { x: -25, z: 5, h: 38, w: 2, color: 0x05d9e8, opacity: 0.014 },
      { x: 22, z: -8, h: 42, w: 3, color: 0x7b2ff7, opacity: 0.011 },
    ]

    for (const r of rayData) {
      const geo = new THREE.CylinderGeometry(r.w * 0.3, r.w, r.h, 6, 1, true)
      const mat = new THREE.MeshBasicMaterial({
        color: r.color,
        transparent: true,
        opacity: r.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(r.x, r.h / 2, r.z)
      this.scene.add(mesh)
      this.godRays.push({
        mesh,
        baseOpacity: r.opacity,
        speed: 0.5 + Math.random(),
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  setupEnergyFields() {
    this.energyFields = []
    const fieldData = [
      { x: 0, y: 2, z: 0, size: 10, color: 0x05d9e8 },
      { x: -18, y: 3, z: -18, size: 8, color: 0xff2a6d },
      { x: 15, y: 3, z: -15, size: 7, color: 0x05d9e8 },
    ]

    for (const f of fieldData) {
      const geo = new THREE.IcosahedronGeometry(f.size, 2)
      const mat = new THREE.MeshBasicMaterial({
        color: f.color,
        wireframe: true,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(f.x, f.y, f.z)
      this.scene.add(mesh)
      this.energyFields.push({
        mesh,
        speed: 0.1 + Math.random() * 0.15,
        pulse: 0.8 + Math.random() * 0.5,
        baseScale: 1,
      })
    }
  }

  setupHoloBeams() {
    this.holoBeams = []
    const beamPositions = [
      { x: -18, z: -18, color: 0xff2a6d },
      { x: 15, z: -15, color: 0x05d9e8 },
      { x: -12, z: 14, color: 0x7b2ff7 },
      { x: 18, z: 10, color: 0xff2a6d },
      { x: 0, z: -22, color: 0x00ff9f },
    ]

    for (const b of beamPositions) {
      const geo = new THREE.CylinderGeometry(0.3, 1.5, 30, 8, 1, true)
      const mat = new THREE.MeshBasicMaterial({
        color: b.color,
        transparent: true,
        opacity: 0.02,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(b.x, 15, b.z)
      this.scene.add(mesh)
      this.holoBeams.push({
        mesh,
        baseOpacity: 0.02,
        speed: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  setupEmbers() {
    const count = 300
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const neonColors = [
      [1, 0.16, 0.43], // pink
      [0.02, 0.85, 0.91], // cyan
      [0.48, 0.18, 0.97], // purple
      [0, 1, 0.62], // green
      [0.98, 0.94, 0.01], // yellow
    ]

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
      const c = neonColors[Math.floor(Math.random() * neonColors.length)]
      colors[i * 3] = c[0]
      colors[i * 3 + 1] = c[1]
      colors[i * 3 + 2] = c[2]
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      transparent: true,
      opacity: 0.6,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.embers = new THREE.Points(geo, mat)
    this.scene.add(this.embers)
  }

  setupLightning() {
    this.lightningTimer = 5 + Math.random() * 5
    this.lightningFlash = new THREE.PointLight(0x7b2ff7, 0, 200)
    this.lightningFlash.position.set(0, 60, -20)
    this.scene.add(this.lightningFlash)

    // secondary flash for atmosphere
    this.lightningFlash2 = new THREE.PointLight(0x05d9e8, 0, 150)
    this.lightningFlash2.position.set(-30, 50, 10)
    this.scene.add(this.lightningFlash2)
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

    for (const car of this.flyingCars) {
      car.angle += (car.speed / car.lane) * delta
      car.mesh.position.x = Math.cos(car.angle) * car.lane
      car.mesh.position.z = Math.sin(car.angle) * car.lane
      car.mesh.position.y = car.height + Math.sin(this.time * car.bobSpeed) * 0.3
      car.mesh.rotation.y = -car.angle + Math.PI / 2
    }

    // billboard scanline + flicker
    for (const bb of this.billboards) {
      bb.flickerTimer += delta
      const scanY = ((this.time * bb.speed) % 1) * bb.height - bb.height / 2
      bb.scanline.position.y = scanY

      if (Math.sin(bb.flickerTimer * 12) > 0.92) {
        bb.screen.material.opacity = 0.02
        bb.scanline.material.opacity = 0.1
      } else {
        bb.screen.material.opacity = 0.15 + Math.sin(this.time * 1.5) * 0.03
        bb.scanline.material.opacity = 0.6
      }
    }

    // sky structures rotation
    for (const s of this.skyStructures) {
      s.group.rotation.y += s.speed * delta
      s.group.rotation.x = Math.sin(this.time * 0.3 + s.rotAxis) * 0.2
      s.group.children.forEach((child, i) => {
        if (child.isMesh && i > 0) child.rotation.z += s.speed * 0.5 * delta
      })
      s.group.position.y += Math.sin(this.time * 0.2 + s.rotAxis) * 0.003
    }

    // ground fog drift
    if (this.fogParticles) {
      const fpos = this.fogParticles.geometry.attributes.position.array
      for (let i = 0; i < fpos.length; i += 3) {
        fpos[i] += Math.sin(this.time * 0.3 + i) * 0.005
        fpos[i + 2] += Math.cos(this.time * 0.2 + i) * 0.005
      }
      this.fogParticles.geometry.attributes.position.needsUpdate = true
    }

    // power line sparks
    for (const pl of this.powerLines) {
      pl.t += pl.speed * delta
      if (pl.t > 1) pl.t -= 1
      const point = pl.curve.getPoint(pl.t)
      pl.spark.position.copy(point)
      pl.spark.material.opacity = 0.5 + Math.random() * 0.5
      pl.line.material.opacity = 0.1 + Math.sin(this.time * 3) * 0.05
    }

    // volumetric light shafts
    if (this.godRays) {
      for (const ray of this.godRays) {
        ray.mesh.material.opacity = ray.baseOpacity + Math.sin(this.time * ray.speed + ray.phase) * ray.baseOpacity * 0.4
        ray.mesh.rotation.y += delta * 0.02
      }
    }

    // energy field pulse
    if (this.energyFields) {
      for (const ef of this.energyFields) {
        ef.mesh.rotation.y += ef.speed * delta
        ef.mesh.rotation.x += ef.speed * 0.3 * delta
        ef.mesh.material.opacity = 0.03 + Math.sin(this.time * ef.pulse) * 0.015
        ef.mesh.scale.setScalar(ef.baseScale + Math.sin(this.time * ef.pulse * 0.5) * 0.3)
      }
    }

    // holographic pillars of light
    if (this.holoBeams) {
      for (const hb of this.holoBeams) {
        hb.mesh.material.opacity = hb.baseOpacity + Math.sin(this.time * hb.speed + hb.phase) * 0.02
        hb.mesh.scale.x = 1 + Math.sin(this.time * 2 + hb.phase) * 0.15
        hb.mesh.scale.z = 1 + Math.cos(this.time * 2 + hb.phase) * 0.15
      }
    }

    // ember / spark particles
    if (this.embers) {
      const epos = this.embers.geometry.attributes.position.array
      for (let i = 0; i < epos.length; i += 3) {
        epos[i + 1] += (0.8 + Math.sin(i) * 0.5) * delta
        epos[i] += Math.sin(this.time + i * 0.1) * 0.02
        if (epos[i + 1] > 20) epos[i + 1] = 0.5
      }
      this.embers.geometry.attributes.position.needsUpdate = true
    }

    // lightning flashes
    if (this.lightningTimer !== undefined) {
      this.lightningTimer -= delta
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 3 + Math.random() * 8
        if (this.lightningFlash) {
          this.lightningFlash.intensity = 8 + Math.random() * 12
          setTimeout(() => {
            if (this.lightningFlash) this.lightningFlash.intensity = 0
          }, 80 + Math.random() * 120)
        }
      }
    }
  }
}
