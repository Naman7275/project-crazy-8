import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const CinemaShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    distortion: { value: 0.0 },
    chromaticAberration: { value: 0.0012 },
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
    uniform float chromaticAberration;
    varying vec2 vUv;

    float hash(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      vec2 uv = vUv;

      // subtle barrel distortion (cinematic lens feel)
      vec2 centered = uv - 0.5;
      float r2 = dot(centered, centered);
      uv = uv + centered * r2 * 0.02;

      // sprint heat distortion
      float dist = distortion * 0.002;
      uv.x += sin(uv.y * 25.0 + time * 1.8) * dist;
      uv.y += cos(uv.x * 18.0 + time * 1.3) * dist * 0.4;

      // chromatic aberration — stronger at edges (like real lens)
      float ca = chromaticAberration + distortion * 0.003 + r2 * 0.002;
      vec2 caDir = normalize(centered + 0.001) * ca;
      float r = texture2D(tDiffuse, uv + caDir).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - caDir).b;
      vec3 color = vec3(r, g, b);

      // cinematic color grading — lift/gamma/gain style
      // shadows: push blue/purple
      vec3 shadows = vec3(0.02, 0.01, 0.06);
      // midtones: slight desaturation with teal tint
      vec3 midtones = vec3(0.98, 0.97, 1.02);
      // highlights: warm cyan push
      vec3 highlights = vec3(1.0, 1.01, 1.04);

      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float shadowWeight = 1.0 - smoothstep(0.0, 0.35, luma);
      float highlightWeight = smoothstep(0.6, 1.0, luma);
      float midWeight = 1.0 - shadowWeight - highlightWeight;

      color = color + shadows * shadowWeight;
      color = color * mix(vec3(1.0), midtones, midWeight);
      color = color * mix(vec3(1.0), highlights, highlightWeight);

      // subtle film grain — responsive to luminance
      float grain = hash(vUv * 500.0 + fract(time * 7.0)) * 0.04 - 0.02;
      color += grain * (0.5 + 0.5 * (1.0 - luma));

      // thin scanlines — barely visible, like a CRT reference monitor
      float scanline = 1.0 - sin(vUv.y * 900.0) * 0.015;
      color *= scanline;

      // cinematic vignette — softer falloff than before
      float vig = 1.0 - r2 * 1.2;
      vig = clamp(vig, 0.0, 1.0);
      vig = pow(vig, 0.6);
      color *= vig;

      // anamorphic lens streak hint (horizontal bloom bias)
      vec3 streak = texture2D(tDiffuse, vec2(uv.x, 0.5)).rgb * 0.015;
      color += streak * (1.0 - vig) * vec3(0.3, 0.5, 1.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export class Rendering {
  constructor() {
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x080818, 0.008)
    this.scene.background = new THREE.Color(0x030308)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.85
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.canvas = this.renderer.domElement
    document.querySelector('.game').appendChild(this.canvas)

    this.camera = new THREE.PerspectiveCamera(
      60,
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
      0.8,
      0.6,
      0.85
    )
    this.composer.addPass(this.bloomPass)

    this.cinemaPass = new ShaderPass(CinemaShader)
    this.composer.addPass(this.cinemaPass)

    this.fxaaPass = new ShaderPass(FXAAShader)
    const pixelRatio = this.renderer.getPixelRatio()
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / (window.innerWidth * pixelRatio),
      1 / (window.innerHeight * pixelRatio)
    )
    this.composer.addPass(this.fxaaPass)

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

      const pr = this.renderer.getPixelRatio()
      if (this.fxaaPass) {
        this.fxaaPass.material.uniforms['resolution'].value.set(1 / (w * pr), 1 / (h * pr))
      }
    })
  }

  setSprintDistortion(value) {
    this.sprintDistortion = value
  }

  update(delta) {
    this.time += delta || 0.016

    if (this.cinemaPass) {
      this.cinemaPass.uniforms.time.value = this.time
      const targetDist = this.sprintDistortion
      this.cinemaPass.uniforms.distortion.value +=
        (targetDist - this.cinemaPass.uniforms.distortion.value) * 0.08
      const targetCA = 0.0012 + this.sprintDistortion * 0.003
      this.cinemaPass.uniforms.chromaticAberration.value +=
        (targetCA - this.cinemaPass.uniforms.chromaticAberration.value) * 0.08
    }

    this.composer.render()
  }
}
