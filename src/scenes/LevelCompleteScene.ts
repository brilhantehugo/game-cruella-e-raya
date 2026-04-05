import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

/** Score thresholds for star rating */
const STAR_THRESHOLDS = [0, 200, 500]   // 1★, 2★, 3★

function calcStars(score: number): number {
  if (score >= STAR_THRESHOLDS[2]) return 3
  if (score >= STAR_THRESHOLDS[1]) return 2
  return 1
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super(KEYS.LEVEL_COMPLETE) }

  create(data: { score: number; bones: number; time: number }): void {
    const score = data?.score ?? gameState.score
    const bones = data?.bones ?? 0
    const elapsedSec = Math.floor((data?.time ?? 0) / 1000)
    const stars = calcStars(score)
    const cx = GAME_WIDTH / 2

    this.cameras.main.setBackgroundColor('#001a00')

    // ── Confetti particles ───────────────────────────────────────────────
    type Conf = { x: number; y: number; vx: number; vy: number; col: number; r: number; rot: number; rotV: number }
    const confGfx = this.add.graphics()
    const CONF_COLS = [0xffff00, 0xff88ff, 0x88ffff, 0xff8800, 0x88ff88, 0xff4466]
    const confs: Conf[] = []
    for (let i = 0; i < 70; i++) {
      confs.push({
        x:    Phaser.Math.Between(0, GAME_WIDTH),
        y:    Phaser.Math.Between(-40, -200),
        vx:   Phaser.Math.FloatBetween(-0.5, 0.5),
        vy:   Phaser.Math.FloatBetween(0.6, 1.8),
        col:  Phaser.Math.RND.pick(CONF_COLS),
        r:    Phaser.Math.FloatBetween(2.5, 5),
        rot:  0,
        rotV: Phaser.Math.FloatBetween(-3, 3),
      })
    }
    this.events.on('update', (_: number, delta: number) => {
      confGfx.clear()
      confs.forEach(c => {
        c.y += c.vy * delta * 0.07
        c.x += c.vx * delta * 0.04
        c.rot += c.rotV * delta * 0.003
        if (c.y > GAME_HEIGHT + 10) { c.y = -10; c.x = Phaser.Math.Between(0, GAME_WIDTH) }
        confGfx.fillStyle(c.col, 0.85)
        // Draw as a small rotated rectangle using a parallelogram approximation
        const hw = c.r, hh = c.r * 0.5
        const cos = Math.cos(c.rot), sin = Math.sin(c.rot)
        confGfx.fillTriangle(
          c.x + cos * hw - sin * hh, c.y + sin * hw + cos * hh,
          c.x - cos * hw - sin * hh, c.y - sin * hw + cos * hh,
          c.x - cos * hw + sin * hh, c.y - sin * hw - cos * hh,
        )
        confGfx.fillTriangle(
          c.x + cos * hw - sin * hh, c.y + sin * hw + cos * hh,
          c.x - cos * hw + sin * hh, c.y - sin * hw - cos * hh,
          c.x + cos * hw + sin * hh, c.y + sin * hw - cos * hh,
        )
      })
    })

    // ── Glow background behind title ─────────────────────────────────────
    const glow = this.add.graphics()
    glow.fillStyle(0x00ff44, 0.07)
    glow.fillEllipse(cx, 110, 600, 130)

    // ── Title ─────────────────────────────────────────────────────────────
    const titleTxt = this.add.text(cx, 72, 'CHEGAMOS! 🏠', {
      fontSize: '42px',
      color:    '#ffff00',
      fontStyle: 'bold',
      stroke:   '#005500',
      strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.4)

    this.tweens.add({
      targets: titleTxt, scaleX: 1, scaleY: 1,
      duration: 400, ease: 'Back.easeOut',
    })

    this.add.text(cx, 118, gameState.currentLevel + ' — completo!', {
      fontSize: '14px', color: '#44ff88',
    }).setOrigin(0.5)

    // ── Star rating ───────────────────────────────────────────────────────
    const starY = 158
    const starSpacing = 64
    for (let s = 0; s < 3; s++) {
      const sx = cx + (s - 1) * starSpacing
      const filled = s < stars
      const starTxt = this.add.text(sx, starY, filled ? '⭐' : '☆', {
        fontSize: filled ? '38px' : '34px',
        color: filled ? '#ffee00' : '#334433',
      }).setOrigin(0.5).setAlpha(0)

      this.tweens.add({
        targets: starTxt, alpha: 1,
        delay: 200 + s * 150, duration: 300, ease: 'Quad.easeOut',
        onStart: () => { if (filled) this.cameras.main.flash(80, 255, 255, 100) },
      })
      if (filled) {
        this.tweens.add({
          targets: starTxt, scaleX: 1.15, scaleY: 1.15,
          delay: 500 + s * 150, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        })
      }
    }

    const ratingLabels = ['Bom!', 'Muito bem!', 'Perfeito! 🐾']
    this.add.text(cx, starY + 42, ratingLabels[stars - 1], {
      fontSize: '13px', color: '#aaffaa', fontStyle: 'italic',
    }).setOrigin(0.5)

    // ── Score breakdown panel ─────────────────────────────────────────────
    const panelX = cx - 130, panelY = 222, panelW = 260, panelH = 110
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.5)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10)
    panel.lineStyle(1, 0x33aa55, 0.6)
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10)

    const rowStyle = (col: string) => ({ fontSize: '15px', color: col })
    const row = (label: string, value: string, y: number, col = '#dddddd') => {
      this.add.text(panelX + 16, y, label, rowStyle('#888888'))
      this.add.text(panelX + panelW - 16, y, value, { ...rowStyle(col), align: 'right' }).setOrigin(1, 0)
    }

    row('Pontuação',  `${score}`,                              panelY + 14,  '#ffff88')
    row('Ossos',     `${bones}`,                               panelY + 38,  '#ffffff')
    row('Tempo',     `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,'0')}`, panelY + 62, '#aaaaff')

    // Bonus line
    const bonusScore = bones * 10
    if (bonusScore > 0) {
      panel.lineStyle(1, 0x335533, 0.4)
      panel.strokeLineShape(new Phaser.Geom.Line(panelX + 12, panelY + 86, panelX + panelW - 12, panelY + 86))
      row('Bônus ossos', `+${bonusScore}`, panelY + 90, '#88ff88')
    }

    // ── Characters celebrating ────────────────────────────────────────────
    const rayaSprite = this.add.sprite(cx - 100, 365, KEYS.RAYA, 0)
      .setScale(3.2).setTint(0xffffff)
    const cruellaSprite = this.add.sprite(cx + 100, 370, KEYS.CRUELLA, 0)
      .setScale(3.2).setFlipX(true).setTint(0xffffff)

    this.tweens.add({ targets: rayaSprite,    y: 352, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: cruellaSprite, y: 357, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 120 })

    // ── Continue button ───────────────────────────────────────────────────
    const continueBtn = this.add.text(cx, GAME_HEIGHT - 22, '[ ENTER — próxima fase ]', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: continueBtn, alpha: 0.3, duration: 650, yoyo: true, repeat: -1 })

    let _done = false
    const goNext = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.GAME)
    }

    this.input.keyboard!.once('keydown-ENTER', goNext)
    continueBtn.on('pointerdown', goNext)

    // ── Music ─────────────────────────────────────────────────────────────
    SoundManager.play('levelComplete')
    this.time.delayedCall(400, () => SoundManager.playProceduralBgm('victory'))

    this.events.once('shutdown', () => SoundManager.stopBgm())
  }
}
