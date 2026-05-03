# Game Polish — Implementação Plan (3 Sprints)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os principais gaps técnicos e visuais do jogo em 3 sprints: bugs de dinâmica, backgrounds Pixel Lab e normalização de escalas/decorações.

**Architecture:** Sprint 1 corrige bugs de física e visual (depth, blocking, spawn Y) que quebram o gameplay. Sprint 2 substitui texturas canvas por tilesets Pixel Lab. Sprint 3 normaliza escalas de personagens com ajuste de physics bodies. Cada sprint é commit independente e testável.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Pixel Lab MCP, Vite

---

## Mapa de Arquivos

| Arquivo | Sprint | Mudança |
|---|---|---|
| `src/levels/LevelData.ts` | 1 | Adicionar constante `HUMAN_SPAWN_Y = 385` |
| `src/levels/World0.ts` | 1 | Spawn Y humanos, blocking de cadeira/mesa/estante, grades consecutivas |
| `src/levels/World1.ts` | 1 | Spawn Y humanos, arvore→poste em LEVEL_1_1 |
| `src/levels/World2.ts` | 1 | Spawn Y humanos |
| `src/levels/World3.ts` | 1 | Spawn Y humanos |
| `src/scenes/GameScene.ts` | 1, 3 | Depth -1→1 para decorações; spawn Y dos bosses |
| `tests/SprintPolish.test.ts` | 1 | Testes de spawn Y e blocking |
| `public/sprites/bg/*.png` | 2 | 12 novos tilesets Pixel Lab |
| `src/scenes/BootScene.ts` | 2 | Substituir generateTexture por load.image |
| `src/entities/Cruella.ts` | 3 | setScale(1.2→1.4), ajuste de body |
| `src/entities/Raya.ts` | 3 | setScale(1.2→1.4), ajuste de body |
| `src/entities/enemies/GatoMalencarado.ts` | 3 | Adicionar setScale(1.6) |
| `src/entities/enemies/SeuBigodes.ts` | 3 | setScale(1.4→2.0), ajuste de body |
| `src/entities/enemies/ZeladorBoss.ts` | 3 | setScale(1.4→2.0), ajuste de body |

---

## Sprint 1 — Correções de Dinâmica

### Task 1: Constante HUMAN_SPAWN_Y e testes

**Files:**
- Modify: `src/levels/LevelData.ts` (fim do arquivo)
- Create: `tests/SprintPolish.test.ts`

- [ ] **Step 1: Escrever o teste que vai falhar**

```typescript
// tests/SprintPolish.test.ts
import { describe, it, expect } from 'vitest'
import { HUMAN_SPAWN_Y, LEVEL_DATA_VERSION } from '../src/levels/LevelData'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

const HUMAN_TYPES = ['hugo', 'hannah', 'zelador', 'morador', 'dono', 'porteiro'] as const

const ALL_LEVELS = {
  ...WORLD0_LEVELS,
  ...WORLD1_LEVELS,
  ...WORLD2_LEVELS,
  ...WORLD3_LEVELS,
}

describe('HUMAN_SPAWN_Y constant', () => {
  it('deve ser 385 (fórmula: 416 - (44 × 1.4) / 2)', () => {
    expect(HUMAN_SPAWN_Y).toBe(385)
  })
})

describe('Spawn Y de inimigos humanos', () => {
  Object.values(ALL_LEVELS).forEach(level => {
    const humanEnemies = level.enemies.filter(e =>
      (HUMAN_TYPES as readonly string[]).includes(e.type)
    )
    humanEnemies.forEach(enemy => {
      it(`${level.id}: ${enemy.type} @ x=${enemy.x} deve usar HUMAN_SPAWN_Y=${HUMAN_SPAWN_Y}`, () => {
        expect(enemy.y).toBe(HUMAN_SPAWN_Y)
      })
    })
  })
})

describe('Decorações: blocking rules', () => {
  it('LEVEL_0_1: cadeiras não devem ter blocking=true', () => {
    const cadeiras = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'cadeira')
    cadeiras.forEach(c => expect(c.blocking).not.toBe(true))
  })

  it('LEVEL_0_1: mesas não devem ter blocking=true', () => {
    const mesas = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'mesa')
    mesas.forEach(m => expect(m.blocking).not.toBe(true))
  })

  it('LEVEL_0_1: estantes não devem ter blocking=true', () => {
    const estantes = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'estante')
    estantes.forEach(e => expect(e.blocking).not.toBe(true))
  })

  it('LEVEL_0_BOSS: cadeiras e mesas não devem ter blocking=true', () => {
    const moveis = WORLD0_LEVELS['0-boss'].decorations.filter(
      d => d.type === 'cadeira' || d.type === 'mesa'
    )
    moveis.forEach(m => expect(m.blocking).not.toBe(true))
  })
})

describe('Decorações: grades consecutivas em 0-3', () => {
  it('nenhum par de grades consecutivas deve ter espaçamento < 80px', () => {
    const grades = WORLD0_LEVELS['0-3'].decorations
      .filter(d => d.type === 'grade')
      .sort((a, b) => a.x - b.x)
    for (let i = 1; i < grades.length; i++) {
      const spacing = grades[i].x - grades[i - 1].x
      expect(spacing).toBeGreaterThanOrEqual(80)
    }
  })
})

describe('LEVEL_1_1: arvore não deve estar perto da casa', () => {
  it('arvore em x=2100 deve ser substituída — nenhuma arvore entre x=1800 e x=2300', () => {
    const arvores = WORLD1_LEVELS['1-1'].decorations.filter(d => d.type === 'arvore')
    arvores.forEach(arv => {
      const nearCasa = arv.x >= 1800 && arv.x <= 2300
      expect(nearCasa).toBe(false)
    })
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npm test -- tests/SprintPolish.test.ts
```

Esperado: FAIL — `HUMAN_SPAWN_Y` não exportado, todos os spawn Y = 390 ≠ 385.

- [ ] **Step 3: Adicionar `HUMAN_SPAWN_Y` em LevelData.ts**

Adicionar ao final de `src/levels/LevelData.ts`, após o fechamento da interface LevelData:

```typescript
/** Y de spawn para inimigos humanos (escala 1.4, bodyHeight 44px)
 *  spawnY = 416 − (44 × 1.4) / 2 = 416 − 30.8 ≈ 385
 *  Garante que o fundo do corpo (385 + 30.8 = 415.8) não penetre o chão (y=416).
 */
export const HUMAN_SPAWN_Y = 385
```

- [ ] **Step 4: Rodar o teste novamente**

```bash
npm test -- tests/SprintPolish.test.ts
```

Esperado: só o teste de constante passa. Os demais ainda falham (spawn Y ainda 390).

---

### Task 2: Atualizar spawn Y em World0.ts

**Files:**
- Modify: `src/levels/World0.ts`

- [ ] **Step 1: Adicionar import de HUMAN_SPAWN_Y**

Alterar a primeira linha de `src/levels/World0.ts` de:
```typescript
import { LevelData } from './LevelData'
```
para:
```typescript
import { LevelData, HUMAN_SPAWN_Y } from './LevelData'
```

- [ ] **Step 2: Substituir spawn Y em LEVEL_0_1**

Em `LEVEL_0_1.enemies`, substituir todos os `y: 390` de tipos humanos (hugo, hannah, zelador):

```typescript
  enemies: [
    { type: 'hugo',    x: 500,  y: HUMAN_SPAWN_Y },
    { type: 'hannah',  x: 1200, y: HUMAN_SPAWN_Y },
    { type: 'hugo',    x: 1650, y: HUMAN_SPAWN_Y },
    { type: 'hannah',  x: 2100, y: HUMAN_SPAWN_Y },
    { type: 'hugo',    x: 2500, y: HUMAN_SPAWN_Y },
    { type: 'hannah',  x: 2800, y: HUMAN_SPAWN_Y },
    { type: 'zelador', x: 2950, y: HUMAN_SPAWN_Y },
  ],
```

- [ ] **Step 3: Substituir spawn Y em LEVEL_0_2**

Em `LEVEL_0_2.enemies`, tipos humanos (hugo, hannah):

```typescript
  enemies: [
    { type: 'hugo',   x: 420,  y: HUMAN_SPAWN_Y },
    { type: 'hannah', x: 840,  y: HUMAN_SPAWN_Y },
    { type: 'hugo',   x: 1260, y: HUMAN_SPAWN_Y },
    { type: 'hannah', x: 1680, y: HUMAN_SPAWN_Y },
    { type: 'gato',   x: 2050, y: 390 },
  ],
```

> Nota: `gato` mantém y=390 (não é HumanEnemy — física diferente).

- [ ] **Step 4: Substituir spawn Y em LEVEL_0_3**

Em `LEVEL_0_3.enemies`, tipos humanos (zelador, morador):

```typescript
  enemies: [
    { type: 'gato',    x: 400,  y: 390 },
    { type: 'zelador', x: 700,  y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 1000, y: 390 },
    { type: 'morador', x: 1200, y: HUMAN_SPAWN_Y },
    { type: 'zelador', x: 1500, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 1750, y: 390 },
    { type: 'zelador', x: 2000, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2300, y: 390 },
    { type: 'morador', x: 2550, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2800, y: 390 },
  ],
```

- [ ] **Step 5: Substituir spawn Y em LEVEL_0_4**

Em `LEVEL_0_4.enemies`, tipos humanos (zelador):

```typescript
  enemies: [
    { type: 'zelador', x: 400,  y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 700,  y: 390 },
    { type: 'gato',    x: 1000, y: 390 },
    { type: 'zelador', x: 1300, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 1600, y: 390 },
    { type: 'zelador', x: 1900, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2200, y: 390 },
    { type: 'zelador', x: 2600, y: HUMAN_SPAWN_Y },
  ],
```

- [ ] **Step 6: Substituir spawn Y em LEVEL_0_5**

Em `LEVEL_0_5.enemies`, tipos humanos (zelador):

```typescript
  enemies: [
    { type: 'zelador', x: 350,  y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 650,  y: 390 },
    { type: 'gato',    x: 950,  y: 390 },
    { type: 'zelador', x: 1200, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 1450, y: 390 },
    { type: 'zelador', x: 1700, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 2000, y: 390 },
    { type: 'gato',    x: 2300, y: 390 },
    { type: 'zelador', x: 2600, y: HUMAN_SPAWN_Y },
    { type: 'zelador', x: 2950, y: HUMAN_SPAWN_Y },
  ],
```

- [ ] **Step 7: Rodar testes**

```bash
npm test -- tests/SprintPolish.test.ts
```

Esperado: testes de spawn Y de World0 passam; World1/2/3 ainda falham.

---

### Task 3: Atualizar spawn Y em World1.ts, World2.ts, World3.ts

**Files:**
- Modify: `src/levels/World1.ts`
- Modify: `src/levels/World2.ts`
- Modify: `src/levels/World3.ts`

- [ ] **Step 1: Adicionar import em World1.ts, World2.ts, World3.ts**

Em cada um dos 3 arquivos, alterar:
```typescript
import { LevelData } from './LevelData'
```
para:
```typescript
import { LevelData, HUMAN_SPAWN_Y } from './LevelData'
```

- [ ] **Step 2: Substituir em World1.ts — todos os tipos humanos (morador, dono)**

Usar busca por padrão: qualquer enemy com type `morador` ou `dono` que tenha `y: 390`.

Em LEVEL_1_1.enemies — substituir morador e dono:
```typescript
  enemies: [
    { type: 'rato',    x: 320,  y: 390 },
    { type: 'morador', x: 600,  y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 900,  y: 390 },
    { type: 'morador', x: 1200, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 1500, y: 390 },
    { type: 'dono',    x: 1900, y: HUMAN_SPAWN_Y },
    { type: 'rato',    x: 2200, y: 390 },
    { type: 'morador', x: 1700, y: HUMAN_SPAWN_Y },
    { type: 'morador', x: 2000, y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 2400, y: HUMAN_SPAWN_Y },
  ],
```

Em LEVEL_1_3.enemies — morador e dono:
```typescript
  enemies: [
    { type: 'pombo',   x: 400,  y: 160 },
    { type: 'morador', x: 700,  y: HUMAN_SPAWN_Y },
    { type: 'pombo',   x: 1000, y: 140 },
    { type: 'rato',    x: 1300, y: 390 },
    { type: 'pombo',   x: 1600, y: 150 },
    { type: 'dono',    x: 1900, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2200, y: 390 },
    { type: 'pombo',   x: 2400, y: 140 },
    { type: 'morador', x: 2600, y: HUMAN_SPAWN_Y },
    { type: 'pombo',   x: 2800, y: 150 },
    { type: 'dono',    x: 3000, y: HUMAN_SPAWN_Y },
  ],
```

Em LEVEL_1_4.enemies — dono:
```typescript
  enemies: [
    { type: 'pombo', x: 350,  y: 140 },
    { type: 'dono',  x: 600,  y: HUMAN_SPAWN_Y },
    { type: 'pombo', x: 850,  y: 150 },
    { type: 'rato',  x: 1100, y: 390 },
    { type: 'dono',  x: 1350, y: HUMAN_SPAWN_Y },
    { type: 'pombo', x: 1600, y: 140 },
    { type: 'rato',  x: 1850, y: 390 },
    { type: 'pombo', x: 2100, y: 150 },
    { type: 'dono',  x: 2400, y: HUMAN_SPAWN_Y },
  ],
```

Em LEVEL_1_5.enemies — morador e dono:
```typescript
  enemies: [
    { type: 'rato',    x: 300,  y: 390 }, { type: 'gato',    x: 600,  y: 390 },
    { type: 'morador', x: 800,  y: HUMAN_SPAWN_Y }, { type: 'pombo',   x: 1000, y: 120 },
    { type: 'dono',    x: 1200, y: HUMAN_SPAWN_Y }, { type: 'rato',    x: 1500, y: 390 },
    { type: 'gato',    x: 1700, y: 390 }, { type: 'pombo',   x: 1900, y: 150 },
    { type: 'morador', x: 2100, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 2400, y: 390 },
    { type: 'rato',    x: 2650, y: 390 },
    { type: 'gato',    x: 2900, y: 390 },
    { type: 'morador', x: 3100, y: HUMAN_SPAWN_Y },
    { type: 'dono',    x: 3300, y: HUMAN_SPAWN_Y },
  ],
```

- [ ] **Step 3: Substituir em World2.ts — todos os tipos humanos (zelador, morador, dono)**

Em cada fase de World2 que tenha zelador, morador ou dono com `y: 390`, substituir por `HUMAN_SPAWN_Y`. Manter gato, rato com `y: 390`.

Exemplo LEVEL_2_1.enemies:
```typescript
  enemies: [
    { type: 'rato',    x: 300,  y: 390 },
    { type: 'gato',    x: 600,  y: 390 },
    { type: 'rato',    x: 800,  y: 390 },
    { type: 'zelador', x: 1100, y: HUMAN_SPAWN_Y },
    { type: 'gato',    x: 1400, y: 390 },
    { type: 'rato',    x: 1800, y: 390 },
    { type: 'dono',    x: 2100, y: HUMAN_SPAWN_Y },
  ],
```

Fazer o mesmo padrão para todas as outras fases de World2 que tenham zelador, morador ou dono.

- [ ] **Step 4: Substituir em World3.ts — tipos humanos presentes**

World3 usa 'seguranca' e 'gato_selvagem'. Nenhum desses é HumanEnemy — não alterar.

- [ ] **Step 5: Rodar todos os testes**

```bash
npm test -- tests/SprintPolish.test.ts
```

Esperado: todos os testes de spawn Y passam.

---

### Task 4: Corrigir depth de decorações não-blocking em GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts` linha 280

- [ ] **Step 1: Alterar setDepth(-1) para setDepth(1)**

Em `src/scenes/GameScene.ts`, no método `_buildDecorations()`, linha 280:

```typescript
// ANTES:
this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(-1)

// DEPOIS:
this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(1)
```

O bloco completo do método deve ficar:
```typescript
private _buildDecorations(): void {
  this.decorationLayer = this.physics.add.staticGroup()
  this.currentLevel.decorations.forEach(d => {
    if (d.blocking) {
      // Decoração sólida — bloqueia personagens (depth 0 = mesma camada do tilemap)
      const img = this.decorationLayer.create(d.x, d.y, d.type) as Phaser.Physics.Arcade.Image
      img.setOrigin(0.5, 1).setDepth(0).refreshBody()
    } else {
      // Decoração visual — frente do tilemap (depth 1), atrás dos personagens (depth 3+)
      this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(1)
    }
  })
}
```

- [ ] **Step 2: Verificar compilação TypeScript**

```bash
npm run build 2>&1 | tail -20
```

Esperado: zero erros TypeScript.

---

### Task 5: Corrigir blocking de cadeiras/mesas/estantes

**Files:**
- Modify: `src/levels/World0.ts`

- [ ] **Step 1: Remover blocking:true de cadeiras e mesas em LEVEL_0_1**

Em `LEVEL_0_1.decorations`, remover a propriedade `blocking: true` de cadeira, mesa e estante:

```typescript
  decorations: [
    { type: 'cadeira',   x: 180,  y: G },
    { type: 'mesa',      x: 380,  y: G },
    { type: 'balcao',    x: 650,  y: G, blocking: true },
    { type: 'balcao',    x: 930,  y: G, blocking: true },
    { type: 'fogao',     x: 1130, y: G, blocking: true },
    { type: 'geladeira', x: 1330, y: G, blocking: true },
    { type: 'balcao',    x: 1530, y: G, blocking: true },
    { type: 'grade',     x: 1750, y: G, blocking: true },
    { type: 'cadeira',   x: 1850, y: G },
    { type: 'mesa',      x: 2050, y: G },
    { type: 'estante',   x: 2270, y: G },
    { type: 'balcao',    x: 2500, y: G, blocking: true },
    { type: 'balcao',    x: 2720, y: G, blocking: true },
    { type: 'grade',     x: 2950, y: G, blocking: true },
  ],
```

- [ ] **Step 2: Remover blocking:true de cadeiras/estantes em LEVEL_0_2**

```typescript
  decorations: [
    { type: 'cadeira',  x: 150,  y: G },
    { type: 'balcao',   x: 370,  y: G, blocking: true },
    { type: 'estante',  x: 620,  y: G },
    { type: 'cadeira',  x: 900,  y: G },
    { type: 'balcao',   x: 1130, y: G, blocking: true },
    { type: 'estante',  x: 1400, y: G },
    { type: 'cadeira',  x: 1680, y: G },
    { type: 'balcao',   x: 1950, y: G, blocking: true },
  ],
```

- [ ] **Step 3: Remover blocking:true de cadeiras e mesas em LEVEL_0_BOSS**

```typescript
  decorations: [
    { type: 'balcao',    x: 150,  y: G, blocking: true },
    { type: 'mesa',      x: 420,  y: G },
    { type: 'cadeira',   x: 680,  y: G },
    { type: 'balcao',    x: 940,  y: G, blocking: true },
    { type: 'mesa',      x: 1160, y: G },
    { type: 'cadeira',   x: 1400, y: G },
    { type: 'balcao',    x: 1620, y: G, blocking: true },
    { type: 'grade',     x: 1820, y: G, blocking: true },
  ],
```

- [ ] **Step 4: Rodar testes**

```bash
npm test -- tests/SprintPolish.test.ts
```

Esperado: testes de blocking passam.

---

### Task 6: Corrigir grades consecutivas em LEVEL_0_3 e arvore→poste em LEVEL_1_1

**Files:**
- Modify: `src/levels/World0.ts` (LEVEL_0_3 decorations)
- Modify: `src/levels/World1.ts` (LEVEL_1_1 decorations)

- [ ] **Step 1: Corrigir grades em LEVEL_0_3**

As grades atuais estão em x=2900, 2940, 2980 (40px de espaçamento — abaixo do mínimo de 80px). Remover a grade do meio:

```typescript
  decorations: [
    { type: 'carro',  x: 224,  y: G, blocking: true },
    { type: 'carro',  x: 544,  y: G, blocking: true },
    { type: 'poste',  x: 720,  y: G },
    { type: 'carro',  x: 864,  y: G, blocking: true },
    { type: 'carro',  x: 1120, y: G, blocking: true },
    { type: 'poste',  x: 1280, y: G },
    { type: 'carro',  x: 1440, y: G, blocking: true },
    { type: 'carro',  x: 1664, y: G, blocking: true },
    { type: 'carro',  x: 1900, y: G, blocking: true },
    { type: 'poste',  x: 2080, y: G },
    { type: 'carro',  x: 2240, y: G, blocking: true },
    { type: 'carro',  x: 2464, y: G, blocking: true },
    { type: 'poste',  x: 2640, y: G },
    { type: 'carro',  x: 2800, y: G, blocking: true },
    { type: 'grade',  x: 2900, y: G, blocking: true },
    { type: 'grade',  x: 2985, y: G, blocking: true },
  ],
```

> Removida a grade de x=2940; as restantes (2900 e 2985) têm 85px de espaçamento.

- [ ] **Step 2: Substituir arvore por poste em LEVEL_1_1**

Em `LEVEL_1_1.decorations`, substituir `{ type: 'arvore', x: 2100, y: G }` por `{ type: 'poste', x: 2100, y: G }`:

```typescript
  decorations: [
    { type: 'loja',    x: 180,  y: G },
    { type: 'poste',   x: 420,  y: G },
    { type: 'banco',   x: 620,  y: G },
    { type: 'casa',    x: 1100, y: G },
    { type: 'lixeira', x: 1300, y: G },
    { type: 'placa',   x: 1500, y: G },
    { type: 'loja',    x: 1720, y: G },
    { type: 'poste',   x: 2100, y: G },
    { type: 'poste',   x: 2400, y: G },
    { type: 'lixeira', x: 2350, y: G },
  ],
```

- [ ] **Step 3: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam, zero falhas.

- [ ] **Step 4: Build e commit do Sprint 1**

```bash
npm run build 2>&1 | tail -10
git add src/levels/LevelData.ts src/levels/World0.ts src/levels/World1.ts \
        src/levels/World2.ts src/levels/World3.ts src/scenes/GameScene.ts \
        tests/SprintPolish.test.ts
git commit -m "fix(sprint1): spawn Y humanos, depth de decorações, blocking e grades"
```

---

## Sprint 2 — Backgrounds com Pixel Lab

> **⚠️ Requer MCP Pixel Lab ativo na sessão.** Esta task usa `create_sidescroller_tileset` e `get_sidescroller_tileset` do MCP Pixel Lab. Deve ser executada pelo agente orquestrador (que tem acesso aos MCPs), não por subagente isolado.

### Task 7: Gerar 12 tilesets com Pixel Lab MCP

**Files:**
- Create: `public/sprites/bg/bg-apto-mid.png`
- Create: `public/sprites/bg/bg-apto-near.png`
- Create: `public/sprites/bg/bg-estac-mid.png`
- Create: `public/sprites/bg/bg-estac-near.png`
- Create: `public/sprites/bg/bg-rua-mid.png`
- Create: `public/sprites/bg/bg-rua-near.png`
- Create: `public/sprites/bg/bg-praca-mid.png`
- Create: `public/sprites/bg/bg-praca-near.png`
- Create: `public/sprites/bg/bg-mercado-mid.png`
- Create: `public/sprites/bg/bg-mercado-near.png`
- Create: `public/sprites/bg/bg-boss-mid.png`
- Create: `public/sprites/bg/bg-boss-near.png`

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p public/sprites/bg
```

- [ ] **Step 2: Gerar tileset — Apartamento mid (BG_APTO_2)**

Chamar via MCP Pixel Lab:
```
create_sidescroller_tileset(
  description: "apartment interior wall, warm beige plaster, windows with curtains and picture frames, wallpaper trim, repeating horizontal tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Aguardar conclusão com `get_sidescroller_tileset(id)`. Baixar a imagem PNG e salvar como `public/sprites/bg/bg-apto-mid.png`.

- [ ] **Step 3: Gerar tileset — Apartamento near (BG_APTO_3)**

```
create_sidescroller_tileset(
  description: "wooden parquet floor tiles with baseboard trim, warm brown tones, repeating seamless horizontal tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-apto-near.png`.

- [ ] **Step 4: Gerar tileset — Estacionamento mid (BG_APTO_BOSS_2)**

```
create_sidescroller_tileset(
  description: "dark grey concrete parking garage wall, painted parking spot markings, fluorescent light fixtures, repeating tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-estac-mid.png`.

- [ ] **Step 5: Gerar tileset — Estacionamento near (BG_APTO_BOSS_3)**

```
create_sidescroller_tileset(
  description: "asphalt parking floor with yellow painted lines and oil stains, dark grey tone, repeating seamless tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-estac-near.png`.

- [ ] **Step 6: Gerar tileset — Rua mid (BG_RUA_2)**

```
create_sidescroller_tileset(
  description: "urban building facade, residential street, windows with balconies and AC units, light blue sky behind, repeating tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-rua-mid.png`.

- [ ] **Step 7: Gerar tileset — Rua near (BG_RUA_3)**

```
create_sidescroller_tileset(
  description: "cobblestone sidewalk with concrete curb, worn pavement, Brazilian street style, repeating seamless horizontal tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-rua-near.png`.

- [ ] **Step 8: Gerar tileset — Praça mid (BG_PRACA_2)**

```
create_sidescroller_tileset(
  description: "wooden fence with green bushes and trees in the background, park scenery, sunny day, repeating tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-praca-mid.png`.

- [ ] **Step 9: Gerar tileset — Praça near (BG_PRACA_3)**

```
create_sidescroller_tileset(
  description: "grass and dirt path with scattered pebbles and fallen leaves, park ground, repeating seamless tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-praca-near.png`.

- [ ] **Step 10: Gerar tileset — Mercado mid (BG_MERCADO_2)**

```
create_sidescroller_tileset(
  description: "colorful market stall awnings, red and yellow stripes, shop facade with signs, Brazilian feira style, repeating tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-mercado-mid.png`.

- [ ] **Step 11: Gerar tileset — Mercado near (BG_MERCADO_3)**

```
create_sidescroller_tileset(
  description: "ceramic floor tiles, market style with white and blue pattern, slightly worn, repeating seamless tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-mercado-near.png`.

- [ ] **Step 12: Gerar tileset — Boss Arena mid (BG_BOSS_2)**

```
create_sidescroller_tileset(
  description: "old brick wall with dark green paint and graffiti tags, gritty urban alley, repeating tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-boss-mid.png`.

- [ ] **Step 13: Gerar tileset — Boss Arena near (BG_BOSS_3)**

```
create_sidescroller_tileset(
  description: "cracked concrete floor with garbage bags piled at the side, dark alley, repeating seamless tile",
  tile_size: 32,
  detail_level: "medium",
  shading: "basic"
)
```
Salvar como `public/sprites/bg/bg-boss-near.png`.

---

### Task 8: Integrar tilesets no BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts`

- [ ] **Step 1: Localizar e substituir as chamadas gen() para BG_APTO_2 e BG_APTO_3**

Em `src/scenes/BootScene.ts`, no método `preload()` (ou equivalente onde `gen(KEYS.BG_APTO_2, ...)` é chamado):

Remover o bloco que chama `gen(KEYS.BG_APTO_2, 200, 450)` e o bloco de `gen(KEYS.BG_APTO_3, 200, 450)` (com toda a lógica de canvas drawing que os acompanha).

Substituir por:
```typescript
this.load.image(KEYS.BG_APTO_2, 'sprites/bg/bg-apto-mid.png')
this.load.image(KEYS.BG_APTO_3, 'sprites/bg/bg-apto-near.png')
```

- [ ] **Step 2: Substituir BG_APTO_BOSS_2 e BG_APTO_BOSS_3**

```typescript
this.load.image(KEYS.BG_APTO_BOSS_2, 'sprites/bg/bg-estac-mid.png')
this.load.image(KEYS.BG_APTO_BOSS_3, 'sprites/bg/bg-estac-near.png')
```

- [ ] **Step 3: Substituir BG_RUA_2 e BG_RUA_3**

```typescript
this.load.image(KEYS.BG_RUA_2, 'sprites/bg/bg-rua-mid.png')
this.load.image(KEYS.BG_RUA_3, 'sprites/bg/bg-rua-near.png')
```

- [ ] **Step 4: Substituir BG_PRACA_2 e BG_PRACA_3**

```typescript
this.load.image(KEYS.BG_PRACA_2, 'sprites/bg/bg-praca-mid.png')
this.load.image(KEYS.BG_PRACA_3, 'sprites/bg/bg-praca-near.png')
```

- [ ] **Step 5: Substituir BG_MERCADO_2 e BG_MERCADO_3**

```typescript
this.load.image(KEYS.BG_MERCADO_2, 'sprites/bg/bg-mercado-mid.png')
this.load.image(KEYS.BG_MERCADO_3, 'sprites/bg/bg-mercado-near.png')
```

- [ ] **Step 6: Substituir BG_BOSS_2 e BG_BOSS_3**

```typescript
this.load.image(KEYS.BG_BOSS_2, 'sprites/bg/bg-boss-mid.png')
this.load.image(KEYS.BG_BOSS_3, 'sprites/bg/bg-boss-near.png')
```

> Nota: As layers _1 (far/sky) de todos os temas mantêm o canvas drawing — são gradientes leves e ficam gratuitos.

- [ ] **Step 7: Ajustar displaySize em ParallaxBackground se necessário**

Os tilesets Pixel Lab têm dimensão variada (tiles 32×32 organizados em strip). Se a altura for menor que 450px, adicionar `setDisplaySize(GAME_WIDTH, 450)` em `ParallaxBackground.ts` após `setScrollFactor(0)`:

```typescript
// Em ParallaxBackground.ts, no constructor, após sprite.setScrollFactor(0):
sprite.setDisplaySize(GAME_WIDTH, cfg.height)
```

Isso já está em `cfg.height = 450`, garantindo cobertura total da tela.

- [ ] **Step 8: Build e testes**

```bash
npm run build 2>&1 | tail -20
npm test
```

Esperado: build limpo, todos os testes passam.

- [ ] **Step 9: Commit do Sprint 2**

```bash
git add public/sprites/bg/ src/scenes/BootScene.ts src/background/ParallaxBackground.ts
git commit -m "feat(sprint2): backgrounds Pixel Lab para 6 temas (12 tilesets)"
```

---

## Sprint 3 — Normalização de Escala e Decorações

### Task 9: Escala de Cruella e Raya (1.2× → 1.4×)

**Files:**
- Modify: `src/entities/Cruella.ts`
- Modify: `src/entities/Raya.ts`

- [ ] **Step 1: Escrever teste para escala**

Adicionar ao `tests/SprintPolish.test.ts`:

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'

describe('Escala de personagens', () => {
  const cruellaTs = readFileSync(join(__dirname, '..', 'src/entities/Cruella.ts'), 'utf-8')
  const rayaTs    = readFileSync(join(__dirname, '..', 'src/entities/Raya.ts'), 'utf-8')

  it('Cruella deve usar setScale(1.4)', () => {
    expect(cruellaTs).toContain('setScale(1.4)')
  })

  it('Raya deve usar setScale(1.4)', () => {
    expect(rayaTs).toContain('setScale(1.4)')
  })

  it('Cruella não deve ter setScale(1.2)', () => {
    expect(cruellaTs).not.toContain('setScale(1.2)')
  })

  it('Raya não deve ter setScale(1.2)', () => {
    expect(rayaTs).not.toContain('setScale(1.2)')
  })
})
```

- [ ] **Step 2: Confirmar falha**

```bash
npm test -- tests/SprintPolish.test.ts -t "Escala"
```

Esperado: FAIL (Cruella e Raya ainda usam 1.2).

- [ ] **Step 3: Atualizar Cruella.ts**

Em `src/entities/Cruella.ts`, no constructor, substituir:
```typescript
this.setScale(1.2)
// Body centered on the dog within the 48×48 MCP canvas
this.setBodySize(24, 28)
this.setOffset(12, 14)
```
por:
```typescript
this.setScale(1.4)
// Body centered: 28×38 local → 39×53px world (colisão proporcional ao sprite)
;(this.body as Phaser.Physics.Arcade.Body).setSize(28, 38, true)
```

- [ ] **Step 4: Atualizar Raya.ts**

Mesma substituição em `src/entities/Raya.ts`:
```typescript
this.setScale(1.4)
// Body centered: 28×38 local → 39×53px world
;(this.body as Phaser.Physics.Arcade.Body).setSize(28, 38, true)
```

- [ ] **Step 5: Rodar testes**

```bash
npm test -- tests/SprintPolish.test.ts -t "Escala"
```

Esperado: testes de escala passam.

---

### Task 10: Escala de GatoMalencarado (2.0× → 1.6×)

**Files:**
- Modify: `src/entities/enemies/GatoMalencarado.ts`

- [ ] **Step 1: Adicionar teste**

```typescript
// No SprintPolish.test.ts:
const gatoTs = readFileSync(join(__dirname, '..', 'src/entities/enemies/GatoMalencarado.ts'), 'utf-8')

it('GatoMalencarado deve usar setScale(1.6)', () => {
  expect(gatoTs).toContain('setScale(1.6)')
})
```

- [ ] **Step 2: Atualizar GatoMalencarado.ts**

No constructor de `GatoMalencarado`, após `super(scene, x, y, KEYS.GATO, 1, 80)`, adicionar:

```typescript
constructor(scene: Phaser.Scene, x: number, y: number) {
  super(scene, x, y, KEYS.GATO, 1, 80)
  this.setScale(1.6)  // sobrescreve Enemy base scale 2.0 → gato menor que boss
  ;(this.body as Phaser.Physics.Arcade.Body).setSize(30, 36, true)
  this._patrolStart = x
  this.setVelocityX(this.speed)
}
```

> Nota: `Enemy` base seta `this.setScale(2)` no constructor. Chamar `setScale(1.6)` após `super()` sobrescreve.

- [ ] **Step 3: Rodar testes**

```bash
npm test -- tests/SprintPolish.test.ts
```

---

### Task 11: Escala de SeuBigodes (1.4× → 2.0×) e ZeladorBoss (1.4× → 2.0×)

**Files:**
- Modify: `src/entities/enemies/SeuBigodes.ts`
- Modify: `src/entities/enemies/ZeladorBoss.ts`
- Modify: `src/scenes/GameScene.ts` (spawn Y dos bosses)

- [ ] **Step 1: Adicionar testes**

```typescript
const bigodes = readFileSync(join(__dirname, '..', 'src/entities/enemies/SeuBigodes.ts'), 'utf-8')
const zelBoss = readFileSync(join(__dirname, '..', 'src/entities/enemies/ZeladorBoss.ts'), 'utf-8')

it('SeuBigodes deve usar setScale(2.0)', () => {
  expect(bigodes).toContain('setScale(2.0)')
  expect(bigodes).not.toContain('setScale(1.4)')
})

it('ZeladorBoss deve usar setScale(2.0)', () => {
  expect(zelBoss).toContain('setScale(2.0)')
  expect(zelBoss).not.toContain('setScale(1.4)')
})
```

- [ ] **Step 2: Atualizar SeuBigodes.ts**

No constructor de `SeuBigodes`, substituir:
```typescript
this.setScale(1.4)  // 68×68 × 1.4 ≈ 95px — equivalente ao sprite anterior 48×48 × 2
// Boss inicia parado
this.setVelocityX(0)
```
por:
```typescript
this.setScale(2.0)  // 68×68 × 2.0 = 136px — boss imponente vs personagens de 45px
;(this.body as Phaser.Physics.Arcade.Body).setSize(28, 40, true)  // world: 56×80px
// Boss inicia parado
this.setVelocityX(0)
```

- [ ] **Step 3: Atualizar ZeladorBoss.ts**

No constructor de `ZeladorBoss`, substituir:
```typescript
this.setScale(1.4)  // 68×68 × 1.4 ≈ 95px
const body = this.body as Phaser.Physics.Arcade.Body
body.setSize(28, 28).setOffset(2, 2)
```
por:
```typescript
this.setScale(2.0)  // 68×68 × 2.0 = 136px — boss imponente
const body = this.body as Phaser.Physics.Arcade.Body
body.setSize(28, 40, true)  // world: 56×80px, centrado automaticamente
```

- [ ] **Step 4: Ajustar spawn Y dos bosses em GameScene.ts**

Com scale 2.0 e bodyHeight 40 (local), o spawn Y correto é:
`416 - (40 × 2.0) / 2 = 416 - 40 = 376`

Em `src/scenes/GameScene.ts`:

**Linha 384** — ZeladorBoss:
```typescript
// ANTES:
const boss = new ZeladorBoss(this, mapWidth / 2, 352)

// DEPOIS:
const boss = new ZeladorBoss(this, mapWidth / 2, 376)
```

**Linha 544** — SeuBigodes:
```typescript
// ANTES:
const boss = new SeuBigodes(this, 480, 360)

// DEPOIS:
const boss = new SeuBigodes(this, 480, 376)
```

- [ ] **Step 5: Rodar todos os testes**

```bash
npm test
```

Esperado: todos os testes passam.

- [ ] **Step 6: Build final e commit Sprint 3**

```bash
npm run build 2>&1 | tail -20
git add src/entities/Cruella.ts src/entities/Raya.ts \
        src/entities/enemies/GatoMalencarado.ts \
        src/entities/enemies/SeuBigodes.ts \
        src/entities/enemies/ZeladorBoss.ts \
        src/scenes/GameScene.ts \
        tests/SprintPolish.test.ts
git commit -m "feat(sprint3): normalização de escala — protagonistas 1.4×, gatos 1.6×, bosses 2.0×"
```

---

## Self-Review

**Spec coverage:**
- ✅ 1.1 Spawn Y humanos → Tasks 1-3
- ✅ 1.2 Boss aparecendo cedo → GameScene já usa `mapWidth/2`; boss ativado após cinemática (código existente). Spawn Y ajustado na Task 11.
- ✅ 1.3 Depth de decorações → Task 4
- ✅ 1.3 Blocking de cadeiras/mesas → Task 5
- ✅ 1.3 Grades consecutivas → Task 6
- ✅ 1.4 Arvore→poste → Task 6
- ✅ 2.1-2.3 Pixel Lab backgrounds → Tasks 7-8
- ✅ 3.1 Escala Cruella/Raya 1.4× → Task 9
- ✅ 3.1 Escala Gatos 1.6× → Task 10
- ✅ 3.1 Escala bosses 2.0× → Task 11
- ✅ 3.3 Blocking por tipo → Task 5 (cadeira/mesa/estante)

**Notas sobre o Sprint 2:**
- Requer MCP Pixel Lab disponível na sessão do agente orquestrador
- Layer 1 (far/sky) de cada tema permanece como canvas drawing — apenas layers 2 e 3 são substituídas
- Se os PNGs gerados tiverem altura < 450px, `setDisplaySize` em ParallaxBackground garante cobertura
