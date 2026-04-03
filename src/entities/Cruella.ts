import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from './Enemy'

export class Cruella extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key
  private barkCooldown: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.CRUELLA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.setScale(2)
    // Smaller body prevents tile-seam stuttering
    this.setBodySize(18, 22)
    this.setOffset(5, 3)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    if (!scene.anims.exists('cruella-idle')) {
      scene.anims.create({ key: 'cruella-idle', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [0] }), frameRate: 1, repeat: -1 })
      scene.anims.create({ key: 'cruella-walk', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [1, 2, 3, 4] }), frameRate: 8, repeat: -1 })
      scene.anims.create({ key: 'cruella-jump', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [5] }), frameRate: 1, repeat: -1 })
    }
    this.play('cruella-idle')
  }

  update(speedBonus: number = 0): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down
    const speed = PHYSICS.CRUELLA_SPEED + speedBonus
    let moving = false

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
      moving = true
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
      moving = true
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && onGround) {
      const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
        ? PHYSICS.JUMP_VELOCITY * 1.45
        : PHYSICS.JUMP_VELOCITY
      this.setVelocityY(jumpVel)
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.barkCooldown) {
      this.bark()
    }

    // Animation
    if (!onGround) {
      this.play('cruella-jump', true)
    } else if (moving) {
      this.play('cruella-walk', true)
    } else {
      this.play('cruella-idle', true)
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
