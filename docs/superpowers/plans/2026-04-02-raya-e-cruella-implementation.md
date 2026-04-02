# Raya & Cruella — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build um jogo 2D plataforma jogável com Raya & Cruella usando Phaser 3 + TypeScript + Vite, publicado no GitHub Pages.

**Architecture:** Phaser 3 scenes gerenciam o loop do jogo (GameScene) e o HUD (UIScene) em paralelo. Um `Player` controller gerencia qual cachorra está ativa e delega física/animações para `Raya` e `Cruella`. GameState é um singleton TypeScript puro com toda a lógica de estado (corações, pontuação, troca). Níveis são definidos como dados em `World1.ts` com arrays 2D para tilemaps (sem dependência do Tiled no MVP).

**Tech Stack:** Phaser 3.87, TypeScript 5, Vite 5, Vitest (testes unitários), GitHub Actions (deploy automático)

---

## Mapa de Arquivos

| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/main.ts` | Config do Phaser, registro de todas as scenes |
| `src/constants.ts` | Chaves de assets, constantes de física e gameplay |
| `src/GameState.ts` | Estado global do jogo (puro TS, testável sem Phaser) |
| `src/scenes/BootScene.ts` | Geração de texturas placeholder via Phaser Graphics |
| `src/scenes/MenuScene.ts` | Tela inicial (Jogar, Galeria) |
| `src/scenes/GameScene.ts` | Loop principal: tilemap, física, player, inimigos, itens |
| `src/scenes/UIScene.ts` | HUD sobreposto: corações, score, cooldown de troca |
| `src/scenes/GameOverScene.ts` | Tela "Volta pra casa!" |
| `src/scenes/LevelCompleteScene.ts` | Placar de fase concluída |
| `src/scenes/PauseScene.ts` | Menu de pausa (ESC) |
| `src/scenes/GalleryScene.ts` | Galeria de ossos dourados coletados |
| `src/entities/Player.ts` | Controller de troca Raya↔Cruella, sem herança Phaser |
| `src/entities/Raya.ts` | Sprite Raya: velocidade, pulo duplo, dash |
| `src/entities/Cruella.ts` | Sprite Cruella: resistência, latido de choque |
| `src/entities/Enemy.ts` | Classe base abstrata de inimigos |
| `src/entities/enemies/GatoMalencarado.ts` | Patrulha, foge de Cruella |
| `src/entities/enemies/PomboAgitado.ts` | Voo linear |
| `src/entities/enemies/RatoDeCalcada.ts` | Corrida rápida, muda direção |
| `src/entities/enemies/DonoNervoso.ts` | Inderrotável, persegue |
| `src/entities/enemies/SeuBigodes.ts` | Boss com 3 fases |
| `src/items/PowerUp.ts` | Classe base de power-ups |
| `src/items/Bone.ts` | Osso comum coletável |
| `src/items/GoldenBone.ts` | Osso dourado secreto |
| `src/items/Accessory.ts` | Acessórios equipáveis (persistem até hit) |
| `src/items/Projectile.ts` | Bola de tênis e frisbee arremessáveis |
| `src/levels/LevelData.ts` | Interfaces de tipo para definição de fases |
| `src/levels/World1.ts` | Dados dos 4 níveis do Mundo 1 |
| `tests/GameState.test.ts` | Testes unitários do estado do jogo |

---

## Task 1: Setup do Projeto

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Criar package.json**

```json
{
  "name": "game-cruella-e-raya",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.87.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vite": "^5.4.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.14.0"
  }
}
```

- [ ] **Step 2: Criar tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "types": ["node"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Criar vite.config.ts**

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/game-cruella-e-raya/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Criar index.html**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Raya & Cruella — Aventura no Bairro</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      overflow: hidden;
    }
    canvas { display: block; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5: Criar .gitignore**

```
node_modules/
dist/
.superpowers/
*.local
.DS_Store
```

- [ ] **Step 6: Criar .github/workflows/deploy.yml**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - uses: actions/configure-pages@v4

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

      - id: deploy
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7: Instalar dependências**

```bash
npm install
```

Expected output: `added X packages` without errors.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html .gitignore .github/
git commit -m "chore: project setup with Phaser 3, TypeScript, Vite and GitHub Pages deploy"
```

---

## Task 2: Constants e GameState

**Files:**
- Create: `src/constants.ts`
- Create: `src/GameState.ts`
- Create: `tests/GameState.test.ts`

- [ ] **Step 1: Criar src/constants.ts**

```typescript
export const GAME_WIDTH = 800
export const GAME_HEIGHT = 450
export const TILE_SIZE = 32

export const KEYS = {
  // personagens
  RAYA: 'raya',
  CRUELLA: 'cruella',
  // inimigos
  GATO: 'gato',
  POMBO: 'pombo',
  RATO: 'rato',
  DONO: 'dono',
  BIGODES: 'bigodes',
  // itens
  BONE: 'bone',
  GOLDEN_BONE: 'golden_bone',
  PETISCO: 'petisco',
  PIPOCA: 'pipoca',
  PIZZA: 'pizza',
  CHURRASCO: 'churrasco',
  BOLA: 'bola',
  FRISBEE: 'frisbee',
  // acessórios
  LACO: 'laco',
  COLEIRA: 'coleira',
  CHAPEU: 'chapeu',
  BANDANA: 'bandana',
  // tiles e ui
  TILE_GROUND: 'tile_ground',
  TILE_PLATFORM: 'tile_platform',
  HYDRANT: 'hydrant',
  EXIT_GATE: 'exit_gate',
  SURPRISE_BLOCK: 'surprise_block',
  HEART: 'heart',
  HEART_EMPTY: 'heart_empty',
  COLLAR_GOLD: 'collar_gold',
  // scenes
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  GAME_OVER: 'GameOverScene',
  LEVEL_COMPLETE: 'LevelCompleteScene',
  PAUSE: 'PauseScene',
  GALLERY: 'GalleryScene',
} as const

export const PHYSICS = {
  GRAVITY: 800,
  RAYA_SPEED: 240,
  CRUELLA_SPEED: 200,
  JUMP_VELOCITY: -520,
  DASH_VELOCITY: 600,
  DASH_DURATION: 200,       // ms
  BARK_RADIUS: 120,
  SWAP_COOLDOWN: 1500,      // ms
  SWAP_BLOCK_AFTER_HIT: 2000, // ms
  COLLAR_GOLD_SPEED_BONUS: 60, // px/s extra quando tem collar of gold
} as const

export const POWER_UP_DURATION = 10000 // ms

export const SCORING = {
  BONE: 10,
  ENEMY_KILL: 50,
  GOLDEN_BONE: 500,
  BOSS_KILL: 1000,
} as const
```

- [ ] **Step 2: Criar src/GameState.ts**

```typescript
export type DogType = 'raya' | 'cruella'
export type AccessoryType = 'laco' | 'coleira' | 'chapeu' | 'bandana' | null

export interface ActivePowerUp {
  type: string
  expiresAt: number
}

export class GameState {
  hearts: number = 3
  score: number = 0
  activeDog: DogType = 'raya'
  swapBlockedUntil: number = 0
  lastHitAt: number = 0
  equippedAccessory: AccessoryType = null
  activePowerUp: ActivePowerUp | null = null
  collarOfGold: boolean = false
  checkpointReached: boolean = false
  checkpointX: number = 0
  checkpointY: number = 0
  currentLevel: string = '1-1'
  goldenBones: Record<string, boolean[]> = {}

  canSwap(now: number): boolean {
    return now >= this.swapBlockedUntil
  }

  swap(now: number): boolean {
    if (!this.canSwap(now)) return false
    this.activeDog = this.activeDog === 'raya' ? 'cruella' : 'raya'
    this.swapBlockedUntil = now + 1500
    return true
  }

  /** Returns true if a heart was lost */
  takeDamage(now: number): boolean {
    if (this.equippedAccessory === 'laco') {
      this.equippedAccessory = null
      this._blockSwap(now)
      return false
    }
    this.hearts--
    this.lastHitAt = now
    this._blockSwap(now)
    return true
  }

  private _blockSwap(now: number): void {
    this.swapBlockedUntil = Math.max(this.swapBlockedUntil, now + 2000)
  }

  isDead(): boolean {
    return this.hearts <= 0
  }

  addScore(points: number): void {
    this.score += points
  }

  collectGoldenBone(level: string, index: number): void {
    if (!this.goldenBones[level]) {
      this.goldenBones[level] = [false, false, false]
    }
    this.goldenBones[level][index] = true
  }

  hasPowerUp(type: string, now: number): boolean {
    if (!this.activePowerUp) return false
    if (this.activePowerUp.type !== type) return false
    if (now >= this.activePowerUp.expiresAt) {
      this.activePowerUp = null
      return false
    }
    return true
  }

  hasAnyPowerUp(now: number): boolean {
    if (!this.activePowerUp) return false
    if (now >= this.activePowerUp.expiresAt) {
      this.activePowerUp = null
      return false
    }
    return true
  }

  applyPowerUp(type: string, now: number): void {
    this.activePowerUp = { type, expiresAt: now + 10000 }
  }

  restoreHeart(): void {
    if (this.hearts < 3) this.hearts++
  }

  equipAccessory(type: AccessoryType): void {
    this.equippedAccessory = type
  }

  setCheckpoint(x: number, y: number): void {
    this.checkpointReached = true
    this.checkpointX = x
    this.checkpointY = y
  }

  reset(): void {
    this.hearts = 3
    this.score = 0
    this.activeDog = 'raya'
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    this.equippedAccessory = null
    this.activePowerUp = null
    this.collarOfGold = false
    this.checkpointReached = false
    this.checkpointX = 0
    this.checkpointY = 0
  }

  resetForCheckpoint(): void {
    // Keep hearts, score, goldenBones and collarOfGold
    this.equippedAccessory = null
    this.activePowerUp = null
    this.swapBlockedUntil = 0
  }
}

export const gameState = new GameState()
```

- [ ] **Step 3: Criar tests/GameState.test.ts**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { GameState } from '../src/GameState'

describe('GameState', () => {
  let state: GameState

  beforeEach(() => {
    state = new GameState()
  })

  it('começa com 3 corações e raya ativa', () => {
    expect(state.hearts).toBe(3)
    expect(state.activeDog).toBe('raya')
    expect(state.score).toBe(0)
  })

  it('troca de cachorra e define cooldown', () => {
    const swapped = state.swap(0)
    expect(swapped).toBe(true)
    expect(state.activeDog).toBe('cruella')
    expect(state.canSwap(1000)).toBe(false)
    expect(state.canSwap(1500)).toBe(true)
  })

  it('não troca antes do cooldown expirar', () => {
    state.swap(0)
    const swapped = state.swap(1000) // muito cedo
    expect(swapped).toBe(false)
    expect(state.activeDog).toBe('cruella') // ainda cruella
  })

  it('takeDamage reduz coração e retorna true', () => {
    const lost = state.takeDamage(0)
    expect(lost).toBe(true)
    expect(state.hearts).toBe(2)
  })

  it('laço absorve um hit sem perder coração', () => {
    state.equippedAccessory = 'laco'
    const lost = state.takeDamage(0)
    expect(lost).toBe(false)
    expect(state.hearts).toBe(3)
    expect(state.equippedAccessory).toBeNull()
  })

  it('isDead retorna true com 0 corações', () => {
    state.hearts = 0
    expect(state.isDead()).toBe(true)
    state.hearts = 1
    expect(state.isDead()).toBe(false)
  })

  it('bloqueia troca após levar dano', () => {
    state.takeDamage(0)
    expect(state.canSwap(1000)).toBe(false)
    expect(state.canSwap(2000)).toBe(true)
  })

  it('power-up expira após 10s', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('petisco', 5000)).toBe(true)
    expect(state.hasPowerUp('petisco', 10001)).toBe(false)
    expect(state.activePowerUp).toBeNull()
  })

  it('hasPowerUp retorna false para tipo errado', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('pipoca', 5000)).toBe(false)
  })

  it('coleta ossos dourados por fase', () => {
    state.collectGoldenBone('1-1', 0)
    state.collectGoldenBone('1-1', 2)
    expect(state.goldenBones['1-1']).toEqual([true, false, true])
  })

  it('addScore acumula pontos', () => {
    state.addScore(10)
    state.addScore(50)
    expect(state.score).toBe(60)
  })

  it('restoreHeart não ultrapassa 3', () => {
    state.restoreHeart() // já tem 3
    expect(state.hearts).toBe(3)
    state.hearts = 2
    state.restoreHeart()
    expect(state.hearts).toBe(3)
  })

  it('reset limpa todo o estado', () => {
    state.hearts = 1
    state.score = 999
    state.activeDog = 'cruella'
    state.collarOfGold = true
    state.reset()
    expect(state.hearts).toBe(3)
    expect(state.score).toBe(0)
    expect(state.activeDog).toBe('raya')
    expect(state.collarOfGold).toBe(false)
  })

  it('setCheckpoint armazena posição', () => {
    state.setCheckpoint(400, 300)
    expect(state.checkpointReached).toBe(true)
    expect(state.checkpointX).toBe(400)
    expect(state.checkpointY).toBe(300)
  })
})
```

- [ ] **Step 4: Rodar testes**

```bash
npm test
```

Expected: `Tests 17 passed` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/constants.ts src/GameState.ts tests/
git commit -m "feat: constants, GameState singleton and unit tests"
```

---

## Task 3: Phaser Entry Point + BootScene

**Files:**
- Create: `src/main.ts`
- Create: `src/scenes/BootScene.ts`
- Create: `src/scenes/MenuScene.ts` (stub)
- Create: `src/scenes/GameScene.ts` (stub)
- Create: `src/scenes/UIScene.ts` (stub)
- Create: `src/scenes/GameOverScene.ts` (stub)
- Create: `src/scenes/LevelCompleteScene.ts` (stub)
- Create: `src/scenes/PauseScene.ts` (stub)
- Create: `src/scenes/GalleryScene.ts` (stub)

- [ ] **Step 1: Criar stubs das scenes**

Criar cada arquivo com conteúdo mínimo (para `src/main.ts` compilar):

`src/scenes/MenuScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class MenuScene extends Phaser.Scene {
  constructor() { super(KEYS.MENU) }
  create(): void {
    this.add.text(400, 225, 'RAYA & CRUELLA', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 320, 'Pressione ENTER para jogar', { fontSize: '20px', color: '#ffff00' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.scene.start(KEYS.GAME)
      this.scene.launch(KEYS.UI)
    })
  }
}
```

`src/scenes/GameScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GameScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME) }
  create(): void {
    this.add.text(400, 225, 'GameScene — em construção', { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
  }
}
```

`src/scenes/UIScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class UIScene extends Phaser.Scene {
  constructor() { super(KEYS.UI) }
  create(): void { /* implementado na Task 8 */ }
}
```

`src/scenes/GameOverScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GameOverScene extends Phaser.Scene {
  constructor() { super(KEYS.GAME_OVER) }
  create(): void {
    this.add.text(400, 180, 'VOLTA PRA CASA!', { fontSize: '40px', color: '#ff4444' }).setOrigin(0.5)
    this.add.text(400, 270, 'ENTER — recomeçar do checkpoint', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 310, 'R — recomeçar a fase', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5)
    const kb = this.input.keyboard!
    kb.once('keydown-ENTER', () => { this.scene.start(KEYS.GAME) })
    kb.once('keydown-R', () => { this.scene.start(KEYS.GAME, { fromStart: true }) })
  }
}
```

`src/scenes/LevelCompleteScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super(KEYS.LEVEL_COMPLETE) }
  create(data: { score: number; bones: number; time: number }): void {
    this.add.text(400, 160, 'CHEGAMOS! 🏠', { fontSize: '40px', color: '#ffff00' }).setOrigin(0.5)
    this.add.text(400, 240, `Ossos: ${data?.bones ?? 0}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 280, `Pontos: ${data?.score ?? 0}`, { fontSize: '24px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 350, 'ENTER — próxima fase', { fontSize: '18px', color: '#aaaaaa' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-ENTER', () => { this.scene.start(KEYS.GAME) })
  }
}
```

`src/scenes/PauseScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class PauseScene extends Phaser.Scene {
  constructor() { super(KEYS.PAUSE) }
  create(): void {
    this.add.rectangle(400, 225, 400, 300, 0x000000, 0.8)
    this.add.text(400, 130, 'PAUSADO', { fontSize: '36px', color: '#ffffff' }).setOrigin(0.5)
    this.add.text(400, 200, '← → Mover', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 230, 'ESPAÇO Pular (segurar = mais alto)', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 260, 'SHIFT Habilidade especial', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 290, 'TAB Trocar cachorra', { fontSize: '16px', color: '#cccccc' }).setOrigin(0.5)
    this.add.text(400, 340, 'ESC — continuar   M — menu', { fontSize: '16px', color: '#ffff00' }).setOrigin(0.5)
    const kb = this.input.keyboard!
    kb.once('keydown-ESC', () => { this.scene.resume(KEYS.GAME); this.scene.stop() })
    kb.once('keydown-M', () => { this.scene.stop(KEYS.GAME); this.scene.stop(KEYS.UI); this.scene.stop(); this.scene.start(KEYS.MENU) })
  }
}
```

`src/scenes/GalleryScene.ts`:
```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'
import { gameState } from '../GameState'

export class GalleryScene extends Phaser.Scene {
  constructor() { super(KEYS.GALLERY) }
  create(): void {
    this.add.text(400, 60, 'GALERIA DE OSSOS DOURADOS', { fontSize: '28px', color: '#ffdd00' }).setOrigin(0.5)
    const levels = ['1-1', '1-2', '1-3']
    levels.forEach((level, li) => {
      this.add.text(100, 140 + li * 80, `Fase ${level}:`, { fontSize: '20px', color: '#ffffff' })
      const bones = gameState.goldenBones[level] ?? [false, false, false]
      bones.forEach((collected, bi) => {
        const color = collected ? '#ffdd00' : '#444444'
        this.add.text(220 + bi * 60, 140 + li * 80, '🦴', { fontSize: '28px', color })
      })
    })
    this.add.text(400, 400, 'BACKSPACE — voltar', { fontSize: '16px', color: '#aaaaaa' }).setOrigin(0.5)
    this.input.keyboard!.once('keydown-BACKSPACE', () => { this.scene.start(KEYS.MENU) })
  }
}
```

- [ ] **Step 2: Criar src/scenes/BootScene.ts**

BootScene gera todas as texturas placeholder via Phaser Graphics (sem arquivos PNG externos).

```typescript
import Phaser from 'phaser'
import { KEYS, TILE_SIZE } from '../constants'

export class BootScene extends Phaser.Scene {
  constructor() { super(KEYS.BOOT) }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0, add: false })

    const makeRect = (key: string, w: number, h: number, fill: number, stroke?: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillRect(0, 0, w, h)
      if (stroke !== undefined) {
        g.lineStyle(2, stroke)
        g.strokeRect(1, 1, w - 2, h - 2)
      }
      g.generateTexture(key, w, h)
    }

    const makeCircle = (key: string, r: number, fill: number) => {
      g.clear()
      g.fillStyle(fill)
      g.fillCircle(r, r, r)
      g.generateTexture(key, r * 2, r * 2)
    }

    // personagens (32x48)
    makeRect(KEYS.RAYA,    32, 48, 0xff6b6b, 0xcc3333)  // coral/vermelho
    makeRect(KEYS.CRUELLA, 32, 48, 0x6b6bff, 0x3333cc)  // azul

    // inimigos
    makeRect(KEYS.GATO,   28, 28, 0x888888, 0x444444)   // cinza
    makeRect(KEYS.POMBO,  24, 20, 0xaaaaaa, 0x666666)   // cinza claro
    makeRect(KEYS.RATO,   20, 16, 0x996633, 0x663300)   // marrom
    makeRect(KEYS.DONO,   24, 48, 0x336699, 0x224466)   // azul escuro
    makeRect(KEYS.BIGODES,64, 64, 0xaa4444, 0x882222)   // vermelho escuro (boss)

    // tiles
    makeRect(KEYS.TILE_GROUND,   TILE_SIZE, TILE_SIZE, 0x8b5e3c, 0x5a3a1a) // terra marrom
    makeRect(KEYS.TILE_PLATFORM, TILE_SIZE, TILE_SIZE / 2, 0x5a8f3c, 0x3a6020) // verde

    // itens
    makeCircle(KEYS.BONE,        8,  0xf5f0e0)  // branco-amarelado
    makeCircle(KEYS.GOLDEN_BONE, 10, 0xffd700)  // dourado
    makeRect(KEYS.PETISCO,  20, 14, 0xff8c00)   // laranja
    makeRect(KEYS.PIPOCA,   16, 20, 0xfffacd)   // amarelo claro
    makeRect(KEYS.PIZZA,    22, 22, 0xff6347)   // tomate
    makeRect(KEYS.CHURRASCO,24, 18, 0x8b0000)   // vermelho escuro
    makeCircle(KEYS.BOLA,   10, 0xadff2f)       // verde limão
    makeRect(KEYS.FRISBEE,  24, 8,  0x00bcd4)   // ciano

    // acessórios
    makeRect(KEYS.LACO,    16, 12, 0xff69b4)   // rosa
    makeRect(KEYS.COLEIRA, 24,  8, 0xcd853f)   // marrom claro
    makeRect(KEYS.CHAPEU,  24, 14, 0xff1493)   // magenta
    makeRect(KEYS.BANDANA, 20, 10, 0xff4500)   // laranja-vermelho
    makeRect(KEYS.COLLAR_GOLD, 24, 8, 0xffd700, 0xb8860b) // dourado

    // ui
    makeCircle(KEYS.HEART,       12, 0xff3355)  // coração cheio
    makeCircle(KEYS.HEART_EMPTY, 12, 0x333333)  // coração vazio

    // objetos de cenário
    makeRect(KEYS.HYDRANT,   20, 32, 0xff2200, 0xaa0000)  // hidrante vermelho
    makeRect(KEYS.EXIT_GATE, 48, 64, 0x8b6914, 0x5a4010)  // portão marrom
    makeRect(KEYS.SURPRISE_BLOCK, TILE_SIZE, TILE_SIZE, 0xffd700, 0xb8860b) // bloco surpresa

    g.destroy()

    this.scene.start(KEYS.MENU)
  }
}
```

- [ ] **Step 3: Criar src/main.ts**

```typescript
import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import { UIScene } from './scenes/UIScene'
import { GameOverScene } from './scenes/GameOverScene'
import { LevelCompleteScene } from './scenes/LevelCompleteScene'
import { PauseScene } from './scenes/PauseScene'
import { GalleryScene } from './scenes/GalleryScene'
import { GAME_WIDTH, GAME_HEIGHT, PHYSICS } from './constants'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87CEEB',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene,
    GameOverScene,
    LevelCompleteScene,
    PauseScene,
    GalleryScene,
  ],
}

new Phaser.Game(config)
```

- [ ] **Step 4: Verificar no navegador**

```bash
npm run dev
```

Abrir `http://localhost:5173/game-cruella-e-raya/`.
Expected: tela azul com texto "RAYA & CRUELLA" e "Pressione ENTER para jogar". Sem erros no console.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: Phaser entry point, BootScene with placeholder textures, scene stubs"
```

---

## Task 4: Player Controller (Swap Mechanic)

**Files:**
- Create: `src/entities/Raya.ts`
- Create: `src/entities/Cruella.ts`
- Create: `src/entities/Player.ts`

- [ ] **Step 1: Criar src/entities/Raya.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'

export class Raya extends Phaser.Physics.Arcade.Sprite {
  private jumpsLeft: number = 2
  private isDashing: boolean = false
  private dashCooldown: boolean = false
  private onGround: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RAYA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
  }

  setOnGround(value: boolean): void {
    if (value && !this.onGround) {
      this.jumpsLeft = 2 // reset ao pousar
    }
    this.onGround = value
  }

  update(speedBonus: number = 0): void {
    if (this.isDashing) return

    const speed = PHYSICS.RAYA_SPEED + speedBonus
    const body = this.body as Phaser.Physics.Arcade.Body

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
      this.jumpsLeft--
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.dashCooldown) {
      this.dash()
    }

    // Pulo mais alto se segurar space
    if (this.cursors.space.isDown && body.velocity.y < 0) {
      // mantém impulso — física arcade faz o resto com gravidade
    }
  }

  private dash(): void {
    this.isDashing = true
    this.dashCooldown = true
    const dir = this.flipX ? -1 : 1
    this.setVelocityX(dir * PHYSICS.DASH_VELOCITY)
    this.setVelocityY(0)
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(false)

    this.scene.time.delayedCall(PHYSICS.DASH_DURATION, () => {
      this.isDashing = false
      body.setAllowGravity(true)
    })

    this.scene.time.delayedCall(800, () => {
      this.dashCooldown = false
    })
  }

  getIsDashing(): boolean { return this.isDashing }
}
```

- [ ] **Step 2: Criar src/entities/Cruella.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { Enemy } from './Enemy'

export class Cruella extends Phaser.Physics.Arcade.Sprite {
  private onGround: boolean = false
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private shiftKey!: Phaser.Input.Keyboard.Key
  private barkCooldown: boolean = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.CRUELLA)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCollideWorldBounds(true)
    this.cursors = scene.input.keyboard!.createCursorKeys()
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
  }

  setOnGround(value: boolean): void {
    this.onGround = value
  }

  update(speedBonus: number = 0): void {
    const speed = PHYSICS.CRUELLA_SPEED + speedBonus

    if (this.cursors.left.isDown) {
      this.setVelocityX(-speed)
      this.setFlipX(true)
    } else if (this.cursors.right.isDown) {
      this.setVelocityX(speed)
      this.setFlipX(false)
    } else {
      this.setVelocityX(0)
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.onGround) {
      this.setVelocityY(PHYSICS.JUMP_VELOCITY)
    }

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey) && !this.barkCooldown) {
      this.bark()
    }
  }

  bark(): void {
    this.barkCooldown = true
    // Emite evento para GameScene processar colisão com inimigos
    this.emit('bark', this.x, this.y)
    this.scene.time.delayedCall(1500, () => { this.barkCooldown = false })
  }

  /** Inimigos dentro do raio de intimidação passiva têm chance de fugir */
  checkIntimidation(enemies: Enemy[]): void {
    enemies.forEach(enemy => {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (dist <= PHYSICS.BARK_RADIUS * 1.5 && Math.random() < 0.02) {
        enemy.flee(this.x)
      }
    })
  }
}
```

- [ ] **Step 3: Criar src/entities/Enemy.ts (base class)**

```typescript
import Phaser from 'phaser'

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected hp: number
  protected speed: number
  protected direction: number = 1
  protected stunUntil: number = 0
  protected isFleeing: boolean = false

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    texture: string,
    hp: number,
    speed: number
  ) {
    super(scene, x, y, texture)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.hp = hp
    this.speed = speed
    this.setCollideWorldBounds(true)
  }

  takeDamage(amount: number = 1): void {
    this.hp -= amount
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => this.clearTint())
    if (this.hp <= 0) this.onDeath()
  }

  stun(duration: number): void {
    this.stunUntil = this.scene.time.now + duration
    this.setVelocityX(0)
  }

  flee(fromX: number): void {
    this.isFleeing = true
    const dir = this.x > fromX ? 1 : -1
    this.setVelocityX(dir * this.speed * 1.5)
    this.scene.time.delayedCall(2000, () => { this.isFleeing = false })
  }

  protected onDeath(): void {
    this.emit('died', this)
    this.destroy()
  }

  isStunned(): boolean {
    return this.scene.time.now < this.stunUntil
  }

  abstract update(time: number, delta: number): void
}
```

- [ ] **Step 4: Criar src/entities/Player.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Raya } from './Raya'
import { Cruella } from './Cruella'
import { Enemy } from './Enemy'

export class Player {
  raya: Raya
  cruella: Cruella
  private tabKey: Phaser.Input.Keyboard.Key
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.raya = new Raya(scene, x, y)
    this.cruella = new Cruella(scene, x, y)
    this.tabKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)

    // Começa com Raya ativa, Cruella como fantasma
    this.cruella.setAlpha(0.35)
    this.cruella.setActive(false)
    this.cruella.setVelocity(0, 0)
    ;(this.cruella.body as Phaser.Physics.Arcade.Body).setEnable(false)

    gameState.activeDog = 'raya'
  }

  get active(): Raya | Cruella {
    return gameState.activeDog === 'raya' ? this.raya : this.cruella
  }

  get ghost(): Raya | Cruella {
    return gameState.activeDog === 'raya' ? this.cruella : this.raya
  }

  get x(): number { return this.active.x }
  get y(): number { return this.active.y }

  update(enemies: Enemy[]): void {
    const now = this.scene.time.now
    const speedBonus = gameState.collarOfGold ? PHYSICS.COLLAR_GOLD_SPEED_BONUS : 0

    // Processar troca
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      if (gameState.swap(now)) {
        this._performSwap()
      }
    }

    // Atualizar cachorra ativa
    if (gameState.activeDog === 'raya') {
      this.raya.update(speedBonus)
      this.cruella.checkIntimidation(enemies)
    } else {
      this.cruella.update(speedBonus)
    }

    // Ghost segue a ativa
    const ghost = this.ghost
    ghost.setPosition(this.active.x - (this.active.flipX ? -24 : 24), this.active.y)
  }

  private _performSwap(): void {
    const prev = this.active
    const next = this.ghost

    // Transfere posição e velocidade
    next.setPosition(prev.x, prev.y)
    next.setVelocity(prev.body!.velocity.x, prev.body!.velocity.y)
    ;(next.body as Phaser.Physics.Arcade.Body).setEnable(true)
    next.setAlpha(1)
    next.setActive(true)

    prev.setAlpha(0.35)
    prev.setActive(false)
    ;(prev.body as Phaser.Physics.Arcade.Body).setEnable(false)

    // Flash visual
    this.scene.cameras.main.flash(80, 255, 255, 255)
  }

  setGrounded(isRaya: boolean, value: boolean): void {
    if (isRaya) this.raya.setOnGround(value)
    else this.cruella.setOnGround(value)
  }

  takeDamage(): void {
    const now = this.scene.time.now
    const heartLost = gameState.takeDamage(now)
    if (heartLost) {
      this.scene.cameras.main.shake(200, 0.01)
    }
    this.active.setTint(0xff0000)
    this.scene.time.delayedCall(300, () => this.active.clearTint())
  }
}
```

- [ ] **Step 5: Verificar compilação**

```bash
npm run build
```

Expected: sem erros TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/entities/
git commit -m "feat: Raya, Cruella and Player controller with swap mechanic"
```

---

## Task 5: GameScene — Tilemap, Física e Player Integrado

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Create: `src/levels/LevelData.ts`
- Create: `src/levels/World1.ts`

- [ ] **Step 1: Criar src/levels/LevelData.ts**

```typescript
export type EnemyType = 'gato' | 'pombo' | 'rato' | 'dono'

export type ItemType =
  | 'bone' | 'golden_bone'
  | 'petisco' | 'pipoca' | 'pizza' | 'churrasco'
  | 'bola' | 'frisbee'
  | 'laco' | 'coleira' | 'chapeu' | 'bandana'
  | 'surprise_block'

export interface EnemySpawn {
  type: EnemyType
  x: number  // pixel
  y: number
}

export interface ItemSpawn {
  type: ItemType
  x: number
  y: number
}

export interface LevelData {
  id: string
  name: string
  bgColor: number
  /** 2D array: 0=vazio, 1=chão sólido, 2=plataforma (one-way) */
  tiles: number[][]
  tileWidthCols: number  // número de colunas (largura do mapa)
  spawnX: number
  spawnY: number
  exitX: number
  exitY: number
  checkpointX: number
  checkpointY: number
  enemies: EnemySpawn[]
  items: ItemSpawn[]
  goldenBones: Array<{ x: number; y: number }>
  nextLevel: string | null
  isBossLevel?: boolean
}
```

- [ ] **Step 2: Criar src/levels/World1.ts (nível 1-1)**

O tilemap tem 80 colunas x 14 linhas (80×32=2560px de largura, 14×32=448px≈450 de altura). Linha 13 (índice 13) = chão. Linhas 0-12 = espaço de jogo.

```typescript
import { LevelData } from './LevelData'

// Helper: cria linha vazia
const E = (n: number) => Array(n).fill(0)
// Helper: cria linha de chão
const G = (n: number) => Array(n).fill(1)

const COLS = 80
const ROWS = 14

/** Linha vazia (80 tiles) */
function emptyRow(): number[] { return E(COLS) }

/** Linha de chão completo */
function groundRow(): number[] { return G(COLS) }

/** Plataforma flutuante: x=coluna inicial, len=comprimento */
function platformRow(x: number, len: number): number[] {
  const row = emptyRow()
  for (let i = x; i < x + len; i++) row[i] = 2
  return row
}

/** Linha com buraco (0) entre x1 e x2 */
function groundWithGap(x1: number, x2: number): number[] {
  const row = groundRow()
  for (let i = x1; i < x2; i++) row[i] = 0
  return row
}

export const LEVEL_1_1: LevelData = {
  id: '1-1',
  name: 'Rua Residencial',
  bgColor: 0x87CEEB,
  tileWidthCols: COLS,
  tiles: [
    emptyRow(),                      // row 0
    emptyRow(),                      // row 1
    emptyRow(),                      // row 2
    platformRow(10, 5),              // row 3  — plataforma flutuante
    emptyRow(),                      // row 4
    platformRow(20, 6),              // row 5
    emptyRow(),                      // row 6
    platformRow(35, 4),              // row 7
    platformRow(48, 5),              // row 8
    emptyRow(),                      // row 9
    platformRow(60, 6),              // row 10
    emptyRow(),                      // row 11
    emptyRow(),                      // row 12
    groundRow(),                     // row 13 — chão
  ],
  spawnX: 64,
  spawnY: 400,
  exitX: 2496,
  exitY: 370,
  checkpointX: 1280,
  checkpointY: 380,
  enemies: [
    { type: 'gato',  x: 320,  y: 390 },
    { type: 'pombo', x: 640,  y: 200 },
    { type: 'gato',  x: 960,  y: 390 },
    { type: 'rato',  x: 1280, y: 390 },
    { type: 'pombo', x: 1600, y: 180 },
    { type: 'dono',  x: 1920, y: 390 },
    { type: 'gato',  x: 2200, y: 390 },
  ],
  items: [
    { type: 'bone', x: 160, y: 380 },
    { type: 'bone', x: 352, y: 380 },
    { type: 'bone', x: 480, y: 180 },  // em cima da plataforma row 3
    { type: 'petisco', x: 700, y: 380 },
    { type: 'bone', x: 900, y: 380 },
    { type: 'surprise_block', x: 1100, y: 320 },
    { type: 'bone', x: 1400, y: 380 },
    { type: 'laco', x: 1600, y: 380 },
    { type: 'bone', x: 1800, y: 380 },
    { type: 'bone', x: 2100, y: 380 },
    { type: 'pizza', x: 2300, y: 380 },
  ],
  goldenBones: [
    { x: 352,  y: 96  },   // em cima da plataforma row 3 (alto)
    { x: 1536, y: 96  },   // área secreta no topo
    { x: 1952, y: 224 },   // plataforma row 10
  ],
  nextLevel: '1-2',
}

export const LEVEL_1_2: LevelData = {
  id: '1-2',
  name: 'Praça com Jardim',
  bgColor: 0x90EE90,
  tileWidthCols: COLS,
  tiles: [
    emptyRow(),
    emptyRow(),
    platformRow(5, 4),
    emptyRow(),
    platformRow(15, 5),
    platformRow(28, 3),
    emptyRow(),
    platformRow(38, 6),
    platformRow(52, 4),
    emptyRow(),
    platformRow(65, 5),
    emptyRow(),
    emptyRow(),
    groundRow(),
  ],
  spawnX: 64,
  spawnY: 400,
  exitX: 2496,
  exitY: 370,
  checkpointX: 1200,
  checkpointY: 380,
  enemies: [
    { type: 'gato',  x: 400,  y: 390 },
    { type: 'rato',  x: 700,  y: 390 },
    { type: 'pombo', x: 900,  y: 150 },
    { type: 'gato',  x: 1100, y: 390 },
    { type: 'dono',  x: 1400, y: 390 },
    { type: 'pombo', x: 1700, y: 180 },
    { type: 'rato',  x: 2000, y: 390 },
    { type: 'gato',  x: 2300, y: 390 },
  ],
  items: [
    { type: 'bone', x: 200, y: 380 },
    { type: 'bone', x: 500, y: 380 },
    { type: 'pipoca', x: 750, y: 380 },
    { type: 'surprise_block', x: 1000, y: 310 },
    { type: 'coleira', x: 1300, y: 380 },
    { type: 'bone', x: 1500, y: 380 },
    { type: 'bone', x: 1800, y: 380 },
    { type: 'chapeu', x: 2100, y: 380 },
    { type: 'bone', x: 2300, y: 380 },
  ],
  goldenBones: [
    { x: 192,  y: 64  },
    { x: 1248, y: 96  },
    { x: 2112, y: 160 },
  ],
  nextLevel: '1-3',
}

export const LEVEL_1_3: LevelData = {
  id: '1-3',
  name: 'Mercadinho / Feirinha',
  bgColor: 0xFFD700,
  tileWidthCols: COLS,
  tiles: [
    emptyRow(),
    emptyRow(),
    platformRow(8,  5),
    platformRow(20, 4),
    platformRow(32, 5),
    platformRow(45, 3),
    emptyRow(),
    platformRow(55, 6),
    platformRow(65, 4),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    groundRow(),
  ],
  spawnX: 64,
  spawnY: 400,
  exitX: 2496,
  exitY: 370,
  checkpointX: 1150,
  checkpointY: 380,
  enemies: [
    { type: 'rato',  x: 300,  y: 390 },
    { type: 'gato',  x: 600,  y: 390 },
    { type: 'rato',  x: 800,  y: 390 },
    { type: 'pombo', x: 1000, y: 120 },
    { type: 'dono',  x: 1200, y: 390 },
    { type: 'rato',  x: 1500, y: 390 },
    { type: 'gato',  x: 1700, y: 390 },
    { type: 'pombo', x: 1900, y: 150 },
    { type: 'dono',  x: 2200, y: 390 },
  ],
  items: [
    { type: 'bone', x: 160, y: 380 },
    { type: 'petisco', x: 400, y: 380 },
    { type: 'surprise_block', x: 700, y: 310 },
    { type: 'bola', x: 950, y: 380 },
    { type: 'bone', x: 1100, y: 380 },
    { type: 'frisbee', x: 1350, y: 380 },
    { type: 'bandana', x: 1600, y: 380 },
    { type: 'bone', x: 1850, y: 380 },
    { type: 'surprise_block', x: 2100, y: 300 },
    { type: 'bone', x: 2300, y: 380 },
  ],
  goldenBones: [
    { x: 288,  y: 64  },
    { x: 1472, y: 96  },
    { x: 2048, y: 192 },
  ],
  nextLevel: '1-boss',
}

export const LEVEL_1_BOSS: LevelData = {
  id: '1-boss',
  name: 'Depósito de Lixo — Seu Bigodes',
  bgColor: 0x2F4F2F,
  tileWidthCols: 30,   // fase mais curta, arena do boss
  tiles: [
    emptyRow(),
    emptyRow(),
    emptyRow(),
    [...E(5),  ...G(4), ...E(3), ...G(4), ...E(3), ...G(4), ...E(7)],  // plataformas suspensas
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    G(30),  // chão completo
  ],
  spawnX: 64,
  spawnY: 400,
  exitX: 896,
  exitY: 370,
  checkpointX: 480,
  checkpointY: 380,
  enemies: [],  // boss é criado separadamente via SeuBigodes.ts
  items: [],
  goldenBones: [],
  nextLevel: null,
  isBossLevel: true,
}

export const WORLD1_LEVELS: Record<string, LevelData> = {
  '1-1':    LEVEL_1_1,
  '1-2':    LEVEL_1_2,
  '1-3':    LEVEL_1_3,
  '1-boss': LEVEL_1_BOSS,
}
```

- [ ] **Step 3: Reescrever src/scenes/GameScene.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, TILE_SIZE, GAME_HEIGHT, PHYSICS } from '../constants'
import { gameState } from '../GameState'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { GatoMalencarado } from '../entities/enemies/GatoMalencarado'
import { PomboAgitado } from '../entities/enemies/PomboAgitado'
import { RatoDeCalcada } from '../entities/enemies/RatoDeCalcada'
import { DonoNervoso } from '../entities/enemies/DonoNervoso'
import { SeuBigodes } from '../entities/enemies/SeuBigodes'
import { Bone } from '../items/Bone'
import { GoldenBone } from '../items/GoldenBone'
import { PowerUp } from '../items/PowerUp'
import { Accessory } from '../items/Accessory'
import { LevelData } from '../levels/LevelData'
import { WORLD1_LEVELS } from '../levels/World1'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private groundLayer!: Phaser.Physics.Arcade.StaticGroup
  private platformLayer!: Phaser.Physics.Arcade.StaticGroup
  private enemyGroup!: Phaser.Physics.Arcade.Group
  private itemGroup!: Phaser.Physics.Arcade.StaticGroup
  private escKey!: Phaser.Input.Keyboard.Key
  private currentLevel!: LevelData

  constructor() { super(KEYS.GAME) }

  init(data: { fromStart?: boolean } = {}): void {
    if (data.fromStart) {
      gameState.resetForCheckpoint()
      gameState.checkpointReached = false
    }
  }

  create(): void {
    this.currentLevel = WORLD1_LEVELS[gameState.currentLevel] ?? WORLD1_LEVELS['1-1']
    this.cameras.main.setBackgroundColor(this.currentLevel.bgColor)

    this._buildTilemap()
    this._spawnPlayer()
    this._spawnEnemies()
    this._spawnItems()
    this._setupCollisions()
    this._setupCamera()

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    this.scene.launch(KEYS.UI)
  }

  private _buildTilemap(): void {
    this.groundLayer    = this.physics.add.staticGroup()
    this.platformLayer  = this.physics.add.staticGroup()

    const tiles = this.currentLevel.tiles
    const cols  = this.currentLevel.tileWidthCols

    for (let row = 0; row < tiles.length; row++) {
      for (let col = 0; col < cols; col++) {
        const val = tiles[row][col]
        if (val === 0) continue
        const px = col * TILE_SIZE + TILE_SIZE / 2
        const py = row * TILE_SIZE + TILE_SIZE / 2
        const texture = val === 2 ? KEYS.TILE_PLATFORM : KEYS.TILE_GROUND
        const tile = this.physics.add.staticImage(px, py, texture)
        if (val === 2) {
          this.platformLayer.add(tile)
        } else {
          this.groundLayer.add(tile)
        }
      }
    }

    this.itemGroup = this.physics.add.staticGroup()

    // Hidrante (checkpoint)
    const cp = this.physics.add.staticImage(
      this.currentLevel.checkpointX,
      this.currentLevel.checkpointY,
      KEYS.HYDRANT
    )
    this.itemGroup.add(cp)
    cp.setData('type', 'checkpoint')

    // Saída
    const exit = this.physics.add.staticImage(
      this.currentLevel.exitX,
      this.currentLevel.exitY,
      KEYS.EXIT_GATE
    )
    this.itemGroup.add(exit)
    exit.setData('type', 'exit')
  }

  private _spawnPlayer(): void {
    const spawnX = gameState.checkpointReached ? gameState.checkpointX : this.currentLevel.spawnX
    const spawnY = gameState.checkpointReached ? gameState.checkpointY - 32 : this.currentLevel.spawnY
    this.player = new Player(this, spawnX, spawnY)
  }

  private _spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group()
    this.currentLevel.enemies.forEach(spawn => {
      let enemy: Enemy | undefined
      switch (spawn.type) {
        case 'gato':  enemy = new GatoMalencarado(this, spawn.x, spawn.y); break
        case 'pombo': enemy = new PomboAgitado(this, spawn.x, spawn.y);    break
        case 'rato':  enemy = new RatoDeCalcada(this, spawn.x, spawn.y);   break
        case 'dono':  enemy = new DonoNervoso(this, spawn.x, spawn.y);     break
      }
      if (!enemy) return
      this.enemyGroup.add(enemy)
      enemy.on('died', (_e: Enemy) => { gameState.addScore(50) })
    })

    if (this.currentLevel.isBossLevel) {
      const boss = new SeuBigodes(this, 480, 360)
      this.enemyGroup.add(boss)
      boss.on('died', () => {
        gameState.addScore(1000)
        gameState.collarOfGold = true
        this._levelComplete()
      })
    }
  }

  private _spawnItems(): void {
    this.currentLevel.items.forEach(spawn => {
      let item: Phaser.Physics.Arcade.Image
      if (spawn.type === 'bone') {
        item = new Bone(this, spawn.x, spawn.y)
      } else if (spawn.type === 'golden_bone') {
        item = new GoldenBone(this, spawn.x, spawn.y, 0)
      } else if (['laco', 'coleira', 'chapeu', 'bandana'].includes(spawn.type)) {
        item = new Accessory(this, spawn.x, spawn.y, spawn.type as any)
      } else {
        item = new PowerUp(this, spawn.x, spawn.y, spawn.type)
      }
      this.itemGroup.add(item)
    })

    this.currentLevel.goldenBones.forEach((pos, i) => {
      const gb = new GoldenBone(this, pos.x, pos.y, i)
      this.itemGroup.add(gb)
    })
  }

  private _setupCollisions(): void {
    const activeSprites = [this.player.raya, this.player.cruella]

    // Player vs chão
    this.physics.add.collider(this.player.raya, this.groundLayer, () => {
      this.player.setGrounded(true, true)
    })
    this.physics.add.collider(this.player.cruella, this.groundLayer, () => {
      this.player.setGrounded(false, true)
    })

    // Player vs plataformas (one-way)
    const platCollider = this.physics.add.collider(
      [this.player.raya, this.player.cruella],
      this.platformLayer,
      undefined, undefined, this
    )

    // Inimigos vs chão
    this.physics.add.collider(this.enemyGroup, this.groundLayer)
    this.physics.add.collider(this.enemyGroup, this.platformLayer)

    // Player vs inimigos
    activeSprites.forEach(sprite => {
      this.physics.add.overlap(sprite, this.enemyGroup, (_s, enemy) => {
        if (gameState.hasAnyPowerUp(this.time.now) &&
            gameState.activePowerUp?.type === 'churrasco') {
          (enemy as Enemy).takeDamage(999)
          return
        }
        this.player.takeDamage()
        if (gameState.isDead()) {
          this._gameOver()
        }
      })
    })

    // Player vs itens
    activeSprites.forEach(sprite => {
      this.physics.add.overlap(sprite, this.itemGroup, (_s, item) => {
        const t = (item as Phaser.Physics.Arcade.Image).getData('type') as string
        if (!t) return
        if (t === 'checkpoint') {
          if (!gameState.checkpointReached) {
            gameState.setCheckpoint(item.x, item.y)
          }
        } else if (t === 'exit') {
          this._levelComplete()
        } else if (t === 'bone') {
          gameState.addScore(10)
          item.destroy()
        } else if (t === 'golden_bone') {
          const idx = (item as any).boneIndex as number
          gameState.collectGoldenBone(gameState.currentLevel, idx)
          gameState.addScore(500)
          item.destroy()
        } else if (['laco', 'coleira', 'chapeu', 'bandana'].includes(t)) {
          gameState.equipAccessory(t as any)
          item.destroy()
        } else {
          // power-up temporário
          if (t === 'pizza') {
            gameState.restoreHeart()
          } else {
            gameState.applyPowerUp(t, this.time.now)
          }
          item.destroy()
        }
      })
    })

    // Bark da Cruella atinge inimigos
    this.player.cruella.on('bark', (bx: number, by: number) => {
      (this.enemyGroup.getChildren() as Enemy[]).forEach(enemy => {
        const dist = Phaser.Math.Distance.Between(bx, by, enemy.x, enemy.y)
        if (dist <= PHYSICS.BARK_RADIUS) {
          enemy.stun(2000)
        }
      })
    })
  }

  private _setupCamera(): void {
    const mapWidth = this.currentLevel.tileWidthCols * TILE_SIZE
    this.cameras.main.setBounds(0, 0, mapWidth, GAME_HEIGHT)
    this.cameras.main.startFollow(this.player.active, true, 0.1, 0.1)
  }

  private _levelComplete(): void {
    this.scene.stop(KEYS.UI)
    const nextLevel = this.currentLevel.nextLevel
    if (nextLevel) {
      gameState.currentLevel = nextLevel
      gameState.checkpointReached = false
    }
    this.scene.start(KEYS.LEVEL_COMPLETE, {
      score: gameState.score,
      bones: Object.values(gameState.goldenBones).flat().filter(Boolean).length,
    })
  }

  private _gameOver(): void {
    this.scene.stop(KEYS.UI)
    this.scene.start(KEYS.GAME_OVER)
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause()
      this.scene.launch(KEYS.PAUSE)
      return
    }

    const enemies = this.enemyGroup.getChildren() as Enemy[]
    this.player.update(enemies)

    // Câmera segue a cachorra ativa
    this.cameras.main.startFollow(this.player.active, true, 0.1, 0.1)

    // Atualizar inimigos
    enemies.forEach(e => e.update(time, delta))
  }
}
```

- [ ] **Step 4: Verificar no navegador**

```bash
npm run dev
```

Abrir URL, pressionar ENTER no menu. Expected: fase 1-1 carregada com tiles de chão, player Raya (quadrado coral), pode mover com ←→ e pular com Espaço.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts src/levels/
git commit -m "feat: GameScene with tilemap, physics, player integration and level data"
```

---

## Task 6: UIScene — HUD

**Files:**
- Modify: `src/scenes/UIScene.ts`

- [ ] **Step 1: Reescrever src/scenes/UIScene.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH } from '../constants'
import { gameState } from '../GameState'

export class UIScene extends Phaser.Scene {
  private heartImages: Phaser.GameObjects.Image[] = []
  private scoreText!: Phaser.GameObjects.Text
  private dogText!: Phaser.GameObjects.Text
  private cooldownBar!: Phaser.GameObjects.Rectangle
  private cooldownBg!: Phaser.GameObjects.Rectangle
  private accessoryText!: Phaser.GameObjects.Text
  private powerUpText!: Phaser.GameObjects.Text

  constructor() { super({ key: KEYS.UI, active: false }) }

  create(): void {
    // Fundo semi-transparente do HUD
    this.add.rectangle(GAME_WIDTH / 2, 22, GAME_WIDTH, 44, 0x000000, 0.45).setScrollFactor(0)

    // Corações (3 posições)
    for (let i = 0; i < 3; i++) {
      const img = this.add.image(20 + i * 30, 22, KEYS.HEART).setScrollFactor(0).setScale(1.1)
      this.heartImages.push(img)
    }

    // Score
    this.scoreText = this.add.text(GAME_WIDTH - 10, 10, 'Ossos: 0', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(1, 0).setScrollFactor(0)

    // Cachorra ativa
    this.dogText = this.add.text(GAME_WIDTH / 2, 10, 'RAYA', {
      fontSize: '14px', color: '#ff6b6b', fontStyle: 'bold'
    }).setOrigin(0.5, 0).setScrollFactor(0)

    // Barra de cooldown de troca (abaixo do nome)
    this.cooldownBg = this.add.rectangle(GAME_WIDTH / 2, 30, 60, 6, 0x444444).setScrollFactor(0)
    this.cooldownBar = this.add.rectangle(GAME_WIDTH / 2, 30, 60, 6, 0x44ff44).setScrollFactor(0)

    // Acessório equipado
    this.accessoryText = this.add.text(140, 10, '', {
      fontSize: '12px', color: '#ffdd00'
    }).setScrollFactor(0)

    // Power-up ativo
    this.powerUpText = this.add.text(140, 24, '', {
      fontSize: '11px', color: '#88ffff'
    }).setScrollFactor(0)
  }

  update(): void {
    const now = this.time.now

    // Corações
    for (let i = 0; i < 3; i++) {
      const full = i < gameState.hearts
      this.heartImages[i].setTexture(full ? KEYS.HEART : KEYS.HEART_EMPTY)
      // pisca ao levar dano
      if (!full && now - gameState.lastHitAt < 500) {
        this.heartImages[i].setAlpha(Math.sin(now * 0.02) * 0.5 + 0.5)
      } else {
        this.heartImages[i].setAlpha(1)
      }
    }

    // Score
    this.scoreText.setText(`Ossos: ${gameState.score}`)

    // Cachorra ativa
    const dogName = gameState.activeDog === 'raya' ? 'RAYA' : 'CRUELLA'
    const dogColor = gameState.activeDog === 'raya' ? '#ff6b6b' : '#6b6bff'
    this.dogText.setText(dogName).setColor(dogColor)

    // Cooldown de troca
    const swapRemaining = Math.max(0, gameState.swapBlockedUntil - now)
    const fraction = Math.max(0, 1 - swapRemaining / 1500)
    this.cooldownBar.setDisplaySize(60 * fraction, 6)
    const barColor = fraction >= 1 ? 0x44ff44 : 0xff8800
    this.cooldownBar.setFillStyle(barColor)

    // Acessório
    const acc = gameState.equippedAccessory
    const accLabels: Record<string, string> = {
      laco: '🎀 Laço', coleira: '🏷️ Coleira',
      chapeu: '🎉 Chapéu', bandana: '🩱 Bandana'
    }
    this.accessoryText.setText(acc ? accLabels[acc] : '')

    // Power-up
    if (gameState.hasAnyPowerUp(now) && gameState.activePowerUp) {
      const remaining = Math.ceil((gameState.activePowerUp.expiresAt - now) / 1000)
      const puLabels: Record<string, string> = {
        petisco: '🍖 Turbo', pipoca: '🍿 Super Pulo',
        churrasco: '🥩 Invencível', bola: '🎾 Bola', frisbee: '🥏 Frisbee'
      }
      const label = puLabels[gameState.activePowerUp.type] ?? gameState.activePowerUp.type
      this.powerUpText.setText(`${label} ${remaining}s`)
    } else {
      this.powerUpText.setText('')
    }
  }
}
```

- [ ] **Step 2: Verificar no navegador**

Rodar `npm run dev`, jogar a fase.
Expected: HUD aparece no topo — 3 corações, nome "RAYA" em vermelho, barra de cooldown de troca verde.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/UIScene.ts
git commit -m "feat: UIScene HUD with hearts, active dog, swap cooldown and power-up display"
```

---

## Task 7: Inimigos Comuns

**Files:**
- Create: `src/entities/enemies/GatoMalencarado.ts`
- Create: `src/entities/enemies/PomboAgitado.ts`
- Create: `src/entities/enemies/RatoDeCalcada.ts`
- Create: `src/entities/enemies/DonoNervoso.ts`

- [ ] **Step 1: Criar src/entities/enemies/GatoMalencarado.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class GatoMalencarado extends Enemy {
  private patrolStart: number
  private patrolRange: number = 128

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.GATO, 1, 80)
    this.patrolStart = x
    this.setVelocityX(this.speed)
  }

  update(time: number, _delta: number): void {
    if (this.isStunned() || this.isFleeing) return

    // Patrulha dentro do range
    if (this.x > this.patrolStart + this.patrolRange) {
      this.direction = -1
      this.setFlipX(true)
    } else if (this.x < this.patrolStart - this.patrolRange) {
      this.direction = 1
      this.setFlipX(false)
    }
    this.setVelocityX(this.direction * this.speed)
  }
}
```

- [ ] **Step 2: Criar src/entities/enemies/PomboAgitado.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class PomboAgitado extends Enemy {
  private baseY: number
  private pauseTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.POMBO, 1, 100)
    this.baseY = y
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setVelocityX(this.speed)
  }

  update(time: number, _delta: number): void {
    if (this.isStunned() || this.isFleeing) return

    if (time < this.pauseTimer) {
      this.setVelocityX(0)
      return
    }

    // Voa em linha reta, inverte ao atingir bounds ou após distance
    if (this.x < 32) {
      this.direction = 1
      this.setFlipX(false)
      this.pauseTimer = time + 800
    } else if (this.x > this.scene.physics.world.bounds.width - 32) {
      this.direction = -1
      this.setFlipX(true)
      this.pauseTimer = time + 800
    }

    this.setVelocityX(this.direction * this.speed)
    // Leve oscilação vertical
    this.y = this.baseY + Math.sin(time * 0.003) * 12
  }
}
```

- [ ] **Step 3: Criar src/entities/enemies/RatoDeCalcada.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

export class RatoDeCalcada extends Enemy {
  private changeTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RATO, 1, 140)
    this.setVelocityX(this.speed)
  }

  update(time: number, _delta: number): void {
    if (this.isStunned() || this.isFleeing) return

    // Muda de direção aleatoriamente a cada 1-3s
    if (time > this.changeTimer) {
      this.direction *= -1
      this.setFlipX(this.direction === -1)
      this.changeTimer = time + 1000 + Math.random() * 2000
    }

    // Inverte ao bater na parede
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.left)  { this.direction =  1; this.setFlipX(false) }
    if (body.blocked.right) { this.direction = -1; this.setFlipX(true)  }

    this.setVelocityX(this.direction * this.speed)
  }
}
```

- [ ] **Step 4: Criar src/entities/enemies/DonoNervoso.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'

/** Inderrotável — apenas esquivar */
export class DonoNervoso extends Enemy {
  private targetX: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.DONO, 999, 110)
  }

  setTarget(x: number): void {
    this.targetX = x
  }

  takeDamage(_amount: number): void {
    // Inderrotável — ignora dano
    this.setTint(0xffffff)
    this.scene.time.delayedCall(100, () => this.clearTint())
  }

  update(_time: number, _delta: number): void {
    if (this.isStunned()) return

    const dx = this.targetX - this.x
    if (Math.abs(dx) > 8) {
      this.direction = dx > 0 ? 1 : -1
      this.setFlipX(this.direction === -1)
      this.setVelocityX(this.direction * this.speed)
    } else {
      this.setVelocityX(0)
    }
  }
}
```

- [ ] **Step 5: Atualizar GameScene para passar player.x ao DonoNervoso**

Em `GameScene.update()`, após `enemies.forEach(e => e.update(time, delta))`, adicionar:

```typescript
// Dono Nervoso persegue a cachorra ativa
enemies.forEach(e => {
  if (e instanceof DonoNervoso) {
    e.setTarget(this.player.x)
  }
})
```

Adicionar import no topo de `GameScene.ts`:
```typescript
import { DonoNervoso } from '../entities/enemies/DonoNervoso'
```

- [ ] **Step 6: Verificar no navegador**

Rodar `npm run dev`. Fase 1-1 deve mostrar inimigos coloridos se movendo. Gato patrulha, Pombo voa, Rato muda de direção.

- [ ] **Step 7: Commit**

```bash
git add src/entities/enemies/
git commit -m "feat: common enemies — GatoMalencarado, PomboAgitado, RatoDeCalcada, DonoNervoso"
```

---

## Task 8: Sistema de Itens e Power-ups

**Files:**
- Create: `src/items/Bone.ts`
- Create: `src/items/GoldenBone.ts`
- Create: `src/items/PowerUp.ts`
- Create: `src/items/Accessory.ts`
- Create: `src/items/Projectile.ts`

- [ ] **Step 1: Criar src/items/Bone.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class Bone extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.BONE)
    scene.add.existing(this)
    scene.physics.add.existing(this, true) // static body
    this.setData('type', 'bone')
    // Nota: tweens em corpos estáticos dessincronizam a hitbox.
    // Efeito visual de flutuação pode ser adicionado após o MVP usando
    // um sprite separado para visual + corpo estático invisível na posição original.
  }
}
```

- [ ] **Step 2: Criar src/items/GoldenBone.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class GoldenBone extends Phaser.Physics.Arcade.Image {
  boneIndex: number

  constructor(scene: Phaser.Scene, x: number, y: number, index: number) {
    super(scene, x, y, KEYS.GOLDEN_BONE)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.boneIndex = index
    this.setData('type', 'golden_bone')
    this.setScale(1.4)
    // Sem tween — corpo estático. Efeito visual pós-MVP.
  }
}
```

- [ ] **Step 3: Criar src/items/PowerUp.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

const TEXTURES: Record<string, string> = {
  petisco:    KEYS.PETISCO,
  pipoca:     KEYS.PIPOCA,
  pizza:      KEYS.PIZZA,
  churrasco:  KEYS.CHURRASCO,
  bola:       KEYS.BOLA,
  frisbee:    KEYS.FRISBEE,
  surprise_block: KEYS.SURPRISE_BLOCK,
}

export class PowerUp extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
    super(scene, x, y, TEXTURES[type] ?? KEYS.PETISCO)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setData('type', type)

    // Sem tween — corpo estático. Efeito visual pós-MVP.
  }
}
```

- [ ] **Step 4: Criar src/items/Accessory.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'
import type { AccessoryType } from '../GameState'

const TEXTURES: Record<string, string> = {
  laco:    KEYS.LACO,
  coleira: KEYS.COLEIRA,
  chapeu:  KEYS.CHAPEU,
  bandana: KEYS.BANDANA,
}

export class Accessory extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, type: AccessoryType) {
    super(scene, x, y, TEXTURES[type!] ?? KEYS.LACO)
    scene.add.existing(this)
    scene.physics.add.existing(this, true)
    this.setData('type', type)
    // Sem tween — corpo estático. Efeito visual pós-MVP.
  }
}
```

- [ ] **Step 5: Criar src/items/Projectile.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../constants'

export class Projectile extends Phaser.Physics.Arcade.Image {
  private bounces: number
  private maxBounces: number

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    type: 'bola' | 'frisbee',
    dirX: number
  ) {
    const texture = type === 'bola' ? KEYS.BOLA : KEYS.FRISBEE
    super(scene, x, y, texture)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.maxBounces = type === 'bola' ? 0 : 2
    this.bounces = 0

    const body = this.body as Phaser.Physics.Arcade.Body
    body.setAllowGravity(type === 'bola')
    this.setVelocityX(dirX * 400)
    if (type === 'frisbee') this.setVelocityY(-100)

    // Auto-destroy após 3s
    scene.time.delayedCall(3000, () => { if (this.active) this.destroy() })
  }

  onWallHit(): void {
    if (this.bounces >= this.maxBounces) {
      this.destroy()
      return
    }
    this.bounces++
    this.setVelocityX(-this.body!.velocity.x)
  }
}
```

- [ ] **Step 6: Verificar no navegador**

Rodar `npm run dev`. Itens na fase devem aparecer flutuando (bolinhas e quadradinhos coloridos). Coletar osso deve incrementar score no HUD.

- [ ] **Step 7: Commit**

```bash
git add src/items/
git commit -m "feat: items system — Bone, GoldenBone, PowerUp, Accessory, Projectile"
```

---

## Task 9: Boss — Seu Bigodes

**Files:**
- Create: `src/entities/enemies/SeuBigodes.ts`

- [ ] **Step 1: Criar src/entities/enemies/SeuBigodes.ts**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_HEIGHT } from '../../constants'
import { Enemy } from '../Enemy'
import { GatoMalencarado } from './GatoMalencarado'

type BossPhase = 1 | 2 | 3

export class SeuBigodes extends Enemy {
  private phase: BossPhase = 1
  private actionTimer: number = 0
  private jumpCooldown: number = 0
  private minions: GatoMalencarado[] = []

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.BIGODES, 12, 60)
    this.setScale(2)
    // Boss inicia parado
    this.setVelocityX(0)
  }

  update(time: number, _delta: number): void {
    if (this.isStunned()) return

    this._checkPhaseTransition()

    switch (this.phase) {
      case 1: this._phase1(time); break
      case 2: this._phase2(time); break
      case 3: this._phase3(time); break
    }
  }

  private _checkPhaseTransition(): void {
    const maxHp = 12
    const hpPct = this.hp / maxHp
    if (hpPct <= 0.25 && this.phase < 3) {
      this.phase = 3
      this._spawnMinions()
      this.setTint(0xff4444)
    } else if (hpPct <= 0.5 && this.phase < 2) {
      this.phase = 2
      this.setTint(0xff8800)
    }
  }

  /** Fase 1: joga lixo em arco periodicamente */
  private _phase1(time: number): void {
    // Move lentamente de um lado ao outro
    const body = this.body as Phaser.Physics.Arcade.Body
    if (body.blocked.left)  this.setVelocityX( this.speed)
    if (body.blocked.right) this.setVelocityX(-this.speed)
    if (body.velocity.x === 0) this.setVelocityX(this.speed)

    // Lança projétil a cada 2s
    if (time > this.actionTimer) {
      this._throwDebris()
      this.actionTimer = time + 2000
    }
  }

  /** Fase 2: pula entre plataformas */
  private _phase2(time: number): void {
    this._phase1(time) // mantém arremesso

    if (time > this.jumpCooldown) {
      const body = this.body as Phaser.Physics.Arcade.Body
      if (body.blocked.down) {
        this.setVelocityY(-550)
        // Câmera shake ao pousar
        this.scene.time.delayedCall(600, () => {
          this.scene.cameras.main.shake(150, 0.008)
        })
      }
      this.jumpCooldown = time + 2500
    }
  }

  /** Fase 3: igual à fase 2 mas mais rápido + convoca reforços */
  private _phase3(time: number): void {
    this.speed = 100
    this._phase2(time)

    // Remove minions mortos da lista
    this.minions = this.minions.filter(m => m.active)
  }

  private _throwDebris(): void {
    if (!this.scene || !this.active) return
    // Cria projétil simples (quadrado cinza)
    const debris = this.scene.add.rectangle(this.x, this.y - 20, 14, 14, 0x888888)
    this.scene.physics.add.existing(debris)
    const body = debris.body as Phaser.Physics.Arcade.Body
    const dir = Math.random() < 0.5 ? -1 : 1
    body.setVelocity(dir * 180, -400)
    this.scene.time.delayedCall(2500, () => { if (debris.active) debris.destroy() })
  }

  private _spawnMinions(): void {
    for (let i = 0; i < 2; i++) {
      const mx = this.x + (i === 0 ? -100 : 100)
      const gato = new GatoMalencarado(this.scene, mx, this.y)
      this.minions.push(gato)
      // Emite evento para GameScene adicionar ao grupo de inimigos
      this.emit('spawnMinion', gato)
    }
  }

  takeDamage(amount: number = 1): void {
    super.takeDamage(amount)
  }

  protected onDeath(): void {
    // Animação de derrota antes de destruir
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 3,
      scaleY: 0.2,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        this.emit('died', this)
        this.destroy()
      }
    })
  }
}
```

- [ ] **Step 2: Conectar evento spawnMinion no GameScene**

Em `GameScene._spawnEnemies()`, após criar o boss, adicionar:

```typescript
boss.on('spawnMinion', (minion: Enemy) => {
  this.enemyGroup.add(minion)
  minion.on('died', () => { gameState.addScore(50) })
})
```

- [ ] **Step 3: Verificar no navegador**

Completar fases 1-1, 1-2, 1-3 (ou editar `gameState.currentLevel = '1-boss'` temporariamente em `main.ts`).
Expected: Boss aparece, se move, joga detritos em arco. Ao levar dano muda de cor nas transições de fase.

- [ ] **Step 4: Commit**

```bash
git add src/entities/enemies/SeuBigodes.ts src/scenes/GameScene.ts
git commit -m "feat: SeuBigodes boss with 3 phases, minion spawning and death animation"
```

---

## Task 10: Menus Finais e Polimento

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/LevelCompleteScene.ts`
- Modify: `src/scenes/GalleryScene.ts`

- [ ] **Step 1: Atualizar MenuScene com botão Galeria**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT } from '../constants'
import { gameState } from '../GameState'

export class MenuScene extends Phaser.Scene {
  constructor() { super(KEYS.MENU) }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e')

    // Título animado
    const title = this.add.text(GAME_WIDTH / 2, 120, 'RAYA & CRUELLA', {
      fontSize: '52px',
      color: '#ff6b6b',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.tweens.add({
      targets: title,
      y: 110,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.add.text(GAME_WIDTH / 2, 185, 'Aventura no Bairro', {
      fontSize: '20px', color: '#aaaaaa'
    }).setOrigin(0.5)

    // Botão Jogar
    const playBtn = this.add.text(GAME_WIDTH / 2, 270, '[ ENTER — JOGAR ]', {
      fontSize: '26px', color: '#ffff00', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive()

    this.tweens.add({
      targets: playBtn, alpha: 0.2,
      duration: 600, yoyo: true, repeat: -1
    })

    // Botão Galeria
    const galBtn = this.add.text(GAME_WIDTH / 2, 330, '[ G — GALERIA DE OSSOS ]', {
      fontSize: '18px', color: '#88ccff'
    }).setOrigin(0.5).setInteractive()

    // Controles
    this.add.text(GAME_WIDTH / 2, 410, '← → Mover   ESPAÇO Pular   SHIFT Habilidade   TAB Trocar cachorra', {
      fontSize: '12px', color: '#666666'
    }).setOrigin(0.5)

    const kb = this.input.keyboard!
    kb.on('keydown-ENTER', () => {
      gameState.reset()
      gameState.currentLevel = '1-1'
      this.scene.start(KEYS.GAME)
    })
    kb.on('keydown-G', () => { this.scene.start(KEYS.GALLERY) })
    playBtn.on('pointerdown', () => {
      gameState.reset()
      gameState.currentLevel = '1-1'
      this.scene.start(KEYS.GAME)
    })
    galBtn.on('pointerdown', () => { this.scene.start(KEYS.GALLERY) })
  }
}
```

- [ ] **Step 2: Verificar tela completa no navegador**

`npm run dev` — menu deve mostrar título animado piscante, dois botões funcionais.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/
git commit -m "feat: complete MenuScene with animated title, play and gallery buttons"
```

---

## Task 11: Build e Deploy para GitHub Pages

**Files:**
- (nenhum arquivo novo — apenas validação do pipeline)

- [ ] **Step 1: Verificar build de produção local**

```bash
npm run build
```

Expected: pasta `dist/` criada sem erros TypeScript. Arquivos `dist/index.html` e `dist/assets/` presentes.

- [ ] **Step 2: Testar build localmente**

```bash
npm run preview
```

Abrir URL exibida (normalmente `http://localhost:4173/game-cruella-e-raya/`).
Expected: jogo rodando igual ao dev, sem erros de console.

- [ ] **Step 3: Criar repositório no GitHub e fazer push**

```bash
git remote add origin https://github.com/<SEU_USUARIO>/game-cruella-e-raya.git
git push -u origin main
```

- [ ] **Step 4: Ativar GitHub Pages no repositório**

1. No repositório GitHub: Settings → Pages
2. Source: **GitHub Actions**
3. Salvar

- [ ] **Step 5: Verificar deploy automático**

Após o push, ir em Actions no GitHub e acompanhar o workflow `Deploy to GitHub Pages`.
Expected: workflow passa com sucesso e URL pública fica disponível em `https://<SEU_USUARIO>.github.io/game-cruella-e-raya/`.

- [ ] **Step 6: Commit final**

```bash
git add .
git commit -m "chore: verify production build and GitHub Pages deploy"
git push
```

---

## Checklist de Cobertura da Spec

| Requisito | Task |
|-----------|------|
| Phaser 3 + TypeScript + Vite | Task 1 |
| GitHub Pages via Actions | Task 1, 11 |
| GameState testável | Task 2 |
| BootScene com placeholders | Task 3 |
| Troca Raya ↔ Cruella (Tab, cooldown 1.5s) | Task 4 |
| Raya: velocidade +20%, pulo duplo, dash | Task 4 |
| Cruella: resistência, latido, intimidação | Task 4 |
| Ghost sprite da cachorra inativa | Task 4 |
| Bloqueio de troca pós-hit (2s) | Task 2, 4 |
| Tilemap 2D, câmera seguindo player | Task 5 |
| 3 fases + boss no Mundo 1 | Task 5 |
| Checkpoint (hidrante) | Task 5 |
| Saída da fase (portão) | Task 5 |
| 3 ossos dourados secretos por fase | Task 5 |
| HUD: corações, score, cooldown, acessório | Task 6 |
| GatoMalencarado (patrulha, foge de Cruella) | Task 7 |
| PomboAgitado (voo linear) | Task 7 |
| RatoDeCalcada (rápido, muda direção) | Task 7 |
| DonoNervoso (inderrotável, persegue) | Task 7 |
| Osso comum (+10 pts) | Task 8 |
| Power-ups temporários (petisco, pipoca, pizza, churrasco) | Task 8 |
| Bola de tênis e frisbee arremessáveis | Task 8 |
| Acessórios equipáveis (laço, coleira, chapéu, bandana) | Task 8 |
| Boss Seu Bigodes — 3 fases | Task 9 |
| Colar de Ouro (drop do boss) | Task 5, 9 |
| Menu principal com animação | Task 10 |
| Tela Game Over | Task 3 (stub), Task 10 |
| Tela Fase Concluída | Task 3 (stub) |
| Tela de Pausa (ESC) | Task 3 (stub) |
| Galeria de ossos dourados | Task 3 (stub), Task 10 |
