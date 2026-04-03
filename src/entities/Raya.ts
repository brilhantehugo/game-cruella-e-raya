import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'

export class Raya extends Phaser.Physics.Arcade.Sprite {
  private jumpsLeft: number = 2
  private isDashing: boolean = false
  private dashCooldown: boolean = false
  private onGround: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RAYA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
  }

  setOnGround(value: boolean): void {
    if (value && !this.onGround) {
      this.jumpsLeft = 2
    }
    this.onGround = value
  }

  update(speedBonus: number = 0): void {
    if (this.isDashing) return

    const speed = PHYSICS.RAYA_SPEED + speedBonus

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
      this.jumpsLeft--
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
      this.dash()
    }
  }

  private dash(): void {
    this.isDashing = true
    this.dashCooldown = true
    const dir = this.flipX ? -1 : 1
    this.setVelocityX(dir * PHYSICS.DASH_VELOCITY)
    this.setVelocityY(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    this.scene.time.delayedCall(PHYSICS.DASH_DURATION, () => {
      this.isDashing = false
      body.setAllowGravity(true)
    })

    this.scene.time.delayedCall(800, () => {
      this.dashCooldown = false
    })
  }

  getIsDashing(): boolean { return this.isDashing }
}
