import * as THREE from 'three'
import { Game } from '../Game.js'

export class World {
  constructor() {
    this.game = Game.getInstance()
    this.scene = this.game.rendering.scene
    this.rapier = this.game.rapier
    this.physicsWorld = null

    this.setupPhysics()
    this.setupLighting()
    this.setupGround()
    this.setupRooftops()
    this.setupNeonSigns()
    this.setupRain()
    this.setupSkybox()
  }

  setupPhysics() {
    if (!this.rapier) return
    const gravity = { x: 0, y: -25, z: 0 }
    this.physicsWorld = new this.rapier.World(gravity)
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0x0a0a12, 0.3)
    this.scene.add(ambient)

    const mainLight = new THREE.DirectionalLight(0x7b2ff7, 0.4)
    mainLight.position.set(-10, 20, 10)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.set(2048, 2048)
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 100
    mainLight.shadow.camera.left = -30
    mainLight.shadow.camera.right = 30
    mainLight.shadow.camera.top = 30
    mainLight.shadow.camera.bottom = -30
    this.scene.add(mainLight)

    const neonPink = new THREE.PointLight(0xff2a6d, 2, 30)
    neonPink.position.set(5, 8, -5)
    this.scene.add(neonPink)

    const neonCyan = new THREE.PointLight(0x05d9e8, 2, 30)
    neonCyan.position.set(-8, 6, 3)
    this.scene.add(neonCyan)

    const neonPurple = new THREE.PointLight(0x7b2ff7, 1.5, 25)
    neonPurple.position.set(0, 10, -10)
    this.scene.add(neonPurple)
  }

  setupGround() {
    const geo = new THREE.BoxGeometry(40, 1, 40)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      metalness: 0.9,
      roughness: 0.2,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.position.y = -0.5
    ground.receiveShadow = true
    this.scene.add(ground)

    if (this.physicsWorld) {
      const bodyDesc = this.rapier.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0)
      const body = this.physicsWorld.createRigidBody(bodyDesc)
      const colliderDesc = this.rapier.ColliderDesc.cuboid(20, 0.5, 20)
      this.physicsWorld.createCollider(colliderDesc, body)
    }

    this.setupGridLines()
  }

  setupGridLines() {
    const gridMat = new THREE.LineBasicMaterial({ color: 0x05d9e8, transparent: true, opacity: 0.15 })
    for (let i = -20; i <= 20; i += 2) {
      const points1 = [new THREE.Vector3(i, 0.01, -20), new THREE.Vector3(i, 0.01, 20)]
      const line1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points1), gridMat)
      this.scene.add(line1)

      const points2 = [new THREE.Vector3(-20, 0.01, i), new THREE.Vector3(20, 0.01, i)]
      const line2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points2), gridMat)
      this.scene.add(line2)
    }
  }

  setupRooftops() {
    this.buildings = []
    const buildingData = [
      { x: -15, z: -15, w: 6, h: 12, d: 6 },
      { x: 12, z: -12, w: 8, h: 18, d: 5 },
      { x: -10, z: 10, w: 5, h: 8, d: 7 },
      { x: 15, z: 8, w: 7, h: 15, d: 6 },
      { x: 0, z: -18, w: 10, h: 22, d: 4 },
      { x: -18, z: 0, w: 4, h: 10, d: 8 },
      { x: 18, z: -3, w: 5, h: 14, d: 5 },
      { x: -5, z: 18, w: 6, h: 6, d: 6 },
    ]

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      metalness: 0.7,
      roughness: 0.4,
    })

    for (const b of buildingData) {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d)
      const mesh = new THREE.Mesh(geo, buildingMat)
      mesh.position.set(b.x, b.h / 2 - 2, b.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      this.scene.add(mesh)
      this.buildings.push(mesh)

      this.addWindowLights(mesh, b)
    }
  }

  addWindowLights(building, data) {
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x05d9e8,
      emissive: 0x05d9e8,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.6,
    })

    const rows = Math.floor(data.h / 2)
    const cols = Math.floor(data.w / 1.5)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.6) continue
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(0.6, 0.8),
          Math.random() > 0.5
            ? windowMat
            : windowMat.clone()
        )
        if (win.material !== windowMat) {
          win.material.color.set(0xff2a6d)
          win.material.emissive.set(0xff2a6d)
        }
        const yPos = building.position.y - data.h / 2 + 1.5 + r * 2
        const xOffset = -data.w / 2 + 1 + c * 1.5
        win.position.set(
          building.position.x + xOffset,
          yPos,
          building.position.z + data.d / 2 + 0.01
        )
        this.scene.add(win)
      }
    }
  }

  setupNeonSigns() {
    const signs = [
      { text: 'PROJECTS', x: -15, y: 11, z: -11.5, color: 0xff2a6d },
      { text: 'SKILLS', x: 12, y: 17, z: -9, color: 0x05d9e8 },
      { text: 'ABOUT', x: -10, y: 7, z: 14, color: 0x7b2ff7 },
      { text: 'CONTACT', x: 15, y: 14, z: 11.5, color: 0xff2a6d },
    ]

    for (const sign of signs) {
      const light = new THREE.PointLight(sign.color, 1.5, 10)
      light.position.set(sign.x, sign.y, sign.z)
      this.scene.add(light)

      const barGeo = new THREE.BoxGeometry(3, 0.3, 0.1)
      const barMat = new THREE.MeshStandardMaterial({
        color: sign.color,
        emissive: sign.color,
        emissiveIntensity: 3,
      })
      const bar = new THREE.Mesh(barGeo, barMat)
      bar.position.set(sign.x, sign.y, sign.z)
      this.scene.add(bar)
    }
  }

  setupRain() {
    const count = 3000
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60
      positions[i * 3 + 1] = Math.random() * 40
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      color: 0x05d9e8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    })

    this.rain = new THREE.Points(geo, mat)
    this.scene.add(this.rain)
  }

  setupSkybox() {
    const geo = new THREE.SphereGeometry(80, 32, 32)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x050510,
      side: THREE.BackSide,
    })
    const sky = new THREE.Mesh(geo, mat)
    this.scene.add(sky)
  }

  update(delta) {
    if (this.rain) {
      const positions = this.rain.geometry.attributes.position.array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] -= 15 * delta
        if (positions[i + 1] < -2) {
          positions[i + 1] = 40
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true
    }
  }
}
