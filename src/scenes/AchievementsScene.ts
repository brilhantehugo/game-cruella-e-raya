// src/scenes/AchievementsScene.ts
import Phaser from 'phaser'
import { ACHIEVEMENTS } from '../achievements/achievements'
import { AchievementManager } from '../achievements/AchievementManager'
import { AchievementDef, AchievementCategory } from '../achievements/AchievementDef'

const GAME_WIDTH  = 800
const GAME_HEIGHT = 450
const COLS        = 2
const ROW_H       = 35
const PAD_X       = 40
const CARD_W      = (GAME_WIDTH - PAD_X * 2 - 12) / COLS
const HEADER_H    = 90

type TabFilter = 'all' | AchievementCategory

export class AchievementsScene extends Phaser.Scene {
  private _am!: AchievementManager
  private _tab: TabFilter = 'all'
  private _container!: Phaser.GameObjects.Container

  constructor() { super({ key: 'AchievementsScene' }) }

  create(): void {
    // Obter instância do AchievementManager via GameScene (ou criar temporário)
    const gs = this.scene.get('GameScene') as any
    this._am = gs?._am ?? new AchievementManager(() => {})

    this._drawBackground()
    this._drawHeader()
    this._drawTabs()
    this._drawList()
  }

  // ── Background ────────────────────────────────────────────────────────

  private _drawBackground(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x07071a)
  }

  // ── Header ────────────────────────────────────────────────────────────

  private _drawHeader(): void {
    const unlocked = this._am.getUnlocked().length
    const total    = ACHIEVEMENTS.length

    this.add.text(GAME_WIDTH / 2, 18, '🏆 CONQUISTAS', {
      fontSize: '20px', color: '#ffa040', fontStyle: 'bold',
    }).setOrigin(0.5, 0)

    this.add.text(GAME_WIDTH / 2, 42, `${unlocked} / ${total} desbloqueadas`, {
      fontSize: '11px', color: '#888888',
    }).setOrigin(0.5, 0)

    // Barra de progresso
    const barW = 200
    const barX = GAME_WIDTH / 2 - barW / 2
    this.add.rectangle(barX + barW / 2, 60, barW, 6, 0x333333).setOrigin(0.5)
    if (total > 0) {
      const fill = Math.round((unlocked / total) * barW)
      this.add.rectangle(barX + fill / 2, 60, fill, 6, 0xffa040).setOrigin(0.5)
    }

    // Botão voltar
    const back = this.add.text(16, 16, '← Voltar', {
      fontSize: '13px', color: '#ffa040',
    }).setInteractive({ useHandCursor: true })
    back.on('pointerup', () => {
      this.scene.start('MenuScene')
    })
  }

  // ── Tabs ──────────────────────────────────────────────────────────────

  private _drawTabs(): void {
    const tabs: { label: string; value: TabFilter }[] = [
      { label: 'Todos',    value: 'all' },
      { label: '🗡️ Combate', value: 'combat' },
      { label: '🦴 Colecção', value: 'collection' },
      { label: '🎯 Estilo',  value: 'style' },
      { label: '📖 Narrativa', value: 'narrative' },
    ]

    const tabW = 130
    const startX = (GAME_WIDTH - tabs.length * tabW) / 2 + tabW / 2

    tabs.forEach((tab, i) => {
      const x = startX + i * tabW
      const isActive = this._tab === tab.value
      const bg = this.add.rectangle(x, 78, tabW - 4, 18,
        isActive ? 0xffa040 : 0x222222
      ).setInteractive({ useHandCursor: true })

      const label = this.add.text(x, 78, tab.label, {
        fontSize: '9px',
        color: isActive ? '#000000' : '#888888',
      }).setOrigin(0.5)

      bg.on('pointerup', () => {
        this._tab = tab.value
        this._drawList()
        // Re-draw tabs
        this.children.list
          .filter(c => (c as any).__isTab)
          .forEach(c => c.destroy())
        this._drawTabs()
      })
      ;(bg as any).__isTab = true
      ;(label as any).__isTab = true
    })
  }

  // ── List ──────────────────────────────────────────────────────────────

  private _drawList(): void {
    if (this._container) this._container.destroy()

    const filtered = this._tab === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter(a => a.category === this._tab)

    this._container = this.add.container(0, HEADER_H + 8)

    filtered.forEach((def, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x   = PAD_X + col * (CARD_W + 12)
      const y   = row * ROW_H

      this._drawCard(def, x, y)
    })
  }

  private _drawCard(def: AchievementDef, x: number, y: number): void {
    const unlocked  = this._am.isUnlocked(def.id)
    const progress  = this._am.getProgress(def)
    const isSecret  = def.secret && !unlocked

    const bgColor   = unlocked ? 0x1a1200 : 0x111111
    const borderCol = unlocked ? 0xffa040 : 0x333333
    const alpha     = unlocked ? 1.0 : 0.6

    const bg = this.add.rectangle(x + CARD_W / 2, y + ROW_H / 2, CARD_W, ROW_H - 4, bgColor, alpha)
      .setStrokeStyle(1.5, borderCol)
    this._container.add(bg)

    // Ícone
    const iconStr = isSecret ? '❓' : def.icon
    const icon = this.add.text(x + 20, y + ROW_H / 2, iconStr, { fontSize: '20px' })
      .setOrigin(0.5).setAlpha(alpha)
    this._container.add(icon)

    // Título
    const titleStr  = isSecret ? '???' : def.title
    const titleColor = unlocked ? '#ffa040' : '#555555'
    const title = this.add.text(x + 36, y + 4, titleStr, {
      fontSize: '10px', color: titleColor, fontStyle: 'bold',
    }).setAlpha(alpha)
    this._container.add(title)

    // Descrição / progresso
    let descStr = isSecret ? 'Achievement secreto' : def.description
    if (!unlocked && progress) {
      descStr = `${def.description} · ${progress.current}/${progress.total}`
    }
    const desc = this.add.text(x + 36, y + 16, descStr, {
      fontSize: '8px', color: '#666666',
    }).setAlpha(alpha)
    this._container.add(desc)

    // Check / lock
    const statusStr = unlocked ? '✓' : '🔒'
    const statusColor = unlocked ? '#ffa040' : '#333333'
    const status = this.add.text(x + CARD_W - 8, y + ROW_H / 2, statusStr, {
      fontSize: '14px', color: statusColor,
    }).setOrigin(1, 0.5).setAlpha(alpha)
    this._container.add(status)
  }
}
