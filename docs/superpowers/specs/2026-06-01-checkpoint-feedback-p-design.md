# Spec P — Checkpoint: Feedback Persistente + Game Over Honesto

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Melhorar a UX de progressão de fase em 2 pontos: (P1) dar feedback visual persistente ao checkpoint ativado, e (P2) corrigir o label enganoso do botão de Game Over quando não há checkpoint.

---

## Contexto

Revisão de UX de fase identificou que as telas (GameOver, LevelComplete, WorldMap) já estão polidas, mas o **checkpoint** — mecânica central de progressão — tem feedback fraco:

- Ao tocar no checkpoint, há só um sparkle + popup únicos. O sprite não muda. Ao reentrar na fase (respawn), nada indica que está ativo.
- O botão de Game Over sempre diz "retomar do checkpoint", mesmo quando nenhum checkpoint foi tocado (cai silenciosamente ao spawn).

O checkpoint é um `staticImage` adicionado ao `itemGroup` em `GameScene._buildTilemap()`, criado fresh a cada carga de fase. Ao tocar, `ItemCollectHandler` recebe o próprio sprite como `item` e faz `return` sem destruí-lo. Há um único checkpoint por fase.

---

## P1 — Feedback persistente de checkpoint

### Problema

O sprite do checkpoint não muda de aparência ao ser ativado. O único feedback (`checkpointSparkle` + popup) é instantâneo e desaparece. O jogador não tem como saber, depois, se já ativou o checkpoint — especialmente ao respawnar.

### Solução

Estado visual persistente aplicado ao sprite do checkpoint.

**Novo método em `src/fx/EffectsManager.ts`:**

```typescript
/** Marca um checkpoint como ativado: tint ciano + pulse infinito suave. */
checkpointActivatedGlow(sprite: Phaser.GameObjects.Image): void {
  sprite.setTint(0x66ffdd)
  this.scene.tweens.add({
    targets: sprite,
    alpha: 0.7,
    duration: 700,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
}
```

### Integração em 2 pontos

**1. Ativação ao vivo — `src/scenes/ItemCollectHandler.ts`, case `'checkpoint'`:**

Após o `scene._fx.checkpointSparkle(item.x, item.y)` existente, adicionar:
```typescript
scene._fx.checkpointActivatedGlow(item)
```

**2. Reentrada (respawn) — `src/scenes/GameScene.ts`, `_buildTilemap()`:**

Após criar o `cp` e adicioná-lo ao `itemGroup`, se o checkpoint já foi alcançado nesta sessão, aplicar o glow imediatamente:
```typescript
if (gameState.checkpointReached) {
  this._fx.checkpointActivatedGlow(cp)
}
```

> **Ordem de inicialização (verificada):** Em `create()`, `_buildTilemap()` é chamado na linha 142, mas `this._fx = new EffectsManager(this)` só na linha 144 — **depois**. Como o construtor de `EffectsManager` apenas armazena a `scene` (`constructor(private scene: Phaser.Scene) {}`), a correção é **mover a linha `this._fx = new EffectsManager(this)` para antes de `this._buildTilemap()`** (ex.: logo após `_buildDecorations()` na linha 139, ou no início do bloco de setup). Isso garante que `_fx` exista quando `_buildTilemap` aplicar o glow, sem efeitos colaterais.

### Resultado

O checkpoint brilha e pulsa de forma persistente uma vez ativado, e continua brilhando ao reentrar na fase. O jogador sempre sabe o estado.

---

## P2 — Game Over honesto sobre checkpoint

### Problema

`GameOverScene` mostra sempre `[ ENTER — retomar do checkpoint ]`. Se nenhum checkpoint foi tocado, `resetAtCheckpoint()` cai de volta ao spawn inicial — o label mente.

### Solução

Label condicional baseado em `gameState.checkpointReached`. A lógica de escolha do label é extraída como função pura testável.

**Novo módulo `src/scenes/checkpointButtonLabel.ts`:**

```typescript
/** Texto do botão ENTER no Game Over, conforme haja ou não checkpoint ativo. */
export function checkpointButtonLabel(reached: boolean): string {
  return reached
    ? '[ ENTER — retomar do checkpoint ]'
    : '[ ENTER — recomeçar do início da fase ]'
}
```

**Integração em `src/scenes/GameOverScene.ts`:**

A linha que cria `enterBtn` (atualmente `mkBtn(300, '[ ENTER — retomar do checkpoint ]', '#ffffff')`) passa a usar:
```typescript
const enterBtn = mkBtn(300, checkpointButtonLabel(gameState.checkpointReached), '#ffffff')
```

### Comportamento

Nenhuma mudança de comportamento — apenas o texto muda:
- **ENTER** continua chamando `resetAtCheckpoint()` (mantém score, cai ao checkpoint ou spawn)
- **R** continua chamando `resetLevel()` (zera score e stats da sessão)

A distinção fica honesta no texto:
- Com checkpoint: "retomar do checkpoint"
- Sem checkpoint: "recomeçar do início da fase"

### Teste

`tests/checkpointButtonLabel.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { checkpointButtonLabel } from '../src/scenes/checkpointButtonLabel'

describe('checkpointButtonLabel', () => {
  it('com checkpoint ativo menciona "checkpoint"', () => {
    expect(checkpointButtonLabel(true)).toContain('checkpoint')
  })
  it('sem checkpoint menciona "início da fase"', () => {
    expect(checkpointButtonLabel(false)).toContain('início da fase')
  })
})
```

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/fx/EffectsManager.ts` | P1: novo método `checkpointActivatedGlow()` |
| `src/scenes/ItemCollectHandler.ts` | P1: chamar glow na ativação |
| `src/scenes/GameScene.ts` | P1: mover init de `_fx` para antes de `_buildTilemap` + aplicar glow no `_buildTilemap` se já alcançado |
| `src/scenes/checkpointButtonLabel.ts` | P2: **criar** — função pura do label |
| `src/scenes/GameOverScene.ts` | P2: usar `checkpointButtonLabel()` |
| `tests/checkpointButtonLabel.test.ts` | P2: **criar** — testes da função pura |

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| P3 — barra de progresso da fase | Maior; sessão separada |
| Novos assets de sprite para checkpoint ativado | Tudo via tint + tween, sem assets |
| Indicador de respawn animado (seta/spotlight ao renascer) | Glow persistente já cobre o feedback central; evita escopo extra |
| Som dedicado para reentrada com checkpoint ativo | Mantém escopo visual |
| Desabilitar fisicamente a opção ENTER sem checkpoint | Comportamento atual (cair ao spawn) é válido; só o label precisa de honestidade |
