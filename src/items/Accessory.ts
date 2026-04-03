import Phaser from 'phaser'
import { KEYS } from '../constants'
import type { AccessoryType } from '../GameState'

const TEXTURES: Record<string, string> = {
  laco: KEYS.LACO, coleira: KEYS.COLEIRA, chapeu: KEYS.CHAPEU, bandana: KEYS.BANDANA,
}

export class Accessory extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, type: AccessoryType) {
    super(scene, x, y, TEXTURES[type!] ?? KEYS.LACO)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setData('type', type)
  }
}
