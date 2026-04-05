import Phaser from 'phaser'
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING } from '../constants'
import { gameState } from '../GameState'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { GatoMalencarado } from '../entities/enemies/GatoMalencarado'
import { PomboAgitado } from '../entities/enemies/PomboAgitado'
import { RatoDeCalcada } from '../entities/enemies/RatoDeCalcada'
import { DonoNervoso } from '../entities/enemies/DonoNervoso'
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { Bone } from '../items/Bone'
import { GoldenBone } from '../items/GoldenBone'
import { PowerUp } from '../items/PowerUp'
import { Accessory } from '../items/Accessory'
import { LevelData } from '../levels/LevelData'
import { WORLD1_LEVELS } from '../levels/World1'
import { ParallaxBackground } from '../background/ParallaxBackground'
import { SoundManager } from '../audio/SoundManager'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private groundLayer!: Phaser.Physics.Arcade.StaticGroup
  private platformLayer!: Phaser.Physics.Arcade.StaticGroup
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private itemGroup!: Phaser.Physics.Arcade.StaticGroup
  private escKey!: Phaser.Input.Keyboard.Key
  private currentLevel!: LevelData
  private _gameOverPending = false
  private _parallax!: ParallaxBackground
  private _mKey!: Phaser.Input.Keyboard.Key
  private _camOffsetX: number = 0
  private _followingSprite: Phaser.Physics.Arcade.Sprite | null = null
  private _cinematicActive: boolean = false

  constructor() { super(KEYS.GAME) }

  create(): void {
    this._gameOverPending = false
    this.currentLevel = WORLD1_LEVELS[gameState.currentLevel] ?? WORLD1_LEVELS['1-1']
    this.cameras.main.setBackgroundColor(this.currentLevel.bgColor)

    // Parallax (antes das decorações para ordem de profundidade correta)
    this._parallax = new ParallaxBackground(this, this.currentLevel.backgroundTheme)

    // BGM
    const bgmKey = this.currentLevel.isBossLevel ? KEYS.BGM_BOSS : KEYS.BGM_WORLD1
    SoundManager.playBgm(bgmKey, this)

    // Tecla de mute
    this._mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)

    // Para BGM e destroi sprites de parallax quando a cena encerrar
    this.events.once('shutdown', () => {
      SoundManager.stopBgm()
      this._parallax.destroy()
    })

    this._buildDecorations()
    this._buildTilemap()
    this._spawnPlayer()
    this._spawnEnemies()
    this._spawnItems()
    this._setupCollisions()
    this._setupCamera()

    // Boss intro cinemática — deve rodar depois de _setupCamera() para que
    // cam.stopFollow() e setBounds() operem sobre uma câmera já configurada
    if (this.currentLevel.isBossLevel) {
      this._runBossIntro()
    }

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.scene.launch(KEYS.UI)

    // Inicia timer (delayedCall para garantir que UIScene já inicializou)
    this.time.delayedCall(100, () => {
      this.events.emit('start-timer', this.currentLevel.timeLimit)
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

    // Etapa 2 (500–1500ms): pan até o boss (centro da arena)
    this.time.delayedCall(500, () => {
      if (!this.scene.isActive(KEYS.GAME)) return
      const bossX = mapWidth / 2
      const bossY = GAME_HEIGHT / 2
      // scrollX = worldX - (viewportWidth / zoom / 2) para centrar o boss na tela
      const scrollX = bossX - GAME_WIDTH / 2 / 0.85
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
      this._cinematicActive = false
      // Trava a câmera dentro dos limites da arena
      cam.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    })
  }

  _spawnScorePopup(x: number, y: number, text: string, color: string = '#ffffff'): void {
    const popup = this.add.text(x, y, text, {
      fontSize: '16px', color, fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10)
    this.tweens.add({
      targets: popup,
      y: y - 48,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => popup.destroy(),
    })
  }

  private _buildDecorations(): void {
    this.currentLevel.decorations.forEach(d => {
      this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(-1)
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

    // Checkpoint (hidrante)
    const cp = this.physics.add.staticImage(this.currentLevel.checkpointX, this.currentLevel.checkpointY, KEYS.HYDRANT)
    cp.setData('type', 'checkpoint')
    this.itemGroup.add(cp)

    // Saída
    const exit = this.physics.add.staticImage(this.currentLevel.exitX, this.currentLevel.exitY, KEYS.EXIT_GATE)
    exit.setData('type', 'exit')
    this.itemGroup.add(exit)
  }

  private _spawnPlayer(): void {
    const spawnX = gameState.checkpointReached ? gameState.checkpointX : this.currentLevel.spawnX
    const spawnY = gameState.checkpointReached ? gameState.checkpointY - 32 : this.currentLevel.spawnY
    this.player = new Player(this, spawnX, spawnY)
  }

  private _spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group()
    this.currentLevel.enemies.forEach(spawn => {
      let enemy: Enemy | undefined
      switch (spawn.type) {
        case 'gato':  enemy = new GatoMalencarado(this, spawn.x, spawn.y); break
        case 'pombo': enemy = new PomboAgitado(this, spawn.x, spawn.y);    break
        case 'rato':  enemy = new RatoDeCalcada(this, spawn.x, spawn.y);   break
        case 'dono':  enemy = new DonoNervoso(this, spawn.x, spawn.y);     break
      }
      if (!enemy) return
      this.enemyGroup.add(enemy)
      enemy.on('died', (e: Enemy) => {
        gameState.addScore(50)
        this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      })
    })

    if (this.currentLevel.isBossLevel) {
      const boss = new SeuBigodes(this, 480, 360)
      this.enemyGroup.add(boss)
      boss.on('died', (b: Enemy) => {
        gameState.addScore(1000)
        gameState.collarOfGold = true
        this._spawnScorePopup(b.x, b.y - 30, '+1000', '#22c55e')
        this._levelComplete()
      })
      boss.on('spawnMinion', (minion: Enemy) => {
        this.enemyGroup.add(minion)
        minion.on('died', (e: Enemy) => {
          gameState.addScore(SCORING.ENEMY_KILL)
          this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
        })
      })
    }
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
    this.physics.add.collider(this.enemyGroup, this.platformLayer)

    playerSprites.forEach(sprite => {
      this.physics.add.overlap(sprite, this.enemyGroup, (ps, enemy) => {
        const e = enemy as Enemy
        const pBody = (ps as Phaser.Physics.Arcade.Sprite).body as Phaser.Physics.Arcade.Body
        const eBody = e.body as Phaser.Physics.Arcade.Body

        // Stomp: player falling and centre above enemy centre
        if (pBody.velocity.y > 50 && pBody.bottom <= eBody.top + 12) {
          e.takeDamage(999)
          pBody.setVelocityY(-380)
          SoundManager.play('stomp')
          // Hit stop: pausa física por 80ms para dar peso ao golpe
          this.physics.pause()
          this.time.delayedCall(80, () => this.physics.resume())
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
      (this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        if (Phaser.Math.Distance.Between(bx, by, e.x, e.y) <= PHYSICS.BARK_RADIUS) e.stun(2000)
      })
    })
  }

  private _handleItemCollect(type: string, item: Phaser.Physics.Arcade.Image): void {
    const now = this.time.now
    switch (type) {
      case 'checkpoint':
        if (!gameState.checkpointReached) {
          gameState.setCheckpoint(item.x, item.y)
          SoundManager.play('checkpoint')
        }
        return // don't destroy
      case 'exit':
        this._levelComplete()
        return
      case 'bone':
        gameState.addScore(10)
        SoundManager.play('collectBone')
        this._spawnScorePopup(item.x, item.y - 16, '+10')
        break
      case 'golden_bone':
        gameState.collectGoldenBone(gameState.currentLevel, (item as GoldenBone).boneIndex)
        gameState.addScore(500)
        SoundManager.play('collectGolden')
        this._spawnScorePopup(item.x, item.y - 16, '+500', '#ffd700')
        break
      case 'pizza':
        gameState.restoreHeart()
        this._spawnScorePopup(item.x, item.y - 16, '❤️', '#ff6b6b')
        break
      case 'laco': case 'coleira': case 'chapeu': case 'bandana':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
        break
      default:
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
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
    if (this.currentLevel.nextLevel) {
      gameState.currentLevel = this.currentLevel.nextLevel
      gameState.checkpointReached = false
    }
    this.scene.start(KEYS.LEVEL_COMPLETE, {
      score: gameState.score,
      bones: Object.values(gameState.goldenBones).flat().filter(Boolean).length,
    })
  }

  private _gameOver(): void {
    if (this._gameOverPending) return
    this._gameOverPending = true
    this.scene.stop(KEYS.UI)
    this.scene.start(KEYS.GAME_OVER)
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause()
      this.scene.launch(KEYS.PAUSE)
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
    enemies.forEach(e => {
      e.update(time, delta)
      if (e instanceof DonoNervoso) e.setTarget(this.player.x)
    })
  }
}
