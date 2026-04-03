import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { Enemy } from './Enemy'

export class Cruella extends Phaser.Physics.Arcade.Sprite {
  private onGround: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key
  private barkCooldown: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.CRUELLA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
  }

  setOnGround(value: boolean): void {
    this.onGround = value
  }

  update(speedBonus: number = 0): void {
    const speed = PHYSICS.CRUELLA_SPEED + speedBonus

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.onGround) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.barkCooldown) {
      this.bark()
    }
  }

  bark(): void {
    this.barkCooldown = true
    this.emit('bark', this.x, this.y)
    this.scene.time.delayedCall(1500, () => { this.barkCooldown = false })
  }

  checkIntimidation(enemies: Enemy[]): void {
    enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist <= PHYSICS.BARK_RADIUS * 1.5 && Math.random() < 0.02) {
        enemy.flee(this.x)
      }
    })
  }
}
