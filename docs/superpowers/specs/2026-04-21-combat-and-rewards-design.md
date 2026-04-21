# Spec III — Sistema de Combate Direto + Loop de Recompensa (Golden Bones)

**Data:** 2026-04-21
**Área:** Gameplay / Combat / Progression
**Estado:** Aprovado

---

## 1. Visão Geral

Duas melhorias coesas que se reforçam mutuamente:

1. **Combate direto:** Bark da Cruella ganha poder ofensivo (mata inimigos fracos, stuna os fortes). Feedback visual de HP nos inimigos com mais de 1 HP (barra animada).
2. **Loop de recompensa:** Golden bones coletados nas fases podem ser gastos num painel de upgrades permanentes acessível pelo WorldMapScene.

**Princípio:** mudanças cirúrgicas. Nenhum sistema existente é reescrito.

---

## 2. Sistema de Combate

### 2.1 Bark da Cruella — nova lógica

**Arquivo:** `src/scenes/GameScene.ts` (handler do evento `'bark'`, linha ~757)

**Comportamento atual (animais):** todos os animais no raio recebem `stun(2000)` + popup "STUN!".

**Comportamento novo:**
```
Para cada animal no BARK_RADIUS:
  se e.hp <= 1:
    e.takeDamage(999)          → morte instantânea
    _fx.enemyDeathBurst(e.x, e.y)
    _spawnScorePopup(…, 'KO! +100', '#22ccff')
    addScore(100)
  senão:
    e.stun(2000)               → comportamento atual
    _fx.barkImpact(e.x, e.y)
    _spawnScorePopup(…, 'STUN!', '#ffdd00')
```

**Humanos:** sem mudança — continuam reagindo via `onBarkHeard()`.

**Counter mechanic:** inalterada — `tryCounter` executa antes da verificação de HP (se countered → burst imediato, independente de HP).

### 2.2 Dash da Raya — sem mudança de dano

O dash já chama `e.takeDamage(1)` e já mata inimigos com 1 HP. Nenhuma mudança de lógica. A simetria com o bark existe implicitamente.

### 2.3 HP Bar — feedback visual

**Arquivo novo:** `src/fx/EnemyHPBar.ts`

```typescript
export class EnemyHPBar {
  private bar: Phaser.GameObjects.Graphics
  private scene: Phaser.Scene
  private fadeTimer: Phaser.Time.TimerEvent | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.bar = scene.add.graphics().setDepth(20)
  }

  show(enemy: Enemy): void {
    // Cancela fade anterior se existir
    this.fadeTimer?.remove()
    this.bar.clear()
    this.bar.setAlpha(1)

    const W = 20, H = 3
    const x = enemy.x - W / 2
    const y = enemy.y - enemy.displayHeight / 2 - 6

    // Fundo cinza
    this.bar.fillStyle(0x333333)
    this.bar.fillRect(x, y, W, H)

    // Barra de HP proporcional
    const ratio = Math.max(0, enemy.hp / enemy.maxHp)
    this.bar.fillStyle(ratio > 0.5 ? 0x44dd44 : ratio > 0.25 ? 0xffaa00 : 0xff3333)
    this.bar.fillRect(x, y, W * ratio, H)

    // Fade após 2500ms
    this.fadeTimer = this.scene.time.delayedCall(2500, () => {
      this.scene.tweens.add({
        targets: this.bar,
        alpha: 0,
        duration: 300,
        onComplete: () => this.bar.clear(),
      })
    })
  }

  destroy(): void {
    this.fadeTimer?.remove()
    this.bar.destroy()
  }
}
```

**Integração em GameScene:** instância criada no `create()`. Chamada no handler de dash:
```typescript
// Dentro do overlap de dash, após e.takeDamage(1):
if (e.active) this._enemyHPBar.show(e)
```

**Requisito em Enemy.ts:** `maxHp` deve ser exposto como propriedade pública (atualmente só `hp` é público). Adicionar `readonly maxHp: number` inicializado no construtor.

### 2.4 Popup KO no dash

Quando o dash mata um inimigo com 1 HP (o inimigo morre após `takeDamage(1)`), substituir o popup "+50" por "KO! +100" e aumentar score para 100. Verificação: `if (e.active)` após `takeDamage` — se `!e.active` (morreu), é KO.

```typescript
e.takeDamage(1)
if (e.hp <= 0) {
  // Inimigo morreu
  this._spawnScorePopup(e.x, e.y - 20, 'KO! +100', '#f97316')
  gameState.addScore(100)
} else {
  this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
  this._enemyHPBar.show(e)
}
```

---

## 3. Loop de Recompensa

### 3.1 Upgrades disponíveis

| Key | Nome | Efeito | Custo (golden bones) |
|-----|------|--------|---------------------|
| `heart_plus` | ❤️ Coração Extra | HP máximo 3 → 4 | 8 |
| `dash_fast` | ⚡ Dash Relâmpago | Cooldown dash 800ms → 500ms | 6 |
| `bark_wide` | 🔊 Latido Amplo | `BARK_RADIUS` × 1.5 | 6 |
| `swap_fast` | 🔄 Troca Rápida | Cooldown swap 1500ms → 900ms | 5 |
| `bone_radar` | 🦴 Faro Apurado | Seta aponta golden bone mais próximo | 7 |

**Total máximo:** 32 bones (dos 64 disponíveis no jogo). Deixa metade como margem de coleta.

### 3.2 Storage — PlayerProfile

**Arquivo:** `src/storage/ProfileManager.ts`

Adicionar ao `PlayerProfile`:
```typescript
upgrades: Record<string, boolean>  // ex: { heart_plus: true, dash_fast: false }
```

Mapa de custos (constante em `ProfileManager.ts`):
```typescript
const UPGRADE_COSTS: Record<string, number> = {
  heart_plus: 8, dash_fast: 6, bark_wide: 6, swap_fast: 5, bone_radar: 7,
}
```

Novos métodos em `ProfileManager`:
```typescript
saveUpgrade(key: string): void      // persiste profile.upgrades[key] = true
hasUpgrade(key: string): boolean    // retorna profile.upgrades?.[key] ?? false
getTotalGoldenBones(): number       // soma todos os goldenBones[i] === true no perfil
getSpentBones(): number             // soma UPGRADE_COSTS[key] para cada upgrade comprado
getAvailableBones(): number         // getTotalGoldenBones() - getSpentBones()
```

### 3.3 UI — Painel no WorldMapScene

**Arquivo:** `src/scenes/WorldMapScene.ts`

Botão `[🛒 Upgrades]` no canto inferior esquerdo (próximo ao texto de instruções). Ao clicar, abre um painel overlay (Container com Rectangle semitransparente + 5 cards de upgrade).

Cada card mostra:
- Ícone + nome do upgrade
- Efeito descrito em 1 linha
- Custo em bones 🦴
- Estado: `[COMPRAR]` / `[✓ ADQUIRIDO]` / `[🦴 Faltam X]`

Ao comprar: `profileManager.saveUpgrade(key)`, atualiza bones disponíveis, re-renderiza painel.

### 3.4 Aplicação dos upgrades em jogo

**Arquivo:** `src/scenes/GameScene.ts` (método `create()`, após instanciar o player)

```typescript
private _applyUpgrades(): void {
  const profile = profileManager.getActive()
  if (!profile) return

  if (profileManager.hasUpgrade('heart_plus'))  gameState.maxHearts = 4
  if (profileManager.hasUpgrade('dash_fast'))   PHYSICS.DASH_COOLDOWN = 500  // default: 800 (novo campo em constants.ts; Raya.ts usa PHYSICS.DASH_COOLDOWN em vez de literal 800)
  if (profileManager.hasUpgrade('bark_wide'))   PHYSICS.BARK_RADIUS = Math.round(PHYSICS.BARK_RADIUS * 1.5)
  if (profileManager.hasUpgrade('swap_fast'))   PHYSICS.SWAP_COOLDOWN = 900  // default: 1500
  if (profileManager.hasUpgrade('bone_radar'))  this._activateBoneRadar()
}
```

**Nota:** `PHYSICS` é um objeto importado de `constants.ts`. Os valores modificados só afetam a sessão atual (objeto mutável em memória). No início de cada fase, `_applyUpgrades()` re-aplica os valores base antes de aplicar upgrades, evitando stacking entre fases.

### 3.5 Faro Apurado (bone_radar)

`_activateBoneRadar()` cria um sprite de seta (`►`) que a cada 1000ms recalcula o golden bone não coletado mais próximo do player e aponta na direção com `Math.atan2`. Se todos os bones da fase foram coletados, seta desaparece.

---

## 4. Mudanças em Enemy.ts

- Adicionar `readonly maxHp: number` — inicializado no construtor como o valor inicial de `hp`
- `hp` continua público e mutável

```typescript
// Antes:
constructor(scene, x, y, texture, hp, speed) {
  this.hp = hp
  ...
}

// Depois:
readonly maxHp: number
constructor(scene, x, y, texture, hp, speed) {
  this.maxHp = hp
  this.hp = hp
  ...
}
```

---

## 5. Fora de Escopo

- Tiers de upgrades (compra única por upgrade)
- Loja de cosméticos (sprites alternativos)
- Multiplayer / co-op
- Leaderboard
- Modo de dificuldade
- Mudança no comportamento de bark contra humanos
