import Phaser from 'phaser'
import { KEYS } from '../constants'
import { gameState } from '../GameState'

export class GalleryScene extends Phaser.Scene {
  constructor() { super(KEYS.GALLERY) }
  create(): void {
    this.add.text(400, 60, 'GALERIA DE OSSOS DOURADOS', { fontSize: '28px', color: '#ffdd00' }).setOrigin(0.5)
    const levels = ['1-1', '1-2', '1-3']
    levels.forEach((level, li) => {
      this.add.text(100, 140 + li * 80, `Fase ${level}:`, { fontSize: '20px', color: '#ffffff' })
      const bones = gameState.goldenBones[level] ?? [false, false, false]
      bones.forEach((collected, bi) => {
        const color = collected ? '#ffdd00' : '#444444'
        this.add.text(220 + bi * 60, 140 + li * 80, '🦴', { fontSize: '28px', color })
      })
    })
    this.add.text(400, 400, 'BACKSPACE — voltar', { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-BACKSPACE', () => { this.scene.start(KEYS.MENU) })
  }
}
