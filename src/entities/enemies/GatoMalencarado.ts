import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class GatoMalencarado extends Enemy {
  private patrolStart: number
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.GATO, 1, 80)
    this.patrolStart = x
    this.setVelocityX(this.speed)
  }
  update(_time: number, _delta: number): void {
    if (this.isStunned() || this.isFleeing) return
    const body = this.body as Phaser.Physics.Arcade.Body
    if (this.x > this.patrolStart + 128) this.direction = -1
    else if (this.x < this.patrolStart - 128) this.direction = 1
    if (body.blocked.left) this.direction = 1
    if (body.blocked.right) this.direction = -1
    this.setVelocityX(this.direction * this.speed)
    this.setFlipX(this.direction === -1)
  }
}
