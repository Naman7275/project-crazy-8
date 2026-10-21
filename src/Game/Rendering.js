import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const CyberpunkShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    distortion: { value: 0.0 },
    scanlineIntensity: { value: 0.04 },
    vignetteIntensity: { value: 0.4 },
    chromaticAberration: { value: 0.002 },
    noiseIntensity: { value: 0.03 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float distortion;
    uniform float scanlineIntensity;
    uniform float vignetteIntensity;
    uniform float chromaticAberration;
    uniform float noiseIntensity;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;

      // heat distortion
      float dist = distortion * 0.003;
      uv.x += sin(uv.y * 30.0 + time * 2.0) * dist;
      uv.y += cos(uv.x * 20.0 + time * 1.5) * dist * 0.5;

      // chromatic aberration
      float ca = chromaticAberration + distortion * 0.003;
      float r = texture2D(tDiffuse, uv + vec2(ca, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(ca, 0.0)).b;
      vec3 color = vec3(r, g, b);

      // scanlines
      float scanline = sin(vUv.y * 800.0) * 0.5 + 0.5;
      color -= scanline * scanlineIntensity;

      // film grain
      float noise = random(vUv + fract(time)) * noiseIntensity;
      color += noise - noiseIntensity * 0.5;

      // vignette
      vec2 vigUv = vUv * (1.0 - vUv);
      float vig = vigUv.x * vigUv.y * 15.0;
      vig = pow(vig, vignetteIntensity);
      color *= vig;

      // subtle color grading — push shadows toward blue/purple
      color.b += (1.0 - vig) * 0.03;
      color.r += (1.0 - vig) * 0.01;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export class Rendering {
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x0a0a12, 0.012)
    this.scene.background = new THREE.Color(0x050510)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.0
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.canvas = this.renderer.domElement
    document.querySelector('.game').appendChild(this.canvas)

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    )
    this.camera.position.set(0, 12, 18)

    this.time = 0
    this.sprintDistortion = 0

    this.setupPostProcessing()
    this.setupResize()
  }

  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.2,
      0.5,
      0.75
    )
    this.composer.addPass(this.bloomPass)

    this.cyberpunkPass = new ShaderPass(CyberpunkShader)
    this.composer.addPass(this.cyberpunkPass)

    this.composer.addPass(new OutputPass())
  }

  setupResize() {
    window.addEventListener('resize', () => {
      const w = window.innerWidth
      const h = window.innerHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
      this.composer.setSize(w, h)
    })
  }

  setSprintDistortion(value) {
    this.sprintDistortion = value
  }

  update(delta) {
    this.time += delta || 0.016
    if (this.cyberpunkPass) {
      this.cyberpunkPass.uniforms.time.value = this.time
      this.cyberpunkPass.uniforms.distortion.value = this.sprintDistortion

      const targetCA = 0.002 + this.sprintDistortion * 0.004
      this.cyberpunkPass.uniforms.chromaticAberration.value +=
        (targetCA - this.cyberpunkPass.uniforms.chromaticAberration.value) * 0.1
    }
    this.composer.render()
  }
}
