import Phaser from 'phaser'
import { PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Raya } from './Raya'
import { Cruella } from './Cruella'
import { Enemy } from './Enemy'

export class Player {
  raya: Raya
  cruella: Cruella
  private tabKey: Phaser.Input.Keyboard.Key
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.raya = new Raya(scene, x, y)
    this.cruella = new Cruella(scene, x, y)
    this.tabKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)

    if (gameState.activeDog === 'cruella') {
      this.raya.setAlpha(0.35)
      this.raya.setActive(false)
      ;(this.raya.body as Phaser.Physics.Arcade.Body).setEnable(false)
    } else {
      gameState.activeDog = 'raya'
      this.cruella.setAlpha(0.35)
      this.cruella.setActive(false)
      ;(this.cruella.body as Phaser.Physics.Arcade.Body).setEnable(false)
    }
  }

  get active(): Raya | Cruella {
    return gameState.activeDog === 'raya' ? this.raya : this.cruella
  }

  get ghost(): Raya | Cruella {
    return gameState.activeDog === 'raya' ? this.cruella : this.raya
  }

  get x(): number { return this.active.x }
  get y(): number { return this.active.y }

  update(enemies: Enemy[]): void {
    const now = this.scene.time.now
    const speedBonus = (gameState.collarOfGold ? PHYSICS.COLLAR_GOLD_SPEED_BONUS : 0)
                     + (gameState.hasPowerUp('petisco', now) ? 90 : 0)

    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      if (gameState.swap(now)) {
        this._performSwap()
      }
    }

    if (gameState.activeDog === 'raya') {
      this.raya.update(speedBonus)
      this.cruella.checkIntimidation(enemies)
    } else {
      this.cruella.update(speedBonus)
    }

    const ghost = this.ghost
    ghost.setPosition(this.active.x - (this.active.flipX ? -24 : 24), this.active.y)
  }

  private _performSwap(): void {
    const prev = this.active
    const next = this.ghost

    next.setPosition(prev.x, prev.y)
    next.setVelocity(
      (prev.body as Phaser.Physics.Arcade.Body).velocity.x,
      (prev.body as Phaser.Physics.Arcade.Body).velocity.y
    )
    ;(next.body as Phaser.Physics.Arcade.Body).setEnable(true)
    next.setAlpha(1)
    next.setActive(true)

    prev.setAlpha(0.35)
    prev.setActive(false)
    ;(prev.body as Phaser.Physics.Arcade.Body).setEnable(false)

    this.scene.cameras.main.flash(80, 255, 255, 255)
  }

  takeDamage(): void {
    const now = this.scene.time.now
    const heartLost = gameState.takeDamage(now)
    if (heartLost) {
      this.scene.cameras.main.shake(200, 0.01)
    }
    this.active.setTint(0xff0000)
    this.scene.time.delayedCall(300, () => this.active.clearTint())
  }
}
