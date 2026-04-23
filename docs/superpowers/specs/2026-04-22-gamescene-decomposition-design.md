# GameScene Decomposition — Design Spec

**Data:** 2026-04-22
**Status:** Aprovado

---

## Objetivo

Reduzir `GameScene.ts` (1056 linhas) extraindo lógica de combate e spawning para módulos dedicados, sem alterar nenhuma mecânica de jogo. Resultado: arquivo menor, lógica de combate testável com vitest sem Phaser, factory de inimigos com warning para tipos desconhecidos.

---

## Arquitetura

### Arquivos criados

| Arquivo | Responsabilidade |
|---|---|
| `src/systems/CombatResolver.ts` | Funções puras de decisão de combate — bark, dash, stomp |
| `src/systems/LevelBuilder.ts` | Factory de inimigos, itens e decorações por tipo de spawn |
| `tests/CombatResolver.test.ts` | ~20 testes unitários sem dependência do Phaser |
| `tests/LevelBuilder.test.ts` | Testa roteamento do factory (null + warning para tipo desconhecido) |

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/scenes/GameScene.ts` | `_setupCollisions()` usa CombatResolver; `_spawnEnemies()` usa LevelBuilder |

### Princípio central

Separar **decisão** (pura, testável) de **efeito** (Phaser, não testável em Node):

- Os callbacks do Phaser chamam `tryCounter()` no inimigo, coletam `hp`, `dist`, etc., e passam esses **primitivos** para o resolver.
- O resolver retorna um resultado tipado (`{ action: 'ko' }`, `{ action: 'stun', duration: 2000 }`, etc.).
- O GameScene aplica os efeitos (twenn, câmera, score, popup) com base no retorno.

---

## CombatResolver

### Tipos de retorno

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
```

### Assinaturas das funções

```typescript
export function resolveBarkHit(p: {
  hp: number
  dist: number
  barkRadius: number
  countered: boolean
  isNPC: boolean
}): BarkResult

export function resolveDashHit(p: {
  hpAfterDamage: number   // hp já reduzido por takeDamage(1)
  countered: boolean
}): DashResult

export function resolveStompHit(p: {
  velocityY: number
  pBottom: number
  eTop: number
  isNPC: boolean
}): StompResult
```

### Regras de decisão

#### resolveBarkHit
1. Se `countered` → `{ action: 'counter' }` (prioridade máxima)
2. Se `isNPC` ou `dist > barkRadius` → `{ action: 'nothing' }`
3. Se `hp <= 1` → `{ action: 'ko' }`
4. Senão → `{ action: 'stun', duration: 2000 }`

#### resolveDashHit
1. Se `countered` → `{ action: 'counter' }`
2. Se `hpAfterDamage <= 0` → `{ action: 'ko' }`
3. Senão → `{ action: 'damage' }`

#### resolveStompHit
1. Se `velocityY <= 50` ou `pBottom > eTop + 12` → `{ action: 'nothing' }`
2. Se `isNPC` → `{ action: 'npc_push' }`
3. Senão → `{ action: 'stomp' }`

---

## LevelBuilder

### API

```typescript
export class LevelBuilder {
  constructor(private scene: Phaser.Scene) {}

  createEnemy(type: string, x: number, y: number): Enemy | null
  spawnEnemies(spawns: EnemySpawn[], group: Phaser.Physics.Arcade.Group): Enemy[]
  spawnItems(
    spawns: ItemSpawn[],
    goldenBones: Array<{ x: number; y: number }>,
    group: Phaser.Physics.Arcade.StaticGroup
  ): void
  spawnDecorations(decs: DecorationSpawn[], layer: Phaser.Physics.Arcade.StaticGroup): void
}
```

### Comportamento de createEnemy

- Mapeia `type: string` para a classe concreta correspondente (switch com 15 cases).
- Tipos desconhecidos: `console.warn('[LevelBuilder] tipo desconhecido: "X"')` e retorna `null`.
- O switch existente em `GameScene._spawnEnemies()` migra integralmente para cá.

### GameScene._spawnEnemies() após extração

```typescript
private _spawnEnemies(): void {
  const builder = new LevelBuilder(this)
  this.currentLevel.enemies.forEach(spawn => {
    const enemy = builder.createEnemy(spawn.type, spawn.x, spawn.y)
    if (!enemy) return
    this.enemyGroup.add(enemy)
    enemy.on('died', (e: Enemy) => {
      gameState.addScore(50)
      gameState.sessionEnemiesKilled++
      this._am?.notify('enemy_killed')
      this._killCountInLevel++
      this._fx.enemyDeathBurst(e.x, e.y)
      this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
    })
  })
  this._setupBoss()
}
```

---

## GameScene._setupCollisions() após refactor

Estrutura esperada após extração — de 167 para ~60 linhas:

```typescript
private _setupCollisions(): void {
  // 1. Colisores de física (chão, plataformas, decorações) — inalterado
  // 2. Overlap jogador ↔ inimigos — chama resolveStompHit / player takeDamage
  // 3. Overlap jogador ↔ itens — chama _handleItemCollect (inalterado)
  // 4. Evento 'bark' da Cruella — chama resolveBarkHit, aplica efeitos
  // 5. Projéteis de boss (inalterado)
  // 6. Dash de Raya — chama resolveDashHit, aplica efeitos
}
```

---

## Testes — CombatResolver

Cobertura mínima esperada:

| Caso | Função | Resultado esperado |
|---|---|---|
| Bark: counter com hp=1 dentro do raio | resolveBarkHit | `{ action: 'counter' }` |
| Bark: mata inimigo hp=1 sem counter | resolveBarkHit | `{ action: 'ko' }` |
| Bark: stuna inimigo hp=3 | resolveBarkHit | `{ action: 'stun', duration: 2000 }` |
| Bark: nada fora do raio | resolveBarkHit | `{ action: 'nothing' }` |
| Bark: nada em NPC | resolveBarkHit | `{ action: 'nothing' }` |
| Dash: counter | resolveDashHit | `{ action: 'counter' }` |
| Dash: KO (hpAfterDamage=0) | resolveDashHit | `{ action: 'ko' }` |
| Dash: dano parcial (hpAfterDamage=1) | resolveDashHit | `{ action: 'damage' }` |
| Stomp: queda rápida sobre inimigo | resolveStompHit | `{ action: 'stomp' }` |
| Stomp: queda sobre NPC | resolveStompHit | `{ action: 'npc_push' }` |
| Stomp: velocidade baixa (sem queda) | resolveStompHit | `{ action: 'nothing' }` |
| Stomp: pBottom > eTop+12 | resolveStompHit | `{ action: 'nothing' }` |

---

## Testes — LevelBuilder

| Caso | Resultado esperado |
|---|---|
| `createEnemy('gato', 0, 0)` | Não lança erro, retorna objeto não-null |
| `createEnemy('desconhecido', 0, 0)` | Retorna `null`, `console.warn` chamado com tipo |
| `createEnemy('hugo', 0, 0)` | Retorna objeto não-null |

> Nota: testes de LevelBuilder requerem o mesmo mock de Phaser já usado em `tests/GatoSelvagem.test.ts`.

---

## Métricas esperadas

| Métrica | Antes | Depois |
|---|---|---|
| `GameScene.ts` linhas | 1056 | ~750 |
| `_setupCollisions()` linhas | 167 | ~60 |
| `_spawnEnemies()` linhas | ~60 | ~15 |
| Testes de lógica de combate | 0 | ~12 |
| Testes de factory | 0 | ~3 |
| Comportamento do jogo | ✅ | ✅ inalterado |

---

## O que NÃO muda

- Nenhuma mecânica de jogo é alterada
- `_handleItemCollect()` permanece no GameScene
- Lógica de boss (`_setupMiniBoss`, `_startMiniBossEncounter`, `_runBossIntro`) permanece no GameScene
- `_setupCamera()`, `_levelComplete()`, `_gameOver()` permanecem no GameScene
- Todos os 268 testes existentes continuam passando
