import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState, DogType } from '../GameState'

const RAYA_SKILLS = [
  { icon: '⚡', name: 'Dash Horizontal', desc: 'SHIFT — dispara em linha reta\natravessando inimigos (cd: 0.8s)', color: '#ffdd88' },
  { icon: '🦘', name: 'Pulo Duplo',      desc: 'ESPAÇO x2 — segundo pulo\nno ar para alcançar plataformas', color: '#88ffdd' },
  { icon: '💥', name: 'Dash Dano',       desc: 'Dash em inimigo causa 1 dano\ne gera popup +50 pontos',         color: '#ff9955' },
  { icon: '🔁', name: 'Combo Troca',     desc: 'Dash → TAB em 600ms:\nimpulso extra em Cruella',              color: '#cc88ff' },
]

const CRUELLA_SKILLS = [
  { icon: '🔊', name: 'Latido Stunner',     desc: 'SHIFT — atordoa inimigos\npróximos por 500ms (cd: 1.5s)',  color: '#88aaff' },
  { icon: '👁️', name: 'Intimidação Passiva', desc: 'Inimigos próximos fogem\nespontaneamente quando presente', color: '#aaffcc' },
  { icon: '🟡', name: 'Tint de Stun',        desc: 'Inimigos atingidos ficam\namarelos durante o atordoamento', color: '#ffff66' },
  { icon: '🚀', name: 'Impulso de Combo',    desc: 'Recebe boost de velocidade\napós troca de Raya (440px/s)',  color: '#cc88ff' },
]

export class CharacterSelectScene extends Phaser.Scene {
  private selected: DogType = 'raya'

  constructor() { super(KEYS.CHARACTER_SELECT) }

  create(): void {
    this.selected = gameState.activeDog
    this.cameras.main.setBackgroundColor('#0d0d1a')

    const cx = GAME_WIDTH / 2

    // Title
    this.add.text(cx, 28, 'ESCOLHA SUA CACHORRA', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    const rayaX    = cx - 210
    const cruellaX = cx + 210
    const spriteY  = 105

    // Card backgrounds
    const cardRaya    = this.add.rectangle(rayaX,    spriteY + 80, 200, 300, 0x1a1a33, 0.9).setStrokeStyle(2, 0xffffff)
    const cardCruella = this.add.rectangle(cruellaX, spriteY + 80, 200, 300, 0x1a1a33, 0.9).setStrokeStyle(2, 0x6666ff)

    // Sprites
    const rayaSprite    = this.add.sprite(rayaX,    spriteY - 30, KEYS.RAYA,    0).setScale(4)
    const cruellaSprite = this.add.sprite(cruellaX, spriteY - 30, KEYS.CRUELLA, 0).setScale(4)

    // Names
    this.add.text(rayaX,    spriteY + 40, 'RAYA',    { fontSize: '20px', color: '#ff8888', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.text(cruellaX, spriteY + 40, 'CRUELLA', { fontSize: '20px', color: '#aaaaff', fontStyle: 'bold' }).setOrigin(0.5)

    // Playstyle badge
    this.add.text(rayaX,    spriteY + 60, '[ VELOCIDADE & DANO ]', { fontSize: '9px', color: '#ffaa55' }).setOrigin(0.5)
    this.add.text(cruellaX, spriteY + 60, '[ CONTROLE & SUPORTE ]', { fontSize: '9px', color: '#88aaff' }).setOrigin(0.5)

    // Divider
    this.add.line(rayaX,    spriteY + 70, -80, 0, 80, 0, 0x333355).setLineWidth(1)
    this.add.line(cruellaX, spriteY + 70, -80, 0, 80, 0, 0x333355).setLineWidth(1)

    // Skills list — Raya
    RAYA_SKILLS.forEach((sk, i) => {
      const y = spriteY + 90 + i * 42
      this.add.text(rayaX - 80, y,      sk.icon,  { fontSize: '16px' })
      this.add.text(rayaX - 56, y,      sk.name,  { fontSize: '10px', color: sk.color, fontStyle: 'bold' })
      this.add.text(rayaX - 56, y + 14, sk.desc,  { fontSize: '8px',  color: '#aaaaaa' })
    })

    // Skills list — Cruella
    CRUELLA_SKILLS.forEach((sk, i) => {
      const y = spriteY + 90 + i * 42
      this.add.text(cruellaX - 80, y,      sk.icon,  { fontSize: '16px' })
      this.add.text(cruellaX - 56, y,      sk.name,  { fontSize: '10px', color: sk.color, fontStyle: 'bold' })
      this.add.text(cruellaX - 56, y + 14, sk.desc,  { fontSize: '8px',  color: '#aaaaaa' })
    })

    // Selection highlight
    const boxRaya    = this.add.rectangle(rayaX,    spriteY + 80, 200, 300, 0x000000, 0).setStrokeStyle(3, 0xffffff)
    const boxCruella = this.add.rectangle(cruellaX, spriteY + 80, 200, 300, 0x000000, 0).setStrokeStyle(1, 0x333355)

    // Confirm hint
    const confirmText = this.add.text(cx, GAME_HEIGHT - 56, 'ENTER — JOGAR', {
      fontSize: '18px', color: '#ffff00', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.tweens.add({ targets: confirmText, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 })

    this.add.text(cx, GAME_HEIGHT - 36, '← → para mudar', { fontSize: '11px', color: '#555566' }).setOrigin(0.5)

    const backBtn = this.add.text(cx, GAME_HEIGHT - 18, '[ ESC — voltar ao menu ]', {
      fontSize: '11px', color: '#444455'
    }).setOrigin(0.5).setInteractive()

    // Update visuals
    const refresh = () => {
      const isRaya = this.selected === 'raya'
      rayaSprite.setAlpha(isRaya ? 1 : 0.35)
      cruellaSprite.setAlpha(isRaya ? 0.35 : 1)
      cardRaya.setFillStyle(isRaya ? 0x1a1a44 : 0x111122, isRaya ? 1 : 0.6)
      cardCruella.setFillStyle(isRaya ? 0x111122 : 0x1a1a44, isRaya ? 0.6 : 1)
      boxRaya.setStrokeStyle(isRaya ? 3 : 1, isRaya ? 0xffffff : 0x333355)
      boxCruella.setStrokeStyle(isRaya ? 1 : 3, isRaya ? 0x333333 : 0xaaaaff)
    }
    refresh()

    // Input
    const onLeft    = () => { this.selected = 'raya';    refresh() }
    const onRight   = () => { this.selected = 'cruella'; refresh() }
    const onConfirm = () => { gameState.activeDog = this.selected; this.scene.start(KEYS.GAME) }
    const onBack    = () => { this.scene.start(KEYS.MENU) }

    const kb = this.input.keyboard!
    kb.on('keydown-LEFT',  onLeft)
    kb.on('keydown-RIGHT', onRight)
    kb.on('keydown-ENTER', onConfirm)
    kb.on('keydown-ESC',   onBack)

    rayaSprite.setInteractive().on('pointerdown',    () => { this.selected = 'raya';    refresh() })
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
