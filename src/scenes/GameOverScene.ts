import Phaser from 'phaser'
import { KEYS } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class GameOverScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME_OVER) }
  create(): void {
    SoundManager.play('gameOver')
    this.cameras.main.setBackgroundColor('#1a0000')
    this.add.text(400, 160, 'VOLTA PRA CASA!', { fontSize: '40px', color: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5)

    const enterBtn = this.add.text(400, 260, '[ ENTER — recomeçar do checkpoint ]', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5).setInteractive()
    const rBtn     = this.add.text(400, 310, '[ R — recomeçar a fase ]',             { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5).setInteractive()
    this.add.text(400, 400, 'ESC — voltar ao menu', { fontSize: '13px', color: '#555555' }).setOrigin(0.5).setInteractive()

    let _done = false
    const restart = (resetFn: () => void) => {
      if (_done) return
      _done = true
      resetFn()
      this.scene.stop(KEYS.UI)
      this.scene.start(KEYS.GAME)
    }

    const onEnter = () => restart(() => gameState.resetAtCheckpoint())
    const onR     = () => restart(() => gameState.resetLevel())
    const onEsc   = () => { if (!_done) { _done = true; this.scene.start(KEYS.MENU) } }

    const kb = this.input.keyboard!
    kb.on('keydown-ENTER', onEnter)
    kb.on('keydown-R',     onR)
    kb.on('keydown-ESC',   onEsc)

    enterBtn.on('pointerdown', onEnter)
    rBtn.on('pointerdown', onR)

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', onEnter)
      kb.off('keydown-R',     onR)
      kb.off('keydown-ESC',   onEsc)
    })
  }
}
