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

// Definição dos nós do mapa em ordem de mundo
const MAP_NODES: MapNode[] = [
  // World 0
  { levelId: '0-1',    label: 'Sala',      world: 'Mundo 0 — Apartamento', x: 80,  y: 0 },
  { levelId: '0-boss', label: 'Aspirador', world: 'Mundo 0 — Apartamento', x: 200, y: 0 },
  // World 1
  { levelId: '1-1',    label: 'Rua',       world: 'Mundo 1 — Cidade',       x: 80,  y: 0 },
  { levelId: '1-2',    label: 'Praça',     world: 'Mundo 1 — Cidade',       x: 200, y: 0 },
  { levelId: '1-3',    label: 'Mercado',   world: 'Mundo 1 — Cidade',       x: 320, y: 0 },
  { levelId: '1-boss', label: 'Boss',      world: 'Mundo 1 — Cidade',       x: 440, y: 0 },
]

const MEDAL_EMOJI: Record<string, string> = {
  gold: '🥇', silver: '🥈', bronze: '🥉',
}

export class WorldMapScene extends Phaser.Scene {
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
    const worlds = ['Mundo 0 — Apartamento', 'Mundo 1 — Cidade']
    const worldStartY = [70, 200]

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
            circle.setAlpha(1.4)
          })
          hitArea.on('pointerout', () => {
            this.input.setDefaultCursor('default')
            circle.setAlpha(1)
          })
          hitArea.on('pointerdown', () => this._startLevel(node.levelId))
        }
      })
    })

    // ── Instruções ──────────────────────────────────────────────────────
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'Clique numa fase para jogar  |  ESC — menu', {
      fontSize: '11px', color: '#333355',
    }).setOrigin(0.5)

    // ── Tecla ESC ───────────────────────────────────────────────────────
    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.start(KEYS.MENU)
    })

    // ── Trocar perfil link ───────────────────────────────────────────────
    const switchBtn = this.add.text(GAME_WIDTH - 16, GAME_HEIGHT - 14, 'Trocar perfil', {
      fontSize: '10px', color: '#333366',
    }).setOrigin(1, 1).setInteractive()
    switchBtn.on('pointerover', () => switchBtn.setColor('#6666aa'))
    switchBtn.on('pointerout',  () => switchBtn.setColor('#333366'))
    switchBtn.on('pointerdown', () => this.scene.start(KEYS.PROFILE_SELECT))
  }

  private _startLevel(levelId: string): void {
    const profile = profileManager.getActive()
    if (profile) {
      // Sincroniza cachorra do perfil com o gameState
      gameState.activeDog = profile.dog
    }
    gameState.reset()
    gameState.currentLevel = levelId
    SoundManager.stopBgm()
    this.scene.start(KEYS.GAME)
  }
}
