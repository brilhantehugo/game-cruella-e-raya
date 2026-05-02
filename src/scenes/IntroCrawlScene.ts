import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { SoundManager } from '../audio/SoundManager'

const CRAWL_TEXT = [
  'Numa cidade qualquer, numa noite de quinta-feira…',
  '',
  'Raya estava em apuros.',
  'Como de costume.',
  '',
  'A sua única aliada: Cruella,',
  'uma lulu da pomerânia de 4 anos com excesso de confiança',
  'e falta de bom gosto.',
  '',
  'O plano: sair do prédio sem serem vistas.',
  'Simples. Infalível.',
  '',
  'Completamente impossível.',
  '',
  'Mas Raya nunca desiste.',
  '',
  'E Cruella nunca para de latir.',
]

export class IntroCrawlScene extends Phaser.Scene {
  private _started = false

  constructor() { super(KEYS.INTRO_CRAWL) }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000')

    // ── Starfield ───────────────────────────────────────────────────────
    const starGfx = this.add.graphics()
    const stars: { x: number; y: number; r: number; spd: number; a: number }[] = []
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: Phaser.Math.Between(0, GAME_HEIGHT),
        r: Phaser.Math.FloatBetween(0.4, 1.8),
        spd: Phaser.Math.FloatBetween(0.05, 0.25), // slow drift downward (parallax)
        a: Phaser.Math.FloatBetween(0.3, 1.0),
      })
    }

    // ── Distant "planet" silhouette (bottom-right) ──────────────────────
    const planetGfx = this.add.graphics()
    planetGfx.fillStyle(0x1a0a2e, 1)
    planetGfx.fillCircle(GAME_WIDTH + 60, GAME_HEIGHT + 20, 160)
    planetGfx.lineStyle(1, 0x6633aa, 0.4)
    planetGfx.strokeCircle(GAME_WIDTH + 60, GAME_HEIGHT + 20, 160)

    // ── Vignette overlay (dark edges, bright centre) ────────────────────
    const vigGfx = this.add.graphics()
    // Top fade
    const topGrad = vigGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.85, 0.85, 0, 0)
    vigGfx.fillRect(0, 0, GAME_WIDTH, 80)
    // Bottom fade
    vigGfx.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.9, 0.9)
    vigGfx.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80)

    // ── Star update (slow drift) ────────────────────────────────────────
    this.events.on('update', (_: number, delta: number) => {
      starGfx.clear()
      stars.forEach(st => {
        st.y += st.spd * delta * 0.06
        if (st.y > GAME_HEIGHT) st.y = 0
        starGfx.fillStyle(0xffffff, st.a)
        starGfx.fillCircle(st.x, st.y, st.r)
      })
    })

    // ── "A long time ago…" header ───────────────────────────────────────
    const headerTxt = this.add.text(GAME_WIDTH / 2, 38, 'Em algures num prédio de Fortaleza/CE…', {
      fontSize: '13px',
      color: '#7799cc',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0)

    this.tweens.add({
      targets: headerTxt, alpha: 1, duration: 1200, ease: 'Sine.easeIn',
      onComplete: () => {
        this.tweens.add({ targets: headerTxt, alpha: 0, delay: 2500, duration: 1000 })
      }
    })

    // ── Skip hint ───────────────────────────────────────────────────────
    const skipTxt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, 'ENTER ou ESPAÇO — pular', {
      fontSize: '10px', color: '#333355',
    }).setOrigin(0.5)
    this.tweens.add({ targets: skipTxt, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 })

    // ── Crawl container ─────────────────────────────────────────────────
    const container = this.add.container(GAME_WIDTH / 2, 0)

    const lineHeight = 26
    const totalLines = CRAWL_TEXT.length

    CRAWL_TEXT.forEach((txt, i) => {
      const progress = i / (totalLines - 1)
      const fontSize = Math.round(14 + progress * 8)
      const alpha    = 0.6 + progress * 0.4

      const t = this.add.text(0, i * lineHeight, txt, {
        fontSize: `${fontSize}px`,
        color: '#ffe81f',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0).setAlpha(alpha)
      container.add(t)
    })

    const totalHeight = totalLines * lineHeight
    container.setY(GAME_HEIGHT + 60)

    this.tweens.add({
      targets: container,
      y: -(totalHeight + 60),
      duration: 22000,
      ease: 'Linear',
      onComplete: () => this._start(),
    })

    // ── Input to skip (delay 400ms evita disparo imediato vindo da cena anterior)
    this.time.delayedCall(400, () => {
      const kb = this.input.keyboard!
      kb.on('keydown-ENTER', () => this._start())
      kb.on('keydown-SPACE', () => this._start())
      this.input.on('pointerdown', () => this._start())
    })

    // ── Dramatic intro music ────────────────────────────────────────────
    SoundManager.playProceduralBgm('intro')
  }

  private _start(): void {
    if (this._started) return
    this._started = true
    this.tweens.killAll()
    SoundManager.stopBgm()
    this.scene.start(KEYS.WORLD_MAP)
  }
}
