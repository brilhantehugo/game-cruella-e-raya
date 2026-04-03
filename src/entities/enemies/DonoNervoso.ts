import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

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
    const dx = this.targetX - this.x
    if (Math.abs(dx) > 8) {
      this.direction = dx > 0 ? 1 : -1
      this.setVelocityX(this.direction * this.speed)
      this.setFlipX(this.direction === -1)
    } else {
      this.setVelocityX(0)
    }
  }
}
