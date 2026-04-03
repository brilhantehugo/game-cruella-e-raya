import Phaser from 'phaser'
import { KEYS } from '../constants'

const TEXTURES: Record<string, string> = {
  petisco: KEYS.PETISCO, pipoca: KEYS.PIPOCA, pizza: KEYS.PIZZA,
  churrasco: KEYS.CHURRASCO, bola: KEYS.BOLA, frisbee: KEYS.FRISBEE,
  surprise_block: KEYS.SURPRISE_BLOCK,
}

export class PowerUp extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
    super(scene, x, y, TEXTURES[type] ?? KEYS.PETISCO)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setData('type', type)
  }
}
