type SfxName = "victory" | "impostorWin" | "death" | "chatMessage" | "voteSubmitted" | "phaseChange" | "playerJoined" | "playerLeft" | "countdownTick" | "gameStarted" | "revealWord"

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

function createImpulse(ctx: AudioContext, seconds: number, decay = 7.5) {
  const sampleRate = ctx.sampleRate
  const length = Math.max(1, Math.floor(sampleRate * seconds))
  const buffer = ctx.createBuffer(2, length, sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      const x = 1 - i / length
      data[i] = (Math.random() * 2 - 1) * Math.pow(x, decay)
    }
  }
  return buffer
}

function distortionCurve(amount: number) {
  const n = 2048
  const curve = new Float32Array(n)
  const k = Math.max(0, amount)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / (n - 1) - 1
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
  }
  return curve
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
  const dur = 11.2

  const bus = ctx.createGain()
  bus.gain.value = 0.84

  const pre = ctx.createBiquadFilter()
  pre.type = "lowpass"
  pre.frequency.setValueAtTime(980, t0)
  pre.frequency.exponentialRampToValueAtTime(200, t0 + dur)
  pre.Q.setValueAtTime(0.92, t0)

  const drive = ctx.createWaveShaper()
  drive.curve = distortionCurve(18)
  drive.oversample = "4x"

  const post = ctx.createBiquadFilter()
  post.type = "lowpass"
  post.frequency.setValueAtTime(520, t0)
  post.frequency.exponentialRampToValueAtTime(110, t0 + dur)
  post.Q.setValueAtTime(1.12, t0)

  const postGain = ctx.createGain()
  postGain.gain.value = 0.92

  bus.connect(pre)
  pre.connect(drive)
  drive.connect(post)
  post.connect(postGain)
  postGain.connect(out)

  const delay = ctx.createDelay(1.0)
  delay.delayTime.setValueAtTime(0.52, t0)
  delay.delayTime.linearRampToValueAtTime(0.72, t0 + Math.max(2.5, dur - 1.2))
  const feedback = ctx.createGain()
  feedback.gain.setValueAtTime(0.66, t0)
  feedback.gain.exponentialRampToValueAtTime(0.46, t0 + dur)
  const echoTone = ctx.createBiquadFilter()
  echoTone.type = "lowpass"
  echoTone.frequency.setValueAtTime(420, t0)
  echoTone.frequency.exponentialRampToValueAtTime(120, t0 + dur - 0.2)
  echoTone.Q.setValueAtTime(0.8, t0)
  const echoWet = ctx.createGain()
  echoWet.gain.setValueAtTime(0.56, t0)
  echoWet.gain.exponentialRampToValueAtTime(0.22, t0 + dur)

  const echoSend = ctx.createGain()
  echoSend.gain.setValueAtTime(0.55, t0)
  post.connect(echoSend)
  echoSend.connect(delay)
  delay.connect(echoTone)
  echoTone.connect(feedback)
  feedback.connect(delay)
  echoTone.connect(echoWet)
  echoWet.connect(out)

  const convolver = ctx.createConvolver()
  convolver.buffer = createImpulse(ctx, 7.4, 10.2)
  const verbTone = ctx.createBiquadFilter()
  verbTone.type = "lowpass"
  verbTone.frequency.setValueAtTime(420, t0)
  verbTone.frequency.exponentialRampToValueAtTime(110, t0 + dur)
  verbTone.Q.setValueAtTime(0.75, t0)
  const verbWet = ctx.createGain()
  verbWet.gain.setValueAtTime(0.0001, t0)
  verbWet.gain.exponentialRampToValueAtTime(0.5, t0 + 0.6)
  verbWet.gain.exponentialRampToValueAtTime(0.22, t0 + dur)

  post.connect(convolver)
  convolver.connect(verbTone)
  verbTone.connect(verbWet)
  verbWet.connect(out)

  const droneFilter = ctx.createBiquadFilter()
  droneFilter.type = "lowpass"
  droneFilter.frequency.setValueAtTime(360, t0)
  droneFilter.frequency.exponentialRampToValueAtTime(90, t0 + dur)
  droneFilter.Q.setValueAtTime(1.18, t0)

  const droneAmp = ctx.createGain()
  droneAmp.gain.setValueAtTime(0.0001, t0)

  droneFilter.connect(droneAmp)
  droneAmp.connect(bus)

  const droneA = ctx.createOscillator()
  const droneB = ctx.createOscillator()
  droneA.type = "sawtooth"
  droneB.type = "sawtooth"
  droneA.frequency.setValueAtTime(46, t0)
  droneB.frequency.setValueAtTime(46, t0)
  droneA.detune.setValueAtTime(-32, t0)
  droneB.detune.setValueAtTime(32, t0)
  droneA.frequency.exponentialRampToValueAtTime(30, t0 + dur + 0.4)
  droneB.frequency.exponentialRampToValueAtTime(30, t0 + dur + 0.4)
  droneA.connect(droneFilter)
  droneB.connect(droneFilter)
  env(droneAmp, t0, 0.08, 1.6, 0.06, dur - 0.4, 0.92)
  droneA.start(t0)
  droneB.start(t0)
  droneA.stop(t0 + dur + 0.8)
  droneB.stop(t0 + dur + 0.8)

  const sub = ctx.createOscillator()
  const subGain = ctx.createGain()
  sub.type = "sine"
  sub.frequency.setValueAtTime(24, t0)
  sub.frequency.exponentialRampToValueAtTime(16, t0 + dur + 0.4)
  sub.connect(subGain)
  subGain.connect(bus)
  env(subGain, t0, 0.03, 1.6, 0.04, dur - 0.2, 0.95)
  sub.start(t0)
  sub.stop(t0 + dur + 0.6)

  const lfo = ctx.createOscillator()
  const lfoGain = ctx.createGain()
  lfo.type = "sine"
  lfo.frequency.setValueAtTime(2.1, t0)
  lfoGain.gain.setValueAtTime(0.11, t0)
  lfo.connect(lfoGain)
  lfoGain.connect(droneAmp.gain)
  lfo.start(t0)
  lfo.stop(t0 + dur)

  const wobble = ctx.createOscillator()
  const wobbleGain = ctx.createGain()
  wobble.type = "sine"
  wobble.frequency.setValueAtTime(0.52, t0)
  wobbleGain.gain.setValueAtTime(34, t0)
  wobble.connect(wobbleGain)
  wobbleGain.connect(post.frequency)
  wobble.start(t0)
  wobble.stop(t0 + dur)

  const rumble = ctx.createBufferSource()
  rumble.buffer = createNoise(ctx, dur + 0.6)
  const rumbleFilter = ctx.createBiquadFilter()
  rumbleFilter.type = "lowpass"
  rumbleFilter.frequency.setValueAtTime(160, t0)
  rumbleFilter.frequency.exponentialRampToValueAtTime(34, t0 + dur + 0.2)
  rumbleFilter.Q.setValueAtTime(0.65, t0)
  const rumbleGain = ctx.createGain()
  rumble.connect(rumbleFilter)
  rumbleFilter.connect(rumbleGain)
  rumbleGain.connect(bus)
  env(rumbleGain, t0, 0.12, 2.0, 0.05, dur - 0.4, 0.52)
  rumble.start(t0)
  rumble.stop(t0 + dur + 0.7)

  const hiss = ctx.createBufferSource()
  hiss.buffer = createNoise(ctx, dur)
  const hissGain = ctx.createGain()
  const hissFilter = ctx.createBiquadFilter()
  hissFilter.type = "bandpass"
  hissFilter.frequency.setValueAtTime(520, t0 + 0.05)
  hissFilter.frequency.exponentialRampToValueAtTime(120, t0 + dur - 0.6)
  hissFilter.Q.setValueAtTime(1.85, t0)
  hiss.connect(hissFilter)
  hissFilter.connect(hissGain)
  hissGain.connect(bus)
  env(hissGain, t0 + 0.05, 0.12, 2.1, 0.03, dur - 0.8, 0.58)
  hiss.start(t0 + 0.05)
  hiss.stop(t0 + dur + 0.2)

  const whisper = ctx.createBufferSource()
  whisper.buffer = createNoise(ctx, 3.2)
  const whisperGain = ctx.createGain()
  const whisperFilter = ctx.createBiquadFilter()
  whisperFilter.type = "bandpass"
  whisperFilter.frequency.setValueAtTime(380, t0 + 0.12)
  whisperFilter.frequency.exponentialRampToValueAtTime(180, t0 + 3.0)
  whisperFilter.Q.setValueAtTime(1.1, t0)
  whisper.connect(whisperFilter)
  whisperFilter.connect(whisperGain)
  whisperGain.connect(bus)
  env(whisperGain, t0 + 0.12, 0.14, 1.1, 0.02, 2.2, 0.3)
  whisper.start(t0 + 0.12)
  whisper.stop(t0 + 3.6)

  const choirFilter = ctx.createBiquadFilter()
  choirFilter.type = "bandpass"
  choirFilter.frequency.setValueAtTime(320, t0 + 0.6)
  choirFilter.frequency.exponentialRampToValueAtTime(220, t0 + dur)
  choirFilter.Q.setValueAtTime(7.6, t0)
  const choirGain = ctx.createGain()
  choirGain.gain.setValueAtTime(0.0001, t0)
  choirFilter.connect(choirGain)
  choirGain.connect(bus)

  const choirA = ctx.createOscillator()
  const choirB = ctx.createOscillator()
  choirA.type = "triangle"
  choirB.type = "triangle"
  choirA.frequency.setValueAtTime(92, t0 + 0.6)
  choirB.frequency.setValueAtTime(92, t0 + 0.6)
  choirA.detune.setValueAtTime(-12, t0)
  choirB.detune.setValueAtTime(12, t0)
  choirA.connect(choirFilter)
  choirB.connect(choirFilter)
  env(choirGain, t0 + 0.6, 0.45, 1.5, 0.02, dur - 0.6, 0.34)
  choirA.start(t0 + 0.6)
  choirB.start(t0 + 0.6)
  choirA.stop(t0 + dur + 0.8)
  choirB.stop(t0 + dur + 0.8)

  const wind = ctx.createBufferSource()
  wind.buffer = createNoise(ctx, 6.2)
  const windFilter = ctx.createBiquadFilter()
  windFilter.type = "bandpass"
  windFilter.frequency.setValueAtTime(130, t0 + 4.0)
  windFilter.frequency.exponentialRampToValueAtTime(380, t0 + 7.2)
  windFilter.Q.setValueAtTime(0.95, t0)
  const windGain = ctx.createGain()
  wind.connect(windFilter)
  windFilter.connect(windGain)
  windGain.connect(bus)
  env(windGain, t0 + 4.0, 0.2, 1.6, 0.02, 4.2, 0.34)
  wind.start(t0 + 4.0)
  wind.stop(t0 + 10.4)

  ;[
    { at: 0.48, f1: 104, f2: 46 },
    { at: 1.15, f1: 96, f2: 44 },
    { at: 2.05, f1: 92, f2: 42 },
    { at: 3.15, f1: 88, f2: 40 },
    { at: 4.25, f1: 84, f2: 38 },
    { at: 6.05, f1: 80, f2: 36 },
    { at: 8.1, f1: 76, f2: 34 },
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
  stab.frequency.setValueAtTime(132, t0 + 0.26)
  stab.frequency.exponentialRampToValueAtTime(52, t0 + 1.25)
  stabFilter.type = "lowpass"
  stabFilter.frequency.setValueAtTime(620, t0 + 0.26)
  stabFilter.frequency.exponentialRampToValueAtTime(190, t0 + 2.8)
  stabFilter.Q.setValueAtTime(0.92, t0)
  stab.connect(stabFilter)
  stabFilter.connect(stabGain)
  stabGain.connect(bus)
  env(stabGain, t0 + 0.26, 0.012, 0.35, 0.01, 2.2, 0.88)
  stab.start(t0 + 0.26)
  stab.stop(t0 + 3.1)
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
    if (name === "chatMessage") playChatMessage(a.ctx, a.master)
    if (name === "voteSubmitted") playVoteSubmitted(a.ctx, a.master)
    if (name === "phaseChange") playPhaseChange(a.ctx, a.master)
    if (name === "playerJoined") playPlayerJoined(a.ctx, a.master)
    if (name === "playerLeft") playPlayerLeft(a.ctx, a.master)
    if (name === "countdownTick") playCountdownTick(a.ctx, a.master)
    if (name === "gameStarted") playGameStarted(a.ctx, a.master)
    if (name === "revealWord") playRevealWord(a.ctx, a.master)
  } catch (err) {
    if (import.meta.env.DEV) console.error(err)
  }
}

function playChatMessage(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = "sine"
  osc.frequency.setValueAtTime(1200, t0)
  osc.frequency.exponentialRampToValueAtTime(800, t0 + 0.08)

  filter.type = "lowpass"
  filter.frequency.setValueAtTime(2000, t0)

  osc.connect(filter)
  filter.connect(g)
  g.connect(out)

  env(g, t0, 0.002, 0.02, 0.1, 0.06, 0.25)
  osc.start(t0)
  osc.stop(t0 + 0.1)
}

function playVoteSubmitted(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  for (let i = 0; i < 2; i++) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()

    osc.type = i === 0 ? "sine" : "triangle"
    osc.frequency.setValueAtTime(i === 0 ? 600 : 900, t0 + i * 0.06)

    osc.connect(g)
    g.connect(out)

    env(g, t0 + i * 0.06, 0.003, 0.04, 0.2, 0.05, 0.4)
    osc.start(t0 + i * 0.06)
    osc.stop(t0 + i * 0.06 + 0.12)
  }
}

function playPhaseChange(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const sweep = ctx.createOscillator()
  const sweepGain = ctx.createGain()
  const sweepFilter = ctx.createBiquadFilter()

  sweep.type = "sine"
  sweep.frequency.setValueAtTime(300, t0)
  sweep.frequency.exponentialRampToValueAtTime(1200, t0 + 0.15)

  sweepFilter.type = "lowpass"
  sweepFilter.frequency.setValueAtTime(3000, t0)

  sweep.connect(sweepFilter)
  sweepFilter.connect(sweepGain)
  sweepGain.connect(out)

  env(sweepGain, t0, 0.005, 0.08, 0.3, 0.12, 0.5)
  sweep.start(t0)
  sweep.stop(t0 + 0.25)

  const sparkle = ctx.createOscillator()
  const sparkleGain = ctx.createGain()

  sparkle.type = "sine"
  sparkle.frequency.setValueAtTime(2000, t0 + 0.12)

  sparkle.connect(sparkleGain)
  sparkleGain.connect(out)

  env(sparkleGain, t0 + 0.12, 0.002, 0.03, 0.15, 0.08, 0.3)
  sparkle.start(t0 + 0.12)
  sparkle.stop(t0 + 0.35)
}

function playPlayerJoined(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()

    osc.type = "triangle"
    osc.frequency.setValueAtTime(freq, t0)

    osc.connect(g)
    g.connect(out)

    const start = t0 + i * 0.1
    env(g, start, 0.005, 0.06, 0.3, 0.08, 0.5)
    osc.start(start)
    osc.stop(start + 0.18)
  })
}

function playPlayerLeft(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const osc = ctx.createOscillator()
  const g = ctx.createGain()

  osc.type = "sine"
  osc.frequency.setValueAtTime(600, t0)
  osc.frequency.exponentialRampToValueAtTime(200, t0 + 0.3)

  osc.connect(g)
  g.connect(out)

  env(g, t0, 0.01, 0.1, 0.1, 0.25, 0.35)
  osc.start(t0)
  osc.stop(t0 + 0.35)
}

function playCountdownTick(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const osc = ctx.createOscillator()
  const g = ctx.createGain()

  osc.type = "square"
  osc.frequency.setValueAtTime(1000, t0)

  osc.connect(g)
  g.connect(out)

  env(g, t0, 0.001, 0.015, 0.01, 0.03, 0.15)
  osc.start(t0)
  osc.stop(t0 + 0.06)
}

function playGameStarted(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const drone = ctx.createOscillator()
  const droneGain = ctx.createGain()
  const droneFilter = ctx.createBiquadFilter()

  drone.type = "sawtooth"
  drone.frequency.setValueAtTime(80, t0)
  drone.frequency.exponentialRampToValueAtTime(120, t0 + 0.5)

  droneFilter.type = "lowpass"
  droneFilter.frequency.setValueAtTime(400, t0)
  droneFilter.frequency.exponentialRampToValueAtTime(2000, t0 + 0.3)

  drone.connect(droneFilter)
  droneFilter.connect(droneGain)
  droneGain.connect(out)

  env(droneGain, t0, 0.05, 0.3, 0.4, 0.2, 0.6)
  drone.start(t0)
  drone.stop(t0 + 0.6)

  const stab = ctx.createOscillator()
  const stabGain = ctx.createGain()

  stab.type = "square"
  stab.frequency.setValueAtTime(440, t0 + 0.1)

  stab.connect(stabGain)
  stabGain.connect(out)

  env(stabGain, t0 + 0.1, 0.005, 0.08, 0.2, 0.15, 0.5)
  stab.start(t0 + 0.1)
  stab.stop(t0 + 0.4)

  for (let i = 0; i < 3; i++) {
    const click = ctx.createOscillator()
    const clickGain = ctx.createGain()

    click.type = "sine"
    click.frequency.setValueAtTime(1500 + i * 500, t0 + 0.3 + i * 0.08)

    click.connect(clickGain)
    clickGain.connect(out)

    env(clickGain, t0 + 0.3 + i * 0.08, 0.002, 0.02, 0.1, 0.05, 0.35)
    click.start(t0 + 0.3 + i * 0.08)
    click.stop(t0 + 0.3 + i * 0.08 + 0.1)
  }
}

function playRevealWord(ctx: AudioContext, out: AudioNode) {
  const t0 = now(ctx)

  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = "sine"
  osc.frequency.setValueAtTime(400, t0)
  osc.frequency.exponentialRampToValueAtTime(1600, t0 + 0.2)

  filter.type = "lowpass"
  filter.frequency.setValueAtTime(2500, t0)

  osc.connect(filter)
  filter.connect(g)
  g.connect(out)

  env(g, t0, 0.01, 0.1, 0.4, 0.15, 0.5)
  osc.start(t0)
  osc.stop(t0 + 0.3)
}
