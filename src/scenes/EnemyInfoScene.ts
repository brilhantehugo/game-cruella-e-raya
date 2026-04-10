import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { SoundManager } from '../audio/SoundManager'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Category = 'obstaculo' | 'inimigo' | 'chefe'

interface CharCard {
  key: string
  name: string
  category: Category
  phases: string      // ex.: "Fase 0-1", "Fases 1-1 a 1-3"
  desc: string        // máx 2 linhas
  weakness: string    // 1 linha
  tip: string
  col: number
}

// ─── Dados dos personagens ────────────────────────────────────────────────────
const CHARACTERS: CharCard[] = [
  // ── Obstáculos (não podem ser derrotados) ──────────────────────────────
  {
    key: KEYS.HUGO, name: 'Hugo', category: 'obstaculo', phases: 'Fase 0-1',
    desc: 'Patrulha o apartamento.\nImune — empurra e causa dano.',
    weakness: 'Não pode ser ferido', tip: '💡 Pule por cima!', col: 0x3366cc,
  },
  {
    key: KEYS.HANNAH, name: 'Hannah', category: 'obstaculo', phases: 'Fase 0-1',
    desc: 'Patrulha o corredor.\nImune — causa dano no contato.',
    weakness: 'Não pode ser ferida', tip: '💡 Use as plataformas!', col: 0xcc3355,
  },
  {
    key: KEYS.DONO, name: 'Dono Nervoso', category: 'obstaculo', phases: 'Fases 1-1 a 1-3',
    desc: 'Persegue a cachorra ativa.\nAtordoável pelo latido da Cruella.',
    weakness: 'Imune — só atordoar', tip: '💡 Troque p/ Cruella e uive!', col: 0x55cc88,
  },
  // ── Inimigos (podem ser derrotados) ───────────────────────────────────
  {
    key: KEYS.GATO, name: 'Gato Malencarado', category: 'inimigo', phases: 'Fases 1-1 a 1-3',
    desc: 'Patrulha plataformas em vaivém.\nIgnora Cruella totalmente.',
    weakness: 'Pisão (ESPAÇO) ou Dash', tip: '💡 Cuidado nas plataformas!', col: 0xff8866,
  },
  {
    key: KEYS.POMBO, name: 'Pombo Agitado', category: 'inimigo', phases: 'Fases 1-1 a 1-3',
    desc: 'Voa em ondas sinusoidais.\nMuda direção nas paredes.',
    weakness: 'Dash da Raya ou latido', tip: '💡 Raya consegue alcançar!', col: 0x99aaff,
  },
  {
    key: KEYS.RATO, name: 'Rato de Calçada', category: 'inimigo', phases: 'Fases 1-1 a 1-3',
    desc: 'Corre rápido no chão.\nMuda direção aleatoriamente.',
    weakness: 'Pisão ou Dash da Raya', tip: '💡 Use o Dash (SHIFT)!', col: 0xccaa44,
  },
  // ── Chefes (batalhas especiais) ───────────────────────────────────────
  {
    key: KEYS.ASPIRADOR, name: 'Wall-E', category: 'chefe', phases: 'Fase 0-boss',
    desc: '8 HP · 3 fases: patrulha,\ncharge laranja, vermelho veloz.',
    weakness: 'Pisão ou Dash (máx 2/golpe)', tip: '💡 Suba nas plataformas!', col: 0x22ccff,
  },
  {
    key: KEYS.BIGODES, name: 'Seu Bigodes', category: 'chefe', phases: 'Fase 1-boss',
    desc: '12 HP · 3 fases: lixo, saltos\ne convoca gatos na fase final.',
    weakness: 'Pisões repetidos (3–4×)', tip: '💡 Cuidado com os minions!', col: 0xff4455,
  },
]

// ─── Seções com cabeçalho visual ──────────────────────────────────────────────
const SECTIONS: Array<{
  cat: Category
  icon: string
  label: string
  sublabel: string
  bgCol: number
  textCol: string
}> = [
  {
    cat: 'obstaculo', icon: '🚧', label: 'OBSTÁCULOS',
    sublabel: 'não podem ser derrotados — evite ou contorne',
    bgCol: 0x1a4433, textCol: '#77ffcc',
  },
  {
    cat: 'inimigo', icon: '⚔️', label: 'INIMIGOS',
    sublabel: 'podem ser derrotados — ganhe pontos ao eliminar',
    bgCol: 0x442211, textCol: '#ffaa66',
  },
  {
    cat: 'chefe', icon: '💀', label: 'CHEFES',
    sublabel: 'batalhas especiais ao fim de cada mundo',
    bgCol: 0x441122, textCol: '#ff8899',
  },
]

// ─── Cena ─────────────────────────────────────────────────────────────────────
export class EnemyInfoScene extends Phaser.Scene {
  constructor() { super(KEYS.ENEMY_INFO) }

  create(data?: { fromGame?: boolean }): void {
    const fromGame = data?.fromGame ?? false
    this.cameras.main.setBackgroundColor('#080818')

    const cx = GAME_WIDTH / 2

    // ── Starfield ─────────────────────────────────────────────────────────
    const sg = this.add.graphics()
    for (let i = 0; i < 60; i++) {
      sg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.04, 0.18))
      sg.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.4, 1.2),
      )
    }

    // ── Título ────────────────────────────────────────────────────────────
    this.add.text(cx, 14, '🐾  GUIA DE PERSONAGENS', {
      fontSize: '19px', color: '#ffcc44', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(cx, 30, 'quem você vai encontrar no bairro', {
      fontSize: '9px', color: '#666688',
    }).setOrigin(0.5)

    // ── Layout ────────────────────────────────────────────────────────────
    const MARGIN     = 28
    const AVAIL_W    = GAME_WIDTH - MARGIN * 2   // 744px
    const CARD_H     = 78
    const COL_GAP    = 8
    const ROW_GAP    = 3
    const SEC_GAP    = 8
    const HEADER_H   = 18
    const CARD_W3    = (AVAIL_W - COL_GAP * 2) / 3     // 3-col (obstacles/enemies)
    const CARD_W2    = (AVAIL_W - COL_GAP)     / 2     // 2-col (bosses)

    let curY = 40  // where to start drawing below the subtitle

    SECTIONS.forEach(sec => {
      const chars = CHARACTERS.filter(c => c.category === sec.cat)
      const isBossSection = sec.cat === 'chefe'
      const COLS   = isBossSection ? 2 : 3
      const CARD_W = isBossSection ? CARD_W2 : CARD_W3

      // ── Section header ──────────────────────────────────────────────────
      const hg = this.add.graphics()
      hg.fillStyle(sec.bgCol, 1)
      hg.fillRoundedRect(MARGIN, curY, AVAIL_W, HEADER_H, 4)
      // subtle left accent bar
      hg.fillStyle(Phaser.Display.Color.HexStringToColor(sec.textCol).color, 0.7)
      hg.fillRoundedRect(MARGIN, curY, 3, HEADER_H, { tl: 4, bl: 4, tr: 0, br: 0 })

      this.add.text(MARGIN + 10, curY + HEADER_H / 2, `${sec.icon}  ${sec.label}`, {
        fontSize: '9px', color: sec.textCol, fontStyle: 'bold',
      }).setOrigin(0, 0.5)

      this.add.text(MARGIN + AVAIL_W - 4, curY + HEADER_H / 2, sec.sublabel, {
        fontSize: '8px', color: '#888899',
      }).setOrigin(1, 0.5)

      curY += HEADER_H + 3

      // ── Cards ────────────────────────────────────────────────────────────
      const rows = Math.ceil(chars.length / COLS)
      for (let row = 0; row < rows; row++) {
        const rowChars = chars.slice(row * COLS, (row + 1) * COLS)
        const cardCY = curY + CARD_H / 2

        rowChars.forEach((char, col) => {
          const cardCX = MARGIN + col * (CARD_W + COL_GAP) + CARD_W / 2

          // Card background
          const bg = this.add.graphics()
          bg.fillStyle(0x0e0e22, 0.95)
          bg.fillRoundedRect(cardCX - CARD_W / 2, cardCY - CARD_H / 2, CARD_W, CARD_H, 6)
          bg.lineStyle(1, char.col, 0.45)
          bg.strokeRoundedRect(cardCX - CARD_W / 2, cardCY - CARD_H / 2, CARD_W, CARD_H, 6)
          // Accent left border
          bg.fillStyle(char.col, 0.6)
          bg.fillRoundedRect(cardCX - CARD_W / 2, cardCY - CARD_H / 2, 3, CARD_H, {
            tl: 6, bl: 6, tr: 0, br: 0,
          })

          // Sprite
          const spriteX = cardCX - CARD_W / 2 + (isBossSection ? 32 : 26)
          const scale   = isBossSection ? 2 : 1.5
          this.add.sprite(spriteX, cardCY - 4, char.key, 0)
            .setScale(scale)
            .setTint(char.col)

          // Text area
          const tx = cardCX - CARD_W / 2 + (isBossSection ? 64 : 50)
          const top = cardCY - CARD_H / 2

          // Name
          this.add.text(tx, top + 5, char.name, {
            fontSize: '10px',
            color: `#${char.col.toString(16).padStart(6, '0')}`,
            fontStyle: 'bold',
          })

          // Phase badge
          this.add.text(tx, top + 17, `📍 ${char.phases}`, {
            fontSize: '7px', color: '#7788aa',
          })

          // Description
          this.add.text(tx, top + 27, char.desc, {
            fontSize: '8px', color: '#bbbbcc', lineSpacing: 2,
          })

          // Weakness
          this.add.text(tx, top + 52, `⚔ ${char.weakness}`, {
            fontSize: '7px', color: '#ffdd88',
          })

          // Tip
          this.add.text(tx, top + 63, char.tip, {
            fontSize: '7px', color: '#88ffaa', fontStyle: 'italic',
          })
        })

        curY += CARD_H + ROW_GAP
      }

      curY += SEC_GAP
    })

    // ── Footer ─────────────────────────────────────────────────────────────
    const lr = this.add.graphics()
    lr.lineStyle(1, 0x333355, 0.5)
    lr.strokeLineShape(new Phaser.Geom.Line(MARGIN, GAME_HEIGHT - 20, GAME_WIDTH - MARGIN, GAME_HEIGHT - 20))

    const backLabel = fromGame
      ? '[ ESC — voltar ao jogo ]'
      : '[ ESC / BACKSPACE — voltar ao menu ]'
    const backBtn = this.add.text(cx, GAME_HEIGHT - 10, backLabel, {
      fontSize: '11px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: backBtn, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 })

    const goBack = () => {
      if (fromGame) {
        this.scene.stop()
        this.scene.resume(KEYS.GAME)
      } else {
        SoundManager.stopBgm()
        this.scene.start(KEYS.MENU)
      }
    }

    const kb = this.input.keyboard!
    kb.on('keydown-ESC',       goBack)
    kb.on('keydown-BACKSPACE', goBack)
    kb.on('keydown-I',         goBack)
    backBtn.on('pointerdown',  goBack)

    this.events.once('shutdown', () => {
      kb.off('keydown-ESC',       goBack)
      kb.off('keydown-BACKSPACE', goBack)
      kb.off('keydown-I',         goBack)
    })

    if (!fromGame) SoundManager.playProceduralBgm('menu')
  }
}
