import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class SettingsOverlay {
  private _container: Phaser.GameObjects.Container
  private _musicBtn: Phaser.GameObjects.Text
  private _sfxBtn: Phaser.GameObjects.Text
  private _reduceBtn: Phaser.GameObjects.Text

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

    // 3. Music toggle
    this._musicBtn = scene.add.text(px + 20, py + 62, this._musicLabel(), {
      fontSize: '15px', color: this._musicColor(),
    }).setInteractive({ useHandCursor: true })
    this._musicBtn.on('pointerdown', () => {
      SoundManager.setMusicMuted(!gameState.musicMuted)
      this._musicBtn.setText(this._musicLabel())
      this._musicBtn.setColor(this._musicColor())
    })

    // 3b. SFX toggle
    this._sfxBtn = scene.add.text(px + 20, py + 86, this._sfxLabel(), {
      fontSize: '15px', color: this._sfxColor(),
    }).setInteractive({ useHandCursor: true })
    this._sfxBtn.on('pointerdown', () => {
      SoundManager.setSfxMuted(!gameState.sfxMuted)
      this._sfxBtn.setText(this._sfxLabel())
      this._sfxBtn.setColor(this._sfxColor())
    })

    // 3c. Reduce-motion toggle
    this._reduceBtn = scene.add.text(px + 20, py + 110, this._reduceLabel(), {
      fontSize: '15px', color: this._reduceColor(),
    }).setInteractive({ useHandCursor: true })
    this._reduceBtn.on('pointerdown', () => {
      gameState.reducedMotion = !gameState.reducedMotion
      this._reduceBtn.setText(this._reduceLabel())
      this._reduceBtn.setColor(this._reduceColor())
    })

    // 4. Separator line
    const sep = scene.add.graphics()
    sep.lineStyle(1, 0x555555, 1)
    sep.lineBetween(px + 20, py + 150, cx + w / 2 - 20, py + 150)

    // 5. Controls section title
    const ctrlTitle = scene.add.text(px + 20, py + 162, 'CONTROLES', {
      fontSize: '13px', color: '#aaaaaa',
    })

    // 6. Controls table — 6 lines
    const CONTROL_LINES = [
      '← →       Mover',
      'ESPAÇO    Pular',
      'SHIFT     Habilidade da Raya',
      'TAB       Trocar personagem',
      'ESC       Pausar / Fechar',
      'M         Silenciar tudo',
    ]
    const ctrlTexts = CONTROL_LINES.map((line, i) =>
      scene.add.text(px + 20, py + 180 + i * 20, line, {
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
      bg, title, this._musicBtn, this._sfxBtn, this._reduceBtn, sep, ctrlTitle, ...ctrlTexts, closeBtn,
    ])
    // Note: setScrollFactor(0) on a Container is a no-op in Phaser 3 — it does not
    // propagate to children. Both host scenes (MenuScene, PauseScene) use fixed cameras,
    // so this is safe. If reused in a scrolling scene, set scrollFactor on each child.
    this._container.setDepth(50).setScrollFactor(0).setVisible(false)
  }

  private _musicLabel(): string {
    return gameState.musicMuted ? '🔇  Música: SILENCIADA' : '🎵  Música: ATIVADA'
  }

  private _musicColor(): string {
    return gameState.musicMuted ? '#ff6666' : '#88ffaa'
  }

  private _sfxLabel(): string {
    return gameState.sfxMuted ? '🔇  Efeitos: SILENCIADOS' : '🔊  Efeitos: ATIVADOS'
  }

  private _sfxColor(): string {
    return gameState.sfxMuted ? '#ff6666' : '#88ffaa'
  }

  private _reduceLabel(): string {
    return gameState.reducedMotion ? '♿  Reduzir movimento: ATIVADO' : '♿  Reduzir movimento: DESLIGADO'
  }

  private _reduceColor(): string {
    return gameState.reducedMotion ? '#88ffaa' : '#888888'
  }

  /** Refreshes mute button text, then shows the overlay. */
  show(): void {
    this._musicBtn.setText(this._musicLabel())
    this._musicBtn.setColor(this._musicColor())
    this._sfxBtn.setText(this._sfxLabel())
    this._sfxBtn.setColor(this._sfxColor())
    this._reduceBtn.setText(this._reduceLabel())
    this._reduceBtn.setColor(this._reduceColor())
    this._container.setVisible(true)
  }

  hide(): void { this._container.setVisible(false) }

  isVisible(): boolean { return this._container.visible }
}
