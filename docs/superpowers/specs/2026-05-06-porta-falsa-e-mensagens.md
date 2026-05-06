# Spec B — Porta Falsa + Mensagens de Item

**Goal:** Corrigir a decoração `grade` que parece a saída da fase 0-1, e exibir mensagens descritivas ao coletar power-ups e acessórios.

**Architecture:** Duas mudanças cirúrgicas, sem novos sistemas. (1) Trocar 1 linha em `World0.ts`. (2) Expandir `_handleItemCollect` em `GameScene.ts` com lookup-map de labels e casos individuais por acessório.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## Parte 1 — Fix Porta Falsa

### Problema

Na fase 0-1 (`LEVEL_0_1`), a decoração `grade` em `x: 2950` está imediatamente antes da saída real (`exitX: 3008`). A textura canvas-drawn da `grade` (barras verticais) é visualmente indistinguível do sprite `EXIT_GATE`, confundindo o jogador.

O NPC `zelador` já é spawned em `x: 2950` — um `balcao` de recepção faz mais sentido contextualmente.

### Mudança

**Arquivo:** `src/levels/World0.ts`

```typescript
// Antes (linha ~110)
{ type: 'grade', x: 2950, y: G, blocking: true }

// Depois
{ type: 'balcao', x: 2950, y: G, blocking: true }
```

`KEYS.BALCAO` e seu canvas em `BootScene.ts` já existem — zero novos assets.

---

## Parte 2 — Mensagens de Item

### Problema

Power-ups (`petisco`, `pipoca`, `churrasco`, `bola`, `frisbee`) e acessórios (`laco`, `coleira`, `chapeu`, `bandana`) mostram apenas `✨` genérico ao serem coletados. O jogador não sabe o que acabou de pegar.

### Mudança

**Arquivo:** `src/scenes/GameScene.ts`, método `_handleItemCollect`

#### Power-ups — lookup-map no `default`

```typescript
private static readonly _POWERUP_LABEL: Record<string, { text: string; color: string }> = {
  petisco:   { text: '⚡ +10s vel!',   color: '#ff8800' },
  pipoca:    { text: '🦘 +10s pulo!',  color: '#ffff00' },
  churrasco: { text: '🥩 +10s força!', color: '#ff4400' },
  bola:      { text: '🎾 bola!',       color: '#44ff88' },
  frisbee:   { text: '🥏 frisbee!',    color: '#44ff88' },
}
```

No `default` do switch, substituir `'✨'` por:

```typescript
const lbl = GameScene._POWERUP_LABEL[type] ?? { text: '✨', color: '#00ffff' }
this._spawnScorePopup(item.x, item.y - 16, lbl.text, lbl.color)
```

#### Acessórios — casos individuais

```typescript
case 'laco':    this._spawnScorePopup(item.x, item.y - 16, '🎀 laço!',   '#ff88cc'); break
case 'coleira': this._spawnScorePopup(item.x, item.y - 16, '📿 coleira!', '#88ccff'); break
case 'chapeu':  this._spawnScorePopup(item.x, item.y - 16, '🎩 chapéu!', '#ccaa44'); break
case 'bandana': this._spawnScorePopup(item.x, item.y - 16, '🏴 bandana!', '#ff4444'); break
```

Cada um ainda chama `gameState.equipAccessory(type)` antes do popup.

### Comportamento resultante

| Item coletado | Popup exibido | Cor |
|---|---|---|
| `bone` | `+10` | `#ffff00` (já existia) |
| `golden_bone` | `+500` | `#ffd700` (já existia) |
| `pizza` | `❤️` | `#ff6b6b` (já existia) |
| `petisco` | `⚡ +10s vel!` | `#ff8800` |
| `pipoca` | `🦘 +10s pulo!` | `#ffff00` |
| `churrasco` | `🥩 +10s força!` | `#ff4400` |
| `bola` | `🎾 bola!` | `#44ff88` |
| `frisbee` | `🥏 frisbee!` | `#44ff88` |
| `laco` | `🎀 laço!` | `#ff88cc` |
| `coleira` | `📿 coleira!` | `#88ccff` |
| `chapeu` | `🎩 chapéu!` | `#ccaa44` |
| `bandana` | `🏴 bandana!` | `#ff4444` |
| qualquer outro | `✨` | `#00ffff` (fallback) |

---

## Parte 3 — Testes

**Arquivo:** `tests/ItemMessages.test.ts`

```typescript
describe('_POWERUP_LABEL lookup', () => {
  it('petisco tem texto e cor corretos')
  it('pipoca tem texto e cor corretos')
  it('churrasco tem texto de carne')
  it('bola e frisbee têm mesma cor')
  it('tipo desconhecido faz fallback para ✨')
})

describe('Fix porta falsa', () => {
  it('LEVEL_0_1 não tem grade em x=2950')
  it('LEVEL_0_1 tem balcao em x=2950')
})
```

---

## Ordem de Implementação

```
Task 1: World0.ts — trocar grade → balcao em x=2950
Task 2: Testes TDD — ItemMessages.test.ts (falham primeiro)
Task 3: GameScene.ts — _POWERUP_LABEL + casos de acessórios
Task 4: build final + todos testes passando
```
