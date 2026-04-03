import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GoldenBone extends Phaser.Physics.Arcade.Image {
  boneIndex: number
  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y, KEYS.GOLDEN_BONE)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.boneIndex = index
    this.setData('type', 'golden_bone')
    this.setScale(1.4)
  }
}
