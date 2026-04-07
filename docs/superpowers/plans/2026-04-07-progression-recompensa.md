# Progressão & Recompensa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar perfis de jogador persistentes, mapa de mundo estilo Mario World, medalhas por fase e histórico completo de estatísticas via `localStorage`.

**Architecture:** Um `ProfileManager` centralizado é o único módulo que lê/escreve `localStorage`. Duas novas cenas (`ProfileSelectScene`, `WorldMapScene`) são adicionadas ao fluxo. `LevelCompleteScene` é reescrita para exibir medalha animada + stats e delegar o save ao `ProfileManager`. `GameState` ganha três contadores de sessão que são lidos ao final de cada fase.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest (testes em Node com mock de localStorage)

---

## Mapa de Arquivos

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/storage/ProfileManager.ts` | Criar | CRUD de perfis + cálculo de medalha |
| `src/scenes/ProfileSelectScene.ts` | Criar | Tela de seleção/criação de perfil |
| `src/scenes/WorldMapScene.ts` | Criar | Mapa de mundo com nós por fase |
| `tests/ProfileManager.test.ts` | Criar | Testes do ProfileManager |
| `tests/GameState.test.ts` | Modificar | Adicionar testes dos contadores de sessão |
| `src/GameState.ts` | Modificar | +3 contadores de sessão |
| `src/constants.ts` | Modificar | +PROFILE_SELECT, +WORLD_MAP, +MEDAL_THRESHOLDS |
| `src/scenes/BootScene.ts` | Modificar | Redireciona para ProfileSelect se sem perfil |
| `src/scenes/MenuScene.ts` | Modificar | "Jogar" → WorldMap; adiciona "Trocar Perfil" |
| `src/scenes/GameScene.ts` | Modificar | Conta mortes/kills; passa stats para LevelComplete |
| `src/scenes/LevelCompleteScene.ts` | Modificar | Medalha animada, stats, save no ProfileManager |
| `src/scenes/GameOverScene.ts` | Modificar | ESC → WorldMapScene |
| `src/main.ts` | Modificar | Registra ProfileSelectScene e WorldMapScene |

---

## Task 1: ProfileManager — tipos, storage e API

**Files:**
- Create: `src/storage/ProfileManager.ts`
- Create: `tests/ProfileManager.test.ts`

- [ ] **Step 1: Criar `src/storage/ProfileManager.ts`**

```typescript
import { DogType } from '../GameState'

export type Medal = 'gold' | 'silver' | 'bronze'

export interface LevelRecord {
  completed: boolean
  medal: Medal | null
  bestScore: number
  bestTime: number          // segundos
  goldenBones: boolean[]    // [bone0, bone1, bone2]
  totalDeaths: number
  totalEnemiesKilled: number
  playCount: number
}

export interface PlayerProfile {
  id: string                // Date.now().toString()
  name: string
  dog: DogType
  createdAt: number
  lastPlayedAt: number
  currentLevel: string
  totalScore: number
  levels: Record<string, LevelRecord>
}

const STORAGE_KEY        = 'rcgame_profiles'
const ACTIVE_KEY         = 'rcgame_active_profile'
const MAX_PROFILES       = 3
const DEFAULT_LEVEL      = '0-1'
const STARTING_LEVELS    = ['0-1', '1-1']

export class ProfileManager {
  // ── Leitura ──────────────────────────────────────────────────────────

  getAll(): PlayerProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PlayerProfile[]) : []
    } catch {
      return []
    }
  }

  getActive(): PlayerProfile | null {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (!id) return null
    return this.getAll().find(p => p.id === id) ?? null
  }

  // ── Gestão de perfis ─────────────────────────────────────────────────

  create(name: string, dog: DogType): PlayerProfile {
    const all = this.getAll()
    if (all.length >= MAX_PROFILES) {
      throw new Error(`Limite de ${MAX_PROFILES} perfis atingido`)
    }
    const profile: PlayerProfile = {
      id: Date.now().toString(),
      name: name.trim() || 'Jogador',
      dog,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      currentLevel: DEFAULT_LEVEL,
      totalScore: 0,
      levels: {},
    }
    // Desbloqueia fases iniciais
    STARTING_LEVELS.forEach(lv => {
      profile.levels[lv] = this._emptyRecord()
    })
    all.push(profile)
    this._persist(all)
    this.setActive(profile.id)
    return profile
  }

  setActive(id: string): void {
    localStorage.setItem(ACTIVE_KEY, id)
    // Atualiza lastPlayedAt
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx !== -1) {
      all[idx].lastPlayedAt = Date.now()
      this._persist(all)
    }
  }

  delete(id: string): void {
    const all = this.getAll().filter(p => p.id !== id)
    this._persist(all)
    // Se era o ativo, limpa
    if (localStorage.getItem(ACTIVE_KEY) === id) {
      localStorage.removeItem(ACTIVE_KEY)
    }
  }

  // ── Progresso ────────────────────────────────────────────────────────

  saveLevel(levelId: string, record: LevelRecord): void {
    const all   = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return

    const existing = all[idx].levels[levelId]
    const merged: LevelRecord = {
      completed:          true,
      medal:              this._bestMedal(existing?.medal ?? null, record.medal),
      bestScore:          Math.max(existing?.bestScore ?? 0, record.bestScore),
      bestTime:           existing?.bestTime
                            ? Math.min(existing.bestTime, record.bestTime)
                            : record.bestTime,
      goldenBones:        (existing?.goldenBones ?? [false, false, false]).map(
                            (prev, i) => prev || (record.goldenBones[i] ?? false)
                          ),
      totalDeaths:        (existing?.totalDeaths ?? 0) + record.totalDeaths,
      totalEnemiesKilled: (existing?.totalEnemiesKilled ?? 0) + record.totalEnemiesKilled,
      playCount:          (existing?.playCount ?? 0) + 1,
    }
    all[idx].levels[levelId] = merged
    all[idx].totalScore      = Math.max(all[idx].totalScore, record.bestScore)
    all[idx].currentLevel    = levelId
    all[idx].lastPlayedAt    = Date.now()
    this._persist(all)
  }

  unlockLevel(levelId: string): void {
    const all   = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return
    if (!all[idx].levels[levelId]) {
      all[idx].levels[levelId] = this._emptyRecord()
    }
    this._persist(all)
  }

  isUnlocked(levelId: string): boolean {
    const profile = this.getActive()
    if (!profile) return STARTING_LEVELS.includes(levelId)
    return !!profile.levels[levelId]
  }

  getMedal(levelId: string): Medal | null {
    return this.getActive()?.levels[levelId]?.medal ?? null
  }

  // ── Cálculo de medalha (estático, sem efeito colateral) ──────────────

  static calcMedal(
    score: number,
    bones: boolean[],
    deaths: number,
    maxScore: number,
  ): Medal | null {
    if (maxScore <= 0) return 'bronze'
    const bonesCount = bones.filter(Boolean).length
    const ratio      = score / maxScore

    if (bonesCount === 3 && ratio >= 0.8 && deaths === 0) return 'gold'
    if (bonesCount >= 2 || (ratio >= 0.6 && deaths <= 2))  return 'silver'
    return 'bronze'
  }

  // ── Privados ─────────────────────────────────────────────────────────

  private _emptyRecord(): LevelRecord {
    return {
      completed: false, medal: null, bestScore: 0, bestTime: 0,
      goldenBones: [false, false, false],
      totalDeaths: 0, totalEnemiesKilled: 0, playCount: 0,
    }
  }

  private _bestMedal(a: Medal | null, b: Medal | null): Medal | null {
    const rank: Record<string, number> = { gold: 3, silver: 2, bronze: 1 }
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b
  }

  private _persist(profiles: PlayerProfile[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  }
}

export const profileManager = new ProfileManager()
```

- [ ] **Step 2: Criar `tests/ProfileManager.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { ProfileManager } from '../src/storage/ProfileManager'

// Mock localStorage para ambiente Node
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem:    (k: string) => storage[k] ?? null,
  setItem:    (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear:      () => { Object.keys(storage).forEach(k => delete storage[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('ProfileManager', () => {
  let pm: ProfileManager

  beforeEach(() => {
    localStorageMock.clear()
    pm = new ProfileManager()
  })

  it('getAll retorna [] sem dados', () => {
    expect(pm.getAll()).toEqual([])
  })

  it('getActive retorna null sem perfil', () => {
    expect(pm.getActive()).toBeNull()
  })

  it('create cria perfil e o torna ativo', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.name).toBe('Hugo')
    expect(p.dog).toBe('raya')
    expect(pm.getActive()?.id).toBe(p.id)
  })

  it('create desbloqueia fases iniciais', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.levels['0-1']).toBeDefined()
    expect(p.levels['1-1']).toBeDefined()
  })

  it('lança erro ao exceder 3 perfis', () => {
    pm.create('A', 'raya')
    pm.create('B', 'cruella')
    pm.create('C', 'raya')
    expect(() => pm.create('D', 'cruella')).toThrow()
  })

  it('delete remove perfil e limpa ativo se necessário', () => {
    const p = pm.create('Hugo', 'raya')
    pm.delete(p.id)
    expect(pm.getAll()).toHaveLength(0)
    expect(pm.getActive()).toBeNull()
  })

  it('isUnlocked retorna false para fase não desbloqueada', () => {
    pm.create('Hugo', 'raya')
    expect(pm.isUnlocked('1-3')).toBe(false)
  })

  it('unlockLevel desbloqueia fase', () => {
    pm.create('Hugo', 'raya')
    pm.unlockLevel('1-3')
    expect(pm.isUnlocked('1-3')).toBe(true)
  })

  it('saveLevel persiste recorde e acumula stats', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 1500, bestTime: 90,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 7, playCount: 1,
    })
    const profile = pm.getActive()!
    expect(profile.levels['1-1'].bestScore).toBe(1500)
    expect(profile.levels['1-1'].medal).toBe('gold')
    expect(profile.levels['1-1'].goldenBones).toEqual([true, true, true])
  })

  it('saveLevel mantém melhor score entre runs', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'bronze', bestScore: 800, bestTime: 120,
      goldenBones: [true, false, false], totalDeaths: 2, totalEnemiesKilled: 3, playCount: 1,
    })
    pm.saveLevel('1-1', {
      completed: true, medal: 'silver', bestScore: 1200, bestTime: 100,
      goldenBones: [false, true, false], totalDeaths: 1, totalEnemiesKilled: 5, playCount: 1,
    })
    const lvl = pm.getActive()!.levels['1-1']
    expect(lvl.bestScore).toBe(1200)
    expect(lvl.medal).toBe('silver')
    // OR das golden bones entre runs
    expect(lvl.goldenBones).toEqual([true, true, false])
    // acumula mortes
    expect(lvl.totalDeaths).toBe(3)
  })

  it('saveLevel não rebaixa medalha ouro→prata', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 1900, bestTime: 80,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 7, playCount: 1,
    })
    pm.saveLevel('1-1', {
      completed: true, medal: 'silver', bestScore: 1000, bestTime: 150,
      goldenBones: [false, false, false], totalDeaths: 3, totalEnemiesKilled: 3, playCount: 1,
    })
    expect(pm.getActive()!.levels['1-1'].medal).toBe('gold')
  })

  it('getMedal retorna null para fase sem recorde', () => {
    pm.create('Hugo', 'raya')
    expect(pm.getMedal('1-2')).toBeNull()
  })
})

describe('ProfileManager.calcMedal', () => {
  it('ouro: 3 bones + score≥80% + 0 mortes', () => {
    expect(ProfileManager.calcMedal(1600, [true,true,true], 0, 2000)).toBe('gold')
  })

  it('não ouro se morreu mesmo com bones e score alto', () => {
    expect(ProfileManager.calcMedal(1600, [true,true,true], 1, 2000)).toBe('silver')
  })

  it('prata: 2 bones', () => {
    expect(ProfileManager.calcMedal(400, [true,true,false], 5, 2000)).toBe('silver')
  })

  it('prata: score≥60% e ≤2 mortes', () => {
    expect(ProfileManager.calcMedal(1200, [false,false,false], 2, 2000)).toBe('silver')
  })

  it('não prata: score≥60% mas 3 mortes', () => {
    expect(ProfileManager.calcMedal(1200, [false,false,false], 3, 2000)).toBe('bronze')
  })

  it('bronze: qualquer conclusão', () => {
    expect(ProfileManager.calcMedal(100, [false,false,false], 10, 2000)).toBe('bronze')
  })
})
```

- [ ] **Step 3: Rodar testes e verificar que passam**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
npm test -- tests/ProfileManager.test.ts
```

Esperado: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add src/storage/ProfileManager.ts tests/ProfileManager.test.ts
git commit -m "feat: add ProfileManager with localStorage CRUD and medal logic"
```

---

## Task 2: GameState — contadores de sessão

**Files:**
- Modify: `src/GameState.ts`
- Modify: `tests/GameState.test.ts`

- [ ] **Step 1: Adicionar campos em `GameState.ts`**

Após a linha `abilityUsedAt: number = 0`:

```typescript
  sessionDeaths: number = 0
  sessionEnemiesKilled: number = 0
  sessionStartTime: number = 0
```

Na função `resetLevel()`, adicionar ao final do bloco (antes do comentário `// keeps:`):

```typescript
    this.sessionDeaths = 0
    this.sessionEnemiesKilled = 0
    this.sessionStartTime = Date.now()
```

Na função `reset()`, adicionar ao final (antes do comentário `// muted é uma preferência`):

```typescript
    this.sessionDeaths = 0
    this.sessionEnemiesKilled = 0
    this.sessionStartTime = 0
```

- [ ] **Step 2: Adicionar testes em `tests/GameState.test.ts`**

Adicionar dentro do `describe('GameState', ...)` existente, antes do último `})`:

```typescript
  describe('contadores de sessão', () => {
    it('começa zerados', () => {
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBe(0)
    })

    it('resetLevel zera contadores e define sessionStartTime', () => {
      state.sessionDeaths = 3
      state.sessionEnemiesKilled = 7
      const before = Date.now()
      state.resetLevel()
      const after = Date.now()
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBeGreaterThanOrEqual(before)
      expect(state.sessionStartTime).toBeLessThanOrEqual(after)
    })

    it('reset zera contadores de sessão', () => {
      state.sessionDeaths = 5
      state.sessionEnemiesKilled = 10
      state.sessionStartTime = 999999
      state.reset()
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBe(0)
    })
  })
```

- [ ] **Step 3: Rodar testes**

```bash
npm test -- tests/GameState.test.ts
```

Esperado: todos os testes passam (incluindo os existentes).

- [ ] **Step 4: Commit**

```bash
git add src/GameState.ts tests/GameState.test.ts
git commit -m "feat: add session counters (deaths, enemiesKilled, startTime) to GameState"
```

---

## Task 3: constants.ts — chaves e thresholds

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Adicionar chaves de cena e thresholds**

No objeto `KEYS`, após `LEVEL_INTRO: 'LevelIntroScene'`:

```typescript
  PROFILE_SELECT: 'ProfileSelectScene',
  WORLD_MAP:      'WorldMapScene',
```

Após o bloco `export const SCORING = { ... } as const`, adicionar:

```typescript
/**
 * Score máximo teórico por fase (inimigos × 50 + ossos × 10 + golden bones × 500).
 * Usado por ProfileManager.calcMedal() para determinar medalha de ouro/prata.
 */
export const MEDAL_THRESHOLDS: Record<string, number> = {
  '0-1':    1690,  // 3 inimigos×50 + 4 ossos×10 + 3 golden×500
  '0-boss':  500,  // boss Aspirador apenas
  '1-1':    1950,  // 7 inimigos×50 + 5 ossos×10 + 3 golden×500
  '1-2':    1950,  // 8 inimigos×50 + 5 ossos×10 + 3 golden×500
  '1-3':    2050,  // 9 inimigos×50 + 5 ossos×10 + 3 golden×500
  '1-boss': 1200,  // boss Seu Bigodes + minions estimados
}
```

- [ ] **Step 2: Verificar que o projeto compila sem erros**

```bash
npm run build 2>&1 | tail -20
```

Esperado: build sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: add PROFILE_SELECT, WORLD_MAP keys and MEDAL_THRESHOLDS to constants"
```

---

## Task 4: BootScene — redireciona para ProfileSelect

**Files:**
- Modify: `src/scenes/BootScene.ts` (linha 916)

- [ ] **Step 1: Adicionar import do profileManager**

Na linha 1 de `BootScene.ts`, após os imports existentes, adicionar:

```typescript
import { profileManager } from '../storage/ProfileManager'
```

- [ ] **Step 2: Substituir a linha 916**

Localizar:
```typescript
    this.scene.start(KEYS.MENU)
```

Substituir por:
```typescript
    if (profileManager.getActive() === null) {
      this.scene.start(KEYS.PROFILE_SELECT)
    } else {
      this.scene.start(KEYS.MENU)
    }
```

- [ ] **Step 3: Verificar que o projeto compila sem erros de tipo**

```bash
npm run build 2>&1 | grep -E "error|warning" | head -20
```

Esperado: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: redirect to ProfileSelectScene on first boot if no active profile"
```

---

## Task 5: ProfileSelectScene + registro em main.ts

**Files:**
- Create: `src/scenes/ProfileSelectScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar `src/scenes/ProfileSelectScene.ts`**

```typescript
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

    const cleanup = () => {
      overlay.destroy(); yesBtn.destroy(); noBtn.destroy()
      confirmTxt.destroy()
    }
    const confirmTxt = this.add.text(cx, 180, '', {}).setDepth(11) // placeholder

    yesBtn.on('pointerdown', () => {
      cleanup()
      profileManager.delete(profile.id)
      this._profiles = profileManager.getAll()
      this._renderSlots()
    })
    noBtn.on('pointerdown', cleanup)

    const kb = this.input.keyboard!
    const onS = () => { cleanup(); profileManager.delete(profile.id); this._profiles = profileManager.getAll(); this._renderSlots() }
    const onN = () => cleanup()
    kb.once('keydown-S', onS)
    kb.once('keydown-N', onN)
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
```

- [ ] **Step 2: Registrar em `src/main.ts`**

Adicionar import após os imports existentes:

```typescript
import { ProfileSelectScene } from './scenes/ProfileSelectScene'
```

Adicionar `ProfileSelectScene` no array `scene:` antes de `BootScene`:

```typescript
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene,
    GameOverScene,
    LevelCompleteScene,
    PauseScene,
    GalleryScene,
    HowToPlayScene,
    IntroCrawlScene,
    CharacterSelectScene,
    EnemyInfoScene,
    LevelIntroScene,
    ProfileSelectScene,
  ],
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/ProfileSelectScene.ts src/main.ts
git commit -m "feat: add ProfileSelectScene with create, select and delete profile UI"
```

---

## Task 6: WorldMapScene + registro em main.ts

**Files:**
- Create: `src/scenes/WorldMapScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Criar `src/scenes/WorldMapScene.ts`**

```typescript
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
```

- [ ] **Step 2: Registrar em `src/main.ts`**

Adicionar import:

```typescript
import { WorldMapScene } from './scenes/WorldMapScene'
```

Adicionar `WorldMapScene` no array `scene:`:

```typescript
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    UIScene,
    GameOverScene,
    LevelCompleteScene,
    PauseScene,
    GalleryScene,
    HowToPlayScene,
    IntroCrawlScene,
    CharacterSelectScene,
    EnemyInfoScene,
    LevelIntroScene,
    ProfileSelectScene,
    WorldMapScene,
  ],
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/WorldMapScene.ts src/main.ts
git commit -m "feat: add WorldMapScene with node-based level navigation and medal display"
```

---

## Task 7: GameScene — rastreamento de stats + novo handoff para LevelComplete

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar import do profileManager**

Adicionar no topo de `GameScene.ts`, após os imports existentes:

```typescript
import { profileManager } from '../storage/ProfileManager'
```

- [ ] **Step 2: Incrementar `sessionDeaths` quando o jogador morre**

Localizar `_gameOver()`:

```typescript
  private _gameOver(): void {
    if (this._gameOverPending) return
    this._gameOverPending = true
    this.scene.stop(KEYS.UI)
    this.scene.start(KEYS.GAME_OVER)
  }
```

Substituir por:

```typescript
  private _gameOver(): void {
    if (this._gameOverPending) return
    this._gameOverPending = true
    gameState.sessionDeaths++
    this.scene.stop(KEYS.UI)
    this.scene.start(KEYS.GAME_OVER)
  }
```

- [ ] **Step 3: Incrementar `sessionEnemiesKilled` quando inimigo morre**

Localizar todas as chamadas `gameState.addScore(SCORING.ENEMY_KILL)` em `_setupCollisions()` e `_spawnEnemies()`. Cada bloco de `enemy.on('died', ...)` que chama `addScore(SCORING.ENEMY_KILL)` ou `addScore(50)` deve também incrementar `sessionEnemiesKilled`.

Localizar (há múltiplas ocorrências — adicionar em todas elas):

```typescript
            gameState.addScore(SCORING.ENEMY_KILL)
```

Substituir todas as ocorrências que representam kill de inimigo padrão (NÃO os bosses) por:

```typescript
            gameState.addScore(SCORING.ENEMY_KILL)
            gameState.sessionEnemiesKilled++
```

Para kills de inimigo via dash em `_setupCollisions()`:

```typescript
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (this.player.raya.getIsDashing()) {
        e.takeDamage(1)
        this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      }
    })
```

Substituir por:

```typescript
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (this.player.raya.getIsDashing()) {
        const wasDead = !e.active
        e.takeDamage(1)
        if (!wasDead && !e.active) {
          gameState.addScore(SCORING.ENEMY_KILL)
          gameState.sessionEnemiesKilled++
        }
        this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
      }
    })
```

- [ ] **Step 4: Modificar `_levelComplete()` para passar stats**

Localizar:

```typescript
  private _levelComplete(): void {
    this.scene.stop(KEYS.UI)
    if (this.currentLevel.nextLevel) {
      gameState.currentLevel = this.currentLevel.nextLevel
      gameState.checkpointReached = false
    }
    this.scene.start(KEYS.LEVEL_COMPLETE, {
      score: gameState.score,
      bones: Object.values(gameState.goldenBones).flat().filter(Boolean).length,
    })
  }
```

Substituir por:

```typescript
  private _levelComplete(): void {
    this.scene.stop(KEYS.UI)
    const levelId = this.currentLevel.id
    const nextLevel = this.currentLevel.nextLevel
    const goldenBones = gameState.goldenBones[levelId] ?? [false, false, false]
    const elapsedMs = gameState.sessionStartTime > 0
      ? Date.now() - gameState.sessionStartTime
      : 0

    this.scene.start(KEYS.LEVEL_COMPLETE, {
      score:         gameState.score,
      time:          elapsedMs,
      goldenBones,
      deaths:        gameState.sessionDeaths,
      enemiesKilled: gameState.sessionEnemiesKilled,
      levelId,
      nextLevel,
    })
  }
```

- [ ] **Step 5: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: track sessionDeaths, sessionEnemiesKilled; pass full stats to LevelCompleteScene"
```

---

## Task 8: LevelCompleteScene — medalha animada, stats e save

**Files:**
- Modify: `src/scenes/LevelCompleteScene.ts`

- [ ] **Step 1: Reescrever `LevelCompleteScene.ts` inteiro**

```typescript
import Phaser from 'phaser'
import { KEYS, GAME_WIDTH, GAME_HEIGHT, MEDAL_THRESHOLDS } from '../constants'
import { gameState } from '../GameState'
import { profileManager, LevelRecord } from '../storage/ProfileManager'
import { ProfileManager } from '../storage/ProfileManager'
import { SoundManager } from '../audio/SoundManager'

interface LevelCompleteData {
  score:         number
  time:          number       // ms
  goldenBones:   boolean[]
  deaths:        number
  enemiesKilled: number
  levelId:       string
  nextLevel:     string | null
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() { super(KEYS.LEVEL_COMPLETE) }

  create(data: LevelCompleteData): void {
    const score         = data?.score         ?? gameState.score
    const timeMs        = data?.time          ?? 0
    const goldenBones   = data?.goldenBones   ?? [false, false, false]
    const deaths        = data?.deaths        ?? 0
    const enemiesKilled = data?.enemiesKilled ?? 0
    const levelId       = data?.levelId       ?? gameState.currentLevel
    const nextLevel     = data?.nextLevel     ?? null

    const elapsedSec    = Math.floor(timeMs / 1000)
    const maxScore      = MEDAL_THRESHOLDS[levelId] ?? 2000
    const medal         = ProfileManager.calcMedal(score, goldenBones, deaths, maxScore)
    const existing      = profileManager.getActive()?.levels[levelId]
    const isNewRecord   = score > (existing?.bestScore ?? 0)

    const cx = GAME_WIDTH / 2

    this.cameras.main.setBackgroundColor('#001a00')

    // ── Confetti particles ─────────────────────────────────────────────
    type Conf = { x: number; y: number; vx: number; vy: number; col: number; r: number; rot: number; rotV: number }
    const confGfx = this.add.graphics()
    const CONF_COLS = [0xffff00, 0xff88ff, 0x88ffff, 0xff8800, 0x88ff88, 0xff4466]
    const confs: Conf[] = []
    for (let i = 0; i < 70; i++) {
      confs.push({
        x:    Phaser.Math.Between(0, GAME_WIDTH),
        y:    Phaser.Math.Between(-40, -200),
        vx:   Phaser.Math.FloatBetween(-0.5, 0.5),
        vy:   Phaser.Math.FloatBetween(0.6, 1.8),
        col:  Phaser.Math.RND.pick(CONF_COLS),
        r:    Phaser.Math.FloatBetween(2.5, 5),
        rot:  0,
        rotV: Phaser.Math.FloatBetween(-3, 3),
      })
    }
    this.events.on('update', (_: number, delta: number) => {
      confGfx.clear()
      confs.forEach(c => {
        c.y += c.vy * delta * 0.07
        c.x += c.vx * delta * 0.04
        c.rot += c.rotV * delta * 0.003
        if (c.y > GAME_HEIGHT + 10) { c.y = -10; c.x = Phaser.Math.Between(0, GAME_WIDTH) }
        confGfx.fillStyle(c.col, 0.85)
        const hw = c.r, hh = c.r * 0.5
        const cos = Math.cos(c.rot), sin = Math.sin(c.rot)
        confGfx.fillTriangle(
          c.x + cos*hw - sin*hh, c.y + sin*hw + cos*hh,
          c.x - cos*hw - sin*hh, c.y - sin*hw + cos*hh,
          c.x - cos*hw + sin*hh, c.y - sin*hw - cos*hh,
        )
        confGfx.fillTriangle(
          c.x + cos*hw - sin*hh, c.y + sin*hw + cos*hh,
          c.x - cos*hw + sin*hh, c.y - sin*hw - cos*hh,
          c.x + cos*hw + sin*hh, c.y + sin*hw - cos*hh,
        )
      })
    })

    // ── Título ────────────────────────────────────────────────────────
    const titleTxt = this.add.text(cx, 46, 'FASE CONCLUÍDA! 🏠', {
      fontSize: '36px', color: '#ffff00', fontStyle: 'bold',
      stroke: '#005500', strokeThickness: 4,
    }).setOrigin(0.5).setScale(0.4)
    this.tweens.add({ targets: titleTxt, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut' })

    this.add.text(cx, 82, `${levelId}  —  ${gameState.currentLevel}`, {
      fontSize: '13px', color: '#44ff88',
    }).setOrigin(0.5)

    // ── Medalha animada ───────────────────────────────────────────────
    const medalMap: Record<string, string> = { gold: '🥇', silver: '🥈', bronze: '🥉' }
    const medalNameMap: Record<string, string> = { gold: 'MEDALHA DE OURO', silver: 'MEDALHA DE PRATA', bronze: 'MEDALHA DE BRONZE' }
    const medalTxt = this.add.text(cx, 130, medal ? medalMap[medal] : '🏅', {
      fontSize: '52px',
    }).setOrigin(0.5).setScale(0).setAlpha(0)

    this.tweens.add({
      targets: medalTxt, scaleX: 1, scaleY: 1, alpha: 1,
      delay: 300, duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        this.cameras.main.flash(120, 255, 215, 0, false)
        this.tweens.add({ targets: medalTxt, scaleX: 1.08, scaleY: 1.08, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
      },
    })

    this.add.text(cx, 180, medal ? medalNameMap[medal] : '', {
      fontSize: '13px', color: medal === 'gold' ? '#f0c040' : medal === 'silver' ? '#c0d8f0' : '#e0a060',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0)
    this.tweens.add({ targets: this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text, alpha: 1, delay: 700, duration: 300 })

    // ── Golden Bones ──────────────────────────────────────────────────
    const boneY = 205
    for (let b = 0; b < 3; b++) {
      const bx = cx + (b - 1) * 50
      const collected = goldenBones[b] ?? false
      this.add.text(bx, boneY, collected ? '⭐' : '☆', {
        fontSize: '28px', color: collected ? '#ffd700' : '#223322',
      }).setOrigin(0.5).setAlpha(0)
      const bone = this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text
      this.tweens.add({ targets: bone, alpha: 1, delay: 900 + b * 150, duration: 250 })
    }

    // ── Painel de stats ───────────────────────────────────────────────
    const panelX = cx - 140, panelY = 238, panelW = 280, panelH = 100
    const panel = this.add.graphics()
    panel.fillStyle(0x000000, 0.5)
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 10)
    panel.lineStyle(1, 0x33aa55, 0.6)
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 10)

    const row = (label: string, finalVal: string, y: number, col = '#dddddd') => {
      this.add.text(panelX + 16, y, label, { fontSize: '14px', color: '#888888' })
      const valTxt = this.add.text(panelX + panelW - 16, y, '0', {
        fontSize: '14px', color: col, align: 'right',
      }).setOrigin(1, 0)
      // Animação de contador (simplificada)
      this.time.delayedCall(1200, () => {
        this.tweens.addCounter({
          from: 0, to: 1, duration: 600,
          onUpdate: t => { valTxt.setText(t.getValue() >= 0.99 ? finalVal : finalVal) },
          onComplete: () => valTxt.setText(finalVal),
        })
      })
    }

    const timeStr = `${Math.floor(elapsedSec/60)}:${String(elapsedSec%60).padStart(2,'0')}`
    row('Pontuação',  `${score}`,          panelY + 12, '#ffff88')
    row('Tempo',      timeStr,             panelY + 34, '#aaaaff')
    row('Inimigos',   `${enemiesKilled}`,  panelY + 56, '#ff8844')
    row('Mortes',     `${deaths}`,         panelY + 78, deaths === 0 ? '#44ff88' : '#ff6666')

    // Novo recorde
    if (isNewRecord) {
      this.add.text(cx, panelY + panelH + 12, '🏆 Novo recorde! ↑', {
        fontSize: '13px', color: '#0a84ff', fontStyle: 'bold',
      }).setOrigin(0.5).setAlpha(0)
      this.tweens.add({ targets: this.children.list[this.children.list.length - 1] as Phaser.GameObjects.Text, alpha: 1, delay: 1800, duration: 400 })
    }

    // ── Personagens celebrando ────────────────────────────────────────
    const raya    = this.add.sprite(cx - 90, 370, KEYS.RAYA, 0).setScale(3.2)
    const cruella = this.add.sprite(cx + 90, 375, KEYS.CRUELLA, 0).setScale(3.2).setFlipX(true)
    this.tweens.add({ targets: raya,    y: 358, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: cruella, y: 362, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 120 })

    // ── Botões ────────────────────────────────────────────────────────
    const btnY = GAME_HEIGHT - 22
    const mapBtn = this.add.text(cx - 90, btnY, '[ M — Mapa ]', {
      fontSize: '14px', color: '#aaaaff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: mapBtn, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 })

    const nextLabel = nextLevel ? '[ ENTER — Próxima Fase ]' : '[ ENTER — Ver Créditos ]'
    const nextBtn = this.add.text(cx + 80, btnY, nextLabel, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive()
    this.tweens.add({ targets: nextBtn, alpha: 0.35, duration: 650, yoyo: true, repeat: -1, delay: 100 })

    // ── Save no ProfileManager ────────────────────────────────────────
    const record: LevelRecord = {
      completed: true,
      medal,
      bestScore: score,
      bestTime: elapsedSec,
      goldenBones,
      totalDeaths: deaths,
      totalEnemiesKilled: enemiesKilled,
      playCount: 1,
    }
    profileManager.saveLevel(levelId, record)
    if (nextLevel) profileManager.unlockLevel(nextLevel)

    // Atualiza currentLevel no gameState para a próxima fase
    if (nextLevel) {
      gameState.currentLevel = nextLevel
      gameState.checkpointReached = false
    }

    // ── Ações ─────────────────────────────────────────────────────────
    let _done = false

    const goMap = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.WORLD_MAP)
    }

    const goNext = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      if (nextLevel) {
        this.scene.start(KEYS.GAME)
      } else {
        // Última fase — volta ao mapa (créditos podem ser adicionados depois)
        this.scene.start(KEYS.WORLD_MAP)
      }
    }

    this.input.keyboard!.on('keydown-ENTER', goNext)
    this.input.keyboard!.on('keydown-M',     goMap)
    nextBtn.on('pointerdown', goNext)
    mapBtn.on('pointerdown', goMap)

    this.events.once('shutdown', () => SoundManager.stopBgm())

    // ── Música ────────────────────────────────────────────────────────
    SoundManager.play('levelComplete')
    this.time.delayedCall(400, () => SoundManager.playProceduralBgm('victory'))
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 3: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/LevelCompleteScene.ts
git commit -m "feat: overhaul LevelCompleteScene with medal animation, stats display and ProfileManager save"
```

---

## Task 9: MenuScene + GameOverScene — atualizar navegação

**Files:**
- Modify: `src/scenes/MenuScene.ts`
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Atualizar MenuScene**

Localizar em `MenuScene.ts`:

```typescript
    const startGame   = () => { gameState.reset(); gameState.currentLevel = '0-1'; this.scene.start(KEYS.INTRO_CRAWL) }
```

Substituir por:

```typescript
    const startGame   = () => { this.scene.start(KEYS.WORLD_MAP) }
```

Adicionar botão "Trocar Perfil" após o `enemyBtn`:

Localizar:

```typescript
    const enemyBtn = this.add.text(GAME_WIDTH / 2, 389, '[ I — PERSONAGENS ]', {
      fontSize: '16px', color: '#ffaa55',
    }).setOrigin(0.5).setInteractive()
```

Após essa linha, adicionar:

```typescript
    const profileBtn = this.add.text(GAME_WIDTH / 2, 415, '[ P — TROCAR PERFIL ]', {
      fontSize: '14px', color: '#7766aa',
    }).setOrigin(0.5).setInteractive()
```

No bloco de event listeners, adicionar:

```typescript
    const goProfile = () => { this.scene.start(KEYS.PROFILE_SELECT) }
    kb.on('keydown-P', goProfile)
    profileBtn.on('pointerdown', goProfile)
```

No bloco `shutdown`, adicionar:

```typescript
      kb.off('keydown-P', goProfile)
```

- [ ] **Step 2: Atualizar GameOverScene — ESC vai para WorldMapScene**

Localizar em `GameOverScene.ts`:

```typescript
    const onEsc   = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.MENU)
    }
```

Substituir por:

```typescript
    const onEsc   = () => {
      if (_done) return
      _done = true
      SoundManager.stopBgm()
      this.scene.start(KEYS.WORLD_MAP)
    }
```

Também localizar o texto do botão ESC:

```typescript
    const escTxt   = this.add.text(cx, 388, 'ESC — voltar ao menu',  {
```

Substituir por:

```typescript
    const escTxt   = this.add.text(cx, 388, 'ESC — mapa do mundo',  {
```

- [ ] **Step 3: Verificar build completo**

```bash
npm run build 2>&1 | tail -10
```

Esperado: sem erros.

- [ ] **Step 4: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam.

- [ ] **Step 5: Testar manualmente o fluxo completo**

Iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Verificar:
1. Na primeira abertura → `ProfileSelectScene` aparece
2. Criar perfil com nome e cachorra → vai para MenuScene
3. Clicar "Jogar" → vai para WorldMapScene
4. WorldMapScene mostra nós 0-1 e 1-1 desbloqueados, demais bloqueados
5. Clicar 0-1 → GameScene inicia com a fase correta
6. Completar fase → LevelCompleteScene mostra medalha, stats, botões
7. Clicar "M — Mapa" → volta para WorldMapScene com 0-boss desbloqueado
8. Fechar e reabrir o browser → perfil continua salvo, fases desbloqueadas persistem

- [ ] **Step 6: Commit final**

```bash
git add src/scenes/MenuScene.ts src/scenes/GameOverScene.ts
git commit -m "feat: wire WorldMapScene into MenuScene (Jogar) and GameOverScene (ESC)"
```

---

## Self-Review

**Spec coverage:**
- ✅ ProfileManager CRUD + localStorage — Task 1
- ✅ Tipos PlayerProfile + LevelRecord — Task 1
- ✅ ProfileSelectScene (slots, criar, excluir) — Task 5
- ✅ WorldMapScene com nós, medalhas, desbloqueio — Task 6
- ✅ GameState session counters — Task 2
- ✅ Medalhas (ouro/prata/bronze) via `calcMedal` — Task 1 + Task 8
- ✅ LevelCompleteScene revamp com save e animação — Task 8
- ✅ Fluxo de save (6 passos do spec Seção 7) — Tasks 7 + 8
- ✅ BootScene redireciona para ProfileSelect — Task 4
- ✅ MenuScene → WorldMapScene; "Trocar Perfil" — Task 9
- ✅ GameOverScene ESC → WorldMapScene — Task 9
- ✅ constants.ts com chaves e MEDAL_THRESHOLDS — Task 3
- ✅ main.ts registra as novas cenas — Tasks 5, 6
- ✅ `nextLevel = null` tratado em LevelCompleteScene — Task 8
- ✅ Fases iniciais (0-1, 1-1) desbloqueadas na criação do perfil — Task 1
- ✅ OR de golden bones entre sessions — Task 1 (`saveLevel` usa OR)
- ✅ Medalha nunca é rebaixada (gold→silver inválido) — Task 1 (`_bestMedal`)

**Consistência de tipos:**
- `LevelRecord` definido em Task 1, usado em Tasks 7, 8 — consistente
- `ProfileManager.calcMedal` definido em Task 1, chamado em Task 8 — consistente
- `MEDAL_THRESHOLDS` adicionado em Task 3, importado em Task 8 — consistente
- `KEYS.WORLD_MAP` e `KEYS.PROFILE_SELECT` adicionados em Task 3, usados em Tasks 4, 5, 6, 9 — consistente
