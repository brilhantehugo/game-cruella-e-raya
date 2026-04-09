import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from '../enemies/HumanEnemy'

/** Hannah — a dona do apartamento. Levemente mais rápida que Hugo. */
export class Hannah extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HANNAH, {
      detectionRange: 180,
      coneAngle: 60,
      chaseSpeed: 90,
      patrolSpeed: 65,
      attackRange: 40,
      cooldownDuration: 1200,
      hearingRadius: 120,
      patrolRange: 200,
    })
  }
}
