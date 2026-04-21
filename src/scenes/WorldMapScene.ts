import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'
import { profileManager } from '../storage/ProfileManager'
import { SoundManager } from '../audio/SoundManager'

interface MapNode {
  levelId: string
  label:   string
  world:   string
  x:       number
  y:       number
}

// Definição dos nós do mapa em ordem de mundo (6 fases + 1 boss por mundo)
// x positions: 20, 96, 172, 248, 324, 400  (gap 76px, circle diameter 40px)
const MAP_NODES: MapNode[] = [
  // World 0 — Apartamento
  { levelId: '0-1',    label: 'Sala',      world: 'Mundo 0 — Apartamento', x: 20,  y: 0 },
  { levelId: '0-2',    label: 'Corredor',  world: 'Mundo 0 — Apartamento', x: 96,  y: 0 },
  { levelId: '0-3',    label: 'Estacion.', world: 'Mundo 0 — Apartamento', x: 172, y: 0 },
  { levelId: '0-4',    label: 'Est.N1',    world: 'Mundo 0 — Apartamento', x: 248, y: 0 },
  { levelId: '0-5',    label: 'Est.N2',    world: 'Mundo 0 — Apartamento', x: 324, y: 0 },
  { levelId: '0-boss', label: 'Zelador',   world: 'Mundo 0 — Apartamento', x: 400, y: 0 },
  // World 1 — Cidade
  { levelId: '1-1',    label: 'Rua',       world: 'Mundo 1 — Cidade',      x: 20,  y: 0 },
  { levelId: '1-2',    label: 'Beco',      world: 'Mundo 1 — Cidade',      x: 96,  y: 0 },
  { levelId: '1-3',    label: 'Praça',     world: 'Mundo 1 — Cidade',      x: 172, y: 0 },
  { levelId: '1-4',    label: 'Parque',    world: 'Mundo 1 — Cidade',      x: 248, y: 0 },
  { levelId: '1-5',    label: 'Mercado',   world: 'Mundo 1 — Cidade',      x: 324, y: 0 },
  { levelId: '1-boss', label: 'Bigodes',   world: 'Mundo 1 — Cidade',      x: 400, y: 0 },
  // World 2 — Exterior do Prédio
  { levelId: '2-1',    label: 'Passeio',   world: 'Mundo 2 — Exterior',    x: 20,  y: 0 },
  { levelId: '2-2',    label: 'Pátio',     world: 'Mundo 2 — Exterior',    x: 96,  y: 0 },
  { levelId: '2-3',    label: 'Garagem',   world: 'Mundo 2 — Exterior',    x: 172, y: 0 },
  { levelId: '2-4',    label: 'Escadas',   world: 'Mundo 2 — Exterior',    x: 248, y: 0 },
  { levelId: '2-5',    label: 'Varandas',  world: 'Mundo 2 — Exterior',    x: 324, y: 0 },
  { levelId: '2-boss', label: 'Drone',     world: 'Mundo 2 — Exterior',    x: 400, y: 0 },
  // World 3 — Rua de Noite
  { levelId: '3-1',    label: 'Passeio',  world: 'Mundo 3 — Rua de Noite', x: 20,  y: 0 },
  { levelId: '3-2',    label: 'Parque',   world: 'Mundo 3 — Rua de Noite', x: 96,  y: 0 },
  { levelId: '3-3',    label: 'Travessa', world: 'Mundo 3 — Rua de Noite', x: 172, y: 0 },
  { levelId: '3-4',    label: 'Mercado',  world: 'Mundo 3 — Rua de Noite', x: 248, y: 0 },
  { levelId: '3-5',    label: 'Regresso', world: 'Mundo 3 — Rua de Noite', x: 324, y: 0 },
  { levelId: '3-boss', label: 'Moto',     world: 'Mundo 3 — Rua de Noite', x: 400, y: 0 },
]

const MEDAL_EMOJI: Record<string, string> = {
  gold: '🥇', silver: '🥈', bronze: '🥉',
}

export class WorldMapScene extends Phaser.Scene {
  private _upgradePanel: Phaser.GameObjects.Container | null = null

  constructor() { super(KEYS.WORLD_MAP) }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e')
    const profile = profileManager.getActive()

    // ── Header ──────────────────────────────────────────────────────────
    const playerName = profile?.name ?? '—'
    const totalScore = profile?.totalScore ?? 0

    this.add.text(GAME_WIDTH / 2, 24, 'MAPA DO MUNDO', {
      fontSize: '22px', color: '#ffdd88', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5)

    this.add.text(16, 14, `🐾 ${playerName}`, {
      fontSize: '13px', color: '#80aaff',
    })
    this.add.text(GAME_WIDTH - 16, 14, `${totalScore} pts`, {
      fontSize: '13px', color: '#ffdd88',
    }).setOrigin(1, 0)

    // ── Separador ───────────────────────────────────────────────────────
    const line = this.add.graphics()
    line.lineStyle(1, 0x2a3a5a)
    line.lineBetween(20, 44, GAME_WIDTH - 20, 44)

    // ── Mundos ──────────────────────────────────────────────────────────
    const worlds = ['Mundo 0 — Apartamento', 'Mundo 1 — Cidade', 'Mundo 2 — Exterior', 'Mundo 3 — Rua de Noite']
    const worldStartY = [58, 160, 262, 364]

    worlds.forEach((worldName, wi) => {
      const baseY = worldStartY[wi]
      const nodes = MAP_NODES.filter(n => n.world === worldName)

      // Label do mundo
      this.add.text(24, baseY - 18, worldName, {
        fontSize: '11px', color: '#4a6a8a',
        fontStyle: 'italic',
      })

      // Trilha (linha conectora)
      const trail = this.add.graphics()
      nodes.forEach((node, ni) => {
        if (ni === 0) return
        const prev = nodes[ni - 1]
        const unlocked = profileManager.isUnlocked(node.levelId)
        const prevUnlocked = profileManager.isUnlocked(prev.levelId)
        trail.lineStyle(3, (unlocked && prevUnlocked) ? 0x3a5a8a : 0x2a3040)
        trail.lineBetween(prev.x + 40, baseY + 20, node.x, baseY + 20)
      })

      // Nós
      nodes.forEach(node => {
        const unlocked = profileManager.isUnlocked(node.levelId)
        const medal    = profileManager.getMedal(node.levelId)
        const isCurrent = profile?.currentLevel === node.levelId
        const completed = profile?.levels[node.levelId]?.completed ?? false

        const nx = node.x
        const ny = baseY

        // Círculo do nó
        const circle = this.add.graphics()
        if (!unlocked) {
          circle.fillStyle(0x0d1929).lineStyle(2, 0x2a3040)
        } else if (completed) {
          circle.fillStyle(0x1a3030).lineStyle(2, medal === 'gold' ? 0xf0c040 : medal === 'silver' ? 0xa0b8d0 : 0xc08040)
        } else {
          circle.fillStyle(0x0a2040).lineStyle(2, 0x0a84ff)
        }
        circle.fillCircle(nx + 20, ny + 20, 20)
        circle.strokeCircle(nx + 20, ny + 20, 20)

        // Pulsação no nó atual
        if (isCurrent && unlocked) {
          this.tweens.add({
            targets: circle,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }

        // Texto dentro do nó
        const nodeLabel = !unlocked ? '🔒' : (medal ? MEDAL_EMOJI[medal] : node.levelId)
        this.add.text(nx + 20, ny + 20, nodeLabel, {
          fontSize: '11px', color: unlocked ? '#e0e8ff' : '#2a3a4a',
        }).setOrigin(0.5)

        // Label abaixo
        this.add.text(nx + 20, ny + 46, node.label, {
          fontSize: '10px', color: unlocked ? '#8898b8' : '#2a3a4a',
        }).setOrigin(0.5)

        // Clique para iniciar fase
        if (unlocked) {
          const hitArea = this.add.circle(nx + 20, ny + 20, 22, 0, 0).setInteractive()
          hitArea.on('pointerover', () => {
            this.input.setDefaultCursor('pointer')
            circle.setAlpha(0.7)
          })
          hitArea.on('pointerout', () => {
            this.input.setDefaultCursor('default')
            circle.setAlpha(1)
          })
          hitArea.on('pointerdown', () => this._startLevel(node.levelId))
        }
      })
    })

    // ── Botão Upgrades ──────────────────────────────────────────────────
    const upgradeBtn = this.add.text(16, GAME_HEIGHT - 14, '🛒 Upgrades', {
      fontSize: '11px', color: '#5577cc',
    }).setOrigin(0, 1).setInteractive()
    upgradeBtn.on('pointerover', () => upgradeBtn.setColor('#88aaff'))
    upgradeBtn.on('pointerout',  () => upgradeBtn.setColor('#5577cc'))
    upgradeBtn.on('pointerdown', () => this._renderUpgradePanel())

    // ── Instruções ──────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'Clique numa fase para jogar  |  ENTER — iniciar atual  |  ESC — menu', {
      fontSize: '11px', color: '#333355',
    }).setOrigin(0.5)

    // ── Tecla ESC ───────────────────────────────────────────────────────
    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start(KEYS.MENU)
    })

    // ── Tecla ENTER — inicia o level atual do perfil ─────────────────────
    this.input.keyboard!.once('keydown-ENTER', () => {
      const profile = profileManager.getActive()
      const levelId = profile?.currentLevel
      if (levelId && profileManager.isUnlocked(levelId)) {
        this._startLevel(levelId)
      }
    })

    // ── Trocar perfil link ───────────────────────────────────────────────
    const switchBtn = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 14, 'Trocar perfil', {
      fontSize: '10px', color: '#333366',
    }).setOrigin(1, 1).setInteractive()
    switchBtn.on('pointerover', () => switchBtn.setColor('#6666aa'))
    switchBtn.on('pointerout',  () => switchBtn.setColor('#333366'))
    switchBtn.on('pointerdown', () => this.scene.start(KEYS.PROFILE_SELECT))
  }

  private _renderUpgradePanel(): void {
    if (this._upgradePanel) {
      this._upgradePanel.destroy()
      this._upgradePanel = null
      return
    }

    const cx = GAME_WIDTH / 2
    const cy = GAME_HEIGHT / 2
    const W = 680, H = 330

    const container = this.add.container(cx, cy)
    this._upgradePanel = container

    // Fundo semi-transparente
    const bg = this.add.graphics()
    bg.fillStyle(0x050510, 0.94)
    bg.fillRect(-W / 2, -H / 2, W, H)
    bg.lineStyle(2, 0x3a5a8a)
    bg.strokeRect(-W / 2, -H / 2, W, H)
    container.add(bg)

    // Título
    container.add(this.add.text(0, -H / 2 + 20, '⚡ Upgrades Permanentes', {
      fontSize: '16px', color: '#ffdd88', fontStyle: 'bold',
    }).setOrigin(0.5))

    // Bones disponíveis
    const available = profileManager.getAvailableBones()
    container.add(this.add.text(0, -H / 2 + 44, `🦴 Disponíveis: ${available}`, {
      fontSize: '12px', color: '#aaccff',
    }).setOrigin(0.5))

    // Definição dos 5 upgrades
    const defs = [
      { key: 'heart_plus', name: '❤️ Coração Extra',  effect: 'HP máx 3→4',              cost: 8 },
      { key: 'dash_fast',  name: '⚡ Dash Relâmpago', effect: 'Cooldown dash 800→500ms',  cost: 6 },
      { key: 'bark_wide',  name: '🔊 Latido Amplo',   effect: 'Raio bark ×1.5',           cost: 6 },
      { key: 'swap_fast',  name: '🔄 Troca Rápida',   effect: 'Cooldown troca 1500→900ms', cost: 5 },
      { key: 'bone_radar', name: '🦴 Faro Apurado',   effect: 'Seta → bone mais próximo', cost: 7 },
    ] as const

    const cardW = 124
    const startX = -(defs.length * cardW) / 2 + cardW / 2
    const cardCenterY = 28

    defs.forEach((def, i) => {
      const acquired  = profileManager.hasUpgrade(def.key)
      const canAfford = !acquired && available >= def.cost
      const cx2 = startX + i * cardW
      const top = cardCenterY - 100

      // Fundo do card
      const card = this.add.graphics()
      card.fillStyle(acquired ? 0x0a3020 : 0x0a1a30, 0.9)
      card.lineStyle(1, acquired ? 0x44cc88 : canAfford ? 0x2255aa : 0x1a2a3a)
      card.fillRect(cx2 - cardW / 2 + 4, top, cardW - 8, 200)
      card.strokeRect(cx2 - cardW / 2 + 4, top, cardW - 8, 200)
      container.add(card)

      container.add(this.add.text(cx2, top + 18, def.name, {
        fontSize: '10px', color: '#e0e8ff',
        wordWrap: { width: cardW - 16 }, align: 'center',
      }).setOrigin(0.5))

      container.add(this.add.text(cx2, top + 56, def.effect, {
        fontSize: '10px', color: '#7898b8',
        wordWrap: { width: cardW - 16 }, align: 'center',
      }).setOrigin(0.5))

      container.add(this.add.text(cx2, top + 92, `🦴 ${def.cost}`, {
        fontSize: '13px', color: '#ffdd88',
      }).setOrigin(0.5))

      const btnLabel = acquired
        ? '✓ ADQUIRIDO'
        : canAfford
          ? 'COMPRAR'
          : `Faltam ${def.cost - available}🦴`
      const btnColor = acquired ? '#44cc88' : canAfford ? '#ffffff' : '#664444'

      const btn = this.add.text(cx2, top + 164, btnLabel, {
        fontSize: '11px', color: btnColor,
      }).setOrigin(0.5)
      container.add(btn)

      if (canAfford) {
        btn.setInteractive()
        btn.on('pointerover', () => btn.setColor('#ffdd44'))
        btn.on('pointerout',  () => btn.setColor('#ffffff'))
        btn.on('pointerdown', () => {
          profileManager.saveUpgrade(def.key)
          // Fecha manualmente antes de reabrir para evitar que o toggle só feche
          this._upgradePanel?.destroy()
          this._upgradePanel = null
          this._renderUpgradePanel()
        })
      }
    })

    // Botão fechar
    const closeBtn = this.add.text(W / 2 - 12, -H / 2 + 10, '✕', {
      fontSize: '18px', color: '#cc4444',
    }).setOrigin(0.5).setInteractive()
    container.add(closeBtn)
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff6666'))
    closeBtn.on('pointerout',  () => closeBtn.setColor('#cc4444'))
    closeBtn.on('pointerdown', () => {
      this._upgradePanel?.destroy()
      this._upgradePanel = null
    })
  }

  private _startLevel(levelId: string): void {
    const profile = profileManager.getActive()
    if (profile) {
      // Sincroniza cachorra do perfil com o gameState
      gameState.activeDog = profile.dog
    }
    gameState.reset()
    gameState.currentLevel = levelId
    gameState.sessionStartTime = Date.now()
    SoundManager.stopBgm()
    this.scene.start(KEYS.GAME)
  }
}
