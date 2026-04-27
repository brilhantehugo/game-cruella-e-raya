# Bugfix: Ambiente, Boss e Inimigos Humanos — Design Spec

## Goal

Corrigir quatro bugs/polimentos críticos que comprometem a experiência de jogo:
1. Boss Aspirador aparece no início da fase em vez de no final (guardião da casa)
2. Background some e só mostra bgColor ao scrollar (TileSprite sem scrollFactor)
3. Personagens humanos caem de plataformas (sem ledge detection)
4. Árvores aparecem dentro da decoração de casa na Fase 1

---

## 1 — Boss Trigger reposicionado (World0, LEVEL_0_1)

**Problema:** `triggerX: 1280` dispara o boss no 42% do mapa (3072px), antes do jogador explorar a fase.

**Fix:** Mover a arena de boss para os últimos ~25% do mapa.

```
triggerX:      1280  →  2400
spawnX:        1520  →  2640
leftBarrierX:  1056  →  2176
rightBarrierX: 1984  →  3008
```

**Arquivo:** `src/levels/World0.ts` — objeto `LEVEL_0_1.miniBoss`

---

## 2 — Background gaps: `setScrollFactor(0)` em TileSprites

**Problema raiz:** `scene.add.tileSprite(0, 0, GAME_WIDTH, 450, key)` posiciona o sprite em coordenadas de **mundo**. Sem `setScrollFactor(0)`, quando a câmera scrolla para além de `GAME_WIDTH` (~800px), o sprite fica fora do viewport. O `tilePositionX` só desloca a textura interna — não reposiciona o sprite no mundo.

**Fix:** Adicionar `sprite.setScrollFactor(0)` imediatamente após criar cada TileSprite. Isso pina o sprite ao viewport (câmera-space) e o `tilePositionX = cameraScrollX * speed` produz o efeito parallax correto — padrão canônico do Phaser 3.

**Arquivo:** `src/background/ParallaxBackground.ts` — dentro do `configs.forEach` no construtor.

---

## 3 — Ledge detection para HumanEnemy

**Problema:** `_doChase()` e `_doPatrol()` em `HumanEnemy` só verificam colisão lateral (`body.blocked.left/right`). Não há verificação se há chão à frente antes de avançar, causando queda das bordas de plataformas.

**Fix:** Verificar tile do `groundLayer` antes de mover:
- Posição checada: `(this.x + direction * 24, this.y + 36)` em coordenadas de mundo
- Se `groundLayer.getTileAtWorldXY(...)` retornar `null` → sem chão à frente
  - Em patrol: inverter direção
  - Em chase: parar (`setVelocityX(0)`)

**Interface:** `HumanEnemy` recebe `groundLayer: Phaser.Tilemaps.TilemapLayer` via construtor (parâmetro opcional com `| null` para compatibilidade). Todos os pontos de instanciação em `GameScene.ts` passam o layer.

**Arquivos:**
- `src/entities/enemies/HumanEnemy.ts` — construtor + `_doPatrol` + `_doChase`
- `src/scenes/GameScene.ts` — passar `groundLayer` ao construir instâncias de `HumanEnemy`

---

## 4 — Remover árvores dentro da casa (World1)

**Problema:** Decorações `type: 'arvore'` em `World1.ts` LEVEL_1_1 estão posicionadas em x-coordinates que se sobrepõem visualmente à decoração `type: 'casa'`, quebrando a coerência do ambiente.

**Fix:** Remover ou reposicionar as entradas de `arvore` que colidem com a `casa`. Verificar visualmente os x de `casa` vs `arvore` em LEVEL_1_1 e ajustar.

**Arquivo:** `src/levels/World1.ts` — array `decorations` do LEVEL_1_1

---

## Arquivos tocados

| Arquivo | Ação |
|---------|------|
| `src/levels/World0.ts` | Atualizar coords do miniBoss de LEVEL_0_1 |
| `src/background/ParallaxBackground.ts` | `sprite.setScrollFactor(0)` em cada layer |
| `src/entities/enemies/HumanEnemy.ts` | Construtor + ledge check em patrol/chase |
| `src/scenes/GameScene.ts` | Passar groundLayer para HumanEnemy |
| `src/levels/World1.ts` | Remover/mover arvores sobrepostas à casa |

---

## Testing

- Iniciar LEVEL_0_1: boss **não** deve aparecer antes de x≈2400
- Scrollar até o final da fase: boss deve disparar como guardião
- Scrollar fases com câmera além de GAME_WIDTH: background deve cobrir o viewport inteiro
- HumanEnemy em plataforma suspensa: deve parar na borda, não cair
- HumanEnemy em chase: deve parar ou dar meia-volta na borda da plataforma
- Fase 1-1: sem árvores visíveis dentro da casa

---

## Out of scope

- Redesign de sprites de NPCs (Spec B — aguardando nova API key Pixel Lab)
- Novos backgrounds ou tilesets
- Rebalanceamento de dificuldade dos bosses
