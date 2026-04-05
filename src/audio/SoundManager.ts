import { gameState } from '../GameState'

export type SfxKey =
  | 'jump' | 'doubleJump' | 'dash' | 'bark'
  | 'collectBone' | 'collectGolden' | 'damage' | 'stomp'
  | 'powerUp' | 'swap' | 'gameOver' | 'levelComplete' | 'checkpoint'

let _ctx: AudioContext | null = null
let _currentBgm: Phaser.Sound.BaseSound | null = null
// Armazena o último BGM para retomar após unmute
let _lastBgmKey: string | null = null
let _lastBgmScene: Phaser.Scene | null = null
let _lastBgmLoop: boolean = true

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext()
  if (_ctx.state === 'suspended') void _ctx.resume()
  return _ctx
}

function playTone(
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  durationMs: number,
  gainVal = 0.25
): void {
  if (gameState.muted) return
  const c = getCtx()
  const now = c.currentTime
  const dur = durationMs / 1000
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, now)
  if (freqEnd !== freqStart) osc.frequency.linearRampToValueAtTime(freqEnd, now + dur)
  gain.gain.setValueAtTime(gainVal, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now)
  osc.stop(now + dur)
}

function playArpeggio(freqs: number[], noteDurMs: number, gainVal = 0.22): void {
  if (gameState.muted) return
  const c = getCtx()
  freqs.forEach((freq, i) => {
    const t = c.currentTime + i * (noteDurMs / 1000)
    const dur = noteDurMs / 1000
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(gainVal, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(t)
    osc.stop(t + dur)
  })
}

function playNoise(durationMs: number, gainVal = 0.15): void {
  if (gameState.muted) return
  const c = getCtx()
  const dur = durationMs / 1000
  const sampleCount = Math.ceil(c.sampleRate * dur)
  const buf = c.createBuffer(1, sampleCount, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const gain = c.createGain()
  gain.gain.setValueAtTime(gainVal, c.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur)
  src.connect(gain)
  gain.connect(c.destination)
  src.start()
  src.stop(c.currentTime + dur)
}

// ─── Procedural BGM ───────────────────────────────────────────────────────────
// [freq_hz, beat_offset, duration_beats, gain]
type PBeat = [number, number, number, number]

// ── Menu theme — Dó maior, 130 BPM, loop de 8 beats (alegre, energético) ───
const _MENU_BPM  = 130
const _MENU_LOOP = 8
const _MENU_MEL: PBeat[] = [
  [523.3, 0,    0.40, 0.16], // C5
  [659.3, 0.5,  0.40, 0.14], // E5
  [784.0, 1,    0.40, 0.16], // G5
  [659.3, 1.5,  0.40, 0.14], // E5
  [523.3, 2,    0.40, 0.16], // C5
  [587.3, 2.5,  0.40, 0.14], // D5
  [659.3, 3,    0.40, 0.16], // E5
  [784.0, 3.5,  0.40, 0.14], // G5
  [880.0, 4,    0.60, 0.17], // A5 — acento
  [784.0, 4.75, 0.35, 0.14], // G5
  [698.5, 5.5,  0.35, 0.12], // F5
  [659.3, 6,    0.60, 0.15], // E5
  [587.3, 6.75, 0.30, 0.12], // D5
  [523.3, 7,    0.85, 0.17], // C5
]
const _MENU_BASS: PBeat[] = [
  [130.8, 0, 0.65, 0.17], // C3
  [196.0, 2, 0.65, 0.15], // G3
  [174.6, 4, 0.65, 0.17], // F3
  [196.0, 6, 0.65, 0.15], // G3
]

// ── Victory theme — Dó maior, 180 BPM, loop de 4 beats (fanfarra triunfal) ──
const _VICTORY_BPM  = 180
const _VICTORY_LOOP = 4
const _VICTORY_MEL: PBeat[] = [
  [523.3, 0,    0.28, 0.20], // C5
  [659.3, 0.5,  0.28, 0.20], // E5
  [784.0, 1,    0.28, 0.22], // G5
  [1046.5,1.5,  0.70, 0.24], // C6 — clímax
  [880.0, 2.25, 0.35, 0.20], // A5
  [784.0, 2.75, 0.35, 0.20], // G5
  [1046.5,3.25, 0.60, 0.22], // C6 — reforço
]
const _VICTORY_BASS: PBeat[] = [
  [130.8, 0,  1.8, 0.20], // C3
  [174.6, 2,  0.9, 0.18], // F3
  [196.0, 3,  0.9, 0.18], // G3
]

// ── Game-over theme — Ré menor, 45 BPM, loop de 8 beats (sombrio, triste) ──
const _GAMEOVER_BPM  = 45
const _GAMEOVER_LOOP = 8
const _GAMEOVER_MEL: PBeat[] = [
  [293.7, 0,    1.6, 0.18], // D4
  [261.6, 2,    1.6, 0.17], // C4
  [233.1, 4,    1.6, 0.18], // Bb3
  [220.0, 6,    1.8, 0.20], // A3 — queda final
]
const _GAMEOVER_BASS: PBeat[] = [
  [73.4,  0, 3.6, 0.22], // D2
  [55.0,  4, 3.6, 0.20], // A1
]

// ── Intro theme — Ré menor, 72 BPM, loop de 16 beats (dramático, épico) ────
const _INTRO_BPM  = 72
const _INTRO_LOOP = 16
const _INTRO_MEL: PBeat[] = [
  // Motivo A: fanfarra "Da-da-da Dah" em Ré menor
  [293.7, 0,    0.35, 0.20], // D4
  [293.7, 0.5,  0.35, 0.20], // D4
  [293.7, 1,    0.35, 0.20], // D4
  [220.0, 1.5,  0.90, 0.24], // A3 — queda dramática
  [349.2, 2.5,  1.10, 0.22], // F4 — resolução
  // Motivo B: subida crescente
  [293.7, 4,    0.35, 0.20], // D4
  [329.6, 4.5,  0.35, 0.18], // E4
  [349.2, 5,    0.35, 0.20], // F4
  [392.0, 5.5,  0.35, 0.22], // G4
  [440.0, 6,    0.90, 0.24], // A4 — pico
  [392.0, 7,    0.90, 0.20], // G4
  // Motivo C: clímax
  [466.2, 8,    0.50, 0.22], // Bb4
  [440.0, 8.5,  0.50, 0.20], // A4
  [392.0, 9,    0.50, 0.22], // G4
  [523.3, 9.5,  1.20, 0.26], // C5 — clímax!
  [466.2, 11,   0.50, 0.22], // Bb4
  [440.0, 11.5, 0.50, 0.20], // A4
  // Resolução final
  [392.0, 12,   0.40, 0.20], // G4
  [349.2, 12.5, 0.40, 0.18], // F4
  [329.6, 13,   0.40, 0.18], // E4
  [293.7, 13.5, 2.00, 0.24], // D4 — repouso
]
const _INTRO_BASS: PBeat[] = [
  [73.4,  0,  1.8, 0.20], // D2
  [110.0, 2,  1.8, 0.18], // A2
  [87.3,  4,  1.8, 0.20], // F2
  [98.0,  6,  1.8, 0.18], // G2
  [73.4,  8,  1.8, 0.20], // D2
  [110.0, 10, 1.8, 0.18], // A2
  [116.5, 12, 1.8, 0.20], // Bb2
  [98.0,  14, 1.8, 0.18], // G2
]

let _procActive   = false
let _procTimeout: ReturnType<typeof setTimeout> | null = null
let _procType: 'menu' | 'intro' | null = null
// Nó de ganho mestre para silenciar notas já agendadas na Web Audio API
let _procGainNode: GainNode | null = null

function _stopProcLoop(): void {
  _procActive = false
  if (_procTimeout !== null) { clearTimeout(_procTimeout); _procTimeout = null }
  // Zera o ganho imediatamente para silenciar qualquer nota já agendada
  if (_procGainNode) {
    try {
      const ctx = _procGainNode.context as AudioContext
      _procGainNode.gain.cancelScheduledValues(ctx.currentTime)
      _procGainNode.gain.setValueAtTime(0, ctx.currentTime)
    } catch { /* silencia erros de contexto fechado */ }
    _procGainNode = null
  }
}

function _playNoteAt(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  t: number,
  dur: number,
  gain: number
): void {
  if (!_procGainNode) return          // nó mestre ausente → sessão encerrada
  const osc = ctx.createOscillator()
  const g   = ctx.createGain()
  osc.type  = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + Math.min(0.04, dur * 0.1))
  g.gain.setValueAtTime(gain, t + dur * 0.75)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(g)
  g.connect(_procGainNode)            // ← roteado pelo nó mestre (não direto)
  osc.start(t)
  osc.stop(t + dur + 0.01)
}

function _runProc(mel: PBeat[], bass: PBeat[], bpm: number, loop: number): void {
  if (!_procActive || gameState.muted) return
  const c    = getCtx()
  const beat = 60 / bpm
  const now  = c.currentTime + 0.05
  const loopMs = loop * beat * 1000

  // Garante que o nó mestre existe antes de agendar notas
  if (!_procGainNode) {
    _procGainNode = c.createGain()
    _procGainNode.gain.value = 1
    _procGainNode.connect(c.destination)
  }

  mel.forEach(([f, b, d, g])  => _playNoteAt(c, 'sine',     f, now + b * beat, d * beat, g))
  bass.forEach(([f, b, d, g]) => _playNoteAt(c, 'triangle', f, now + b * beat, d * beat, g))

  // Agenda próxima iteração 80ms antes do fim para evitar gap
  _procTimeout = setTimeout(() => _runProc(mel, bass, bpm, loop), loopMs - 80)
}

export const SoundManager = {
  play(key: SfxKey): void {
    switch (key) {
      case 'jump':          playTone('sine',     350,  600, 120);                    break
      case 'doubleJump':    playTone('sine',     600,  950, 100);                    break
      case 'dash':          playTone('sawtooth', 300,  150, 180);                    break
      case 'bark':          playTone('square',   220,  220,  80, 0.3);              break
      case 'collectBone':   playTone('sine',     900,  900,  80, 0.2);              break
      case 'collectGolden': playArpeggio([523, 659, 784], 100);                     break
      case 'damage':        playTone('square',   180,   80, 250, 0.3);             break
      case 'stomp':         playNoise(100);                                          break
      case 'powerUp':       playArpeggio([523, 587, 659, 698, 784], 80);           break
      case 'swap':          playTone('sine',     500,  750, 120);                   break
      case 'gameOver':      playArpeggio([440, 330, 220], 200, 0.3);              break
      case 'levelComplete': playArpeggio([523, 659, 784, 880, 1047], 100);         break
      case 'checkpoint':    playTone('sine',     440,  880, 200);                   break
    }
  },

  playBgm(key: string, scene: Phaser.Scene, loop = true): void {
    _lastBgmKey = key; _lastBgmScene = scene; _lastBgmLoop = loop
    _stopProcLoop(); _procType = null
    if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
    if (gameState.muted) return
    try {
      _currentBgm = scene.sound.add(key, { loop, volume: 0.5 })
      _currentBgm.play()
    } catch {
      _currentBgm = null
    }
  },

  /** BGM gerado proceduralmente via Web Audio — funciona sem arquivos MP3 */
  playProceduralBgm(type: 'menu' | 'intro' | 'victory' | 'gameover'): void {
    if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
    _lastBgmKey = null
    _stopProcLoop()                    // silencia notas antigas imediatamente
    _procType   = type as 'menu' | 'intro'
    _procActive = true
    if (gameState.muted) return
    // Cria nó mestre novo para esta sessão (notas antigas vão para o nó antigo que está em 0)
    const c = getCtx()
    _procGainNode = c.createGain()
    _procGainNode.gain.value = 1
    _procGainNode.connect(c.destination)
    const map: Record<string, [PBeat[], PBeat[], number, number]> = {
      menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
      intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
      victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
      gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
    }
    const [mel, bass, bpm, loop] = map[type]
    _runProc(mel, bass, bpm, loop)
  },

  stopBgm(): void {
    if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
    _lastBgmKey = null; _lastBgmScene = null
    _stopProcLoop(); _procType = null
  },

  setMuted(muted: boolean): void {
    gameState.muted = muted
    if (muted) {
      if (_currentBgm) { _currentBgm.stop(); _currentBgm.destroy(); _currentBgm = null }
      _stopProcLoop()
      // Mantém _procType e _lastBgmKey* para retomar ao desmutar
    } else if (_lastBgmKey && _lastBgmScene) {
      // Retoma MP3
      try {
        _currentBgm = _lastBgmScene.sound.add(_lastBgmKey, { loop: _lastBgmLoop, volume: 0.5 })
        _currentBgm.play()
      } catch {
        _currentBgm = null; _lastBgmKey = null; _lastBgmScene = null
      }
    } else if (_procType) {
      // Retoma procedural — cria nó mestre novo
      _procActive = true
      const c2 = getCtx()
      _procGainNode = c2.createGain()
      _procGainNode.gain.value = 1
      _procGainNode.connect(c2.destination)
      const map: Record<string, [PBeat[], PBeat[], number, number]> = {
        menu:     [_MENU_MEL,     _MENU_BASS,     _MENU_BPM,     _MENU_LOOP],
        intro:    [_INTRO_MEL,    _INTRO_BASS,    _INTRO_BPM,    _INTRO_LOOP],
        victory:  [_VICTORY_MEL,  _VICTORY_BASS,  _VICTORY_BPM,  _VICTORY_LOOP],
        gameover: [_GAMEOVER_MEL, _GAMEOVER_BASS, _GAMEOVER_BPM, _GAMEOVER_LOOP],
      }
      const [mel, bass, bpm, loop] = map[_procType]
      _runProc(mel, bass, bpm, loop)
    }
  },
}
