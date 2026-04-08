export class EffectsManager {
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
      g.setDepth(100)
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
    const colors = [0xff6600, 0xffaa00, 0xffdd00]
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i
      const dist = Phaser.Math.Between(20, 50)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(Phaser.Math.RND.pick(colors), 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 7))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 250,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 4 partículas amarelas ao coletar bone regular */
  boneSpark(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i
      const dist = Phaser.Math.Between(10, 25)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffff00, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 4))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 8 partículas douradas + flash de câmera ao coletar golden bone */
  goldenBoneBurst(x: number, y: number): void {
    this.scene.cameras.main.flash(80, 255, 215, 0)
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i
      const dist = Phaser.Math.Between(30, 70)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffd700, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 8))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
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

  /** 8 partículas brancas em arco ao ativar checkpoint */
  checkpointSparkle(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i - Math.PI / 2
      const dist = Phaser.Math.Between(20, 40)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0xffffff, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 5))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 10 partículas coloridas ao coletar power-up (cor por tipo) */
  powerUpBurst(x: number, y: number, type: string): void {
    const colorMap: Record<string, number> = {
      churrasco: 0xff4400,
      pipoca:    0xffff00,
      petisco:   0xff8800,
    }
    const color = colorMap[type] ?? 0x00ccff
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i
      const dist = Phaser.Math.Between(20, 60)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(color, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(3, 7))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 350,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }

  /** 4 partículas ciano ao stunar inimigo com bark */
  barkImpact(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * 2 / 4) * i
      const dist = Phaser.Math.Between(10, 20)
      const tx = x + Math.cos(angle) * dist
      const ty = y + Math.sin(angle) * dist
      const g = this.scene.add.graphics()
      g.fillStyle(0x00ccff, 1)
      g.fillCircle(0, 0, Phaser.Math.Between(2, 4))
      g.setPosition(x, y)
      g.setDepth(100)
      this.scene.tweens.add({
        targets: g,
        x: tx,
        y: ty,
        alpha: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => g.destroy(),
      })
    }
  }
}
