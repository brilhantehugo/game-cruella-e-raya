# Spec C — Efeito Visual de Swap

**Goal:** Substituir o flash branco genérico do swap por flash colorido + burst de partículas com a cor do personagem que entra em cena.

**Architecture:** Player emite evento Phaser `swap-fx` ao trocar de personagem. GameScene escuta e chama `EffectsManager.swapBurst()`. Sem importação circular. Padrão de evento já usado em outras partes do jogo.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Comportamento Atual

Em `Player._performSwap()`:
- `cameras.main.flash(80, 255, 255, 255)` — flash branco genérico de 80ms
- Nenhuma partícula ou animação adicional

## Comportamento Esperado

Ao trocar de personagem:
1. **Flash colorido** (180ms) na cor do personagem que entra:
   - Raya → azul `#44aaff` → `flash(180, 68, 170, 255)`
   - Cruella → vermelho `#ff4444` → `flash(180, 255, 68, 68)`
2. **Burst de 12 partículas** na mesma cor, saindo radialmente da posição do personagem:
   - Raio: 20–80px
   - Tamanho: 3–6px (círculos)
   - Duração: 400ms, fade out com `Quad.easeOut`

---

## Partes

### Parte 1 — EffectsManager.ts

Adicionar método público `swapBurst` após `powerUpBurst`:

```typescript
/** Burst colorido ao trocar de personagem (swap) */
swapBurst(x: number, y: number, isRaya: boolean): void {
  const color = isRaya ? 0x44aaff : 0xff4444
  this._burst(x, y, 12, color, 20, 80, 3, 6, 400)
}
```

**Arquivo:** `src/fx/EffectsManager.ts`

---

### Parte 2 — Player.ts

Em `_performSwap()`, substituir:

```typescript
// Antes
this.scene.cameras.main.flash(80, 255, 255, 255)
```

Por:

```typescript
// Depois
const isRaya = gameState.activeDog === 'raya'
const [r, g, b] = isRaya ? [68, 170, 255] : [255, 68, 68]
this.scene.cameras.main.flash(180, r, g, b)
this.scene.events.emit('swap-fx', { x: newActive.x, y: newActive.y, isRaya })
```

**Arquivo:** `src/entities/Player.ts`

---

### Parte 3 — GameScene.ts

No método `create()`, após `_buildMovingPlatforms()` e antes dos colliders, adicionar listener:

```typescript
this.events.on('swap-fx', ({ x, y, isRaya }: { x: number; y: number; isRaya: boolean }) => {
  this._fx.swapBurst(x, y, isRaya)
})
```

**Arquivo:** `src/scenes/GameScene.ts`

---

## Testes

Para tornar as cores testáveis sem Phaser, exportar as constantes de cor do swap em `src/constants.ts`:

```typescript
export const SWAP_COLORS = {
  raya:    { hex: 0x44aaff, r: 68,  g: 170, b: 255, flash: 180 },
  cruella: { hex: 0xff4444, r: 255, g: 68,  b: 68,  flash: 180 },
} as const
```

`Player.ts` e `EffectsManager.ts` importam e usam `SWAP_COLORS` em vez de valores literais.

**Arquivo:** `tests/SwapEffect.test.ts`

```typescript
import { SWAP_COLORS } from '../src/constants'

describe('SWAP_COLORS', () => {
  it('Raya tem cor azul', () => {
    expect(SWAP_COLORS.raya.hex).toBe(0x44aaff)
    expect(SWAP_COLORS.raya.r).toBe(68)
    expect(SWAP_COLORS.raya.g).toBe(170)
    expect(SWAP_COLORS.raya.b).toBe(255)
  })
  it('Cruella tem cor vermelha', () => {
    expect(SWAP_COLORS.cruella.hex).toBe(0xff4444)
    expect(SWAP_COLORS.cruella.r).toBe(255)
    expect(SWAP_COLORS.cruella.g).toBe(68)
    expect(SWAP_COLORS.cruella.b).toBe(68)
  })
  it('flash duration é 180ms para ambos', () => {
    expect(SWAP_COLORS.raya.flash).toBe(180)
    expect(SWAP_COLORS.cruella.flash).toBe(180)
  })
})
```

---

## Ordem de Implementação

```
Task 1: constants.ts — adicionar SWAP_COLORS exportado
Task 2: EffectsManager.ts — adicionar swapBurst() usando SWAP_COLORS.raya.hex / SWAP_COLORS.cruella.hex
Task 3: Testes TDD — SwapEffect.test.ts (passam desde o início)
Task 4: Player.ts — flash colorido com SWAP_COLORS + emit 'swap-fx'
Task 5: GameScene.ts — listener 'swap-fx' → _fx.swapBurst()
Task 6: Build final + testes passando
```
