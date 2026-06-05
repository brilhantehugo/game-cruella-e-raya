# Spec G1 — Ícone de Osso no Placar do HUD

**Data:** 2026-06-05
**Status:** Aprovado

**Goal:** Substituir o texto `"Ossos: X"` do placar por um ícone de osso (🦴) seguido do número, alinhando o HUD ao tema do jogo.

---

## Contexto

O placar no HUD (`UIScene`) é texto puro `"Ossos: X"` no canto superior direito. Existe `KEYS.BONE` (sprite de osso, já usado em itens). Os corações já são imagens (`KEYS.HEART`). O placar destoa por ser só texto. O número exibido é `gameState.score` (misto — não contagem literal de ossos); mantemos como score, apenas tematizado com o ícone.

---

## Solução

Cluster `[🦴 número]` ancorado na borda direita, robusto a qualquer número de dígitos.

### `UIScene` — mudanças

**Campo novo:**
```typescript
private boneIcon!: Phaser.GameObjects.Image
```

**Em `create()`** — o `scoreText` atual:
```typescript
this.scoreText = this.add.text(GAME_WIDTH - 10, 10, 'Ossos: 0', {
  fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
}).setOrigin(1, 0).setScrollFactor(0)
```
passa a iniciar só com o número:
```typescript
this.scoreText = this.add.text(GAME_WIDTH - 10, 10, '0', {
  fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
}).setOrigin(1, 0).setScrollFactor(0)

this.boneIcon = this.add.image(0, 17, KEYS.BONE)
  .setScrollFactor(0).setScale(1.0).setOrigin(1, 0.5)
this._positionBoneIcon()
```

**Novo método auxiliar** (reposiciona o ícone à esquerda do número):
```typescript
private _positionBoneIcon(): void {
  this.boneIcon.x = this.scoreText.x - this.scoreText.width - 6
}
```

**No update** (onde hoje há `this.scoreText.setText(\`Ossos: ${gameState.score}\`)`):
```typescript
this.scoreText.setText(`${gameState.score}`)
this._positionBoneIcon()
```

O ícone usa `origin(1, 0.5)` (âncora à direita), posicionado em `scoreText.x - scoreText.width - 6`, ficando imediatamente à esquerda do número com gap de 6px. Como o `scoreText` é right-aligned na borda, o cluster nunca clipa, independentemente da largura do número.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/scenes/UIScene.ts` | Campo `boneIcon`, criação no `create()`, `_positionBoneIcon()`, update sem "Ossos:" |

---

## Estratégia de Teste

- `npm run build` sem erros.
- `npx vitest run` — 413 testes continuam passando (HUD é visual; sem nova lógica pura).
- Smoke visual: ícone de osso alinhado à esquerda do número, colado à borda direita.

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Contagem literal de ossos (separada do score) | Mudaria gameplay/scoring; o número segue sendo o score tematizado |
| Reposicionar outros elementos do HUD | Fora do escopo deste placar |
| Animação no ícone ao ganhar pontos | Polish adicional; spec separada se desejado |
