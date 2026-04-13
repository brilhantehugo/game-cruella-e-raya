import Phaser from 'phaser'
import { Enemy } from '../Enemy'
import { type LightSource } from '../../fx/SpotlightOverlay'
import { KEYS } from '../../constants'

// ── Pure helper (testable) ────────────────────────────────────────────────────

export function computeMotoBossPhase(hp: number, maxHp: number): 1 | 2 | 3 {
  const pct = hp / maxHp
  if (pct <= 0.34) return 3
  if (pct <= 0.67) return 2
  return 1
}

// ── Boss class ────────────────────────────────────────────────────────────────

const MAX_HP = 9   // 3 hits per phase × 3 phases

export class SegurancaMoto extends Enemy {
  private _phase: 1 | 2 | 3 = 1
  private _isDying = false
  private _playerX = 400
  private _playerY = 352
  private _laneTimer = 0
  private _dashTimer = 0
  private _jumpHitCooldown = 0   // ms — prevents double-counting a single jump

  // Base speeds per phase (px/s)
  private static readonly SPEEDS: Record<1 | 2 | 3, number> = { 1: 120, 2: 170, 3: 220 }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.SEGURANCA_MOTO, MAX_HP, 120)
    this.setScale(2.5)
    this.setFlipX(true)   // moto faces left (moving left)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(50, 32).setOffset(5, 8)
    this.setCollideWorldBounds(true)
    body.setVelocityX(-this.speed)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  /** World-space LightSource for the moto's farol (headlight). */
  getLightSource(): LightSource {
    const r = this._phase === 1 ? 140 : this._phase === 2 ? 110 : 80
    return {
      x:      this.x - 50,   // headlight is at the front (left side)
      y:      this.y - 8,
      type:   'circle',
      radius: r,
    }
  }

  /**
   * Called by GameScene when the player successfully jumps over the headlight.
   * Returns true if the hit was registered (not on cooldown).
   */
  registerJumpHit(): boolean {
    if (this._jumpHitCooldown > 0) return false
    this._jumpHitCooldown = 1200   // 1.2s cooldown between hits
    this.takeDamage(1)
    return true
  }

  override update(_time: number, delta: number): void {
    if (this._isDying || this.isStunned()) return

    // Cool down the jump-hit window
    this._jumpHitCooldown = Math.max(0, this._jumpHitCooldown - delta)

    // Phase transitions
    const newPhase = computeMotoBossPhase(this.hp, MAX_HP)
    if (newPhase !== this._phase) {
      this._phase = newPhase
      this.speed = SegurancaMoto.SPEEDS[newPhase]
      if (newPhase === 2) this.setTint(0xff8800)
      if (newPhase === 3) this.setTint(0xff4444)
    }

    const body = this.body as Phaser.Physics.Arcade.Body

    // Phase 2+: vertical lane changes
    if (this._phase >= 2) {
      this._laneTimer -= delta
      if (this._laneTimer <= 0) {
        const targetY = Phaser.Math.Between(280, 380)
        this.scene.tweens.add({ targets: this, y: targetY, duration: 400, ease: 'Sine.easeInOut' })
        this._laneTimer = Phaser.Math.Between(2500, 4000)
      }
    }

    // Phase 3: random speed dashes
    if (this._phase === 3) {
      this._dashTimer -= delta
      if (this._dashTimer <= 0) {
        body.setVelocityX(-this.speed * 1.8)
        this.scene.time.delayedCall(350, () => {
          if (this.active) body.setVelocityX(-this.speed)
        })
        this._dashTimer = Phaser.Math.Between(1800, 3000)
      }
    }

    // Normal movement (don't override if dash timer still counting down in phase 3)
    if (this._phase < 3 || this._dashTimer > 200) {
      body.setVelocityX(-this.speed)
    }
  }

  protected onDeath(): void {
    this._isDying = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    this.scene.cameras.main.shake(200, 0.008)
    this.scene.tweens.add({
      targets:  this,
      scaleX:   0, scaleY: 0, alpha: 0, angle: -180,
      duration: 900,
      ease:     'Power2',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
