import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'

export class GalleryScene extends Phaser.Scene {
  constructor() { super(KEYS.GALLERY) }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    const cx = GAME_WIDTH / 2

    this.add.text(cx, 28, 'GALERIA DE OSSOS DOURADOS', {
      fontSize: '26px', color: '#ffd700', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.rectangle(cx, 52, GAME_WIDTH - 60, 1, 0x443300)

    // ── Golden bones per level ──────────────────────────────────────────────────
    const levels = ['1-1', '1-2', '1-3']
    let totalCollected = 0
    let totalBones = 0

    levels.forEach((level, li) => {
      const y = 90 + li * 70
      const bones = gameState.goldenBones[level] ?? [false, false, false]
      const count = bones.filter(Boolean).length
      totalCollected += count
      totalBones += 3

      this.add.text(80, y, `Fase ${level}`, {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
      })
      this.add.text(80, y + 22, `${count}/3 ossos`, {
        fontSize: '13px', color: count === 3 ? '#ffd700' : '#888888'
      })

      bones.forEach((collected, bi) => {
        const bx = 300 + bi * 70
        const icon = this.add.image(bx, y + 14, KEYS.GOLDEN_BONE).setScale(1.8)
        if (!collected) icon.setTint(0x333333)
      })
    })

    // Total
    const totalY = 90 + levels.length * 70 + 8
    const pct = totalBones > 0 ? Math.round((totalCollected / totalBones) * 100) : 0
    this.add.text(cx, totalY, `Total: ${totalCollected}/${totalBones}  (${pct}%)`, {
      fontSize: '15px', color: totalCollected === totalBones ? '#ffd700' : '#aaaaaa'
    }).setOrigin(0.5)

    this.add.rectangle(cx, totalY + 20, GAME_WIDTH - 60, 1, 0x333333)

    // ── Item codex ──────────────────────────────────────────────────────────────
    const codexY = totalY + 36
    this.add.text(cx, codexY, 'ITENS DO JOGO', {
      fontSize: '16px', color: '#ffff88', fontStyle: 'bold'
    }).setOrigin(0.5)

    const items: Array<{ key: string; label: string; desc: string }> = [
      { key: KEYS.BONE,        label: 'Osso',          desc: '+10 pts' },
      { key: KEYS.GOLDEN_BONE, label: 'Osso Dourado',  desc: '+500 pts  (secreto)' },
      { key: KEYS.PETISCO,     label: 'Petisco',       desc: 'velocidade +' },
      { key: KEYS.PIPOCA,      label: 'Pipoca',        desc: 'pulo mais alto' },
      { key: KEYS.PIZZA,       label: 'Pizza',         desc: 'restaura coração' },
      { key: KEYS.CHURRASCO,   label: 'Churrasco',     desc: 'invencível 10s' },
      { key: KEYS.BOLA,        label: 'Bola',          desc: 'diversão' },
      { key: KEYS.FRISBEE,     label: 'Frisbee',       desc: 'diversão' },
      { key: KEYS.LACO,        label: 'Laço',          desc: 'absorve 1 hit' },
      { key: KEYS.COLEIRA,     label: 'Coleira',       desc: 'velocidade +' },
      { key: KEYS.CHAPEU,      label: 'Chapéu',        desc: 'estilo' },
      { key: KEYS.BANDANA,     label: 'Bandana',       desc: 'estilo' },
    ]

    const cols = 3
    const colW = (GAME_WIDTH - 80) / cols

    items.forEach((item, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const ix = 60 + col * colW
      const iy = codexY + 24 + row * 42

      this.add.image(ix + 12, iy + 12, item.key).setScale(1.4).setOrigin(0.5)
      this.add.text(ix + 28, iy, item.label, { fontSize: '12px', color: '#ffffff' })
      this.add.text(ix + 28, iy + 16, item.desc,  { fontSize: '11px', color: '#aaaaaa' })
    })

    // ── Back ────────────────────────────────────────────────────────────────────
    const backBtn = this.add.text(cx, GAME_HEIGHT - 20, '[ ESC / BACKSPACE — VOLTAR ]', {
      fontSize: '13px', color: '#ffffff'
    }).setOrigin(0.5).setInteractive()

    this.tweens.add({ targets: backBtn, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 })

    const goBack = () => { this.scene.start(KEYS.MENU) }
    const kb = this.input.keyboard!
    kb.on('keydown-BACKSPACE', goBack)
    kb.on('keydown-ESC', goBack)
    backBtn.on('pointerdown', goBack)

    this.events.once('shutdown', () => {
      kb.off('keydown-BACKSPACE', goBack)
      kb.off('keydown-ESC', goBack)
    })
  }
}
