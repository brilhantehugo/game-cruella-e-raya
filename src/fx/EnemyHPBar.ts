import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'

export class EnemyHPBar {
  private bar: Phaser.GameObjects.Graphics
  private scene: Phaser.Scene
  private fadeTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bar = scene.add.graphics().setDepth(20)
  }

  show(enemy: Enemy): void {
    // Cancela fade anterior se existir
    this.fadeTimer?.remove()
    this.bar.clear()
    this.bar.setAlpha(1)

    const W = 20, H = 3
    const x = enemy.x - W / 2
    const y = enemy.y - enemy.displayHeight / 2 - 6

    // Fundo cinza
    this.bar.fillStyle(0x333333)
    this.bar.fillRect(x, y, W, H)

    // Barra de HP proporcional: verde > 50%, laranja > 25%, vermelho ≤ 25%
    const ratio = Math.max(0, enemy.hp / enemy.maxHp)
    const color = ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xffaa00 : 0xff3333
    this.bar.fillStyle(color)
    this.bar.fillRect(x, y, W * ratio, H)

    // Fade após 2500ms
    this.fadeTimer = this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: this.bar,
        alpha: 0,
        duration: 300,
        onComplete: () => this.bar.clear(),
      })
    })
  }

  destroy(): void {
    this.fadeTimer?.remove()
    this.bar.destroy()
  }
}
