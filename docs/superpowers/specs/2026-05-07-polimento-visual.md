# Spec D — Polimento Visual (5 melhorias)

**Goal:** Adicionar cinco melhorias visuais de polimento: blink de invencibilidade, aura de power-up ativo, contagem animada de score no Level Complete e Game Over, e texto flutuante no checkpoint.

**Architecture:** Todas as mudanças são autocontidas em arquivos existentes, sem novos arquivos de produção. Constantes visuais ficam inline (não precisam de vitest). Nenhum import circular é introduzido.

**Tech Stack:** Phaser 3 Arcade Physics, TypeScript, Vitest

---

## Parte A — Blink de invencibilidade (Player.ts)

### Comportamento atual

Em `_performSwap()` e `takeDamage()` (Player.ts linhas 136-137):
```typescript
this.active.setTint(0xff0000)
this.scene.time.delayedCall(300, () => this.active.clearTint())
```
Apenas flash vermelho estático de 300ms — sem indicação de janela de invencibilidade.

### Comportamento esperado

Após o flash vermelho (300ms), o personagem pisca (alpha 1 → 0.3 → 1) **6 vezes** durante 900ms, sinalizando a janela de invencibilidade. Ao final, `alpha` retorna a 1.0.

### Implementação

**Arquivo:** `src/entities/Player.ts`

Localizar em `takeDamage()`:
```typescript
this.active.setTint(0xff0000)
this.scene.time.delayedCall(300, () => this.active.clearTint())
```

Substituir por:
```typescript
this.active.setTint(0xff0000)
this.scene.time.delayedCall(300, () => {
  this.active.clearTint()
  this.scene.tweens.add({
    targets: this.active,
    alpha: 0.3,
    duration: 150,
    yoyo: true,
    repeat: 5,
    ease: 'Linear',
    onComplete: () => { this.active.setAlpha(1) },
  })
})
```

---

## Parte B — Aura de power-up ativo (GameScene.ts)

### Comportamento atual

Nenhum feedback visual contínuo indica que um power-up está ativo no personagem.

### Comportamento esperado

Enquanto um power-up estiver ativo, um círculo colorido (raio 28px, borda 2px) pulsa ao redor do personagem ativo:
- Cor por power-up: `petisco` → laranja `0xff8800`, `pipoca` → amarelo `0xffff00`, `churrasco` → vermelho `0xff4400`, default → ciano `0x00ccff`
- Alpha oscila entre 0.2 e 0.7 via `Math.sin(time * 0.005)`
- Aura acompanha `player.active.x / y` em cada frame

### Implementação

**Arquivo:** `src/scenes/GameScene.ts`

**Passo 1 — Declarar campo privado** (após outras declarações de campo privado, antes de `create()`):
```typescript
private _puAuraGfx!: Phaser.GameObjects.Graphics
```

**Passo 2 — Inicializar em `create()`** (após `this._fx = new EffectsManager(this)`, antes de `this._spawnEnemies()`):
```typescript
this._puAuraGfx = this.add.graphics()
this._puAuraGfx.setDepth(5)
```

**Passo 3 — Atualizar em `update()`** (no final do método `update()`):
```typescript
// Aura de power-up ativo
this._puAuraGfx.clear()
const puEntry = gameState.hasAnyPowerUp(this.time.now) ? gameState.activePowerUp : null
if (puEntry) {
  const puColors: Record<string, number> = {
    petisco:   0xff8800,
    pipoca:    0xffff00,
    churrasco: 0xff4400,
  }
  const puColor = puColors[puEntry.type] ?? 0x00ccff
  const alpha = 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(this.time.now * 0.005))
  this._puAuraGfx.lineStyle(2, puColor, alpha)
  this._puAuraGfx.strokeCircle(this.player.active.x, this.player.active.y, 28)
}
```

> **Nota:** `gameState.activePowerUp` é `{ type: string, expiresAt: number } | null` (definido em `src/GameState.ts`). `hasAnyPowerUp(now)` também zera o campo se estiver expirado, portanto deve ser chamado primeiro.

---

## Parte C — Score count animado — Level Complete (LevelCompleteScene.ts)

### Comportamento atual

Em `create()` (LevelCompleteScene.ts linha ~154), a função `row()` exibe o score estático:
```typescript
row('Pontuação', `${score}`, panelY + 12, '#ffff88')
```

### Comportamento esperado

O valor do score conta de 0 até o valor final durante 1500ms (delay de 600ms após entrada da cena), usando `tweens.addCounter`.

### Implementação

**Arquivo:** `src/scenes/LevelCompleteScene.ts`

**Passo 1 — Substituir a linha do score estático**

A função `row()` (definida localmente em `create()`) usa:
- Label: `this.add.text(panelX + 16, y, label, { fontSize: '14px', color: '#888888' })`
- Valor: `this.add.text(panelX + panelW - 16, y, finalVal, { fontSize: '14px', color: col, align: 'right' }).setOrigin(1, 0)`

Onde `panelX = cx - 140`, `panelW = 280`, primeira linha em `panelY + 12`.

Localizar:
```typescript
row('Pontuação', `${score}`, panelY + 12, '#ffff88')
```

Substituir por:
```typescript
// Label estático (igual ao row() normal)
this.add.text(panelX + 16, panelY + 12, 'Pontuação', { fontSize: '14px', color: '#888888' })
// Valor animado
const scoreValTxt = this.add.text(panelX + panelW - 16, panelY + 12, '0', {
  fontSize: '14px', color: '#ffff88', align: 'right',
}).setOrigin(1, 0)
this.tweens.addCounter({
  from: 0,
  to: score,
  duration: 1500,
  delay: 600,
  ease: 'Quad.easeOut',
  onUpdate: (tween) => {
    scoreValTxt.setText(Math.floor(tween.getValue()).toString())
  },
})
```

---

## Parte D — Score count animado — Game Over (GameOverScene.ts)

### Comportamento atual

Em `create()` (GameOverScene.ts linha ~90):
```typescript
this.add.text(cx, 186, `${gameState.score}`, { ... })
```
Score exibido estaticamente.

### Comportamento esperado

O score conta de 0 até o valor final durante 1200ms (delay de 800ms após entrada da cena).

### Implementação

**Arquivo:** `src/scenes/GameOverScene.ts`

Localizar (em torno da linha 90):
```typescript
this.add.text(cx, 186, `${gameState.score}`, {
```

Substituir por:
```typescript
const scoreText = this.add.text(cx, 186, '0', {
```

Adicionar após a criação do texto (manter toda a chain de configuração existente, apenas mudar o valor inicial e guardar referência):
```typescript
this.tweens.addCounter({
  from: 0,
  to: gameState.score,
  duration: 1200,
  delay: 800,
  ease: 'Quad.easeOut',
  onUpdate: (tween) => {
    scoreText.setText(Math.floor(tween.getValue()).toString())
  },
})
```

---

## Parte E — Checkpoint: texto flutuante (GameScene.ts)

### Comportamento atual

Em `_handleItemCollect()` (GameScene.ts), o case `'checkpoint'` ativa o checkpoint mas não exibe feedback visual de texto.

### Comportamento esperado

Ao coletar/ativar um checkpoint, exibir popup flutuante: **"✅ checkpoint!"** em ciano `#00ffcc`, usando o método já existente `_fx.scorePopupBounce()`.

### Implementação

**Arquivo:** `src/scenes/GameScene.ts`

Localizar em `_handleItemCollect()` o bloco do checkpoint. Provavelmente se parece com:
```typescript
case 'checkpoint':
  // lógica de ativação do checkpoint
  break
```

Adicionar chamada ao `_fx.scorePopupBounce()` dentro do case, antes do `break`:
```typescript
this._fx.scorePopupBounce('✅ checkpoint!', item.x, item.y - 32, '#00ffcc')
```

> **Nota:** `item` é o objeto coletável com propriedades `x` e `y`. Verificar o nome do parâmetro/variável exata no método `_handleItemCollect()`.

---

## Ordem de Implementação

```
Task 1: Player.ts — blink de invencibilidade (Parte A)
Task 2: GameScene.ts — aura de power-up (Parte B)
Task 3: LevelCompleteScene.ts — score count animado (Parte C)
Task 4: GameOverScene.ts — score count animado (Parte D)
Task 5: GameScene.ts — checkpoint texto flutuante (Parte E)
Task 6: Build final + testes passando
```

## Testes

Nenhuma das melhorias requer novos testes unitários (todas envolvem Phaser tweens/graphics que não podem ser testados com vitest sem mocks pesados). A verificação é feita pelo build TypeScript sem erros e inspeção visual no jogo.
