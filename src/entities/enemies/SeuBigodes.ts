import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { GatoMalencarado } from './GatoMalencarado'

type BossPhase = 1 | 2 | 3

export class SeuBigodes extends Enemy {
  private readonly MAX_HP = 12
  private phase: BossPhase = 1
  private actionTimer: number = 0
  private jumpCooldown: number = 0
  private minions: GatoMalencarado[] = []
  /** Prevents update() and phase transitions from running during death animation */
  private _isDying = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.BIGODES, 12, 60)
    this.setScale(1.4)  // 68×68 × 1.4 ≈ 95px — equivalente ao sprite anterior 48×48 × 2
    // Boss inicia parado
    this.setVelocityX(0)
  }

  /** Caps single-hit damage to 2 so stomp/dash don't one-shot the boss */
  takeDamage(amount: number = 1): void {
    if (this._isDying) return
    super.takeDamage(Math.min(amount, 2))
  }

  update(time: number, _delta: number): void {
    if (this._isDying || this.isStunned()) return

    this._checkPhaseTransition()

    switch (this.phase) {
      case 1: this._phase1(time); break
      case 2: this._phase2(time); break
      case 3: this._phase3(time); break
    }
  }

  private _checkPhaseTransition(): void {
    const hpPct = this.hp / this.MAX_HP
    if (hpPct <= 0.25 && this.phase < 3) {
      this.phase = 3
      this.speed = 100
      this._spawnMinions()
      this.setTint(0xff4444)
    } else if (hpPct <= 0.5 && this.phase < 2) {
      this.phase = 2
      this.setTint(0xff8800)
    }
  }

  /** Fase 1: move lentamente + joga lixo em arco a cada 2s */
  private _phase1(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.left)  this.setVelocityX( this.speed)
    if (body.blocked.right) this.setVelocityX(-this.speed)
    if (body.velocity.x === 0) this.setVelocityX(this.speed)

    if (time > this.actionTimer) {
      this._throwDebris()
      this.actionTimer = time + 2000
    }
  }

  /** Fase 2: fase 1 + pula entre plataformas a cada 2.5s */
  private _phase2(time: number): void {
    this._phase1(time)

    if (time > this.jumpCooldown) {
      const body = this.body as Phaser.Physics.Arcade.Body
      if (body.blocked.down) {
        this.setVelocityY(-550)
        // Camera shake ao pousar
        this.scene.time.delayedCall(600, () => {
          if (this.scene && this.active) {
            this.scene.cameras.main.shake(150, 0.008)
          }
        })
      }
      this.jumpCooldown = time + 2500
    }
  }

  /** Fase 3: mais rápido + mantém fase 2 + gerencia minions */
  private _phase3(time: number): void {
    this._phase2(time)
    // Remove minions mortos da lista
    this.minions = this.minions.filter(m => m.active)
  }

  private _throwDebris(): void {
    if (!this.scene || !this.active) return
    const dir = Math.random() < 0.5 ? -1 : 1
    const debris = this.scene.add.rectangle(this.x, this.y - 20, 14, 14, 0x888888)
    // Arc simulation using tween — purely visual, no physics body needed
    this.scene.tweens.add({
      targets: debris,
      x: debris.x + dir * 200,
      y: debris.y + 180,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => { if (debris.active) debris.destroy() }
    })
  }

  private _spawnMinions(): void {
    for (let i = 0; i < 2; i++) {
      const mx = this.x + (i === 0 ? -100 : 100)
      const gato = new GatoMalencarado(this.scene, mx, this.y)
      this.minions.push(gato)
      // GameScene ouvirá este evento e adicionará ao enemyGroup
      this.emit('spawnMinion', gato)
    }
  }

  protected onDeath(): void {
    this._isDying = true
    // Desativa física imediatamente para parar de colidir
    ;(this.body as Phaser.Physics.Arcade.Body).setEnable(false)
    // Animação de derrota antes de destruir
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 3,
      scaleY: 0.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      }
    })
  }
}
