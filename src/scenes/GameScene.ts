import Phaser from 'phaser'
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING } from '../constants'
import { gameState } from '../GameState'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { DonoNervoso } from '../entities/enemies/DonoNervoso'
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { Bone } from '../items/Bone'
import { GoldenBone } from '../items/GoldenBone'
import { PowerUp } from '../items/PowerUp'
import { Accessory } from '../items/Accessory'
import { LevelData, MiniBossConfig } from '../levels/LevelData'
import { WORLD1_LEVELS } from '../levels/World1'
import { WORLD0_LEVELS } from '../levels/World0'
import { WORLD2_LEVELS } from '../levels/World2'
import { WORLD3_LEVELS } from '../levels/World3'
import { GatoSelvagem } from '../entities/enemies/GatoSelvagem'
import { Seguranca }     from '../entities/enemies/Seguranca'
import { Porteiro }      from '../entities/enemies/Porteiro'
import { SegurancaMoto } from '../entities/enemies/SegurancaMoto'
import { SpotlightOverlay, type LightSource } from '../fx/SpotlightOverlay'
import { Aspirador } from '../entities/enemies/Aspirador'
import { Drone } from '../entities/enemies/Drone'
import { ZeladorBoss } from '../entities/enemies/ZeladorBoss'
import { HumanEnemy } from '../entities/enemies/HumanEnemy'
import { Zelador } from '../entities/enemies/Zelador'
import { LevelBuilder } from '../systems/LevelBuilder'
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../systems/CombatResolver'
import { ParallaxBackground } from '../background/ParallaxBackground'
import { SoundManager } from '../audio/SoundManager'
import { EffectsManager } from '../fx/EffectsManager'
import { EnemyHPBar } from '../fx/EnemyHPBar'
import { AchievementManager } from '../achievements/AchievementManager'
import { profileManager } from '../storage/ProfileManager'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private groundLayer!: Phaser.Physics.Arcade.StaticGroup
  private platformLayer!: Phaser.Physics.Arcade.StaticGroup
  private decorationLayer!: Phaser.Physics.Arcade.StaticGroup
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private itemGroup!: Phaser.Physics.Arcade.StaticGroup
  private escKey!: Phaser.Input.Keyboard.Key
  private currentLevel!: LevelData
  private _gameOverPending = false
  private _parallax!: ParallaxBackground
  private _mKey!: Phaser.Input.Keyboard.Key
  private _iKey!: Phaser.Input.Keyboard.Key
  private _camOffsetX: number = 0
  private _followingSprite: Phaser.Physics.Arcade.Sprite | null = null
  private _cinematicActive: boolean = false
  private _bossExit: Phaser.Physics.Arcade.Image | null = null
  private _bossProjectileGroup: Phaser.Physics.Arcade.Group | null = null
  private _miniBossBarriers: Phaser.Physics.Arcade.StaticGroup | null = null
  private _miniBossTriggerFired = false
  private _fx!: EffectsManager
  private _lastTrailAt: number = 0
  private _spotlight: SpotlightOverlay | null = null
  private _am?: AchievementManager      // persists across levels
  private _enemyHPBar!: EnemyHPBar
  private _radarArrow: Phaser.GameObjects.Text | null = null
  private _radarTimer: Phaser.Time.TimerEvent | null = null
  private _bossStartTime = 0
  private _livesAtBossStart = 0
  private _killCountInLevel = 0
  private _mainBoss: Enemy | null = null

  constructor() { super(KEYS.GAME) }

  create(): void {
    this._gameOverPending = false
    if (!this._am) {
      this._am = new AchievementManager((def) => {
        const ui = this.scene.get(KEYS.UI) as any
        ui?.showAchievementToast?.(def.icon, def.title, def.description)
      })
    }
    this._killCountInLevel = 0
    const ALL_LEVELS = { ...WORLD0_LEVELS, ...WORLD1_LEVELS, ...WORLD2_LEVELS, ...WORLD3_LEVELS }
    this.currentLevel = ALL_LEVELS[gameState.currentLevel] ?? WORLD0_LEVELS['0-1']

    // Show level intro screen for non-boss levels that have intro data
    if (this.currentLevel.intro && !this.currentLevel.isBossLevel && !gameState.introSeen.has(this.currentLevel.id)) {
      gameState.introSeen.add(this.currentLevel.id)
      this.scene.start(KEYS.LEVEL_INTRO, { levelData: this.currentLevel })
      return
    }

    this.cameras.main.setBackgroundColor(this.currentLevel.bgColor)

    // Parallax (antes das decorações para ordem de profundidade correta)
    this._parallax = new ParallaxBackground(this, this.currentLevel.backgroundTheme)

    // BGM
    const bgmKey = this.currentLevel.isBossLevel ? KEYS.BGM_BOSS : KEYS.BGM_WORLD1
    SoundManager.playBgm(bgmKey, this)

    // Teclas extras
    this._mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)
    this._iKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.I)

    // Para BGM e destroi sprites de parallax quando a cena encerrar
    this.events.once('shutdown', () => {
      SoundManager.stopBgm()
      this._parallax.destroy()
      this._spotlight?.destroy()
      this._spotlight = null
      this._radarArrow?.destroy()
      this._radarArrow = null
      this._radarTimer?.remove()
      this._radarTimer = null
    })

    this._buildDecorations()
    this._buildTilemap()
    this._spawnPlayer()
    this._fx = new EffectsManager(this)
    this._enemyHPBar = new EnemyHPBar(this)
    this._applyUpgrades()
    // Efeitos de dust no pulo e aterrissagem
    this.player.raya.on('jumped', () => {
      const body = this.player.raya.body as Phaser.Physics.Arcade.Body
      this._fx.dustPuff(this.player.raya.x, body.bottom, 'small')
    })
    this.player.raya.on('landed', () => {
      const body = this.player.raya.body as Phaser.Physics.Arcade.Body
      this._fx.dustPuff(this.player.raya.x, body.bottom, 'large')
    })
    this._spawnEnemies()
    this._setupMiniBoss()
    this._spawnItems()
    this._setupCollisions()
    this._setupCamera()

    // ── Spotlight overlay (World 3) ──────────────────────────────────────────
    if (this.currentLevel.hasSpotlight) {
      this._spotlight = new SpotlightOverlay(this, this.currentLevel.playerAuraRadius ?? 130)
    }

    // Boss intro cinemática — deve rodar depois de _setupCamera() para que
    // cam.stopFollow() e setBounds() operem sobre uma câmera já configurada
    if (this.currentLevel.isBossLevel) {
      this._runBossIntro()
    }

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.scene.launch(KEYS.UI)

    // Inicia timer e emite nome da fase (delayedCall garante UIScene já inicializada)
    this.time.delayedCall(100, () => {
      this.events.emit('start-timer', this.currentLevel.timeLimit)
      this.events.emit('level-name', this.currentLevel.name)
    })

    // Listener para game-over por tempo
    this.events.on('timer-game-over', () => {
      if (!this._gameOverPending) this._gameOver()
    })
  }

  private _runBossIntro(): void {
    this._cinematicActive = true
    const cam = this.cameras.main
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE

    // Etapa 1 (0–500ms): para de seguir o player, zoom out suave
    cam.stopFollow()
    this.tweens.add({
      targets: cam,
      zoom: 0.85,
      duration: 500,
      ease: 'Sine.easeInOut',
    })

    // Etapa 2 (500–1500ms): pan até o boss
    // 3-boss nasce à direita; todos os outros ficam no centro da arena
    const bossWorldX = this.currentLevel.id === '3-boss'
      ? mapWidth - 100
      : mapWidth / 2
    this.time.delayedCall(500, () => {
      if (!this.scene.isActive(KEYS.GAME)) return
      const bossX = bossWorldX
      const bossY = GAME_HEIGHT / 2
      // scrollX = worldX - (viewportWidth / zoom / 2) para centrar o boss na tela
      const scrollX = Phaser.Math.Clamp(bossX - GAME_WIDTH / 2 / 0.85, 0, mapWidth - GAME_WIDTH)
      const scrollY = bossY - GAME_HEIGHT / 2 / 0.85
      this.tweens.add({
        targets: cam,
        scrollX,
        scrollY,
        duration: 800,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          cam.shake(200, 0.003)
        },
      })
    })

    // Etapa 2.5 (1100ms): fala do boss — tabela unificada para todos os bosses
    const BOSS_SPEECHES: Record<string, { header: string; hColor: string; speech: string; sColor: string }> = {
      '0-boss': { header: '🧹 ZELADOR DO PRÉDIO 🧹', hColor: '#ffa040',
                  speech: '"Ninguém passa enquanto eu estiver de guarda!"', sColor: '#ffcc88' },
      '1-boss': { header: '🐱 SEU BIGODES 🐱',       hColor: '#ff8800',
                  speech: '"Meu território, minha lixeira! Não vão a lugar algum!"', sColor: '#ffcc88' },
      '2-boss': { header: '🤖 DRONE DE VIGILÂNCIA 🤖', hColor: '#22ccff',
                  speech: '"Intruso detectado. A activar protocolo de eliminação."', sColor: '#aaeeff' },
      '3-boss': { header: '🏍️ SEGURANÇA EM MOTO 🏍️', hColor: '#ff4444',
                  speech: '"Desta vez não escapam. Acabou!"', sColor: '#ffaaaa' },
    }
    const bossData = BOSS_SPEECHES[this.currentLevel.id]
    if (bossData) {
      this.time.delayedCall(1100, () => {
        if (!this.scene.isActive(KEYS.GAME)) return
        const header = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10,
          bossData.header, {
            fontSize: '20px', color: bossData.hColor, fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 4,
            backgroundColor: '#000000ee', padding: { x: 16, y: 8 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        const speech = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 36,
          bossData.speech, {
            fontSize: '14px', color: bossData.sColor, fontStyle: 'italic',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
        this.tweens.add({ targets: [header, speech], alpha: 1, duration: 300 })
        this.time.delayedCall(3000, () => {
          if (!this.scene.isActive(KEYS.GAME)) return
          this.tweens.add({
            targets: [header, speech], alpha: 0, duration: 400,
            onComplete: () => {
              if (header.active) header.destroy()
              if (speech.active) speech.destroy()
            },
          })
        })
      })
    }

    // Etapa 3 (1500–2000ms): volta ao player, restaura zoom, libera controle
    this.time.delayedCall(1500, () => {
      if (!this.scene.isActive(KEYS.GAME)) return
      this.tweens.add({
        targets: cam,
        zoom: 1,
        duration: 500,
        ease: 'Sine.easeInOut',
      })
      this._followingSprite = this.player.active
      cam.startFollow(this._followingSprite, true, 0.1, 0.1)
      cam.setDeadzone(160, 80)
    })

    this.time.delayedCall(2000, () => {
      if (!this.scene.isActive(KEYS.GAME)) return
      // Activa o boss agora que a cinemática terminou
      if (this._mainBoss) {
        this._mainBoss.setVisible(true)
        ;(this._mainBoss.body as Phaser.Physics.Arcade.Body).enable = true
      }
      this._cinematicActive = false
      // Trava a câmera dentro dos limites da arena
      cam.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    })
  }

  private _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
    this._fx.scorePopupBounce(text, x, y, color)
  }

  private _buildDecorations(): void {
    this.decorationLayer = this.physics.add.staticGroup()
    this.currentLevel.decorations.forEach(d => {
      if (d.blocking) {
        // Decoração sólida — bloqueia personagens
        const img = this.decorationLayer.create(d.x, d.y, d.type) as Phaser.Physics.Arcade.Image
        img.setOrigin(0.5, 1).setDepth(0).refreshBody()
      } else {
        // Decoração visual apenas — sem física
        this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(-1)
      }
    })
  }

  private _buildTilemap(): void {
    this.groundLayer   = this.physics.add.staticGroup()
    this.platformLayer = this.physics.add.staticGroup()
    this.itemGroup     = this.physics.add.staticGroup()

    const tiles = this.currentLevel.tiles
    const cols  = this.currentLevel.tileWidthCols

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < cols; col++) {
        const val = tiles[row][col]
        if (val === 0) continue
        const px = col * TILE_SIZE + TILE_SIZE / 2
        const py = row * TILE_SIZE + TILE_SIZE / 2
        if (val === 2) {
          this.platformLayer.add(this.physics.add.staticImage(px, py, KEYS.TILE_PLATFORM))
        } else {
          this.groundLayer.add(this.physics.add.staticImage(px, py, KEYS.TILE_GROUND))
        }
      }
    }

    // y da superfície do chão: última fileira de tiles
    const groundY = (tiles.length - 1) * TILE_SIZE

    // Checkpoint — omitido em fases de boss; sprite configurável nas demais
    if (!this.currentLevel.isBossLevel) {
      const cpSprite = this.currentLevel.checkpointSprite ?? KEYS.HYDRANT
      const cp = this.physics.add.staticImage(this.currentLevel.checkpointX, groundY, cpSprite)
      cp.setOrigin(0.5, 1).refreshBody()
      cp.setData('type', 'checkpoint')
      this.itemGroup.add(cp)
    }

    // Saída — base alinhada ao chão
    const exit = this.physics.add.staticImage(this.currentLevel.exitX, groundY, KEYS.EXIT_GATE)
    exit.setOrigin(0.5, 1).refreshBody()
    exit.setData('type', 'exit')
    this.itemGroup.add(exit)
    // Em fases de boss a saída fica oculta até o boss ser derrotado
    if (this.currentLevel.isBossLevel) {
      exit.setVisible(false)
      ;(exit.body as Phaser.Physics.Arcade.StaticBody).enable = false
      this._bossExit = exit
    }
  }

  private _spawnPlayer(): void {
    const spawnX = gameState.checkpointReached ? gameState.checkpointX : this.currentLevel.spawnX
    const spawnY = gameState.checkpointReached ? gameState.checkpointY - 32 : this.currentLevel.spawnY
    this.player = new Player(this, spawnX, spawnY)
  }

  private _spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group()
    const builder = new LevelBuilder(this)
    this.currentLevel.enemies.forEach(spawn => {
      const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
      if (!enemy) return
      this.enemyGroup.add(enemy)
      if (enemy instanceof HumanEnemy) {
        enemy.on('grabPlayer', (knockbackDir: number) => {
          this.player.takeDamage()
          SoundManager.play('damage')
          const activeBody = this.player.active.body as Phaser.Physics.Arcade.Body
          activeBody.setVelocityX(knockbackDir * 180)
          activeBody.setVelocityY(-200)
          if (gameState.isDead()) this._gameOver()
        })
      }
      if (enemy instanceof Porteiro) {
        enemy.on('spawnChave', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this.scene.isActive(KEYS.GAME)) return
          if (!this._bossProjectileGroup) this._bossProjectileGroup = this.physics.add.group()
          const chave = this.physics.add.image(data.x, data.y, KEYS.CHAVE)
          chave.setDepth(5)
          const body = chave.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          this._bossProjectileGroup.add(chave)
          this.time.delayedCall(3000, () => { if (chave.active) chave.destroy() })
        })
      }
      enemy.on('died', (e: Enemy) => {
        gameState.addScore(50)
        gameState.sessionEnemiesKilled++
        this._am?.notify('enemy_killed')
        this._killCountInLevel++
        this._fx.enemyDeathBurst(e.x, e.y)
        this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })

    if (this.currentLevel.isBossLevel) {
      if (this.currentLevel.id === '0-boss') {
        // ZeladorBoss — Zelador do Prédio
        const mapWidth = this.currentLevel.tileWidthCols * 32
        this._bossStartTime = this.time.now
        this._livesAtBossStart = gameState.hearts
        const boss = new ZeladorBoss(this, mapWidth / 2, 352)
        this.enemyGroup.add(boss)
        boss.setVisible(false)
        ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
        this._mainBoss = boss

        this._bossProjectileGroup = this.physics.add.group()

        boss.on('spawnChave', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const chave = this.physics.add.image(data.x, data.y, KEYS.CHAVE)
          chave.setDepth(5)
          const body = chave.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          this._bossProjectileGroup.add(chave)
          this.time.delayedCall(4000, () => { if (chave.active) chave.destroy() })
        })

        boss.on('spawnMinion', (data: { x: number; y: number }) => {
          const minion = new Zelador(this, data.x, data.y)
          this.enemyGroup.add(minion)
          minion.on('died', (e: Enemy) => {
            gameState.addScore(SCORING.ENEMY_KILL)
            gameState.sessionEnemiesKilled++
            this._am?.notify('enemy_killed')
            this._killCountInLevel++
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          })
        })

        boss.on('died', (b: Enemy) => {
          gameState.addScore(1000)
          gameState.sessionEnemiesKilled++
          this._am?.notify('boss_defeated', {
            levelId: this.currentLevel.id,
            fightDurationMs: this.time.now - this._bossStartTime,
            damageTaken: this._livesAtBossStart - gameState.hearts,
            playerHpFull: gameState.hearts >= 3,
          })
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
          if (this._bossExit) {
            this._bossExit.setVisible(true)
            ;(this._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
            this._bossExit.refreshBody()
            this.cameras.main.shake(200, 0.006)
          }
          const msg = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            '✓ Caminho livre! Vá para a saída!', {
            fontSize: '18px', color: '#22ffcc', fontStyle: 'bold',
            stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#000000aa', padding: { x: 14, y: 8 },
          }).setOrigin(0.5).setScrollFactor(0).setDepth(20).setAlpha(0)
          this.tweens.add({ targets: msg, alpha: 1, duration: 300 })
          this.time.delayedCall(3000, () => {
            if (msg.active) this.tweens.add({ targets: msg, alpha: 0, duration: 500,
              onComplete: () => { if (msg.active) msg.destroy() } })
          })
        })

        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })
      } else if (this.currentLevel.id === '2-boss') {
        // Drone boss
        const mapWidth = this.currentLevel.tileWidthCols * 32
        this._bossStartTime = this.time.now
        this._livesAtBossStart = gameState.hearts
        const boss = new Drone(this, mapWidth / 2, 180)
        this.enemyGroup.add(boss)
        boss.setVisible(false)
        ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
        this._mainBoss = boss

        this._bossProjectileGroup = this.physics.add.group()

        boss.on('spawnBomb', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const bomb = this.physics.add.image(data.x, data.y, KEYS.BOMB)
          bomb.setDepth(5)
          const body = bomb.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          // gravidade normal → projétil cai em parábola
          this._bossProjectileGroup.add(bomb)
          this.time.delayedCall(4000, () => { if (bomb.active) bomb.destroy() })
        })

        boss.on('spawnLaser', (data: { x: number; y: number; vx: number; vy: number }) => {
          if (!this._bossProjectileGroup || !this.scene.isActive(KEYS.GAME)) return
          const laser = this.physics.add.image(data.x, data.y, KEYS.LASER)
          laser.setDepth(5)
          const body = laser.body as Phaser.Physics.Arcade.Body
          body.setVelocity(data.vx, data.vy)
          body.setGravityY(-800)   // tiro reto horizontal
          this._bossProjectileGroup.add(laser)
          this.time.delayedCall(3000, () => { if (laser.active) laser.destroy() })
        })

        boss.on('died', (b: Enemy) => {
          gameState.addScore(500)
          gameState.sessionEnemiesKilled++
          this._am?.notify('boss_defeated', {
            levelId: this.currentLevel.id,
            fightDurationMs: this.time.now - this._bossStartTime,
            damageTaken: this._livesAtBossStart - gameState.hearts,
            playerHpFull: gameState.hearts >= 3,
          })
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+500', '#ff4444')
          this._levelComplete()
        })

        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })
      } else if (this.currentLevel.id === '3-boss') {
        const mapWidth = this.currentLevel.tileWidthCols * 32
        this._bossStartTime = this.time.now
        this._livesAtBossStart = gameState.hearts
        const boss = new SegurancaMoto(this, mapWidth - 100, 352)
        this.enemyGroup.add(boss)
        boss.setVisible(false)
        ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
        this._mainBoss = boss

        if (!this._bossProjectileGroup) this._bossProjectileGroup = this.physics.add.group()

        boss.on('died', (b: Enemy) => {
          gameState.addScore(1000)
          gameState.sessionEnemiesKilled++
          this._am?.notify('boss_defeated', {
            levelId: this.currentLevel.id,
            fightDurationMs: this.time.now - this._bossStartTime,
            damageTaken: this._livesAtBossStart - gameState.hearts,
            playerHpFull: gameState.hearts >= 3,
          })
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22ccff')
          if (this._bossExit) {
            this._bossExit.setVisible(true)
            ;(this._bossExit.body as Phaser.Physics.Arcade.StaticBody).enable = true
            this._bossExit.refreshBody()
            this.cameras.main.shake(200, 0.006)
          }
        })

        this.time.addEvent({
          delay: 100, loop: true, callback: () => {
            if (boss.active && this.player) boss.setPlayerPos(this.player.x, this.player.y)
          },
        })
      } else {
        // Seu Bigodes boss
        this._bossStartTime = this.time.now
        this._livesAtBossStart = gameState.hearts
        const boss = new SeuBigodes(this, 480, 360)
        this.enemyGroup.add(boss)
        boss.setVisible(false)
        ;(boss.body as Phaser.Physics.Arcade.Body).enable = false
        this._mainBoss = boss
        boss.on('died', (b: Enemy) => {
          gameState.addScore(1000)
          gameState.sessionEnemiesKilled++
          this._am?.notify('boss_defeated', {
            levelId: this.currentLevel.id,
            fightDurationMs: this.time.now - this._bossStartTime,
            damageTaken: this._livesAtBossStart - gameState.hearts,
            playerHpFull: gameState.hearts >= 3,
          })
          gameState.collarOfGold = true
          this._fx.enemyDeathBurst(b.x, b.y)
          this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
          this._levelComplete()
        })
        boss.on('spawnMinion', (minion: Enemy) => {
          this.enemyGroup.add(minion)
          minion.on('died', (e: Enemy) => {
            gameState.addScore(SCORING.ENEMY_KILL)
            gameState.sessionEnemiesKilled++
            this._am?.notify('enemy_killed')
            this._killCountInLevel++
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          })
        })
      }
    }
  }

  private _setupMiniBoss(): void {
    const cfg = this.currentLevel.miniBoss
    if (!cfg) return
    this._miniBossTriggerFired = false

    const zone = this.add.zone(cfg.triggerX, GAME_HEIGHT / 2, 16, GAME_HEIGHT)
    this.physics.world.enable(zone)
    const zoneBody = zone.body as Phaser.Physics.Arcade.Body
    zoneBody.setAllowGravity(false).setImmovable(true)

    const trigger = () => {
      if (this._miniBossTriggerFired) return
      this._miniBossTriggerFired = true
      zone.destroy()
      this._startMiniBossEncounter(cfg)
    }

    this.physics.add.overlap(this.player.raya,   zone, trigger)
    this.physics.add.overlap(this.player.cruella, zone, trigger)
  }

  private _startMiniBossEncounter(cfg: MiniBossConfig): void {
    // Spawn Aspirador como mini-boss
    const boss = new Aspirador(this, cfg.spawnX, cfg.spawnY)
    this.enemyGroup.add(boss)
    const maxHp = boss.maxHp

    // Barreiras estáticas
    this._miniBossBarriers = this.physics.add.staticGroup()
    const leftGate  = this.physics.add.staticImage(cfg.leftBarrierX,  cfg.spawnY, KEYS.EXIT_GATE)
    const rightGate = this.physics.add.staticImage(cfg.rightBarrierX, cfg.spawnY, KEYS.EXIT_GATE)
    leftGate.setOrigin(0.5).refreshBody()
    rightGate.setOrigin(0.5).refreshBody()
    this._miniBossBarriers.add(leftGate)
    this._miniBossBarriers.add(rightGate)
    this.physics.add.collider(this.player.raya,   this._miniBossBarriers)
    this.physics.add.collider(this.player.cruella, this._miniBossBarriers)
    this.physics.add.collider(boss,                this._miniBossBarriers)

    // BGM de boss + barra de mini-boss
    SoundManager.playBgm(KEYS.BGM_BOSS, this)
    this.events.emit('showMiniBossBar')

    // Polling para actualizar barra de HP
    const hpPoller = this.time.addEvent({
      delay: 100, loop: true, callback: () => {
        if (!boss.active) { hpPoller.destroy(); return }
        this.events.emit('updateMiniBossBar', boss.hp / maxHp)
      },
    })

    boss.on('died', (b: Enemy) => {
      hpPoller.destroy()
      if (this._miniBossBarriers) {
        this._miniBossBarriers.clear(true, true)
        this._miniBossBarriers = null
      }
      this.events.emit('hideMiniBossBar')
      SoundManager.playBgm(KEYS.BGM_WORLD1, this)
      gameState.addScore(500)
      gameState.sessionEnemiesKilled++
      this._am?.notify('enemy_killed')
      this._killCountInLevel++
      this._fx.enemyDeathBurst(b.x, b.y)
      this._spawnScorePopup(b.x, b.y - 30, '+500', '#22ccff')
    })
  }

  private _spawnItems(): void {
    const accessoryTypes = ['laco', 'coleira', 'chapeu', 'bandana']
    this.currentLevel.items.forEach(spawn => {
      let item: Phaser.Physics.Arcade.Image
      if (spawn.type === 'bone') {
        item = new Bone(this, spawn.x, spawn.y)
      } else if (accessoryTypes.includes(spawn.type)) {
        item = new Accessory(this, spawn.x, spawn.y, spawn.type as any)
      } else {
        item = new PowerUp(this, spawn.x, spawn.y, spawn.type)
      }
      this.itemGroup.add(item)
    })
    this.currentLevel.goldenBones.forEach((pos, i) => {
      this.itemGroup.add(new GoldenBone(this, pos.x, pos.y, i))
    })
  }

  private _setupCollisions(): void {
    const playerSprites = [this.player.raya, this.player.cruella]

    this.physics.add.collider(this.player.raya,   this.groundLayer)
    this.physics.add.collider(this.player.cruella, this.groundLayer)
    this.physics.add.collider(this.player.raya,   this.platformLayer)
    this.physics.add.collider(this.player.cruella, this.platformLayer)
    this.physics.add.collider(this.enemyGroup, this.groundLayer)

    // Decorações sólidas (móveis, grades) bloqueiam personagens e inimigos
    if (this.decorationLayer.getLength() > 0) {
      this.physics.add.collider(this.player.raya,   this.decorationLayer)
      this.physics.add.collider(this.player.cruella, this.decorationLayer)
      // Boss não colide com decorações para não ficar preso entre os móveis
      if (!this.currentLevel.isBossLevel) {
        this.physics.add.collider(this.enemyGroup, this.decorationLayer)
      }
    }

    playerSprites.forEach(sprite => {
      this.physics.add.overlap(sprite, this.enemyGroup, (ps, enemy) => {
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
          if (countered) this._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
          this.physics.pause()
          this.time.delayedCall(80, () => this.physics.resume())
          pBody.setVelocityY(-380)
          return
        }
        if (stompResult.action === 'npc_push') {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          this.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) this._gameOver()
          return
        }

        if (gameState.hasPowerUp('churrasco', this.time.now)) {
          e.takeDamage(999)
          return
        }
        this.player.takeDamage()
        SoundManager.play('damage')
        if (gameState.isDead()) this._gameOver()
      })

      this.physics.add.overlap(sprite, this.itemGroup, (_s, item) => {
        const go = item as Phaser.Physics.Arcade.Image
        const t  = go.getData('type') as string
        if (!t) return
        this._handleItemCollect(t, go)
      })
    })

    this.player.cruella.on('bark', (bx: number, by: number) => {
      // ── Visual shockwave — circle 1: cyan, fast ─────────────────────────
      const wave1 = this.add.graphics()
      wave1.lineStyle(4, 0x22ccff, 0.9)
      wave1.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.08)
      wave1.setPosition(bx, by)
      this.tweens.add({
        targets: wave1,
        scaleX: 13, scaleY: 13,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => { if (wave1.active) wave1.destroy() },
      })

      // ── Visual shockwave — circle 2: white, delayed, slower ────────────
      this.time.delayedCall(80, () => {
        if (!this.scene.isActive(KEYS.GAME)) return
        const wave2 = this.add.graphics()
        wave2.lineStyle(3, 0xffffff, 0.75)
        wave2.strokeCircle(0, 0, PHYSICS.BARK_RADIUS * 0.06)
        wave2.setPosition(bx, by)
        this.tweens.add({
          targets: wave2,
          scaleX: 11, scaleY: 11,
          alpha: 0,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => { if (wave2.active) wave2.destroy() },
        })
      })

      // ── Camera shake ───────────────────────────────────────────────────
      this.cameras.main.shake(150, 0.007)

      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          e.onBarkHeard(dist)
          return
        }
        const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
        const result = resolveBarkHit({ hp: e.hp, dist, barkRadius: PHYSICS.BARK_RADIUS, countered, isNPC: e.isNPC })
        switch (result.action) {
          case 'counter':
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
            break
          case 'ko':
            e.takeDamage(999)
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(50) // 'died' event already adds +50; net = +100
            break
          case 'stun':
            e.stun(result.duration)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
            break
          // 'nothing': sem ação
        }
      })
    })

    // Projéteis dos bosses — colidem com chão e danificam jogador
    if (this._bossProjectileGroup) {
      this.physics.add.collider(this._bossProjectileGroup, this.groundLayer, (proj) => {
        ;(proj as Phaser.Physics.Arcade.Image).destroy()
      })
      playerSprites.forEach(sprite => {
        this.physics.add.overlap(sprite, this._bossProjectileGroup!, (_s, proj) => {
          ;(proj as Phaser.Physics.Arcade.Image).destroy()
          this.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) this._gameOver()
        })
      })
    }

    // Dash de Raya causa dano + verifica counter window
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!this.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      e.takeDamage(1)
      const result = resolveDashHit({ hpAfterDamage: e.hp, countered })
      switch (result.action) {
        case 'counter':
          this._fx.enemyDeathBurst(e.x, e.y)
          this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
          break
        case 'ko':
          this._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(50) // 'died' event already adds +50; net = +100
          break
        case 'damage':
          this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          if (e.active) this._enemyHPBar.show(e)
          break
      }
    })
  }

  private _handleItemCollect(type: string, item: Phaser.Physics.Arcade.Image): void {
    const now = this.time.now
    switch (type) {
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
          this._fx.checkpointSparkle(item.x, item.y)
        }
        return // don't destroy
      case 'exit':
        this._levelComplete()
        return
      case 'bone':
        gameState.addScore(10)
        SoundManager.play('collectBone')
        this._fx.boneSpark(item.x, item.y)
        this._spawnScorePopup(item.x, item.y - 16, '+10', '#ffff00')
        this._am?.notify('item_collected', { type: 'bone' })
        break
      case 'golden_bone':
        gameState.collectGoldenBone(gameState.currentLevel, (item as GoldenBone).boneIndex)
        gameState.addScore(500)
        SoundManager.play('collectGolden')
        this._fx.goldenBoneBurst(item.x, item.y)
        this._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
        this._am?.notify('golden_bone')
        break
      case 'pizza':
        gameState.restoreHeart()
        this._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
        this._am?.notify('item_collected', { type: 'pizza' })
        break
      case 'laco': case 'coleira': case 'chapeu': case 'bandana':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
        break
      default:
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        this._fx.powerUpBurst(this.player.x, this.player.y, type)
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
        this._am?.notify('item_collected', { type })
    }
    item.destroy()
  }

  private _setupCamera(): void {
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE
    this.physics.world.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setDeadzone(160, 80)
    this._followingSprite = this.player.active
    this.cameras.main.startFollow(this._followingSprite, true, 0.1, 0.1)
  }

  private _levelComplete(): void {
    this.scene.stop(KEYS.UI)
    const levelId = this.currentLevel.id
    const nextLevel = this.currentLevel.nextLevel
    const goldenBones = (gameState.goldenBones as Record<string, boolean[]>)[levelId] ?? [false, false, false]
    const elapsedMs = gameState.sessionStartTime > 0
      ? Date.now() - gameState.sessionStartTime
      : 0

    const timeLeft = Math.max(0, this.currentLevel.timeLimit - Math.floor(elapsedMs / 1000))
    this._am?.notify('level_complete', {
      usedCheckpoint: gameState.checkpointReached,
      timeLeft,
      killCount: this._killCountInLevel,
    })
    if (this.currentLevel.isBossLevel) {
      const world = this.currentLevel.id.split('-')[0]
      this._am?.notify('world_complete', { world })
    }

    this.scene.start(KEYS.LEVEL_COMPLETE, {
      score:         gameState.score,
      time:          elapsedMs,
      goldenBones,
      deaths:        gameState.sessionDeaths,
      enemiesKilled: gameState.sessionEnemiesKilled,
      levelId,
      nextLevel,
    })
  }

  private _gameOver(): void {
    if (this._gameOverPending) return
    this._gameOverPending = true
    gameState.sessionDeaths++
    this._am?.notify('player_died')
    this.scene.stop(KEYS.UI)
    this.scene.start(KEYS.GAME_OVER)
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause()
      this.scene.launch(KEYS.PAUSE)
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this._iKey)) {
      this.scene.pause()
      this.scene.launch(KEYS.ENEMY_INFO, { fromGame: true })
      return
    }
    // Bloqueia todo input (inclusive mute) durante a cinemática do boss — intencional
    if (this._cinematicActive) return
    // Mute toggle
    if (Phaser.Input.Keyboard.JustDown(this._mKey)) {
      SoundManager.setMuted(!gameState.muted)
    }
    // Parallax scroll
    this._parallax.update(this.cameras.main.scrollX)
    const enemies = this.enemyGroup.getChildren() as Enemy[]
    this.player.update(enemies)
    // Lookahead: câmera adianta na direção do movimento
    const targetOffsetX = this.player.active.flipX ? -80 : 80
    this._camOffsetX = Phaser.Math.Linear(this._camOffsetX, targetOffsetX, 0.05)
    this.cameras.main.setFollowOffset(-this._camOffsetX, 0)

    // Re-segue sprite ativa se o swap mudou a cachorra
    if (this._followingSprite !== this.player.active) {
      this._followingSprite = this.player.active
      this.cameras.main.startFollow(this._followingSprite, true, 0.1, 0.1)
    }
    // ── Spotlight update (World 3) ──────────────────────────────────────────
    if (this._spotlight) {
      const cam = this.cameras.main
      const worldSources: LightSource[] = []
      for (const e of (this.enemyGroup?.getChildren() ?? []) as Enemy[]) {
        if (e instanceof Seguranca)     worldSources.push((e as Seguranca).getLightSource())
        if (e instanceof Porteiro)      worldSources.push((e as Porteiro).getLightSource())
        if (e instanceof SegurancaMoto) worldSources.push((e as SegurancaMoto).getLightSource())
      }
      const screenSources: LightSource[] = worldSources.map(s => ({
        ...s, x: s.x - cam.scrollX, y: s.y - cam.scrollY,
      }))
      const psx = this.player.x - cam.scrollX
      const psy = this.player.y - cam.scrollY
      this._spotlight.update(psx, psy, screenSources)

      const auraR = this.currentLevel.playerAuraRadius ?? 130
      for (const e of (this.enemyGroup?.getChildren() ?? []) as Enemy[]) {
        if (e instanceof GatoSelvagem) {
          ;(e as GatoSelvagem).setLightSources(worldSources, auraR)
        }
      }
    }

    enemies.forEach(e => {
      e.update(time, delta)
      if (e instanceof DonoNervoso) e.setTarget(this.player.x)
      if (e instanceof Aspirador) e.setPlayerPos(this.player.x, this.player.y)
      if (e instanceof HumanEnemy) e.setPlayerPos(this.player.x, this.player.y)
      if ((e as any).setPlayerPos && !(e instanceof HumanEnemy) && !(e instanceof Aspirador)) {
        ;(e as any).setPlayerPos(this.player.x, this.player.y)
      }
    })
    // Ghost trail no dash
    if (this.player.raya.getIsDashing()) {
      const now = this.time.now
      if (now - this._lastTrailAt >= 80) {
        this._fx.ghostTrail(this.player.raya)
        this._lastTrailAt = now
      }
    }
  }

  private _applyUpgrades(): void {
    // Reset PHYSICS ao padrão antes de aplicar (evita stacking entre fases)
    PHYSICS.BARK_RADIUS   = 120
    PHYSICS.DASH_COOLDOWN = 800
    PHYSICS.SWAP_COOLDOWN = 1500
    gameState.maxHearts   = 3

    if (!profileManager.getActive()) return

    if (profileManager.hasUpgrade('heart_plus'))  gameState.maxHearts = 4
    if (profileManager.hasUpgrade('dash_fast'))   PHYSICS.DASH_COOLDOWN = 500
    if (profileManager.hasUpgrade('bark_wide'))   PHYSICS.BARK_RADIUS = Math.round(120 * 1.5)
    if (profileManager.hasUpgrade('swap_fast'))   PHYSICS.SWAP_COOLDOWN = 900
    if (profileManager.hasUpgrade('bone_radar'))  this._activateBoneRadar()
  }

  private _activateBoneRadar(): void {
    // Guard against duplicate activation on scene restart
    if (this._radarArrow) return

    this._radarArrow = this.add.text(0, 0, '▶', {
      fontSize: '18px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setDepth(30).setOrigin(0.5).setVisible(false)

    this._radarTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this._radarArrow?.active) return

        const bones = (this.itemGroup.getChildren() as Phaser.Physics.Arcade.Image[])
          .filter(item => item.active && item.getData('type') === 'golden_bone')

        if (bones.length === 0) {
          this._radarArrow.setVisible(false)
          return
        }

        const dog = gameState.activeDog === 'raya' ? this.player.raya : this.player.cruella
        let nearest = bones[0]
        let minDist = Phaser.Math.Distance.Between(dog.x, dog.y, bones[0].x, bones[0].y)
        for (const bone of bones) {
          const d = Phaser.Math.Distance.Between(dog.x, dog.y, bone.x, bone.y)
          if (d < minDist) { minDist = d; nearest = bone }
        }

        const angle = Math.atan2(nearest.y - dog.y, nearest.x - dog.x)
        this._radarArrow.setPosition(dog.x, dog.y - 32)
        this._radarArrow.setRotation(angle)
        this._radarArrow.setVisible(true)
      },
    })
  }
}
