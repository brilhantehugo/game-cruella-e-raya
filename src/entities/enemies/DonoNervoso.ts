import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { donoChaseVelocity } from '../../systems/EnemyMovement'

export class DonoNervoso extends Enemy {
  private targetX: number = 0
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.DONO, 999, 110)
  }
  setTarget(x: number): void { this.targetX = x }
  takeDamage(_amount: number = 1): void {
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => this.clearTint())
  }
  update(_time: number, _delta: number): void {
    if (this.isStunned()) return
    const body = this.body as Phaser.Physics.Arcade.Body
    const dx = this.targetX - this.x
    const vx = donoChaseVelocity(dx, this.speed, body.blocked.down)
    this.setVelocityX(vx)
    if (vx !== 0) {
      this.direction = vx > 0 ? 1 : -1
      this.setFlipX(this.direction === -1)
    }
  }
}
