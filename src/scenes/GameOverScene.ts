import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class GameOverScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME_OVER) }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a0000')

    const cx = GAME_WIDTH / 2

    // ── Falling ember particles ──────────────────────────────────────────
    const emberGfx = this.add.graphics()
    type Ember = { x: number; y: number; vy: number; r: number; a: number; col: number }
    const embers: Ember[] = []
    const EMBER_COLS = [0xff2200, 0xff4400, 0xff6600, 0xdd1100]
    for (let i = 0; i < 55; i++) {
      embers.push({
        x:   Phaser.Math.Between(0, GAME_WIDTH),
        y:   Phaser.Math.Between(-60, GAME_HEIGHT),
        vy:  Phaser.Math.FloatBetween(0.4, 1.4),
        r:   Phaser.Math.FloatBetween(1, 3.5),
        a:   Phaser.Math.FloatBetween(0.3, 0.9),
        col: Phaser.Math.RND.pick(EMBER_COLS),
      })
    }
    this.events.on('update', (_: number, delta: number) => {
      emberGfx.clear()
      embers.forEach(e => {
        e.y += e.vy * delta * 0.06
        if (e.y > GAME_HEIGHT + 10) { e.y = -8; e.x = Phaser.Math.Between(0, GAME_WIDTH) }
        emberGfx.fillStyle(e.col, e.a)
        emberGfx.fillCircle(e.x, e.y, e.r)
      })
    })

    // ── Dark vignette ────────────────────────────────────────────────────
    const vig = this.add.graphics()
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.7, 0.7, 0, 0)
    vig.fillRect(0, 0, GAME_WIDTH, 100)
    vig.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.8, 0.8)
    vig.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100)

    // ── Character sprites (looking sad — flipped and dim) ────────────────
    const raya = this.add.sprite(cx - 120, 220, KEYS.RAYA, 0)
      .setScale(3.5).setTint(0xaa3333).setAlpha(0.7)
    const cruella = this.add.sprite(cx + 120, 225, KEYS.CRUELLA, 0)
      .setScale(3.5).setTint(0xaa3333).setAlpha(0.7).setFlipX(true)

    // Sad drooping tween
    this.tweens.add({ targets: [raya, cruella], angle: 8, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    // ── Title ─────────────────────────────────────────────────────────────
    const titleTxt = this.add.text(cx, 90, 'VOLTA PRA CASA!', {
      fontSize: '44px',
      color:    '#ff2222',
      fontStyle: 'bold',
      stroke:   '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: titleTxt, alpha: 1, duration: 600, ease: 'Quad.easeOut',
      onComplete: () => {
        this.cameras.main.shake(300, 0.012)
        this.tweens.add({
          targets: titleTxt,
          scaleX: 1.04, scaleY: 1.04,
          duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        })
      },
    })

    this.add.text(cx, 138, '— as meninas precisam descansar —', {
      fontSize: '12px', color: '#882222', fontStyle: 'italic',
    }).setOrigin(0.5)

    // ── Score display ─────────────────────────────────────────────────────
    const scoreBg = this.add.graphics()
    scoreBg.fillStyle(0x000000, 0.45)
    scoreBg.fillRoundedRect(cx - 110, 155, 220, 44, 8)
    scoreBg.lineStyle(1, 0x660000, 0.6)
    scoreBg.strokeRoundedRect(cx - 110, 155, 220, 44, 8)

    this.add.text(cx, 170, 'Pontuação final', {
      fontSize: '12px', color: '#884444',
    }).setOrigin(0.5)
    this.add.text(cx, 186, `${gameState.score}`, {
      fontSize: '18px', color: '#ffaa88', fontStyle: 'bold',
    }).setOrigin(0.5)

    // ── Buttons ───────────────────────────────────────────────────────────
    const mkBtn = (y: number, txt: string, col: string) =>
      this.add.text(cx, y, txt, {
        fontSize: '18px', color: col, fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setInteractive()

    const enterBtn = mkBtn(300, '[ ENTER — retomar do checkpoint ]', '#ffffff')
    const rBtn     = mkBtn(342, '[ R — recomeçar a fase ]',          '#aaaaaa')
    const escTxt   = this.add.text(cx, 388, 'ESC — voltar ao menu',  {
      fontSize: '13px', color: '#555555',
    }).setOrigin(0.5)

    this.tweens.add({ targets: enterBtn, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 })

    // ── Tip ───────────────────────────────────────────────────────────────
    this.add.text(cx, GAME_HEIGHT - 14, 'Dica: use TAB para trocar de cachorra e evitar golpes!', {
      fontSize: '10px', color: '#443333',
    }).setOrigin(0.5)

    // ── Actions ───────────────────────────────────────────────────────────
    let _done = false
    const restart = (resetFn: () => void) => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      resetFn()
      this.scene.stop(KEYS.UI)
      this.scene.start(KEYS.GAME)
    }

    const onEnter = () => restart(() => gameState.resetAtCheckpoint())
    const onR     = () => restart(() => gameState.resetLevel())
    const onEsc   = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.MENU)
    }

    const kb = this.input.keyboard!
    kb.on('keydown-ENTER', onEnter)
    kb.on('keydown-R',     onR)
    kb.on('keydown-ESC',   onEsc)
    enterBtn.on('pointerdown', onEnter)
    rBtn.on('pointerdown', onR)
    escTxt.setInteractive().on('pointerdown', onEsc)

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', onEnter)
      kb.off('keydown-R',     onR)
      kb.off('keydown-ESC',   onEsc)
    })

    // ── Music ─────────────────────────────────────────────────────────────
    SoundManager.play('gameOver')
    this.time.delayedCall(800, () => SoundManager.playProceduralBgm('gameover'))
  }
}
