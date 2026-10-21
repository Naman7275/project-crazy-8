export class Ticker {
  constructor() {
    this.listeners = new Map()
    this.clock = { elapsed: 0, delta: 0, last: performance.now() }

    this.tick = this.tick.bind(this)
    requestAnimationFrame(this.tick)
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event).push(callback)
  }

  emit(event, ...args) {
    const cbs = this.listeners.get(event)
    if (cbs) for (const cb of cbs) cb(...args)
  }

  tick(now) {
    requestAnimationFrame(this.tick)

    const delta = Math.min((now - this.clock.last) / 1000, 0.1)
    this.clock.last = now
    this.clock.delta = delta
    this.clock.elapsed += delta

    this.emit('tick', delta)
  }
}
