let context: AudioContext | null = null

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctx) return null
  if (!context) context = new Ctx()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  peak: number,
) {
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function playClick() {
  const ctx = audio()
  if (!ctx) return
  tone(ctx, 880, ctx.currentTime, 0.05, 'square', 0.05)
}

export function playCorrect() {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime
  tone(ctx, 523.25, start, 0.12, 'triangle', 0.07)
  tone(ctx, 659.25, start + 0.09, 0.12, 'triangle', 0.07)
  tone(ctx, 783.99, start + 0.18, 0.22, 'triangle', 0.08)
}

export function playWrong() {
  const ctx = audio()
  if (!ctx) return
  const start = ctx.currentTime
  tone(ctx, 220, start, 0.16, 'sine', 0.045)
  tone(ctx, 174.61, start + 0.11, 0.24, 'sine', 0.04)
}
