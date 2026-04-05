import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState, DogType } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

const RAYA_SKILLS = [
  { icon: '⚡', name: 'Dash Horizontal', desc: 'SHIFT — dispara em linha reta\natravessando inimigos (cd: 0.8s)', color: '#ffdd88' },
  { icon: '🦘', name: 'Pulo Duplo',      desc: 'ESPAÇO x2 — segundo pulo no ar\npara alcançar plataformas altas', color: '#88ffdd' },
  { icon: '💥', name: 'Dash Dano',       desc: 'Dash em inimigo causa 1 dano\ne gera popup +50 pontos',         color: '#ff9955' },
  { icon: '🔁', name: 'Combo Troca',     desc: 'Dash → TAB em 600ms:\nimpulso extra automático em Cruella', color: '#cc88ff' },
]

const CRUELLA_SKILLS = [
  { icon: '🔊', name: 'Latido Stunner',      desc: 'SHIFT — atordoa inimigos próximos\npor 500ms com ondas de choque (cd: 1.5s)',  color: '#88aaff' },
  { icon: '👁️', name: 'Intimidação Passiva', desc: 'Inimigos próximos fogem\nespontaneamente quando presente',  color: '#aaffcc' },
  { icon: '🟡', name: 'Tint de Stun',        desc: 'Inimigos ficam amarelos\ndurante o atordoamento',           color: '#ffff66' },
  { icon: '🚀', name: 'Impulso de Combo',    desc: 'Recebe boost de velocidade\napós troca vinda de Raya (440px/s)', color: '#cc88ff' },
]

export class CharacterSelectScene extends Phaser.Scene {
  private selected: DogType = 'raya'

  constructor() { super(KEYS.CHARACTER_SELECT) }

  create(): void {
    this.selected = gameState.activeDog
    this.cameras.main.setBackgroundColor('#0d0d1a')

    const cx = GAME_WIDTH / 2

    // ── Faint starfield ──────────────────────────────────────────────────
    const sg = this.add.graphics()
    for (let i = 0; i < 55; i++) {
      sg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.18))
      sg.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.FloatBetween(0.5, 1.4))
    }

    // ── Title ────────────────────────────────────────────────────────────
    this.add.text(cx, 16, 'ESCOLHA SUA CACHORRA', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    // ── Card layout constants ─────────────────────────────────────────────
    const rayaX    = cx - 210
    const cruellaX = cx + 210
    const CARD_W   = 210
    const CARD_H   = 400
    const CARD_CY  = 248          // card centre Y
    const CARD_TOP = CARD_CY - CARD_H / 2   // = 48

    // Portrait zone: top 148px of card
    const PORTRAIT_H = 148
    const PORTRAIT_CY = CARD_TOP + PORTRAIT_H / 2        // = 122

    // Content zone: below portrait
    const CONTENT_Y = CARD_TOP + PORTRAIT_H              // = 196

    // ── Card backgrounds ─────────────────────────────────────────────────
    const cardRaya    = this.add.rectangle(rayaX,    CARD_CY, CARD_W, CARD_H, 0x1a1a33, 0.9).setStrokeStyle(2, 0xffffff)
    const cardCruella = this.add.rectangle(cruellaX, CARD_CY, CARD_W, CARD_H, 0x1a1a33, 0.9).setStrokeStyle(2, 0x6666ff)

    // ── Portrait zone background ──────────────────────────────────────────
    const portraitRaya    = this.add.rectangle(rayaX,    PORTRAIT_CY, CARD_W, PORTRAIT_H, 0x0d0d22, 1)
    const portraitCruella = this.add.rectangle(cruellaX, PORTRAIT_CY, CARD_W, PORTRAIT_H, 0x0d0d22, 1)
    portraitRaya.setStrokeStyle(1, 0x333355)
    portraitCruella.setStrokeStyle(1, 0x333355)

    // ── Sprites (Raya menor=escala 2.4, Cruella maior=escala 3.8, ambas no retrato de 148px) ──
    const rayaSprite    = this.add.sprite(rayaX,    PORTRAIT_CY, KEYS.RAYA,    0).setScale(2.4)
    const cruellaSprite = this.add.sprite(cruellaX, PORTRAIT_CY, KEYS.CRUELLA, 0).setScale(3.8)

    // Bob animation
    this.tweens.add({ targets: rayaSprite,    y: PORTRAIT_CY - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: cruellaSprite, y: PORTRAIT_CY - 6, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 })

    // ── Names ─────────────────────────────────────────────────────────────
    this.add.text(rayaX,    CONTENT_Y + 14, 'RAYA',    { fontSize: '20px', color: '#ff8888', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.text(cruellaX, CONTENT_Y + 14, 'CRUELLA', { fontSize: '20px', color: '#aaaaff', fontStyle: 'bold' }).setOrigin(0.5)

    // ── Playstyle badge ────────────────────────────────────────────────────
    this.add.text(rayaX,    CONTENT_Y + 34, '[ PEQUENA & ÁGIL — VELOCIDADE & DANO ]',  { fontSize: '7px', color: '#ffaa55' }).setOrigin(0.5)
    this.add.text(cruellaX, CONTENT_Y + 34, '[ GRANDE & PODEROSA — CONTROLE & SUPORTE ]', { fontSize: '7px', color: '#88aaff' }).setOrigin(0.5)

    // ── Divider ────────────────────────────────────────────────────────────
    const divGfx = this.add.graphics()
    divGfx.lineStyle(1, 0x333355, 0.7)
    const DIV_Y = CONTENT_Y + 46
    divGfx.strokeLineShape(new Phaser.Geom.Line(rayaX    - 88, DIV_Y, rayaX    + 88, DIV_Y))
    divGfx.strokeLineShape(new Phaser.Geom.Line(cruellaX - 88, DIV_Y, cruellaX + 88, DIV_Y))

    // ── Skills list ────────────────────────────────────────────────────────
    const SKILL_START_Y = CONTENT_Y + 56   // = 252
    const SKILL_STEP    = 40

    RAYA_SKILLS.forEach((sk, i) => {
      const y = SKILL_START_Y + i * SKILL_STEP
      this.add.text(rayaX - 92, y,      sk.icon, { fontSize: '14px' })
      this.add.text(rayaX - 68, y,      sk.name, { fontSize: '9px', color: sk.color, fontStyle: 'bold' })
      this.add.text(rayaX - 68, y + 13, sk.desc, { fontSize: '7.5px', color: '#aaaaaa' })
    })

    CRUELLA_SKILLS.forEach((sk, i) => {
      const y = SKILL_START_Y + i * SKILL_STEP
      this.add.text(cruellaX - 92, y,      sk.icon, { fontSize: '14px' })
      this.add.text(cruellaX - 68, y,      sk.name, { fontSize: '9px', color: sk.color, fontStyle: 'bold' })
      this.add.text(cruellaX - 68, y + 13, sk.desc, { fontSize: '7.5px', color: '#aaaaaa' })
    })

    // ── Selection highlight boxes ──────────────────────────────────────────
    const boxRaya    = this.add.rectangle(rayaX,    CARD_CY, CARD_W, CARD_H, 0x000000, 0).setStrokeStyle(3, 0xffffff)
    const boxCruella = this.add.rectangle(cruellaX, CARD_CY, CARD_W, CARD_H, 0x000000, 0).setStrokeStyle(1, 0x333355)

    // ── Bottom buttons ────────────────────────────────────────────────────
    const confirmText = this.add.text(cx, GAME_HEIGHT - 50, 'ENTER — JOGAR', {
      fontSize: '18px', color: '#ffff00', fontStyle: 'bold',
    }).setOrigin(0.5)
    this.tweens.add({ targets: confirmText, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 })

    this.add.text(cx, GAME_HEIGHT - 30, '← → para mudar', { fontSize: '11px', color: '#555566' }).setOrigin(0.5)

    const backBtn = this.add.text(cx, GAME_HEIGHT - 14, '[ ESC — voltar ao menu ]', {
      fontSize: '10px', color: '#444455',
    }).setOrigin(0.5).setInteractive()

    // ── Update visuals ────────────────────────────────────────────────────
    const refresh = () => {
      const isRaya = this.selected === 'raya'
      rayaSprite.setAlpha(isRaya ? 1 : 0.35)
      cruellaSprite.setAlpha(isRaya ? 0.35 : 1)
      cardRaya.setFillStyle(isRaya ? 0x1a1a44 : 0x111122, isRaya ? 1 : 0.6)
      cardCruella.setFillStyle(isRaya ? 0x111122 : 0x1a1a44, isRaya ? 0.6 : 1)
      portraitRaya.setFillStyle(isRaya ? 0x141432 : 0x0a0a18, 1)
      portraitCruella.setFillStyle(isRaya ? 0x0a0a18 : 0x141432, 1)
      boxRaya.setStrokeStyle(isRaya ? 3 : 1, isRaya ? 0xffffff : 0x333355)
      boxCruella.setStrokeStyle(isRaya ? 1 : 3, isRaya ? 0x333333 : 0xaaaaff)
    }
    refresh()

    // ── Input ─────────────────────────────────────────────────────────────
    const onLeft    = () => { this.selected = 'raya';    refresh() }
    const onRight   = () => { this.selected = 'cruella'; refresh() }
    const onConfirm = () => {
      gameState.activeDog = this.selected
      SoundManager.stopBgm()
      this.scene.start(KEYS.GAME)
    }
    const onBack = () => { this.scene.start(KEYS.MENU) }

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

    // Menu music continues
    SoundManager.playProceduralBgm('menu')
  }
}
