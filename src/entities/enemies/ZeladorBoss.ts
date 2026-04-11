import Phaser from 'phaser'
import { Enemy } from '../Enemy'
import { KEYS } from '../../constants'

type Phase = 1 | 2 | 3

export class ZeladorBoss extends Enemy {
  private readonly MAX_HP = 12
  private _phase: Phase = 1
  private _isDying = false
  private _playerX = 400
  private _playerY = 352
  private _attackTimer = 3000
  private _slideTimer = 5000
  private _minionTimer = 6000
  private _isSliding = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.ZELADOR_BOSS, 12, 90)
    this.setScale(2)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 28).setOffset(2, 2)
    this.setCollideWorldBounds(true)
    this.setVelocityX(90)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  update(_time: number, delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()
    this._handlePatrol()

    this._attackTimer -= delta
    if (this._attackTimer <= 0) {
      this._doAttack()
      this._attackTimer = this._phase === 1 ? 3000 : this._phase === 2 ? 2500 : 2000
    }

    if (this._phase >= 2) {
      this._slideTimer -= delta
      if (this._slideTimer <= 0 && !this._isSliding) {
        this._doSlide()
        this._slideTimer = 5000
      }
    }

    if (this._phase === 3) {
      this._minionTimer -= delta
      if (this._minionTimer <= 0) {
        this.emit('spawnMinion', { x: this.x + (this.direction === 1 ? 80 : -80), y: this.y })
        this._minionTimer = 6000
      }
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.67 && this._phase < 2) {
      this._phase = 2
      this.speed = 130
      this.setTint(0xff8800)
    }
    if (hpPct <= 0.34 && this._phase < 3) {
      this._phase = 3
      this.speed = 160
      this.setTint(0xff4444)
    }
  }

  private _handlePatrol(): void {
    if (this._isSliding) return
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.right) this.direction = -1
    if (body.blocked.left)  this.direction = 1
    body.setVelocityX(this.speed * this.direction)
    this.setFlipX(this.direction === -1)
  }

  private _doAttack(): void {
    const count = this._phase === 1 ? 1 : 2
    for (let i = 0; i < count; i++) {
      const dx = this._playerX - this.x
      const vx = Math.sign(dx) * 200
      this.scene.time.delayedCall(i * 150, () => {
        if (!this.active) return
        this.emit('spawnChave', { x: this.x, y: this.y - 8, vx, vy: -180 })
      })
    }
  }

  private _doSlide(): void {
    this._isSliding = true
    const body = this.body as Phaser.Physics.Arcade.Body
    const dir = Math.sign(this._playerX - this.x) || 1
    this.setTint(0xffff00)
    body.setVelocityX(300 * dir)
    this.scene.cameras.main.shake(80, 0.004)
    this.scene.time.delayedCall(400, () => {
      if (!this.active) return
      this._isSliding = false
      if      (this._phase === 3) this.setTint(0xff4444)
      else if (this._phase === 2) this.setTint(0xff8800)
      else                        this.clearTint()
    })
  }

  protected onDeath(): void {
    this._isDying = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    this.scene.tweens.add({
      targets: this,
      scaleX: 0, scaleY: 0, alpha: 0, angle: 180,
      duration: 900,
      ease: 'Power2',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
