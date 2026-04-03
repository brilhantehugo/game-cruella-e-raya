import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super(KEYS.HOW_TO_PLAY) }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1a')

    const cx = GAME_WIDTH / 2
    let y = 30

    const title = (text: string) => {
      this.add.text(cx, y, text, { fontSize: '26px', color: '#ff6b6b', fontStyle: 'bold' }).setOrigin(0.5)
      y += 36
    }
    const section = (text: string) => {
      this.add.text(cx, y, text, { fontSize: '15px', color: '#ffff88', fontStyle: 'bold' }).setOrigin(0.5)
      y += 22
    }
    const line = (text: string, color = '#dddddd') => {
      this.add.text(cx, y, text, { fontSize: '13px', color }).setOrigin(0.5)
      y += 18
    }
    const gap = (n = 8) => { y += n }
    const rule = () => {
      this.add.rectangle(cx, y + 4, GAME_WIDTH - 60, 1, 0x444444)
      y += 12
    }

    title('COMO JOGAR')
    rule()

    section('CONTROLES')
    line('← →     Mover')
    line('ESPAÇO  Pular')
    line('SHIFT   Habilidade especial')
    line('TAB     Trocar cachorra  (cooldown 1.5s)')
    line('ESC     Pausar')
    gap()
    rule()

    section('RAYA')
    line('Pulo duplo', '#ffaaaa')
    line('Dash horizontal (SHIFT) — atravessa inimigos', '#ffaaaa')
    gap()
    section('CRUELLA')
    line('Latido (SHIFT) — atordoa inimigos próximos', '#aaaaff')
    line('Intimidação passiva — inimigos fogem ao se aproximar', '#aaaaff')
    gap()
    rule()

    section('ITENS')
    line('Osso           +10 pts')
    line('Osso Dourado   +500 pts  (3 por fase, secretos)')
    line('Petisco        velocidade +')
    line('Pipoca         pulo mais alto')
    line('Churrasco      invencível 10s')
    line('Pizza          restaura coração')
    gap(12)
    rule()

    const backBtn = this.add.text(cx, GAME_HEIGHT - 22, '[ ESC / BACKSPACE — VOLTAR ]', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
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
