import Phaser from 'phaser'
import { KEYS } from '../constants'

export class PauseScene extends Phaser.Scene {
  constructor() { super(KEYS.PAUSE) }
  create(): void {
    this.add.rectangle(400, 225, 400, 300, 0x000000, 0.8)
    this.add.text(400, 130, 'PAUSADO', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 200, '← → Mover', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 230, 'ESPAÇO Pular (segurar = mais alto)', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 260, 'SHIFT Habilidade especial', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 290, 'TAB Trocar cachorra', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 340, 'ESC — continuar   M — menu', { fontSize: '16px', color: '#ffff00' }).setOrigin(0.5)
    const kb = this.input.keyboard!
    kb.once('keydown-ESC', () => { this.scene.resume(KEYS.GAME); this.scene.stop() })
    kb.once('keydown-M', () => { this.scene.stop(KEYS.GAME); this.scene.stop(KEYS.UI); this.scene.stop(); this.scene.start(KEYS.MENU) })
  }
}
