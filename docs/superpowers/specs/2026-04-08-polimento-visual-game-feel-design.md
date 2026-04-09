# Design: Polimento Visual & Game Feel

**Data:** 2026-04-08
**Status:** Aprovado
**Abordagem escolhida:** B — EffectsManager centralizado + 7 correções visuais catalogadas

## Resumo

Duas frentes combinadas numa única entrega: (1) sete correções visuais já catalogadas em sessões anteriores, e (2) um sistema de efeitos de game feel de nível médio/arcade, encapsulado numa nova classe `EffectsManager`. A intensidade escolhida é "Médio — Arcade expressivo": ghost trail no dash, poeira no pulo/aterrissagem, bursts de partículas em mortes e coletas, flash dourado no golden bone, sparkle no checkpoint, e burst no power-up.

---

## 1. Arquitetura

### Nova classe: `src/fx/EffectsManager.ts`

Responsabilidade única: produzir efeitos visuais de gameplay via `Graphics` + tweens do Phaser. Sem dependência de textura externa — segue o padrão já estabelecido pelo confetti do `LevelCompleteScene` e pelas ondas do bark.

```typescript
export class EffectsManager {
  constructor(private scene: Phaser.Scene) {}
  // 9 métodos públicos listados abaixo
}
```

GameScene instancia e mantém `private _fx: EffectsManager`.

**Princípio de destruição:** cada método cria um `Graphics` local, aplica tween e chama `destroy()` no `onComplete`. Sem pooling — os efeitos duram <500ms e o volume é baixo.

---

## 2. API do EffectsManager — 9 métodos

| Método | Parâmetros | Efeito | Duração |
|---|---|---|---|
| `dustPuff(x, y, size?)` | posição dos pés; `size: 'small'│'large'` | 5–6 círculos cinza/bege, burst radial de 30–50px, fade | 300ms |
| `ghostTrail(sprite)` | sprite da Raya | Cópia do sprite em alpha 0.4, desvanece para 0 | 150ms |
| `enemyDeathBurst(x, y)` | posição do inimigo | 6 partículas laranja/amarelas radiais | 250ms |
| `boneSpark(x, y)` | posição do bone | 4 partículas amarelas pequenas | 200ms |
| `goldenBoneBurst(x, y)` | posição do golden bone | 8 partículas douradas + `cameras.flash(80, 255, 215, 0)` | 300ms |
| `scorePopupBounce(text, x, y, color)` | texto, posição, cor | Texto com scale 0.5→1.2→1.0 em 120ms, depois sobe e some | 800ms |
| `checkpointSparkle(x, y)` | posição do checkpoint | 8 partículas brancas em arco ao redor, fade | 500ms |
| `powerUpBurst(x, y, type)` | posição do player, tipo do power-up | 10 partículas na cor do tipo: churrasco=`#ff4400`, pipoca=`#ffff00`, petisco=`#ff8800`, outros=`#00ccff` | 350ms |
| `barkImpact(x, y)` | posição do inimigo stunado | 4 partículas ciano pequenas | 200ms |

---

## 3. Pontos de Integração no GameScene

| Momento | Código novo |
|---|---|
| **Ghost trail** | Em `update()`: `if (this.player.raya.getIsDashing()) this._fx.ghostTrail(this.player.raya)` a cada 80ms (throttle via `_lastTrailAt`) |
| **Dust no pulo** | `Raya.ts` emite evento `'jumped'`; GameScene: `this._fx.dustPuff(raya.x, raya.body.bottom, 'small')` |
| **Dust na aterrissagem** | `Raya.ts` emite evento `'landed'`; GameScene: `this._fx.dustPuff(raya.x, raya.body.bottom, 'large')` |
| **Morte de inimigo** | No handler do evento `'died'`: `this._fx.enemyDeathBurst(e.x, e.y)` |
| **Bone regular** | Overlap handler: substitui `add.text('+10')` por `fx.scorePopupBounce('+10', x, y, '#ffff00')` + `fx.boneSpark(x, y)` |
| **Golden bone** | Overlap handler: `fx.goldenBoneBurst(x, y)` + `fx.scorePopupBounce('+500', x, y, '#ffd700')` |
| **Bark impact** | Loop de stun no evento `'bark'`: para cada inimigo stunado, `fx.barkImpact(e.x, e.y)` |
| **Checkpoint** | Handler de checkpoint: `fx.checkpointSparkle(cp.x, cp.y)` |
| **Power-up coletado** | Overlap handler de power-ups: `fx.powerUpBurst(player.x, player.y, type)` |
| **Score popups de kill** | Handler do `'died'` com score: substitui `add.text('+50')` por `fx.scorePopupBounce('+50', x, y, '#f97316')` |

---

## 4. Modificações em `Raya.ts`

Adicionar emissão de dois eventos no método `update()`:

```typescript
// Detecta pulo (velocidade Y negativa e estava no chão no frame anterior)
if (Phaser.Input.Keyboard.JustDown(this.cursors.space) && this.jumpsLeft > 0) {
  // ...código de pulo existente...
  this.emit('jumped', { x: this.x, y: this.body.bottom })
}

// Detecta aterrissagem
if (onGround && !this.wasGrounded) {
  this.emit('landed', { x: this.x, y: this.body.bottom })
}
```

---

## 5. Correções Visuais (7 fixes)

### Fix 1 — Intro do boss Aspirador
**Arquivo:** `GameScene.ts` (método de intro do boss 0-boss)
**Mudança:** Adicionar header `"💨 ASPIRADOR 3000"` acima do diálogo existente. Estender duração total para 3s. Aplicar fade-in de 300ms no início e fade-out de 400ms antes de liberar o controle.

### Fix 2 — Background `bg_rua_3` com carro flutuando
**Arquivo:** `GameScene.ts` ou `BootScene.ts` (onde o parallax da fase 1-x é configurado)
**Mudança:** Identificar a camada de parallax que renderiza o elemento de carro no mid-screen do `bg_rua_3` e ajustar o `y` para próximo ao chão (y ≈ 380–400) ou, se for elemento separado, removê-lo. Fundo de casas e árvores: reduzir alpha para 0.7 para criar separação visual fundo/frente.

### Fix 3 — Estante na cozinha boss
**Arquivo:** `src/levels/World0.ts`, fase `0-boss` (linha ~60)
**Mudança:** Substituir `{ type: 'estante', x: 800, y: G, blocking: true }` por `{ type: 'balcao', x: 800, y: G, blocking: true }`. Mantém o obstáculo, corrige o contexto de cozinha.

### Fix 4 — Scale de Hugo/Hannah no estacionamento
**Arquivo:** `src/entities/npc/Hugo.ts` e `src/entities/npc/Hannah.ts`
**Mudança:** `this.setScale(2)` → `this.setScale(1.6)` nos construtores.
**Nota:** Isso afeta todas as instâncias. Se o scale 2.0 for intencional em outras fases, criar parâmetro opcional no construtor: `constructor(scene, x, y, scale = 1.6)`.

### Fix 5 — Nome da fase no HUD
**Status:** Já implementado. `UIScene` escuta o evento `'level-name'` (linhas 64–85) e `GameScene` emite na linha 96. Verificar apenas se o evento está chegando corretamente; nenhuma mudança de código esperada — só confirmação em teste manual.

### Fix 6 & 7 — Decorações da fase 1-1 (variedade + distribuição)
**Arquivo:** `src/levels/World1.ts`, decorations de `LEVEL_1_1`
**Situação atual:** 9 decorações de x=180 a x=2300, gaps de ~250–300px entre itens.
**Mudança:** Adicionar 2 novos tipos para variedade visual — `banco` (banco de praça) e `banca` (banca de jornal/flores) — nos gaps maiores. Resultado: 11 itens com distribuição mais orgânica e menos repetição de `loja`/`poste`:

```typescript
decorations: [
  { type: 'loja',   x: 180,  y: G },
  { type: 'poste',  x: 420,  y: G },
  { type: 'banco',  x: 620,  y: G },   // novo
  { type: 'arvore', x: 850,  y: G },
  { type: 'casa',   x: 1100, y: G },
  { type: 'lixeira',x: 1300, y: G },
  { type: 'banca',  x: 1500, y: G },   // novo
  { type: 'loja',   x: 1720, y: G },
  { type: 'arvore', x: 1950, y: G },
  { type: 'poste',  x: 2150, y: G },
  { type: 'lixeira',x: 2350, y: G },
],
```

**Dependência:** Confirmar que os sprites `banco` e `banca` existem no atlas do jogo antes de implementar. Se não existirem, substituir por tipos já existentes (`petshop`, `placa`) ou omitir o fix 6–7 até os assets estarem disponíveis.

---

## 6. Mapa de Arquivos

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/fx/EffectsManager.ts` | **Criar** | Classe com 9 métodos de efeito visual |
| `src/scenes/GameScene.ts` | **Modificar** | Instanciar EffectsManager, wiring dos 10 pontos de integração, fix intro Aspirador, ghost trail throttle |
| `src/entities/Raya.ts` | **Modificar** | Emitir eventos `'jumped'` e `'landed'` |
| `src/levels/World0.ts` | **Modificar** | Fix ESTANTE→BALCAO (fix 3) |
| `src/entities/npc/Hugo.ts` | **Modificar** | Scale 2.0→1.6 (fix 4) |
| `src/entities/npc/Hannah.ts` | **Modificar** | Scale 2.0→1.6 (fix 4) |
| `src/levels/World1.ts` | **Modificar** | Redistribuir decorações 1-1 (fix 6–7, condicional a assets) |
| `GameScene.ts` (parallax) | **Verificar/Modificar** | Fix carro bg_rua_3 (fix 2) |

---

## 7. Testes

Não há lógica de negócio nova — `EffectsManager` é puramente visual. Testes são manuais:

1. Dash da Raya → ghost trail visível por ~150ms
2. Pulo → poeira pequena nos pés ao sair do chão
3. Aterrissagem → poeira maior ao tocar o chão
4. Matar inimigo → burst laranja/amarelo + popup com bounce
5. Coletar bone → sparkle amarelo + popup com bounce
6. Coletar golden bone → burst dourado + flash de câmera
7. Bark da Cruella → mini-burst ciano em cada inimigo stunado
8. Checkpoint → sparkle branco em arco
9. Coletar power-up → burst colorido saindo do player
10. Boss Aspirador → header + 3s de fala com fade
11. Fase 1-1 → decorações com `banco`/`banca` (se assets existirem)
12. UIScene → nome da fase aparece no início de cada nível

---

## 8. Estimativa

| Tarefa | Complexidade |
|---|---|
| EffectsManager (9 métodos) | Média |
| Wiring no GameScene (10 pontos) | Média |
| Raya eventos jumped/landed | Baixa |
| 7 visual fixes | Baixa–Média |
| **Total estimado** | **2 sessões de implementação** |
