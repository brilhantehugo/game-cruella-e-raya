import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

type Phase = 1 | 2 | 3

export class Drone extends Enemy {
  private readonly MAX_HP = 20
  private phase: Phase = 1
  private _isDying = false
  private _playerX: number = 400
  private _playerY: number = 200
  private _attackTimer: number = 3000

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.DRONE, 20, 100)
    this.setScale(2)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(28, 16).setOffset(2, 2).setGravityY(-800)
    this.setCollideWorldBounds(true)
    this.setVelocityX(100)
  }

  takeDamage(amount: number = 1): void {
    if (this._isDying) return
    super.takeDamage(Math.min(amount, 2))
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  update(time: number, _delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()

    const body = this.body as Phaser.Physics.Arcade.Body

    // Patrulha horizontal — rebate nas paredes
    if (body.blocked.left)  { this.direction = 1;  this.setVelocityX(this.speed) }
    if (body.blocked.right) { this.direction = -1; this.setVelocityX(-this.speed) }
    if (Math.abs(body.velocity.x) < 10) this.setVelocityX(this.direction * this.speed)

    this.setFlipX(this.direction === -1)

    // Ataques baseados em timer
    if (time > this._attackTimer) {
      if (this.phase === 1) {
        this._throwBomb()
      } else if (this.phase === 2) {
        this._throwBomb()
        this.scene.time.delayedCall(400, () => { if (this.active) this._throwBomb() })
      } else {
        this._throwBomb()
        this.scene.time.delayedCall(300, () => { if (this.active) this._throwLaser() })
      }
      this._attackTimer = time + (this.phase === 1 ? 3000 : this.phase === 2 ? 2200 : 2000)
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.34 && this.phase < 3) {
      this.phase = 3
      this.speed = 180
      this.setTint(0xff4444)
    } else if (hpPct <= 0.67 && this.phase < 2) {
      this.phase = 2
      this.speed = 140
      this.setTint(0xff8800)
    }
  }

  /** Lança bomba em arco descendente em direção ao jogador */
  private _throwBomb(): void {
    if (!this.scene || !this.active) return
    const dx = this._playerX - this.x
    const angle = Math.atan2(200, dx)
    const speed = 180
    const vx = Math.cos(angle) * speed
    const vy = -160
    this.emit('spawnBomb', { x: this.x, y: this.y + 8, vx, vy })
  }

  /** Lança laser horizontal reto em direção ao jogador */
  private _throwLaser(): void {
    if (!this.scene || !this.active) return
    const dx = this._playerX - this.x > 0 ? 1 : -1
    this.emit('spawnLaser', { x: this.x + dx * 16, y: this.y, vx: dx * 320, vy: 0 })
  }

  protected onDeath(): void {
    this._isDying = true
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setEnable(false)
    body.setGravityY(0)  // deixa cair naturalmente
    this.setTint(0xff4444)
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      angle: 180,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      },
    })
  }
}
