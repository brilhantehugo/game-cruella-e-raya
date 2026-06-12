import Phaser from 'phaser'
import type { WorldDifficulty } from '../constants'
import { gameState } from '../GameState'

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly isNPC: boolean = false
  public hp: number
  public readonly maxHp: number
  protected speed: number
  protected direction: number = 1
  protected stunUntil: number = 0
  protected isFleeing: boolean = false

  // ── Difficulty scaling ────────────────────────────────────────────────────
  protected _packChase: boolean = false
  protected _longChase: boolean = false

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
    this.maxHp = hp
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
    // Refresh duration if already stunned — avoid stacking icons/listeners
    if (this.isStunned()) {
      this.stunUntil = this.scene.time.now + duration
      return
    }

    this.stunUntil = this.scene.time.now + duration
    this.setVelocityX(0)
    this.setTint(0xffdd00)

    // Floating daze icon that bobs above the enemy
    const stunIcon = this.scene.add.text(this.x, this.y - 30, '😵', { fontSize: '16px' })
    stunIcon.setDepth(10)
    const bobTween = gameState.reducedMotion
      ? null
      : this.scene.tweens.add({
          targets: stunIcon,
          y: stunIcon.y - 12,
          duration: 400,
          yoyo: true,
          repeat: -1,
        })

    // Tracker: follows enemy X each frame; tween owns Y (preserves bob animation)
    const tracker = () => {
      if (stunIcon.active) stunIcon.x = this.x
    }
    this.scene.events.on('preupdate', tracker)

    // On wake-up: remove tracker, stop tween, clear tint, reverse direction, destroy icon
    this.scene.time.delayedCall(duration, () => {
      this.scene.events.off('preupdate', tracker)
      bobTween?.stop()
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

  applyDifficulty(diff: WorldDifficulty): void {
    this.speed      *= diff.speedMult
    this._packChase  = diff.packChase
    this._longChase  = diff.longChase
  }

  isStunned(): boolean {
    return this.scene.time.now < this.stunUntil
  }

  /**
   * Contra-ataque: subclasses que reagem a bark/dash/jump sobrescrevem este método.
   * Default retorna false (inimigo não tem janela de counter).
   */
  tryCounter(_character: 'raya' | 'cruella', _type: 'bark' | 'dash' | 'jump'): boolean {
    return false
  }

  abstract update(time: number, delta: number): void
}
