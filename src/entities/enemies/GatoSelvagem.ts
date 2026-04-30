import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { GatoMalencarado } from './GatoMalencarado'
import { isNearLight, type LightSource } from '../../fx/SpotlightOverlay'

// ── Pure state helper (testable) ─────────────────────────────────────────────

export type GSState = 'WANDER' | 'CHASE'

/**
 * Computes the next GatoSelvagem state.
 * @param current       Current state
 * @param nearLight     Whether any light source is within ACTIVATION_RADIUS
 * @param deactivateMs  Milliseconds remaining before forced return to WANDER
 */
export function gatoSelvagemNextState(
  current: GSState,
  nearLight: boolean,
  deactivateMs: number,
): GSState {
  if (nearLight) return 'CHASE'
  if (current === 'CHASE' && deactivateMs > 0) return 'CHASE'
  return 'WANDER'
}

// ── Phaser enemy class ────────────────────────────────────────────────────────

const ACTIVATION_RADIUS  = 200   // px — light must be this close to trigger CHASE
const WANDER_SPEED       =  80   // px/s
const CHASE_SPEED        = 200   // px/s
const DEACTIVATION_DELAY = 2000  // ms after light leaves before returning to WANDER

export class GatoSelvagem extends GatoMalencarado {
  private _gsState: GSState = 'WANDER'
  private _deactivateTimer = 0
  private _wanderDir = 1
  private _wanderChangeTimer = 0

  // Set by GameScene.update() each frame
  private _gsPlayerX = 0
  private _gsPlayerY = 0
  private _playerAuraRadius = 130
  private _lightSources: LightSource[] = []

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)
    // Use the dedicated Pixel Lab sprite for Gato Selvagem
    this.setTexture(KEYS.GATO_SELVAGEM)
  }

  /** Called by GameScene each frame (same hook as parent). */
  override setPlayerPos(px: number, py: number): void {
    this._gsPlayerX = px
    this._gsPlayerY = py
  }

  /** Called by GameScene each frame after building the world-space lightSources. */
  setLightSources(sources: LightSource[], playerAuraRadius: number): void {
    this._lightSources = sources
    this._playerAuraRadius = playerAuraRadius
  }

  /** Completely overrides parent AI with WANDER/CHASE logic. */
  override update(_time: number, delta: number): void {
    if (!this.active) return

    const nearLight = isNearLight(
      this.x, this.y,
      this._gsPlayerX, this._gsPlayerY,
      this._playerAuraRadius,
      this._lightSources,
      ACTIVATION_RADIUS,
    )

    if (nearLight) {
      this._deactivateTimer = DEACTIVATION_DELAY
    } else {
      this._deactivateTimer = Math.max(0, this._deactivateTimer - delta)
    }

    this._gsState = gatoSelvagemNextState(this._gsState, nearLight, this._deactivateTimer)

    const body = this.body as Phaser.Physics.Arcade.Body

    if (this._gsState === 'CHASE') {
      const dir = this._gsPlayerX > this.x ? 1 : -1
      body.setVelocityX(dir * CHASE_SPEED)
      this.setFlipX(dir < 0)
    } else {
      // WANDER — random direction changes
      this._wanderChangeTimer -= delta
      if (this._wanderChangeTimer <= 0 || body.blocked.left || body.blocked.right) {
        if (body.blocked.left)  this._wanderDir = 1
        else if (body.blocked.right) this._wanderDir = -1
        else this._wanderDir = Math.random() > 0.5 ? 1 : -1
        this._wanderChangeTimer = Phaser.Math.Between(800, 2200)
      }
      body.setVelocityX(this._wanderDir * WANDER_SPEED)
      this.setFlipX(this._wanderDir < 0)
    }
  }
}
