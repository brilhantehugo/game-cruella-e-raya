import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, MEDAL_THRESHOLDS } from '../constants'
import { gameState } from '../GameState'
import { profileManager, LevelRecord, ProfileManager } from '../storage/ProfileManager'
import { SoundManager } from '../audio/SoundManager'

interface LevelCompleteData {
  score:         number
  time:          number       // ms
  goldenBones:   boolean[]
  deaths:        number
  enemiesKilled: number
  levelId:       string
  nextLevel:     string | null
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super(KEYS.LEVEL_COMPLETE) }

  create(data: LevelCompleteData): void {
    const score         = data?.score         ?? gameState.score
    const timeMs        = data?.time          ?? 0
    const goldenBones   = data?.goldenBones   ?? [false, false, false]
    const deaths        = data?.deaths        ?? 0
    const enemiesKilled = data?.enemiesKilled ?? 0
    const levelId       = data?.levelId       ?? gameState.currentLevel
    const nextLevel     = data?.nextLevel     ?? null

    const elapsedSec    = Math.floor(timeMs / 1000)
    const maxScore      = MEDAL_THRESHOLDS[levelId] ?? 2000
    const medal         = ProfileManager.calcMedal(score, goldenBones, deaths, maxScore)
    const existing      = profileManager.getActive()?.levels[levelId]
    const isNewRecord   = score > (existing?.bestScore ?? 0)

    const cx = GAME_WIDTH / 2

    this.cameras.main.setBackgroundColor('#001a00')

    // ── Confetti particles ─────────────────────────────────────────────
    type Conf = { x: number; y: number; vx: number; vy: number; col: number; r: number; rot: number; rotV: number }
    const confGfx = this.add.graphics()
    const CONF_COLS = [0xffff00, 0xff88ff, 0x88ffff, 0xff8800, 0x88ff88, 0xff4466]
    const confs: Conf[] = []
    for (let i = 0; i < 70; i++) {
      confs.push({
        x:    Phaser.Math.Between(0, GAME_WIDTH),
        y:    Phaser.Math.Between(-40, -200),
        vx:   Phaser.Math.FloatBetween(-0.5, 0.5),
        vy:   Phaser.Math.FloatBetween(0.6, 1.8),
        col:  Phaser.Math.RND.pick(CONF_COLS),
        r:    Phaser.Math.FloatBetween(2.5, 5),
        rot:  0,
        rotV: Phaser.Math.FloatBetween(-3, 3),
      })
    }
    this.events.on('update', (_: number, delta: number) => {
      confGfx.clear()
      confs.forEach(c => {
        c.y += c.vy * delta * 0.07
        c.x += c.vx * delta * 0.04
        c.rot += c.rotV * delta * 0.003
        if (c.y > GAME_HEIGHT + 10) { c.y = -10; c.x = Phaser.Math.Between(0, GAME_WIDTH) }
        confGfx.fillStyle(c.col, 0.85)
        const hw = c.r, hh = c.r * 0.5
        const cos = Math.cos(c.rot), sin = Math.sin(c.rot)
        confGfx.fillTriangle(
          c.x + cos*hw - sin*hh, c.y + sin*hw + cos*hh,
          c.x - cos*hw - sin*hh, c.y - sin*hw + cos*hh,
          c.x - cos*hw + sin*hh, c.y - sin*hw - cos*hh,
        )
        confGfx.fillTriangle(
          c.x + cos*hw - sin*hh, c.y + sin*hw + cos*hh,
          c.x - cos*hw + sin*hh, c.y - sin*hw - cos*hh,
          c.x + cos*hw + sin*hh, c.y + sin*hw - cos*hh,
        )
      })
    })

    // ── Título ────────────────────────────────────────────────────────
    const titleTxt = this.add.text(cx, 46, 'FASE CONCLUÍDA! 🏠', {
      fontSize: '36px', color: '#ffff00', fontStyle: 'bold',
      stroke: '#005500', strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.4)
    this.tweens.add({ targets: titleTxt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' })

    this.add.text(cx, 82, `${levelId}`, {
      fontSize: '13px', color: '#44ff88',
    }).setOrigin(0.5)

    // ── Medalha animada ───────────────────────────────────────────────
    const medalMap: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }
    const medalNameMap: Record<string, string> = { gold: 'MEDALHA DE OURO', silver: 'MEDALHA DE PRATA', bronze: 'MEDALHA DE BRONZE' }
    const medalTxt = this.add.text(cx, 130, medal ? medalMap[medal] : '🏅', {
      fontSize: '52px',
    }).setOrigin(0.5).setScale(0).setAlpha(0)

    this.tweens.add({
      targets: medalTxt, scaleX: 1, scaleY: 1, alpha: 1,
      delay: 300, duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        this.cameras.main.flash(120, 255, 215, 0, false)
        this.tweens.add({ targets: medalTxt, scaleX: 1.08, scaleY: 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      },
    })

    const medalNameTxt = this.add.text(cx, 180, medal ? medalNameMap[medal] : '', {
      fontSize: '13px', color: medal === 'gold' ? '#f0c040' : medal === 'silver' ? '#c0d8f0' : '#e0a060',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: medalNameTxt, alpha: 1, delay: 700, duration: 300 })

    // ── Golden Bones ──────────────────────────────────────────────────
    const boneY = 205
    for (let b = 0; b < 3; b++) {
      const bx = cx + (b - 1) * 50
      const collected = goldenBones[b] ?? false
      const boneTxt = this.add.text(bx, boneY, collected ? '⭐' : '☆', {
        fontSize: '28px', color: collected ? '#ffd700' : '#223322',
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: boneTxt, alpha: 1, delay: 900 + b * 150, duration: 250 })
    }

    // ── Painel de stats ───────────────────────────────────────────────
    const panelX = cx - 140, panelY = 238, panelW = 280, panelH = 100
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.5)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10)
    panel.lineStyle(1, 0x33aa55, 0.6)
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10)

    const row = (label: string, finalVal: string, y: number, col = '#dddddd') => {
      this.add.text(panelX + 16, y, label, { fontSize: '14px', color: '#888888' })
      this.add.text(panelX + panelW - 16, y, finalVal, {
        fontSize: '14px', color: col, align: 'right',
      }).setOrigin(1, 0)
    }

    const timeStr = `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,'0')}`
    row('Pontuação',  `${score}`,          panelY + 12, '#ffff88')
    row('Tempo',      timeStr,             panelY + 34, '#aaaaff')
    row('Inimigos',   `${enemiesKilled}`,  panelY + 56, '#ff8844')
    row('Mortes',     `${deaths}`,         panelY + 78, deaths === 0 ? '#44ff88' : '#ff6666')

    // Novo recorde
    if (isNewRecord) {
      const recordTxt = this.add.text(cx, panelY + panelH + 12, '🏆 Novo recorde! ↑', {
        fontSize: '13px', color: '#0a84ff', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: recordTxt, alpha: 1, delay: 1800, duration: 400 })
    }

    // ── Personagens celebrando ────────────────────────────────────────
    const raya    = this.add.sprite(cx - 90, 370, KEYS.RAYA, 0).setScale(3.2)
    const cruella = this.add.sprite(cx + 90, 375, KEYS.CRUELLA, 0).setScale(3.2).setFlipX(true)
    this.tweens.add({ targets: raya,    y: 358, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: cruella, y: 362, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 120 })

    // ── Botões ────────────────────────────────────────────────────────
    const btnY = GAME_HEIGHT - 22
    const mapBtn = this.add.text(cx - 90, btnY, '[ M — Mapa ]', {
      fontSize: '14px', color: '#aaaaff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: mapBtn, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 })

    const nextLabel = nextLevel ? '[ ENTER — Próxima Fase ]' : '[ ENTER — Ver Créditos ]'
    const nextBtn = this.add.text(cx + 80, btnY, nextLabel, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: nextBtn, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, delay: 100 })

    // ── Save no ProfileManager ────────────────────────────────────────
    const record: LevelRecord = {
      completed: true,
      medal,
      bestScore: score,
      bestTime: elapsedSec,
      goldenBones,
      totalDeaths: deaths,
      totalEnemiesKilled: enemiesKilled,
      playCount: 1,
    }
    profileManager.saveLevel(levelId, record)
    if (nextLevel) profileManager.unlockLevel(nextLevel)

    // ── Ações ─────────────────────────────────────────────────────────
    let _done = false

    const goMap = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.WORLD_MAP)
    }

    const goNext = () => {
      if (_done) return
      _done = true
      if (nextLevel) {
        gameState.currentLevel = nextLevel
        gameState.checkpointReached = false
      }
      SoundManager.stopBgm()
      if (nextLevel) {
        this.scene.start(KEYS.GAME)
      } else {
        this.scene.start(KEYS.WORLD_MAP)
      }
    }

    this.input.keyboard!.on('keydown-ENTER', goNext)
    this.input.keyboard!.on('keydown-M',     goMap)
    nextBtn.on('pointerdown', goNext)
    mapBtn.on('pointerdown', goMap)

    this.events.once('shutdown', () => SoundManager.stopBgm())

    // ── Música ────────────────────────────────────────────────────────
    SoundManager.play('levelComplete')
    this.time.delayedCall(400, () => SoundManager.playProceduralBgm('victory'))
  }
}
