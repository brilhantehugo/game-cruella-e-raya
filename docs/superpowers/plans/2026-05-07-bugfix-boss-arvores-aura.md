# Bugfix E — Boss, Árvores Indoor, Aura Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir três bugs: boss do World 0 preso entre decorações, árvores fora de contexto em World 2, e power-ups bola/frisbee sem cor de aura própria.

**Architecture:** Todos os fixes são data-only (level files) ou uma linha de código em GameScene. Sem novos arquivos. Testes TDD verificam o estado dos level data antes de mudar o código.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/levels/World0.ts` | Modificar linhas 440, 461, 464 | `spawnX: 256`, remover `blocking: true` de 2 balcaos |
| `src/levels/World2.ts` | Modificar linhas 164, 170, 327, 332 | Substituir `arvore` por `planta` (2-2) e `lixeira` (2-4) |
| `src/scenes/GameScene.ts` | Modificar ~linha 1100 | Adicionar `bola` e `frisbee` ao puColors |
| `tests/BugfixBossArvoresAura.test.ts` | Criar | Testes TDD para as 3 correções |

---

## Task 1: Testes TDD — escrever e confirmar falha

**Files:**
- Create: `tests/BugfixBossArvoresAura.test.ts`

**Contexto:** O nível `LEVEL_0_BOSS` está em `src/levels/World0.ts`. Os níveis `LEVEL_2_2` e `LEVEL_2_4` estão em `src/levels/World2.ts`. Todos exportam `LevelData`. Os testes verificam estado dos dados antes de mudar o código.

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
// tests/BugfixBossArvoresAura.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_0_BOSS } from '../src/levels/World0'
import { LEVEL_2_2, LEVEL_2_4 } from '../src/levels/World2'

describe('Bug 1 — Boss World 0', () => {
  it('player spawn está em x=256 (não x=64)', () => {
    expect(LEVEL_0_BOSS.spawnX).toBe(256)
  })

  it('nenhum balcao interno tem blocking:true (apenas x:150 e grade x:1820)', () => {
    const blockingBalcaos = LEVEL_0_BOSS.decorations?.filter(
      d => d.type === 'balcao' && d.blocking === true && d.x !== 150
    ) ?? []
    expect(blockingBalcaos).toHaveLength(0)
  })
})

describe('Bug 2 — Árvores indoor World 2', () => {
  it('fase 2-2 (Pátio Interior) não tem árvores', () => {
    const arvores = LEVEL_2_2.decorations?.filter(d => d.type === 'arvore') ?? []
    expect(arvores).toHaveLength(0)
  })

  it('fase 2-4 (Escadas de Emergência) não tem árvores', () => {
    const arvores = LEVEL_2_4.decorations?.filter(d => d.type === 'arvore') ?? []
    expect(arvores).toHaveLength(0)
  })

  it('fase 2-2 tem planta nos locais onde havia árvore (x:1250 e x:2650)', () => {
    const plantas = LEVEL_2_2.decorations?.filter(d => d.type === 'planta') ?? []
    const xs = plantas.map(p => p.x)
    expect(xs).toContain(1250)
    expect(xs).toContain(2650)
  })

  it('fase 2-4 tem lixeira nos locais onde havia árvore (x:750 e x:1800)', () => {
    const lixeiras = LEVEL_2_4.decorations?.filter(d => d.type === 'lixeira') ?? []
    const xs = lixeiras.map(l => l.x)
    expect(xs).toContain(750)
    expect(xs).toContain(1800)
  })
})
```

- [ ] **Step 2: Rodar os testes — devem FALHAR (comportamento atual)**

```bash
npm test -- tests/BugfixBossArvoresAura.test.ts 2>&1 | tail -20
```

Esperado: 5-6 testes falhando com valores errados (spawnX=64, blockingBalcaos=[...], arvores=[...]).

---

## Task 2: World0.ts — Corrigir boss arena

**Files:**
- Modify: `src/levels/World0.ts` (linhas 440, 461, 464)

**Contexto:** `LEVEL_0_BOSS` começa em torno da linha 418. O player spawn está na linha 440. As decorações problemáticas são o `balcao` em x:940 (linha 461) e x:1620 (linha 464) com `blocking: true`. Manter `blocking: true` apenas no `balcao` de x:150 e na `grade` de x:1820.

- [ ] **Step 1: Corrigir spawnX**

Localizar (linha ~440):
```typescript
  spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370,
```

Substituir por:
```typescript
  spawnX: 256, spawnY: 300, exitX: 1856, exitY: 370,
```

- [ ] **Step 2: Remover blocking do balcao em x:940**

Localizar (linha ~461):
```typescript
    { type: 'balcao',    x: 940,  y: G, blocking: true },
```

Substituir por:
```typescript
    { type: 'balcao',    x: 940,  y: G },
```

- [ ] **Step 3: Remover blocking do balcao em x:1620**

Localizar (linha ~464):
```typescript
    { type: 'balcao',    x: 1620, y: G, blocking: true },
```

Substituir por:
```typescript
    { type: 'balcao',    x: 1620, y: G },
```

- [ ] **Step 4: Rodar testes — Bug 1 deve passar**

```bash
npm test -- tests/BugfixBossArvoresAura.test.ts 2>&1 | tail -15
```

Esperado: os 2 testes de `Bug 1` passando. Os 4 testes de `Bug 2` ainda falham (ainda não foram corrigidos).

- [ ] **Step 5: Commit**

```bash
git add src/levels/World0.ts
git commit -m "fix(world0): boss arena — spawnX 256 e remover blocking dos balcaos internos"
```

---

## Task 3: World2.ts — Substituir árvores por decorações contextuais

**Files:**
- Modify: `src/levels/World2.ts` (linhas 164, 170, 327, 332)

**Contexto:**
- Fase `2-2` "Pátio Interior" — `arvore` em x:1250 (linha 164) e x:2650 (linha 170) → substituir por `planta`
- Fase `2-4` "Escadas de Emergência" — `arvore` em x:750 (linha 327) e x:1800 (linha 332) → substituir por `lixeira`

- [ ] **Step 1: Substituir arvore x:1250 em 2-2**

Localizar (linha ~164):
```typescript
    { type: 'arvore',   x: 1250, y: G },
```

Substituir por:
```typescript
    { type: 'planta',   x: 1250, y: G },
```

- [ ] **Step 2: Substituir arvore x:2650 em 2-2**

Localizar (linha ~170):
```typescript
    { type: 'arvore',   x: 2650, y: G },
```

Substituir por:
```typescript
    { type: 'planta',   x: 2650, y: G },
```

- [ ] **Step 3: Substituir arvore x:750 em 2-4**

Localizar (linha ~327):
```typescript
    { type: 'arvore',   x: 750,  y: G },
```

Substituir por:
```typescript
    { type: 'lixeira',  x: 750,  y: G },
```

- [ ] **Step 4: Substituir arvore x:1800 em 2-4**

Localizar (linha ~332):
```typescript
    { type: 'arvore',   x: 1800, y: G },
```

Substituir por:
```typescript
    { type: 'lixeira',  x: 1800, y: G },
```

- [ ] **Step 5: Rodar testes — todos devem passar**

```bash
npm test -- tests/BugfixBossArvoresAura.test.ts 2>&1 | tail -15
```

Esperado: todos os 6 testes passando.

- [ ] **Step 6: Commit**

```bash
git add src/levels/World2.ts
git commit -m "fix(world2): substituir arvores por planta (2-2) e lixeira (2-4)"
```

---

## Task 4: GameScene.ts — Adicionar bola e frisbee ao puColors

**Files:**
- Modify: `src/scenes/GameScene.ts` (método `update()`, bloco de aura)

**Contexto:** No final de `update()`, há um bloco `// Aura de power-up ativo`. O `puColors` define cor por tipo de power-up. `bola` e `frisbee` não estão no mapa e caem no fallback ciano — mas devem ter cor verde `0x44ff88` (consistente com `POWERUP_LABEL` em `constants.ts`).

- [ ] **Step 1: Adicionar bola e frisbee ao puColors**

Localizar no bloco de aura em `update()`:
```typescript
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
      }
```

Substituir por:
```typescript
      const puColors: Record<string, number> = {
        petisco:   0xff8800,
        pipoca:    0xffff00,
        churrasco: 0xff4400,
        bola:      0x44ff88,
        frisbee:   0x44ff88,
      }
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "fix(game): adicionar bola e frisbee ao mapa de cores da aura de power-up"
```

---

## Task 5: Verificação final

- [ ] **Step 1: Suite completa de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando (sem regressões).

- [ ] **Step 2: Build limpo**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built` sem erros.

- [ ] **Step 3: Checklist de comportamento**

Verificar mentalmente:
- ✅ `0-boss`: player nasce em x:256 (pós-primeiro balcão), boss em x:960 com espaço livre para se mover
- ✅ `0-boss`: somente `balcao` x:150 e `grade` x:1820 bloqueiam — boss não trava
- ✅ `2-2` Pátio Interior: vasos de planta em vez de árvores grandes
- ✅ `2-4` Escadas de Emergência: lixeiras em vez de árvores
- ✅ Bola e frisbee com aura verde quando ativos (não mais ciano genérico)
