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
  src.stop(c.currentTime + dur)  // libera o nó após o fim do buffer
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
    // Armazena para retomar após unmute
    _lastBgmKey = key
    _lastBgmScene = scene
    _lastBgmLoop = loop

    if (_currentBgm) {
      _currentBgm.stop()
      _currentBgm.destroy()
      _currentBgm = null
    }
    if (gameState.muted) return
    try {
      _currentBgm = scene.sound.add(key, { loop, volume: 0.5 })
      _currentBgm.play()
    } catch {
      // Arquivo de áudio não encontrado ou não carregado — jogo continua sem BGM
      _currentBgm = null
    }
  },

  stopBgm(): void {
    if (_currentBgm) {
      _currentBgm.stop()
      _currentBgm.destroy()
      _currentBgm = null
    }
    _lastBgmKey = null
    _lastBgmScene = null
  },

  setMuted(muted: boolean): void {
    gameState.muted = muted
    if (muted) {
      // Para o BGM mas mantém _lastBgm* para retomar depois
      if (_currentBgm) {
        _currentBgm.stop()
        _currentBgm.destroy()
        _currentBgm = null
      }
    } else if (_lastBgmKey && _lastBgmScene) {
      // Retoma o BGM que estava tocando antes do mute
      try {
        _currentBgm = _lastBgmScene.sound.add(_lastBgmKey, { loop: _lastBgmLoop, volume: 0.5 })
        _currentBgm.play()
      } catch {
        // Cena pode ter sido destruída — próxima transição vai retomar o BGM
        _currentBgm = null
        _lastBgmKey = null
        _lastBgmScene = null
      }
    }
  },
}
