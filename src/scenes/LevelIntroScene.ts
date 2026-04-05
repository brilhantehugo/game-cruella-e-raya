import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { LevelData } from '../levels/LevelData'

export class LevelIntroScene extends Phaser.Scene {
  private _levelData!: LevelData
  private _started = false

  constructor() { super(KEYS.LEVEL_INTRO) }

  create(data: { levelData: LevelData }): void {
    this._levelData = data.levelData
    this._started = false

    // ── Background ────────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor('#0d0d1a')

    const starGfx = this.add.graphics()
    for (let i = 0; i < 70; i++) {
      starGfx.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.22))
      starGfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.4, 1.5),
      )
    }

    // ── Corner brackets (same style as HowToPlayScene) ───────────────────
    const frame = this.add.graphics()
    frame.lineStyle(2, 0xffcc44, 0.35)
    const bx = 10, by = 10, blen = 22
    frame.strokePoints([{ x: bx + blen, y: by }, { x: bx, y: by }, { x: bx, y: by + blen }], false)
    frame.strokePoints([{ x: GAME_WIDTH - bx - blen, y: by }, { x: GAME_WIDTH - bx, y: by }, { x: GAME_WIDTH - bx, y: by + blen }], false)
    frame.strokePoints([{ x: bx, y: GAME_HEIGHT - by - blen }, { x: bx, y: GAME_HEIGHT - by }, { x: bx + blen, y: GAME_HEIGHT - by }], false)
    frame.strokePoints([{ x: GAME_WIDTH - bx, y: GAME_HEIGHT - by - blen }, { x: GAME_WIDTH - bx, y: GAME_HEIGHT - by }, { x: GAME_WIDTH - bx - blen, y: GAME_HEIGHT - by }], false)

    const cx = GAME_WIDTH / 2
    const intro = this._levelData.intro!   // caller guarantees it exists

    // ── World badge + Level name ──────────────────────────────────────────
    const [worldNum] = this._levelData.id.split('-')
    const worldLabel = `Mundo ${worldNum}`

    this.add.text(cx, 26, worldLabel, {
      fontSize: '11px', color: '#888899', letterSpacing: 3,
    }).setOrigin(0.5)

    this.add.text(cx, 46, this._levelData.name, {
      fontSize: '26px', color: '#ffcc44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    // ── Complexity stars ──────────────────────────────────────────────────
    const starLabels: Record<1 | 2 | 3, string> = {
      1: '★☆☆  Fácil',
      2: '★★☆  Médio',
      3: '★★★  Difícil',
    }
    const starColors: Record<1 | 2 | 3, string> = {
      1: '#88ff88',
      2: '#ffcc44',
      3: '#ff6b6b',
    }
    const comp = intro.complexity
    this.add.text(cx, 80, starLabels[comp], {
      fontSize: '16px',
      color: starColors[comp],
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5)

    // ── Horizontal divider ────────────────────────────────────────────────
    const div = this.add.graphics()
    div.lineStyle(1, 0x333355, 0.6)
    div.strokeLineShape(new Phaser.Geom.Line(40, 100, GAME_WIDTH - 40, 100))

    // ── Speech bubbles ────────────────────────────────────────────────────
    const BUBBLE_Y    = 130
    const BUBBLE_W    = 340
    const BUBBLE_H    = 140
    const BUBBLE_PAD  = 12
    const LEFT_CX     = cx - BUBBLE_W / 2 - 6
    const RIGHT_CX    = cx + BUBBLE_W / 2 + 6

    // Raya bubble (left)
    this._drawBubble(
      LEFT_CX,
      BUBBLE_Y,
      BUBBLE_W,
      BUBBLE_H,
      KEYS.RAYA,
      0xff6b6b,
      'Raya',
      intro.dialogue[0],
      BUBBLE_PAD,
    )

    // Cruella bubble (right)
    this._drawBubble(
      RIGHT_CX,
      BUBBLE_Y,
      BUBBLE_W,
      BUBBLE_H,
      KEYS.CRUELLA,
      0x6b6bff,
      'Cruella',
      intro.dialogue[1],
      BUBBLE_PAD,
    )

    // ── Divider above button area ─────────────────────────────────────────
    const div2 = this.add.graphics()
    div2.lineStyle(1, 0x333355, 0.6)
    div2.strokeLineShape(new Phaser.Geom.Line(40, BUBBLE_Y + BUBBLE_H + 16, GAME_WIDTH - 40, BUBBLE_Y + BUBBLE_H + 16))

    // ── Action button (sem auto-avanço — jogador deve pressionar) ────────
    const BTN_Y = GAME_HEIGHT - 22
    const btn = this.add.text(cx, BTN_Y, '[ ENTER / ESPAÇO — começar ]', {
      fontSize: '14px', color: '#ffcc44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: btn, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 })
    btn.on('pointerdown', () => this._advance())

    // ── Fade in ───────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(300, 0, 0, 0)

    // ── Input ─────────────────────────────────────────────────────────────
    const advance = () => { this._advance() }
    const kb = this.input.keyboard!
    kb.on('keydown-ENTER', advance)
    kb.on('keydown-SPACE', advance)
    kb.on('keydown-ESC',   () => { this.scene.start(KEYS.MENU) })

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', advance)
      kb.off('keydown-SPACE', advance)
    })
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private _drawBubble(
    centerX: number,
    topY: number,
    width: number,
    height: number,
    spriteKey: string,
    tintColor: number,
    charName: string,
    text: string,
    pad: number,
  ): void {
    const left = centerX - width / 2
    const bg   = this.add.graphics()

    // Bubble background
    bg.fillStyle(0x111128, 0.92)
    bg.fillRoundedRect(left, topY, width, height, 10)
    bg.lineStyle(1.5, tintColor, 0.5)
    bg.strokeRoundedRect(left, topY, width, height, 10)

    // Accent bar on top
    bg.fillStyle(tintColor, 0.6)
    bg.fillRoundedRect(left, topY, width, 3, { tl: 10, tr: 10, bl: 0, br: 0 })

    // Character portrait sprite
    const spriteX = left + 28
    const spriteY = topY + height / 2 - 4
    this.add.sprite(spriteX, spriteY, spriteKey, 0)
      .setScale(3)
      .setTint(tintColor)

    // Character name label
    const nameColor = `#${tintColor.toString(16).padStart(6, '0')}`
    this.add.text(left + 60, topY + pad + 2, charName, {
      fontSize: '12px', color: nameColor, fontStyle: 'bold',
    })

    // Dialogue text — word-wrap inside bubble
    this.add.text(left + 60, topY + pad + 20, text, {
      fontSize: '12px',
      color: '#ddddee',
      wordWrap: { width: width - 70 },
      lineSpacing: 4,
    })
  }

  private _advance(): void {
    if (this._started) return
    this._started = true
    this.cameras.main.fadeOut(200, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(KEYS.GAME)
    })
  }
}
