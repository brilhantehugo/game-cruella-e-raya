import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GameOverScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME_OVER) }
  create(): void {
    this.add.text(400, 180, 'VOLTA PRA CASA!', { fontSize: '40px', color: '#ff4444' }).setOrigin(0.5)
    this.add.text(400, 270, 'ENTER — recomeçar do checkpoint', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 310, 'R — recomeçar a fase', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5)
    const kb = this.input.keyboard!
    kb.once('keydown-ENTER', () => { this.scene.start(KEYS.GAME) })
    kb.once('keydown-R', () => { this.scene.start(KEYS.GAME, { fromStart: true }) })
  }
}
