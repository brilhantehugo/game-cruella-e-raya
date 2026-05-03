# Game Polish — Gaps Técnicos e Visuais

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os principais gaps técnicos e visuais do jogo em 3 sprints: bugs de dinâmica, backgrounds Pixel Lab e normalização de decorações/escalas.

**Architecture:** Abordagem B (bugs primeiro, depois visual). Cada sprint é entregável e testável independentemente. Não há dependência entre Sprint 1 e Sprint 3; Sprint 2 deve preceder Sprint 3 pois os novos backgrounds servem de referência visual para ajustar decorações.

**Tech Stack:** Phaser 3, TypeScript, Pixel Lab MCP (sidescroller tileset), sharp (processamento de imagens), Vite

---

## Sprint 1 — Correções de Dinâmica (Bugs Críticos)

### 1.1 Spawn Y dos inimigos humanos

**Problema:** Inimigos humanos spawnam em `y: 390` mas o chão está em `y: 416`. Com `scale 1.4` e `bodyHeight 44px`, o fundo do corpo cai em `390 + (44 × 1.4 / 2) = 420.8px` — 4.8px abaixo do chão. A física empurra o personagem para baixo, causando queda fora da tela.

**Solução:** Ajustar todos os spawn Y de inimigos humanos nos LevelData. A fórmula correta:

```
spawnY = G - (bodyHeight × scale) / 2
spawnY = 416 - (44 × 1.4) / 2 = 416 - 30.8 ≈ 385
```

**Arquivos afetados:**
- `src/levels/World0.ts` — todos os `y: 390` de hugo, hannah, zelador, morador
- `src/levels/World1.ts` — todos os `y: 390` de morador, dono, zelador
- `src/levels/World2.ts` — verificar mesmos tipos
- `src/levels/World3.ts` — verificar mesmos tipos

**Constante:** Adicionar `HUMAN_SPAWN_Y = 385` em `src/levels/LevelData.ts` e usar em todos os WorldN.ts.

### 1.2 Boss aparecendo cedo / travado entre objetos

**Problema:** Em `0-boss` (Lobby), o ZeladorBoss pode spawnar em `spawnX: 64` (início do mapa) antes que as barreiras laterais estejam ativas, ou aparecer preso entre decorações.

**Solução:**
- Mover `spawnX` do boss em `0-boss` para o centro da arena: `spawnX: 928` (centro de 0px a 1856px)
- Garantir que `_buildBoss()` em GameScene só é chamado APÓS a cinemática de intro do boss (já existe `_runBossIntro()`)
- Verificar se `leftBarrierX` e `rightBarrierX` em `0-boss` são configurados corretamente (atualmente: `0-boss` é `isBossLevel: true` sem `miniBoss` — o boss é o ZeladorBoss criado via evento `'spawnMinion'` ou diretamente)

**Arquivos afetados:**
- `src/scenes/GameScene.ts` — verificar fluxo de spawn do boss em fases `isBossLevel`
- `src/levels/World0.ts` — ajustar `spawnX` no `LEVEL_0_BOSS`

### 1.3 Decorações: depth e blocking

**Problema:** Decorações non-blocking usam `depth: -1` (atrás do tilemap). Ficam invisíveis ou parecem desconectadas da cena. Algumas decorações `blocking: true` desnecessariamente (cadeiras, mesas) criam barreiras invisíveis no gameplay.

**Solução:**
- Non-blocking: mudar de `depth: -1` para `depth: 1` em `_buildDecorations()` — ficam na frente do tilemap mas atrás de personagens (depth 3+)
- Remover `blocking: true` de cadeiras e mesas em `World0.ts` — apenas grade, fogão e geladeira devem bloquear
- Grades consecutivas: espaçamento mínimo de 80px entre grades do mesmo tipo

**Arquivos afetados:**
- `src/scenes/GameScene.ts` — linha ~280: `this.add.image(d.x, d.y, d.type).setOrigin(0.5, 1).setDepth(-1)` → `.setDepth(1)`
- `src/levels/World0.ts` — remover `blocking: true` de cadeiras/mesas; ajustar posições de grades

### 1.4 Árvore dentro da casa em LEVEL_1_1

**Problema:** Decoração `arvore` em `x: 2100` aparece na mesma região visual que a `casa` em `x: 1100`, criando sobreposição absurda.

**Solução:** Substituir `{ type: 'arvore', x: 2100, y: G }` por `{ type: 'poste', x: 2100, y: G }` em `LEVEL_1_1`.

**Arquivo afetado:** `src/levels/World1.ts`

---

## Sprint 2 — Backgrounds com Pixel Lab

### 2.1 Arquitetura de camadas

O `ParallaxBackground.ts` usa 3 `TileSprite` por tema com velocidades `0.05 / 0.2 / 0.5`. A proposta mantém a estrutura mas substitui as texturas canvas-drawn:

- **Layer 1 (far, speed 0.05):** gradiente programático — mantido como está (gratuito)
- **Layer 2 (mid, speed 0.2):** tileset Pixel Lab — detalhes médios (fachadas, paredes)
- **Layer 3 (near, speed 0.5):** tileset Pixel Lab — detalhes próximos (chão, rodapé)

Os tilesets são gerados com `create_sidescroller_tileset` (tile_size 32×32, medium detail, basic shading) e salvos em `public/sprites/bg/`.

### 2.2 Plano de geração por tema

| Prioridade | Tema | Key mid | Descrição mid | Key near | Descrição near |
|---|---|---|---|---|---|
| 1 | apartamento | `BG_APTO_2` | apartment wall warm beige, windows and picture frames | `BG_APTO_3` | wooden parquet floor, baseboard |
| 2 | apto_boss | `BG_APTO_BOSS_2` | dark grey concrete wall, parking markings | `BG_APTO_BOSS_3` | asphalt floor with yellow lines |
| 3 | rua | `BG_RUA_2` | urban building facade, windows and balcony, blue sky | `BG_RUA_3` | cobblestone sidewalk, curb |
| 4 | praca | `BG_PRACA_2` | wooden fence and bushes, park background | `BG_PRACA_3` | grass and dirt path with pebbles |
| 5 | mercado | `BG_MERCADO_2` | colorful market awnings and shop facade | `BG_MERCADO_3` | market floor tiles, ceramic |
| 6 | boss | `BG_BOSS_2` | brick wall with graffiti, dark green | `BG_BOSS_3` | concrete floor with garbage bags |

### 2.3 Integração

**BootScene.ts:** Substituir `g.generateTexture(BG_*)` por `this.load.image(BG_*, 'sprites/bg/nome.png')` para as 12 novas texturas.

**ParallaxBackground.ts:** As layers 2 e 3 passam a usar as novas imagens. Ajustar `height` se necessário para cobrir os 450px de tela (escalar via `setDisplaySize` se o tile for menor).

**constants.ts:** As keys `BG_APTO_2`, `BG_APTO_3`, etc. já existem — sem mudança necessária.

---

## Sprint 3 — Decorações e Normalização de Escala

### 3.1 Escala normalizada dos personagens

Objetivo: hierarquia visual clara (protagonistas < NPCs humanos ≈ gatos < bosses).

| Personagem | Atual | Novo | Altura visível |
|---|---|---|---|
| Cruella / Raya | 1.2× | **1.4×** | ~45px |
| HumanEnemy (Hugo, Hannah, Morador, Dono, Zelador) | 1.4× | sem mudança | ~56px |
| Gato / GatoSelvagem | 2.0× (Enemy base) | **1.6×** | ~51px |
| SeuBigodes | 1.4× | **2.0×** | ~80px |
| ZeladorBoss | 1.4× | **2.0×** | ~80px |
| SegurancaMoto | 2.5× | sem mudança | 150×125px |
| PomboAgitado / RatoDeCalcada | 1.4× | sem mudança | ~56px |

**Ajuste de physics bodies após mudança de escala:**

```typescript
// Cruella/Raya: sprite 48×48, scale 1.4
body.setSize(28, 38, true)  // world: 39×53px

// Gatos: sprite 48×48, scale 1.6
body.setSize(30, 36, true)  // world: 48×58px

// Bosses: sprite 68×68, scale 2.0
body.setSize(28, 40, true)  // world: 56×80px
```

**Spawn Y dos bosses** (após scale 2.0):
```
spawnY = 416 - (40 × 2.0) / 2 = 416 - 40 = 376
```

**Arquivos afetados:**
- `src/entities/Cruella.ts` — `setScale(1.2)` → `setScale(1.4)` + ajustar body
- `src/entities/Raya.ts` — `setScale(1.2)` → `setScale(1.4)` + ajustar body
- `src/entities/enemies/GatoMalencarado.ts` — adicionar `setScale(1.6)` (atualmente herda scale 2.0 do Enemy base)
- `src/entities/enemies/SeuBigodes.ts` — `setScale(1.4)` → `setScale(2.0)` + ajustar body
- `src/entities/enemies/ZeladorBoss.ts` — `setScale(1.4)` → `setScale(2.0)` + ajustar body
- `src/levels/World0.ts` e `World1.ts` — ajustar spawn Y dos bosses

### 3.2 Fases de estacionamento — novas decorações

As fases `0-3`, `0-4`, `0-5` têm apenas carros e postes. Adicionar variação:

| Novo tipo | Descrição | Fases |
|---|---|---|
| `pilar` | pilar de concreto de estacionamento | 0-3, 0-4, 0-5 |
| `placa_saida` | placa verde de saída de emergência | 0-3, 0-5 |
| `barreira` | barreira plástica amarela/laranja | 0-4, 0-5 |

Estes tipos devem ser adicionados ao BootScene (canvas drawn simples) e ao mapa de decorações.

### 3.3 Revisão de blocking por tipo

| Tipo de decoração | blocking atual | blocking correto |
|---|---|---|
| cadeira | true (alguns) | **false** |
| mesa | true (alguns) | **false** |
| balcao | true | true (OK — bancada alta) |
| grade | true | true (OK) |
| fogao | true | true (OK) |
| geladeira | true | true (OK) |
| estante | true (alguns) | **false** |
| carro | true | true (OK) |

---

## Ordem de implementação sugerida

```
Sprint 1 → Sprint 2 → Sprint 3
   │            │           │
   └── bugs     └── BG lab  └── polish
   └── commit   └── commit  └── commit
```

Cada sprint termina com `npm run build && npm test && git push`.
