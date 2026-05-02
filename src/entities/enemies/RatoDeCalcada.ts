import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'

type RatoState = 'PATROL' | 'CHARGE' | 'DASH' | 'RECOVERY'

const TRIGGER_RADIUS = 150
const DASH_SPEED     = 400

const WINDOW_CRUELLA: CounterWindow = { character: 'cruella', state: 'CHARGE', windowMs: 350, type: 'bark' }
const WINDOW_RAYA:    CounterWindow = { character: 'raya',    state: 'DASH',   windowMs: 200, type: 'jump' }

export class RatoDeCalcada extends Enemy {
  private _state: RatoState = 'PATROL'
  private _stateAt: number = 0
  private _activeWindow: CounterWindow | null = null
  private _windowAt: number = 0
  private _outline: Phaser.GameObjects.Graphics | null = null
  private _playerX: number = 0
  private _playerY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RATO, 1, 60)
    this.setScale(1.4)
    this.setVelocityX(this.speed)
    this.play('rato_idle')
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  tryCounter(character: 'raya' | 'cruella', type: 'bark' | 'dash' | 'jump'): boolean {
    const now = this.scene.time.now
    const ok = checkCounterWindow(this._activeWindow, this._windowAt, now, character, type)
    if (ok) {
      this._clearWindow()
      const duration = character === 'cruella' ? 1500 : 600
      this.stun(duration)
      this._toState('RECOVERY')
    }
    return ok
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    if (this.isStunned() || this.isFleeing) { this._clearWindow(); return }

    const body = this.body as Phaser.Physics.Arcade.Body
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const now = this.scene.time.now

    switch (this._state) {
      case 'PATROL': {
        if (body.blocked.left)  this.direction = 1
        if (body.blocked.right) this.direction = -1
        this.setVelocityX(this.direction * this.speed)
        this.setFlipX(this.direction === -1)

        if (dist <= TRIGGER_RADIUS) {
          this._toState('CHARGE')
          this._openWindow(WINDOW_CRUELLA)
          body.setVelocityX(0)
          this.direction = this._playerX > this.x ? 1 : -1
        }
        break
      }

      case 'CHARGE': {
        body.setVelocityX(0)
        this._updateOutline(0x00ffff)

        if (now - this._stateAt >= 350) {
          this._clearWindow()
          this._toState('DASH')
          this._openWindow(WINDOW_RAYA)
          this.setVelocityX(this.direction * DASH_SPEED)
          this.setFlipX(this.direction === -1)
        }
        break
      }

      case 'DASH': {
        this._updateOutline(0xff8800)

        if (body.blocked.left || body.blocked.right) {
          this._clearWindow()
          this._toState('RECOVERY')
          break
        }
        if (now - this._stateAt >= 200) {
          this._clearWindow()
          this._toState('RECOVERY')
        }
        break
      }

      case 'RECOVERY': {
        this._clearWindow()
        body.setVelocityX(0)
        if (now - this._stateAt >= 800) {
          this._toState('PATROL')
          this.setVelocityX(this.direction * this.speed)
        }
        break
      }
    }
  }

  private _toState(s: RatoState): void {
    this._state = s
    this._stateAt = this.scene.time.now
  }

  private _openWindow(w: CounterWindow): void {
    this._activeWindow = w
    this._windowAt = this.scene.time.now
  }

  private _clearWindow(): void {
    this._activeWindow = null
    this._destroyOutline()
  }

  private _updateOutline(color: number): void {
    if (!this._outline) {
      this._outline = this.scene.add.graphics()
      this._outline.setDepth(6)
    }
    this._outline.clear()
    const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now * 0.01)
    this._outline.lineStyle(2, color, pulse)
    this._outline.strokeRect(
      this.x - this.displayWidth / 2 - 2,
      this.y - this.displayHeight / 2 - 2,
      this.displayWidth + 4,
      this.displayHeight + 4,
    )
  }

  private _destroyOutline(): void {
    if (this._outline?.active) this._outline.destroy()
    this._outline = null
  }
}
