import { HumanEnemy, type HumanConfig } from './HumanEnemy'
import { KEYS } from '../../constants'

/**
 * Morador — civil cauteloso, alcance curto, move-se devagar.
 * Usa sprite da Hannah com tint quente.
 */
export class Morador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange: 150,
      coneAngle: 50,
      chaseSpeed: 70,
      patrolSpeed: 45,
      attackRange: 40,
      cooldownDuration: 1500,
      hearingRadius: 80,
      patrolRange: 160,
    }

    super(scene, x, y, KEYS.HANNAH, config)
    this.setTint(0xffeecc)
  }
}
