import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { BackgroundTheme } from '../levels/LevelData'

export interface AmbientConfig {
  type: 'rain' | 'dust' | 'leaves' | 'wind' | 'acvent'
  maxCount: number
  intervalMs: number
  colors: number[]
  alphaMin: number
  alphaMax: number
  speedBase: number
}

export function getAmbientConfig(theme: BackgroundTheme): AmbientConfig | null {
  switch (theme) {
    case 'rua_noite':
      return { type: 'rain',   maxCount: 35, intervalMs: 180, colors: [0xaaddff],                     alphaMin: 0.35, alphaMax: 0.55, speedBase: 200 }
    case 'apartamento':
      return { type: 'dust',   maxCount: 18, intervalMs: 350, colors: [0xfff8e7, 0xffe4c4],           alphaMin: 0.20, alphaMax: 0.35, speedBase: 20 }
    case 'apto_boss':
      return { type: 'dust',   maxCount: 14, intervalMs: 400, colors: [0xfff8e7, 0xffe4c4],           alphaMin: 0.20, alphaMax: 0.35, speedBase: 20 }
    case 'rua':
      return { type: 'leaves', maxCount: 12, intervalMs: 500, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.30, alphaMax: 0.55, speedBase: 60 }
    case 'praca':
      return { type: 'leaves', maxCount: 10, intervalMs: 600, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.30, alphaMax: 0.55, speedBase: 60 }
    case 'patio':
      return { type: 'leaves', maxCount: 8,  intervalMs: 700, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.25, alphaMax: 0.45, speedBase: 60 }
    case 'telhado':
      return { type: 'wind',   maxCount: 15, intervalMs: 300, colors: [0x888888, 0xaaaaaa],           alphaMin: 0.30, alphaMax: 0.50, speedBase: 140 }
    case 'exterior':
      return { type: 'wind',   maxCount: 12, intervalMs: 350, colors: [0x888888, 0xaaaaaa],           alphaMin: 0.30, alphaMax: 0.50, speedBase: 140 }
    case 'mercado':
      return { type: 'acvent', maxCount: 12, intervalMs: 400, colors: [0xcceeff],                     alphaMin: 0.20, alphaMax: 0.35, speedBase: 15 }
    case 'boss':
    default:
      return null
  }
}

export class AmbientFX {
  private _timer: Phaser.Time.TimerEvent | null = null
  private _particles: Phaser.GameObjects.Graphics[] = []
  private _count = 0

  constructor(private scene: Phaser.Scene, theme: BackgroundTheme) {
    const cfg = getAmbientConfig(theme)
    if (!cfg) return

    this._timer = scene.time.addEvent({
      delay: cfg.intervalMs,
      loop: true,
      callback: () => this._spawn(cfg),
    })
  }

  private _spawn(cfg: AmbientConfig): void {
    if (this._count >= cfg.maxCount) return
    switch (cfg.type) {
      case 'rain':   this._spawnRain(cfg);   break
      case 'dust':   this._spawnDust(cfg);   break
      case 'leaves': this._spawnLeaves(cfg); break
      case 'wind':   this._spawnWind(cfg);   break
      case 'acvent': this._spawnACVent(cfg); break
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private _randomColor(colors: number[]): number {
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private _randomAlpha(cfg: AmbientConfig): number {
    return cfg.alphaMin + Math.random() * (cfg.alphaMax - cfg.alphaMin)
  }

  private _randomSpeed(cfg: AmbientConfig): number {
    return cfg.speedBase * (0.8 + Math.random() * 0.4)
  }

  private _register(g: Phaser.GameObjects.Graphics): void {
    this._particles.push(g)
    this._count++
  }

  private _release(g: Phaser.GameObjects.Graphics): void {
    const idx = this._particles.indexOf(g)
    if (idx !== -1) this._particles.splice(idx, 1)
    this._count = Math.max(0, this._count - 1)
    if (g.active) g.destroy()
  }

  // ── Spawn por tipo ────────────────────────────────────────────────────────────

  /** Chuva fina diagonal 15° — rua_noite */
  private _spawnRain(cfg: AmbientConfig): void {
    const RAD = (15 * Math.PI) / 180
    const speed    = this._randomSpeed(cfg)
    const startX   = Math.random() * GAME_WIDTH
    const startY   = -16
    const distance = GAME_HEIGHT + 32
    const duration = (distance / speed) * 1000

    const g = this.scene.add.graphics()
    g.setScrollFactor(0).setDepth(-4).setAlpha(this._randomAlpha(cfg))
    g.lineStyle(1, this._randomColor(cfg.colors), 1)
    g.lineBetween(0, 0, Math.sin(RAD) * 10, Math.cos(RAD) * 10)
    g.setPosition(startX, startY)

    this._register(g)
    this.scene.tweens.add({
      targets: g,
      x: startX + Math.sin(RAD) * distance,
      y: startY + distance,
      duration,
      ease: 'Linear',
      onComplete: () => this._release(g),
    })
  }

  /** Motes de poeira flutuantes — apartamento, apto_boss */
  private _spawnDust(cfg: AmbientConfig): void {
    const speed  = this._randomSpeed(cfg)
    const startX = Math.random() * GAME_WIDTH
    const startY = GAME_HEIGHT * 0.3 + Math.random() * GAME_HEIGHT * 0.5
    const r      = 1 + Math.random() * 2
    const driftX = (Math.random() - 0.3) * 30
    const driftY = -(speed * 4)
    const duration = (Math.abs(driftY) / speed) * 1000 * 2

    const g = this.scene.add.graphics()
    g.setScrollFactor(0).setDepth(-4).setAlpha(this._randomAlpha(cfg))
    g.fillStyle(this._randomColor(cfg.colors), 1)
    g.fillCircle(0, 0, r)
    g.setPosition(startX, startY)

    this._register(g)
    this.scene.tweens.add({
      targets: g,
      x: startX + driftX,
      y: startY + driftY,
      alpha: 0,
      duration,
      ease: 'Linear',
      onComplete: () => this._release(g),
    })
  }

  /** Folhas caindo com rotação — rua, praca, patio */
  private _spawnLeaves(cfg: AmbientConfig): void {
    const speed    = this._randomSpeed(cfg)
    const startX   = Math.random() * GAME_WIDTH
    const startY   = -8
    const distance = GAME_HEIGHT + 16
    const duration = (distance / speed) * 1000
    const driftX   = (Math.random() - 0.5) * 80
    const size     = 3 + Math.random() * 2
    const spin     = 360 * (Math.random() > 0.5 ? 1 : -1)

    const g = this.scene.add.graphics()
    g.setScrollFactor(0).setDepth(-4).setAlpha(this._randomAlpha(cfg))
    g.fillStyle(this._randomColor(cfg.colors), 1)
    g.fillRect(-size / 2, -size / 2, size, size)
    g.setPosition(startX, startY)

    this._register(g)
    this.scene.tweens.add({
      targets: g,
      x: startX + driftX,
      y: startY + distance,
      angle: spin,
      duration,
      ease: 'Linear',
      onComplete: () => this._release(g),
    })
  }

  /** Detritos horizontais de vento — telhado, exterior */
  private _spawnWind(cfg: AmbientConfig): void {
    const speed  = this._randomSpeed(cfg)
    const goLeft = Math.random() > 0.5
    const startX = goLeft ? GAME_WIDTH + 8 : -8
    const endX   = goLeft ? -8 : GAME_WIDTH + 8
    const startY = GAME_HEIGHT * 0.1 + Math.random() * GAME_HEIGHT * 0.8
    const duration = ((GAME_WIDTH + 16) / speed) * 1000

    const g = this.scene.add.graphics()
    g.setScrollFactor(0).setDepth(-4).setAlpha(this._randomAlpha(cfg))
    g.fillStyle(this._randomColor(cfg.colors), 1)
    g.fillRect(0, 0, 4, 1)
    g.setPosition(startX, startY)

    this._register(g)
    this.scene.tweens.add({
      targets: g,
      x: endX,
      duration,
      ease: 'Linear',
      onComplete: () => this._release(g),
    })
  }

  /** Partículas frias de ar-condicionado — mercado */
  private _spawnACVent(cfg: AmbientConfig): void {
    const speed    = this._randomSpeed(cfg)
    const startX   = Math.random() * GAME_WIDTH
    const startY   = GAME_HEIGHT - 20
    const driftX   = (Math.random() - 0.5) * 20
    const driftY   = -(speed * 5)
    const r        = 1 + Math.random() * 1.5
    const duration = (Math.abs(driftY) / speed) * 1000

    const g = this.scene.add.graphics()
    g.setScrollFactor(0).setDepth(-4).setAlpha(this._randomAlpha(cfg))
    g.fillStyle(this._randomColor(cfg.colors), 1)
    g.fillCircle(0, 0, r)
    g.setPosition(startX, startY)

    this._register(g)
    this.scene.tweens.add({
      targets: g,
      x: startX + driftX,
      y: startY + driftY,
      alpha: 0,
      duration,
      ease: 'Sine.easeOut',
      onComplete: () => this._release(g),
    })
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────────

  destroy(): void {
    if (this._timer) { this._timer.destroy(); this._timer = null }
    const toDestroy = [...this._particles]
    toDestroy.forEach(p => { if (p.active) p.destroy() })
    this._particles = []
    this._count = 0
  }
}
