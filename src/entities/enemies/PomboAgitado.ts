import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class PomboAgitado extends Enemy {
  private baseY: number
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.POMBO, 1, 100)
    this.baseY = y
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setVelocityX(this.speed)
  }
  update(time: number, _delta: number): void {
    if (this.isStunned()) return
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.left) this.direction = 1
    if (body.blocked.right) this.direction = -1
    this.setVelocityX(this.direction * this.speed)
    this.y = this.baseY + Math.sin(time * 0.003) * 12
  }
}
