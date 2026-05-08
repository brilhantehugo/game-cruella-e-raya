# Spec F — Completude do Jogo

**Data:** 2026-05-08
**Status:** Aprovado

**Goal:** Tornar o jogo completo como produto final para círculo pessoal e portfólio, atacando os quatro gaps identificados na análise comparativa com DKC, NSMB e Kirby's Adventure.

**Architecture:** Quatro blocos independentes. Blocos A e B são mudanças cirúrgicas em arquivos existentes. Bloco C é reposicionamento de dados em level files + efeito visual em GameScene. Bloco D é uma entrada condicional na galeria existente. Sem novos arquivos de produção além de um arquivo de testes.

**Tech Stack:** TypeScript, Phaser 3, Vitest

---

## Referências Históricas

| Jogo | Relevância | O que este spec aprende |
|------|-----------|------------------------|
| DKC (SNES, 1994) | 2 personagens com swap, mundos temáticos, bosses | Diferenciação de personagens por habilidade |
| NSMB Wii (2009) | Controles de plataforma modernos | Coyote time, jump buffer, variable jump |
| Kirby's Adventure (NES, 1993) | Acessibilidade, comunicação de habilidades | Indicador visual de habilidade ativa |

---

## Bloco A — Controles: Coyote Time, Jump Buffer, Variable Jump

### Problema

Sem essas três técnicas, plataformas apertadas frustram o jogador sem que ele entenda o motivo. São invisíveis quando presentes, dolorosas quando ausentes.

### Solução

**Coyote time** — `Raya.ts` e `Cruella.ts`:

Quando o personagem sai de uma plataforma sem pular (cai), mantém a capacidade de pular por 80ms. Implementado com timestamp `_coyoteUntil`:

```typescript
// em Raya.ts / Cruella.ts
private _coyoteUntil: number = 0

// no update(), onde já existe onGround:
if (onGround) {
  this.jumpsLeft = 2              // (Raya) ou 1 (Cruella)
  this._coyoteUntil = this.scene.time.now + 80
}

// na condição de pulo:
const canJump = this.jumpsLeft > 0 || this.scene.time.now < this._coyoteUntil
if (Phaser.Input.Keyboard.JustDown(cursors.space) && canJump) {
  // se usou coyote (estava no ar), não desconta jumpsLeft extra
  if (!onGround) this._coyoteUntil = 0
  // ... lógica de pulo existente
}
```

> Raya tem 2 pulos (jumpsLeft: 2) — o coyote usa o primeiro sem consumir o double jump.
> Cruella tem 1 pulo (jumpsLeft: 1) — o coyote funciona como seu único pulo de emergência.

**Jump buffer** — `Raya.ts` e `Cruella.ts`:

Pressionar espaço até 100ms antes de pousar registra o pulo, que dispara ao tocar o chão.

```typescript
private _jumpBufferUntil: number = 0

// no update(), ao detectar pressionamento de espaço:
if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
  this._jumpBufferUntil = this.scene.time.now + 100
}

// ao pousar (onGround && !wasGrounded):
if (this.scene.time.now < this._jumpBufferUntil) {
  this._jumpBufferUntil = 0
  // dispara pulo imediatamente
  this.setVelocityY(jumpVel)
  this.jumpsLeft--
}
```

**Variable jump height** — `Raya.ts` e `Cruella.ts`:

Soltar espaço enquanto sobe corta a velocidade vertical para 40% do valor atual, uma única vez por pulo. Cria pulos curtos (tap) ou altos (hold) sem lógica por frame.

```typescript
private _jumpCut: boolean = false

// ao pular (onde já existe setVelocityY):
this._jumpCut = false

// no update(), durante fase ascendente:
const vy = (this.body as Phaser.Physics.Arcade.Body).velocity.y
if (!onGround && vy < 0 && !this.cursors.space.isDown && !this._jumpCut) {
  this._jumpCut = true
  ;(this.body as Phaser.Physics.Arcade.Body).setVelocityY(vy * 0.4)
}
```

> O flag `_jumpCut` garante que o corte acontece uma única vez por pulo — sem interferência com a gravidade normal na descida.

### Arquivos modificados
- `src/entities/Raya.ts` — coyote time, jump buffer, variable jump
- `src/entities/Cruella.ts` — coyote time, jump buffer, variable jump (sem double jump)

### Comportamento esperado
- Cair de uma plataforma e pular imediatamente ainda funciona (até 80ms)
- Pressionar espaço no último frame antes de pousar registra o pulo
- Tap no espaço = pulo baixo; hold = pulo máximo (útil para plataformas altas)

---

## Bloco B — HUD + Heart Pickup

### B1 — Indicador visual de cooldown na UIScene

**Problema:** o jogador não sabe quando a habilidade (dash/bark) está disponível novamente. `gameState.abilityUsedAt` e `gameState.abilityCooldownMs` já existem — apenas falta exibir.

**Solução:** Em `UIScene.ts`, adicionar um indicador de cooldown abaixo do ícone da cachorra ativa. Ícone cinza que se ilumina (branco/colorido) quando o cooldown termina.

```typescript
// create(): criar gráfico de cooldown
this._cooldownBar = this.add.graphics()

// update(): calcular progresso e desenhar arco
const elapsed = now - gameState.abilityUsedAt
const progress = Math.min(elapsed / gameState.abilityCooldownMs, 1)
this._cooldownBar.clear()
if (progress < 1) {
  this._cooldownBar.lineStyle(3, 0xaaaaaa, 0.7)
  this._cooldownBar.beginPath()
  this._cooldownBar.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2, false)
  this._cooldownBar.strokePath()
}
```

### B2 — Heart Pickup

**Problema:** não há forma de recuperar vida durante uma fase além de ter o laço equipado.

**Solução:**

- Novo sprite key: `heart` (já existe em KEYS.HEART)
- Novo tipo de item `'heart'` em `items/` tratado em `GameScene._handleItemCollect()`
- Restrição: só spawna se `gameState.hearts < gameState.maxHearts` no momento da coleta (sempre visível, mas só funciona se não estiver com vida cheia — ou spawnar apenas em posições estratégicas dos level data)
- Efeito: `gameState.restoreHeart()` + popup `+❤️` + som `heart` (já existe em SoundManager)

**Spawn:** adicionar 1 heart em cada fase de boss e nas fases mais longas (1-3, 2-2, 3-3) como item fixo no level data, em posição visível mas que requer desvio do caminho principal.

### Arquivos modificados
- `src/scenes/UIScene.ts` — campo `_cooldownBar`, lógica de update
- `src/scenes/GameScene.ts` — case `'heart'` em `_handleItemCollect()`
- `src/levels/World0.ts`, `World1.ts`, `World2.ts`, `World3.ts` — adicionar heart nos níveis selecionados

---

## Bloco C — Diferenciação de Personagens

### C1 — Seções estratégicas de swap

**Problema:** trocar de personagem é sempre opcional. Em DKC, há seções onde Diddy é claramente superior (plataformas pequenas) e onde DK é necessário (barris de força). Aqui, Raya domina todas as situações.

**Solução:** Reposicionar 2 golden bones por mundo (sem criar novos) em posições que favorecem claramente uma habilidade específica:

| Mundo | Fase | Bone atual | Coordenada nova | Por que favorece |
|-------|------|-----------|----------------|-----------------|
| World 1 | 1-2 | `{ x: 2100, y: 80 }` | `{ x: 2100, y: 48 }` — topo de plataforma acessível só com dash | Raya dash sobe; Cruella single jump não alcança y:48 |
| World 2 | 2-2 | `{ x: 1344, y: 96 }` | `{ x: 1344, y: 96 }` (manter x/y) — adicionar 3 inimigos agrupados em x:1200–1350 no level data | Cruella bark stuna todos de uma vez; Raya teria que desviar um a um |
| World 3 | 3-1 | `{ x: 2040, y: 190 }` | `{ x: 2350, y: 190 }` — além do raio de visão padrão (playerAuraRadius: 130) | Cruella bark ilumina área brevemente; Raya dash avança às cegas |

> **Nota sobre 2-2:** o bone permanece na mesma posição, mas o que muda é a adição de 3 inimigos (`rato`, `rato`, `gato`) em x:1200, x:1270, x:1320 no array `enemies` do level data — criando um bloqueio que favorece o latido em área.

Implementação: mudanças de coordenadas e adição de inimigos nos level data — zero código novo.

### C2 — Indicador visual do raio de latido de Cruella

**Problema:** `checkIntimidation()` existe e funciona (inimigos recuam em `BARK_RADIUS * 1.5 = 180px`), mas o jogador não tem como saber disso. A habilidade passiva é invisível.

**Solução:** Em `GameScene.ts`, ao receber evento `'bark'` de Cruella, exibir um círculo de raio 180px que aparece e desaparece em 400ms:

```typescript
// já existe listener de bark em GameScene (via this._fx)
// adicionar:
this.cruella.on('bark', (x: number, y: number) => {
  const gfx = this.add.graphics()
  gfx.lineStyle(2, 0xffffff, 0.6)
  gfx.strokeCircle(x, y, PHYSICS.BARK_RADIUS * 1.5)
  this.tweens.add({
    targets: gfx,
    alpha: 0,
    duration: 400,
    onComplete: () => gfx.destroy(),
  })
})
```

### Arquivos modificados
- `src/levels/World1.ts`, `World2.ts`, `World3.ts` — reposicionar 3 golden bones
- `src/scenes/GameScene.ts` — listener de bark com círculo visual

---

## Bloco D — Fechamento do Meta-loop (100% Completion)

### Problema

Coletar todos os golden bones de um mundo não tem recompensa além de ver o status na galeria. O loop de colecionável não fecha — não há o momento "você completou o World 1 a 100%!".

### Solução

Ao terminar uma fase e `gameState.goldenBones[worldId]` indicar que todos os bones daquele mundo foram coletados, `LevelCompleteScene` exibe um badge especial "🏆 World X — Completo!" e desbloqueia uma nova entrada na galeria com a arte de grupo das protagonistas daquele mundo.

**Condição de unlock por mundo:**

```typescript
// em LevelCompleteScene.ts
const worldId = gameState.currentLevel.split('-')[0]  // '1', '2', etc.
const worldLevels = Object.keys(MEDAL_THRESHOLDS).filter(k => k.startsWith(worldId + '-'))
const allGolden = worldLevels.every(lvl =>
  gameState.goldenBones[lvl]?.every(Boolean) ?? false
)
if (allGolden) {
  // exibir badge + salvar unlock na galeria
}
```

**Galeria:** adicionar entrada `world-complete-${worldId}` no sistema existente de galeria. A arte pode ser o sprite group existente ou um placeholder até ter arte final.

### Arquivos modificados
- `src/scenes/LevelCompleteScene.ts` — lógica de detecção de 100% por mundo + badge
- `src/scenes/GalleryScene.ts` — entradas `world-complete-X` como desbloqueáveis

---

## Fora do Escopo (Specs Futuras)

| Item | Motivo do adiamento |
|------|-------------------|
| Plataformas móveis | Novo sistema physics — merece spec e plan próprios |
| BGM por mundo | Depende de assets de áudio externos |
| Tutorial in-game | Pode ser feito com HowToPlay já existente; baixa urgência |

---

## Ordem de Implementação

```
Bloco A: Controles (Raya.ts + Cruella.ts) — fundação, impacto imediato
Bloco B: HUD cooldown + Heart pickup — QoL, visible polish
Bloco C: Diferenciação de personagens — data + um listener
Bloco D: Meta-loop 100% — fecha o arco de colecionável
```
