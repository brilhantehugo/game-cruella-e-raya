import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { profileManager, PlayerProfile } from '../storage/ProfileManager'
import { DogType } from '../GameState'
import { SoundManager } from '../audio/SoundManager'

export class ProfileSelectScene extends Phaser.Scene {
  private _profiles: PlayerProfile[] = []
  private _selectedSlot: number = -1
  private _creatingNew: boolean = false
  private _pendingDog: DogType = 'raya'
  private _nameInput: string = ''
  private _nameText!: Phaser.GameObjects.Text
  private _instructionText!: Phaser.GameObjects.Text

  constructor() { super(KEYS.PROFILE_SELECT) }

  create(): void {
    this._profiles = profileManager.getAll()
    this._creatingNew = false
    this._nameInput = ''

    this.cameras.main.setBackgroundColor('#1a1a2e')
    const cx = GAME_WIDTH / 2

    // Título
    this.add.text(cx, 48, '🐾 ESCOLHA SEU PERFIL', {
      fontSize: '28px', color: '#ffdd88', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(cx, 82, 'Seus dados são salvos automaticamente', {
      fontSize: '12px', color: '#666688',
    }).setOrigin(0.5)

    this._renderSlots()
    this._setupKeyboard()
  }

  private _renderSlots(): void {
    // Limpa objetos anteriores (exceto câmera e fundo)
    this.children.list
      .filter(o => o.getData('slot') === true)
      .forEach(o => o.destroy())

    const slots = 3
    const slotW = 320, slotH = 72
    const startY = 130

    for (let i = 0; i < slots; i++) {
      const profile = this._profiles[i]
      const y = startY + i * (slotH + 12)
      const x = GAME_WIDTH / 2 - slotW / 2

      const bg = this.add.graphics().setData('slot', true)
      if (profile) {
        const isActive = profileManager.getActive()?.id === profile.id
        bg.fillStyle(isActive ? 0x1a3a5a : 0x16213e)
        bg.lineStyle(2, isActive ? 0x0a84ff : 0x2a3a5a)
      } else {
        bg.fillStyle(0x0d1420)
        bg.lineStyle(1, 0x2a3a5a, 0.5)
      }
      bg.fillRoundedRect(x, y, slotW, slotH, 10)
      bg.strokeRoundedRect(x, y, slotW, slotH, 10)

      if (profile) {
        // Dog icon
        const dogEmoji = profile.dog === 'raya' ? '🐕' : '🐩'
        this.add.text(x + 20, y + slotH / 2, dogEmoji, { fontSize: '28px' })
          .setOrigin(0, 0.5).setData('slot', true)

        // Name + info
        this.add.text(x + 68, y + 18, profile.name, {
          fontSize: '18px', color: '#e0e8ff', fontStyle: 'bold',
        }).setData('slot', true)
        const levelCount = Object.values(profile.levels).filter(l => l.completed).length
        this.add.text(x + 68, y + 40, `${levelCount} fases · ${profile.totalScore} pts`, {
          fontSize: '12px', color: '#6070a0',
        }).setData('slot', true)

        // Active badge
        if (profileManager.getActive()?.id === profile.id) {
          this.add.text(x + slotW - 12, y + 12, 'ativo', {
            fontSize: '10px', color: '#6ab0ff',
            backgroundColor: '#0a2040', padding: { x: 6, y: 2 },
          }).setOrigin(1, 0).setData('slot', true)
        }

        // Delete button (X)
        const delBtn = this.add.text(x + slotW - 12, y + slotH - 14, '✕', {
          fontSize: '14px', color: '#664444',
        }).setOrigin(1, 1).setInteractive().setData('slot', true)
        delBtn.on('pointerover', () => delBtn.setColor('#ff4444'))
        delBtn.on('pointerout',  () => delBtn.setColor('#664444'))
        delBtn.on('pointerdown', () => this._confirmDelete(profile))

        // Clique no slot seleciona
        const hitArea = this.add.rectangle(x, y, slotW - 32, slotH, 0, 0)
          .setOrigin(0).setInteractive().setData('slot', true)
        hitArea.on('pointerdown', () => this._selectProfile(profile.id))
        hitArea.on('pointerover', () => bg.lineStyle(2, 0x4a90d9).strokeRoundedRect(x, y, slotW, slotH, 10))
        hitArea.on('pointerout',  () => {
          const isActive = profileManager.getActive()?.id === profile.id
          bg.lineStyle(2, isActive ? 0x0a84ff : 0x2a3a5a)
          bg.strokeRoundedRect(x, y, slotW, slotH, 10)
        })
      } else {
        // Slot vazio — botão de criar
        const newBtn = this.add.text(GAME_WIDTH / 2, y + slotH / 2, '＋  Novo Perfil', {
          fontSize: '16px', color: '#4a6a9a',
        }).setOrigin(0.5).setInteractive().setData('slot', true)
        newBtn.on('pointerover', () => newBtn.setColor('#80aaff'))
        newBtn.on('pointerout',  () => newBtn.setColor('#4a6a9a'))
        newBtn.on('pointerdown', () => this._startCreating())
      }
    }

    // Instrução / formulário de criação
    this._instructionText = this.add.text(GAME_WIDTH / 2, 360, 'Clique num perfil para jogar', {
      fontSize: '13px', color: '#555577',
    }).setOrigin(0.5).setData('slot', true)
  }

  private _selectProfile(id: string): void {
    profileManager.setActive(id)
    SoundManager.play('checkpoint')
    this.scene.start(KEYS.MENU)
  }

  private _startCreating(): void {
    this._creatingNew = true
    this._nameInput = ''
    this._pendingDog = 'raya'
    this._showCreateForm()
  }

  private _showCreateForm(): void {
    // Remove slots e exibe formulário
    this.children.list
      .filter(o => o.getData('slot') === true)
      .forEach(o => o.destroy())

    const cx = GAME_WIDTH / 2
    this.add.text(cx, 130, 'Nome do Jogador:', {
      fontSize: '16px', color: '#aaaacc',
    }).setOrigin(0.5).setData('slot', true)

    // Background do campo de texto
    const inputBg = this.add.graphics().setData('slot', true)
    inputBg.fillStyle(0x0d1929)
    inputBg.lineStyle(2, 0x0a84ff)
    inputBg.fillRoundedRect(cx - 130, 148, 260, 38, 8)
    inputBg.strokeRoundedRect(cx - 130, 148, 260, 38, 8)

    this._nameText = this.add.text(cx, 167, '_', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setData('slot', true)

    this.add.text(cx, 210, 'Escolha sua cachorra:', {
      fontSize: '14px', color: '#aaaacc',
    }).setOrigin(0.5).setData('slot', true)

    // Botões de cachorra
    const rayaBtn = this.add.text(cx - 70, 240, '🐕 Raya', {
      fontSize: '16px', color: this._pendingDog === 'raya' ? '#80c8ff' : '#4a6a9a',
      backgroundColor: this._pendingDog === 'raya' ? '#0a2a4a' : undefined,
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setInteractive().setData('slot', true)

    const cruellaBtn = this.add.text(cx + 70, 240, '🐩 Cruella', {
      fontSize: '16px', color: this._pendingDog === 'cruella' ? '#80c8ff' : '#4a6a9a',
      backgroundColor: this._pendingDog === 'cruella' ? '#0a2a4a' : undefined,
      padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setInteractive().setData('slot', true)

    rayaBtn.on('pointerdown', () => {
      this._pendingDog = 'raya'
      this._showCreateForm()
    })
    cruellaBtn.on('pointerdown', () => {
      this._pendingDog = 'cruella'
      this._showCreateForm()
    })

    const confirmBtn = this.add.text(cx, 295, '[ ENTER — Criar Perfil ]', {
      fontSize: '16px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive().setData('slot', true)
    this.tweens.add({ targets: confirmBtn, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 })
    confirmBtn.on('pointerdown', () => this._confirmCreate())

    const cancelBtn = this.add.text(cx, 330, 'Cancelar', {
      fontSize: '13px', color: '#555566',
    }).setOrigin(0.5).setInteractive().setData('slot', true)
    cancelBtn.on('pointerdown', () => {
      this._creatingNew = false
      this._renderSlots()
    })
  }

  private _confirmCreate(): void {
    const name = this._nameInput.trim() || 'Jogador'
    try {
      profileManager.create(name, this._pendingDog)
      this.scene.start(KEYS.MENU)
    } catch (e) {
      // limite atingido — não deveria acontecer se UI estiver correta
    }
  }

  private _confirmDelete(profile: { id: string; name: string }): void {
    // Confirmação simples via texto
    const cx = GAME_WIDTH / 2
    const overlay = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setOrigin(0).setDepth(10)
    this.add.text(cx, 180, `Excluir "${profile.name}"?`, {
      fontSize: '20px', color: '#ff8888', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11)
    this.add.text(cx, 215, 'Esta ação não pode ser desfeita', {
      fontSize: '12px', color: '#886666',
    }).setOrigin(0.5).setDepth(11)

    const yesBtn = this.add.text(cx - 60, 255, '[ S — Excluir ]', {
      fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11).setInteractive()

    const noBtn = this.add.text(cx + 60, 255, '[ N — Cancelar ]', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(11).setInteractive()

    const confirmTxt = this.add.text(cx, 180, '', {}).setDepth(11) // placeholder

    const kb = this.input.keyboard!
    let closed = false
    const doCleanup = () => {
      if (closed) return
      closed = true
      overlay.destroy()
      yesBtn.destroy()
      noBtn.destroy()
      confirmTxt.destroy()
      kb.off('keydown-S', onDelete)
      kb.off('keydown-N', doCleanup)
    }
    const onDelete = () => {
      doCleanup()
      profileManager.delete(profile.id)
      this._profiles = profileManager.getAll()
      this._renderSlots()
    }
    kb.once('keydown-S', onDelete)
    kb.once('keydown-N', doCleanup)
    yesBtn.on('pointerdown', onDelete)
    noBtn.on('pointerdown', doCleanup)
  }

  private _setupKeyboard(): void {
    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => {
      if (!this._creatingNew) return

      if (ev.key === 'Backspace') {
        this._nameInput = this._nameInput.slice(0, -1)
      } else if (ev.key === 'Enter') {
        this._confirmCreate()
        return
      } else if (ev.key.length === 1 && this._nameInput.length < 16) {
        this._nameInput += ev.key
      }

      if (this._nameText) {
        this._nameText.setText((this._nameInput || '') + '_')
      }
    })
  }
}
