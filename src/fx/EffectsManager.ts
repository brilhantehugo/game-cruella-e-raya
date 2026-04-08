export class EffectsManager {
  private static readonly PARTICLE_DEPTH = 100

  constructor(private scene: Phaser.Scene) {}

  /** Poeira nos pés (pulo = 'small', aterrissagem = 'large') */
  dustPuff(x: number, y: number, size: 'small' | 'large' = 'small'): void {
    const count = 5
    const radius = size === 'large' ? 50 : 30
    const duration = 300
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI / (count - 1)) * i - Math.PI / 2
      const dist = Phaser.Math.Between(Math.floor(radius * 0.4), radius)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const r = size === 'large' ? Phaser.Math.Between(4, 8) : Phaser.Math.Between(2, 5)
      const color = Phaser.Math.RND.pick([0xaaaaaa, 0xccbbaa, 0x998877])
      const g = this.scene.add.graphics()
      g.fillStyle(color, 0.8)
      g.fillCircle(0, 0, r)
      g.setPosition(x, y)
      g.setDepth(EffectsManager.PARTICLE_DEPTH)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** Ghost trail: cópia fantasma do sprite durante o dash */
  ghostTrail(sprite: Phaser.Physics.Arcade.Sprite): void {
    const copy = this.scene.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name)
    copy.setFlipX(sprite.flipX)
    copy.setScale(sprite.scaleX, sprite.scaleY)
    copy.setAlpha(0.4)
    copy.setDepth(sprite.depth - 1)
    this.scene.tweens.add({
      targets: copy,
      alpha: 0,
      duration: 150,
      ease: 'Linear',
      onComplete: () => copy.destroy(),
    })
  }

  /** Burst de partículas laranja/amarelas ao matar inimigo */
  enemyDeathBurst(x: number, y: number): void {
    this._burst(x, y, 6, [0xff6600, 0xffaa00, 0xffdd00], 20, 50, 3, 7, 250)
  }

  /** 4 partículas amarelas ao coletar bone regular */
  boneSpark(x: number, y: number): void {
    this._burst(x, y, 4, 0xffff00, 10, 25, 2, 4, 200)
  }

  /** 8 partículas douradas + flash de câmera ao coletar golden bone */
  goldenBoneBurst(x: number, y: number): void {
    this.scene.cameras.main.flash(80, 255, 215, 0)
    this._burst(x, y, 8, 0xffd700, 30, 70, 3, 8, 300)
  }

  /** Score popup animado com bounce (scale 0.5→1.2→1.0 em 120ms, depois sobe e some) */
  scorePopupBounce(text: string, x: number, y: number, color: string = '#ffffff'): void {
    const t = this.scene.add.text(x, y, text, {
      fontSize: '18px',
      fontFamily: 'Arial Black, Arial',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    })
    t.setOrigin(0.5)
    t.setDepth(200)
    t.setScale(0.5)
    // Fase 1: bounce in (0.5 → 1.2 em 80ms)
    this.scene.tweens.add({
      targets: t,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 80,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // Fase 2: settle (1.2 → 1.0 em 40ms)
        this.scene.tweens.add({
          targets: t,
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 40,
          ease: 'Quad.easeIn',
          onComplete: () => {
            // Fase 3: subir e desaparecer (680ms)
            this.scene.tweens.add({
              targets: t,
              y: y - 50,
              alpha: 0,
              duration: 680,
              ease: 'Quad.easeIn',
              onComplete: () => t.destroy(),
            })
          },
        })
      },
    })
  }

  /** 8 partículas brancas em círculo completo ao ativar checkpoint */
  checkpointSparkle(x: number, y: number): void {
    this._burst(x, y, 8, 0xffffff, 20, 40, 2, 5, 500, -Math.PI / 2)
  }

  /** 10 partículas coloridas ao coletar power-up (cor por tipo) */
  powerUpBurst(x: number, y: number, type: string): void {
    const colorMap: Record<string, number> = {
      churrasco: 0xff4400,
      pipoca:    0xffff00,
      petisco:   0xff8800,
    }
    const color = colorMap[type] ?? 0x00ccff
    this._burst(x, y, 10, color, 20, 60, 3, 7, 350)
  }

  /** 4 partículas ciano ao stunar inimigo com bark */
  barkImpact(x: number, y: number): void {
    this._burst(x, y, 4, 0x00ccff, 10, 20, 2, 4, 200)
  }

  private _burst(
    x: number, y: number,
    count: number,
    colors: number | number[],
    distMin: number, distMax: number,
    radiusMin: number, radiusMax: number,
    duration: number,
    angleOffset: number = 0,
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + angleOffset
      const dist = Phaser.Math.Between(distMin, distMax)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const color = Array.isArray(colors) ? Phaser.Math.RND.pick(colors) : colors
      const g = this.scene.add.graphics()
      g.fillStyle(color, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(radiusMin, radiusMax))
      g.setPosition(x, y)
      g.setDepth(EffectsManager.PARTICLE_DEPTH)
      this.scene.tweens.add({
        targets: g, x: tx, y: ty, alpha: 0,
        duration, ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }
}
