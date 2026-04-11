import Phaser from 'phaser'

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly isNPC: boolean = false
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
    this.setScale(2)
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

    // Gold tint while stunned
    this.setTint(0xffdd00)

    // Floating daze icon that bobs above the enemy
    const stunIcon = this.scene.add.text(this.x, this.y - 30, '😵', { fontSize: '16px' })
    stunIcon.setDepth(10)
    this.scene.tweens.add({
      targets: stunIcon,
      y: stunIcon.y - 12,
      duration: 400,
      yoyo: true,
      repeat: -1,
    })

    // On wake-up: clear tint, reverse direction, destroy icon
    this.scene.time.delayedCall(duration, () => {
      if (!this.active) {
        if (stunIcon.active) stunIcon.destroy()
        return
      }
      this.clearTint()
      this.direction *= -1
      if (stunIcon.active) stunIcon.destroy()
    })
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

  getHp(): number { return this.hp }

  isStunned(): boolean {
    return this.scene.time.now < this.stunUntil
  }

  abstract update(time: number, delta: number): void
}
