import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from '../entities/Enemy'
import { HumanEnemy } from '../entities/enemies/HumanEnemy'
import { SoundManager } from '../audio/SoundManager'
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../systems/CombatResolver'
import { ItemCollectHandler } from './ItemCollectHandler'
import type { GameScene } from './GameScene'
import { cameraShake } from '../fx/cameraShake'

export class CollisionSetup {
  /** Registra todos os colliders e overlaps da cena. Chamado por GameScene.create(). */
  static setup(scene: GameScene): void {
    const playerSprites = [scene.player.raya, scene.player.cruella]

    scene.physics.add.collider(scene.player.raya,   scene.groundLayer)
    scene.physics.add.collider(scene.player.cruella, scene.groundLayer)
    scene.physics.add.collider(scene.player.raya,   scene.platformLayer)
    scene.physics.add.collider(scene.player.cruella, scene.platformLayer)
    scene.physics.add.collider(scene.enemyGroup, scene.groundLayer)
    scene.physics.add.collider(scene.enemyGroup, scene.platformLayer)

    // Plataformas dinâmicas — jogadores (não inimigos, evita ficarem presos)
    if (scene._movingPlatformGroup.getLength() > 0) {
      const carryCallback = (
        playerSprite: Phaser.GameObjects.GameObject,
        platform: Phaser.GameObjects.GameObject
      ): boolean => {
        const pb    = (playerSprite as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        const platB = (platform    as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.Body
        if (pb.blocked.down && platB.velocity.x !== 0) {
          (playerSprite as Phaser.Physics.Arcade.Image).x += platB.velocity.x * (scene.game.loop.delta / 1000)
        }
        return true
      }
      scene.physics.add.collider(scene.player.raya,   scene._movingPlatformGroup, undefined, carryCallback as any, scene)
      scene.physics.add.collider(scene.player.cruella, scene._movingPlatformGroup, undefined, carryCallback as any, scene)
    }

    // Hazards — spike dá dano; fall-zone detectado em update()
    if (scene._hazardGroup.getLength() > 0) {
      const onSpikeHit = () => {
        scene.player.takeDamage()
        if (gameState.isDead()) scene._gameOver()
      }
      scene.physics.add.overlap(scene.player.raya,    scene._hazardGroup, onSpikeHit, undefined, scene)
      scene.physics.add.overlap(scene.player.cruella, scene._hazardGroup, onSpikeHit, undefined, scene)
    }

    // Decorações sólidas (móveis, grades) bloqueiam personagens e inimigos
    if (scene.decorationLayer.getLength() > 0) {
      scene.physics.add.collider(scene.player.raya,   scene.decorationLayer)
      scene.physics.add.collider(scene.player.cruella, scene.decorationLayer)
      // Boss e mini-boss não colidem com decorações para não ficarem presos entre os móveis
      if (!scene.currentLevel.isBossLevel && !scene.currentLevel.miniBoss) {
        scene.physics.add.collider(scene.enemyGroup, scene.decorationLayer)
      }
    }

    playerSprites.forEach(sprite => {
      scene.physics.add.overlap(sprite, scene.enemyGroup, (ps, enemy) => {
        const e = enemy as Enemy
        const pBody = (ps as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body
        const eBody = e.body as Phaser.Physics.Arcade.Body

        // Stomp / NPC push — decisão delegada ao CombatResolver
        const stompResult = resolveStompHit({
          velocityY: pBody.velocity.y,
          pBottom: pBody.bottom,
          eTop: eBody.top,
          isNPC: e.isNPC,
        })
        if (stompResult.action === 'stomp') {
          // Counter check is intentionally here (not in resolveStompHit): the resolver
          // only decides IF a stomp occurred; the counter reaction is a post-stomp effect.
          const countered = (e as any).tryCounter?.('raya', 'jump') ?? false
          e.takeDamage(999)
          SoundManager.play('stomp')
          if (countered) scene._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
          scene.physics.pause()
          scene.time.delayedCall(80, () => scene.physics.resume())
          pBody.setVelocityY(-380)
          return
        }
        if (stompResult.action === 'npc_push') {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          scene.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) scene._gameOver()
          return
        }

        if (gameState.hasPowerUp('churrasco', scene.time.now)) {
          e.takeDamage(999)
          return
        }
        scene.player.takeDamage()
        SoundManager.play('damage')
        if (gameState.isDead()) scene._gameOver()
      })

      scene.physics.add.overlap(sprite, scene.itemGroup, (_s, item) => {
        const go = item as Phaser.Physics.Arcade.Image
        const t  = go.getData('type') as string
        if (!t) return
        ItemCollectHandler.handle(scene, t, go)
      })
    })

    scene.player.cruella.on('bark', (bx: number, by: number) => {
      // ── Visual shockwave — circle 1: cyan, fast ─────────────────────────
      const wave1 = scene.add.graphics()
      wave1.lineStyle(4, 0x22ccff, 0.9)
      wave1.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.08)
      wave1.setPosition(bx, by)
      scene.tweens.add({
        targets: wave1,
        scaleX: 13, scaleY: 13,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => { if (wave1.active) wave1.destroy() },
      })

      // ── Visual shockwave — circle 2: white, delayed, slower ────────────
      scene.time.delayedCall(80, () => {
        if (!scene.scene.isActive(KEYS.GAME)) return
        const wave2 = scene.add.graphics()
        wave2.lineStyle(3, 0xffffff, 0.75)
        wave2.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.06)
        wave2.setPosition(bx, by)
        scene.tweens.add({
          targets: wave2,
          scaleX: 11, scaleY: 11,
          alpha: 0,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => { if (wave2.active) wave2.destroy() },
        })
      })

      // ── Camera shake ───────────────────────────────────────────────────
      cameraShake(scene, 150, 0.007)

      // ── Indicador de raio de intimidação (BARK_RADIUS * 1.5) ───────────────
      // O raio visual é 1.5× maior que o hit radius do bark (BARK_RADIUS)
      // para mostrar o alcance de checkIntimidation(), que usa * 1.5.
      const rangeGfx = scene.add.graphics()
      rangeGfx.setDepth(6)
      rangeGfx.lineStyle(2, 0xffffff, 0.6)
      rangeGfx.strokeCircle(bx, by, PHYSICS.BARK_RADIUS * 1.5)
      scene.tweens.add({
        targets: rangeGfx,
        alpha: 0,
        duration: 400,
        onComplete: () => { if (rangeGfx.active) rangeGfx.destroy() },
      })

      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(scene.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          e.onBarkHeard(dist)
          return
        }
        const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
        const result = resolveBarkHit({ hp: e.hp, dist, barkRadius: PHYSICS.BARK_RADIUS, countered, isNPC: e.isNPC })
        switch (result.action) {
          case 'counter':
            scene._fx.enemyDeathBurst(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
            break
          case 'ko':
            e.takeDamage(999)
            scene._fx.enemyDeathBurst(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(50) // 'died' event already adds +50; net = +100
            break
          case 'stun':
            e.stun(result.duration)
            scene._fx.barkImpact(e.x, e.y)
            scene._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
            break
          // 'nothing': sem ação
        }
      })
    })

    // Projéteis dos bosses — colidem com chão e danificam jogador
    if (scene._bossProjectileGroup) {
      scene.physics.add.collider(scene._bossProjectileGroup, scene.groundLayer, (proj) => {
        ;(proj as Phaser.Physics.Arcade.Image).destroy()
      })
      playerSprites.forEach(sprite => {
        scene.physics.add.overlap(sprite, scene._bossProjectileGroup!, (_s, proj) => {
          ;(proj as Phaser.Physics.Arcade.Image).destroy()
          scene.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) scene._gameOver()
        })
      })
    }

    // Dash de Raya causa dano + verifica counter window
    scene.physics.add.overlap(scene.player.raya, scene.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!scene.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      e.takeDamage(1)
      const result = resolveDashHit({ hpAfterDamage: e.hp, countered })
      switch (result.action) {
        case 'counter':
          scene._fx.enemyDeathBurst(e.x, e.y)
          scene._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
          break
        case 'ko':
          scene._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(50) // 'died' event already adds +50; net = +100
          break
        case 'damage':
          scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          if (e.active) scene._enemyHPBar.show(e)
          break
      }
    })
  }
}
