import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from './Enemy'
import { SoundManager } from '../audio/SoundManager'

export class Cruella extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key
  private barkCooldown: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.CRUELLA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.setScale(1.2)
    // Body centered on the dog within the 48×48 MCP canvas
    this.setBodySize(24, 28)
    this.setOffset(12, 14)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // Frame map (PNG spritesheet 544×32, 17 frames × 32px):
    //   idle  → 0–1  | walk → 2–5  | run  → 6–9
    //   jump  → 10–11| bark → 12–13| stun → 14 | death → 15–16
    if (!scene.anims.exists('cruella-idle')) {
      scene.anims.create({ key: 'cruella-idle',  frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [0, 1] }),          frameRate: 2,  repeat: -1 })
      scene.anims.create({ key: 'cruella-walk',  frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [2, 3, 4, 5] }),    frameRate: 8,  repeat: -1 })
      scene.anims.create({ key: 'cruella-run',   frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [6, 7, 8, 9] }),    frameRate: 12, repeat: -1 })
      scene.anims.create({ key: 'cruella-jump',  frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [10, 11] }),        frameRate: 6,  repeat: -1 })
      scene.anims.create({ key: 'cruella-bark',  frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [12, 13] }),        frameRate: 6,  repeat: 0  })
      scene.anims.create({ key: 'cruella-stun',  frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [14] }),            frameRate: 1,  repeat: -1 })
      scene.anims.create({ key: 'cruella-death', frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [15, 16] }),        frameRate: 4,  repeat: 0  })
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
      SoundManager.play('jump')
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
    SoundManager.play('barkAbility')
    // Atualiza cooldown no GameState para UIScene exibir
    gameState.abilityUsedAt = this.scene.time.now
    gameState.abilityCooldownMs = 1500
    this.barkCooldown = true
    this.play('cruella-bark', true)
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
