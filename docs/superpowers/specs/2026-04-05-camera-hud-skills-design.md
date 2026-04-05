# Câmera + HUD + Habilidades — Design Spec

**Data:** 2026-04-05
**Status:** Aprovado
**Escopo:** Spec 1 de 2 (Spec 2 = Progressão e Mapa de Mundo, sessão futura)

---

## Visão Geral

Três blocos de melhoria implementados em sequência, baseados na auditoria comparativa com Mario Bros e outros jogos de plataforma. O objetivo é aumentar o **game feel** (câmera e feedback visual) e a **profundidade mecânica** (habilidades + combo).

Abordagem: **um plano único, blocos em sequência** — Câmera → HUD/Feedback → Habilidades. Cada bloco é entregue e testável antes do próximo.

---

## Bloco 1 — Sistema de Câmera

### Dead Zone
A câmera só se move quando o player sai de uma zona central de **±80px horizontal** e **±40px vertical**. Dentro dessa zona, a câmera permanece estática — dando sensação de peso e controle ao movimento. Usa `camera.setDeadzone(160, 80)`, nativo do Phaser.

### Lookahead
Quando o player se move, a câmera se adianta **+80px** na direção do deslocamento ao longo de ~0.5s com interpolação suave (lerp). Revela mais do cenário à frente, como em Super Mario World.

Implementação: variável de estado `_camOffsetX` em `GameScene`, interpolada a cada frame:
```typescript
const targetX = player.flipX ? -80 : 80
_camOffsetX = Phaser.Math.Linear(_camOffsetX, targetX, 0.05)
camera.setFollowOffset(-_camOffsetX, 0)
```

### Boss Intro Cinemática + Arena Lock
Ao entrar no boss level (`isBossLevel === true`), executa sequência de 2s antes de liberar o controle:

| Tempo | Ação |
|-------|------|
| 0–0.5s | Câmera para de seguir o player. Pan suave revelando a arena (zoom out leve 0.85x). |
| 0.5–1.5s | Pan até Seu Bigodes. Camera shake leve (intensidade 0.003). |
| 1.5–2s | Câmera retorna ao player com lerp. Controle liberado. |

Durante a intro: `_cinematicActive = true` bloqueia input do player.
Após a intro: `camera.setBounds()` trava a câmera dentro dos limites da arena.

**Arquivos modificados:** `GameScene.ts`
**Risco:** baixo — tudo isolado no sistema de câmera do Phaser.

---

## Bloco 2 — HUD e Feedback Visual

### Score Popups Flutuantes
Ao coletar qualquer item ou matar inimigo, um texto voa +48px para cima em 0.8s e desaparece (alpha → 0). Cor e tamanho variam por evento:

| Evento | Texto | Cor |
|--------|-------|-----|
| Osso | +10 | branco |
| Osso dourado | +500 | `#ffd700` (dourado) |
| Inimigo morto | +50 | `#f97316` (laranja) |
| Boss morto | +1000 | `#22c55e` (verde) |
| Power-up coletado | ✨ | ciano |

Helper reutilizável em `GameScene`:
```typescript
_spawnScorePopup(x: number, y: number, text: string, color: string): void {
  const t = this.add.text(x, y, text, { fontSize: '16px', color })
  this.tweens.add({ targets: t, y: y - 48, alpha: 0, duration: 800,
    onComplete: () => t.destroy() })
}
```

### Timer de Fase
Contagem regressiva adicionada ao `LevelData` como `timeLimit: number` (segundos). Boss level usa `timeLimit: 0` (sem limite).

- **Padrão:** 200 segundos por fase
- **Abaixo de 30s:** texto fica laranja
- **Abaixo de 10s:** pisca vermelho
- **Ao zerar:** `gameState.hearts = 0` (morte por tempo)

Timer vive em `UIScene.ts`. Estado do timer (`_timeRemaining`, `_timerActive`) fica em `UIScene` — não precisa entrar no `GameState`. Reset ao iniciar nova fase via evento `'start-timer'` emitido por `GameScene`.

### Barra Visual de Power-up
Substitui a linha de texto atual (`"🍖 Turbo 7s"`) por **ícone + barra que esgota**:
- Barra usa `setDisplaySize(width * fraction, h)` a cada frame
- Mesmo padrão da barra de swap cooldown já existente em `UIScene`
- Cores: gradiente ciano → azul quando carregado, vermelho quando abaixo de 2s

### Flash de Dano na Tela
Ao tomar dano: retângulo vermelho semitransparente cobre toda a tela e desaparece em 400ms.
- Implementado como `Rectangle` fixo no `UIScene` com alpha 0
- UIScene detecta mudança em `gameState.lastHitAt` e dispara tween: alpha 0.35 → 0 em 400ms

### Hit Stop (game feel)
Ao confirmar um stomp kill em inimigo: `physics.pause()` por **80ms**, depois `physics.resume()`.
```typescript
this.physics.pause()
this.time.delayedCall(80, () => this.physics.resume())
```
Não afeta `UIScene` (scroll factor 0) nem áudio.

**Arquivos modificados:** `GameScene.ts`, `UIScene.ts`, `GameState.ts` (nenhum campo novo), `LevelData.ts` (campo `timeLimit`)
**Risco:** médio-baixo — `UIScene` e `GameScene` têm interface bem definida via eventos.

---

## Bloco 3 — Sistema de Habilidades

### Cooldown Visual da Habilidade Especial
Ícone com **arco conic-gradient** no HUD indica disponibilidade do Shift:
- **Arco roxo preenchendo:** habilidade em cooldown
- **Arco verde completo:** habilidade pronta
- Ícone muda conforme cachorra ativa: ⚡ (Raya/dash) ou 🔊 (Cruella/latido)
- Implementado em `UIScene.ts` com `Graphics` e `setMask` ou Canvas 2D arc

### Dash de Raya Causa Dano
Durante o dash (`isDashing === true`), overlap adicional em `GameScene` detecta colisão com inimigos:
- Inimigo perde 1 HP (chama `enemy.takeDamage(1)`)
- Raya **não** perde vida na colisão
- Popup `+50` laranja aparece na posição do inimigo
- `getIsDashing()` já existe em `Raya.ts` — sem mudança no contrato da entidade

```typescript
// GameScene — overlap separado do contato de dano normal
this.physics.add.overlap(raya, enemyGroup, (r, e) => {
  if ((r as Raya).getIsDashing()) {
    (e as Enemy).takeDamage(1)
    this._spawnScorePopup(e.x, e.y - 20, '+50', '#f97316')
  }
})
```

### Bark de Cruella Stuna Inimigos
O latido continua fazendo inimigos fugirem (comportamento atual preservado), mas **também stuna por 500ms** qualquer inimigo dentro do raio:
- Inimigo recebe tint amarelo (`0xffff44`) durante o stun
- Tint é removido após 500ms
- `stun(duration)` já existe em `Enemy.ts`

```typescript
// Cruella.ts — bark()
enemies.forEach(e => {
  if (dist <= BARK_RADIUS) {
    e.stun(500)
    e.setTint(0xffff44)
    scene.time.delayedCall(500, () => e.clearTint())
  }
})
```

### Combo Sinergético: Dash → Swap → Impulso
A mecânica original do jogo. Fluxo:

1. **Raya usa Dash** (Shift) → inicia janela de combo de **600ms**
2. **Jogador pressiona TAB** (swap) dentro da janela
3. **Cruella entra com impulso:** recebe `setVelocityX(dir * 440)` por 400ms
4. **VFX:** pulse de escala (1x → 1.2x → 1x em 300ms) + SFX especial (`'swap'` já existente)

Estado do combo: variáveis locais `_dashComboWindowUntil: number` e `_lastDashDir: number` em `Player.ts`. **Não entram no `GameState`.**

Raya emite evento `'dashed'` com `{ dir, time }` após cada dash. `Player.ts` escuta esse evento em `create()` e armazena os valores localmente — sem necessidade de getter público em Raya.

```typescript
// Player.ts — _performSwap() já existente
private _dashComboWindowUntil = 0
private _lastDashDir = 1

// Registrado em Player.create() após instanciar Raya:
raya.on('dashed', ({ dir, time }: { dir: number; time: number }) => {
  this._dashComboWindowUntil = time + 600
  this._lastDashDir = dir
})

// Dentro de _performSwap():
if (this.scene.time.now < this._dashComboWindowUntil) {
  this._activateDashCombo()
}

private _activateDashCombo(): void {
  const cruella = this._getCruella()
  cruella.setVelocityX(this._lastDashDir * 440)
  this.scene.tweens.add({ targets: cruella, scaleX: 1.2, scaleY: 1.2,
    duration: 150, yoyo: true })
  SoundManager.play('swap')  // reutiliza SFX existente
  this.scene.time.delayedCall(400, () => {
    // velocidade extra some gradualmente (física já desacelera naturalmente)
  })
}
```

**Arquivos modificados:** `Raya.ts` (emite evento `'dashed'` após dash), `Cruella.ts` (bark stun), `Player.ts` (combo window via evento), `GameScene.ts` (overlap do dash), `UIScene.ts` (cooldown visual)
**Não toca:** `GameState.ts`, `SoundManager.ts`, `LevelData.ts`, `Enemy.ts` (estrutura)

---

## Ordem de Implementação

```
Bloco 1: Câmera        → GameScene.ts apenas              (menor risco)
Bloco 2: HUD/Feedback  → GameScene + UIScene + LevelData  (médio)
Bloco 3: Habilidades   → Raya + Cruella + Player + GameScene + UIScene (maior interdependência)
```

## Testes Esperados

- **Câmera:** dead zone perceptível ao andar, lookahead revela plataformas à frente, intro do boss executa sem travar input depois
- **HUD:** popup aparece ao coletar cada tipo de item, timer mostra alerta visual abaixo de 30s/10s, flash vermelho visível ao tomar dano, hit stop perceptível no stomp
- **Habilidades:** dash de Raya mata/danifica inimigo ao colidir, bark stuna com tint amarelo, combo ativa apenas na janela de 600ms e dá velocidade visível à Cruella
