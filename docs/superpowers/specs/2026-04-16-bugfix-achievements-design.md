# Spec E — Bug Fixes: AchievementsScene Overflow & full_health_boss

**Data:** 2026-04-16
**Área:** Correcção de bugs — Achievements
**Estado:** Aprovado

---

## 1. Visão Geral

Duas correcções cirúrgicas ao sistema de achievements entregue na Spec D:

1. **AchievementsScene overflow** — o separador "Todos" mostrava 10 linhas de cards (20 achievements ÷ 2 colunas) num espaço que comporta apenas ~7, cortando os últimos itens sem scroll.
2. **`full_health_boss` lógica errada** — o payload `playerHpFull` era calculado como `hearts >= livesAtBossStart` (não perdeu vida *nesta luta*), em vez de `hearts >= 3` (vida cheia no momento da derrota do boss).

---

## 2. Fix 1 — Cards Compactos em `AchievementsScene`

### Diagnóstico

- Área visível para cards: `GAME_HEIGHT − HEADER_H − 8 = 450 − 90 − 8 = 352px`
- Linhas com 20 achievements em 2 colunas: `ceil(20/2) = 10`
- Altura original por linha: `ROW_H = 52px` → total `520px` → overflow `168px`
- Separadores de categoria individuais (máx. 6 itens = 3 linhas = 156px) não têm overflow

### Solução

Reduzir `ROW_H` de `52` para `35px`:
- `10 × 35px = 350px` — cabe nos 352px disponíveis sem scroll
- Ajustar coordenadas internas dos cards para o novo espaço

### Alterações em `src/scenes/AchievementsScene.ts`

| Elemento | Antes | Depois |
|---|---|---|
| `ROW_H` (constante) | `52` | `35` |
| Título — offset Y | `y + 10` | `y + 4` |
| Título — fontSize | `'11px'` | `'10px'` |
| Descrição — offset Y | `y + 25` | `y + 16` |
| Descrição — fontSize | `'9px'` | `'8px'` |

**Elementos sem alteração:** ícone (centrado em `y + ROW_H/2`), status ✓/🔒 (centrado em `y + ROW_H/2`), fundo do card (`ROW_H - 4`), header, tabs, lógica de filtro, AchievementManager.

---

## 3. Fix 2 — `full_health_boss` Condição Correcta

### Diagnóstico

Em `GameScene.ts`, o campo `playerHpFull` do payload `boss_defeated` é calculado como:

```ts
playerHpFull: gameState.hearts >= this._livesAtBossStart
```

Isto dispara o achievement `full_health_boss` ("Sã e Salva") sempre que o jogador não perdeu corações *durante a luta*, mesmo que a luta tenha começado com apenas 2/3 corações. O achievement devia exigir HP máximo (3/3) no momento da derrota.

### Solução

Substituir nos 4 locais de boss em `GameScene.ts`:

```ts
// Antes
playerHpFull: gameState.hearts >= this._livesAtBossStart

// Depois
playerHpFull: gameState.hearts >= 3
```

Os 4 locais correspondem aos 4 bosses:
- `ZeladorBoss` (Boss do Mundo 0)
- `Drone` (Boss do Mundo 1)
- `SegurancaMoto` (Boss intermédia do Mundo 2)
- `SeuBigodes` (Boss final do Mundo 3)

---

## 4. Ficheiros Modificados

| Ficheiro | Alteração |
|---|---|
| `src/scenes/AchievementsScene.ts` | `ROW_H` + 4 coordenadas de card |
| `src/scenes/GameScene.ts` | `playerHpFull` nos 4 blocos de boss |

---

## 5. Testes

- `npm test` deve continuar com 124/124 (nenhum teste cobre coordenadas de UI nem payload de boss directamente)
- Verificação visual: separador "Todos" na `AchievementsScene` deve mostrar todos os 20 achievements sem overflow
- `npm run build` deve passar sem erros TypeScript

---

## 6. Fora de Âmbito

- Scroll nativo (roda do rato / touch) — descartado em favor da solução compacta
- Animação de unlock in-game — feature nova, não bug
- Outros campos do payload `boss_defeated`
