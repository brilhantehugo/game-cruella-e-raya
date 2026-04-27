# Bugfix: Ambiente, Boss e Inimigos Humanos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir 4 bugs visuais/de gameplay: background sumindo ao scrollar, boss aparecendo cedo demais, inimigos humanos caindo de plataformas, e árvores dentro da casa na fase 1.

**Architecture:** Todas as correções são cirúrgicas e independentes. O background recebe `setScrollFactor(0)` para se pinar à câmera. O boss tem suas coordenadas de trigger movidas para os últimos 25% do mapa. O `HumanEnemy` ganha `setGroundLayer()` + `_hasGroundAhead()` para detectar borda de plataforma. A decoração de árvore sobrepostas à casa é removida.

**Tech Stack:** TypeScript, Phaser 3, Vitest (npm test)

---

## File Structure

| Arquivo | O que muda |
|---------|-----------|
| `src/background/ParallaxBackground.ts` | `sprite.setScrollFactor(0)` em cada TileSprite |
| `src/levels/World0.ts` | Coordenadas do `miniBoss` em `LEVEL_0_1` |
| `src/levels/World1.ts` | Remover `arvore` sobreposta à `casa` em `LEVEL_1_1` |
| `src/entities/enemies/HumanEnemy.ts` | Campo `_groundLayer`, `setGroundLayer()`, `_hasGroundAhead()`, patch em `_doPatrol` e `_doChase` |
| `src/scenes/GameScene.ts` | Chamar `enemy.setGroundLayer(this.groundLayer)` após criar `HumanEnemy` |
| `tests/BugfixAmbiente.test.ts` | Testes de dados (coords boss, decorations) — criar |

---

## Task 1: Background Parallax — `setScrollFactor(0)`

**Arquivo:** `src/background/ParallaxBackground.ts`

**Problema raiz:** `scene.add.tileSprite(0, 0, GAME_WIDTH, 450, key)` cria o sprite em coordenadas de **mundo**. Sem `setScrollFactor(0)`, quando a câmera scrolla além de GAME_WIDTH (~800px), o sprite sai do viewport. O `tilePositionX` só desloca a textura interna — não reposiciona o sprite.

- [ ] **Step 1: Escrever teste que falha**

Crie o arquivo `tests/BugfixAmbiente.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const PARALLAX = readFileSync(
  join(__dirname, '..', 'src', 'background', 'ParallaxBackground.ts'),
  'utf-8'
)

describe('ParallaxBackground', () => {
  it('chama setScrollFactor(0) em cada layer', () => {
    expect(PARALLAX).toContain('setScrollFactor(0)')
  })
})
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npm test -- tests/BugfixAmbiente.test.ts
```

Expected: FAIL — `expect(received).toContain('setScrollFactor(0)')`

- [ ] **Step 3: Aplicar fix em `ParallaxBackground.ts`**

Localize o bloco `configs.forEach` no construtor (linha ~71). Adicione `sprite.setScrollFactor(0)` logo após `sprite.setOrigin(0, 0)`:

```typescript
constructor(scene: Phaser.Scene, theme: BackgroundTheme) {
  const configs = THEME_LAYERS[theme]
  configs.forEach((cfg, i) => {
    const depth = -5 + i
    const sprite = scene.add.tileSprite(0, cfg.y, GAME_WIDTH, cfg.height, cfg.key)
    sprite.setOrigin(0, 0)
    sprite.setScrollFactor(0)          // ← FIX: pina o sprite à câmera
    sprite.setDepth(depth)
    if (cfg.alpha !== undefined) {
      sprite.setAlpha(cfg.alpha)
    }
    this.layers.push({ sprite, speed: cfg.speed })
  })
}
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
npm test -- tests/BugfixAmbiente.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/background/ParallaxBackground.ts tests/BugfixAmbiente.test.ts
git commit -m "fix: setScrollFactor(0) no ParallaxBackground — background não some ao scrollar"
```

---

## Task 2: Boss Aspirador — Mover trigger para o final da fase

**Arquivo:** `src/levels/World0.ts`

Mapa de `LEVEL_0_1` tem 96 colunas × 32px = **3072px** de largura. O `triggerX: 1280` é 42% do mapa. Deve ser ~78% (x≈2400), com a arena nos últimos 25%.

- [ ] **Step 1: Adicionar teste de dados que falha**

Em `tests/BugfixAmbiente.test.ts`, adicione:

```typescript
import { LEVEL_0_1 } from '../src/levels/World0'

describe('LEVEL_0_1 miniBoss', () => {
  it('triggerX deve estar além de x=2300 (último terço do mapa)', () => {
    expect(LEVEL_0_1.miniBoss!.triggerX).toBeGreaterThan(2300)
  })

  it('spawnX deve ser posterior ao triggerX', () => {
    const { triggerX, spawnX } = LEVEL_0_1.miniBoss!
    expect(spawnX).toBeGreaterThan(triggerX)
  })

  it('arena deve caber dentro do mapa (3072px)', () => {
    expect(LEVEL_0_1.miniBoss!.rightBarrierX).toBeLessThanOrEqual(3072)
  })
})
```

- [ ] **Step 2: Rodar teste para confirmar que falha**

```bash
npm test -- tests/BugfixAmbiente.test.ts
```

Expected: FAIL — `expect(1280).toBeGreaterThan(2300)`

- [ ] **Step 3: Atualizar coordenadas em `World0.ts`**

Localize o objeto `miniBoss` dentro de `LEVEL_0_1` (por volta da linha 44) e substitua:

```typescript
// ANTES:
miniBoss: {
  triggerX:      1280,
  spawnX:        1520,
  spawnY:        352,
  leftBarrierX:  1056,
  rightBarrierX: 1984,
},

// DEPOIS:
miniBoss: {
  triggerX:      2400,   // ~78% do mapa — boss como guardião da casa
  spawnX:        2640,   // 240px à frente do trigger
  spawnY:        352,
  leftBarrierX:  2176,   // arena começa 464px antes do trigger
  rightBarrierX: 3008,   // arena vai até 64px antes do fim do mapa
},
```

- [ ] **Step 4: Rodar teste para confirmar que passa**

```bash
npm test -- tests/BugfixAmbiente.test.ts
```

Expected: PASS (todos os 3 novos casos + o da Task 1)

- [ ] **Step 5: Commit**

```bash
git add src/levels/World0.ts tests/BugfixAmbiente.test.ts
git commit -m "fix: mover trigger do Aspirador para o final de LEVEL_0_1 (triggerX 1280→2400)"
```

---

## Task 3: Remover árvore sobreposta à casa em LEVEL_1_1

**Arquivo:** `src/levels/World1.ts`

`LEVEL_1_1` tem `{ type: 'casa', x: 1100, y: G }`. O sprite de `casa` tem largura visual de ~700px (cobre x=1100 até ~x=1800). A `arvore` em x=1950 fica na borda visual da casa. Para garantir separação clara, mover a árvore para x=2100.

- [ ] **Step 1: Adicionar teste que falha**

Em `tests/BugfixAmbiente.test.ts`, adicione:

```typescript
import { LEVEL_1_1 } from '../src/levels/World1'

describe('LEVEL_1_1 decorations', () => {
  it('nenhuma arvore deve estar dentro da faixa visual da casa (x 1100–1900)', () => {
    const casaX = LEVEL_1_1.decorations?.find(d => d.type === 'casa')?.x ?? 0
    const arvores = LEVEL_1_1.decorations?.filter(d => d.type === 'arvore') ?? []
    arvores.forEach(arv => {
      expect(arv.x).not.toBeGreaterThan(casaX - 50)
      expect(arv.x).not.toBeLessThan(casaX + 800)  // 800px = faixa segura após a casa
    })
  })
})
```

Nota: o teste verifica que nenhuma árvore esteja dentro do intervalo `[casaX - 50, casaX + 800]`.

- [ ] **Step 2: Rodar teste para confirmar comportamento atual**

```bash
npm test -- tests/BugfixAmbiente.test.ts
```

Observe o output — se a árvore em x=1950 falha no teste, o fix é necessário; se passa, ajuste os bounds do teste para refletir a sobreposição visual real (ex.: `casaX + 900`).

- [ ] **Step 3: Mover a decoração `arvore` em `World1.ts`**

Localize o array `decorations` de `LEVEL_1_1` e mova a `arvore` para fora da zona da casa:

```typescript
// ANTES (dentro de LEVEL_1_1.decorations):
{ type: 'arvore',  x: 1950, y: G },

// DEPOIS:
{ type: 'arvore',  x: 2100, y: G },
```

- [ ] **Step 4: Rodar todos os testes**

```bash
npm test
```

Expected: todos PASS

- [ ] **Step 5: Commit**

```bash
git add src/levels/World1.ts tests/BugfixAmbiente.test.ts
git commit -m "fix: mover arvore de LEVEL_1_1 para fora da faixa visual da casa (x 1950→2100)"
```

---

## Task 4: Ledge detection para HumanEnemy

**Arquivos:** `src/entities/enemies/HumanEnemy.ts`, `src/scenes/GameScene.ts`

`HumanEnemy._doPatrol()` e `_doChase()` não verificam se há chão à frente antes de avançar. O `groundLayer` em `GameScene` é um `Phaser.Physics.Arcade.StaticGroup` de `staticImage` tiles 32×32px. A solução: método `setGroundLayer()` (chamado uma vez após spawn) + `_hasGroundAhead()` que varre `getChildren()` buscando tile na posição `(x + dir * 28, y + 36)`.

- [ ] **Step 1: Adicionar campo e método `setGroundLayer` em `HumanEnemy.ts`**

Logo após a declaração dos campos privados existentes (linha ~24), adicione:

```typescript
private _groundLayer: Phaser.Physics.Arcade.StaticGroup | null = null

setGroundLayer(layer: Phaser.Physics.Arcade.StaticGroup): void {
  this._groundLayer = layer
}
```

- [ ] **Step 2: Adicionar `_hasGroundAhead` em `HumanEnemy.ts`**

Na seção `// ─── Utilities`, logo antes de `_hasReachedLastKnown`, adicione:

```typescript
/**
 * Retorna true se há um tile de chão a ~28px à frente e ~36px abaixo.
 * Previne que o inimigo caminhe para além da borda de plataformas.
 */
private _hasGroundAhead(dir: number): boolean {
  if (!this._groundLayer) return true   // sem layer → assume que há chão (comportamento legado)
  const checkX = this.x + dir * 28
  const checkY = this.y + 36
  const TILE   = 32
  return this._groundLayer.getChildren().some((child) => {
    const img = child as Phaser.Physics.Arcade.Image
    return Math.abs(img.x - checkX) < TILE && Math.abs(img.y - checkY) < TILE
  })
}
```

- [ ] **Step 3: Patch `_doPatrol` para verificar borda**

Substitua o método `_doPatrol` inteiro:

```typescript
private _doPatrol(body: Phaser.Physics.Arcade.Body): void {
  const worldLeft  = this.scene.physics.world.bounds.left + 16
  const worldRight = this.scene.physics.world.bounds.right - 16
  if (body.blocked.left || this.x <= this._patrolLeft || this.x <= worldLeft) {
    this.direction = 1
  } else if (body.blocked.right || this.x >= this._patrolRight || this.x >= worldRight) {
    this.direction = -1
  } else if (!this._hasGroundAhead(this.direction)) {
    this.direction *= -1                // inverter na borda de plataforma
  }
  this.setVelocityX(this.direction * this._config.patrolSpeed)
}
```

- [ ] **Step 4: Patch `_doChase` para parar na borda**

Substitua o método `_doChase` inteiro:

```typescript
private _doChase(body: Phaser.Physics.Arcade.Body): void {
  this.direction = this._playerX > this.x ? 1 : -1
  if (body.blocked.left)  this.direction = 1
  if (body.blocked.right) this.direction = -1
  if (!this._hasGroundAhead(this.direction)) {
    this.setVelocityX(0)               // parar na borda — não cair atrás do jogador
    return
  }
  this.setVelocityX(this.direction * this._config.chaseSpeed)
}
```

- [ ] **Step 5: Chamar `setGroundLayer` após criar HumanEnemy em `GameScene.ts`**

Em `_spawnEnemies()`, dentro do bloco `if (enemy instanceof HumanEnemy)` que já existe (por volta da linha 345), adicione a chamada ao `setGroundLayer`:

```typescript
if (enemy instanceof HumanEnemy) {
  enemy.setGroundLayer(this.groundLayer)   // ← adicionar esta linha
  enemy.on('grabPlayer', (knockbackDir: number) => {
    // ... código existente, não alterar ...
  })
}
```

- [ ] **Step 6: Rodar todos os testes**

```bash
npm test
```

Expected: PASS (build TypeScript também não deve ter erros)

- [ ] **Step 7: Build para verificar TypeScript**

```bash
npm run build 2>&1 | tail -20
```

Expected: sem erros de tipo. Se houver erro de tipo em `getChildren()`, adicione o cast explícito: `(child as Phaser.Physics.Arcade.Image)` — já incluso no código acima.

- [ ] **Step 8: Commit**

```bash
git add src/entities/enemies/HumanEnemy.ts src/scenes/GameScene.ts
git commit -m "fix: ledge detection em HumanEnemy — patrulha e chase param na borda de plataforma"
```

---

## Verificação final

- [ ] **Rodar suite completa**

```bash
npm test
```

Expected: todos os testes passam.

- [ ] **Build de produção**

```bash
npm run build 2>&1 | grep -E "error|warning" | head -20
```

Expected: sem erros.

- [ ] **Teste manual obrigatório (abre no browser)**

Abrir `http://localhost:5173` (ou `npm run dev`) e verificar:

1. **Background**: scrollar qualquer fase até metade do mapa — background deve cobrir o viewport inteiro, sem área descoberta mostrando só o bgColor
2. **Boss**: jogar LEVEL_0_1 até x≈2400 — boss não deve aparecer antes disso; no início da fase deve haver espaço livre
3. **Inimigos humanos**: colocar um inimigo em plataforma elevada (ex. LEVEL_1_3) — ao patrulhar, deve inverter na borda; ao perseguir, deve parar na borda
4. **Casa vs árvore**: em LEVEL_1_1, árvore deve estar visivelmente separada da casa

- [ ] **Commit final se tudo estiver ok**

```bash
git add -A
git commit -m "chore: verificação pós-bugfix ambiente e inimigos"
```
