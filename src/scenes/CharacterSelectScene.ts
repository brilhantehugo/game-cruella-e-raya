import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState, DogType } from '../GameState'

export class CharacterSelectScene extends Phaser.Scene {
  private selected: DogType = 'raya'

  constructor() { super(KEYS.CHARACTER_SELECT) }

  create(): void {
    this.selected = gameState.activeDog
    this.cameras.main.setBackgroundColor('#0d0d1a')

    const cx = GAME_WIDTH / 2

    this.add.text(cx, 32, 'ESCOLHA SUA CACHORRA', {
      fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    const rayaX   = cx - 190
    const cruellaX = cx + 190
    const spriteY  = 200

    // Sprites (frame 0 = idle, scale 4 → 128px)
    const rayaSprite   = this.add.sprite(rayaX,   spriteY, KEYS.RAYA,   0).setScale(4)
    const cruellaSprite = this.add.sprite(cruellaX, spriteY, KEYS.CRUELLA, 0).setScale(4)

    // Names
    this.add.text(rayaX,   spriteY + 82, 'RAYA',    { fontSize: '22px', color: '#ff8888', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.text(cruellaX, spriteY + 82, 'CRUELLA', { fontSize: '22px', color: '#aaaaff', fontStyle: 'bold' }).setOrigin(0.5)

    // Abilities
    this.add.text(rayaX,   spriteY + 108, 'Pulo duplo', { fontSize: '12px', color: '#ffbbbb' }).setOrigin(0.5)
    this.add.text(rayaX,   spriteY + 126, 'Dash horizontal', { fontSize: '12px', color: '#ffbbbb' }).setOrigin(0.5)
    this.add.text(cruellaX, spriteY + 108, 'Latido stunner', { fontSize: '12px', color: '#ccccff' }).setOrigin(0.5)
    this.add.text(cruellaX, spriteY + 126, 'Intimidação passiva', { fontSize: '12px', color: '#ccccff' }).setOrigin(0.5)

    // Selection highlight box
    const boxRaya   = this.add.rectangle(rayaX,   spriteY, 120, 160, 0x000000, 0).setStrokeStyle(2, 0xffffff)
    const boxCruella = this.add.rectangle(cruellaX, spriteY, 120, 160, 0x000000, 0).setStrokeStyle(2, 0x6666ff)

    // Confirm button hint
    const confirmText = this.add.text(cx, spriteY + 170, 'ENTER — JOGAR', {
      fontSize: '18px', color: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0.5)
    this.tweens.add({ targets: confirmText, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 })

    this.add.text(cx, spriteY + 200, '← → para mudar', {
      fontSize: '12px', color: '#666666'
    }).setOrigin(0.5)

    const backBtn = this.add.text(cx, GAME_HEIGHT - 20, '[ ESC — voltar ao menu ]', {
      fontSize: '12px', color: '#555555'
    }).setOrigin(0.5).setInteractive()

    // Update visuals
    const refresh = () => {
      const isRaya = this.selected === 'raya'
      rayaSprite.setAlpha(isRaya ? 1 : 0.35)
      cruellaSprite.setAlpha(isRaya ? 0.35 : 1)
      boxRaya.setStrokeStyle(isRaya ? 3 : 1, isRaya ? 0xffffff : 0x333355)
      boxCruella.setStrokeStyle(isRaya ? 1 : 3, isRaya ? 0x333333 : 0xaaaaff)
    }
    refresh()

    // Input
    const onLeft  = () => { this.selected = 'raya';    refresh() }
    const onRight = () => { this.selected = 'cruella'; refresh() }
    const onConfirm = () => {
      gameState.activeDog = this.selected
      this.scene.start(KEYS.GAME)
    }
    const onBack = () => { this.scene.start(KEYS.MENU) }

    const kb = this.input.keyboard!
    kb.on('keydown-LEFT',  onLeft)
    kb.on('keydown-RIGHT', onRight)
    kb.on('keydown-ENTER', onConfirm)
    kb.on('keydown-ESC',   onBack)

    rayaSprite.setInteractive().on('pointerdown', () => { this.selected = 'raya'; refresh() })
    cruellaSprite.setInteractive().on('pointerdown', () => { this.selected = 'cruella'; refresh() })
    backBtn.on('pointerdown', onBack)

    this.events.once('shutdown', () => {
      kb.off('keydown-LEFT',  onLeft)
      kb.off('keydown-RIGHT', onRight)
      kb.off('keydown-ENTER', onConfirm)
      kb.off('keydown-ESC',   onBack)
    })
  }
}
