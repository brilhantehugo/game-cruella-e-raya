import Phaser from 'phaser'
import { KEYS } from '../constants'
import { SoundManager } from '../audio/SoundManager'

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super(KEYS.LEVEL_COMPLETE) }
  create(data: { score: number; bones: number; time: number }): void {
    SoundManager.play('levelComplete')
    SoundManager.playBgm(KEYS.BGM_FANFARE, this, false)
    this.events.once('shutdown', () => SoundManager.stopBgm())
    this.add.text(400, 160, 'CHEGAMOS! 🏠', { fontSize: '40px', color: '#ffff00' }).setOrigin(0.5)
    this.add.text(400, 240, `Ossos: ${data?.bones ?? 0}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 280, `Pontos: ${data?.score ?? 0}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 350, 'ENTER — próxima fase', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-ENTER', () => { this.scene.start(KEYS.GAME) })
  }
}
