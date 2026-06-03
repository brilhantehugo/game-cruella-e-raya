# Enemy Animations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer gato, gato selvagem, rato e pombo tocarem `idle`/`walk`/`run` conforme a magnitude de velocidade, via função pura `enemyAnimState`.

**Architecture:** Uma função pura testável `enemyAnimState(speed)` mapeia velocidade para estado de anim. Cada um dos 4 inimigos chama `this.play(\`${prefix}_${enemyAnimState(hypot(vx,vy))}\`, true)` no fim do seu `update()`. Sem novos assets — as animações já existem em BootScene.

**Tech Stack:** TypeScript, Phaser 3 (anims), Vitest

---

## Estrutura de arquivos

| Arquivo | Mudança |
|---|---|
| `src/entities/enemies/enemyAnimState.ts` | **Criar** — função pura + tipo |
| `tests/enemyAnimState.test.ts` | **Criar** — testes dos limiares |
| `src/entities/enemies/GatoMalencarado.ts` | Import + `play()` no fim de `update()` |
| `src/entities/enemies/GatoSelvagem.ts` | Import + `play()` no fim do `update()` próprio |
| `src/entities/enemies/RatoDeCalcada.ts` | Import + `play()` no fim de `update()` |
| `src/entities/enemies/PomboAgitado.ts` | Import + `play()` no fim de `update()` |

---

## Task 1: Função pura enemyAnimState (TDD)

**Files:**
- Create: `src/entities/enemies/enemyAnimState.ts`
- Create: `tests/enemyAnimState.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/enemyAnimState.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { enemyAnimState } from '../src/entities/enemies/enemyAnimState'

describe('enemyAnimState', () => {
  it('velocidade 0 → idle', () => {
    expect(enemyAnimState(0)).toBe('idle')
  })
  it('abaixo de 10 → idle', () => {
    expect(enemyAnimState(9)).toBe('idle')
  })
  it('exatamente 10 → walk', () => {
    expect(enemyAnimState(10)).toBe('walk')
  })
  it('velocidade de patrulha (60-100) → walk', () => {
    expect(enemyAnimState(60)).toBe('walk')
    expect(enemyAnimState(80)).toBe('walk')
    expect(enemyAnimState(100)).toBe('walk')
  })
  it('logo abaixo de 150 → walk', () => {
    expect(enemyAnimState(149)).toBe('walk')
  })
  it('exatamente 150 → run', () => {
    expect(enemyAnimState(150)).toBe('run')
  })
  it('velocidades de chase/dash (200-400) → run', () => {
    expect(enemyAnimState(200)).toBe('run')
    expect(enemyAnimState(400)).toBe('run')
  })
  it('velocidade negativa usa magnitude absoluta', () => {
    expect(enemyAnimState(-80)).toBe('walk')
    expect(enemyAnimState(-300)).toBe('run')
  })
})
```

- [ ] **Step 2: Rodar o teste para verificar que falha**

```bash
npx vitest run tests/enemyAnimState.test.ts
```

Esperado: FAIL — `Cannot find module '../src/entities/enemies/enemyAnimState'`

- [ ] **Step 3: Criar `src/entities/enemies/enemyAnimState.ts`**

```typescript
export type EnemyAnimState = 'idle' | 'walk' | 'run'

const WALK_THRESHOLD = 10   // abaixo disso → idle
const RUN_THRESHOLD  = 150  // a partir disso → run

/** Mapeia magnitude de velocidade (px/s) para estado de animação. */
export function enemyAnimState(speed: number): EnemyAnimState {
  const s = Math.abs(speed)
  if (s < WALK_THRESHOLD) return 'idle'
  if (s < RUN_THRESHOLD)  return 'walk'
  return 'run'
}
```

- [ ] **Step 4: Rodar o teste para verificar que passa**

```bash
npx vitest run tests/enemyAnimState.test.ts
```

Esperado: `8 passed`

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemies/enemyAnimState.ts tests/enemyAnimState.test.ts
git commit -m "feat: add enemyAnimState pure function for velocity→anim mapping"
```

---

## Task 2: Animar GatoMalencarado

**Files:**
- Modify: `src/entities/enemies/GatoMalencarado.ts`

> Contexto: `GatoMalencarado.update()` tem um `switch` por estado (PATROL/CROUCH/LEAP/RECOVERY) que termina por volta da linha 116, antes do fechamento `}` do método na linha 117. Nunca chama `play()`. Adicionamos a anim no fim do método, após o `switch`. Prefixo: `gato`.

- [ ] **Step 1: Adicionar import no topo de `src/entities/enemies/GatoMalencarado.ts`**

Após os imports existentes (após o bloco de import de `EnemyStateMachine`), adicionar:

```typescript
import { enemyAnimState } from './enemyAnimState'
```

- [ ] **Step 2: Tocar a anim no fim de `update()`**

Localizar o fim do método `update()` — após o `switch (this._state) { ... }` fechar e antes do `}` que fecha o método. A estrutura atual é:

```typescript
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
      // ... casos ...
    }
  }
```

Adicionar a linha de anim logo após o fechamento do `switch`, antes do `}` final do método:

```typescript
    switch (this._state) {
      // ... casos inalterados ...
    }

    this.play(`gato_${enemyAnimState(Math.hypot(body.velocity.x, body.velocity.y))}`, true)
  }
```

> `body` já está declarado no início de `update()` — reutilizar.

- [ ] **Step 3: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhum erro.

- [ ] **Step 4: Rodar testes existentes**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemies/GatoMalencarado.ts
git commit -m "feat: animate GatoMalencarado by movement state"
```

---

## Task 3: Animar GatoSelvagem

**Files:**
- Modify: `src/entities/enemies/GatoSelvagem.ts`

> Contexto: `GatoSelvagem extends GatoMalencarado` mas tem `override update()` completo (lógica WANDER/CHASE). No fim desse método há um `if (this._gsState === 'CHASE') { ... } else { ... }` que define a velocidade. Prefixo: `gato_selvagem`. NÃO herda a anim do pai porque o update é override total.

- [ ] **Step 1: Adicionar import no topo de `src/entities/enemies/GatoSelvagem.ts`**

Após os imports existentes (após `import { isNearLight, ... }`), adicionar:

```typescript
import { enemyAnimState } from './enemyAnimState'
```

- [ ] **Step 2: Tocar a anim no fim do `update()` próprio**

Localizar o fim do método `override update()`. A estrutura atual termina assim:

```typescript
    if (this._gsState === 'CHASE') {
      const dir = this._gsPlayerX > this.x ? 1 : -1
      body.setVelocityX(dir * CHASE_SPEED)
      this.setFlipX(dir < 0)
    } else {
      // WANDER — random direction changes
      this._wanderChangeTimer -= delta
      if (this._wanderChangeTimer <= 0 || body.blocked.left || body.blocked.right) {
        if (body.blocked.left)  this._wanderDir = 1
        else if (body.blocked.right) this._wanderDir = -1
        else this._wanderDir = Math.random() > 0.5 ? 1 : -1
        this._wanderChangeTimer = Phaser.Math.Between(800, 2200)
      }
      body.setVelocityX(this._wanderDir * WANDER_SPEED)
      this.setFlipX(this._wanderDir < 0)
    }
  }
```

Adicionar a linha de anim antes do `}` final do método:

```typescript
    } else {
      // ... bloco WANDER inalterado ...
    }

    this.play(`gato_selvagem_${enemyAnimState(Math.hypot(body.velocity.x, body.velocity.y))}`, true)
  }
```

> `body` já está declarado no `update()` do GatoSelvagem — reutilizar.

- [ ] **Step 3: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhum erro.

- [ ] **Step 4: Rodar testes existentes**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemies/GatoSelvagem.ts
git commit -m "feat: animate GatoSelvagem by WANDER/CHASE speed"
```

---

## Task 4: Animar RatoDeCalcada

**Files:**
- Modify: `src/entities/enemies/RatoDeCalcada.ts`

> Contexto: `RatoDeCalcada.update()` tem `switch` por estado (PATROL/CHARGE/DASH/RECOVERY). `body` é declarado no início do método. Já faz `play('rato_idle')` no construtor (mantém). Prefixo: `rato`.

- [ ] **Step 1: Adicionar import no topo de `src/entities/enemies/RatoDeCalcada.ts`**

Após `import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'`, adicionar:

```typescript
import { enemyAnimState } from './enemyAnimState'
```

- [ ] **Step 2: Tocar a anim no fim de `update()`**

Localizar o fim do método `update()`, após o `switch (this._state) { ... }` fechar. Adicionar antes do `}` final do método:

```typescript
    switch (this._state) {
      // ... casos inalterados ...
    }

    this.play(`rato_${enemyAnimState(Math.hypot(body.velocity.x, body.velocity.y))}`, true)
  }
```

> `body` já está declarado no início de `update()` — reutilizar.

- [ ] **Step 3: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhum erro.

- [ ] **Step 4: Rodar testes existentes**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 5: Commit**

```bash
git add src/entities/enemies/RatoDeCalcada.ts
git commit -m "feat: animate RatoDeCalcada by movement state"
```

---

## Task 5: Animar PomboAgitado

**Files:**
- Modify: `src/entities/enemies/PomboAgitado.ts`

> Contexto: `PomboAgitado.update()` tem `switch` por estado (PATROL_FLY/HOVER/SWOOP/ASCEND). `body` é declarado no início do método. SWOOP é vertical (vy=400, vx=0) — por isso usamos `hypot` para classificar como run. Já faz `play('pombo_idle')` no construtor (mantém). Prefixo: `pombo`.

- [ ] **Step 1: Adicionar import no topo de `src/entities/enemies/PomboAgitado.ts`**

Após `import { checkCounterWindow, type CounterWindow } from './EnemyStateMachine'`, adicionar:

```typescript
import { enemyAnimState } from './enemyAnimState'
```

- [ ] **Step 2: Tocar a anim no fim de `update()`**

Localizar o fim do método `update()`, após o `switch (this._state) { ... }` fechar. Adicionar antes do `}` final do método:

```typescript
    switch (this._state) {
      // ... casos inalterados ...
    }

    this.play(`pombo_${enemyAnimState(Math.hypot(body.velocity.x, body.velocity.y))}`, true)
  }
```

> `body` já está declarado no início de `update()` — reutilizar. O `update()` do pombo tem assinatura `update(time: number, _delta: number)` — não alterar a assinatura.

- [ ] **Step 3: Build TypeScript**

```bash
npm run build 2>&1 | grep "error TS" | head -5
```

Esperado: nenhum erro.

- [ ] **Step 4: Rodar todos os testes**

```bash
npx vitest run
```

Esperado: todos passam.

- [ ] **Step 5: Build final + commit**

```bash
npm run build 2>&1 | grep "error TS" | head -5
git add src/entities/enemies/PomboAgitado.ts
git commit -m "feat: animate PomboAgitado by movement state (hypot covers vertical swoop)"
```
