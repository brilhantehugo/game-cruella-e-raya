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
    this.setScale(1.4)
    // Body bottom-aligned: 28×38 local → 39×53px world at scale 1.4
    // offset(10,10) alinha o rodapé do body com o rodapé do sprite (48-38=10)
    const rayaBody = this.body as Phaser.Physics.Arcade.Body
    rayaBody.setSize(28, 38)
    rayaBody.setOffset(10, 10)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // Register animations (safe to call multiple times — Phaser skips if already exists)
    // Frame map (PNG spritesheet 544×32, 17 frames × 32px):
    //   idle  → 0–1  | walk → 2–5  | run  → 6–9
    //   jump  → 10–11| bark → 12–13| stun → 14 | death → 15–16
    if (!scene.anims.exists('raya-idle')) {
      scene.anims.create({ key: 'raya-idle',  frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [0, 1] }),          frameRate: 2,  repeat: -1 })
      scene.anims.create({ key: 'raya-walk',  frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [2, 3, 4, 5] }),    frameRate: 8,  repeat: -1 })
      scene.anims.create({ key: 'raya-run',   frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [6, 7, 8, 9] }),    frameRate: 12, repeat: -1 })
      scene.anims.create({ key: 'raya-jump',  frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [10, 11] }),        frameRate: 6,  repeat: -1 })
      scene.anims.create({ key: 'raya-bark',  frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [12, 13] }),        frameRate: 6,  repeat: -1 })
      scene.anims.create({ key: 'raya-stun',  frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [14] }),            frameRate: 1,  repeat: -1 })
      scene.anims.create({ key: 'raya-death', frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [15, 16] }),        frameRate: 4,  repeat: 0  })
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
    gameState.abilityCooldownMs = PHYSICS.DASH_COOLDOWN

    // Emite evento para Player registrar janela de combo
    this.emit('dashed', { dir, time: this.scene.time.now })

    this.isDashing = true
    this.dashCooldown = true
    this.play('raya-run', true)
    this.setVelocityX(dir * PHYSICS.DASH_VELOCITY)
    this.setVelocityY(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    this.scene.time.delayedCall(PHYSICS.DASH_DURATION, () => {
      this.isDashing = false
      body.setAllowGravity(true)
    })

    this.scene.time.delayedCall(PHYSICS.DASH_COOLDOWN, () => {
      this.dashCooldown = false
    })
  }

  getIsDashing(): boolean { return this.isDashing }
}
