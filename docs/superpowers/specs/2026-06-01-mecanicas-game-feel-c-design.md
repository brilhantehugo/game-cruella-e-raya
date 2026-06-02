# Spec C — Mecânicas / Game Feel: Duração de Power-Up + Dica de Combo

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Corrigir 2 itens de baixo risco da revisão de mecânicas: (M3) eliminar o número mágico `10000` da duração de power-up usando a constante existente, e (M2) adicionar um indicador visual da janela de combo dash→swap.

---

## Contexto

Revisão de mecânicas identificou 3 itens. Esta spec cobre os 2 de baixo risco (M2 e M3). O M1 (múltiplos power-ups simultâneos) é uma mudança de design maior, adiada para sessão futura.

---

## M3 — Duração de power-up via constante

### Problema

`POWER_UP_DURATION = 10000` existe em `src/constants.ts:168` mas nunca é importado. O valor `10000` está hardcoded em dois lugares:

- `src/GameState.ts:98` — `applyPowerUp()`: `expiresAt: now + 10000`
- `src/scenes/UIScene.ts:155` — cálculo da fração da barra: `(expiresAt - now) / 10000`

Se a duração mudar, os dois pontos precisam ser editados manualmente — risco de inconsistência (a barra de UI dessincronizar do tempo real).

### Fix

- `src/GameState.ts`: importar `POWER_UP_DURATION` de `./constants`, usar `now + POWER_UP_DURATION` em `applyPowerUp()`
- `src/scenes/UIScene.ts`: importar `POWER_UP_DURATION`, usar `(expiresAt - now) / POWER_UP_DURATION`

Sem mudança de comportamento — valor permanece 10000ms. Apenas elimina o número mágico duplicado.

### Teste

Teste unitário em `tests/GameState.test.ts`:
```typescript
import { POWER_UP_DURATION } from '../src/constants'
// ...
it('applyPowerUp define expiresAt = now + POWER_UP_DURATION', () => {
  const gs = new GameState()
  gs.applyPowerUp('petisco', 5000)
  expect(gs.activePowerUp!.expiresAt).toBe(5000 + POWER_UP_DURATION)
})
```

---

## M2 — Indicador visual da janela de combo dash→swap

### Problema

Quando a Raya dasheia, abre-se uma janela de 600ms (`Player.ts:25` — `_dashComboWindowUntil = time + 600`). Trocar para Cruella (TAB) nessa janela ativa um impulso de combo (`_activateDashCombo()`). Nenhum feedback visual sinaliza que a janela está aberta, então o combo é praticamente indescobrível.

### Arquitetura

**Novo método em `src/fx/EffectsManager.ts`:**

```typescript
comboWindowHint(target: Phaser.GameObjects.Sprite, durationMs: number): Phaser.GameObjects.Graphics
```

- Cria um anel ciano (`0x44ddff`) acima do `target`
- Tween de pulse: escala 0.8 ↔ 1.2, alpha 0.4 ↔ 0.9, `yoyo: true, repeat: -1`
- Listener `preupdate` mantém o anel posicionado sobre o `target` a cada frame (mesmo padrão do stun icon corrigido em B1) — `if (gfx.active) gfx.setPosition(target.x, target.y - 36)`
- Retorna o `Graphics` para o chamador poder destruí-lo cedo
- Cleanup: o chamador é responsável por chamar `destroy()` + remover o listener `preupdate`. Para encapsular, o método registra o listener e o método de cleanup remove ambos. **Decisão:** o método retorna o Graphics; o Player gerencia o ciclo de vida (timer de 600ms + destruição antecipada no combo).

> Para garantir cleanup do listener `preupdate`, `comboWindowHint` anexa o `tracker` ao próprio Graphics via `gfx.setData('tracker', tracker)`. O Player, ao destruir, faz `scene.events.off('preupdate', gfx.getData('tracker'))` antes de `gfx.destroy()`. Isso evita listener órfão.

### Integração em `src/entities/Player.ts`

**Novo campo:**
```typescript
private _comboHintGfx: Phaser.GameObjects.Graphics | null = null
```

**No listener `'dashed'` (linha 24):**
```typescript
this.raya.on('dashed', ({ dir, time }: { dir: number; time: number }) => {
  this._dashComboWindowUntil = time + 600
  this._lastDashDir = dir
  this._showComboHint()
})
```

**Novo método privado:**
```typescript
private _showComboHint(): void {
  this._destroyComboHint()   // guard contra dash duplo
  const fx = (this.scene as any)._fx as EffectsManager | undefined
  if (!fx) return
  this._comboHintGfx = fx.comboWindowHint(this.raya, 600)
  this.scene.time.delayedCall(600, () => this._destroyComboHint())
}

private _destroyComboHint(): void {
  if (this._comboHintGfx) {
    const tracker = this._comboHintGfx.getData('tracker')
    if (tracker) this.scene.events.off('preupdate', tracker)
    if (this._comboHintGfx.active) this._comboHintGfx.destroy()
    this._comboHintGfx = null
  }
}
```

**Em `_activateDashCombo()`:** chamar `this._destroyComboHint()` logo após o impulso (combo usado, sinal não é mais necessário).

> Nota: `EffectsManager` é acessível via `(scene as any)._fx` — o campo é `/*internal*/` em GameScene após as specs anteriores. O guard `if (!fx) return` protege contexto de teste sem EffectsManager.

### Teste

A lógica é puramente visual (Phaser Graphics + tweens). Não há função pura nova a testar unitariamente. Rede de segurança:
1. `npm run build` sem erros TypeScript
2. `npx vitest run` — testes existentes continuam passando
3. Smoke test manual: dashear com Raya, confirmar que o anel pulsante aparece e some após 600ms ou ao trocar

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/constants.ts` | Nenhuma (constante já existe) |
| `src/GameState.ts` | M3: importar e usar `POWER_UP_DURATION` |
| `src/scenes/UIScene.ts` | M3: importar e usar `POWER_UP_DURATION` |
| `src/fx/EffectsManager.ts` | M2: novo método `comboWindowHint()` |
| `src/entities/Player.ts` | M2: campo `_comboHintGfx` + `_showComboHint()` + `_destroyComboHint()` + wire no dash e no combo |
| `tests/GameState.test.ts` | M3: teste de `applyPowerUp` com constante |

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| M1 — múltiplos power-ups simultâneos | Mudança de design maior — sessão separada |
| Duração variável por tipo de power-up | Fora do M3 (que só centraliza a constante atual) |
| Sons para a janela de combo | Mantém escopo visual; áudio é decisão separada |
| Indicador de combo para outras habilidades | Apenas dash→swap tem janela de combo hoje |
