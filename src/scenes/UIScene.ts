import Phaser from 'phaser'
import { KEYS, GAME_WIDTH } from '../constants'
import { gameState } from '../GameState'

export class UIScene extends Phaser.Scene {
  private heartImages: Phaser.GameObjects.Image[] = []
  private scoreText!: Phaser.GameObjects.Text
  private dogText!: Phaser.GameObjects.Text
  private cooldownBar!: Phaser.GameObjects.Rectangle
  private cooldownBg!: Phaser.GameObjects.Rectangle
  private accessoryText!: Phaser.GameObjects.Text
  private powerUpText!: Phaser.GameObjects.Text

  constructor() { super({ key: KEYS.UI, active: false }) }

  create(): void {
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
    this.powerUpText   = this.add.text(140, 24, '', { fontSize: '11px', color: '#88ffff' }).setScrollFactor(0)
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
      const remaining = Math.ceil((gameState.activePowerUp.expiresAt - now) / 1000)
      const puLabels: Record<string, string> = {
        petisco: '🍖 Turbo', pipoca: '🍿 Super Pulo',
        churrasco: '🥩 Invencível', bola: '🎾 Bola', frisbee: '🥏 Frisbee'
      }
      this.powerUpText.setText(`${puLabels[gameState.activePowerUp.type] ?? gameState.activePowerUp.type} ${remaining}s`)
    } else {
      this.powerUpText.setText('')
    }
  }
}
