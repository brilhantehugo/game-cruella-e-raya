# Achievements & Progressão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um sistema de 20 achievements independente com toast não-intrusivo, ecrã de conquistas e persistência via localStorage.

**Architecture:** `AchievementManager` singleton data-driven avalia eventos emitidos por `GameScene`/`EndingScene`; `UIScene` exibe toasts; `AchievementsScene` mostra estado completo. Estado persiste em `localStorage["cruella-achievements"]`.

**Tech Stack:** TypeScript, Phaser 3, Vitest, localStorage

**Spec:** `docs/superpowers/specs/2026-04-15-achievements-progressao-design.md`

---

## File Map

| Ficheiro | Acção | Responsabilidade |
|---|---|---|
| `src/achievements/AchievementDef.ts` | Criar | Interface TypeScript + tipos auxiliares |
| `src/achievements/achievements.ts` | Criar | Array com 20 definições de achievements |
| `src/achievements/AchievementManager.ts` | Criar | Singleton — lógica, contadores, localStorage |
| `tests/AchievementManager.test.ts` | Criar | Testes unitários do manager |
| `src/scenes/AchievementsScene.ts` | Criar | Ecrã de conquistas (Phaser Scene) |
| `src/scenes/UIScene.ts` | Modificar | Adicionar `showAchievementToast()` |
| `src/scenes/GameScene.ts` | Modificar | Adicionar `AM.notify()` nos eventos-chave |
| `src/scenes/EndingScene.ts` | Modificar | `AM.notify('ending_seen')` |
| `src/scenes/MenuScene.ts` | Modificar | Botão "Conquistas" → `AchievementsScene` |
| `src/scenes/BootScene.ts` | Modificar | Registar `AchievementsScene` no array de cenas |

---

## Task 1: AchievementDef interface e definições

**Files:**
- Create: `src/achievements/AchievementDef.ts`
- Create: `src/achievements/achievements.ts`

- [ ] **Step 1.1: Criar AchievementDef.ts**

```typescript
// src/achievements/AchievementDef.ts

export type AchievementCategory = 'combat' | 'collection' | 'style' | 'narrative'

export type AchievementCondition =
  | { type: 'counter'; key: string; threshold: number }
  | { type: 'flag';    key: string }

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: string
  category: AchievementCategory
  secret?: boolean
  condition: AchievementCondition
}
```

- [ ] **Step 1.2: Criar achievements.ts com 20 achievements**

```typescript
// src/achievements/achievements.ts
import { AchievementDef } from './AchievementDef'

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Combate ──────────────────────────────────────────────────────────────
  {
    id: 'first_blood',
    title: 'Primeira Baixa',
    description: 'Derrotaste o teu primeiro inimigo',
    icon: '🗡️',
    category: 'combat',
    condition: { type: 'counter', key: 'enemies_killed', threshold: 1 },
  },
  {
    id: 'pest_control',
    title: 'Controlo de Pragas',
    description: 'Derrota 50 inimigos',
    icon: '🐀',
    category: 'combat',
    condition: { type: 'counter', key: 'enemies_killed', threshold: 50 },
  },
  {
    id: 'exterminator',
    title: 'Exterminadora',
    description: 'Derrota 200 inimigos',
    icon: '💀',
    category: 'combat',
    condition: { type: 'counter', key: 'enemies_killed', threshold: 200 },
  },
  {
    id: 'boss_slayer',
    title: 'Caçadora de Chefes',
    description: 'Derrota todos os 4 bosses',
    icon: '👑',
    category: 'combat',
    condition: { type: 'counter', key: 'bosses_defeated', threshold: 4 },
  },
  {
    id: 'speed_kill',
    title: 'Relâmpago',
    description: 'Derrota um boss em menos de 90 segundos',
    icon: '⚡',
    category: 'combat',
    condition: { type: 'flag', key: 'speed_kill_achieved' },
  },
  {
    id: 'no_damage_boss',
    title: 'Intocável',
    description: 'Derrota qualquer boss sem levar dano',
    icon: '🛡️',
    category: 'combat',
    condition: { type: 'flag', key: 'no_damage_boss' },
  },
  // ── Colecção ─────────────────────────────────────────────────────────────
  {
    id: 'first_bone',
    title: 'Boa Menina',
    description: 'Apanha o teu primeiro golden bone',
    icon: '🦴',
    category: 'collection',
    condition: { type: 'counter', key: 'golden_bones', threshold: 1 },
  },
  {
    id: 'bone_collector',
    title: 'Coleccionadora',
    description: 'Apanha 10 golden bones',
    icon: '✨',
    category: 'collection',
    condition: { type: 'counter', key: 'golden_bones', threshold: 10 },
  },
  {
    id: 'bone_master',
    title: 'Mestre dos Ossos',
    description: 'Apanha todos os 64 golden bones',
    icon: '🏅',
    category: 'collection',
    condition: { type: 'counter', key: 'golden_bones', threshold: 64 },
  },
  {
    id: 'item_hoarder',
    title: 'Acumuladora',
    description: 'Apanha 100 itens no total',
    icon: '🎒',
    category: 'collection',
    condition: { type: 'counter', key: 'items_collected', threshold: 100 },
  },
  {
    id: 'pizza_lover',
    title: 'Amante de Pizza',
    description: 'Apanha 5 pizzas',
    icon: '🍕',
    category: 'collection',
    condition: { type: 'counter', key: 'pizzas_collected', threshold: 5 },
  },
  // ── Estilo de Jogo ────────────────────────────────────────────────────────
  {
    id: 'pacifist',
    title: 'Pacifista',
    description: 'Completa um nível sem derrotar nenhum inimigo',
    icon: '☮️',
    category: 'style',
    condition: { type: 'flag', key: 'pacifist_level' },
  },
  {
    id: 'speedrunner',
    title: 'Speedrunner',
    description: 'Completa um nível com 60 segundos ou mais no relógio',
    icon: '⏱️',
    category: 'style',
    condition: { type: 'flag', key: 'speedrun_level' },
  },
  {
    id: 'no_death_world',
    title: 'Sem Arranhões',
    description: 'Completa um mundo inteiro sem morrer',
    icon: '💚',
    category: 'style',
    condition: { type: 'flag', key: 'no_death_world' },
  },
  {
    id: 'checkpoint_free',
    title: 'Voo Livre',
    description: 'Completa um nível sem usar o checkpoint',
    icon: '🚀',
    category: 'style',
    condition: { type: 'flag', key: 'checkpoint_free_level' },
  },
  {
    id: 'full_health_boss',
    title: 'Sã e Salva',
    description: 'Derrota um boss com a vida cheia',
    icon: '❤️',
    category: 'style',
    condition: { type: 'flag', key: 'full_health_boss' },
  },
  // ── Narrativa ────────────────────────────────────────────────────────────
  {
    id: 'world_1_done',
    title: 'Rua Conquistada',
    description: 'Completa o Mundo 1',
    icon: '🏙️',
    category: 'narrative',
    condition: { type: 'flag', key: 'world_1_done' },
  },
  {
    id: 'world_2_done',
    title: 'Prédio Conquistado',
    description: 'Completa o Mundo 2',
    icon: '🏢',
    category: 'narrative',
    condition: { type: 'flag', key: 'world_2_done' },
  },
  {
    id: 'world_3_done',
    title: 'Noite Conquistada',
    description: 'Completa o Mundo 3',
    icon: '🌙',
    category: 'narrative',
    condition: { type: 'flag', key: 'world_3_done' },
  },
  {
    id: 'true_ending',
    title: 'Finalmente em Casa',
    description: 'Vê o final completo do jogo',
    icon: '🏠',
    category: 'narrative',
    condition: { type: 'flag', key: 'ending_seen' },
  },
]
```

- [ ] **Step 1.3: Commit**

```bash
git add src/achievements/
git commit -m "feat(achievements): AchievementDef interface + 20 achievement definitions"
```

---

## Task 2: AchievementManager — lógica central

**Files:**
- Create: `src/achievements/AchievementManager.ts`
- Create: `tests/AchievementManager.test.ts`

- [ ] **Step 2.1: Escrever os testes primeiro**

```typescript
// tests/AchievementManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AchievementManager } from '../src/achievements/AchievementManager'

// Mock localStorage
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem:    (k: string) => storage[k] ?? null,
  setItem:    (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear:      () => { Object.keys(storage).forEach(k => delete storage[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('AchievementManager', () => {
  let am: AchievementManager
  const onUnlock = vi.fn()

  beforeEach(() => {
    localStorageMock.clear()
    onUnlock.mockClear()
    am = new AchievementManager(onUnlock)
  })

  it('começa sem conquistas desbloqueadas', () => {
    expect(am.getUnlocked()).toEqual([])
  })

  it('notifica callback ao desbloquear achievement por counter', () => {
    am.notify('enemy_killed')
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_blood' })
    )
  })

  it('não notifica twice para o mesmo achievement', () => {
    am.notify('enemy_killed')
    am.notify('enemy_killed')
    const calls = onUnlock.mock.calls.filter(c => c[0].id === 'first_blood')
    expect(calls).toHaveLength(1)
  })

  it('acumula counter até threshold', () => {
    for (let i = 0; i < 49; i++) am.notify('enemy_killed')
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pest_control' })
    )
    am.notify('enemy_killed') // 50º
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pest_control' })
    )
  })

  it('desbloqueia achievement por flag', () => {
    am.notify('ending_seen')
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'true_ending' })
    )
  })

  it('persiste estado em localStorage', () => {
    am.notify('enemy_killed')
    const saved = JSON.parse(localStorage.getItem('cruella-achievements')!)
    expect(saved.counters.enemies_killed).toBe(1)
    expect(saved.unlocked).toContain('first_blood')
  })

  it('carrega estado persistido ao reiniciar', () => {
    am.notify('enemy_killed')
    const am2 = new AchievementManager(onUnlock)
    expect(am2.getUnlocked()).toContain('first_blood')
  })

  it('não volta a desbloquear achievements já guardados', () => {
    am.notify('enemy_killed')
    onUnlock.mockClear()
    const am2 = new AchievementManager(onUnlock)
    am2.notify('enemy_killed')
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_blood' })
    )
  })

  it('boss_defeated incrementa contador e avalia boss_slayer', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 60000, damageTaken: 0, playerHpFull: true })
    expect(am.getCounter('bosses_defeated')).toBe(1)
  })

  it('speed_kill: define flag se fightDurationMs < 90000', () => {
    am.notify('boss_defeated', { levelId: '1-boss', fightDurationMs: 80000, damageTaken: 1, playerHpFull: false })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speed_kill' })
    )
  })

  it('speed_kill: não define flag se fightDurationMs >= 90000', () => {
    am.notify('boss_defeated', { levelId: '1-boss', fightDurationMs: 95000, damageTaken: 1, playerHpFull: false })
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speed_kill' })
    )
  })

  it('no_damage_boss: define flag se damageTaken === 0', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 120000, damageTaken: 0, playerHpFull: true })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'no_damage_boss' })
    )
  })

  it('full_health_boss: define flag se playerHpFull === true', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 120000, damageTaken: 0, playerHpFull: true })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'full_health_boss' })
    )
  })

  it('level_complete: pacifist se killCount === 0', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 100, damageTaken: 0, killCount: 0 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pacifist' })
    )
  })

  it('level_complete: speedrunner se timeLeft >= 60', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 65, damageTaken: 0, killCount: 3 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speedrunner' })
    )
  })

  it('level_complete: checkpoint_free se usedCheckpoint === false', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 10, damageTaken: 1, killCount: 3 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'checkpoint_free' })
    )
  })

  it('pizza: item_collected com type pizza incrementa counter', () => {
    am.notify('item_collected', { type: 'pizza' })
    expect(am.getCounter('pizzas_collected')).toBe(1)
    expect(am.getCounter('items_collected')).toBe(1)
  })
})
```

- [ ] **Step 2.2: Executar os testes — devem FALHAR**

```bash
npm test -- AchievementManager
```
Esperado: erro "Cannot find module '../src/achievements/AchievementManager'"

- [ ] **Step 2.3: Implementar AchievementManager**

```typescript
// src/achievements/AchievementManager.ts
import { AchievementDef } from './AchievementDef'
import { ACHIEVEMENTS } from './achievements'

const STORAGE_KEY = 'cruella-achievements'

interface AchievementState {
  unlocked: string[]
  counters: Record<string, number>
  flags: Record<string, boolean>
}

export type NotifyEvent =
  | 'enemy_killed'
  | 'golden_bone'
  | 'item_collected'
  | 'boss_defeated'
  | 'level_complete'
  | 'world_complete'
  | 'ending_seen'
  | 'player_died'

export type NotifyPayload = {
  type?: string           // para item_collected
  levelId?: string        // para boss_defeated
  fightDurationMs?: number
  damageTaken?: number
  playerHpFull?: boolean
  usedCheckpoint?: boolean
  timeLeft?: number
  killCount?: number
  world?: string
}

export class AchievementManager {
  private _state: AchievementState
  private readonly _onUnlock: (def: AchievementDef) => void

  constructor(onUnlock: (def: AchievementDef) => void) {
    this._onUnlock = onUnlock
    this._state = this._load()
  }

  // ── Public API ─────────────────────────────────────────────────────────

  notify(event: NotifyEvent, payload: NotifyPayload = {}): void {
    this._applyEvent(event, payload)
    this._evaluateAll()
    this._save()
  }

  getUnlocked(): string[] {
    return [...this._state.unlocked]
  }

  isUnlocked(id: string): boolean {
    return this._state.unlocked.includes(id)
  }

  getCounter(key: string): number {
    return this._state.counters[key] ?? 0
  }

  getProgress(def: AchievementDef): { current: number; total: number } | null {
    if (def.condition.type !== 'counter') return null
    return {
      current: Math.min(this._state.counters[def.condition.key] ?? 0, def.condition.threshold),
      total: def.condition.threshold,
    }
  }

  // ── Private ────────────────────────────────────────────────────────────

  private _applyEvent(event: NotifyEvent, payload: NotifyPayload): void {
    const s = this._state
    const inc = (key: string, by = 1) => { s.counters[key] = (s.counters[key] ?? 0) + by }
    const flag = (key: string) => { s.flags[key] = true }

    switch (event) {
      case 'enemy_killed':
        inc('enemies_killed')
        break

      case 'golden_bone':
        inc('golden_bones')
        break

      case 'item_collected':
        inc('items_collected')
        if (payload.type === 'pizza') inc('pizzas_collected')
        break

      case 'boss_defeated':
        inc('bosses_defeated')
        if ((payload.fightDurationMs ?? Infinity) < 90_000) flag('speed_kill_achieved')
        if (payload.damageTaken === 0)    flag('no_damage_boss')
        if (payload.playerHpFull === true) flag('full_health_boss')
        break

      case 'level_complete':
        if (payload.killCount === 0)          flag('pacifist_level')
        if ((payload.timeLeft ?? 0) >= 60)    flag('speedrun_level')
        if (!payload.usedCheckpoint)          flag('checkpoint_free_level')
        // reset per-world death tracking
        break

      case 'world_complete':
        if (payload.world) flag(`world_${payload.world}_done`)
        break

      case 'ending_seen':
        flag('ending_seen')
        break

      case 'player_died':
        // reset no_death_world tracking handled externally via world_complete
        break
    }
  }

  private _evaluateAll(): void {
    for (const def of ACHIEVEMENTS) {
      if (this._state.unlocked.includes(def.id)) continue
      if (this._meetsCondition(def)) {
        this._state.unlocked.push(def.id)
        this._onUnlock(def)
      }
    }
  }

  private _meetsCondition(def: AchievementDef): boolean {
    const { condition } = def
    if (condition.type === 'counter') {
      return (this._state.counters[condition.key] ?? 0) >= condition.threshold
    }
    if (condition.type === 'flag') {
      return !!this._state.flags[condition.key]
    }
    return false
  }

  private _load(): AchievementState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AchievementState>
        return {
          unlocked: parsed.unlocked ?? [],
          counters: parsed.counters ?? {},
          flags:    parsed.flags    ?? {},
        }
      }
    } catch { /* ignore corrupt data */ }
    return { unlocked: [], counters: {}, flags: {} }
  }

  private _save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state))
  }
}
```

- [ ] **Step 2.4: Executar os testes — devem PASSAR**

```bash
npm test -- AchievementManager
```
Esperado: todos os testes a verde.

- [ ] **Step 2.5: Commit**

```bash
git add src/achievements/AchievementManager.ts tests/AchievementManager.test.ts
git commit -m "feat(achievements): AchievementManager singleton with persistence and tests"
```

---

## Task 3: Toast na UIScene

**Files:**
- Modify: `src/scenes/UIScene.ts`

- [ ] **Step 3.1: Adicionar `showAchievementToast()` à UIScene**

Encontrar o fim da classe `UIScene` (antes do último `}`) e adicionar:

```typescript
// Fila de toasts — para não se sobreporem se vários desbloquearem juntos
private _toastQueue: { title: string; description: string; icon: string }[] = []
private _toastActive = false

showAchievementToast(icon: string, title: string, description: string): void {
  this._toastQueue.push({ icon, title, description })
  if (!this._toastActive) this._showNextToast()
}

private _showNextToast(): void {
  if (this._toastQueue.length === 0) { this._toastActive = false; return }
  this._toastActive = true
  const { icon, title, description } = this._toastQueue.shift()!

  const W = 800
  const x = W - 16  // alinhado à direita, 16px de margem
  const y = 28

  const bg = this.add.rectangle(x - 110, y, 220, 56, 0x1a0a00, 0.92)
    .setStrokeStyle(2, 0xffa040).setDepth(60).setScrollFactor(0).setAlpha(0)

  const iconTxt = this.add.text(x - 206, y, icon, { fontSize: '22px' })
    .setOrigin(0.5).setDepth(61).setScrollFactor(0).setAlpha(0)

  const labelTxt = this.add.text(x - 184, y - 10, 'Conquista Desbloqueada!', {
    fontSize: '9px', color: '#ffa040', fontStyle: 'bold',
  }).setDepth(61).setScrollFactor(0).setAlpha(0)

  const titleTxt = this.add.text(x - 184, y, title, {
    fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
  }).setDepth(61).setScrollFactor(0).setAlpha(0)

  const descTxt = this.add.text(x - 184, y + 12, description, {
    fontSize: '9px', color: '#aaaaaa',
  }).setDepth(61).setScrollFactor(0).setAlpha(0)

  const targets = [bg, iconTxt, labelTxt, titleTxt, descTxt]

  this.tweens.add({
    targets, alpha: 1, duration: 300,
    onComplete: () => {
      this.time.delayedCall(3000, () => {
        this.tweens.add({
          targets, alpha: 0, duration: 400,
          onComplete: () => {
            targets.forEach(t => t.destroy())
            this._showNextToast()
          },
        })
      })
    },
  })
}
```

- [ ] **Step 3.2: Executar a suite completa para garantir que não quebrou nada**

```bash
npm test
```
Esperado: todos os testes existentes continuam a passar.

- [ ] **Step 3.3: Commit**

```bash
git add src/scenes/UIScene.ts
git commit -m "feat(achievements): UIScene.showAchievementToast — queued non-blocking toast"
```

---

## Task 4: Instanciar AchievementManager no GameScene e ligar eventos

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 4.1: Importar e instanciar o AchievementManager**

No topo do ficheiro, adicionar o import:

```typescript
import { AchievementManager } from '../achievements/AchievementManager'
import type { AchievementDef } from '../achievements/AchievementDef'
```

Na classe `GameScene`, junto às declarações dos outros campos privados, adicionar:

```typescript
private _am!: AchievementManager
```

No método `create()`, logo após `this._ui = ...` (ou no início do método, antes de qualquer lógica de nível), adicionar:

```typescript
// Instanciar apenas uma vez — reutilizar entre níveis
if (!(this as any)._am) {
  this._am = new AchievementManager((def: AchievementDef) => {
    const ui = this.scene.get('UIScene') as any
    ui?.showAchievementToast?.(def.icon, def.title, def.description)
  })
}
```

- [ ] **Step 4.2: Ligar evento — enemy_killed**

Localizar o bloco onde os inimigos são eliminados (procurar por `enemy.die()` ou `this._handleEnemyDeath`). Após a chamada de morte, adicionar:

```typescript
this._am.notify('enemy_killed')
```

- [ ] **Step 4.3: Ligar evento — golden_bone**

Localizar o bloco de overlap com golden bones (procurar por `goldenBone` ou `golden_bone` no método `_setupCollisions()`). No callback de colecta, adicionar:

```typescript
this._am.notify('golden_bone')
```

- [ ] **Step 4.4: Ligar evento — item_collected**

Localizar o callback de colecta de itens normais (procurar por `item.type` ou `_handleItemCollect`). Adicionar:

```typescript
this._am.notify('item_collected', { type: (item as any).itemType ?? '' })
```

- [ ] **Step 4.5: Ligar evento — boss_defeated**

Localizar onde o boss é marcado como derrotado (procurar por `_bossDefeated` ou `boss.hp <= 0`). O momento exacto do início do combate deve ser registado:

```typescript
// Quando o boss spawna (em _spawnEnemies ou _runBossIntro):
this._bossStartTime = this.time.now

// Quando o boss morre (callback de morte do boss):
const fightDurationMs = this.time.now - (this._bossStartTime ?? this.time.now)
const playerHpFull = this._playerHP >= this._playerMaxHP
this._am.notify('boss_defeated', {
  levelId: this.currentLevel.id,
  fightDurationMs,
  damageTaken: this._damageTakenInBoss ?? 0,
  playerHpFull,
})
```

Adicionar o campo `_bossStartTime: number = 0` e `_damageTakenInBoss: number = 0` às declarações privadas.
Incrementar `_damageTakenInBoss` sempre que o jogador leva dano num nível de boss.

- [ ] **Step 4.6: Ligar evento — level_complete**

Localizar o método `_levelComplete()` (ou equivalente). Antes de avançar de nível, adicionar:

```typescript
this._am.notify('level_complete', {
  usedCheckpoint: this._usedCheckpoint ?? false,
  timeLeft: this._timeLeft ?? 0,
  damageTaken: this._damageTakenInLevel ?? 0,
  killCount: this._killCountInLevel ?? 0,
})
```

Adicionar ao `create()` (reset por nível):

```typescript
this._usedCheckpoint = false
this._killCountInLevel = 0
this._damageTakenInLevel = 0
```

Incrementar `_killCountInLevel` em cada `enemy_killed`, `_damageTakenInLevel` em cada hit ao jogador, e marcar `_usedCheckpoint = true` quando o checkpoint é activado.

- [ ] **Step 4.7: Ligar evento — world_complete**

Localizar onde a transição de mundo é disparada (em `LevelCompleteScene` ou em `_levelComplete` quando `nextLevel` é null ou troca de mundo). Adicionar:

```typescript
// Extrair número do mundo a partir do levelId do boss (ex: '1-boss' → '1')
const worldNum = this.currentLevel.id.split('-')[0]
this._am.notify('world_complete', { world: worldNum })
```

- [ ] **Step 4.8: Ligar evento — player_died (para no_death_world)**

Localizar onde o jogador morre (procurar por `_playerDied` ou `GameOver`). Adicionar:

```typescript
this._am.notify('player_died')
// Resetar tracking de no_death_world — flag só se activa se completar o mundo sem morrer
// (A lógica de no_death_world vive no AchievementManager — ver Task 2.3)
```

> **Nota sobre no_death_world:** Para detectar "completar um mundo sem morrer", o `AchievementManager` deve guardar `flags['no_death_current_run'] = true` ao iniciar, marcá-lo `false` em `player_died`, e activar `no_death_world` em `world_complete` se ainda estiver `true`. Isto requer pequena adição ao `_applyEvent` do AchievementManager:

```typescript
case 'player_died':
  this._state.flags['no_death_current_run'] = false
  break

case 'world_complete':
  if (payload.world) flag(`world_${payload.world}_done`)
  if (this._state.flags['no_death_current_run'] !== false) flag('no_death_world')
  this._state.flags['no_death_current_run'] = true  // reset para próximo mundo
  break
```

Actualizar também o teste de `world_complete` no ficheiro de testes se necessário.

- [ ] **Step 4.9: Executar a suite completa**

```bash
npm test
npm run build
```
Esperado: testes passam, build sem erros TypeScript.

- [ ] **Step 4.10: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(achievements): wire AM.notify() events in GameScene"
```

---

## Task 5: Ligar EndingScene

**Files:**
- Modify: `src/scenes/EndingScene.ts`

- [ ] **Step 5.1: Chamar notify('ending_seen') na EndingScene**

Na `EndingScene`, no método onde o ending é considerado "visto" (provavelmente quando chega ao último momento/créditos, ou quando a cena é criada), adicionar:

```typescript
// No topo do ficheiro:
import { AchievementManager } from '../achievements/AchievementManager'

// No método create() ou no callback do último momento:
// Obter a instância do GameScene que tem o _am
const gameScene = this.scene.get('GameScene') as any
gameScene?._am?.notify('ending_seen')
```

- [ ] **Step 5.2: Build check**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 5.3: Commit**

```bash
git add src/scenes/EndingScene.ts
git commit -m "feat(achievements): notify ending_seen from EndingScene"
```

---

## Task 6: AchievementsScene

**Files:**
- Create: `src/scenes/AchievementsScene.ts`

- [ ] **Step 6.1: Criar a cena**

```typescript
// src/scenes/AchievementsScene.ts
import Phaser from 'phaser'
import { ACHIEVEMENTS } from '../achievements/achievements'
import { AchievementManager } from '../achievements/AchievementManager'
import { AchievementDef, AchievementCategory } from '../achievements/AchievementDef'

const GAME_WIDTH  = 800
const GAME_HEIGHT = 450
const COLS        = 2
const ROW_H       = 52
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
    const title = this.add.text(x + 36, y + 10, titleStr, {
      fontSize: '11px', color: titleColor, fontStyle: 'bold',
    }).setAlpha(alpha)
    this._container.add(title)

    // Descrição / progresso
    let descStr = isSecret ? 'Achievement secreto' : def.description
    if (!unlocked && progress) {
      descStr = `${def.description} · ${progress.current}/${progress.total}`
    }
    const desc = this.add.text(x + 36, y + 25, descStr, {
      fontSize: '9px', color: '#666666',
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
```

- [ ] **Step 6.2: Registar AchievementsScene no BootScene**

Abrir `src/scenes/BootScene.ts`. Localizar o array de cenas passado ao `Phaser.Game` config (procurar por `scene: [` ou `new GameScene`). Adicionar `AchievementsScene` ao array:

```typescript
import { AchievementsScene } from './AchievementsScene'

// No array de cenas:
// scene: [..., AchievementsScene, ...]
```

- [ ] **Step 6.3: Build check**

```bash
npm run build
```
Esperado: sem erros TypeScript.

- [ ] **Step 6.4: Commit**

```bash
git add src/scenes/AchievementsScene.ts src/scenes/BootScene.ts
git commit -m "feat(achievements): AchievementsScene with category tabs and progress bars"
```

---

## Task 7: Botão no MenuScene

**Files:**
- Modify: `src/scenes/MenuScene.ts`

- [ ] **Step 7.1: Adicionar botão "Conquistas" ao menu**

No `MenuScene`, localizar a lista de botões existente (procurar por `'Jogar'` ou `'Como Jogar'`). Adicionar um botão "Conquistas" na mesma posição relativa:

```typescript
// Botão Conquistas — mesmo estilo dos outros botões do menu
const btnAchievements = this.add.text(GAME_WIDTH / 2, /* y abaixo do último botão */, '🏆 Conquistas', {
  fontSize: '18px',
  color: '#ffa040',
}).setOrigin(0.5).setInteractive({ useHandCursor: true })

btnAchievements.on('pointerover', () => btnAchievements.setColor('#ffffff'))
btnAchievements.on('pointerout',  () => btnAchievements.setColor('#ffa040'))
btnAchievements.on('pointerup',   () => this.scene.start('AchievementsScene'))
```

Ajustar o `y` para ficar abaixo do último botão existente (inspecionar o `y` dos botões actuais).

- [ ] **Step 7.2: Build e teste final**

```bash
npm test
npm run build
```
Esperado: testes passam, build sem erros.

- [ ] **Step 7.3: Commit final**

```bash
git add src/scenes/MenuScene.ts
git commit -m "feat(achievements): add Conquistas button to MenuScene"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Sistema independente com ecrã próprio (Task 6)
- ✅ 20 achievements em 4 categorias (Task 1)
- ✅ Toast não-intrusivo no canto superior direito (Task 3)
- ✅ Persistência via localStorage (Task 2)
- ✅ Integração GameScene via notify (Task 4)
- ✅ boss_defeated com fightDurationMs, damageTaken, playerHpFull (Task 4.5)
- ✅ level_complete com usedCheckpoint, timeLeft, killCount (Task 4.6)
- ✅ no_death_world via flag resetada em player_died (Task 4.8)
- ✅ ending_seen via EndingScene (Task 5)
- ✅ Botão no MenuScene (Task 7)
- ✅ 64 golden bones no bone_master (Task 1)

**Inconsistências corrigidas:**
- `no_death_current_run` adicionado ao `_applyEvent` de `world_complete` e `player_died` (Task 4.8)
- `getProgress()` exposto no manager para mostrar progresso de counters no ecrã (Task 2)
