# Bug Fixes — Achievements (Spec E) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir dois bugs no sistema de achievements: overflow de cards no separador "Todos" da AchievementsScene e condição errada do achievement `full_health_boss`.

**Architecture:** Duas alterações independentes e cirúrgicas — uma de layout (constante + coordenadas de UI) e uma de lógica de payload (comparação de inteiros). Zero novos ficheiros, zero novas dependências.

**Tech Stack:** TypeScript, Phaser 3, Vitest, npm

**Spec:** `docs/superpowers/specs/2026-04-16-bugfix-achievements-design.md`

---

## File Map

| Ficheiro | Acção | Detalhe |
|---|---|---|
| `src/scenes/AchievementsScene.ts` | Modificar | `ROW_H` 52→35 + 4 coordenadas de card |
| `src/scenes/GameScene.ts` | Modificar | `playerHpFull` em 4 locais de boss |

---

## Task 1: AchievementsScene — cards compactos

**Files:**
- Modify: `src/scenes/AchievementsScene.ts:10` (constante `ROW_H`)
- Modify: `src/scenes/AchievementsScene.ts:156–168` (coordenadas título + descrição)

Esta task não tem testes unitários possíveis (UI Phaser). A verificação é feita pelo build TypeScript e pela ausência de overflow visual.

---

- [ ] **Step 1.1: Alterar a constante `ROW_H`**

Abrir `src/scenes/AchievementsScene.ts`. Linha 10, alterar:

```typescript
// Antes
const ROW_H       = 52

// Depois
const ROW_H       = 35
```

---

- [ ] **Step 1.2: Ajustar coordenadas do card**

Na função `_drawCard` (a partir da linha 134), fazer estas 4 alterações:

**Título — linha ~156:**
```typescript
// Antes
const title = this.add.text(x + 36, y + 10, titleStr, {
  fontSize: '11px', color: titleColor, fontStyle: 'bold',
}).setAlpha(alpha)

// Depois
const title = this.add.text(x + 36, y + 4, titleStr, {
  fontSize: '10px', color: titleColor, fontStyle: 'bold',
}).setAlpha(alpha)
```

**Descrição — linha ~166:**
```typescript
// Antes
const desc = this.add.text(x + 36, y + 25, descStr, {
  fontSize: '9px', color: '#666666',
}).setAlpha(alpha)

// Depois
const desc = this.add.text(x + 36, y + 16, descStr, {
  fontSize: '8px', color: '#666666',
}).setAlpha(alpha)
```

Ícone (`y + ROW_H / 2`), fundo do card (`ROW_H - 4`) e status (`y + ROW_H / 2`) **não alterar** — centram-se automaticamente com o novo `ROW_H`.

---

- [ ] **Step 1.3: Build check**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs` sem erros TypeScript.

---

- [ ] **Step 1.4: Commit**

```bash
git add src/scenes/AchievementsScene.ts
git commit -m "fix(achievements): compact cards ROW_H 52→35 to prevent overflow in All tab"
```

---

## Task 2: GameScene — `full_health_boss` condição correcta

**Files:**
- Modify: `src/scenes/GameScene.ts` (4 locais — linhas ~418, ~485, ~513, ~543)

A condição `hearts >= livesAtBossStart` dispara o achievement mesmo com 2/3 corações se o jogador não perdeu vida *durante a luta*. A condição correcta é `hearts >= 3` (HP máximo absoluto).

---

- [ ] **Step 2.1: Verificar os 4 locais antes de editar**

```bash
grep -n "playerHpFull.*livesAtBossStart" src/scenes/GameScene.ts
```

Esperado: 4 linhas (uma por boss: ZeladorBoss ~418, Drone ~485, SegurancaMoto ~513, SeuBigodes ~543).

---

- [ ] **Step 2.2: Substituir nos 4 locais**

Em cada um dos 4 blocos `boss_defeated` em `src/scenes/GameScene.ts`, alterar:

```typescript
// Antes (repetido 4×)
playerHpFull: gameState.hearts >= this._livesAtBossStart,

// Depois (repetido 4×)
playerHpFull: gameState.hearts >= 3,
```

Usar substituição global no editor ou:

```bash
sed -i '' 's/playerHpFull: gameState\.hearts >= this\._livesAtBossStart,/playerHpFull: gameState.hearts >= 3,/g' src/scenes/GameScene.ts
```

---

- [ ] **Step 2.3: Confirmar que foram exactamente 4 substituições**

```bash
grep -n "playerHpFull" src/scenes/GameScene.ts
```

Esperado: 4 linhas com `playerHpFull: gameState.hearts >= 3,` e nenhuma com `livesAtBossStart`.

---

- [ ] **Step 2.4: Executar a suite de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: `Tests 124 passed (124)` — os testes existentes do `AchievementManager` cobrem a avaliação do flag `full_health_boss` com `playerHpFull: true/false`; o valor correcto do campo passa a ser gerado correctamente pelo GameScene.

---

- [ ] **Step 2.5: Build check**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs` sem erros.

---

- [ ] **Step 2.6: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "fix(achievements): full_health_boss requires max hearts (>=3), not no-damage-in-fight"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Fix 1: `ROW_H` 52→35 (Task 1.1)
- ✅ Fix 1: coordenadas título y+4 / 10px, descrição y+16 / 8px (Task 1.2)
- ✅ Fix 1: ícone e status auto-centrados — não precisam de alteração (Task 1.2)
- ✅ Fix 2: `playerHpFull: gameState.hearts >= 3` nos 4 bosses (Task 2.2)
- ✅ Build e testes verificados em ambas as tasks

**Placeholder scan:** nenhum TBD ou "implement later" ✅

**Consistência:** `ROW_H` é uma constante de módulo — ao alterar na linha 10, todos os usos (`ROW_H / 2`, `ROW_H - 4`) recalculam automaticamente ✅
