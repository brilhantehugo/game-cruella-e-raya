import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'

type PomboState = 'PATROL_FLY' | 'HOVER' | 'SWOOP' | 'ASCEND'

const SWOOP_TRIGGER_HORIZ = 80   // px horizontal distance to trigger hover
const HOVER_ALTITUDE      = 120  // px below base Y to swoop to
const SWOOP_SPEED_Y       = 400  // px/s downward during swoop
const FLY_SPEED           = 100  // px/s in PATROL_FLY

const WINDOW_CRUELLA: CounterWindow = { character: 'cruella', state: 'HOVER',      windowMs: 300,  type: 'bark' }
const WINDOW_RAYA:    CounterWindow = { character: 'raya',    state: 'PATROL_FLY', windowMs: 9999, type: 'jump' }

export class PomboAgitado extends Enemy {
  private _baseY: number
  private _state: PomboState = 'PATROL_FLY'
  private _stateAt: number = 0
  private _activeWindow: CounterWindow | null = null
  private _windowAt: number = 0
  private _outline: Phaser.GameObjects.Graphics | null = null
  private _playerX: number = 0
  private _playerY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.POMBO, 1, FLY_SPEED)
    this._baseY = y
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setVelocityX(this.speed)
    this._openWindow(WINDOW_RAYA)
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
      if (character === 'cruella') {
        this.stun(1500)
        this._toState('ASCEND')
      }
    }
    return ok
  }

  update(time: number, _delta: number): void {
    if (!this.active) return
    if (this.isStunned()) { this._clearWindow(); return }

    const body = this.body as Phaser.Physics.Arcade.Body
    const now = this.scene.time.now
    const horizDist = Math.abs(this.x - this._playerX)
    const playerBelow = this._playerY > this.y

    switch (this._state) {
      case 'PATROL_FLY': {
        if (body.blocked.left)  this.direction = 1
        if (body.blocked.right) this.direction = -1
        this.setVelocityX(this.direction * FLY_SPEED)
        this.y = this._baseY + Math.sin(time * 0.003) * 12
        this._updateOutline(0x00ffff)
        this.setFlipX(this.direction === -1)

        if (playerBelow && horizDist <= SWOOP_TRIGGER_HORIZ) {
          this._clearWindow()
          this._toState('HOVER')
          this._openWindow(WINDOW_CRUELLA)
          body.setVelocityX(0)
          body.setVelocityY(0)
        }
        break
      }

      case 'HOVER': {
        body.setVelocityX(0)
        body.setVelocityY(0)
        this._updateOutline(0x00ffff)

        if (now - this._stateAt >= 300) {
          this._clearWindow()
          this._toState('SWOOP')
          body.setVelocityY(SWOOP_SPEED_Y)
        }
        break
      }

      case 'SWOOP': {
        this._clearWindow()
        this._destroyOutline()
        if (this.y >= this._baseY + HOVER_ALTITUDE) {
          this._toState('ASCEND')
          body.setVelocityY(-SWOOP_SPEED_Y * 0.8)
        }
        break
      }

      case 'ASCEND': {
        if (this.y <= this._baseY) {
          body.setVelocityY(0)
          this.y = this._baseY
          this._toState('PATROL_FLY')
          this._openWindow(WINDOW_RAYA)
        }
        break
      }
    }
  }

  private _toState(s: PomboState): void {
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