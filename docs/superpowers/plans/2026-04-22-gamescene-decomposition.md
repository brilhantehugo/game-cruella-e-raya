# GameScene Decomposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extrair lógica de combate para `CombatResolver` (funções puras testáveis) e spawning de inimigos para `LevelBuilder`, reduzindo `GameScene.ts` de 1056 para ~750 linhas sem alterar nenhuma mecânica.

**Architecture:** `CombatResolver` contém funções puras (bark/dash/stomp) que recebem primitivos e retornam resultados tipados — testáveis com vitest sem Phaser. `LevelBuilder` encapsula o switch de 12 tipos de inimigo, com `console.warn` para tipos desconhecidos. `GameScene` torna-se uma camada fina que chama os sistemas e aplica efeitos Phaser.

**Tech Stack:** TypeScript, Phaser 3.87, Vitest

---

## File Structure

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `src/systems/CombatResolver.ts` | Criar | Funções puras: `resolveBarkHit`, `resolveDashHit`, `resolveStompHit` |
| `src/systems/LevelBuilder.ts` | Criar | Factory: `createEnemy(type, x, y)` com 12 tipos + warning |
| `src/scenes/GameScene.ts` | Modificar | `_spawnEnemies()` usa LevelBuilder; `_setupCollisions()` usa CombatResolver |
| `tests/CombatResolver.test.ts` | Criar | 14 testes unitários — zero dependência do Phaser |
| `tests/LevelBuilder.test.ts` | Criar | 1 teste: tipo desconhecido → null + console.warn |

---

### Task 1: CombatResolver — funções puras + testes

**Files:**
- Create: `src/systems/CombatResolver.ts`
- Create: `tests/CombatResolver.test.ts`

- [ ] **Step 1: Criar o arquivo de testes (vai falhar)**

Criar `tests/CombatResolver.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../src/systems/CombatResolver'

describe('resolveBarkHit', () => {
  it('counter tem prioridade máxima mesmo com hp=1 e dentro do raio', () => {
    expect(resolveBarkHit({ hp: 1, dist: 50, barkRadius: 120, countered: true, isNPC: false }))
      .toEqual({ action: 'counter' })
  })

  it('mata inimigo com hp=1 dentro do raio sem counter', () => {
    expect(resolveBarkHit({ hp: 1, dist: 80, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'ko' })
  })

  it('stuna inimigo com hp=3 dentro do raio', () => {
    expect(resolveBarkHit({ hp: 3, dist: 80, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'stun', duration: 2000 })
  })

  it('nada quando dist > barkRadius', () => {
    expect(resolveBarkHit({ hp: 1, dist: 121, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('nada quando dist === barkRadius (limite inclusivo — exatamente no limite afeta)', () => {
    expect(resolveBarkHit({ hp: 1, dist: 120, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'ko' })
  })

  it('nada em NPC mesmo dentro do raio', () => {
    expect(resolveBarkHit({ hp: 1, dist: 50, barkRadius: 120, countered: false, isNPC: true }))
      .toEqual({ action: 'nothing' })
  })

  it('nada quando counter=false e isNPC=false e dist > raio', () => {
    expect(resolveBarkHit({ hp: 1, dist: 200, barkRadius: 120, countered: false, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })
})

describe('resolveDashHit', () => {
  it('counter quando countered=true mesmo com hpAfterDamage=0', () => {
    expect(resolveDashHit({ hpAfterDamage: 0, countered: true }))
      .toEqual({ action: 'counter' })
  })

  it('ko quando hpAfterDamage=0 sem counter', () => {
    expect(resolveDashHit({ hpAfterDamage: 0, countered: false }))
      .toEqual({ action: 'ko' })
  })

  it('damage quando inimigo sobrevive com 2 hp', () => {
    expect(resolveDashHit({ hpAfterDamage: 2, countered: false }))
      .toEqual({ action: 'damage' })
  })

  it('damage quando inimigo sobrevive com 1 hp', () => {
    expect(resolveDashHit({ hpAfterDamage: 1, countered: false }))
      .toEqual({ action: 'damage' })
  })
})

describe('resolveStompHit', () => {
  it('stomp quando queda rápida sobre inimigo não-NPC', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'stomp' })
  })

  it('npc_push quando queda sobre NPC', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 100, eTop: 95, isNPC: true }))
      .toEqual({ action: 'npc_push' })
  })

  it('nada quando velocityY <= 50', () => {
    expect(resolveStompHit({ velocityY: 30, pBottom: 100, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })

  it('nada quando pBottom > eTop + 12', () => {
    expect(resolveStompHit({ velocityY: 200, pBottom: 110, eTop: 95, isNPC: false }))
      .toEqual({ action: 'nothing' })
  })
})
```

- [ ] **Step 2: Verificar que os testes falham**

```bash
npm test -- tests/CombatResolver.test.ts 2>&1 | tail -8
```

Expected: FAIL — `Cannot find module '../src/systems/CombatResolver'`

- [ ] **Step 3: Criar `src/systems/CombatResolver.ts`**

```typescript
export type BarkResult =
  | { action: 'counter' }
  | { action: 'ko' }
  | { action: 'stun'; duration: number }
  | { action: 'nothing' }

export type DashResult =
  | { action: 'counter' }
  | { action: 'ko' }
  | { action: 'damage' }

export type StompResult =
  | { action: 'stomp' }
  | { action: 'npc_push' }
  | { action: 'nothing' }

export function resolveBarkHit(p: {
  hp: number
  dist: number
  barkRadius: number
  countered: boolean
  isNPC: boolean
}): BarkResult {
  if (p.countered) return { action: 'counter' }
  if (p.isNPC || p.dist > p.barkRadius) return { action: 'nothing' }
  if (p.hp <= 1) return { action: 'ko' }
  return { action: 'stun', duration: 2000 }
}

export function resolveDashHit(p: {
  hpAfterDamage: number
  countered: boolean
}): DashResult {
  if (p.countered) return { action: 'counter' }
  if (p.hpAfterDamage <= 0) return { action: 'ko' }
  return { action: 'damage' }
}

export function resolveStompHit(p: {
  velocityY: number
  pBottom: number
  eTop: number
  isNPC: boolean
}): StompResult {
  if (p.velocityY <= 50 || p.pBottom > p.eTop + 12) return { action: 'nothing' }
  if (p.isNPC) return { action: 'npc_push' }
  return { action: 'stomp' }
}
```

- [ ] **Step 4: Rodar testes**

```bash
npm test -- tests/CombatResolver.test.ts 2>&1 | tail -8
```

Expected: 14 tests passing, 0 failing.

- [ ] **Step 5: Rodar suite completa**

```bash
npm test 2>&1 | tail -5
```

Expected: 282 tests passing (268 + 14), 0 failing.

- [ ] **Step 6: Commit**

```bash
git add src/systems/CombatResolver.ts tests/CombatResolver.test.ts
git commit -m "feat: add CombatResolver pure functions with 14 unit tests"
```

---

### Task 2: LevelBuilder — factory de inimigos + teste

**Files:**
- Create: `src/systems/LevelBuilder.ts`
- Create: `tests/LevelBuilder.test.ts`

- [ ] **Step 1: Criar o teste que falha**

Criar `tests/LevelBuilder.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { LevelBuilder } from '../src/systems/LevelBuilder'

// Mock de Phaser.Scene mínimo — apenas o suficiente para o construtor
const mockScene = {
  add: { existing: vi.fn() },
  physics: { add: { existing: vi.fn() } },
  sys: { events: { on: vi.fn(), once: vi.fn(), off: vi.fn() } },
  events: { on: vi.fn(), once: vi.fn() },
} as unknown as Phaser.Scene

describe('LevelBuilder.createEnemy', () => {
  it('retorna null e loga warning para tipo desconhecido', () => {
    const builder = new LevelBuilder(mockScene)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = builder.createEnemy('alienígena', 0, 0)
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('alienígena')
    )
    warnSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Verificar que o teste falha**

```bash
npm test -- tests/LevelBuilder.test.ts 2>&1 | tail -8
```

Expected: FAIL — `Cannot find module '../src/systems/LevelBuilder'`

- [ ] **Step 3: Criar `src/systems/LevelBuilder.ts`**

```typescript
import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { GatoMalencarado }  from '../entities/enemies/GatoMalencarado'
import { PomboAgitado }     from '../entities/enemies/PomboAgitado'
import { RatoDeCalcada }    from '../entities/enemies/RatoDeCalcada'
import { DonoNervoso }      from '../entities/enemies/DonoNervoso'
import { Aspirador }        from '../entities/enemies/Aspirador'
import { GatoSelvagem }     from '../entities/enemies/GatoSelvagem'
import { Seguranca }        from '../entities/enemies/Seguranca'
import { Porteiro }         from '../entities/enemies/Porteiro'
import { Zelador }          from '../entities/enemies/Zelador'
import { Morador }          from '../entities/enemies/Morador'
import { Hugo }             from '../entities/npc/Hugo'
import { Hannah }           from '../entities/npc/Hannah'

export class LevelBuilder {
  constructor(private scene: Phaser.Scene) {}

  /**
   * Instancia o inimigo correto para o tipo dado.
   * Retorna null e loga warning para tipos desconhecidos.
   */
  createEnemy(type: string, x: number, y: number): Enemy | null {
    switch (type) {
      case 'gato':          return new GatoMalencarado(this.scene, x, y)
      case 'pombo':         return new PomboAgitado(this.scene, x, y)
      case 'rato':          return new RatoDeCalcada(this.scene, x, y)
      case 'dono':          return new DonoNervoso(this.scene, x, y)
      case 'aspirador':     return new Aspirador(this.scene, x, y)
      case 'hugo':          return new Hugo(this.scene, x, y)
      case 'hannah':        return new Hannah(this.scene, x, y)
      case 'zelador':       return new Zelador(this.scene, x, y)
      case 'morador':       return new Morador(this.scene, x, y)
      case 'gato_selvagem': return new GatoSelvagem(this.scene, x, y)
      case 'seguranca':     return new Seguranca(this.scene, x, y)
      case 'porteiro':      return new Porteiro(this.scene, x, y)
      default:
        console.warn(`[LevelBuilder] tipo de inimigo desconhecido: "${type}"`)
        return null
    }
  }
}
```

- [ ] **Step 4: Rodar teste**

```bash
npm test -- tests/LevelBuilder.test.ts 2>&1 | tail -8
```

Expected: 1 test passing, 0 failing.

- [ ] **Step 5: Rodar suite completa**

```bash
npm test 2>&1 | tail -5
```

Expected: 283 passing (282 + 1), 0 failing.

- [ ] **Step 6: Commit**

```bash
git add src/systems/LevelBuilder.ts tests/LevelBuilder.test.ts
git commit -m "feat: add LevelBuilder enemy factory with unknown-type warning"
```

---

### Task 3: Refatorar GameScene._spawnEnemies() para usar LevelBuilder

**Files:**
- Modify: `src/scenes/GameScene.ts:336-387`

O objetivo é substituir o `switch` de 12 cases por uma chamada ao `LevelBuilder.createEnemy()`. Os listeners de eventos específicos ('grabPlayer', 'spawnChave') e toda a lógica de boss (linhas 388–573) permanecem **inalterados**.

- [ ] **Step 1: Adicionar import de LevelBuilder no topo de GameScene.ts**

Localizar o bloco de imports (linha ~38) e adicionar logo após o último import:

```typescript
import { LevelBuilder } from '../systems/LevelBuilder'
```

- [ ] **Step 2: Substituir o switch em _spawnEnemies()**

Localizar o método `_spawnEnemies()` — o trecho exato a substituir (linhas 336–386):

```typescript
  private _spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group()
    this.currentLevel.enemies.forEach(spawn => {
      let enemy: Enemy | undefined
      switch (spawn.type) {
        case 'gato':      enemy = new GatoMalencarado(this, spawn.x, spawn.y); break
        case 'pombo':     enemy = new PomboAgitado(this, spawn.x, spawn.y);    break
        case 'rato':      enemy = new RatoDeCalcada(this, spawn.x, spawn.y);   break
        case 'dono':      enemy = new DonoNervoso(this, spawn.x, spawn.y);     break
        case 'aspirador': enemy = new Aspirador(this, spawn.x, spawn.y);       break
        case 'hugo':      enemy = new Hugo(this, spawn.x, spawn.y);            break
        case 'hannah':    enemy = new Hannah(this, spawn.x, spawn.y);          break
        case 'zelador':   enemy = new Zelador(this, spawn.x, spawn.y);         break
        case 'morador':   enemy = new Morador(this, spawn.x, spawn.y);         break
        case 'gato_selvagem': enemy = new GatoSelvagem(this, spawn.x, spawn.y); break
        case 'seguranca':     enemy = new Seguranca(this, spawn.x, spawn.y);    break
        case 'porteiro':      enemy = new Porteiro(this, spawn.x, spawn.y);     break
      }
      if (!enemy) return
      this.enemyGroup.add(enemy)
```

Substituir por:

```typescript
  private _spawnEnemies(): void {
    this.enemyGroup = this.physics.add.group()
    const builder = new LevelBuilder(this)
    this.currentLevel.enemies.forEach(spawn => {
      const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
      if (!enemy) return
      this.enemyGroup.add(enemy)
```

O restante do método (listeners de 'grabPlayer', 'spawnChave', 'died' e toda a lógica de boss) permanece exatamente como está.

- [ ] **Step 3: Remover imports de classes de inimigo que agora só existem em LevelBuilder**

Localizar no topo de GameScene.ts os imports que migraram para LevelBuilder e removê-los:

```typescript
// REMOVER estas linhas (agora são responsabilidade de LevelBuilder):
import { GatoMalencarado } from '../entities/enemies/GatoMalencarado'
import { PomboAgitado }     from '../entities/enemies/PomboAgitado'
import { RatoDeCalcada }    from '../entities/enemies/RatoDeCalcada'
import { DonoNervoso }      from '../entities/enemies/DonoNervoso'
import { Aspirador }        from '../entities/enemies/Aspirador'
import { GatoSelvagem }     from '../entities/enemies/GatoSelvagem'
import { Seguranca }        from '../entities/enemies/Seguranca'
import { Porteiro }         from '../entities/enemies/Porteiro'
import { Zelador }          from '../entities/enemies/Zelador'
import { Morador }          from '../entities/enemies/Morador'
import { Hugo }             from '../entities/npc/Hugo'
import { Hannah }           from '../entities/npc/Hannah'
```

**Atenção:** Zelador, Porteiro, GatoSelvagem, Seguranca e HumanEnemy ainda são referenciados em GameScene para os bosses/mini-bosses e listeners. Verificar quais ainda são necessários:

- `Zelador` — usado na linha de `boss.on('spawnMinion', ...)` do ZeladorBoss → **manter**
- `HumanEnemy` — usado em `instanceof HumanEnemy` check no bark handler → **manter**
- `Porteiro` — usado em `instanceof Porteiro` check para 'spawnChave' listener → **manter**
- `Aspirador`, `Drone`, `ZeladorBoss`, `SeuBigodes`, `SegurancaMoto` — usados nos bosses → **manter**

Portanto remover apenas: `GatoMalencarado`, `PomboAgitado`, `RatoDeCalcada`, `DonoNervoso`, `GatoSelvagem`, `Seguranca`, `Hugo`, `Hannah`, `Morador`

- [ ] **Step 4: Build para verificar TypeScript**

```bash
npm run build 2>&1 | tail -8
```

Expected: sem erros TypeScript. Se houver "cannot find name X", é um import que foi removido indevidamente — restaurar o import específico.

- [ ] **Step 5: Rodar testes**

```bash
npm test 2>&1 | tail -5
```

Expected: 283 passing, 0 failing.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: _spawnEnemies() delegates enemy factory to LevelBuilder"
```

---

### Task 4: Refatorar GameScene._setupCollisions() para usar CombatResolver

**Files:**
- Modify: `src/scenes/GameScene.ts:662-828`

- [ ] **Step 1: Adicionar import de CombatResolver em GameScene.ts**

Logo abaixo do import de LevelBuilder (adicionado na Task 3):

```typescript
import { resolveBarkHit, resolveDashHit, resolveStompHit } from '../systems/CombatResolver'
```

- [ ] **Step 2: Substituir a lógica de stomp no overlap jogador ↔ inimigos**

Localizar este trecho exato dentro de `_setupCollisions()` (no callback do `physics.add.overlap(sprite, enemyGroup, ...)`):

```typescript
        // Stomp: player falling and centre above enemy centre
        if (pBody.velocity.y > 50 && pBody.bottom <= eBody.top + 12) {
          if (!e.isNPC) {
            const stompCountered = (e as any).tryCounter?.('raya', 'jump') ?? false
            e.takeDamage(999)
            SoundManager.play('stomp')
            if (stompCountered) {
              this._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
            }
            // Hit stop: pausa física por 80ms para dar peso ao golpe
            this.physics.pause()
            this.time.delayedCall(80, () => this.physics.resume())
          }
          pBody.setVelocityY(-380)
          return
        }

        // NPCs (Hugo/Hannah): empurra o jogador e causa dano — mas não morrem
        if (e.isNPC) {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          this.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) this._gameOver()
          return
        }
```

Substituir por:

```typescript
        // Stomp / NPC push — decisão delegada ao CombatResolver
        const stompResult = resolveStompHit({
          velocityY: pBody.velocity.y,
          pBottom: pBody.bottom,
          eTop: eBody.top,
          isNPC: e.isNPC,
        })
        if (stompResult.action === 'stomp') {
          const countered = (e as any).tryCounter?.('raya', 'jump') ?? false
          e.takeDamage(999)
          SoundManager.play('stomp')
          if (countered) this._spawnScorePopup(e.x, e.y - 28, 'COUNTER!', '#22ccff')
          this.physics.pause()
          this.time.delayedCall(80, () => this.physics.resume())
          pBody.setVelocityY(-380)
          return
        }
        if (stompResult.action === 'npc_push') {
          const pushDir = (ps as Phaser.Physics.Arcade.Sprite).x < e.x ? -1 : 1
          pBody.setVelocityX(pushDir * 340)
          pBody.setVelocityY(-220)
          this.player.takeDamage()
          SoundManager.play('damage')
          if (gameState.isDead()) this._gameOver()
          return
        }
```

- [ ] **Step 3: Substituir a lógica de bark no handler do evento 'bark'**

Localizar o trecho dentro de `this.player.cruella.on('bark', ...)` que processa inimigos (após as ondas visuais e camera shake):

```typescript
      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          // Humanos: reagem com máquina de estados (hearingRadius próprio)
          e.onBarkHeard(dist)
        } else if (dist <= PHYSICS.BARK_RADIUS) {
          // Animais: verifica counter window primeiro
          const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
          if (countered) {
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
          } else if (e.hp <= 1) {
            e.takeDamage(999)
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(50) // 'died' event already adds +50; net = +100
          } else {
            e.stun(2000)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
          }
        }
      })
```

Substituir por:

```typescript
      // ── Enemy reactions ao bark ────────────────────────────────────────────
      ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
        const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
        if (e instanceof HumanEnemy) {
          e.onBarkHeard(dist)
          return
        }
        const countered = (e as any).tryCounter?.('cruella', 'bark') ?? false
        const result = resolveBarkHit({ hp: e.hp, dist, barkRadius: PHYSICS.BARK_RADIUS, countered, isNPC: e.isNPC })
        switch (result.action) {
          case 'counter':
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#22ccff')
            break
          case 'ko':
            e.takeDamage(999)
            this._fx.enemyDeathBurst(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'KO! +100', '#22ccff')
            gameState.addScore(50) // 'died' event already adds +50; net = +100
            break
          case 'stun':
            e.stun(result.duration)
            this._fx.barkImpact(e.x, e.y)
            this._spawnScorePopup(e.x, e.y - 24, 'STUN!', '#ffdd00')
            break
          // 'nothing': sem ação
        }
      })
```

- [ ] **Step 4: Substituir a lógica de dash no overlap Raya ↔ inimigos**

Localizar o trecho `this.physics.add.overlap(this.player.raya, this.enemyGroup, ...)` ao final de `_setupCollisions()`:

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
      if (!countered) {
        if (e.hp <= 0) {
          this._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(50) // 'died' event already adds +50; net = +100
        } else {
          this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          if (e.active) this._enemyHPBar.show(e)
        }
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
      e.takeDamage(1)
      const result = resolveDashHit({ hpAfterDamage: e.hp, countered })
      switch (result.action) {
        case 'counter':
          this._fx.enemyDeathBurst(e.x, e.y)
          this._spawnScorePopup(e.x, e.y - 24, 'COUNTER!', '#f97316')
          break
        case 'ko':
          this._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
          gameState.addScore(50) // 'died' event already adds +50; net = +100
          break
        case 'damage':
          this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
          if (e.active) this._enemyHPBar.show(e)
          break
      }
    })
```

- [ ] **Step 5: Build**

```bash
npm run build 2>&1 | tail -8
```

Expected: sem erros TypeScript.

- [ ] **Step 6: Rodar suite completa**

```bash
npm test 2>&1 | tail -5
```

Expected: 283 passing, 0 failing.

- [ ] **Step 7: Verificar tamanho final do GameScene.ts**

```bash
wc -l src/scenes/GameScene.ts
```

Expected: ≤ 800 linhas (de 1056 originais).

- [ ] **Step 8: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "refactor: _setupCollisions() delegates combat decisions to CombatResolver"
```
