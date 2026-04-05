import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { SoundManager } from '../audio/SoundManager'
import { gameState } from '../GameState'

export class HowToPlayScene extends Phaser.Scene {
  private _mKey!: Phaser.Input.Keyboard.Key
  constructor() { super(KEYS.HOW_TO_PLAY) }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    const cx = GAME_WIDTH / 2

    // ── Faint starfield ──────────────────────────────────────────────────
    const starGfx = this.add.graphics()
    for (let i = 0; i < 60; i++) {
      const a = Phaser.Math.FloatBetween(0.05, 0.2)
      starGfx.fillStyle(0xffffff, a)
      starGfx.fillCircle(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        Phaser.Math.FloatBetween(0.5, 1.5)
      )
    }

    // ── Corner brackets ──────────────────────────────────────────────────
    const frame = this.add.graphics()
    frame.lineStyle(2, 0xff6b6b, 0.4)
    const bx = 10, by = 10, blen = 22
    frame.strokePoints([{ x: bx + blen, y: by }, { x: bx, y: by }, { x: bx, y: by + blen }], false)
    frame.strokePoints([{ x: GAME_WIDTH - bx - blen, y: by }, { x: GAME_WIDTH - bx, y: by }, { x: GAME_WIDTH - bx, y: by + blen }], false)
    frame.strokePoints([{ x: bx, y: GAME_HEIGHT - by - blen }, { x: bx, y: GAME_HEIGHT - by }, { x: bx + blen, y: GAME_HEIGHT - by }], false)
    frame.strokePoints([{ x: GAME_WIDTH - bx, y: GAME_HEIGHT - by - blen }, { x: GAME_WIDTH - bx, y: GAME_HEIGHT - by }, { x: GAME_WIDTH - bx - blen, y: GAME_HEIGHT - by }], false)

    // ── Content helpers ──────────────────────────────────────────────────
    let y = 26

    const title = (text: string) => {
      this.add.text(cx, y, text, {
        fontSize: '24px', color: '#ff6b6b', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5)
      y += 32
    }

    const rule = () => {
      const r = this.add.graphics()
      r.lineStyle(1, 0xff6b6b, 0.2)
      r.strokeLineShape(new Phaser.Geom.Line(40, y + 2, GAME_WIDTH - 40, y + 2))
      y += 10
    }

    const section = (icon: string, text: string) => {
      this.add.text(cx - 200, y, icon, { fontSize: '14px' })
      this.add.text(cx - 174, y, text, {
        fontSize: '13px', color: '#ffff88', fontStyle: 'bold',
      })
      y += 20
    }

    const line = (text: string, color = '#cccccc', indent = 0) => {
      this.add.text(cx - 200 + indent, y, text, { fontSize: '12px', color })
      y += 16
    }

    const gap = (n = 6) => { y += n }

    // ── Layout ───────────────────────────────────────────────────────────
    title('📖  COMO JOGAR')
    rule()

    section('🎮', 'CONTROLES')
    line('← →     Mover           ESPAÇO  Pular')
    line('SHIFT   Habilidade       TAB     Trocar cachorra (CD: 1.5s)')
    line('ESC     Pausar           M       Silenciar música')
    gap()
    rule()

    section('🐕', 'RAYA  [ VELOCIDADE ]', )
    line('Pulo duplo — pressione ESPAÇO no ar', '#ffaaaa', 12)
    line('Dash horizontal (SHIFT) — atravessa e dá dano a inimigos', '#ffaaaa', 12)
    line('Combo: Dash → TAB → impulso automático de Cruella!', '#ff8866', 12)
    gap()

    section('🐩', 'CRUELLA  [ CONTROLE ]')
    line('Latido (SHIFT) — atordoa inimigos em raio próximo', '#aaaaff', 12)
    line('Intimidação passiva — inimigos fogem ao se aproximar', '#aaaaff', 12)
    line('Stun visual: inimigos ficam amarelos quando stunados', '#8888ff', 12)
    gap()
    rule()

    section('🦴', 'ITENS')
    line('Osso +10 pts    Osso Dourado +500 pts  (3 por fase, secretos)')
    line('Petisco: velocidade +    Pipoca: pulo mais alto')
    line('Churrasco: invencível 10s    Pizza: restaura coração')
    line('Laço: absorve 1 hit    Coleira / Chapéu / Bandana: estilo')
    gap(4)
    rule()

    section('⭐', 'AVALIAÇÃO POR FASE')
    line('★☆☆  Completou a fase')
    line('★★☆  Pontuação ≥ 200')
    line('★★★  Pontuação ≥ 500')

    // ── Back button ──────────────────────────────────────────────────────
    const backBtn = this.add.text(cx, GAME_HEIGHT - 16, '[ ESC / BACKSPACE — VOLTAR ]', {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: backBtn, alpha: 0.35, duration: 750, yoyo: true, repeat: -1 })

    const goBack = () => { this.scene.start(KEYS.MENU) }
    const kb = this.input.keyboard!
    kb.on('keydown-BACKSPACE', goBack)
    kb.on('keydown-ESC', goBack)
    backBtn.on('pointerdown', goBack)

    this.events.once('shutdown', () => {
      kb.off('keydown-BACKSPACE', goBack)
      kb.off('keydown-ESC', goBack)
      SoundManager.stopBgm()
    })

    // ── Continue menu music ──────────────────────────────────────────────
    SoundManager.playProceduralBgm('menu')
    this._mKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M)
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this._mKey)) {
      SoundManager.setMuted(!gameState.muted)
    }
  }
}
