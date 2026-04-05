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
    desc: 'Patrulha plataformas em vaivém.\nIgnora Cruella totalmente.',
    weakness: 'Pisão (ESPAÇO) ou Dash da Raya',
    tip: '💡 Cuidado com plataformas altas!',
    col: 0xff8866,
  },
  {
    key: KEYS.POMBO,
    name: 'Pombo Agitado',
    desc: 'Voa em ondas sinusoidais.\nMuda direção nas paredes.',
    weakness: 'Dash da Raya (SHIFT) ou latido',
    tip: '💡 Use Raya para derrubar voando!',
    col: 0xaabbff,
  },
  {
    key: KEYS.RATO,
    name: 'Rato de Calçada',
    desc: 'Corre rápido no chão.\nMuda direção aleatoriamente.',
    weakness: 'Pisão ou Dash; foge de Cruella',
    tip: '💡 Rápido — use o Dash para acertá-lo!',
    col: 0xccaa44,
  },
  {
    key: KEYS.DONO,
    name: 'Dono Nervoso',
    desc: 'Persegue a cachorra ativa.\nImune — atordoável pelo latido.',
    weakness: 'Não pode ser morto — evite',
    tip: '💡 Troque para Cruella e uive!',
    col: 0x88ff88,
  },
  {
    key: KEYS.HUGO,
    name: 'Hugo (Dono)',
    desc: 'Patrulha o apartamento.\nImune — empurra ao contato.',
    weakness: 'Não pode ser machucado',
    tip: '💡 Pule por cima ou contorne!',
    col: 0x3060c0,
  },
  {
    key: KEYS.HANNAH,
    name: 'Hannah (Dona)',
    desc: 'Patrulha o corredor.\nImune — causa dano no contato.',
    weakness: 'Não pode ser machucada',
    tip: '💡 Use plataformas para passar!',
    col: 0xcc2233,
  },
  {
    key: KEYS.ASPIRADOR,
    name: 'Aspirador (Chefe 0)',
    desc: '8 HP · 3 fases: patrulha,\ncharge laranja, vermelho veloz.',
    weakness: 'Pisões ou Dash (máx 2 dano/golpe)',
    tip: '💡 Plataformas — ele não sobe!',
    col: 0x22ccff,
  },
  {
    key: KEYS.BIGODES,
    name: 'Seu Bigodes (Chefe 1)',
    desc: '12 HP · 3 fases: lixo, saltos\ne convoca gatos na fase final.',
    weakness: 'Pisões repetidos (3–4×)',
    tip: '💡 Cuide dos minions na fase 3!',
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
    // Layout compacto para caber 8 inimigos (4 pares + 1 chefe em largura total)
    const CARD_W = 350, CARD_H = 68
    const startX = 28, startY = 42
    const colGap = 8, rowGap = 4

    ENEMIES.forEach((enemy, i) => {
      // Último entry (Bigodes) é chefe e ocupa largura total
      const isBoss = i === ENEMIES.length - 1
      const col   = isBoss ? 0 : i % 2
      const row   = isBoss ? Math.ceil((ENEMIES.length - 1) / 2) : Math.floor(i / 2)
      const cardW = isBoss ? GAME_WIDTH - startX * 2 : CARD_W
      const cardX = isBoss ? startX + cardW / 2 : startX + col * (CARD_W + colGap) + CARD_W / 2
      const cardY = startY + row * (CARD_H + rowGap) + CARD_H / 2

      // Card background
      const bg = this.add.graphics()
      bg.fillStyle(0x111122, 0.9)
      bg.fillRoundedRect(cardX - cardW / 2, cardY - CARD_H / 2, cardW, CARD_H, 6)
      bg.lineStyle(1, enemy.col, 0.5)
      bg.strokeRoundedRect(cardX - cardW / 2, cardY - CARD_H / 2, cardW, CARD_H, 6)

      // Sprite
      const spriteX = cardX - cardW / 2 + (isBoss ? 44 : 32)
      const scale   = isBoss ? 2.5 : 2
      this.add.sprite(spriteX, cardY, enemy.key, 0)
        .setScale(scale)
        .setTint(enemy.col)

      // Name
      const tx = cardX - cardW / 2 + (isBoss ? 86 : 62)
      this.add.text(tx, cardY - CARD_H / 2 + 4, enemy.name, {
        fontSize: '10px', color: `#${enemy.col.toString(16).padStart(6, '0')}`, fontStyle: 'bold',
      })

      // Description (máx 2 linhas × 8px = 16px)
      this.add.text(tx, cardY - CARD_H / 2 + 17, enemy.desc, {
        fontSize: '8px', color: '#cccccc', lineSpacing: 2,
      })

      // Weakness + tip (parte inferior do card)
      const wkY = cardY + CARD_H / 2 - 27
      this.add.text(tx, wkY, `⚔ ${enemy.weakness}`, {
        fontSize: '8px', color: '#ffdd88',
      })
      this.add.text(tx, wkY + 14, enemy.tip, {
        fontSize: '8px', color: '#88ffaa', fontStyle: 'italic',
      })
    })

    // ── Footer ─────────────────────────────────────────────────────────────
    const lr2 = this.add.graphics()
    lr2.lineStyle(1, 0x333355, 0.6)
    lr2.strokeLineShape(new Phaser.Geom.Line(30, GAME_HEIGHT - 22, GAME_WIDTH - 30, GAME_HEIGHT - 22))

    const backLabel = fromGame
      ? '[ ESC — voltar ao jogo ]'
      : '[ ESC / BACKSPACE — voltar ao menu ]'
    const backBtn = this.add.text(cx, GAME_HEIGHT - 10, backLabel, {
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
