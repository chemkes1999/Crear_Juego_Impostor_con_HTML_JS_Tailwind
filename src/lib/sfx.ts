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
  bus.gain.value = 0.92

  const delay = ctx.createDelay(1.0)
  delay.delayTime.setValueAtTime(0.33, t0)
  const feedback = ctx.createGain()
  feedback.gain.setValueAtTime(0.5, t0)
  const echoTone = ctx.createBiquadFilter()
  echoTone.type = "lowpass"
  echoTone.frequency.setValueAtTime(520, t0)
  echoTone.frequency.exponentialRampToValueAtTime(220, t0 + 3.8)
  echoTone.Q.setValueAtTime(0.6, t0)

  bus.connect(out)
  bus.connect(delay)
  delay.connect(echoTone)
  echoTone.connect(feedback)
  feedback.connect(delay)
  echoTone.connect(out)

  const droneFilter = ctx.createBiquadFilter()
  droneFilter.type = "lowpass"
  droneFilter.frequency.setValueAtTime(420, t0)
  droneFilter.frequency.exponentialRampToValueAtTime(140, t0 + 3.9)
  droneFilter.Q.setValueAtTime(1.02, t0)

  const droneAmp = ctx.createGain()
  droneAmp.gain.setValueAtTime(0.0001, t0)

  droneFilter.connect(droneAmp)
  droneAmp.connect(bus)

  const droneA = ctx.createOscillator()
  const droneB = ctx.createOscillator()
  droneA.type = "sawtooth"
  droneB.type = "sawtooth"
  droneA.frequency.setValueAtTime(56, t0)
  droneB.frequency.setValueAtTime(56, t0)
  droneA.detune.setValueAtTime(-22, t0)
  droneB.detune.setValueAtTime(22, t0)
  droneA.frequency.exponentialRampToValueAtTime(42, t0 + 4.1)
  droneB.frequency.exponentialRampToValueAtTime(42, t0 + 4.1)
  droneA.connect(droneFilter)
  droneB.connect(droneFilter)
  env(droneAmp, t0, 0.03, 0.65, 0.13, 3.3, 0.85)
  droneA.start(t0)
  droneB.start(t0)
  droneA.stop(t0 + 4.3)
  droneB.stop(t0 + 4.3)

  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = "sine"
  sub.frequency.setValueAtTime(28, t0)
  sub.frequency.exponentialRampToValueAtTime(22, t0 + 3.7)
  sub.connect(subGain)
  subGain.connect(bus)
  env(subGain, t0, 0.01, 0.7, 0.07, 3.1, 0.95)
  sub.start(t0)
  sub.stop(t0 + 4.1)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = "sine"
  lfo.frequency.setValueAtTime(3.2, t0)
  lfoGain.gain.setValueAtTime(0.08, t0)
  lfo.connect(lfoGain)
  lfoGain.connect(droneAmp.gain)
  lfo.start(t0)
  lfo.stop(t0 + 4.0)

  const hiss = ctx.createBufferSource()
  hiss.buffer = createNoise(ctx, 3.6)
  const hissGain = ctx.createGain()
  const hissFilter = ctx.createBiquadFilter()
  hissFilter.type = "bandpass"
  hissFilter.frequency.setValueAtTime(900, t0 + 0.05)
  hissFilter.frequency.exponentialRampToValueAtTime(180, t0 + 3.55)
  hissFilter.Q.setValueAtTime(1.45, t0)
  hiss.connect(hissFilter)
  hissFilter.connect(hissGain)
  hissGain.connect(bus)
  env(hissGain, t0 + 0.05, 0.05, 1.1, 0.05, 2.45, 0.75)
  hiss.start(t0 + 0.05)
  hiss.stop(t0 + 3.7)

  const whisper = ctx.createBufferSource()
  whisper.buffer = createNoise(ctx, 1.8)
  const whisperGain = ctx.createGain()
  const whisperFilter = ctx.createBiquadFilter()
  whisperFilter.type = "highpass"
  whisperFilter.frequency.setValueAtTime(520, t0 + 0.12)
  whisperFilter.Q.setValueAtTime(0.7, t0)
  whisper.connect(whisperFilter)
  whisperFilter.connect(whisperGain)
  whisperGain.connect(bus)
  env(whisperGain, t0 + 0.12, 0.04, 0.6, 0.02, 1.05, 0.35)
  whisper.start(t0 + 0.12)
  whisper.stop(t0 + 1.95)

  ;[
    { at: 0.42, f1: 128, f2: 58 },
    { at: 0.92, f1: 118, f2: 54 },
    { at: 2.15, f1: 112, f2: 52 },
  ].forEach((b) => {
    const beat = ctx.createOscillator()
    const beatGain = ctx.createGain()
    beat.type = "sine"
    beat.frequency.setValueAtTime(b.f1, t0 + b.at)
    beat.frequency.exponentialRampToValueAtTime(b.f2, t0 + b.at + 0.18)
    beat.connect(beatGain)
    beatGain.connect(bus)
    env(beatGain, t0 + b.at, 0.004, 0.1, 0.001, 0.35, 0.9)
    beat.start(t0 + b.at)
    beat.stop(t0 + b.at + 0.4)
  })

  const stab = ctx.createOscillator()
  const stabGain = ctx.createGain()
  const stabFilter = ctx.createBiquadFilter()
  stab.type = "square"
  stab.frequency.setValueAtTime(140, t0 + 0.22)
  stab.frequency.exponentialRampToValueAtTime(58, t0 + 0.92)
  stabFilter.type = "lowpass"
  stabFilter.frequency.setValueAtTime(700, t0 + 0.22)
  stabFilter.frequency.exponentialRampToValueAtTime(220, t0 + 2.1)
  stabFilter.Q.setValueAtTime(0.85, t0)
  stab.connect(stabFilter)
  stabFilter.connect(stabGain)
  stabGain.connect(bus)
  env(stabGain, t0 + 0.22, 0.01, 0.32, 0.015, 1.55, 0.9)
  stab.start(t0 + 0.22)
  stab.stop(t0 + 2.35)
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
