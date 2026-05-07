# Spec E — Bugfixes: Boss World 0, Árvores Indoor, Aura Bola/Frisbee

**Goal:** Corrigir três bugs: boss do World 0 ficando preso entre decorações ao aparecer, árvores fora de contexto em fases do World 2, e power-ups bola/frisbee sem aura visual.

**Architecture:** Todos os fixes são data-only ou mudanças de 1-2 linhas em arquivos existentes. Sem novos arquivos, sem novos imports.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript

---

## Bug 1 — Boss World 0: preso entre decorações + player mal posicionado

### Problema

Em `LEVEL_0_BOSS` (`src/levels/World0.ts`):
- Player nasce em `spawnX: 64` — muito perto da borda esquerda, sensação de desorientação
- Boss nasce em `mapWidth / 2 = 960px` (hardcoded em `GameScene.ts` linha 434)
- Decoração `balcao` em `x: 940, blocking: true` está a apenas 20px do boss → boss fica preso imediatamente ao ter a física ativada no final do intro (t=2000ms)
- Decoração `balcao` em `x: 1620, blocking: true` também limita o espaço de movimentação

### Solução

**`src/levels/World0.ts` — LEVEL_0_BOSS.decorations:**

Remover `blocking: true` dos dois `balcao` internos (x:940 e x:1620). Manter apenas:
- `balcao` em x:150 (blocking: true) — barreira lateral esquerda
- `grade` em x:1820 (blocking: true) — barreira lateral direita

Esses dois definem os limites reais da arena. Os balcaos internos não precisam ser blocking.

**`src/levels/World0.ts` — LEVEL_0_BOSS.spawnX:**

Mover player spawn de `spawnX: 64` para `spawnX: 256`. O player começa depois do primeiro balcao bloqueante (x:150), em posição mais natural.

> **Não há mudanças em GameScene.ts** — o código de `setVisible(false)` + `body.enable = false` já existe e funciona corretamente (linhas 436-437). A ativação acontece em `_runBossIntro()` linha 274. O problema era apenas de colisão de dados.

### Comportamento esperado após fix
- Boss revelado em x:960 com espaço livre para se mover (balcaos internos não bloqueiam)
- Player começa em x:256, longe da borda, mas ainda do lado esquerdo

---

## Bug 2 — Árvores fora de contexto em World 2

### Problema

Duas fases do World 2 têm decorações `arvore` em contextos onde árvores não fazem sentido:

| Fase | Nome | Árvores | Por que é errado |
|---|---|---|---|
| `2-2` | Pátio Interior | x:1250, x:2650 | Pátio fechado de prédio; árvores grandes são estranhas |
| `2-4` | Escadas de Emergência | x:750, x:1800 | Escada de serviço de prédio; árvores são absurdas |

### Solução

**`src/levels/World2.ts`:**

- `2-2` Pátio Interior: substituir `{ type: 'arvore', x: 1250, y: G }` e `{ type: 'arvore', x: 2650, y: G }` por `{ type: 'planta', x: 1250, y: G }` e `{ type: 'planta', x: 2650, y: G }` — vasos de planta fazem sentido em pátio interno
- `2-4` Escadas de Emergência: substituir `{ type: 'arvore', x: 750, y: G }` e `{ type: 'arvore', x: 1800, y: G }` por `{ type: 'lixeira', x: 750, y: G }` e `{ type: 'lixeira', x: 1800, y: G }` — lixeiras são comuns em escadas de serviço

> World 1 (rua, praça, parque) e World 3 (exterior noturno) têm árvores em contextos outdoor corretos — não mudar.

---

## Bug 3 — Bola e frisbee sem aura de power-up

### Problema

Em `GameScene.ts update()`, o bloco de aura usa:
```typescript
const puColors: Record<string, number> = {
  petisco:   0xff8800,
  pipoca:    0xffff00,
  churrasco: 0xff4400,
}
const puColor = puColors[puEntry.type] ?? 0x00ccff
```

`bola` e `frisbee` não estão no mapa → caem no fallback ciano `0x00ccff`. Isso não é errado visualmente, mas é melhor ter cores específicas consistentes com o `POWERUP_LABEL`:
- `bola`: verde `#44ff88` → `0x44ff88`
- `frisbee`: verde `#44ff88` → `0x44ff88`

### Solução

**`src/scenes/GameScene.ts`** — no bloco de aura em `update()`:

```typescript
const puColors: Record<string, number> = {
  petisco:   0xff8800,
  pipoca:    0xffff00,
  churrasco: 0xff4400,
  bola:      0x44ff88,
  frisbee:   0x44ff88,
}
```

---

## Ordem de Implementação

```
Task 1: World0.ts — Boss arena: spawnX + blocking decorations
Task 2: World2.ts — Substituir árvores por planta/lixeira
Task 3: GameScene.ts — Adicionar bola e frisbee ao puColors
Task 4: Build final + testes
```
