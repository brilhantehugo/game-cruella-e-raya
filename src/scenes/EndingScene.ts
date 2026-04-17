import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { profileManager } from '../storage/ProfileManager'
import { SoundManager } from '../audio/SoundManager'

interface EndingData {
  score:         number
  deaths:        number
  enemiesKilled: number
}

const EPILOGUE_LINES: { text: string; color: string }[] = [
  { text: 'Raya: "Conseguimos! A gente tá FORA! Eu sabia! Eu SABIA!"',                   color: '#88ffaa' },
  { text: 'Cruella: "Claro que sabia. Não para de falar nisso desde o primeiro andar."', color: '#ffa040' },
  { text: 'Raya: "Porque era verdade! Somos uma dupla incrível!"',                       color: '#88ffaa' },
  { text: 'Cruella: "Não somos uma dupla. Você é minha cachorra."',                      color: '#ffa040' },
  { text: 'Raya: "...A melhor cachorra do mundo?"',                                      color: '#88ffaa' },
  { text: 'Cruella: "…A melhor cachorra do mundo."',                                     color: '#ffa040' },
]

export class EndingScene extends Phaser.Scene {
  constructor() { super(KEYS.ENDING) }

  create(data: EndingData): void {
    // Notify achievement system that the ending was seen
    const gs = this.scene.get(KEYS.GAME) as any
    gs?._am?.notify('ending_seen')

    const score         = data?.score         ?? gameState.score
    const deaths        = data?.deaths        ?? 0
    const enemiesKilled = data?.enemiesKilled ?? 0

    this.cameras.main.setBackgroundColor('#000000')

    // ── Starfield ────────────────────────────────────────────────────────
    const starGfx = this.add.graphics()
    const stars: { x: number; y: number; r: number; spd: number; a: number }[] = []
    for (let i = 0; i < 80; i++) {
      stars.push({
        x:   Phaser.Math.Between(0, GAME_WIDTH),
        y:   Phaser.Math.Between(0, GAME_HEIGHT),
        r:   Phaser.Math.FloatBetween(0.4, 1.8),
        spd: Phaser.Math.FloatBetween(0.03, 0.15),
        a:   Phaser.Math.FloatBetween(0.3, 1.0),
      })
    }
    this.events.on('update', (_: number, delta: number) => {
      starGfx.clear()
      stars.forEach(st => {
        st.y += st.spd * delta * 0.06
        if (st.y > GAME_HEIGHT) st.y = 0
        starGfx.fillStyle(0xffffff, st.a)
        starGfx.fillCircle(st.x, st.y, st.r)
      })
    })

    const cx = GAME_WIDTH / 2

    // ── Stats from profile + gameState ───────────────────────────────────
    const profile = profileManager.getActive()
    const levelIds = [
      '0-1','0-2','0-3','0-4','0-5','0-boss',
      '1-1','1-2','1-3','1-4','1-5','1-boss',
      '2-1','2-2','2-3','2-4','2-5','2-boss',
      '3-1','3-2','3-3','3-4','3-5','3-boss',
    ]
    const earnedMedals = profile
      ? levelIds.filter(id => profile.levels[id]?.medal)
                .map(id => profile.levels[id].medal!)
      : []
    const goldCount   = earnedMedals.filter(m => m === 'gold').length
    const silverCount = earnedMedals.filter(m => m === 'silver').length
    const bronzeCount = earnedMedals.filter(m => m === 'bronze').length
    const totalGolden = Object.values(gameState.goldenBones)
      .reduce((s, a) => s + a.filter(Boolean).length, 0)

    // ── Momentos ─────────────────────────────────────────────────────────
    let moment = 0
    const containers: Phaser.GameObjects.Container[] = []

    const showMoment = (idx: number) => {
      containers.forEach((c, i) => {
        this.tweens.add({ targets: c, alpha: i === idx ? 1 : 0, duration: 500 })
      })
    }

    const advance = () => {
      if (moment >= containers.length - 1) return
      moment++
      showMoment(moment)
    }

    // ── Momento 2: Estatísticas ───────────────────────────────────────────
    const m2 = this.add.container(0, 0).setAlpha(0)
    m2.add(this.add.text(cx, 36, '📊 ESTATÍSTICAS', {
      fontSize: '20px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5))

    const px = cx - 150, py = 68, pw = 300, ph = 220
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.6)
    panel.fillRoundedRect(px, py, pw, ph, 10)
    panel.lineStyle(1, 0x33aa55, 0.5)
    panel.strokeRoundedRect(px, py, pw, ph, 10)
    m2.add(panel)

    const row = (label: string, val: string, y: number, col = '#dddddd') => {
      const l = this.add.text(px + 14, y, label, { fontSize: '14px', color: '#888888' })
      const v = this.add.text(px + pw - 14, y, val, {
        fontSize: '14px', color: col, align: 'right',
      }).setOrigin(1, 0)
      m2.add([l, v])
    }
    row('Pontuação final',     `${score}`,         py + 12,  '#ffff88')
    row('Inimigos derrotados', `${enemiesKilled}`,  py + 36,  '#ff8844')
    row('Mortes',              `${deaths}`,         py + 60,  deaths === 0 ? '#44ff88' : '#ff6666')
    row('Ossos dourados',      `${totalGolden}`,    py + 84,  '#ffd700')

    m2.add(this.add.text(px + 14, py + 116, 'Medalhas:', { fontSize: '12px', color: '#888888' }))
    m2.add(this.add.text(px + 14, py + 136,
      `🥇 ${goldCount}   🥈 ${silverCount}   🥉 ${bronzeCount}`, {
        fontSize: '18px',
      }))

    m2.add(this.add.text(cx, GAME_HEIGHT - 28, '[ ENTER — Créditos ]', {
      fontSize: '13px', color: '#aaaaff', fontStyle: 'bold',
    }).setOrigin(0.5))
    containers.push(m2)

    // ── Momento 3: Créditos ───────────────────────────────────────────────
    const m3 = this.add.container(0, 0).setAlpha(0)
    m3.add(this.add.text(cx, 100, 'Fim.', {
      fontSize: '52px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5))
    m3.add(this.add.text(cx, 180, 'Obrigado por jogar Cruella & Raya!', {
      fontSize: '16px', color: '#ffe81f', align: 'center',
    }).setOrigin(0.5))

    const replayBtn = this.add.text(cx - 110, GAME_HEIGHT - 28,
      '[ ENTER — Jogar de Novo ]', {
        fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive()
    const mapBtn = this.add.text(cx + 110, GAME_HEIGHT - 28,
      '[ M — Mapa do Mundo ]', {
        fontSize: '13px', color: '#aaaaff', fontStyle: 'bold',
      }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: replayBtn, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 })
    this.tweens.add({ targets: mapBtn,    alpha: 0.35, duration: 650, yoyo: true, repeat: -1, delay: 120 })
    m3.add([replayBtn, mapBtn])
    containers.push(m3)

    // ── Input ─────────────────────────────────────────────────────────────
    let _done = false
    let _epilogueDone = false

    const goReplay = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      gameState.reset()
      this.scene.start(KEYS.CHARACTER_SELECT)
    }

    const goMap = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.WORLD_MAP)
    }

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!_epilogueDone) return
      if (moment < containers.length - 1) advance()
      else goReplay()
    })
    this.input.keyboard?.on('keydown-M', () => {
      if (moment === containers.length - 1) goMap()
    })
    replayBtn.on('pointerdown', goReplay)
    mapBtn.on('pointerdown', goMap)

    this.events.once('shutdown', () => SoundManager.stopBgm())

    // ── Music ─────────────────────────────────────────────────────────────
    SoundManager.playProceduralBgm('intro')

    // ── Epílogo ───────────────────────────────────────────────────────────
    this._runEpilogue(() => {
      _epilogueDone = true
      showMoment(0)
    })
  }

  private _runEpilogue(onDone: () => void): void {
    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2

    EPILOGUE_LINES.forEach((line, i) => {
      this.time.delayedCall(i * 2600, () => {
        const txt = this.add.text(cx, cy, line.text, {
          fontSize: '16px',
          color: line.color,
          align: 'center',
          wordWrap: { width: GAME_WIDTH - 100 },
        }).setOrigin(0.5).setAlpha(0).setScrollFactor(0).setDepth(10)

        this.tweens.add({
          targets: txt,
          alpha: 1,
          duration: 400,
          onComplete: () => {
            this.time.delayedCall(1800, () => {
              this.tweens.add({ targets: txt, alpha: 0, duration: 400 })
            })
          },
        })
      })
    })

    // 6 lines × 2600ms + 600ms pause = 16200ms
    this.time.delayedCall(EPILOGUE_LINES.length * 2600 + 600, onDone)
  }
}
