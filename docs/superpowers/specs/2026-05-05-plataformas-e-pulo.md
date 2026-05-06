# Spec A — Mecânica de Plataformas e Pulo

**Goal:** Reduzir a altura do pulo de ambos os personagens e introduzir plataformas flutuantes (estáticas e dinâmicas) em todos os 4 mundos.

**Architecture:** Sistema dedicado de `PlatformSpawn` no `LevelData`. Plataformas estáticas e dinâmicas usam `physics.add.image` com `setImmovable(true)` e `setAllowGravity(false)`. Dinâmicas invertem velocidade no `update()` quando atingem o `range`. Jump velocity reduzida de -450 para -350 (afeta Cruella e Raya igualmente).

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Parte 1 — Ajuste de Pulo

### Mudança

`PHYSICS.JUMP_VELOCITY` em `src/constants.ts`:

```typescript
// Antes
JUMP_VELOCITY: -450,

// Depois
JUMP_VELOCITY: -350,
```

### Comportamento resultante

- **Cruella** — 1 pulo de -350 (antes -450)
- **Raya** — 2 pulos de -350 (double jump mantido, antes -450 por pulo)
- **Pipoca power-up** — multiplica por 1.45× em ambas (mantido)
- Gravity permanece em 800 — sem mudança

---

## Parte 2 — Interface PlatformSpawn

### Novo tipo em `src/levels/LevelData.ts`

```typescript
export interface PlatformSpawn {
  x: number
  y: number
  width: number          // largura em px (64–160px típico)
  moving?: {
    axis: 'x' | 'y'     // eixo de movimento
    range: number        // deslocamento máximo em px (positivo = direita/baixo)
    speed: number        // velocidade em px/s
  }
}
```

### Campo opcional em `LevelData`

```typescript
export interface LevelData {
  // ... campos existentes ...
  platforms?: PlatformSpawn[]   // array vazio ou ausente = sem plataformas
}
```

Sem `platforms` = `[]` (compatível com todos os níveis existentes sem modificação).

---

## Parte 3 — Sprite da Plataforma

### Nova key em `src/constants.ts`

```typescript
KEYS = {
  // ... existentes ...
  PLATFORM: 'platform',
}
```

### Canvas em `src/scenes/BootScene.ts` (dentro de `create()`)

Plataforma canvas-drawn (16px height, width dinâmica não é possível — usar 96px e escalar):

```typescript
// PLATFORM: plataforma flutuante (96×16)
clr()
g.fillStyle(0x8b5c2a); g.fillRect(0, 0, 96, 16)     // madeira base
g.fillStyle(0xaa7040); g.fillRect(0, 0, 96, 4)       // topo mais claro
g.fillStyle(0x6b3c0a); g.fillRect(0, 12, 96, 4)      // base mais escura
g.fillStyle(0x7a4e1a)                                  // tábuas verticais
for (let i = 16; i < 96; i += 32) { g.fillRect(i, 0, 2, 16) }
gen(KEYS.PLATFORM, 96, 16)
```

Nas fases, a `width` do `PlatformSpawn` controla o `scaleX` da imagem: `sprite.setScale(width / 96, 1)`.

---

## Parte 4 — GameScene: _buildPlatforms()

### Estrutura

```typescript
// src/scenes/GameScene.ts

private _movingPlatforms: Array<{
  sprite: Phaser.Physics.Arcade.Image
  config: NonNullable<PlatformSpawn['moving']>
  origin: { x: number; y: number }
}> = []

private _buildPlatforms(): void {
  const platforms = this.currentLevel.platforms ?? []
  
  for (const cfg of platforms) {
    const sprite = this.physics.add.image(cfg.x, cfg.y, KEYS.PLATFORM)
    sprite.setOrigin(0.5, 1)
    sprite.setScale(cfg.width / 96, 1)
    sprite.setDepth(2)
    
    if (!cfg.moving) {
      // Estática: imóvel + sem gravidade (sem update necessário)
      sprite.setImmovable(true)
      ;(sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
    } else {
      // Dinâmica: corpo imóvel com velocidade
      sprite.setImmovable(true)
      ;(sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
      const vel = cfg.moving.speed
      if (cfg.moving.axis === 'x') {
        sprite.setVelocityX(vel)
      } else {
        sprite.setVelocityY(vel)
      }
      this._movingPlatforms.push({
        sprite,
        config: cfg.moving,
        origin: { x: cfg.x, y: cfg.y },
      })
    }
    
    // Collider com jogadores
    this.physics.add.collider(this._players, sprite)
  }
}
```

### update() — inversão de direção

```typescript
// No update() do GameScene, após lógica existente:
for (const mp of this._movingPlatforms) {
  const body = mp.sprite.body as Phaser.Physics.Arcade.Body
  if (mp.config.axis === 'x') {
    const dist = mp.sprite.x - mp.origin.x
    if (Math.abs(dist) >= mp.config.range) {
      body.setVelocityX(-Math.sign(dist) * mp.config.speed)
    }
  } else {
    const dist = mp.sprite.y - mp.origin.y
    if (Math.abs(dist) >= mp.config.range) {
      body.setVelocityY(-Math.sign(dist) * mp.config.speed)
    }
  }
}
```

### _buildPlatforms() chamado em create()

Após `_buildDecorations()` e antes de configurar colisões dos inimigos.

---

## Parte 5 — Plataformas por Mundo

Regra: 2–3 plataformas por fase regular, 1–2 na fase boss. Fases de estacionamento (World0 0-3, 0-4, 0-5) são interior — plataformas fazem menos sentido, usar só em fases de apartamento e rua.

### World 0 — Apartamento (0-1, 0-2, 0-boss)

```typescript
// Fases de apartamento: plataformas a alturas intermediárias (y ~280–340)
platforms: [
  { x: 600,  y: 340, width: 80 },
  { x: 1200, y: 300, width: 96, moving: { axis: 'x', range: 120, speed: 70 } },
  { x: 1800, y: 340, width: 80 },
]
```

### World 1 — Rua (1-1 a 1-5)

```typescript
// Rua: plataformas sobre obstáculos existentes (y ~300–360)
platforms: [
  { x: 500,  y: 340, width: 80 },
  { x: 1000, y: 300, width: 96, moving: { axis: 'x', range: 150, speed: 80 } },
  { x: 1600, y: 280, width: 80, moving: { axis: 'y', range: 60,  speed: 50 } },
]
```

### World 2 — Praça (2-1 a 2-5)

```typescript
platforms: [
  { x: 700,  y: 330, width: 96 },
  { x: 1300, y: 290, width: 80, moving: { axis: 'x', range: 100, speed: 70 } },
  { x: 2000, y: 310, width: 96, moving: { axis: 'y', range: 50,  speed: 60 } },
]
```

### World 3 — Rua de Noite (3-1 a 3-5)

```typescript
platforms: [
  { x: 600,  y: 340, width: 80 },
  { x: 1100, y: 300, width: 96, moving: { axis: 'x', range: 120, speed: 90 } },
  { x: 1700, y: 340, width: 80 },
]
```

---

## Parte 6 — Testes

**Arquivo:** `tests/PlatformSystem.test.ts`

```typescript
describe('PlatformSpawn interface', () => {
  it('plataforma estática é válida sem moving')
  it('plataforma dinâmica tem axis, range e speed')
})

describe('Plataformas por mundo', () => {
  it('World0 fases de apartamento têm ao menos 2 plataformas')
  it('World1 tem ao menos 2 plataformas por fase')
  it('World2 tem ao menos 2 plataformas por fase')
  it('World3 tem ao menos 2 plataformas por fase')
  it('Plataformas dinâmicas têm speed > 0 e range > 0')
})
```

---

## Ordem de Implementação

```
Task 1: constants.ts — JUMP_VELOCITY -350 + KEYS.PLATFORM
Task 2: LevelData.ts — interface PlatformSpawn + campo platforms?
Task 3: Testes TDD — PlatformSystem.test.ts (falham primeiro)
Task 4: BootScene.ts — canvas PLATFORM (96×16)
Task 5: GameScene.ts — _buildPlatforms() + _movingPlatforms update()
Task 6: World0.ts — platforms em 0-1, 0-2, 0-boss
Task 7: World1.ts — platforms em 1-1 a 1-5
Task 8: World2.ts — platforms em 2-1 a 2-5
Task 9: World3.ts — platforms em 3-1 a 3-5
Task 10: build final + todos testes passando
```
