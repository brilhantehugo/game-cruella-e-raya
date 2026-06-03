import Phaser from 'phaser'
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING, WORLD_DIFFICULTY, type WorldDifficulty } from '../constants'
import { gameState } from '../GameState'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { DonoNervoso } from '../entities/enemies/DonoNervoso'
import { Bone } from '../items/Bone'
import { GoldenBone } from '../items/GoldenBone'
import { PowerUp } from '../items/PowerUp'
import { Accessory } from '../items/Accessory'
import { LevelData, MiniBossConfig, MovingPlatformSpawn } from '../levels/LevelData'
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
import { HumanEnemy } from '../entities/enemies/HumanEnemy'
import { LevelBuilder } from '../systems/LevelBuilder'
import { ParallaxBackground } from '../background/ParallaxBackground'
import { SoundManager } from '../audio/SoundManager'
import { EffectsManager } from '../fx/EffectsManager'
import { EnemyHPBar } from '../fx/EnemyHPBar'
import { AmbientFX } from '../fx/AmbientFX'
import { AchievementManager } from '../achievements/AchievementManager'
import { profileManager } from '../storage/ProfileManager'
import { BossSetup } from './BossSetup'
import { BossIntro } from './BossIntro'
import { CollisionSetup } from './CollisionSetup'

export class GameScene extends Phaser.Scene {
  /*internal*/ player!: Player
  /*internal*/ groundLayer!: Phaser.Physics.Arcade.StaticGroup
  /*internal*/ platformLayer!: Phaser.Physics.Arcade.StaticGroup
  /*internal*/ decorationLayer!: Phaser.Physics.Arcade.StaticGroup
  /*internal*/ enemyGroup!: Phaser.Physics.Arcade.Group
  /*internal*/ itemGroup!: Phaser.Physics.Arcade.StaticGroup
  private escKey!: Phaser.Input.Keyboard.Key
  /*internal*/ currentLevel!: LevelData
  private _gameOverPending = false
  private _parallax!: ParallaxBackground
  private _mKey!: Phaser.Input.Keyboard.Key
  private _iKey!: Phaser.Input.Keyboard.Key
  private _camOffsetX: number = 0
  /*internal*/ _followingSprite: Phaser.Physics.Arcade.Sprite | null = null
  /*internal*/ _cinematicActive: boolean = false
  /*internal*/ _bossExit: Phaser.Physics.Arcade.Image | null = null
  /*internal*/ _bossProjectileGroup: Phaser.Physics.Arcade.Group | null = null
  private _miniBossBarriers: Phaser.Physics.Arcade.StaticGroup | null = null
  private _miniBossTriggerFired = false
  /*internal*/ _fx!: EffectsManager
  private _lastTrailAt: number = 0
  private _puAuraGfx!: Phaser.GameObjects.Graphics
  private _spotlight: SpotlightOverlay | null = null
  /*internal*/ _am?: AchievementManager      // persists across levels
  /*internal*/ _enemyHPBar!: EnemyHPBar
  private _radarArrow: Phaser.GameObjects.Text | null = null
  private _radarTimer: Phaser.Time.TimerEvent | null = null
  /*internal*/ _bossStartTime = 0
  private _ambientFX: AmbientFX | null = null
  /*internal*/ _livesAtBossStart = 0
  /*internal*/ _killCountInLevel = 0
  /*internal*/ _mainBoss: Enemy | null = null
  /*internal*/ _hazardGroup!: Phaser.Physics.Arcade.StaticGroup
  private _hasFallZone: boolean = false
  private _currentDiff!: WorldDifficulty
  /*internal*/ _movingPlatformGroup!: Phaser.Physics.Arcade.Group
  private _movingPlatformData: Array<{
    sprite: Phaser.Physics.Arcade.Image
    axis: 'x' | 'y'
    range: number
    speed: number
    originX: number
    originY: number
  }> = []

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
    this._ambientFX = new AmbientFX(this, this.currentLevel.backgroundTheme)

    // BGM procedural por mundo
    const worldId = gameState.currentLevel.split('-')[0]  // '0', '1', '2', '3'
    const isBoss  = gameState.currentLevel.endsWith('boss')
    const bgmType = isBoss
      ? 'boss'
      : (`world${worldId}` as 'world0' | 'world1' | 'world2' | 'world3')
    SoundManager.playProceduralBgm(bgmType)

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
      this._ambientFX?.destroy()
      this._ambientFX = null
      if (this._bossProjectileGroup) {
        this.time.removeAllEvents()
        this._bossProjectileGroup.clear(true, true)
        this._bossProjectileGroup = null
      }
    })

    this._buildDecorations()
    this._buildMovingPlatforms()
    this._buildHazards()
    this._fx = new EffectsManager(this)
    this._buildTilemap()
    this._spawnPlayer()
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
    this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
      this._fx.swapBurst(x, y, isRaya)
    })
    this._puAuraGfx = this.add.graphics()
    this._puAuraGfx.setDepth(5)
    this._spawnEnemies()
    this._setupMiniBoss()
    this._spawnItems()
    CollisionSetup.setup(this)
    this._setupCamera()

    // ── Spotlight overlay (World 3) ──────────────────────────────────────────
    if (this.currentLevel.hasSpotlight) {
      this._spotlight = new SpotlightOverlay(this, this.currentLevel.playerAuraRadius ?? 130)
    }

    // Boss intro cinemática — deve rodar depois de _setupCamera() para que
    // cam.stopFollow() e setBounds() operem sobre uma câmera já configurada
    if (this.currentLevel.isBossLevel) {
      BossIntro.run(this)
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

  /*internal*/ _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
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
        this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(1)
      }
    })
  }

  private _buildMovingPlatforms(): void {
    this._movingPlatformGroup = this.physics.add.group()
    this._movingPlatformData = []

    const defs = this.currentLevel.movingPlatforms ?? []
    for (const cfg of defs) {
      const sprite = this.physics.add.image(cfg.x, cfg.y, KEYS.TILE_PLATFORM)
        .setOrigin(0.5, 0.5)
        .setDepth(2)
        .setDisplaySize(cfg.width, 16)

      const body = sprite.body as Phaser.Physics.Arcade.Body
      body.setSize(cfg.width, 16)
      body.setImmovable(true)
      body.setAllowGravity(false)

      const vel = cfg.speed
      if (cfg.axis === 'x') {
        body.setVelocityX(vel)
      } else {
        body.setVelocityY(vel)
      }

      this._movingPlatformGroup.add(sprite as any)
      this._movingPlatformData.push({
        sprite: sprite as any,
        axis: cfg.axis,
        range: cfg.range,
        speed: cfg.speed,
        originX: cfg.x,
        originY: cfg.y,
      })
    }
  }

  private _buildHazards(): void {
    this._hazardGroup = this.physics.add.staticGroup()
    this._hasFallZone = false

    const hazards = this.currentLevel.hazards ?? []
    for (const h of hazards) {
      if (h.type === 'fall-zone') {
        this._hasFallZone = true
        continue   // sem sprite — detectado por bounds check em update()
      }
      // spike — tile_ground recolorido como espinho
      this._hazardGroup.add(
        this.physics.add.staticImage(h.x, h.y, KEYS.TILE_GROUND)
          .setTint(0xff3333)
          .setDisplaySize(h.width, 16)
          .setDepth(3)
          .refreshBody()
      )
    }
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
      if (gameState.checkpointReached) {
        this._fx.checkpointActivatedGlow(cp)
      }
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
    const worldId = gameState.currentLevel.split('-')[0]
    this._currentDiff = WORLD_DIFFICULTY[worldId] ?? WORLD_DIFFICULTY['0']
    this.currentLevel.enemies.forEach(spawn => {
      const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
      if (!enemy) return
      enemy.applyDifficulty(this._currentDiff)
      this.enemyGroup.add(enemy)
      if (enemy instanceof HumanEnemy) {
        enemy.setGroundLayer(this.groundLayer)   // ledge detection
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
      BossSetup.setup(this, this.currentLevel.id)
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
    SoundManager.playProceduralBgm('boss')
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
      SoundManager.playProceduralBgm(`world${gameState.currentLevel.split('-')[0]}` as 'world0' | 'world1' | 'world2' | 'world3')
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



  private _setupCamera(): void {
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE
    this.physics.world.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.setDeadzone(160, 80)
    this._followingSprite = this.player.active
    this.cameras.main.startFollow(this._followingSprite, true, 0.1, 0.1)
  }

  /*internal*/ _levelComplete(): void {
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

  /*internal*/ _gameOver(): void {
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
    // Pack chase — worlds 2 e 3: inimigo próximo do player alerta vizinhos dentro de 120px
    if (this._currentDiff?.packChase) {
      const px = this.player.x
      const py = this.player.y
      const activeEnemies = enemies.filter(e => e.active)
      activeEnemies.forEach(leader => {
        const dLeader = Phaser.Math.Distance.Between(leader.x, leader.y, px, py)
        if (dLeader < 80) {
          activeEnemies.forEach(follower => {
            if (follower === leader) return
            const dPair = Phaser.Math.Distance.Between(leader.x, leader.y, follower.x, follower.y)
            if (dPair <= 120) {
              // Posição falsa próxima ao follower faz ele "enxergar" o jogador
              const fakeX = follower.x + Math.sign(px - follower.x) * 50
              ;(follower as any).setPlayerPos?.(fakeX, py)
            }
          })
        }
      })
    }
    // Plataformas dinâmicas — inversão de velocidade ao atingir range
    for (const mp of this._movingPlatformData) {
      const body = mp.sprite.body as Phaser.Physics.Arcade.Body
      if (mp.axis === 'x') {
        const dist = mp.sprite.x - mp.originX
        if (Math.abs(dist) >= mp.range) {
          body.setVelocityX(-Math.sign(dist) * mp.speed)
        }
      } else {
        const dist = mp.sprite.y - mp.originY
        if (Math.abs(dist) >= mp.range) {
          body.setVelocityY(-Math.sign(dist) * mp.speed)
        }
      }
    }

    // Ghost trail no dash
    if (this.player.raya.getIsDashing()) {
      const now = this.time.now
      if (now - this._lastTrailAt >= 80) {
        this._fx.ghostTrail(this.player.raya)
        this._lastTrailAt = now
      }
    }

    // Aura de power-up ativo
    this._puAuraGfx.clear()
    const puEntry = gameState.activePowerUp
    if (puEntry && gameState.hasAnyPowerUp(this.time.now)) {
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
        bola:      0x44ff88,
        frisbee:   0x44ff88,
      }
      const puColor = puColors[puEntry.type] ?? 0x00ccff
      const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.time.now * 0.005))
      this._puAuraGfx.lineStyle(2, puColor, alpha)
      this._puAuraGfx.strokeCircle(this.player.active.x, this.player.active.y, 28)
    }

    // Fall-zone — jogador cai abaixo da tela → −1 coração + respawn no checkpoint
    if (this._hasFallZone) {
      const fallThreshold = GAME_HEIGHT + 64
      const rayaFell    = this.player.raya.active    && this.player.raya.y    > fallThreshold
      const cruellaFell = this.player.cruella.active && this.player.cruella.y > fallThreshold
      if (rayaFell || cruellaFell) {
        this.player.takeDamage()
        if (gameState.isDead()) {
          this._gameOver()
        } else {
          const rx = gameState.checkpointReached ? gameState.checkpointX : this.currentLevel.spawnX
          const ry = gameState.checkpointReached ? gameState.checkpointY - 32 : this.currentLevel.spawnY
          this.player.raya.setPosition(rx, ry)
          this.player.cruella.setPosition(rx, ry)
        }
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
