import { HumanEnemy, type HumanConfig } from './HumanEnemy';
import { KEYS } from '../../constants';

/**
 * Zelador — guarda rápido com campo de visão amplo.
 * Usa sprite do Hugo com tint cinzento.
 */
export class Zelador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange: 250,
      coneAngle: 80,
      chaseSpeed: 130,
      patrolSpeed: 70,
      attackRange: 40,
      cooldownDuration: 800,
      hearingRadius: 180,
      patrolRange: 220,
    };

    super(scene, x, y, KEYS.HUGO, config);
    this.setTint(0xdddddd);
  }
}
