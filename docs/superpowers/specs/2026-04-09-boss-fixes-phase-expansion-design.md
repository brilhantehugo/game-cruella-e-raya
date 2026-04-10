# Design: Bug Fixes + Boss Wall-E + Phase Expansion (Spec A)

**Date:** 2026-04-09
**Scope:** Bug fixes, boss overhaul, expansion of existing World 0/1 phases
**Out of scope (Spec B/C):** World 2 and World 3 (separate specs)

---

## 1. Bug Fixes

### 1a. Hugo/Hannah invisíveis na Sala de Estar

**Causa raiz (dois problemas independentes):**

1. `HumanEnemy` não chama `setDepth()` → sprites renderizam em depth 0, atrás de decorações (sofás, mesas) que também estão em depth 0.
2. `EnemyStateMachine` inicializa `_stateEnteredAt = 0` → no 1º frame, `timeInState()` retorna `scene.time.now - 0` (tempo total desde boot, ~1000–2000ms) → o estado PATROL já parece ter decorrido tempo suficiente para transições, podendo disparar DETECT/CHASE imediatamente.

**Fix:**
- `src/entities/enemies/HumanEnemy.ts`: adicionar `this.setDepth(3)` no constructor, após `super()`.
- `src/entities/enemies/EnemyStateMachine.ts`: no constructor, substituir `this._stateEnteredAt = 0` por `this._stateEnteredAt = this._getNow()`.

**Testes:**
- Confirmar que Hugo e Hannah aparecem visivelmente em `0-1` ao iniciar a fase.
- Confirmar que não correm imediatamente para fora do ecrã ao spawn.

---

### 1b. HUD — sobreposição de textos

**Causa:** `dogText` (nome da personagem) em `y:10` e `_levelNameText` (nome da fase) em `y:8` — ambos centrados em `GAME_WIDTH/2`, resultando em sobreposição.

**Fix:**
- `src/scenes/UIScene.ts`: mover `_levelNameText` de `y:8` para `y:30`.
- Reduzir tamanho da fonte do `_levelNameText` para 10px e cor `#aaaaaa` para hierarquia visual clara.
- `dogText` permanece em `y:10`, tamanho e cor inalterados.

**Resultado visual:**
```
linha 1 (y:10): RAYA          ← nome da personagem, destaque
linha 2 (y:30): Cozinha — Wall-E Ataca!  ← nome da fase, subtil
```

---

### 1c. Saída invisível após boss morrer

**Causa:** `exitX: 768` na arena actual de 832px (quase no fim). Quando a arena expandir para 1920px, o exit precisa de estar a `exitX: 1856`. Adicionalmente, auditar GameScene para garantir que `exitSprite.setVisible(true)` é chamado no evento `'bossDied'` ou equivalente.

**Fix:**
- `src/levels/World0.ts` (`LEVEL_0_BOSS`): `exitX: 1856`, `exitY: 370`.
- `src/scenes/GameScene.ts`: verificar handler de morte do boss — confirmar que activa a saída com as coordenadas correctas.

---

## 2. Boss Wall-E Overhaul

### 2a. Rename Aspirador → Wall-E

**Ficheiros a alterar:**
- `src/levels/World0.ts`: `LEVEL_0_BOSS.name = 'Cozinha — Wall-E Ataca!'`
- `src/levels/World0.ts`: `LEVEL_0_BOSS.intro.dialogue` actualizado para mencionar "Wall-E"
- O ficheiro `src/entities/enemies/Aspirador.ts` mantém o nome para não quebrar imports existentes. O display name dentro do jogo passa a "Wall-E" via dados do nível.

**Sugestão de diálogo intro:**
```
Raya: "Cuidado — esse robô de limpeza virou selvagem!"
Cruella: "Wall-E?! Eu preferia um Roomba com melhor gosto."
```

---

### 2b. Arena expandida

**Alterações em `src/levels/World0.ts` (`LEVEL_0_BOSS`):**

| Campo | Antes | Depois |
|-------|-------|--------|
| `tileWidthCols` | 26 | 60 |
| Arena width | 832px | 1920px |
| `exitX` | 768 | 1856 |
| `spawnX` | 64 | 64 |

**Layout de plataformas (cozinha):**
```
Tile map (60 cols × 14 rows):
- row 4: bancada em x:5–9 (height médio)
- row 5: prateleira em x:14–16 (height alto)
- row 4: bancada em x:22–26 (height médio)
- row 5: prateleira em x:32–34 (height alto)
- row 4: bancada em x:40–44 (height médio)
- row 5: prateleira em x:50–52 (height alto)
- row 13: chão completo (Array(60).fill(1))
```

**Decorações redistribuídas** ao longo dos 1920px: saco_lixo e lixeira a cada ~320px.

**World bounds:** `GameScene.ts` já usa `physics.world.setBounds(0, 0, mapWidth, GAME_HEIGHT)` onde `mapWidth = tileWidthCols * TILE_SIZE` — sem alteração necessária, expande automaticamente.

---

### 2c. Projéteis — dois tipos

#### Tipo A: Dirt Arc (existente, mantido)
- Método: `_throwDirt()` — sem alterações
- Trajetória: arco alto (`vy: -180`, gravidade activa)
- Sprite: DIRT existente
- Fase 1: cadência actual

#### Tipo B: Blade (novo)
- Método: `_throwBlade()` em `Aspirador.ts`
- Trajetória: horizontal reta (`vy: 0`, `setGravityY(-300)` para cancelar gravidade)
- Velocidade: 220px/s (fase 2), 280px/s (fase 3)
- Rotação: `body.angularVelocity = 360`
- Sprite: `KEYS.BLADE` — gerado em `BootScene.ts` via Canvas (12×12px, 2 linhas cruzadas, cor `#22ccff`, stroke 2px)
- Direcção: aponta para o player no momento do disparo (calcula ângulo com `Math.atan2`)

#### Progressão por fase:
| Fase | HP | Padrão |
|------|----|--------|
| 1 | >66% | Dirt arc a cada 2.5s |
| 2 | 33–66% | Dirt arc a cada 2.5s + 1 blade a cada 3s (alternados) |
| 3 | <33% | Dirt arc a cada 2s + 2 blades simultâneos a cada 2.5s (ângulos ±15°) |

---

## 3. Expansão de Fases Existentes

### 3a. World 0 — Apartamento

> **Nota:** `COLS = 64` em World0.ts. A ordem das fases é: `0-1 → 0-boss → 0-2 → 1-1`.

#### LEVEL_0_1 (Sala de Estar)
- `tileWidthCols: 64 → 96` (~3072px, ~3 telas)
- `exitX: 3008` (96 × 32 − 64)
- `checkpointX: 1536` (meio da fase)
- **Plataformas adicionais** na 2ª metade: sofá alto em x≈1800, prateleira de livros em x≈2200, mesa de jantar em x≈2600
- **Inimigos adicionais na 2ª metade** (x: 2000–2900):
  - Hugo em x:2100, x:2700
  - Hannah em x:2400, x:2900
  - Zelador em x:2600 (introdução tardia, mais difícil)
- **Itens adicionais** proporcionais ao novo comprimento (bones e petiscos a cada ~300px)

#### LEVEL_0_2 (Estacionamento do Prédio)
- `tileWidthCols: 64 → 96` (~3072px)
- `exitX: 3008`, `checkpointX: 1536`
- **Carros adicionais** na 2ª metade como plataformas e obstáculos (5–6 carros extra)
- **Inimigos adicionais** na 2ª metade: zelador extra em x:1800, morador em x:2300, gato em x:2700
- Portão triplo de grades mantido próximo do fim (x≈2900–2960)

---

### 3b. World 1 — Rua

#### LEVEL_1_1 (Rua Residencial) — já tem 80 cols
- Manter `tileWidthCols: 80`
- **Densificar 2ª metade** (após checkpoint x:1280):
  - Adicionar 2 moradores extra (x:1600, x:2100)
  - Adicionar dono extra (x:2400)
  - 1 combinação rato+morador simultânea em x:1900
- Mais items na 2ª metade

#### LEVEL_1_2 (Praça com Jardim)
- `tileWidthCols: 80 → 100`
- `exitX: 3136`, `checkpointX: 1600`
- **Zona aérea** em x:1800–2800: plataformas em árvores altas (row 3–4), pombos nessa zona
- Moradores no chão abaixo das árvores (obrigam a jogar em dois planos)

#### LEVEL_1_3 (Mercadinho)
- `tileWidthCols: 80 → 110`
- `exitX: 3456`, `checkpointX: 1760`
- **Zona de barraca interior** em x:2200–3000: plataformas densas (como interior de mercado), gatos em cima e ratos em baixo
- 1 dono extra no final da zona interior

---

## 4. Ficheiros Alterados

| Ficheiro | Alterações |
|----------|-----------|
| `src/entities/enemies/HumanEnemy.ts` | `setDepth(3)` no constructor |
| `src/entities/enemies/EnemyStateMachine.ts` | `_stateEnteredAt = getNow()` no constructor |
| `src/scenes/UIScene.ts` | `_levelNameText` y:8 → y:30, font 10px, cor #aaa |
| `src/scenes/GameScene.ts` | Auditar/corrigir handler de morte do boss → exit visível |
| `src/entities/enemies/Aspirador.ts` | `_throwBlade()` + progressão de fases 2/3 |
| `src/scenes/BootScene.ts` | Gerar sprite BLADE (12×12px, ciano) + adicionar `KEYS.BLADE` ao enum |
| `src/levels/World0.ts` | Rename boss, arena expandida, LEVEL_0_1/0_2 expandidos |
| `src/levels/World1.ts` | LEVEL_1_1/1_2/1_3 expandidos |

---

## 5. Fora de Scope deste Spec

- World 2 (Exterior do Prédio) → Spec B
- World 3 (Rua de Noite) → Spec C
- Novos bosses para World 2/3
- Sistema de spotlight/visibilidade reduzida (World 3)
- Patrulhas coordenadas / alertas propagados (World 3)

---

## 6. Critérios de Sucesso

- [ ] Hugo e Hannah visíveis em `0-1` ao iniciar a fase, sem correr imediatamente para fora do ecrã
- [ ] Nome da fase aparece numa 2ª linha no HUD, sem sobrepor o nome da personagem
- [ ] Boss Wall-E fica contido na arena expandida (1920px), não sai do ecrã
- [ ] Saída aparece visível após matar o Wall-E
- [ ] Blades giratórias disparadas nas fases 2 e 3 do boss
- [ ] Fases existentes de World 0 e World 1 têm maior comprimento e mais inimigos na 2ª metade
- [ ] Todos os testes existentes continuam a passar (77 testes)
