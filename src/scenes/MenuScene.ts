import Phaser from 'phaser'
import { KEYS } from '../constants'

export class MenuScene extends Phaser.Scene {
  constructor() { super(KEYS.MENU) }
  create(): void {
    this.add.text(400, 225, 'RAYA & CRUELLA', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 320, 'Pressione ENTER para jogar', { fontSize: '20px', color: '#ffff00' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start(KEYS.GAME)
      this.scene.launch(KEYS.UI)
    })
  }
}
