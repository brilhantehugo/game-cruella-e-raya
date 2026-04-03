import Phaser from 'phaser'
import { KEYS } from '../constants'

export class Bone extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.BONE)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setData('type', 'bone')
  }
}
