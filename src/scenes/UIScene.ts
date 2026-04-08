import Phaser from 'phaser'
import { KEYS, GAME_WIDTH } from '../constants'
import { gameState } from '../GameState'

export class UIScene extends Phaser.Scene {
  private heartImages: Phaser.GameObjects.Image[] = []
  private scoreText!: Phaser.GameObjects.Text
  private dogText!: Phaser.GameObjects.Text
  private _levelNameText!: Phaser.GameObjects.Text
  private cooldownBar!: Phaser.GameObjects.Rectangle
  private cooldownBg!: Phaser.GameObjects.Rectangle
  private accessoryText!: Phaser.GameObjects.Text
  private _puIcon!: Phaser.GameObjects.Text
  private _puBarBg!: Phaser.GameObjects.Rectangle
  private _puBar!: Phaser.GameObjects.Rectangle
  private _damageFlash!: Phaser.GameObjects.Rectangle
  private _lastHitAtTracked: number = 0
  private _cdGraphics!: Phaser.GameObjects.Graphics
  private _cdIcon!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private _muteText!: Phaser.GameObjects.Text
  private _timeRemaining: number = 0
  private _timerActive: boolean = false

  constructor() { super({ key: KEYS.UI, active: false }) }

  create(): void {
    this.heartImages = []
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x000000, 0.45).setScrollFactor(0)
    for (let i = 0; i < 3; i++) {
      this.heartImages.push(this.add.image(20 + i * 30, 22, KEYS.HEART).setScrollFactor(0).setScale(1.1))
    }
    this.scoreText = this.add.text(GAME_WIDTH - 10, 10, 'Ossos: 0', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0)
    this.dogText = this.add.text(GAME_WIDTH / 2, 10, 'RAYA', {
      fontSize: '14px', color: '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0)
    this.cooldownBg  = this.add.rectangle(GAME_WIDTH / 2, 30, 60, 6, 0x444444).setScrollFactor(0)
    this.cooldownBar = this.add.rectangle(GAME_WIDTH / 2, 30, 60, 6, 0x44ff44).setScrollFactor(0)
    this.accessoryText = this.add.text(140, 10, '', { fontSize: '12px', color: '#ffdd00' }).setScrollFactor(0)
    this._puIcon   = this.add.text(140, 24, '', { fontSize: '14px' }).setScrollFactor(0)
    this._puBarBg  = this.add.rectangle(185, 31, 60, 7, 0x333333).setScrollFactor(0)
    this._puBar    = this.add.rectangle(185, 31, 60, 7, 0x06b6d4).setScrollFactor(0).setOrigin(0.5)
    this._damageFlash = this.add.rectangle(GAME_WIDTH / 2, 240, GAME_WIDTH, 480, 0xff0000, 0)
      .setScrollFactor(0).setDepth(10)

    this.timerText = this.add.text(GAME_WIDTH / 2 + 80, 10, '', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold', fontFamily: 'monospace'
    }).setScrollFactor(0)

    // Cooldown visual da habilidade (Shift)
    this._cdGraphics = this.add.graphics().setScrollFactor(0).setDepth(5)
    this._cdIcon = this.add.text(292, 22, '⚡', {
      fontSize: '14px'
    }).setScrollFactor(0).setDepth(6).setOrigin(0.5)

    // Indicador de mudo (M para alternar)
    this._muteText = this.add.text(GAME_WIDTH - 8, 36, '🔊', {
      fontSize: '12px', color: '#aaaaaa',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(5).setAlpha(0.7)

    // Nome da fase — aparece no topo com fade-in e some para transparência
    this._levelNameText = this.add.text(GAME_WIDTH / 2, 8, '', {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(6).setAlpha(0)

    // Escuta evento de início de timer emitido por GameScene
    const gameScene = this.scene.get(KEYS.GAME)
    gameScene.events.on('start-timer', (seconds: number) => {
      this._timeRemaining = seconds
      this._timerActive = seconds > 0
    })
    gameScene.events.on('level-name', (name: string) => {
      this._levelNameText.setText(name)
      this.tweens.add({
        targets: this._levelNameText, alpha: 0.85, duration: 600,
        onComplete: () => {
          this.time.delayedCall(2500, () => {
            this.tweens.add({ targets: this._levelNameText, alpha: 0.3, duration: 1200 })
          })
        },
      })
    })
  }

  update(): void {
    const now = this.time.now
    for (let i = 0; i < 3; i++) {
      const full = i < gameState.hearts
      this.heartImages[i].setTexture(full ? KEYS.HEART : KEYS.HEART_EMPTY)
      if (!full && now - gameState.lastHitAt < 500) {
        this.heartImages[i].setAlpha(Math.sin(now * 0.02) * 0.5 + 0.5)
      } else {
        this.heartImages[i].setAlpha(1)
      }
    }
    // Flash de dano
    if (gameState.lastHitAt !== this._lastHitAtTracked && gameState.lastHitAt > 0) {
      this._lastHitAtTracked = gameState.lastHitAt
      this._damageFlash.setAlpha(0.35)
      this.tweens.add({
        targets: this._damageFlash,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
      })
    }

    this.scoreText.setText(`Ossos: ${gameState.score}`)
    const isDog = gameState.activeDog === 'raya'
    this.dogText.setText(isDog ? 'RAYA' : 'CRUELLA').setColor(isDog ? '#ff6b6b' : '#6b6bff')
    const swapRemaining = Math.max(0, gameState.swapBlockedUntil - now)
    const fraction = Math.max(0, 1 - swapRemaining / 1500)
    this.cooldownBar.setDisplaySize(60 * fraction, 6)
    this.cooldownBar.setFillStyle(fraction >= 1 ? 0x44ff44 : 0xff8800)
    const accLabels: Record<string, string> = {
      laco: '🎀 Laço', coleira: '🏷️ Coleira', chapeu: '🎉 Chapéu', bandana: '🩱 Bandana'
    }
    this.accessoryText.setText(gameState.equippedAccessory ? accLabels[gameState.equippedAccessory] : '')
    if (gameState.hasAnyPowerUp(now) && gameState.activePowerUp) {
      const puIcons: Record<string, string> = {
        petisco: '🍖', pipoca: '🍿', churrasco: '🥩', bola: '🎾', frisbee: '🥏'
      }
      const fraction = Math.max(0, (gameState.activePowerUp.expiresAt - now) / 10000)
      const barColor = fraction < 0.2 ? 0xef4444 : 0x06b6d4
      this._puIcon.setText(puIcons[gameState.activePowerUp.type] ?? '⚡')
      this._puBar.setDisplaySize(60 * fraction, 7).setFillStyle(barColor)
      this._puBarBg.setVisible(true)
      this._puBar.setVisible(true)
      this._puIcon.setVisible(true)
    } else {
      this._puBarBg.setVisible(false)
      this._puBar.setVisible(false)
      this._puIcon.setVisible(false)
    }

    // Timer de fase
    if (this._timerActive) {
      this._timeRemaining -= this.game.loop.delta / 1000
      if (this._timeRemaining <= 0) {
        this._timeRemaining = 0
        this._timerActive = false
        gameState.hearts = 0
        // Dispara game-over imediatamente via GameScene
        this.scene.get(KEYS.GAME).events.emit('timer-game-over')
      }
      const secs = Math.ceil(this._timeRemaining)
      const color = secs <= 10 ? '#ef4444' : secs <= 30 ? '#f97316' : '#ffffff'
      this.timerText.setText(`⏱ ${String(secs).padStart(3, '0')}`).setColor(color)

      // Pisca abaixo de 10s
      if (secs <= 10) {
        this.timerText.setAlpha(Math.sin(now * 0.008) * 0.5 + 0.5)
      } else {
        this.timerText.setAlpha(1)
      }
    } else {
      this.timerText.setText('')
    }

    // Cooldown arc da habilidade especial
    const cdFraction = Math.min(1, (now - gameState.abilityUsedAt) / Math.max(1, gameState.abilityCooldownMs))
    const cx = 292, cy = 22, r = 13
    this._cdGraphics.clear()
    // Círculo de fundo
    this._cdGraphics.fillStyle(0x222222, 0.85)
    this._cdGraphics.fillCircle(cx, cy, r)
    // Arco de progresso
    if (cdFraction >= 1) {
      this._cdGraphics.fillStyle(0x22c55e, 1)
      this._cdGraphics.fillCircle(cx, cy, r)
    } else {
      this._cdGraphics.fillStyle(0x7c3aed, 0.9)
      this._cdGraphics.slice(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + cdFraction * Math.PI * 2, false)
      this._cdGraphics.fillPath()
    }
    // Círculo interno (efeito de anel)
    this._cdGraphics.fillStyle(0x1a1a2e, 1)
    this._cdGraphics.fillCircle(cx, cy, r - 4)
    // Ícone muda por cachorra ativa
    this._cdIcon.setText(gameState.activeDog === 'raya' ? '⚡' : '🔊')

    // Indicador de mudo
    this._muteText.setText(gameState.muted ? '🔇 M' : '🔊 M')
      .setAlpha(gameState.muted ? 1 : 0.45)
  }
}
