import Phaser from 'phaser'
import { KEYS } from '../constants'

export class Projectile extends Phaser.Physics.Arcade.Image {
  private bounces: number = 0
  private maxBounces: number

  constructor(scene: Phaser.Scene, x: number, y: number, type: 'bola' | 'frisbee', dirX: number) {
    super(scene, x, y, type === 'bola' ? KEYS.BOLA : KEYS.FRISBEE)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.maxBounces = type === 'frisbee' ? 2 : 0
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(type === 'bola')
    this.setVelocityX(dirX * 400)
    if (type === 'frisbee') this.setVelocityY(-100)
    scene.time.delayedCall(3000, () => { if (this.active) this.destroy() })
  }

  onWallHit(): void {
    if (this.bounces >= this.maxBounces) { this.destroy(); return }
    this.bounces++
    this.setVelocityX(-(this.body as Phaser.Physics.Arcade.Body).velocity.x)
  }
}
