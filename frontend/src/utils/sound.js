// Web Audio API Micro-Haptics & Tactile Sound Synthesizer
// Inspirado en el diseño sonoro de Linear, Rauno Freiberg y Teenage Engineering.
// 0 dependencias externas, 0 peticiones de red, síntesis en tiempo real.

let audioCtx = null

const getAudioContext = () => {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (AudioContext) {
      audioCtx = new AudioContext()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export const soundManager = {
  get isEnabled() {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem('barberpole.sound_enabled')
    return saved === null ? true : saved === 'true'
  },

  toggle() {
    const next = !this.isEnabled
    localStorage.setItem('barberpole.sound_enabled', String(next))
    if (next) this.playSuccess()
    return next
  },

  playClick() {
    if (!this.isEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.02)

      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.02)
    } catch (e) {
      // Silencioso ante bloqueo de autoplay
    }
  },

  playPop() {
    if (!this.isEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.035)

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.035)
    } catch (e) {
      // Silencioso
    }
  },

  playSuccess() {
    if (!this.isEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const now = ctx.currentTime
      const freqs = [523.25, 659.25, 783.99, 1046.5] // Acorde Do Mayor

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const startTime = now + idx * 0.04

        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, startTime)

        gain.gain.setValueAtTime(0.05, startTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(startTime + 0.22)
      })
    } catch (e) {
      // Silencioso
    }
  },

  playNavigation() {
    if (!this.isEnabled) return
    const ctx = getAudioContext()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.015)

      gain.gain.setValueAtTime(0.03, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.015)
    } catch (e) {
      // Silencioso
    }
  },
}
