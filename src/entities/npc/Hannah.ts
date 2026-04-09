import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

/** Hannah — a dona do apartamento. Patrulha o cenário e é imune a danos. */
export class Hannah extends Enemy {
  override readonly isNPC = true
  private patrolLeft: number
  private patrolRight: number

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HANNAH, 999, 65)
    this.setScale(1.6)
    this.patrolLeft  = x - 200
    this.patrolRight = x + 200
    this.direction = -1
    this.setVelocityX(-this.speed)
  }

  /** Immune a danos — só pisca para indicar que não pode ser machucada */
  override takeDamage(_amount: number = 1): void {
    this.setTint(0xffcccc)
    this.scene.time.delayedCall(120, () => { if (this.active) this.clearTint() })
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    const body = this.body as Phaser.Physics.Arcade.Body

    if (body.blocked.left  || this.x <= this.patrolLeft)  {
      this.direction = 1
      this.setVelocityX(this.speed)
    } else if (body.blocked.right || this.x >= this.patrolRight) {
      this.direction = -1
      this.setVelocityX(-this.speed)
    }

    this.setFlipX(this.direction === -1)
  }
}
