import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { SoundManager } from '../audio/SoundManager'
import { gameState } from '../GameState'

interface EnemyCard {
  key: string
  name: string
  desc: string
  weakness: string
  tip: string
  col: number
}

const ENEMIES: EnemyCard[] = [
  {
    key: KEYS.GATO,
    name: 'Gato Malencarado',
    desc: 'Patrulha plataformas\nem vaivém constante.\nIgnora Cruella totalmente.',
    weakness: 'Pisão de cima (ESPAÇO)\nou Dash da Raya',
    tip: '💡 Fica de olho nas plataformas altas!',
    col: 0xff8866,
  },
  {
    key: KEYS.POMBO,
    name: 'Pombo Agitado',
    desc: 'Voa em ondas sinusoidais.\nNão sofre gravidade.\nMuda de direção nas paredes.',
    weakness: 'Dash da Raya (SHIFT)\nou latido da Cruella',
    tip: '💡 Use Raya para derrubar voando!',
    col: 0xaabbff,
  },
  {
    key: KEYS.RATO,
    name: 'Rato de Calçada',
    desc: 'Se move rapidamente\nno chão. Muda direção\naleatoriamente a cada 1–3s.',
    weakness: 'Pisão ou Dash;\ntambém foge de Cruella',
    tip: '💡 Rápido — use o Dash para acertá-lo!',
    col: 0xccaa44,
  },
  {
    key: KEYS.DONO,
    name: 'Dono Nervoso',
    desc: 'Persegue a cachorra ativa.\nIMMUNE a danos.\nAtordoável pelo latido.',
    weakness: 'Impossível matar —\nevite ou atordoe com Cruella',
    tip: '💡 Troque para Cruella e uiva para parar!',
    col: 0x88ff88,
  },
  {
    key: KEYS.ASPIRADOR,
    name: 'Aspirador (Chefe 0)',
    desc: '8 HP, 3 fases:\n• Fase 1: patrulha + pulsa ondas\n• Fase 2: avança (charge!) laranja\n• Fase 3: vermelho, mais rápido',
    weakness: 'Pisões ou Dash:\n2 danos máx por acerto',
    tip: '💡 Fique nas plataformas — ele não sobe!',
    col: 0x22ccff,
  },
  {
    key: KEYS.BIGODES,
    name: 'Seu Bigodes (Chefe 1)',
    desc: '12 HP, 3 fases:\n• Fase 1: patrulha + atira lixo\n• Fase 2: pula entre plataformas\n• Fase 3: fica vermelho + convoca gatos',
    weakness: 'Pisões repetidos (3–4×)\ne Dash da Raya nos minions',
    tip: '💡 Cuide-se dos minions na fase 3!',
    col: 0xff4455,
  },
]

export class EnemyInfoScene extends Phaser.Scene {
  constructor() { super(KEYS.ENEMY_INFO) }

  create(data?: { fromGame?: boolean }): void {
    const fromGame = data?.fromGame ?? false
    this.cameras.main.setBackgroundColor('#0a0a1a')

    const cx = GAME_WIDTH / 2

    // ── Starfield ───────────────────────────────────────────────────────
    const sg = this.add.graphics()
    for (let i = 0; i < 50; i++) {
      sg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.05, 0.2))
      sg.fillCircle(Phaser.Math.Between(0, GAME_WIDTH), Phaser.Math.Between(0, GAME_HEIGHT), Phaser.Math.FloatBetween(0.5, 1.3))
    }

    // ── Title ────────────────────────────────────────────────────────────
    this.add.text(cx, 16, '👁️  BESTIÁRIO DO BAIRRO', {
      fontSize: '20px', color: '#ff6b6b', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5)

    // Decorative line
    const lr = this.add.graphics()
    lr.lineStyle(1, 0xff6b6b, 0.3)
    lr.strokeLineShape(new Phaser.Geom.Line(30, 36, GAME_WIDTH - 30, 36))

    // ── Enemy cards (2 columns) ───────────────────────────────────────────
    const CARD_W = 350, CARD_H = 118
    const startX = 28, startY = 44
    const colGap = 8

    ENEMIES.forEach((enemy, i) => {
      // Boss spans full width
      const isBoss = i === ENEMIES.length - 1
      const col   = isBoss ? 0 : i % 2
      const row   = isBoss ? Math.ceil((ENEMIES.length - 1) / 2) : Math.floor(i / 2)
      const cardW = isBoss ? GAME_WIDTH - startX * 2 : CARD_W
      const cardX = isBoss ? startX + cardW / 2 : startX + col * (CARD_W + colGap) + CARD_W / 2
      const cardY = startY + row * (CARD_H + 6) + CARD_H / 2

      // Card background
      const bg = this.add.graphics()
      bg.fillStyle(0x111122, 0.9)
      bg.fillRoundedRect(cardX - cardW / 2, cardY - CARD_H / 2, cardW, CARD_H, 8)
      bg.lineStyle(1, enemy.col, 0.5)
      bg.strokeRoundedRect(cardX - cardW / 2, cardY - CARD_H / 2, cardW, CARD_H, 8)

      // Sprite
      const spriteX = cardX - cardW / 2 + (isBoss ? 54 : 40)
      const scale   = isBoss ? 3 : 2.5
      this.add.sprite(spriteX, cardY, enemy.key, 0)
        .setScale(scale)
        .setTint(enemy.col)

      // Name
      const tx = cardX - cardW / 2 + (isBoss ? 104 : 74)
      this.add.text(tx, cardY - CARD_H / 2 + 8, enemy.name, {
        fontSize: '11px', color: `#${enemy.col.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
      })

      // Description
      this.add.text(tx, cardY - CARD_H / 2 + 24, enemy.desc, {
        fontSize: '9px', color: '#cccccc', lineSpacing: 2,
      })

      // Weakness
      const wkY = cardY + CARD_H / 2 - 32
      this.add.text(tx, wkY, `⚔ Fraqueza: ${enemy.weakness}`, {
        fontSize: '9px', color: '#ffdd88',
      })
      this.add.text(tx, wkY + 14, enemy.tip, {
        fontSize: '9px', color: '#88ffaa', fontStyle: 'italic',
      })
    })

    // ── Footer ─────────────────────────────────────────────────────────────
    const lr2 = this.add.graphics()
    lr2.lineStyle(1, 0x333355, 0.6)
    lr2.strokeLineShape(new Phaser.Geom.Line(30, GAME_HEIGHT - 30, GAME_WIDTH - 30, GAME_HEIGHT - 30))

    const backLabel = fromGame
      ? '[ ESC — voltar ao jogo ]'
      : '[ ESC / BACKSPACE — voltar ao menu ]'
    const backBtn = this.add.text(cx, GAME_HEIGHT - 16, backLabel, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
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

    // Music continues from wherever we came from (don't touch it)
    if (!fromGame) SoundManager.playProceduralBgm('menu')
  }
}
