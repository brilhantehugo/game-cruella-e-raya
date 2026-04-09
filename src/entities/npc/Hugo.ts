import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from '../enemies/HumanEnemy'

/** Hugo — o dono do apartamento. Patrol lento, cone de 60°, immune a danos. */
export class Hugo extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HUGO, {
      detectionRange: 180,
      coneAngle: 60,
      chaseSpeed: 90,
      patrolSpeed: 55,
      attackRange: 40,
      cooldownDuration: 1200,
      hearingRadius: 120,
      patrolRange: 180,
    })
  }
}
