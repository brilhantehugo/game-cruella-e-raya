# Spec M1 — Power-ups Múltiplos Simultâneos

**Data:** 2026-06-05
**Status:** Aprovado

**Goal:** Permitir múltiplos power-ups ativos ao mesmo tempo (petisco, pipoca, churrasco), em vez do slot único atual onde pegar um cancela o outro.

---

## Contexto

Hoje `gameState.activePowerUp: ActivePowerUp | null` é um slot único — `applyPowerUp` sobrescreve o anterior. Pegar pizza... (na verdade petisco/pipoca/churrasco) enquanto outro está ativo cancela o primeiro. Power-ups temporizados reais: **petisco** (velocidade, +90 em Player), **pipoca** (pulo, Raya/Cruella), **churrasco** (one-shot kill, CollisionSetup).

Consumidores de efeito usam `hasPowerUp(type, now)` — assinatura inalterada. Apenas o HUD (`UIScene`) e a aura (`GameScene`) leem `activePowerUp` direto e precisam adaptar.

---

## Seção 1 — Modelo de dados (GameState)

`activePowerUp: ActivePowerUp | null` → `activePowerUps: Map<string, number>` (tipo → `expiresAt`).

```typescript
activePowerUps: Map<string, number> = new Map()

applyPowerUp(type: string, now: number): void {
  this.activePowerUps.set(type, now + POWER_UP_DURATION)   // adiciona ou renova
}

hasPowerUp(type: string, now: number): boolean {
  const exp = this.activePowerUps.get(type)
  if (exp === undefined) return false
  if (now >= exp) { this.activePowerUps.delete(type); return false }
  return true
}

hasAnyPowerUp(now: number): boolean {
  for (const [type, exp] of this.activePowerUps) {
    if (now >= exp) this.activePowerUps.delete(type)
  }
  return this.activePowerUps.size > 0
}

/** Power-ups ativos (não-expirados), em ordem de inserção. Para o HUD. */
getActivePowerUps(now: number): Array<{ type: string; expiresAt: number }> {
  const out: Array<{ type: string; expiresAt: number }> = []
  for (const [type, exp] of this.activePowerUps) {
    if (now < exp) out.push({ type, expiresAt: exp })
    else this.activePowerUps.delete(type)
  }
  return out
}
```

**Resets** (`reset`, `resetAtCheckpoint`, `resetLevel`): trocar `this.activePowerUp = null` por `this.activePowerUps.clear()`.

**Remover** a interface `ActivePowerUp` (verificado: usada apenas no campo `activePowerUp` que está sendo substituído — nenhum import externo). Deletar as linhas 6-9 de `GameState.ts`.

Assinaturas de `applyPowerUp`/`hasPowerUp`/`hasAnyPowerUp` inalteradas — Raya/Cruella/Player/CollisionSetup não mudam.

---

## Seção 2 — HUD empilhado (UIScene)

Atualmente: 1 ícone (`_puIcon` em 140,24) + 1 barra (`_puBarBg`/`_puBar` em 185,31). Substituir por uma pilha dinâmica de linhas [ícone + barra], uma por power-up ativo.

**Abordagem:** pool de linhas criadas no `create()` (máx 3 — só há 3 tipos temporizados), cada linha = `{ icon: Text, barBg: Rectangle, bar: Rectangle }`. No update, `getActivePowerUps(now)` retorna a lista; cada linha visível é posicionada verticalmente (ex.: `y = 24 + i * 12`), as demais ficam `setVisible(false)`.

```typescript
// create(): criar pool
private _puRows: Array<{ icon: Phaser.GameObjects.Text; barBg: Phaser.GameObjects.Rectangle; bar: Phaser.GameObjects.Rectangle }> = []
// 3 linhas em y = 24, 36, 48 (ícone em x=140, barra em x=185)

// update():
const active = gameState.getActivePowerUps(now)
const puIcons: Record<string, string> = { petisco: '🍖', pipoca: '🍿', churrasco: '🥩', bola: '🎾', frisbee: '🥏' }
this._puRows.forEach((row, i) => {
  const pu = active[i]
  if (pu) {
    const fraction = Math.max(0, (pu.expiresAt - now) / POWER_UP_DURATION)
    const barColor = fraction < 0.2 ? 0xef4444 : 0x06b6d4
    row.icon.setText(puIcons[pu.type] ?? '⚡').setVisible(true)
    row.bar.setDisplaySize(60 * fraction, 7).setFillStyle(barColor).setVisible(true)
    row.barBg.setVisible(true)
  } else {
    row.icon.setVisible(false)
    row.bar.setVisible(false)
    row.barBg.setVisible(false)
  }
})
```

Os campos `_puIcon`/`_puBar`/`_puBarBg` antigos são substituídos pelo pool `_puRows`. As posições Y (24, 36, 48) cabem na faixa do HUD (rect de fundo em y=22, altura 44 → até y=44; ajustar se necessário para 22/32/42 mantendo dentro da faixa — decisão concreta no plano após medir).

---

## Seção 3 — Aura representativa (GameScene)

A aura usa uma cor por power-up. Com múltiplos ativos, usar o **mais recente** (último inserido no Map). 

```typescript
this._puAuraGfx.clear()
const active = gameState.getActivePowerUps(this.time.now)
if (active.length > 0) {
  const puColors: Record<string, number> = {
    petisco: 0xff8800, pipoca: 0xffff00, churrasco: 0xff4400, bola: 0x44ff88, frisbee: 0x44ff88,
  }
  const primary = active[active.length - 1].type   // mais recente
  const puColor = puColors[primary] ?? 0x00ccff
  // ... resto do desenho da aura inalterado, usando puColor
}
```

Substitui o `const puEntry = gameState.activePowerUp; if (puEntry && hasAnyPowerUp(...))` por leitura via `getActivePowerUps`.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/GameState.ts` | `activePowerUps: Map` + métodos + `getActivePowerUps` + resets |
| `src/scenes/UIScene.ts` | Pool `_puRows` empilhado em vez de ícone/barra únicos |
| `src/scenes/GameScene.ts` | Aura usa `getActivePowerUps` (cor do mais recente) |
| `tests/GameState.test.ts` | Atualizar/expandir testes para o Map |

---

## Estratégia de Teste

Testes em `tests/GameState.test.ts` (GameState é testável — sem Phaser):
- `applyPowerUp` de 2 tipos diferentes → ambos ativos (`hasPowerUp` true para os dois)
- `applyPowerUp` mesmo tipo 2× → renova expiração, não duplica
- expiração lazy: tipo expirado removido em `hasPowerUp`/`hasAnyPowerUp`/`getActivePowerUps`
- `getActivePowerUps` retorna ordem de inserção, exclui expirados
- resets limpam o Map
- Testes existentes que liam `activePowerUp` (linhas ~61-64, 115, 155) atualizados para o novo modelo

Build TypeScript sem erros; suíte verde.

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Aura com blend de múltiplas cores | Complexidade visual desnecessária; cor do mais recente basta |
| Limite/stacking de efeito do mesmo tipo (ex.: 2× velocidade) | Mesmo tipo só renova duração, não empilha intensidade |
| Novos tipos de power-up | Fora do escopo |
| Mostrar mais de 3 linhas no HUD | Só há 3 power-ups temporizados |
