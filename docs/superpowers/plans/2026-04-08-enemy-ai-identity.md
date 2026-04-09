# Enemy AI Identity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar inimigos de entidades mecânicas idênticas em personagens com identidade comportamental distinta — humanos seguem máquina de estados (Patrol→Detect→Chase→Attack→Cooldown), animais ganham comportamentos únicos com janelas de counter para Cruella e Raya.

**Architecture:** Pure logic functions (testable) em `EnemyStateMachine.ts` → `HumanEnemy` base class para Hugo/Hannah/Zelador/Morador → redesign dos animais (GatoMalencarado, PomboAgitado, RatoDeCalcada) com estado de ataque + `CounterWindow` system → GameScene conecta bark/dash/stomp a esses sistemas.

**Tech Stack:** Phaser 3, TypeScript, Vitest — node at `/usr/local/bin/node`

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/entities/enemies/EnemyStateMachine.ts` | **Criar** | Tipos puros: `HumanState`, `HumanConfig`, `CounterWindow`, funções `computeNextHumanState`, `onBarkHeardNextState`, `isInCone`, `checkCounterWindow`, classe `EnemyStateMachine` |
| `src/entities/enemies/HumanEnemy.ts` | **Criar** | Base class para humanos — usa EnemyStateMachine, implementa patrol/detect/chase/search/attack/cooldown, `setPlayerPos`, `onBarkHeard`, emite `'grabPlayer'` |
| `src/entities/npc/Hugo.ts` | **Modificar** | Remover lógica de patrol duplicada, extends HumanEnemy com config Hugo |
| `src/entities/npc/Hannah.ts` | **Modificar** | Remover lógica de patrol duplicada, extends HumanEnemy com config Hannah |
| `src/entities/enemies/Zelador.ts` | **Criar** | extends HumanEnemy, config Zelador (mais rápido, maior range) |
| `src/entities/enemies/Morador.ts` | **Criar** | extends HumanEnemy, config Morador (mais lento, menor range) |
| `src/constants.ts` | **Modificar** | Adicionar `ZELADOR: 'zelador'`, `MORADOR: 'morador'` |
| `src/entities/enemies/GatoMalencarado.ts` | **Redesign** | Pounce (PATROL→CROUCH→LEAP→RECOVERY), counter windows, visual outline |
| `src/entities/enemies/PomboAgitado.ts` | **Redesign** | Swoop (PATROL_FLY→HOVER→SWOOP→ASCEND), counter windows, visual outline |
| `src/entities/enemies/RatoDeCalcada.ts` | **Redesign** | Speed dash (PATROL→CHARGE→DASH→RECOVERY), counter windows, visual outline |
| `src/scenes/GameScene.ts` | **Modificar** | Bark handler split (humanos vs animais), counter check em dash/stomp overlaps, `setPlayerPos` para HumanEnemy, casos `'zelador'`/`'morador'` em `_spawnEnemies`, handler `'grabPlayer'` |
| `src/levels/World0.ts` | **Modificar** | 0-2: substituir hugo do estacionamento por `'zelador'`, garantir gato isolado primeiro |
| `src/levels/World1.ts` | **Modificar** | 1-1: adicionar `'morador'`; restante redistribuição pedagógica |
| `tests/EnemyStateMachine.test.ts` | **Criar** | Testa `computeNextHumanState`, `onBarkHeardNextState`, `isInCone` |
| `tests/CounterWindow.test.ts` | **Criar** | Testa `checkCounterWindow` para cada animal |

---

## Task 1: EnemyStateMachine.ts — Pure Logic + Tests (TDD)

**Files:**
- Create: `src/entities/enemies/EnemyStateMachine.ts`
- Create: `tests/EnemyStateMachine.test.ts`
- Create: `tests/CounterWindow.test.ts`

- [ ] **Step 1: Criar tests/EnemyStateMachine.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import {
  computeNextHumanState,
  onBarkHeardNextState,
  isInCone,
  type HumanState,
  type HumanConfig,
} from '../src/entities/enemies/EnemyStateMachine'

const BASE_CONFIG: HumanConfig = {
  detectionRange: 180,
  coneAngle: 60,
  chaseSpeed: 90,
  patrolSpeed: 55,
  attackRange: 40,
  cooldownDuration: 1200,
  hearingRadius: 120,
  patrolRange: 180,
}

describe('computeNextHumanState', () => {
  it('PATROL → DETECT quando player entra no cone', () => {
    const next = computeNextHumanState({
      state: 'PATROL', timeInState: 999, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('DETECT')
  })

  it('PATROL permanece quando player fora do cone', () => {
    const next = computeNextHumanState({
      state: 'PATROL', timeInState: 999, distToPlayer: 100,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })

  it('DETECT → CHASE após 500ms', () => {
    const next = computeNextHumanState({
      state: 'DETECT', timeInState: 501, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('CHASE')
  })

  it('DETECT permanece antes de 500ms', () => {
    const next = computeNextHumanState({
      state: 'DETECT', timeInState: 400, distToPlayer: 100,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })

  it('CHASE → SEARCH quando player sai do range (> detectionRange * 1.5)', () => {
    const next = computeNextHumanState({
      state: 'CHASE', timeInState: 0, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('SEARCH')
  })

  it('CHASE → ATTACK quando player dentro do attackRange', () => {
    const next = computeNextHumanState({
      state: 'CHASE', timeInState: 0, distToPlayer: 30,
      playerInCone: true, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('ATTACK')
  })

  it('SEARCH → COOLDOWN quando reachedLastKnown', () => {
    const next = computeNextHumanState({
      state: 'SEARCH', timeInState: 100, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: true,
    })
    expect(next).toBe('COOLDOWN')
  })

  it('COOLDOWN → PATROL após cooldownDuration', () => {
    const next = computeNextHumanState({
      state: 'COOLDOWN', timeInState: 1300, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBe('PATROL')
  })

  it('COOLDOWN permanece antes de cooldownDuration', () => {
    const next = computeNextHumanState({
      state: 'COOLDOWN', timeInState: 900, distToPlayer: 300,
      playerInCone: false, config: BASE_CONFIG, reachedLastKnown: false,
    })
    expect(next).toBeNull()
  })
})

describe('onBarkHeardNextState', () => {
  it('bark dentro de hearingRadius → DETECT', () => {
    expect(onBarkHeardNextState('PATROL', 100, BASE_CONFIG)).toBe('DETECT')
  })

  it('bark dentro de attackRange → CHASE direto', () => {
    expect(onBarkHeardNextState('PATROL', 30, BASE_CONFIG)).toBe('CHASE')
  })

  it('bark durante COOLDOWN → PATROL (levou susto)', () => {
    expect(onBarkHeardNextState('COOLDOWN', 200, BASE_CONFIG)).toBe('PATROL')
  })

  it('bark fora do hearingRadius → sem efeito', () => {
    expect(onBarkHeardNextState('PATROL', 200, BASE_CONFIG)).toBeNull()
  })
})

describe('isInCone', () => {
  it('player à frente e dentro do range → true', () => {
    // enemy facing right (true), player 100px à direita, sem offset vertical
    expect(isInCone(0, 0, true, 100, 0, 180, 30)).toBe(true)
  })

  it('player atrás → false', () => {
    // enemy facing right, player à esquerda
    expect(isInCone(0, 0, true, -100, 0, 180, 30)).toBe(false)
  })

  it('player fora do range → false', () => {
    expect(isInCone(0, 0, true, 200, 0, 180, 30)).toBe(false)
  })

  it('player dentro do range mas fora do ângulo → false', () => {
    // player 100px à direita e 100px abaixo — ângulo ≈ 45°, halfAngle = 20°
    expect(isInCone(0, 0, true, 100, 100, 180, 20)).toBe(false)
  })
})
```

- [ ] **Step 2: Executar — confirmar FALHA**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
/usr/local/bin/node node_modules/.bin/vitest run tests/EnemyStateMachine.test.ts
```

Esperado: FAIL — "Cannot find module '../src/entities/enemies/EnemyStateMachine'"

- [ ] **Step 3: Criar tests/CounterWindow.test.ts**

```typescript
import { describe, it, expect } from 'vitest'
import { checkCounterWindow, type CounterWindow } from '../src/entities/enemies/EnemyStateMachine'

const GATO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'CROUCH', windowMs: 400, type: 'bark',
}
const GATO_DASH_WINDOW: CounterWindow = {
  character: 'raya', state: 'LEAP', windowMs: 150, type: 'dash',
}
const POMBO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'HOVER', windowMs: 300, type: 'bark',
}
const POMBO_JUMP_WINDOW: CounterWindow = {
  character: 'raya', state: 'PATROL_FLY', windowMs: 9999, type: 'jump',
}
const RATO_BARK_WINDOW: CounterWindow = {
  character: 'cruella', state: 'CHARGE', windowMs: 350, type: 'bark',
}
const RATO_JUMP_WINDOW: CounterWindow = {
  character: 'raya', state: 'DASH', windowMs: 200, type: 'jump',
}

describe('checkCounterWindow', () => {
  it('retorna true com personagem/tipo/tempo corretos', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1200, 'cruella', 'bark')).toBe(true)
  })

  it('retorna false fora da janela de tempo', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1500, 'cruella', 'bark')).toBe(false) // 500ms > 400ms
  })

  it('retorna false com personagem errado', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1100, 'raya', 'bark')).toBe(false)
  })

  it('retorna false com tipo errado', () => {
    expect(checkCounterWindow(GATO_BARK_WINDOW, 1000, 1100, 'cruella', 'dash')).toBe(false)
  })

  it('retorna false quando window é null', () => {
    expect(checkCounterWindow(null, 1000, 1100, 'cruella', 'bark')).toBe(false)
  })

  it('Gato: dash window (150ms) — dentro', () => {
    expect(checkCounterWindow(GATO_DASH_WINDOW, 2000, 2100, 'raya', 'dash')).toBe(true)
  })

  it('Gato: dash window (150ms) — fora', () => {
    expect(checkCounterWindow(GATO_DASH_WINDOW, 2000, 2200, 'raya', 'dash')).toBe(false)
  })

  it('Pombo: bark window (300ms)', () => {
    expect(checkCounterWindow(POMBO_BARK_WINDOW, 0, 250, 'cruella', 'bark')).toBe(true)
    expect(checkCounterWindow(POMBO_BARK_WINDOW, 0, 350, 'cruella', 'bark')).toBe(false)
  })

  it('Pombo: jump window (aberta enquanto voa)', () => {
    expect(checkCounterWindow(POMBO_JUMP_WINDOW, 0, 5000, 'raya', 'jump')).toBe(true)
  })

  it('Rato: bark window (350ms)', () => {
    expect(checkCounterWindow(RATO_BARK_WINDOW, 500, 700, 'cruella', 'bark')).toBe(true)
    expect(checkCounterWindow(RATO_BARK_WINDOW, 500, 900, 'cruella', 'bark')).toBe(false)
  })

  it('Rato: jump window (200ms)', () => {
    expect(checkCounterWindow(RATO_JUMP_WINDOW, 1000, 1150, 'raya', 'jump')).toBe(true)
    expect(checkCounterWindow(RATO_JUMP_WINDOW, 1000, 1250, 'raya', 'jump')).toBe(false)
  })
})
```

- [ ] **Step 4: Criar src/entities/enemies/EnemyStateMachine.ts**

```typescript
// ─── Tipos exportados ────────────────────────────────────────────────────────

export type HumanState = 'PATROL' | 'DETECT' | 'CHASE' | 'SEARCH' | 'ATTACK' | 'COOLDOWN'

export interface HumanConfig {
  detectionRange: number   // px — range do cone de visão
  coneAngle: number        // graus totais do cone (ex: 60 → ±30° à frente)
  chaseSpeed: number       // px/s durante chase
  patrolSpeed: number      // px/s durante patrol
  attackRange: number      // px — trigger de ataque
  cooldownDuration: number // ms após ataque
  hearingRadius: number    // px — raio de audição do bark
  patrolRange: number      // px — amplitude do patrol a partir do spawn
}

export interface CounterWindow {
  character: 'raya' | 'cruella'
  state: string       // estado do inimigo que abre a janela
  windowMs: number    // duração da janela em ms
  type: 'bark' | 'dash' | 'jump'
}

// ─── Funções puras (testáveis sem Phaser) ────────────────────────────────────

/** Retorna o próximo estado ou null se não há transição. */
export function computeNextHumanState(params: {
  state: HumanState
  timeInState: number
  distToPlayer: number
  playerInCone: boolean
  config: HumanConfig
  reachedLastKnown: boolean
}): HumanState | null {
  const { state, timeInState, distToPlayer, playerInCone, config, reachedLastKnown } = params

  switch (state) {
    case 'PATROL':
      if (playerInCone) return 'DETECT'
      return null

    case 'DETECT':
      if (timeInState >= 500) return 'CHASE'
      return null

    case 'CHASE':
      if (distToPlayer <= config.attackRange) return 'ATTACK'
      if (distToPlayer > config.detectionRange * 1.5) return 'SEARCH'
      return null

    case 'SEARCH':
      if (reachedLastKnown) return 'COOLDOWN'
      return null

    case 'ATTACK':
      return null // transição gerenciada por _doAttack()

    case 'COOLDOWN':
      if (timeInState >= config.cooldownDuration) return 'PATROL'
      return null
  }
}

/** Retorna o estado resultante de um bark ouvido, ou null se sem efeito. */
export function onBarkHeardNextState(
  state: HumanState,
  dist: number,
  config: HumanConfig,
): HumanState | null {
  if (state === 'COOLDOWN') return 'PATROL'
  if (dist <= config.attackRange) return 'CHASE'
  if (dist <= config.hearingRadius) return 'DETECT'
  return null
}

/** Verifica se um player está dentro do cone de visão do inimigo. */
export function isInCone(
  ex: number, ey: number, facingRight: boolean,
  px: number, py: number,
  range: number, halfAngleDeg: number,
): boolean {
  const dist = Math.hypot(px - ex, py - ey)
  if (dist === 0 || dist > range) return false
  const halfAngleRad = halfAngleDeg * (Math.PI / 180)
  // vetor forward horizontal
  const forwardX = facingRight ? 1 : -1
  // cos do ângulo entre forward e direção ao player
  const cosAngle = (forwardX * (px - ex)) / dist
  return cosAngle >= Math.cos(halfAngleRad)
}

/** Verifica se um counter é válido dado a janela atual e o tempo. */
export function checkCounterWindow(
  window: CounterWindow | null,
  windowOpenAt: number,
  now: number,
  character: 'raya' | 'cruella',
  type: 'bark' | 'dash' | 'jump',
): boolean {
  if (!window) return false
  if (window.character !== character) return false
  if (window.type !== type) return false
  return (now - windowOpenAt) <= window.windowMs
}

// ─── Classe EnemyStateMachine ─────────────────────────────────────────────────

/** Mantém o estado atual e o timestamp de entrada para HumanEnemy. */
export class EnemyStateMachine {
  private _state: HumanState = 'PATROL'
  private _stateEnteredAt: number = 0
  private _lastKnownX: number = 0
  private _lastKnownY: number = 0
  private readonly _getNow: () => number

  constructor(getNow: () => number) {
    this._getNow = getNow
  }

  get state(): HumanState { return this._state }
  get lastKnownX(): number { return this._lastKnownX }
  get lastKnownY(): number { return this._lastKnownY }

  timeInState(): number {
    return this._getNow() - this._stateEnteredAt
  }

  transition(newState: HumanState): void {
    this._state = newState
    this._stateEnteredAt = this._getNow()
  }

  setLastKnown(x: number, y: number): void {
    this._lastKnownX = x
    this._lastKnownY = y
  }
}
```

- [ ] **Step 5: Executar os testes — confirmar PASS**

```bash
/usr/local/bin/node node_modules/.bin/vitest run tests/EnemyStateMachine.test.ts tests/CounterWindow.test.ts
```

Esperado: todos os testes PASS.

- [ ] **Step 6: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/entities/enemies/EnemyStateMachine.ts tests/EnemyStateMachine.test.ts tests/CounterWindow.test.ts
git commit -m "feat: add EnemyStateMachine pure logic + CounterWindow + tests"
```

---

## Task 2: HumanEnemy Base Class

**Files:**
- Create: `src/entities/enemies/HumanEnemy.ts`

- [ ] **Step 1: Criar src/entities/enemies/HumanEnemy.ts**

```typescript
import Phaser from 'phaser'
import { Enemy } from '../Enemy'
import {
  EnemyStateMachine,
  computeNextHumanState,
  onBarkHeardNextState,
  isInCone,
  type HumanConfig,
} from './EnemyStateMachine'

export { HumanConfig }

export abstract class HumanEnemy extends Enemy {
  override readonly isNPC = true

  protected _sm: EnemyStateMachine
  protected _config: HumanConfig
  protected _playerX: number = 0
  protected _playerY: number = 0

  private _patrolLeft: number
  private _patrolRight: number
  private _detectIcon: Phaser.GameObjects.Text | null = null
  private _attackPhase: 'none' | 'telegraph' | 'hit' = 'none'
  private _attackTimer: number = 0

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    texture: string,
    config: HumanConfig,
  ) {
    super(scene, x, y, texture, 999, config.patrolSpeed)
    this._config = config
    this._sm = new EnemyStateMachine(() => this.scene.time.now)
    this._patrolLeft  = x - config.patrolRange
    this._patrolRight = x + config.patrolRange
    this.setScale(1.6)
    this.setVelocityX(this.speed)
  }

  /** Chamado por GameScene.update() para fornecer posição do jogador. */
  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  /** Chamado quando bark da Cruella é ouvido. */
  onBarkHeard(dist: number): void {
    const next = onBarkHeardNextState(this._sm.state, dist, this._config)
    if (next) {
      this._sm.transition(next)
      if (next === 'DETECT') this._showDetectIcon()
    }
  }

  /** Immune a danos — só pisca */
  override takeDamage(_amount: number = 1): void {
    this.setTint(0xffcccc)
    this.scene.time.delayedCall(120, () => { if (this.active) this.clearTint() })
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    const body = this.body as Phaser.Physics.Arcade.Body
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const inCone = isInCone(
      this.x, this.y, this.direction === 1,
      this._playerX, this._playerY,
      this._config.detectionRange, this._config.coneAngle / 2,
    )

    // Salvar última posição conhecida durante chase
    if (this._sm.state === 'CHASE') {
      this._sm.setLastKnown(this._playerX, this._playerY)
    }

    const next = computeNextHumanState({
      state: this._sm.state,
      timeInState: this._sm.timeInState(),
      distToPlayer: dist,
      playerInCone: inCone,
      config: this._config,
      reachedLastKnown: this._hasReachedLastKnown(),
    })

    if (next) {
      if (next === 'DETECT') this._showDetectIcon()
      else this._hideDetectIcon()
      this._sm.transition(next)
    }

    switch (this._sm.state) {
      case 'PATROL':   this._doPatrol(body);   break
      case 'DETECT':   this._doDetect(body);   break
      case 'CHASE':    this._doChase(body);    break
      case 'SEARCH':   this._doSearch(body);   break
      case 'ATTACK':   this._doAttack(dist);   break
      case 'COOLDOWN': this._doCooldown(body); break
    }

    this.setFlipX(this.direction === -1)
  }

  // ─── Comportamentos por estado ──────────────────────────────────────────────

  private _doPatrol(body: Phaser.Physics.Arcade.Body): void {
    if (body.blocked.left || this.x <= this._patrolLeft) {
      this.direction = 1
    } else if (body.blocked.right || this.x >= this._patrolRight) {
      this.direction = -1
    }
    this.setVelocityX(this.direction * this._config.patrolSpeed)
  }

  private _doDetect(body: Phaser.Physics.Arcade.Body): void {
    // Para durante o "!"
    body.setVelocityX(0)
  }

  private _doChase(body: Phaser.Physics.Arcade.Body): void {
    this.direction = this._playerX > this.x ? 1 : -1
    this.setVelocityX(this.direction * this._config.chaseSpeed)
    // Evitar bordas de parede
    if (body.blocked.left)  this.direction = 1
    if (body.blocked.right) this.direction = -1
  }

  private _doSearch(body: Phaser.Physics.Arcade.Body): void {
    const dx = this._sm.lastKnownX - this.x
    if (Math.abs(dx) > 8) {
      this.direction = dx > 0 ? 1 : -1
      this.setVelocityX(this.direction * this._config.patrolSpeed)
    } else {
      body.setVelocityX(0)
    }
  }

  private _doAttack(dist: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setVelocityX(0)
    const now = this.scene.time.now

    if (this._attackPhase === 'none') {
      // Início do telegraph: tint amarelo por 500ms
      this._attackPhase = 'telegraph'
      this._attackTimer = now
      this.setTint(0xffaa00)
    } else if (this._attackPhase === 'telegraph' && now - this._attackTimer >= 500) {
      // Executar grab se player ainda próximo
      this._attackPhase = 'hit'
      this.clearTint()
      if (dist <= this._config.attackRange + 20) {
        const knockbackDir = this._playerX > this.x ? 1 : -1
        this.emit('grabPlayer', knockbackDir)
      }
      // Transição para COOLDOWN
      this._attackPhase = 'none'
      this._sm.transition('COOLDOWN')
    }
  }

  private _doCooldown(body: Phaser.Physics.Arcade.Body): void {
    // Recuar levemente
    this.direction *= -1
    body.setVelocityX(this.direction * this._config.patrolSpeed * 0.5)
    this.direction *= -1
  }

  // ─── Utilitários ────────────────────────────────────────────────────────────

  private _hasReachedLastKnown(): boolean {
    return (
      this._sm.state === 'SEARCH' &&
      Math.abs(this.x - this._sm.lastKnownX) < 32
    )
  }

  private _showDetectIcon(): void {
    if (this._detectIcon) return
    this._detectIcon = this.scene.add.text(this.x, this.y - 38, '!', {
      fontSize: '20px', color: '#ffff00',
      stroke: '#000000', strokeThickness: 3,
    }).setDepth(10)
    this.scene.tweens.add({
      targets: this._detectIcon,
      y: this._detectIcon.y - 6,
      duration: 200, yoyo: true, repeat: 1,
      onComplete: () => {
        if (this._detectIcon?.active) {
          this._detectIcon.destroy()
          this._detectIcon = null
        }
      },
    })
  }

  private _hideDetectIcon(): void {
    if (this._detectIcon?.active) this._detectIcon.destroy()
    this._detectIcon = null
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/entities/enemies/HumanEnemy.ts
git commit -m "feat: add HumanEnemy base class with state machine"
```

---

## Task 3: Hugo + Hannah → extends HumanEnemy

**Files:**
- Modify: `src/entities/npc/Hugo.ts`
- Modify: `src/entities/npc/Hannah.ts`

- [ ] **Step 1: Substituir Hugo.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from '../enemies/HumanEnemy'

/** Hugo — o dono do apartamento. Patrol lento, cone de 60°, immune a danos. */
export class Hugo extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HUGO, {
      detectionRange: 180,
      coneAngle: 60,
      chaseSpeed: 90,
      patrolSpeed: 55,
      attackRange: 40,
      cooldownDuration: 1200,
      hearingRadius: 120,
      patrolRange: 180,
    })
  }
}
```

- [ ] **Step 2: Substituir Hannah.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from '../enemies/HumanEnemy'

/** Hannah — a dona do apartamento. Levemente mais rápida que Hugo. */
export class Hannah extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HANNAH, {
      detectionRange: 180,
      coneAngle: 60,
      chaseSpeed: 90,
      patrolSpeed: 65,
      attackRange: 40,
      cooldownDuration: 1200,
      hearingRadius: 120,
      patrolRange: 200,
    })
  }
}
```

- [ ] **Step 3: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 5: Commit**

```bash
git add src/entities/npc/Hugo.ts src/entities/npc/Hannah.ts
git commit -m "refactor: Hugo and Hannah extend HumanEnemy"
```

---

## Task 4: Zelador + Morador + constants.ts

**Files:**
- Modify: `src/constants.ts`
- Create: `src/entities/enemies/Zelador.ts`
- Create: `src/entities/enemies/Morador.ts`

- [ ] **Step 1: Adicionar ZELADOR e MORADOR em src/constants.ts**

Localizar o bloco de NPCs/humanos em constants.ts (próximo de `HUGO: 'hugo'`):

```typescript
  HUGO:    'hugo',
  HANNAH:  'hannah',
  ZELADOR: 'zelador',
  MORADOR: 'morador',
```

A linha existente é:
```typescript
  HUGO:   'hugo',
  HANNAH: 'hannah',
```

Substituir por:
```typescript
  HUGO:    'hugo',
  HANNAH:  'hannah',
  ZELADOR: 'zelador',
  MORADOR: 'morador',
```

- [ ] **Step 2: Criar src/entities/enemies/Zelador.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from './HumanEnemy'

/** Zelador — guarda rápido com campo de visão amplo. Usa sprite do Hugo. */
export class Zelador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HUGO, {
      detectionRange: 250,
      coneAngle: 80,
      chaseSpeed: 130,
      patrolSpeed: 70,
      attackRange: 40,
      cooldownDuration: 800,
      hearingRadius: 180,
      patrolRange: 220,
    })
    // Tint levemente cinza para distinguir visualmente do Hugo
    this.setTint(0xdddddd)
  }
}
```

- [ ] **Step 3: Criar src/entities/enemies/Morador.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { HumanEnemy } from './HumanEnemy'

/** Morador — civil cauteloso, alcance curto, move-se devagar. Usa sprite da Hannah. */
export class Morador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.HANNAH, {
      detectionRange: 150,
      coneAngle: 50,
      chaseSpeed: 70,
      patrolSpeed: 45,
      attackRange: 40,
      cooldownDuration: 1500,
      hearingRadius: 80,
      patrolRange: 160,
    })
    // Tint levemente quente para distinguir visualmente da Hannah
    this.setTint(0xffeecc)
  }
}
```

- [ ] **Step 4: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 5: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 6: Commit**

```bash
git add src/constants.ts src/entities/enemies/Zelador.ts src/entities/enemies/Morador.ts
git commit -m "feat: add Zelador and Morador enemies + KEYS constants"
```

---

## Task 5: GatoMalencarado — Redesign com Pounce + Counter Windows

**Files:**
- Redesign: `src/entities/enemies/GatoMalencarado.ts`

O gato agora tem 4 estados: `PATROL → CROUCH → LEAP → RECOVERY`.
Counter Cruella: bark durante CROUCH (400ms) → stun 2s.
Counter Raya: dash durante LEAP (150ms) → stun breve + visual.

- [ ] **Step 1: Reescrever GatoMalencarado.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import {
  checkCounterWindow,
  type CounterWindow,
} from './EnemyStateMachine'

type GatoState = 'PATROL' | 'CROUCH' | 'LEAP' | 'RECOVERY'

const TRIGGER_RADIUS = 120   // px — detecta player
const LEAP_SPEED_X   = 240   // px/s horizontal durante salto
const LEAP_SPEED_Y   = -320  // velocidade vertical do salto

const WINDOW_CRUELLA: CounterWindow = { character: 'cruella', state: 'CROUCH', windowMs: 400, type: 'bark' }
const WINDOW_RAYA:    CounterWindow = { character: 'raya',    state: 'LEAP',   windowMs: 150, type: 'dash' }

export class GatoMalencarado extends Enemy {
  private _patrolStart: number
  private _state: GatoState = 'PATROL'
  private _stateAt: number = 0
  private _activeWindow: CounterWindow | null = null
  private _windowAt: number = 0
  private _outline: Phaser.GameObjects.Graphics | null = null
  private _playerX: number = 0
  private _playerY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.GATO, 1, 80)
    this._patrolStart = x
    this.setVelocityX(this.speed)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  tryCounter(character: 'raya' | 'cruella', type: 'bark' | 'dash' | 'jump'): boolean {
    const now = this.scene.time.now
    const ok = checkCounterWindow(this._activeWindow, this._windowAt, now, character, type)
    if (ok) {
      this._clearWindow()
      const duration = character === 'cruella' ? 2000 : 800
      this.stun(duration)
      this._toState('RECOVERY')
    }
    return ok
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    if (this.isStunned() || this.isFleeing) {
      this._clearWindow()
      return
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const now = this.scene.time.now

    switch (this._state) {
      case 'PATROL': {
        if (body.blocked.left || this.x < this._patrolStart - 128) this.direction = 1
        else if (body.blocked.right || this.x > this._patrolStart + 128) this.direction = -1
        this.setVelocityX(this.direction * this.speed)
        this.setFlipX(this.direction === -1)

        if (dist <= TRIGGER_RADIUS) {
          this._toState('CROUCH')
          this._openWindow(WINDOW_CRUELLA)
          body.setVelocityX(0)
        }
        break
      }

      case 'CROUCH': {
        body.setVelocityX(0)
        // Janela Cruella aberta — outline ciano
        this._updateOutline(0x00ffff)

        if (now - this._stateAt >= 400) {
          this._clearWindow()
          this._toState('LEAP')
          this._openWindow(WINDOW_RAYA)
          // Saltar em direção ao player
          this.direction = this._playerX > this.x ? 1 : -1
          this.setVelocityX(this.direction * LEAP_SPEED_X)
          this.setVelocityY(LEAP_SPEED_Y)
          this.setFlipX(this.direction === -1)
        }
        break
      }

      case 'LEAP': {
        // Janela Raya aberta — outline laranja
        this._updateOutline(0xff8800)

        // Janela fecha após 150ms ou ao aterrissar
        if (now - this._stateAt >= 150) this._clearWindow()

        if (body.blocked.bottom) {
          this._clearWindow()
          this._toState('RECOVERY')
        }
        break
      }

      case 'RECOVERY': {
        this._clearWindow()
        // Vulnerável — sem movimento por 600ms
        body.setVelocityX(0)
        if (now - this._stateAt >= 600) {
          this._toState('PATROL')
          this.setVelocityX(this.direction * this.speed)
        }
        break
      }
    }
  }

  // ─── Utilitários ────────────────────────────────────────────────────────────

  private _toState(s: GatoState): void {
    this._state = s
    this._stateAt = this.scene.time.now
  }

  private _openWindow(w: CounterWindow): void {
    this._activeWindow = w
    this._windowAt = this.scene.time.now
  }

  private _clearWindow(): void {
    this._activeWindow = null
    this._destroyOutline()
  }

  private _updateOutline(color: number): void {
    if (!this._outline) {
      this._outline = this.scene.add.graphics()
      this._outline.setDepth(6)
    }
    this._outline.clear()
    const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now * 0.01)
    this._outline.lineStyle(2, color, pulse)
    this._outline.strokeRect(
      this.x - this.displayWidth / 2 - 2,
      this.y - this.displayHeight / 2 - 2,
      this.displayWidth + 4,
      this.displayHeight + 4,
    )
  }

  private _destroyOutline(): void {
    if (this._outline?.active) this._outline.destroy()
    this._outline = null
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/entities/enemies/GatoMalencarado.ts
git commit -m "feat: redesign GatoMalencarado with pounce + counter windows"
```

---

## Task 6: PomboAgitado — Redesign com Aerial Swoop + Counter Windows

**Files:**
- Redesign: `src/entities/enemies/PomboAgitado.ts`

O pombo voa a 120px de altitude, faz hover 300ms, mergulha. Counter Cruella: bark durante HOVER. Counter Raya: jump stomp durante PATROL_FLY.

- [ ] **Step 1: Reescrever PomboAgitado.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'

type PomboState = 'PATROL_FLY' | 'HOVER' | 'SWOOP' | 'ASCEND'

const SWOOP_TRIGGER_BELOW = 120  // px — distância vertical que activa hover
const SWOOP_TRIGGER_HORIZ = 80   // px — distância horizontal
const HOVER_ALTITUDE      = 120  // px acima do chão
const SWOOP_SPEED_Y       = 400  // px/s no mergulho
const FLY_SPEED           = 100  // px/s em PATROL_FLY

const WINDOW_CRUELLA: CounterWindow = { character: 'cruella', state: 'HOVER',      windowMs: 300,  type: 'bark' }
const WINDOW_RAYA:    CounterWindow = { character: 'raya',    state: 'PATROL_FLY', windowMs: 9999, type: 'jump' }

export class PomboAgitado extends Enemy {
  private _baseY: number
  private _state: PomboState = 'PATROL_FLY'
  private _stateAt: number = 0
  private _activeWindow: CounterWindow | null = null
  private _windowAt: number = 0
  private _outline: Phaser.GameObjects.Graphics | null = null
  private _playerX: number = 0
  private _playerY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.POMBO, 1, FLY_SPEED)
    this._baseY = y
    ;(this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    this.setVelocityX(this.speed)
    // Janela de stomp aberta o tempo todo durante voo
    this._openWindow(WINDOW_RAYA)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  tryCounter(character: 'raya' | 'cruella', type: 'bark' | 'dash' | 'jump'): boolean {
    const now = this.scene.time.now
    const ok = checkCounterWindow(this._activeWindow, this._windowAt, now, character, type)
    if (ok) {
      this._clearWindow()
      if (character === 'cruella') {
        // Bark cancela hover — pombo recua
        this.stun(1500)
        this._toState('ASCEND')
      }
      // jump (stomp): morte tratada pelo stomp overlap em GameScene
    }
    return ok
  }

  update(time: number, _delta: number): void {
    if (!this.active) return
    if (this.isStunned()) { this._clearWindow(); return }

    const body = this.body as Phaser.Physics.Arcade.Body
    const now = this.scene.time.now
    const horizDist = Math.abs(this.x - this._playerX)
    const playerBelow = this._playerY > this.y

    switch (this._state) {
      case 'PATROL_FLY': {
        if (body.blocked.left)  this.direction = 1
        if (body.blocked.right) this.direction = -1
        this.setVelocityX(this.direction * FLY_SPEED)
        this.y = this._baseY + Math.sin(time * 0.003) * 12
        this._updateOutline(0x00ffff) // stomp disponível
        this.setFlipX(this.direction === -1)

        // Ativar hover se player está embaixo e próximo horizontalmente
        if (playerBelow && horizDist <= SWOOP_TRIGGER_HORIZ) {
          this._clearWindow()
          this._toState('HOVER')
          this._openWindow(WINDOW_CRUELLA)
          body.setVelocityX(0)
          body.setVelocityY(0)
        }
        break
      }

      case 'HOVER': {
        body.setVelocityX(0)
        body.setVelocityY(0)
        this._updateOutline(0x00ffff) // bark disponível

        if (now - this._stateAt >= 300) {
          this._clearWindow()
          this._toState('SWOOP')
          body.setVelocityY(SWOOP_SPEED_Y)
        }
        break
      }

      case 'SWOOP': {
        this._clearWindow()
        this._destroyOutline()
        // Sobe ao tocar o chão (sem gravidade — usa y como proxy)
        if (this.y >= this._baseY + HOVER_ALTITUDE) {
          this._toState('ASCEND')
          body.setVelocityY(-SWOOP_SPEED_Y * 0.8)
        }
        break
      }

      case 'ASCEND': {
        if (this.y <= this._baseY) {
          body.setVelocityY(0)
          this.y = this._baseY
          this._toState('PATROL_FLY')
          this._openWindow(WINDOW_RAYA) // reabrir janela de stomp
        }
        break
      }
    }
  }

  // ─── Utilitários ────────────────────────────────────────────────────────────

  private _toState(s: PomboState): void {
    this._state = s
    this._stateAt = this.scene.time.now
  }

  private _openWindow(w: CounterWindow): void {
    this._activeWindow = w
    this._windowAt = this.scene.time.now
  }

  private _clearWindow(): void {
    this._activeWindow = null
    this._destroyOutline()
  }

  private _updateOutline(color: number): void {
    if (!this._outline) {
      this._outline = this.scene.add.graphics()
      this._outline.setDepth(6)
    }
    this._outline.clear()
    const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now * 0.01)
    this._outline.lineStyle(2, color, pulse)
    this._outline.strokeRect(
      this.x - this.displayWidth / 2 - 2,
      this.y - this.displayHeight / 2 - 2,
      this.displayWidth + 4,
      this.displayHeight + 4,
    )
  }

  private _destroyOutline(): void {
    if (this._outline?.active) this._outline.destroy()
    this._outline = null
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/entities/enemies/PomboAgitado.ts
git commit -m "feat: redesign PomboAgitado with aerial swoop + counter windows"
```

---

## Task 7: RatoDeCalcada — Redesign com Speed Dash + Counter Windows

**Files:**
- Redesign: `src/entities/enemies/RatoDeCalcada.ts`

O rato patrulha devagar, faz postura de carga 350ms, depois dá um dash veloz 200ms. Counter Cruella: bark durante CHARGE. Counter Raya: jump durante DASH.

- [ ] **Step 1: Reescrever RatoDeCalcada.ts**

```typescript
import Phaser from 'phaser'
import { KEYS } from '../../constants'
import { Enemy } from '../Enemy'
import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'

type RatoState = 'PATROL' | 'CHARGE' | 'DASH' | 'RECOVERY'

const TRIGGER_RADIUS = 150  // px — detecta player
const DASH_SPEED     = 400  // px/s durante o dash

const WINDOW_CRUELLA: CounterWindow = { character: 'cruella', state: 'CHARGE', windowMs: 350, type: 'bark' }
const WINDOW_RAYA:    CounterWindow = { character: 'raya',    state: 'DASH',   windowMs: 200, type: 'jump' }

export class RatoDeCalcada extends Enemy {
  private _state: RatoState = 'PATROL'
  private _stateAt: number = 0
  private _activeWindow: CounterWindow | null = null
  private _windowAt: number = 0
  private _outline: Phaser.GameObjects.Graphics | null = null
  private _playerX: number = 0
  private _playerY: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, KEYS.RATO, 1, 60)
    this.setVelocityX(this.speed)
  }

  setPlayerPos(px: number, py: number): void {
    this._playerX = px
    this._playerY = py
  }

  tryCounter(character: 'raya' | 'cruella', type: 'bark' | 'dash' | 'jump'): boolean {
    const now = this.scene.time.now
    const ok = checkCounterWindow(this._activeWindow, this._windowAt, now, character, type)
    if (ok) {
      this._clearWindow()
      const duration = character === 'cruella' ? 1500 : 600
      this.stun(duration)
      this._toState('RECOVERY')
    }
    return ok
  }

  update(_time: number, _delta: number): void {
    if (!this.active) return
    if (this.isStunned() || this.isFleeing) { this._clearWindow(); return }

    const body = this.body as Phaser.Physics.Arcade.Body
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this._playerX, this._playerY)
    const now = this.scene.time.now

    switch (this._state) {
      case 'PATROL': {
        if (body.blocked.left)  this.direction = 1
        if (body.blocked.right) this.direction = -1
        this.setVelocityX(this.direction * this.speed)
        this.setFlipX(this.direction === -1)

        if (dist <= TRIGGER_RADIUS) {
          this._toState('CHARGE')
          this._openWindow(WINDOW_CRUELLA)
          body.setVelocityX(0)
          this.direction = this._playerX > this.x ? 1 : -1
        }
        break
      }

      case 'CHARGE': {
        body.setVelocityX(0)
        this._updateOutline(0x00ffff) // bark disponível

        if (now - this._stateAt >= 350) {
          this._clearWindow()
          this._toState('DASH')
          this._openWindow(WINDOW_RAYA)
          this.setVelocityX(this.direction * DASH_SPEED)
          this.setFlipX(this.direction === -1)
        }
        break
      }

      case 'DASH': {
        this._updateOutline(0xff8800) // jump disponível

        if (body.blocked.left || body.blocked.right) {
          this._clearWindow()
          this._toState('RECOVERY')
          break
        }
        if (now - this._stateAt >= 200) {
          this._clearWindow()
          this._toState('RECOVERY')
        }
        break
      }

      case 'RECOVERY': {
        this._clearWindow()
        body.setVelocityX(0)
        if (now - this._stateAt >= 800) {
          this._toState('PATROL')
          this.setVelocityX(this.direction * this.speed)
        }
        break
      }
    }
  }

  // ─── Utilitários ────────────────────────────────────────────────────────────

  private _toState(s: RatoState): void {
    this._state = s
    this._stateAt = this.scene.time.now
  }

  private _openWindow(w: CounterWindow): void {
    this._activeWindow = w
    this._windowAt = this.scene.time.now
  }

  private _clearWindow(): void {
    this._activeWindow = null
    this._destroyOutline()
  }

  private _updateOutline(color: number): void {
    if (!this._outline) {
      this._outline = this.scene.add.graphics()
      this._outline.setDepth(6)
    }
    this._outline.clear()
    const pulse = 0.6 + 0.4 * Math.sin(this.scene.time.now * 0.01)
    this._outline.lineStyle(2, color, pulse)
    this._outline.strokeRect(
      this.x - this.displayWidth / 2 - 2,
      this.y - this.displayHeight / 2 - 2,
      this.displayWidth + 4,
      this.displayHeight + 4,
    )
  }

  private _destroyOutline(): void {
    if (this._outline?.active) this._outline.destroy()
    this._outline = null
  }
}
```

- [ ] **Step 2: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 4: Commit**

```bash
git add src/entities/enemies/RatoDeCalcada.ts
git commit -m "feat: redesign RatoDeCalcada with speed dash + counter windows"
```

---

## Task 8: GameScene — Bark, Dash, Stomp, setPlayerPos, Spawns

**Files:**
- Modify: `src/scenes/GameScene.ts`

Esta task tem 5 sub-alterações:
1. Adicionar imports de Zelador, Morador, HumanEnemy
2. Atualizar bark handler para split humanos/animais
3. Atualizar dash overlap para chamar tryCounter
4. Atualizar stomp overlap para chamar tryCounter e handler de grabPlayer
5. Adicionar setPlayerPos para HumanEnemy, GatoMalencarado, PomboAgitado, RatoDeCalcada no update loop
6. Adicionar casos 'zelador' e 'morador' em `_spawnEnemies`

- [ ] **Step 1: Ler as linhas de imports do GameScene.ts para identificar onde adicionar**

Localizar os imports existentes no topo de `src/scenes/GameScene.ts`. Haverá algo como:

```typescript
import { Hugo } from '../entities/npc/Hugo'
import { Hannah } from '../entities/npc/Hannah'
```

Adicionar após esses imports:

```typescript
import { HumanEnemy } from '../entities/enemies/HumanEnemy'
import { Zelador } from '../entities/enemies/Zelador'
import { Morador } from '../entities/enemies/Morador'
```

- [ ] **Step 2: Atualizar o bark handler**

Localizar o bloco `// ── Enemy stun ─────────────────────────────────────────────────────────────────`:

```typescript
      // ── Enemy stun ─────────────────────────────────────────────────────────
      ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (dist <= PHYSICS.BARK_RADIUS) {
          e.stun(2000)
          this._fx.barkImpact(e.x, e.y)
          this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
        }
      })
```

Substituir por:

```typescript
      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          // Humanos: reagem de acordo com hearingRadius próprio
          e.onBarkHeard(dist)
        } else if (dist <= PHYSICS.BARK_RADIUS) {
          // Animais: stun padrão + verificar counter window
          const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
          if (countered) {
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
          } else {
            e.stun(2000)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
          }
        }
      })
```

- [ ] **Step 3: Atualizar o dash overlap para counter check**

Localizar:

```typescript
    // Dash de Raya causa dano em inimigos durante o movimento
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
    // Dash de Raya causa dano + verifica counter window
    this.physics.add.overlap(this.player.raya, this.enemyGroup, (_r, enemy) => {
      const e = enemy as Enemy
      if (!this.player.raya.getIsDashing()) return
      const countered = (e as any).tryCounter?.('raya', 'dash') ?? false
      if (countered) {
        this._fx.enemyDeathBurst(e.x, e.y)
        this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
      }
      e.takeDamage(1)
      if (!countered) this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
    })
```

- [ ] **Step 4: Adicionar jump counter e grabPlayer no stomp/overlap**

Localizar o bloco do stomp (dentro de `playerSprites.forEach`):

```typescript
        // Stomp: player falling and centre above enemy centre
        if (pBody.velocity.y > 50 && pBody.bottom <= eBody.top + 12) {
          if (!e.isNPC) {
            e.takeDamage(999)
            SoundManager.play('stomp')
            // Hit stop: pausa física por 80ms para dar peso ao golpe
            this.physics.pause()
            this.time.delayedCall(80, () => this.physics.resume())
          }
          pBody.setVelocityY(-380)
          return
        }
```

Substituir por:

```typescript
        // Stomp: player falling and centre above enemy centre
        if (pBody.velocity.y > 50 && pBody.bottom <= eBody.top + 12) {
          if (!e.isNPC) {
            const countered = (e as any).tryCounter?.('raya', 'jump') ?? false
            e.takeDamage(999)
            SoundManager.play('stomp')
            if (countered) {
              this._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
            }
            // Hit stop: pausa física por 80ms para dar peso ao golpe
            this.physics.pause()
            this.time.delayedCall(80, () => this.physics.resume())
          }
          pBody.setVelocityY(-380)
          return
        }
```

Localizar onde as colisões de NPCs (Hugo/Hannah) estão configuradas (bloco de `e.isNPC` dentro do overlap):

```typescript
        // NPCs (Hugo/Hannah): empurra o jogador e causa dano — mas não morrem
        if (e.isNPC) {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          this.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) this._gameOver()
```

Esse bloco já trata o overlap com NPCs usando push/damage. A lógica do `grabPlayer` é adicional — precisamos conectar o evento emitido por HumanEnemy em `_doAttack`. Localizar em `_spawnEnemies` onde os enemies são configurados após criação:

```typescript
      if (!enemy) return
      this.enemyGroup.add(enemy)
      enemy.on('died', (e: Enemy) => {
```

Adicionar logo após `this.enemyGroup.add(enemy)`:

```typescript
      if (enemy instanceof HumanEnemy) {
        enemy.on('grabPlayer', (knockbackDir: number) => {
          this.player.takeDamage()
          SoundManager.play('damage')
          const activeBody = this.player.active.body as Phaser.Physics.Arcade.Body
          activeBody.setVelocityX(knockbackDir * 180)
          activeBody.setVelocityY(-200)
          if (gameState.isDead()) this._gameOver()
        })
      }
```

- [ ] **Step 5: Adicionar setPlayerPos para novos tipos no update loop**

Localizar:

```typescript
      if (e instanceof DonoNervoso) e.setTarget(this.player.x)
      if (e instanceof Aspirador) e.setPlayerPos(this.player.x, this.player.y)
```

Substituir por:

```typescript
      if (e instanceof DonoNervoso) e.setTarget(this.player.x)
      if (e instanceof Aspirador) e.setPlayerPos(this.player.x, this.player.y)
      if (e instanceof HumanEnemy) e.setPlayerPos(this.player.x, this.player.y)
      if ((e as any).setPlayerPos && !(e instanceof HumanEnemy) && !(e instanceof Aspirador)) {
        ;(e as any).setPlayerPos(this.player.x, this.player.y)
      }
```

- [ ] **Step 6: Adicionar casos 'zelador' e 'morador' em _spawnEnemies**

Localizar o switch em `_spawnEnemies`:

```typescript
        case 'hugo':      enemy = new Hugo(this, spawn.x, spawn.y);            break
        case 'hannah':    enemy = new Hannah(this, spawn.x, spawn.y);          break
      }
```

Substituir por:

```typescript
        case 'hugo':      enemy = new Hugo(this, spawn.x, spawn.y);            break
        case 'hannah':    enemy = new Hannah(this, spawn.x, spawn.y);          break
        case 'zelador':   enemy = new Zelador(this, spawn.x, spawn.y);         break
        case 'morador':   enemy = new Morador(this, spawn.x, spawn.y);         break
      }
```

- [ ] **Step 7: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 8: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 9: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: GameScene — bark/dash/stomp counter checks, HumanEnemy grab, Zelador/Morador spawns"
```

---

## Task 9: World0 + World1 — Distribuição Pedagógica de Inimigos

**Files:**
- Modify: `src/levels/World0.ts`
- Modify: `src/levels/World1.ts`

A spec define introdução progressiva:
- **0-2 Estacionamento**: Zelador + Gato (isolado primeiro, depois combo)
- **1-1 Rua Residencial**: Rato + Moradores
- **1-2 Praça com Jardim**: Pombo + mix
- **1-3 Mercadinho**: Gato + Pombo + Rato + humanos

- [ ] **Step 1: Atualizar World0.ts — nível 0-2 (Estacionamento)**

Localizar o bloco `enemies` do nível 0-2 em World0.ts (o que tem comentário "// zelador e porteiro patrulham"):

```typescript
  enemies: [
    { type: 'hugo',   x: 400,  y: 390 },   // zelador (Hugo patrulha a entrada)
    { type: 'gato',   x: 620,  y: 390 },
    { type: 'hannah', x: 900,  y: 390 },   // porteira (Hannah de plantão)
    { type: 'rato',   x: 1100, y: 390 },
    { type: 'gato',   x: 1350, y: 390 },
    { type: 'hugo',   x: 1600, y: 390 },   // zelador (Hugo novamente, mais fundo)
    { type: 'hannah', x: 1800, y: 390 },   // Hannah próxima ao portão
  ],
```

Substituir por (zelador real + gato introduzido sozinho no início):

```typescript
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },  // gato sozinho — zona de ensino do pounce
    { type: 'zelador', x: 700,  y: 390 },  // zelador — patrulha central
    { type: 'gato',    x: 1000, y: 390 },  // segundo gato após aprender
    { type: 'morador', x: 1200, y: 390 },  // morador tranquilo
    { type: 'zelador', x: 1500, y: 390 },  // zelador mais fundo
    { type: 'gato',    x: 1750, y: 390 },  // gato próximo do portão
  ],
```

- [ ] **Step 2: Atualizar World1.ts — nível 1-1 (Rua Residencial)**

Localizar o bloco `enemies` do nível 1-1 em World1.ts (o primeiro nível de World1, que tem gato/pombo/dono):

```typescript
    { type: 'gato',  x: 320,  y: 390 }, { type: 'pombo', x: 640,  y: 200 },
    { type: 'gato',  x: 960,  y: 390 }, { type: 'rato',  x: 1280, y: 390 },
    { type: 'pombo', x: 1600, y: 180 }, { type: 'dono',  x: 1920, y: 390 },
    { type: 'gato',  x: 2200, y: 390 },
```

Substituir por (rato introduzido primeiro, moradores adicionados):

```typescript
    { type: 'rato',    x: 320,  y: 390 },  // rato sozinho — zona de ensino do dash
    { type: 'morador', x: 600,  y: 390 },  // morador tranquilo
    { type: 'rato',    x: 900,  y: 390 },  // segundo rato
    { type: 'morador', x: 1200, y: 390 },  // morador
    { type: 'rato',    x: 1500, y: 390 },  // rato + morador combinados
    { type: 'dono',    x: 1900, y: 390 },  // dono nervoso no final
    { type: 'rato',    x: 2200, y: 390 },
```

- [ ] **Step 3: Atualizar World1.ts — nível 1-2 (Praça com Jardim)**

Localizar o bloco `enemies` do nível 1-2 (segundo nível de World1, que tem gato/rato/pombo/dono):

```typescript
    { type: 'gato',  x: 400,  y: 390 }, { type: 'rato',  x: 700,  y: 390 },
    { type: 'pombo', x: 900,  y: 150 }, { type: 'gato',  x: 1100, y: 390 },
    { type: 'dono',  x: 1400, y: 390 }, { type: 'pombo', x: 1700, y: 180 },
    { type: 'rato',  x: 2000, y: 390 }, { type: 'gato',  x: 2300, y: 390 },
```

Substituir por (pombo introduzido primeiro, mix pedagógico):

```typescript
    { type: 'pombo',   x: 400,  y: 160 },  // pombo sozinho — zona de ensino do swoop
    { type: 'morador', x: 700,  y: 390 },
    { type: 'pombo',   x: 1000, y: 140 },  // segundo pombo
    { type: 'rato',    x: 1300, y: 390 },  // rato + pombo simultaneamente
    { type: 'pombo',   x: 1600, y: 150 },
    { type: 'dono',    x: 1900, y: 390 },
    { type: 'gato',    x: 2200, y: 390 },
```

- [ ] **Step 4: Atualizar World1.ts — nível 1-3 (Mercadinho)**

O nível 1-3 já tem mix completo. Localizar:

```typescript
    { type: 'rato',  x: 300,  y: 390 }, { type: 'gato',  x: 600,  y: 390 },
    { type: 'rato',  x: 800,  y: 390 }, { type: 'pombo', x: 1000, y: 120 },
    { type: 'dono',  x: 1200, y: 390 }, { type: 'rato',  x: 1500, y: 390 },
    { type: 'gato',  x: 1700, y: 390 }, { type: 'pombo', x: 1900, y: 150 },
```

Substituir por (adicionar moradores no mix):

```typescript
    { type: 'rato',    x: 300,  y: 390 }, { type: 'gato',    x: 600,  y: 390 },
    { type: 'morador', x: 800,  y: 390 }, { type: 'pombo',   x: 1000, y: 120 },
    { type: 'dono',    x: 1200, y: 390 }, { type: 'rato',    x: 1500, y: 390 },
    { type: 'gato',    x: 1700, y: 390 }, { type: 'pombo',   x: 1900, y: 150 },
    { type: 'morador', x: 2100, y: 390 },
```

- [ ] **Step 5: TypeScript check**

```bash
/usr/local/bin/node node_modules/.bin/tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 6: Executar todos os testes**

```bash
/usr/local/bin/node node_modules/.bin/vitest run
```

Esperado: todos PASS.

- [ ] **Step 7: Commit**

```bash
git add src/levels/World0.ts src/levels/World1.ts
git commit -m "feat: World0/World1 — pedagogical enemy distribution with Zelador/Morador/counter animals"
```

---

## Self-Review

### Spec Coverage

| Requisito da spec | Task que o implementa |
|---|---|
| EnemyStateMachine com estados PATROL/DETECT/CHASE/SEARCH/ATTACK/COOLDOWN | Task 1 + 2 |
| Cone de visão configurável por tipo | Task 1 (`isInCone`) + Task 2 (`HumanConfig`) |
| Raio de audição separado para bark | Task 1 (`onBarkHeardNextState`) |
| Bark alertando humanos: DETECT/CHASE/reset PATROL | Task 1 (testado) + Task 8 (bark handler) |
| DETECT: pausa 0.5s com "!" | Task 2 (`_showDetectIcon`, `computeNextHumanState` 500ms) |
| SEARCH: vai ao último ponto, 2s de espera | Task 2 (`_doSearch`, `_hasReachedLastKnown`) |
| ATTACK: grab/empurrão 1 dano + 180px knockback | Task 2 (`_doAttack` + `grabPlayer` event) + Task 8 |
| Configurações por tipo (Zelador, Hugo/Hannah, Morador) | Task 3, 4 (`HumanConfig` por classe) |
| Gato: CROUCH→LEAP→RECOVERY + counter windows | Task 5 |
| Pombo: HOVER→SWOOP→ASCEND + counter windows | Task 6 |
| Rato: CHARGE→DASH→RECOVERY + counter windows | Task 7 |
| Outline ciano (Cruella) / laranja (Raya) | Task 5/6/7 (`_updateOutline`) |
| Counter success: visual + popup | Task 8 (bark/dash/stomp handlers) |
| `tryCounter` retorna true/false | Task 5/6/7 + testado em Task 1 |
| Distribuição pedagógica por fase | Task 9 |
| `tests/EnemyStateMachine.test.ts` | Task 1 |
| `tests/CounterWindow.test.ts` | Task 1 |

### Fora de Escopo (não implementado intencionalmente)

- Sons novos (reutiliza assets existentes — `SoundManager.play('damage')`, `'stomp'`)
- Modificação dos bosses (Aspirador, Seu Bigodes)
- Sistema de dificuldade adaptativa
