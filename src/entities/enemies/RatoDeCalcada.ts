import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class RatoDeCalcada extends Enemy {
  private changeTimer: number = 0
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RATO, 1, 140)
    this.setVelocityX(this.speed)
  }
  update(time: number, _delta: number): void {
    if (this.isStunned() || this.isFleeing) return
    if (time > this.changeTimer) {
      this.direction *= -1
      this.changeTimer = time + 1000 + Math.random() * 2000
    }
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.left)  this.direction =  1
    if (body.blocked.right) this.direction = -1
    this.setVelocityX(this.direction * this.speed)
    this.setFlipX(this.direction === -1)
  }
}
