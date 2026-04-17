import Phaser from 'phaser'
import { KEYS } from '../constants'
import { SettingsOverlay } from '../ui/SettingsOverlay'

export class PauseScene extends Phaser.Scene {
  constructor() { super(KEYS.PAUSE) }

  create(): void {
    this.add.rectangle(400, 225, 400, 300, 0x000000, 0.8)
    this.add.text(400, 130, 'PAUSADO', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 200, '← → Mover', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 230, 'ESPAÇO Pular (segurar = mais alto)', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 260, 'SHIFT Habilidade especial', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 290, 'TAB Trocar cachorra', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)

    this.add.text(400, 340, 'ESC — continuar   M — menu   S — config', {
      fontSize: '14px', color: '#ffff00',
    }).setOrigin(0.5)

    // ── Settings overlay ─────────────────────────────────────────────────
    const settingsOverlay = new SettingsOverlay(this)

    const settingsBtn = this.add.text(400, 315, '[ S — CONFIGURAÇÕES ]', {
      fontSize: '14px', color: '#cccccc',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    settingsBtn.on('pointerdown', () => settingsOverlay.show())

    // ── Keyboard handlers ────────────────────────────────────────────────
    const kb = this.input.keyboard!

    const onEsc = () => {
      if (settingsOverlay.isVisible()) { settingsOverlay.hide(); return }
      this.scene.resume(KEYS.GAME)
      this.scene.stop()
    }

    const onMenu = () => {
      if (settingsOverlay.isVisible()) return
      this.scene.stop(KEYS.GAME)
      this.scene.stop(KEYS.UI)
      this.scene.stop()
      this.scene.start(KEYS.MENU)
    }

    const onS = () => settingsOverlay.show()

    kb.on('keydown-ESC', onEsc)
    kb.on('keydown-M',   onMenu)
    kb.on('keydown-S',   onS)

    this.events.once('shutdown', () => {
      kb.off('keydown-ESC', onEsc)
      kb.off('keydown-M',   onMenu)
      kb.off('keydown-S',   onS)
    })
  }
}
