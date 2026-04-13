import Phaser from 'phaser'
import { HumanEnemy, HumanConfig } from './HumanEnemy'
import {
  computeNextHumanState,
  isInCone,
} from './EnemyStateMachine'
import { type LightSource } from '../../fx/SpotlightOverlay'
import { KEYS } from '../../constants'

export class Porteiro extends HumanEnemy {
  private _hasThrown = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange:   120,
      coneAngle:         60,   // half-angle → 120° forward detection
      chaseSpeed:         0,   // never chases — static
      patrolSpeed:        0,   // never patrols — static
      attackRange:      120,
      cooldownDuration: 2000,
      hearingRadius:     80,
      patrolRange:        0,
    }
    super(scene, x, y, KEYS.PORTEIRO, config)
    this.setTint(0x667755)
  }

  /**
   * World-space LightSource — a rect of light from the doorway lamp.
   */
  getLightSource(): LightSource {
    return {
      x:      this.x + (this.flipX ? -40 : 40),
      y:      this.y - 10,
      type:   'rect',
      radius: 60,       // used by isNearLight overlap check
      width:  80,
      height: 60,
    }
  }

  override update(_time: number, delta: number): void {
    if (!this.active) return

    // Always static
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(0)

    const dist     = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const inCone   = isInCone(
      this.x, this.y, this.direction === 1,
      this._playerX, this._playerY,
      this._config.detectionRange, this._config.coneAngle,
    )

    // DETECT → PATROL if player exits cone before 500 ms
    if (this._sm.state === 'DETECT' && !inCone) {
      this._sm.transition('PATROL')
    }

    const next = computeNextHumanState({
      state:            this._sm.state,
      timeInState:      this._sm.timeInState(),
      distToPlayer:     dist,
      playerInCone:     inCone,
      config:           this._config,
      reachedLastKnown: false,   // static — never searches
    })
    if (next) this._sm.transition(next)

    // Override attack: throw key instead of grabPlayer
    if (this._sm.state === 'ATTACK' && !this._hasThrown) {
      this._hasThrown = true
      const dx = this._playerX - this.x
      this.emit('spawnChave', {
        x:  this.x,
        y:  this.y - 8,
        vx: Math.sign(dx) * 180,
        vy: -60,
      })
      this.scene.time.delayedCall(this._config.cooldownDuration, () => {
        if (!this.active) return
        this._hasThrown = false
        this._sm.transition('COOLDOWN')
      })
    }

    this.setFlipX(this.direction === -1)
  }
}
