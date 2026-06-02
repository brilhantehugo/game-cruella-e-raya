import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, SCORING } from '../constants'
import { gameState } from '../GameState'
import { Enemy } from '../entities/Enemy'
import { ZeladorBoss } from '../entities/enemies/ZeladorBoss'
import { Zelador } from '../entities/enemies/Zelador'
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { Drone } from '../entities/enemies/Drone'
import { SegurancaMoto } from '../entities/enemies/SegurancaMoto'
import type { GameScene } from './GameScene'

export class BossSetup {
  /** Configura o boss principal da fase. Chamado por GameScene._spawnEnemies(). */
  static setup(scene: GameScene, levelId: string): void {
    switch (levelId) {
      case '0-boss': BossSetup._setup0Boss(scene); break
      case '1-boss': BossSetup._setup1Boss(scene); break
      case '2-boss': BossSetup._setup2Boss(scene); break
      case '3-boss': BossSetup._setup3Boss(scene); break
      default: console.warn(`[BossSetup] Unknown boss levelId: "${levelId}" — no boss spawned`)
    }
  }

  // ── ZeladorBoss ──────────────────────────────────────────────────────────────
  private static _setup0Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new ZeladorBoss(scene, mapWidth / 2, 376)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('spawnChave', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const chave = scene.physics.add.image(data.x, data.y, KEYS.CHAVE)
      chave.setDepth(5)
      const body = chave.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      scene._bossProjectileGroup.add(chave)
      scene.time.delayedCall(4000, () => { if (chave.active) chave.destroy() })
    })

    boss.on('spawnMinion', (data: { x: number; y: number }) => {
      const minion = new Zelador(scene, data.x, data.y)
      scene.enemyGroup.add(minion)
      minion.on('died', (e: Enemy) => {
        gameState.addScore(SCORING.ENEMY_KILL)
        gameState.sessionEnemiesKilled++
        scene._am?.notify('enemy_killed')
        scene._killCountInLevel++
        scene._fx.enemyDeathBurst(e.x, e.y)
        scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
      if (scene._bossExit) {
        scene._bossExit.setVisible(true)
        ;(scene._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
        scene._bossExit.refreshBody()
        scene.cameras.main.shake(200, 0.006)
      }
      const msg = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
        '✓ Caminho livre! Vá para a saída!', {
        fontSize: '18px', color: '#22ffcc', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
        backgroundColor: '#000000aa', padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
      scene.tweens.add({ targets: msg, alpha: 1, duration: 300 })
      scene.time.delayedCall(3000, () => {
        if (msg.active) scene.tweens.add({ targets: msg, alpha: 0, duration: 500,
          onComplete: () => { if (msg.active) msg.destroy() } })
      })
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }

  // ── SeuBigodes ───────────────────────────────────────────────────────────────
  private static _setup1Boss(scene: GameScene): void {
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new SeuBigodes(scene, 480, 376)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      gameState.collarOfGold = true
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
      scene._levelComplete()
    })

    boss.on('spawnMinion', (minion: Enemy) => {
      scene.enemyGroup.add(minion)
      minion.on('died', (e: Enemy) => {
        gameState.addScore(SCORING.ENEMY_KILL)
        gameState.sessionEnemiesKilled++
        scene._am?.notify('enemy_killed')
        scene._killCountInLevel++
        scene._fx.enemyDeathBurst(e.x, e.y)
        scene._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })
  }

  // ── Drone ────────────────────────────────────────────────────────────────────
  private static _setup2Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new Drone(scene, mapWidth / 2, 180)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('spawnBomb', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const bomb = scene.physics.add.image(data.x, data.y, KEYS.BOMB)
      bomb.setDepth(5)
      const body = bomb.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      // gravidade normal → projétil cai em parábola
      scene._bossProjectileGroup.add(bomb)
      scene.time.delayedCall(4000, () => { if (bomb.active) bomb.destroy() })
    })

    boss.on('spawnLaser', (data: { x: number; y: number; vx: number; vy: number }) => {
      if (!scene._bossProjectileGroup || !scene.scene.isActive(KEYS.GAME)) return
      const laser = scene.physics.add.image(data.x, data.y, KEYS.LASER)
      laser.setDepth(5)
      const body = laser.body as Phaser.Physics.Arcade.Body
      body.setVelocity(data.vx, data.vy)
      body.setGravityY(-800)   // tiro reto horizontal
      scene._bossProjectileGroup.add(laser)
      scene.time.delayedCall(3000, () => { if (laser.active) laser.destroy() })
    })

    boss.on('died', (b: Enemy) => {
      gameState.addScore(500)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+500', '#ff4444')
      scene._levelComplete()
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }

  // ── SegurancaMoto ────────────────────────────────────────────────────────────
  private static _setup3Boss(scene: GameScene): void {
    const mapWidth = scene.currentLevel.tileWidthCols * 32
    scene._bossStartTime = scene.time.now
    scene._livesAtBossStart = gameState.hearts
    const boss = new SegurancaMoto(scene, mapWidth - 100, 352)
    scene.enemyGroup.add(boss)
    boss.setVisible(false)
    ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
    scene._mainBoss = boss

    if (!scene._bossProjectileGroup) scene._bossProjectileGroup = scene.physics.add.group()

    boss.on('died', (b: Enemy) => {
      gameState.addScore(1000)
      gameState.sessionEnemiesKilled++
      scene._am?.notify('boss_defeated', {
        levelId: scene.currentLevel.id,
        fightDurationMs: scene.time.now - scene._bossStartTime,
        damageTaken: scene._livesAtBossStart - gameState.hearts,
        playerHpFull: gameState.hearts >= 3,
      })
      scene._fx.enemyDeathBurst(b.x, b.y)
      scene._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
      if (scene._bossExit) {
        scene._bossExit.setVisible(true)
        ;(scene._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
        scene._bossExit.refreshBody()
        scene.cameras.main.shake(200, 0.006)
      }
    })

    scene.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (boss.active && scene.player) boss.setPlayerPos(scene.player.x, scene.player.y)
      },
    })
  }
}
