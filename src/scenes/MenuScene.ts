import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'
import { SettingsOverlay } from '../ui/SettingsOverlay'

export class MenuScene extends Phaser.Scene {
  constructor() { super(KEYS.MENU) }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // ── Starfield background ────────────────────────────────────────────
    const starGfx = this.add.graphics()
    const starData: { x: number; y: number; r: number; baseAlpha: number }[] = []
    for (let s = 0; s < 90; s++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH)
      const y = Phaser.Math.Between(0, GAME_HEIGHT)
      const r = Phaser.Math.FloatBetween(0.5, 2)
      const a = Phaser.Math.FloatBetween(0.3, 0.9)
      starData.push({ x, y, r, baseAlpha: a })
    }
    // Redraw stars with a slow twinkle each frame
    let starT = 0
    this.events.on('update', (_: number, delta: number) => {
      starT += delta * 0.001
      starGfx.clear()
      starData.forEach((st, i) => {
        const a = Math.max(0, st.baseAlpha + Math.sin(starT * (1 + i % 4) + i) * 0.3)
        starGfx.fillStyle(0xffffff, a)
        starGfx.fillCircle(st.x, st.y, st.r)
      })
    })

    // ── Decorative corner brackets ──────────────────────────────────────
    const frame = this.add.graphics()
    frame.lineStyle(2, 0xff6b6b, 0.6)
    const bx = 12, by = 12, blen = 28
    // top-left
    frame.strokePoints([{ x: bx + blen, y: by }, { x: bx, y: by }, { x: bx, y: by + blen }], false)
    // top-right
    frame.strokePoints([{ x: GAME_WIDTH - bx - blen, y: by }, { x: GAME_WIDTH - bx, y: by }, { x: GAME_WIDTH - bx, y: by + blen }], false)
    // bottom-left
    frame.strokePoints([{ x: bx, y: GAME_HEIGHT - by - blen }, { x: bx, y: GAME_HEIGHT - by }, { x: bx + blen, y: GAME_HEIGHT - by }], false)
    // bottom-right
    frame.strokePoints([{ x: GAME_WIDTH - bx, y: GAME_HEIGHT - by - blen }, { x: GAME_WIDTH - bx, y: GAME_HEIGHT - by }, { x: GAME_WIDTH - bx - blen, y: GAME_HEIGHT - by }], false)

    // ── Horizontal rule lines ───────────────────────────────────────────
    const lineGfx = this.add.graphics()
    lineGfx.lineStyle(1, 0xff6b6b, 0.25)
    lineGfx.strokeLineShape(new Phaser.Geom.Line(40, 155, GAME_WIDTH - 40, 155))
    lineGfx.strokeLineShape(new Phaser.Geom.Line(40, 400, GAME_WIDTH - 40, 400))

    // ── Floating bone decorations ───────────────────────────────────────
    const bonePositions = [
      { x: 160, y: 200 }, { x: 630, y: 200 },
      { x: 120, y: 330 }, { x: 675, y: 340 },
    ]
    bonePositions.forEach((pos, i) => {
      const bone = this.add.text(pos.x, pos.y, '🦴', {
        fontSize: '22px',
      }).setOrigin(0.5).setAlpha(0.35)
      this.tweens.add({
        targets: bone,
        y: pos.y - 10,
        duration: 1800 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 200,
      })
    })

    // ── Paw print accents ───────────────────────────────────────────────
    const pawPositions = [
      { x: 55, y: 240 }, { x: 742, y: 240 },
      { x: 30, y: 340 }, { x: 769, y: 340 },
    ]
    pawPositions.forEach((pos, i) => {
      const paw = this.add.text(pos.x, pos.y, '🐾', { fontSize: i < 2 ? '28px' : '18px' })
        .setOrigin(0.5).setAlpha(0.2)
      this.tweens.add({
        targets: paw,
        alpha: 0.45,
        duration: 1200 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 300,
      })
    })

    // ── Hidrante decorativo (baixo-esquerda e baixo-direita) ─────────────
    const hydrantGfx = this.add.graphics()
    const drawHydrant = (hx: number) => {
      hydrantGfx.fillStyle(0xff2200, 0.3)
      hydrantGfx.fillRect(hx + 3, GAME_HEIGHT - 55, 10, 18)
      hydrantGfx.fillRect(hx, GAME_HEIGHT - 40, 16, 5)
      hydrantGfx.fillRect(hx + 5, GAME_HEIGHT - 60, 6, 7)
      hydrantGfx.fillStyle(0x882200, 0.2)
      hydrantGfx.fillRect(hx - 3, GAME_HEIGHT - 50, 5, 5)
      hydrantGfx.fillRect(hx + 14, GAME_HEIGHT - 50, 5, 5)
    }
    drawHydrant(22)
    drawHydrant(GAME_WIDTH - 38)

    // ── Character sprites (with bob animation) ──────────────────────────
    // Cruella fica à esquerda, Raya à direita
    const cruellaSprite = this.add.sprite(72, 270, KEYS.CRUELLA, 0).setScale(4).setFlipX(false)
    const rayaSprite    = this.add.sprite(728, 270, KEYS.RAYA, 0).setScale(4).setFlipX(true)

    this.tweens.add({ targets: cruellaSprite, y: 262, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: rayaSprite,    y: 262, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 })

    // ── Glow halo behind title ──────────────────────────────────────────
    const haloGfx = this.add.graphics()
    haloGfx.fillStyle(0xff6b6b, 0.08)
    haloGfx.fillEllipse(GAME_WIDTH / 2, 120, 520, 90)

    // ── Title (floats) ──────────────────────────────────────────────────
    const title = this.add.text(GAME_WIDTH / 2, 120, 'CRUELLA & RAYA', {
      fontSize: '52px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: [title, haloGfx],
      y: '+=−10',
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
    // Separate float for title only (halo stays)
    this.tweens.add({
      targets: title,
      y: 110,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.add.text(GAME_WIDTH / 2, 185, 'Aventura no Bairro', {
      fontSize: '20px', color: '#aaaaaa',
    }).setOrigin(0.5)

    // ── Version / subtitle tag ──────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, 207, '— uma história de coragem e latidos —', {
      fontSize: '10px', color: '#444466',
    }).setOrigin(0.5)

    // ── Play button (blinks) ────────────────────────────────────────────
    const playBtn = this.add.text(GAME_WIDTH / 2, 270, '[ ENTER — JOGAR ]', {
      fontSize: '26px', color: '#ffff00', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()

    this.tweens.add({ targets: playBtn, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 })

    // ── Other buttons ───────────────────────────────────────────────────
    const galBtn = this.add.text(GAME_WIDTH / 2, 318, '[ G — GALERIA DE OSSOS ]', {
      fontSize: '18px', color: '#88ccff',
    }).setOrigin(0.5).setInteractive()

    const howBtn = this.add.text(GAME_WIDTH / 2, 354, '[ H — COMO JOGAR ]', {
      fontSize: '18px', color: '#88ffaa',
    }).setOrigin(0.5).setInteractive()

    const enemyBtn = this.add.text(GAME_WIDTH / 2, 389, '[ I — PERSONAGENS ]', {
      fontSize: '16px', color: '#ffaa55',
    }).setOrigin(0.5).setInteractive()

    const profileBtn = this.add.text(GAME_WIDTH / 2, 415, '[ P — TROCAR PERFIL ]', {
      fontSize: '14px', color: '#7766aa',
    }).setOrigin(0.5).setInteractive()

    const achievBtn = this.add.text(GAME_WIDTH / 2, 432, '[ C — 🏆 CONQUISTAS ]', {
      fontSize: '13px', color: '#ffa040',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })

    // ── Settings overlay ────────────────────────────────────────────────
    const settingsOverlay = new SettingsOverlay(this)

    const settingsBtn = this.add.text(GAME_WIDTH / 2, 449, '[ S — CONFIGURAÇÕES ]', {
      fontSize: '13px', color: '#cccccc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    settingsBtn.on('pointerdown', () => settingsOverlay.show())

    // ── Actions ─────────────────────────────────────────────────────────
    const startGame   = () => { this.scene.start(KEYS.INTRO_CRAWL) }
    const goGallery   = () => { this.scene.start(KEYS.GALLERY) }
    const goHowToPlay = () => { this.scene.start(KEYS.HOW_TO_PLAY) }
    const goEnemies   = () => { this.scene.start(KEYS.ENEMY_INFO) }
    const goProfile       = () => { this.scene.start(KEYS.PROFILE_SELECT) }
    const goAchievements  = () => { this.scene.start('AchievementsScene') }

    const kb = this.input.keyboard!
    const onS   = () => { if (!settingsOverlay.isVisible()) settingsOverlay.show() }
    const onEsc = () => { if (settingsOverlay.isVisible()) settingsOverlay.hide() }
    const onM   = () => {
      SoundManager.setMuted(!gameState.muted)
      if (settingsOverlay.isVisible()) settingsOverlay.show() // refresh mute label
    }

    kb.on('keydown-ENTER', startGame)
    kb.on('keydown-G', goGallery)
    kb.on('keydown-H', goHowToPlay)
    kb.on('keydown-I', goEnemies)
    kb.on('keydown-P', goProfile)
    kb.on('keydown-C', goAchievements)
    kb.on('keydown-S',   onS)
    kb.on('keydown-ESC', onEsc)
    kb.on('keydown-M',   onM)
    playBtn.on('pointerdown', startGame)
    galBtn.on('pointerdown', goGallery)
    howBtn.on('pointerdown', goHowToPlay)
    enemyBtn.on('pointerdown', goEnemies)
    profileBtn.on('pointerdown', goProfile)
    achievBtn.on('pointerdown', goAchievements)

    this.events.once('shutdown', () => {
      kb.off('keydown-ENTER', startGame)
      kb.off('keydown-G', goGallery)
      kb.off('keydown-H', goHowToPlay)
      kb.off('keydown-I', goEnemies)
      kb.off('keydown-P', goProfile)
      kb.off('keydown-C', goAchievements)
      kb.off('keydown-S',   onS)
      kb.off('keydown-ESC', onEsc)
      kb.off('keydown-M',   onM)
      SoundManager.stopBgm()
    })

    // ── Procedural BGM ──────────────────────────────────────────────────
    SoundManager.playProceduralBgm('menu')

  }
}
