import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'

const CRAWL_TEXT = [
  'Em uma tarde ensolarada no bairro...',
  '',
  'Raya, a maior e mais corajosa das duas,',
  'convenceu Cruella de que era absolutamente',
  'necessário investigar o outro lado da rua.',
  '',
  'Cruella, a menor e mais cética,',
  'latiu três vezes em sinal de protesto.',
  'Mas foi mesmo assim.',
  '',
  'O portão estava aberto.',
  'O mundo estava ali.',
  '',
  'Havia gatos que as olhavam com desprezo.',
  'Pombos que não ligavam para ninguém.',
  'Ratos que corriam rápido demais.',
  'E um Dono Nervoso que gritava seus nomes',
  'em cada esquina.',
  '',
  'No fim da rua, dizem os mais velhos,',
  'mora Seu Bigodes — um gato enorme e ranzinza',
  'que guarda o maior depósito de lixo do bairro',
  'como se fosse um tesouro sagrado.',
  '',
  'Ninguém voltou de lá para contar a história.',
  '',
  'Até hoje.',
  '',
  'Boa sorte, pequenas.',
  'Vocês vão precisar.',
]

export class IntroCrawlScene extends Phaser.Scene {
  private _started = false

  constructor() { super(KEYS.INTRO_CRAWL) }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000')

    const container = this.add.container(GAME_WIDTH / 2, 0)

    const lineHeight = 26
    const totalLines = CRAWL_TEXT.length

    CRAWL_TEXT.forEach((txt, i) => {
      const progress = i / (totalLines - 1)
      const fontSize = Math.round(14 + progress * 8)
      const alpha = 0.6 + progress * 0.4

      const t = this.add.text(0, i * lineHeight, txt, {
        fontSize: `${fontSize}px`,
        color: '#ffe81f',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0).setAlpha(alpha)
      container.add(t)
    })

    const totalHeight = totalLines * lineHeight
    container.setY(GAME_HEIGHT + 60)

    this.tweens.add({
      targets: container,
      y: -(totalHeight + 60),
      duration: 22000,
      ease: 'Linear',
      onComplete: () => this._start(),
    })

    const kb = this.input.keyboard!
    kb.once('keydown-ENTER', () => this._start())
    kb.once('keydown-SPACE',  () => this._start())
  }

  private _start(): void {
    if (this._started) return
    this._started = true
    this.tweens.killAll()
    this.scene.start(KEYS.CHARACTER_SELECT)
  }
}
