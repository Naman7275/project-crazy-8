import * as THREE from 'three'
import { Game } from './Game.js'

const ZONE_DEFS = [
  {
    id: 'landing',
    label: 'ROOFTOP // HOME',
    position: { x: 0, y: 0, z: 0 },
    radius: 8,
    color: 0x05d9e8,
  },
  {
    id: 'projects',
    label: 'PROJECTS // TOWER',
    position: { x: -15, y: 0, z: -15 },
    radius: 6,
    color: 0xff2a6d,
  },
  {
    id: 'skills',
    label: 'SKILLS // ARCADE',
    position: { x: 12, y: 0, z: -12 },
    radius: 6,
    color: 0x05d9e8,
  },
  {
    id: 'about',
    label: 'ABOUT // ROOFTOP',
    position: { x: -10, y: 0, z: 10 },
    radius: 5,
    color: 0x7b2ff7,
  },
  {
    id: 'contact',
    label: 'CONTACT // SIGNAL',
    position: { x: 15, y: 0, z: 8 },
    radius: 5,
    color: 0xff2a6d,
  },
  {
    id: 'lab',
    label: 'LAB // EXPERIMENTS',
    position: { x: 0, y: 0, z: -18 },
    radius: 5,
    color: 0x7b2ff7,
  },
]

export class Zones {
  constructor() {
    this.game = Game.getInstance()
    this.scene = this.game.rendering.scene
    this.zones = []
    this.activeZone = null

    this.setupZones()
  }

  setupZones() {
    for (const def of ZONE_DEFS) {
      const zone = { ...def, mesh: null }

      const ringGeo = new THREE.RingGeometry(def.radius - 0.1, def.radius, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: def.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(def.position.x, 0.02, def.position.z)
      this.scene.add(ring)
      zone.mesh = ring

      const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 3, 8)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.6,
      })

      const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]
      for (const angle of angles) {
        const pillar = new THREE.Mesh(pillarGeo, pillarMat)
        pillar.position.set(
          def.position.x + Math.cos(angle) * def.radius,
          1.5,
          def.position.z + Math.sin(angle) * def.radius
        )
        this.scene.add(pillar)
      }

      this.zones.push(zone)
    }
  }

  update(delta) {
    const player = this.game.player
    if (!player) return

    const px = player.position.x
    const pz = player.position.z

    let newActive = null
    for (const zone of this.zones) {
      const dx = px - zone.position.x
      const dz = pz - zone.position.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < zone.radius) {
        newActive = zone
        break
      }
    }

    if (newActive !== this.activeZone) {
      if (this.activeZone) {
        this.onZoneExit(this.activeZone)
      }
      this.activeZone = newActive
      if (this.activeZone) {
        this.onZoneEnter(this.activeZone)
      }
    }

    for (const zone of this.zones) {
      if (zone.mesh) {
        const pulse = 0.2 + Math.sin(Date.now() * 0.003) * 0.1
        zone.mesh.material.opacity = zone === this.activeZone ? pulse + 0.3 : pulse
      }
    }
  }

  onZoneEnter(zone) {
    this.game.ui.updateLocation(zone.label)
    this.game.ui.showInteractHint(true)
  }

  onZoneExit(zone) {
    this.game.ui.updateLocation('NIGHT CITY // ROAMING')
    this.game.ui.showInteractHint(false)
    this.game.ui.hidePanel()
  }
}
