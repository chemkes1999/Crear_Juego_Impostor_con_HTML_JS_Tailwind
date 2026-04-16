type SfxName = "victory" | "impostorWin" | "death"

let audioContext: AudioContext | null = null
let master: GainNode | null = null
let unlocked = false

function getAudio() {
  if (typeof window === "undefined") return null
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null

  if (!audioContext) {
    audioContext = new AudioCtor()
    master = audioContext.createGain()
    master.gain.value = 0.75
    master.connect(audioContext.destination)
  }

  if (!master) return null
  return { ctx: audioContext, master }
}

export async function unlockAudio() {
  const a = getAudio()
  if (!a) return false
  if (unlocked) return true
  try {
    if (a.ctx.state !== "running") await a.ctx.resume()
    unlocked = a.ctx.state === "running"
  } catch {
    unlocked = false
  }
  return unlocked
}

function now(ctx: AudioContext) {
  return ctx.currentTime + 0.0001
}

function env(g: GainNode, t0: number, a: number, d: number, s: number, r: number, peak = 1) {
  g.gain.cancelScheduledValues(t0)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + a)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, s), t0 + a + d)
  g.gain.setValueAtTime(Math.max(0.0002, s), t0 + a + d)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + r)
}

function createNoise(ctx: AudioContext, seconds: number) {
  const sampleRate = ctx.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * seconds))
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.85
  return buffer
}

function playVictory(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const bus = ctx.createGain()
  bus.gain.value = 0.9
  bus.connect(out)

  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = i % 2 === 0 ? "triangle" : "square"
    osc.frequency.setValueAtTime(f, t0)
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(1800, t0)
    filter.Q.setValueAtTime(0.7, t0)

    osc.connect(filter)
    filter.connect(g)
    g.connect(bus)

    const start = t0 + i * 0.075
    env(g, start, 0.01, 0.08, 0.25, 0.22, 0.75)
    osc.start(start)
    osc.stop(start + 0.5)
  })

  const sparkle = ctx.createOscillator()
  const sparkleGain = ctx.createGain()
  const sparkleFilter = ctx.createBiquadFilter()
  sparkle.type = "sine"
  sparkle.frequency.setValueAtTime(2400, t0)
  sparkleFilter.type = "highpass"
  sparkleFilter.frequency.setValueAtTime(1200, t0)
  sparkle.connect(sparkleFilter)
  sparkleFilter.connect(sparkleGain)
  sparkleGain.connect(bus)
  env(sparkleGain, t0 + 0.02, 0.005, 0.08, 0.08, 0.3, 0.45)
  sparkle.start(t0 + 0.02)
  sparkle.stop(t0 + 0.34)
}

function playImpostorWin(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const bus = ctx.createGain()
  bus.gain.value = 1
  bus.connect(out)

  const drone = ctx.createOscillator()
  const droneGain = ctx.createGain()
  const droneFilter = ctx.createBiquadFilter()
  drone.type = "sawtooth"
  drone.frequency.setValueAtTime(62, t0)
  droneFilter.type = "lowpass"
  droneFilter.frequency.setValueAtTime(520, t0)
  droneFilter.Q.setValueAtTime(0.9, t0)
  drone.connect(droneFilter)
  droneFilter.connect(droneGain)
  droneGain.connect(bus)
  env(droneGain, t0, 0.02, 0.2, 0.22, 1.2, 0.85)
  drone.start(t0)
  drone.stop(t0 + 1.45)

  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = "sine"
  sub.frequency.setValueAtTime(31, t0)
  sub.connect(subGain)
  subGain.connect(bus)
  env(subGain, t0, 0.01, 0.25, 0.16, 1.1, 0.85)
  sub.start(t0)
  sub.stop(t0 + 1.3)

  const noise = ctx.createBufferSource()
  noise.buffer = createNoise(ctx, 1.1)
  const noiseGain = ctx.createGain()
  const noiseFilter = ctx.createBiquadFilter()
  noiseFilter.type = "bandpass"
  noiseFilter.frequency.setValueAtTime(850, t0)
  noiseFilter.Q.setValueAtTime(1.1, t0)
  noise.connect(noiseFilter)
  noiseFilter.connect(noiseGain)
  noiseGain.connect(bus)
  env(noiseGain, t0 + 0.03, 0.02, 0.25, 0.12, 0.9, 0.75)
  noise.start(t0 + 0.03)
  noise.stop(t0 + 1.1)

  const stab = ctx.createOscillator()
  const stabGain = ctx.createGain()
  stab.type = "square"
  stab.frequency.setValueAtTime(140, t0 + 0.22)
  stab.frequency.exponentialRampToValueAtTime(68, t0 + 0.55)
  stab.connect(stabGain)
  stabGain.connect(bus)
  env(stabGain, t0 + 0.22, 0.006, 0.12, 0.02, 0.5, 0.95)
  stab.start(t0 + 0.22)
  stab.stop(t0 + 0.75)
}

function playDeath(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const bus = ctx.createGain()
  bus.gain.value = 1
  bus.connect(out)

  const thump = ctx.createOscillator()
  const thumpGain = ctx.createGain()
  thump.type = "sine"
  thump.frequency.setValueAtTime(120, t0)
  thump.frequency.exponentialRampToValueAtTime(48, t0 + 0.18)
  thump.connect(thumpGain)
  thumpGain.connect(bus)
  env(thumpGain, t0, 0.003, 0.08, 0.001, 0.24, 0.95)
  thump.start(t0)
  thump.stop(t0 + 0.26)

  const snap = ctx.createBufferSource()
  snap.buffer = createNoise(ctx, 0.32)
  const snapFilter = ctx.createBiquadFilter()
  const snapGain = ctx.createGain()
  snapFilter.type = "highpass"
  snapFilter.frequency.setValueAtTime(1200, t0)
  snapFilter.Q.setValueAtTime(0.8, t0)
  snap.connect(snapFilter)
  snapFilter.connect(snapGain)
  snapGain.connect(bus)
  env(snapGain, t0 + 0.01, 0.002, 0.04, 0.001, 0.26, 0.65)
  snap.start(t0 + 0.01)
  snap.stop(t0 + 0.28)

  const fall = ctx.createOscillator()
  const fallGain = ctx.createGain()
  const fallFilter = ctx.createBiquadFilter()
  fall.type = "triangle"
  fall.frequency.setValueAtTime(420, t0 + 0.08)
  fall.frequency.exponentialRampToValueAtTime(90, t0 + 0.55)
  fallFilter.type = "lowpass"
  fallFilter.frequency.setValueAtTime(900, t0)
  fallFilter.Q.setValueAtTime(0.7, t0)
  fall.connect(fallFilter)
  fallFilter.connect(fallGain)
  fallGain.connect(bus)
  env(fallGain, t0 + 0.08, 0.008, 0.12, 0.03, 0.65, 0.75)
  fall.start(t0 + 0.08)
  fall.stop(t0 + 0.75)
}

export function playSfx(name: SfxName) {
  const a = getAudio()
  if (!a) return
  if (a.ctx.state !== "running") return
  try {
    if (name === "victory") playVictory(a.ctx, a.master)
    if (name === "impostorWin") playImpostorWin(a.ctx, a.master)
    if (name === "death") playDeath(a.ctx, a.master)
  } catch {}
}

