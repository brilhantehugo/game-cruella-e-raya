import Phaser from 'phaser'
import { HumanEnemy, HumanConfig } from './HumanEnemy'
import { buildSegurancaLightSource, type LightSource } from '../../fx/SpotlightOverlay'
import { KEYS } from '../../constants'

export class Seguranca extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange:   200,   // lanterna range
      coneAngle:         90,   // half-angle → full 180° cone (matches isInCone halfAngleDeg)
      chaseSpeed:       100,
      patrolSpeed:       60,
      attackRange:       40,
      cooldownDuration: 3000,  // 3s back-to-PATROL after losing contact (spec)
      hearingRadius:    100,
      patrolRange:      200,
    }
    super(scene, x, y, KEYS.SEGURANCA, config)
    this.setTint(0x334466)    // dark uniform tint
  }

  /**
   * World-space LightSource for this Segurança's lanterna.
   * Called by GameScene.update() to build the lightSources array.
   */
  getLightSource(): LightSource {
    return buildSegurancaLightSource(this.x, this.y, this.flipX)
  }
}
