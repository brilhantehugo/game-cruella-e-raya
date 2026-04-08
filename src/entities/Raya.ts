import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class Raya extends Phaser.Physics.Arcade.Sprite {
  private jumpsLeft: number = 2
  private isDashing: boolean = false
  private dashCooldown: boolean = false
  private wasGrounded: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RAYA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.setScale(1.8)
    // Smaller physics body prevents catching on tile seams
    this.setBodySize(20, 24)
    this.setOffset(6, 4)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // Register animations (safe to call multiple times — Phaser skips if already exists)
    if (!scene.anims.exists('raya-idle')) {
      scene.anims.create({ key: 'raya-idle', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [0] }), frameRate: 1, repeat: -1 })
      scene.anims.create({ key: 'raya-walk', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [1, 2, 3, 4] }), frameRate: 8, repeat: -1 })
      scene.anims.create({ key: 'raya-jump', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [5] }), frameRate: 1, repeat: -1 })
    }
    this.play('raya-idle')
  }

  update(speedBonus: number = 0): void {
    if (this.isDashing) return

    const body = this.body as Phaser.Physics.Arcade.Body
    const onGround = body.blocked.down

    // Edge detection: just landed → reset double jump
    if (onGround && !this.wasGrounded) {
      this.jumpsLeft = 2
      this.emit('landed')
    }
    this.wasGrounded = onGround

    const speed = PHYSICS.RAYA_SPEED + speedBonus
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

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
      const jumpVel = gameState.hasPowerUp('pipoca', this.scene.time.now)
        ? PHYSICS.JUMP_VELOCITY * 1.45
        : PHYSICS.JUMP_VELOCITY
      this.setVelocityY(jumpVel)
      this.jumpsLeft--
      SoundManager.play(this.jumpsLeft === 0 ? 'doubleJump' : 'jump')
      this.emit('jumped')
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
      this.dash()
    }

    // Animation
    if (!onGround) {
      this.play('raya-jump', true)
    } else if (moving) {
      this.play('raya-walk', true)
    } else {
      this.play('raya-idle', true)
    }
  }

  private dash(): void {
    SoundManager.play('dashAbility')
    const dir = this.flipX ? -1 : 1

    // Atualiza cooldown no GameState para UIScene exibir
    gameState.abilityUsedAt = this.scene.time.now
    gameState.abilityCooldownMs = 800

    // Emite evento para Player registrar janela de combo
    this.emit('dashed', { dir, time: this.scene.time.now })

    this.isDashing = true
    this.dashCooldown = true
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
