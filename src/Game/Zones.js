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
    position: { x: -18, y: 0, z: -18 },
    radius: 6,
    color: 0xff2a6d,
  },
  {
    id: 'skills',
    label: 'SKILLS // ARCADE',
    position: { x: 15, y: 0, z: -15 },
    radius: 6,
    color: 0x05d9e8,
  },
  {
    id: 'about',
    label: 'ABOUT // ROOFTOP',
    position: { x: -12, y: 0, z: 14 },
    radius: 5,
    color: 0x7b2ff7,
  },
  {
    id: 'contact',
    label: 'CONTACT // SIGNAL',
    position: { x: 18, y: 0, z: 10 },
    radius: 5,
    color: 0xff2a6d,
  },
  {
    id: 'lab',
    label: 'LAB // EXPERIMENTS',
    position: { x: 0, y: 0, z: -22 },
    radius: 5,
    color: 0x00ff9f,
  },
]

export class Zones {
  constructor() {
    this.game = Game.getInstance()
    this.scene = this.game.rendering.scene
    this.zones = []
    this.activeZone = null
    this.time = 0

    this.setupZones()
  }

  setupZones() {
    for (const def of ZONE_DEFS) {
      const zone = { ...def, meshes: [] }

      const outerRing = new THREE.Mesh(
        new THREE.RingGeometry(def.radius - 0.08, def.radius, 64),
        new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
        })
      )
      outerRing.rotation.x = -Math.PI / 2
      outerRing.position.set(def.position.x, 0.02, def.position.z)
      this.scene.add(outerRing)
      zone.meshes.push(outerRing)

      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(def.radius * 0.6 - 0.05, def.radius * 0.6, 64),
        new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.1,
          side: THREE.DoubleSide,
        })
      )
      innerRing.rotation.x = -Math.PI / 2
      innerRing.position.set(def.position.x, 0.02, def.position.z)
      this.scene.add(innerRing)
      zone.meshes.push(innerRing)

      const segCount = 6
      for (let i = 0; i < segCount; i++) {
        const angle = (i / segCount) * Math.PI * 2
        const pillarH = 2.5 + Math.random()
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, pillarH, 6),
          new THREE.MeshBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.5,
          })
        )
        pillar.position.set(
          def.position.x + Math.cos(angle) * def.radius,
          pillarH / 2,
          def.position.z + Math.sin(angle) * def.radius
        )
        this.scene.add(pillar)
        zone.meshes.push(pillar)

        const tipGeo = new THREE.SphereGeometry(0.08, 6, 6)
        const tipMat = new THREE.MeshBasicMaterial({
          color: def.color,
          transparent: true,
          opacity: 0.8,
        })
        const tip = new THREE.Mesh(tipGeo, tipMat)
        tip.position.copy(pillar.position)
        tip.position.y = pillarH
        this.scene.add(tip)
        zone.meshes.push(tip)
      }

      const zoneLight = new THREE.PointLight(def.color, 0.5, def.radius * 1.5)
      zoneLight.position.set(def.position.x, 1, def.position.z)
      this.scene.add(zoneLight)
      zone.light = zoneLight

      this.zones.push(zone)
    }
  }

  update(delta) {
    this.time += delta
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
      if (this.activeZone) this.onZoneExit(this.activeZone)
      this.activeZone = newActive
      if (this.activeZone) this.onZoneEnter(this.activeZone)
    }

    for (const zone of this.zones) {
      const isActive = zone === this.activeZone
      const basePulse = 0.15 + Math.sin(this.time * 2.5) * 0.08

      if (zone.meshes[0]) {
        zone.meshes[0].material.opacity = isActive ? basePulse + 0.3 : basePulse
      }
      if (zone.meshes[1]) {
        zone.meshes[1].rotation.z += delta * (isActive ? 0.5 : 0.1)
        zone.meshes[1].material.opacity = isActive ? 0.2 : 0.05
      }

      if (zone.light) {
        zone.light.intensity = isActive ? 1.5 : 0.3
      }
    }
  }

  onZoneEnter(zone) {
    this.game.ui.updateLocation(zone.label)
    this.game.ui.showInteractHint(true)
    this.game.view?.shake(0.15)
    this.game.ui.triggerChromaticFlash()
  }

  onZoneExit(zone) {
    this.game.ui.updateLocation('NIGHT CITY // ROAMING')
    this.game.ui.showInteractHint(false)
    this.game.ui.hidePanel()
  }
}
