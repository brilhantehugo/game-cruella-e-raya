import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class SettingsOverlay {
  private _container: Phaser.GameObjects.Container
  private _muteBtn: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    const cx = GAME_WIDTH / 2   // 400
    const cy = GAME_HEIGHT / 2  // 225
    const w = 500, h = 320
    const px = cx - w / 2       // left edge = 150
    const py = cy - h / 2       // top edge = 65

    // 1. Background panel — blocks underlying scene clicks
    const bg = scene.add.rectangle(cx, cy, w, h, 0x000000, 0.82)
      .setStrokeStyle(1, 0x888888)
      .setInteractive()

    // 2. Title
    const title = scene.add.text(cx, py + 22, '⚙ CONFIGURAÇÕES', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    // 3. Mute toggle button
    this._muteBtn = scene.add.text(px + 20, py + 62, this._muteLabel(), {
      fontSize: '15px', color: this._muteColor(),
    }).setInteractive({ useHandCursor: true })
    this._muteBtn.on('pointerdown', () => {
      SoundManager.setMuted(!gameState.muted)
      this._muteBtn.setText(this._muteLabel())
      this._muteBtn.setColor(this._muteColor())
    })

    // 4. Separator line
    const sep = scene.add.graphics()
    sep.lineStyle(1, 0x555555, 1)
    sep.lineBetween(px + 20, py + 100, cx + w / 2 - 20, py + 100)

    // 5. Controls section title
    const ctrlTitle = scene.add.text(px + 20, py + 112, 'CONTROLES', {
      fontSize: '13px', color: '#aaaaaa',
    })

    // 6. Controls table — 6 lines
    const CONTROL_LINES = [
      '← →       Mover',
      'ESPAÇO    Pular',
      'SHIFT     Habilidade da Raya',
      'TAB       Trocar personagem',
      'ESC       Pausar / Fechar',
      'M         Silenciar música',
    ]
    const ctrlTexts = CONTROL_LINES.map((line, i) =>
      scene.add.text(px + 20, py + 130 + i * 20, line, {
        fontSize: '12px', color: '#cccccc',
      })
    )

    // 7. Close button
    const closeBtn = scene.add.text(cx, cy + h / 2 - 18, '[ ESC — FECHAR ]', {
      fontSize: '13px', color: '#aaaaff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerdown', () => this.hide())

    // Assemble container — hidden by default
    this._container = scene.add.container(0, 0, [
      bg, title, this._muteBtn, sep, ctrlTitle, ...ctrlTexts, closeBtn,
    ])
    this._container.setDepth(50).setScrollFactor(0).setVisible(false)
  }

  private _muteLabel(): string {
    return gameState.muted ? '🔇  Música: SILENCIADA' : '🔊  Música: ATIVADA'
  }

  private _muteColor(): string {
    return gameState.muted ? '#ff6666' : '#88ffaa'
  }

  /** Refreshes mute button text, then shows the overlay. */
  show(): void {
    this._muteBtn.setText(this._muteLabel())
    this._muteBtn.setColor(this._muteColor())
    this._container.setVisible(true)
  }

  hide(): void { this._container.setVisible(false) }

  isVisible(): boolean { return this._container.visible }
}
