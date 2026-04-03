import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class SeuBigodes extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.BIGODES, 12, 60)
    this.setScale(2)
  }
  update(_time: number, _delta: number): void {
    // full impl in Task 9
  }
}
