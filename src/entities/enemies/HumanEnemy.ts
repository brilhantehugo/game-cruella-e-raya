import Phaser from 'phaser'
import { Enemy } from '../Enemy'
import {
  EnemyStateMachine,
  computeNextHumanState,
  onBarkHeardNextState,
  isInCone,
  type HumanConfig,
} from './EnemyStateMachine'

export { HumanConfig }

export abstract class HumanEnemy extends Enemy {
  override readonly isNPC = true

  protected _sm: EnemyStateMachine
  protected _config: HumanConfig
  protected _playerX: number = 0
  protected _playerY: number = 0

  private _patrolLeft: number
  private _patrolRight: number
  private _detectIcon: Phaser.GameObjects.Text | null = null
  private _attackPhase: 'none' | 'telegraph' | 'hit' = 'none'
  private _attackTimer: number = 0
  private _groundLayer: Phaser.Physics.Arcade.StaticGroup | null = null

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    texture: string,
    config: HumanConfig,
  ) {
    super(scene, x, y, texture, 999, config.patrolSpeed)
    this._config = config
    this._sm = new EnemyStateMachine(() => this.scene.time.now)
    this._patrolLeft  = x - config.patrolRange
    this._patrolRight = x + config.patrolRange
    this.setScale(1.0)
    // Ajuste de corpo: sprites Pixel Lab têm canvas 68×68 mas personagem ocupa ~28×44px
    ;(this.body as Phaser.Physics.Arcade.Body).setSize(28, 44, true)
    this.setDepth(3)
    this.setVelocityX(this.speed)
  }

  /** Fornece a camada de chão para detecção de borda de plataforma. Chamar uma vez após spawn. */
  setGroundLayer(layer: Phaser.Physics.Arcade.StaticGroup): void {
    this._groundLayer = layer
  }

  /** Called by GameScene.update() to provide player position. */
  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  /** Called when Cruella's bark is heard. */
  onBarkHeard(dist: number): void {
    const next = onBarkHeardNextState(this._sm.state, dist, this._config)
    if (next) {
      this._sm.transition(next)
      if (next === 'DETECT') this._showDetectIcon()
    }
  }

  /** Immune to damage — only flashes */
  override takeDamage(_amount: number = 1): void {
    this.setTint(0xffcccc)
    this.scene.time.delayedCall(120, () => { if (this.active) this.clearTint() })
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    const body = this.body as Phaser.Physics.Arcade.Body
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const inCone = isInCone(
      this.x, this.y, this.direction === 1,
      this._playerX, this._playerY,
      this._config.detectionRange, this._config.coneAngle / 2,
    )

    // Save last known position during chase
    if (this._sm.state === 'CHASE') {
      this._sm.setLastKnown(this._playerX, this._playerY)
    }

    // DETECT → PATROL fallback if player exits cone before 500ms
    if (this._sm.state === 'DETECT' && !inCone) {
      this._hideDetectIcon()
      this._sm.transition('PATROL')
    }

    const next = computeNextHumanState({
      state: this._sm.state,
      timeInState: this._sm.timeInState(),
      distToPlayer: dist,
      playerInCone: inCone,
      config: this._config,
      reachedLastKnown: this._hasReachedLastKnown(),
    })

    if (next) {
      if (next === 'DETECT') this._showDetectIcon()
      else this._hideDetectIcon()
      this._sm.transition(next)
    }

    switch (this._sm.state) {
      case 'PATROL':   this._doPatrol(body);   break
      case 'DETECT':   this._doDetect(body);   break
      case 'CHASE':    this._doChase(body);    break
      case 'SEARCH':   this._doSearch(body);   break
      case 'ATTACK':   this._doAttack(dist);   break
      case 'COOLDOWN': this._doCooldown(body); break
    }

    this.setFlipX(this.direction === -1)
  }

  // ─── State behaviors ──────────────────────────────────────────────────────

  private _doPatrol(body: Phaser.Physics.Arcade.Body): void {
    const worldLeft  = this.scene.physics.world.bounds.left + 16
    const worldRight = this.scene.physics.world.bounds.right - 16
    if (body.blocked.left || this.x <= this._patrolLeft || this.x <= worldLeft) {
      this.direction = 1
    } else if (body.blocked.right || this.x >= this._patrolRight || this.x >= worldRight) {
      this.direction = -1
    } else if (!this._hasGroundAhead(this.direction)) {
      this.direction *= -1   // inverter na borda da plataforma
    }
    this.setVelocityX(this.direction * this._config.patrolSpeed)
  }

  private _doDetect(body: Phaser.Physics.Arcade.Body): void {
    body.setVelocityX(0)
  }

  private _doChase(body: Phaser.Physics.Arcade.Body): void {
    this.direction = this._playerX > this.x ? 1 : -1
    if (body.blocked.left)  this.direction = 1
    if (body.blocked.right) this.direction = -1
    if (!this._hasGroundAhead(this.direction)) {
      this.setVelocityX(0)   // parar na borda — não cair atrás do jogador
      return
    }
    this.setVelocityX(this.direction * this._config.chaseSpeed)
  }

  private _doSearch(body: Phaser.Physics.Arcade.Body): void {
    const dx = this._sm.lastKnownX - this.x
    if (Math.abs(dx) > 8) {
      this.direction = dx > 0 ? 1 : -1
      this.setVelocityX(this.direction * this._config.patrolSpeed)
    } else {
      body.setVelocityX(0)
    }
  }

  private _doAttack(dist: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(0)
    const now = this.scene.time.now

    if (this._attackPhase === 'none') {
      this._attackPhase = 'telegraph'
      this._attackTimer = now
      this.setTint(0xffaa00)
    } else if (this._attackPhase === 'telegraph' && now - this._attackTimer >= 500) {
      this._attackPhase = 'hit'
      this.clearTint()
      if (dist <= this._config.attackRange + 20) {
        const knockbackDir = this._playerX > this.x ? 1 : -1
        this.emit('grabPlayer', knockbackDir)
      }
      this._attackPhase = 'none'
      this._sm.transition('COOLDOWN')
    }
  }

  private _doCooldown(body: Phaser.Physics.Arcade.Body): void {
    // Briefly back away before returning to patrol
    const retreatDir = this.direction * -1
    body.setVelocityX(retreatDir * this._config.patrolSpeed * 0.5)
  }

  // ─── Utilities ──────────────────────────────────────────────────────────────

  /**
   * Verifica se há um tile de chão ~28px à frente e ~36px abaixo.
   * Previne que o inimigo caminhe para além da borda de plataformas.
   * Sem groundLayer configurado, assume que há chão (comportamento legado).
   */
  private _hasGroundAhead(dir: number): boolean {
    if (!this._groundLayer) return true
    const checkX = this.x + dir * 28
    const checkY = this.y + 36
    const TILE   = 32
    return this._groundLayer.getChildren().some((child) => {
      const img = child as Phaser.GameObjects.Image
      return Math.abs(img.x - checkX) < TILE && Math.abs(img.y - checkY) < TILE
    })
  }

  private _hasReachedLastKnown(): boolean {
    return (
      this._sm.state === 'SEARCH' &&
      Math.abs(this.x - this._sm.lastKnownX) < 32
    )
  }

  private _showDetectIcon(): void {
    if (this._detectIcon) return
    this._detectIcon = this.scene.add.text(this.x, this.y - 38, '!', {
      fontSize: '20px', color: '#ffff00',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10)
    this.scene.tweens.add({
      targets: this._detectIcon,
      y: this._detectIcon.y - 6,
      duration: 200, yoyo: true, repeat: -1,
    })
  }

  private _hideDetectIcon(): void {
    if (this._detectIcon?.active) this._detectIcon.destroy()
    this._detectIcon = null
  }
}
