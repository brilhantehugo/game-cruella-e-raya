import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

type Phase = 1 | 2 | 3

export class Aspirador extends Enemy {
  private readonly MAX_HP = 8
  private phase: Phase = 1
  private actionTimer: number = 0
  private _isDying = false
  private _chargeDir: number = 1

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.ASPIRADOR, 8, 70)
    // Sprite: 36×20px — robô disco achatado. Ajusta corpo físico para formato correto.
    this.setScale(2.5)
    // Corpo físico ligeiramente menor que o sprite para melhor jogabilidade
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(32, 14).setOffset(2, 4)
    this.setVelocityX(70)
  }

  /** Caps single-hit damage — prevents instant kills */
  takeDamage(amount: number = 1): void {
    if (this._isDying) return
    super.takeDamage(Math.min(amount, 2))
  }

  update(time: number, _delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()

    const body = this.body as Phaser.Physics.Arcade.Body

    // Bounce off walls
    if (body.blocked.left)  { this.direction = 1;  this.setVelocityX(this.speed) }
    if (body.blocked.right) { this.direction = -1; this.setVelocityX(-this.speed) }
    if (Math.abs(body.velocity.x) < 10) this.setVelocityX(this.direction * this.speed)

    this.setFlipX(this.direction === -1)

    // Phase abilities
    if (time > this.actionTimer) {
      switch (this.phase) {
        case 1: this._vacuumPulse(); this.actionTimer = time + 3000; break
        case 2: this._charge();      this.actionTimer = time + 2000; break
        case 3: this._charge();      this._vacuumPulse(); this.actionTimer = time + 1500; break
      }
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.25 && this.phase < 3) {
      this.phase = 3
      this.speed = 160
      this.setTint(0xff4444)
    } else if (hpPct <= 0.5 && this.phase < 2) {
      this.phase = 2
      this.speed = 120
      this.setTint(0xff8800)
    }
  }

  /** Visual vacuum pulse — expands circle ring */
  private _vacuumPulse(): void {
    if (!this.scene || !this.active) return
    const wave = this.scene.add.graphics()
    wave.lineStyle(3, 0x22ccff, 0.8)
    wave.strokeCircle(0, 0, 8)
    wave.setPosition(this.x, this.y)
    this.scene.tweens.add({
      targets: wave,
      scaleX: 8, scaleY: 8,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => { if (wave.active) wave.destroy() },
    })
    // Second smaller ring
    const wave2 = this.scene.add.graphics()
    wave2.lineStyle(2, 0xaaeeff, 0.6)
    wave2.strokeCircle(0, 0, 8)
    wave2.setPosition(this.x, this.y)
    this.scene.tweens.add({
      targets: wave2,
      scaleX: 5, scaleY: 5,
      alpha: 0,
      delay: 150,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => { if (wave2.active) wave2.destroy() },
    })
  }

  /** Quick charge in current movement direction */
  private _charge(): void {
    if (!this.scene || !this.active) return
    this._chargeDir = this.direction
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(this._chargeDir * 380)
    this.setTint(this.phase === 3 ? 0xff2200 : 0xff8800)
    this.scene.time.delayedCall(300, () => {
      if (this.active) {
        this.clearTint()
        if (this.phase === 3) this.setTint(0xff4444)
        else if (this.phase === 2) this.setTint(0xff8800)
        body.setVelocityX(this.direction * this.speed)
      }
    })
    // Screen shake on charge
    this.scene.cameras.main.shake(100, 0.005)
  }

  protected onDeath(): void {
    this._isDying = true
    ;(this.body as Phaser.Physics.Arcade.Body).setEnable(false)
    this.setTint(0x22ccff)
    // Spin and shrink death animation
    this.scene.tweens.add({
      targets: this,
      angle: 720,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
