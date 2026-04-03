import Phaser from 'phaser'

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected hp: number
  protected speed: number
  protected direction: number = 1
  protected stunUntil: number = 0
  protected isFleeing: boolean = false

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    texture: string,
    hp: number,
    speed: number
  ) {
    super(scene, x, y, texture)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.hp = hp
    this.speed = speed
    this.setCollideWorldBounds(true)
  }

  takeDamage(amount: number = 1): void {
    this.hp -= amount
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => this.clearTint())
    if (this.hp <= 0) this.onDeath()
  }

  stun(duration: number): void {
    this.stunUntil = this.scene.time.now + duration
    this.setVelocityX(0)
  }

  flee(fromX: number): void {
    this.isFleeing = true
    const dir = this.x > fromX ? 1 : -1
    this.setVelocityX(dir * this.speed * 1.5)
    this.scene.time.delayedCall(2000, () => { this.isFleeing = false })
  }

  protected onDeath(): void {
    this.emit('died', this)
    this.destroy()
  }

  isStunned(): boolean {
    return this.scene.time.now < this.stunUntil
  }

  abstract update(time: number, delta: number): void
}
