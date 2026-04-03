import Phaser from 'phaser'
import { KEYS, GAME_WIDTH } from '../constants'
import { gameState } from '../GameState'

export class MenuScene extends Phaser.Scene {
  constructor() { super(KEYS.MENU) }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Título animado (flutua para cima e para baixo)
    const title = this.add.text(GAME_WIDTH / 2, 120, 'RAYA & CRUELLA', {
      fontSize: '52px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      y: 110,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.add.text(GAME_WIDTH / 2, 185, 'Aventura no Bairro', {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Botão Jogar (pisca)
    const playBtn = this.add.text(GAME_WIDTH / 2, 270, '[ ENTER — JOGAR ]', {
      fontSize: '26px', color: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive()

    this.tweens.add({
      targets: playBtn,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    })

    // Botão Galeria
    const galBtn = this.add.text(GAME_WIDTH / 2, 330, '[ G — GALERIA DE OSSOS ]', {
      fontSize: '18px', color: '#88ccff'
    }).setOrigin(0.5).setInteractive()

    const howBtn = this.add.text(GAME_WIDTH / 2, 370, '[ H — COMO JOGAR ]', {
      fontSize: '18px', color: '#88ffaa'
    }).setOrigin(0.5).setInteractive()

    // Dica de controles
    this.add.text(GAME_WIDTH / 2, 415, '← → Mover   ESPAÇO Pular   SHIFT Habilidade   TAB Trocar cachorra', {
      fontSize: '11px', color: '#555555'
    }).setOrigin(0.5)

    const startGame = () => {
      gameState.reset()
      gameState.currentLevel = '1-1'
      this.scene.start(KEYS.INTRO_CRAWL)
    }

    const goGallery = () => { this.scene.start(KEYS.GALLERY) }
    const goHowToPlay = () => { this.scene.start(KEYS.HOW_TO_PLAY) }

    const kb = this.input.keyboard!
    kb.on('keydown-ENTER', startGame)
    kb.on('keydown-G', goGallery)
    kb.on('keydown-H', goHowToPlay)
    playBtn.on('pointerdown', startGame)
    galBtn.on('pointerdown', goGallery)
    howBtn.on('pointerdown', goHowToPlay)

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', startGame)
      kb.off('keydown-G', goGallery)
      kb.off('keydown-H', goHowToPlay)
    })
  }
}
