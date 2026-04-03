import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GameScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME) }
  create(): void {
    this.add.text(400, 225, 'GameScene — em construção', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
  }
}
