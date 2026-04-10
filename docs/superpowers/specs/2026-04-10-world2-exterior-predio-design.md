# Design: World 2 — Exterior do Prédio (Spec B)

**Date:** 2026-04-10
**Scope:** New World 2 — 3 regular phases + 1 boss phase, new background themes, WorldMapScene integration, GameScene registration, level chain wired to World 1
**Out of scope (Spec C):** New enemy AI types (segurança, porteiro), World 3

---

## 1. Narrative

Raya e Cruella escaparam do apartamento e desceram à rua. Agora precisam traversar o **exterior do prédio** — passeio público, pátio interior, escadas de emergência e telhado — para chegar ao parque onde terão a batalha final do mundo.

Inimigos usados: apenas tipos já existentes em `EnemyType` (`gato`, `rato`, `pombo`, `dono`, `zelador`, `morador`).

---

## 2. Estrutura do Mundo

| Fase | ID | Nome | Cols | Largura | Tema BG | Boss |
|------|----|------|------|---------|---------|------|
| 2-1 | `2-1` | Passeio Público | 80 | 2560px | `exterior` | — |
| 2-2 | `2-2` | Pátio Interior | 100 | 3200px | `patio` | — |
| 2-3 | `2-3` | Escadas de Emergência | 110 | 3520px | `exterior` | — |
| Boss | `2-boss` | Telhado — Drone Ataca! | 60 | 1920px | `telhado` | Drone |

Encadeamento: `1-boss.nextLevel = '2-1'` → `2-1 → 2-2 → 2-3 → 2-boss → null` (World 3 futuro)

---

## 3. Novos BackgroundThemes

Adicionar a `src/levels/LevelData.ts`:
```typescript
export type BackgroundTheme = 'rua' | 'praca' | 'mercado' | 'boss' | 'apartamento' | 'apto_boss'
  | 'exterior' | 'patio' | 'telhado'
```

Sprites gerados em `BootScene.ts` via Canvas API (mesmo padrão dos BG existentes, 480×450):

| Theme | Keys | Descrição visual |
|-------|------|-----------------|
| `exterior` | BG_EXT_1/2/3 | Céu noturno azul escuro (layer 1), fachada de prédio com janelas amarelas (layer 2), calçada com arbustos (layer 3) |
| `patio` | BG_PATIO_1/2/3 | Muro de tijolo escuro (layer 1), varal de roupa (layer 2), chão de paralelepípedo cinza (layer 3) |
| `telhado` | BG_TELHADO_1/2/3 | Céu noturno com estrelas (layer 1), antenas e caixas d'água (layer 2), superfície de telhado com telhas (layer 3) |

---

## 4. Novos Projéteis do Boss

| Key | Visual | Comportamento |
|-----|--------|---------------|
| `BOMB` | Círculo preto com faísca laranja 10×10 | Arco descendente (gravidade normal, vy positivo inicial) |
| `LASER` | Linha vermelha fina 16×4 | Tiro reto horizontal (gravity -800 para cancelar) |

---

## 5. Boss: Drone

Ficheiro: `src/entities/enemies/Drone.ts`

- **HP:** 20 hits
- **Físicas:** `body.setGravityY(-800)` — flutua (cancela gravidade do mundo)
- **Movimento:** patrulha horizontal, velocidade base 100px/s
- **Fase 1 (HP 100–67%):** lança BOMB em arco a cada 3000ms (1 por ciclo)
- **Fase 2 (HP 67–34%):** velocidade 140px/s, lança 2 BOMBs por ciclo a cada 2200ms
- **Fase 3 (HP ≤ 34%):** velocidade 180px/s, lança BOMB + LASER a cada 2000ms
- **Emit:** `emit('spawnBomb', { x, y, vx, vy })` e `emit('spawnLaser', { x, y, vx, vy })`

### Comportamento BOMB

```typescript
const dx = playerX - this.x
const angle = Math.atan2(200, dx) // arco descendente forçado
vx = Math.cos(angle) * 180
vy = -160 // sobe antes de descer
// sem cancelar gravidade → cai em parábola
```

### Comportamento LASER

```typescript
const dx = playerX - this.x > 0 ? 1 : -1
vx = dx * 320  // reto horizontal
vy = 0
// body.setGravityY(-800) cancela gravidade
```

---

## 6. Fases em Detalhe

### 2-1 — Passeio Público (80 cols, 2560px)

```
bgColor: 0x1a1a3a, backgroundTheme: 'exterior', timeLimit: 180
spawnX: 64, spawnY: 300, exitX: 2496, exitY: 370
checkpointX: 1280, checkpointY: 380
```

Tiles (14 rows):
```
emptyRow() ×3
platformRow(8, 5)   emptyRow()
platformRow(20, 4)  platformRow(35, 5)  emptyRow()
platformRow(45, 4)  platformRow(58, 5)  emptyRow()
platformRow(68, 5)  emptyRow()  emptyRow()
groundRow()
```

Enemies (7): `rato×3` (x:300,800,1800), `gato×2` (x:600,1400), `zelador×1` (x:1100), `dono×1` (x:2100)

Items (11): bone×5 (x:160,400,700,1200,1900), petisco×2 (x:550,1600), surprise_block×2 (x:900,1700 y:310), pizza×1 (x:1400), laco×1 (x:2100)

GoldenBones (3): {x:320,y:96}, {x:1152,y:80}, {x:1984,y:64}

Decorations (10): poste×2 (x:200,1200), lixeira×2 (x:450,1700), arvore×2 (x:700,1950), banco×1 (x:950), grade×2 (x:2200,2400), placa×1 (x:1450)

Intro complexity:2, dialogue:
- "O passeio está cheio de ratos à noite. Cuidado com o zelador!"
- "Que horror. Eu mereço um táxi, não isto."

nextLevel: '2-2'

---

### 2-2 — Pátio Interior (100 cols, 3200px)

```
bgColor: 0x2a1a0a, backgroundTheme: 'patio', timeLimit: 200
spawnX: 64, spawnY: 300, exitX: 3136, exitY: 370
checkpointX: 1600, checkpointY: 380
```

Tiles usando `mkHelpers(100)` → `r22`:
```
r22.e() ×3
r22.mp([5,4],[55,4],[82,4])  r22.e()
r22.p(18,5)  r22.mp([40,3],[68,3])  r22.e()
r22.mp([28,6],[75,5])  r22.p(50,4)  r22.e()
r22.mp([62,5],[85,4])  r22.e()  r22.e()
r22.g()
```

Enemies (11): `gato×4` (x:400,900,1800,2600), `rato×3` (x:650,1300,2200), `morador×2` (x:1100,2900), `zelador×1` (x:1600), `dono×1` (x:3000)

Items (13): bone×6 (x:200,500,1000,1500,2100,2700), petisco×2 (x:750,2400), surprise_block×2 (x:1200,2600 y:310), chapeu×1 (x:1800), frisbee×1 (x:2300), bola×1 (x:3000)

GoldenBones (4): {x:288,y:64}, {x:1344,y:96}, {x:2240,y:64}, {x:2944,y:80}

Decorations (14): carro×3 (x:300,1100,2000), lixeira×3 (x:550,1450,2350), poste×2 (x:800,2100), arvore×2 (x:1250,2650), grade×2 (x:1700,2900), saco_lixo×2 (x:650,2500)

Intro complexity:2, dialogue:
- "O pátio... parece que tem gatos em todo lado."
- "Óptimo. Uma visita guiada ao inferno felino."

nextLevel: '2-3'

---

### 2-3 — Escadas de Emergência (110 cols, 3520px)

```
bgColor: 0x0a0a1a, backgroundTheme: 'exterior', timeLimit: 200
spawnX: 64, spawnY: 300, exitX: 3456, exitY: 370
checkpointX: 1760, checkpointY: 380
```

Tiles usando `mkHelpers(110)` → `r23`:
```
r23.e() ×2
r23.mp([8,5],[22,4])
r23.mp([35,5],[48,3])  r23.e()
r23.mp([58,6],[70,4])  r23.e()
r23.mp([78,5],[90,4],[103,4])
r23.mp([82,3],[95,3],[106,4])
r23.e() ×4
r23.g()
```

Enemies (14): `pombo×4` (x:500,1200,2000,2800 y:120), `gato×3` (x:800,1600,2400), `rato×3` (x:350,1400,2200), `morador×2` (x:1000,2600), `dono×2` (x:1800,3200)

Items (15): bone×7 (x:160,450,900,1350,1900,2450,3100), petisco×2 (x:650,2150), surprise_block×3 (x:1100,2000,3000 y:300), pizza×1 (x:1600), bandana×1 (x:2700), coleira×1 (x:3300)

GoldenBones (4): {x:352,y:64}, {x:1664,y:96}, {x:2560,y:192}, {x:3200,y:64}

Decorations (16): poste×2 (x:200,2000), grade×4 (x:500,1200,2400,3100), arvore×2 (x:750,1800), lixeira×3 (x:1000,2200,3000), saco_lixo×3 (x:400,1500,2700), placa×2 (x:1300,2900)

Intro complexity:3, dialogue:
- "As escadas de emergência — vamos subir andar a andar!"
- "Sempre soube que morreria a subir escadas. Vamos lá."

nextLevel: '2-boss'

---

### 2-boss — Telhado — Drone Ataca! (60 cols, 1920px)

```
bgColor: 0x050510, backgroundTheme: 'telhado', timeLimit: 0, isBossLevel: true
spawnX: 64, spawnY: 300, exitX: 1856, exitY: 370
checkpointX: 80, checkpointY: 300
```

Tiles (IIFE, BC=60):
```
Array(BC).fill(0) ×4
// 2 plataformas de cobertura lateral
[...Array(6).fill(0), ...Array(5).fill(1), ...Array(BC-11).fill(0)]
[...Array(BC-11).fill(0), ...Array(5).fill(1), ...Array(6).fill(0)]
Array(BC).fill(0) ×6
Array(BC).fill(1)  // chão
```

enemies: [], items: [], goldenBones: []
nextLevel: null

Decorations (5): antena×2 (x:200,600), caixa_dagua×1 (x:900), antena×1 (x:1300), caixa_dagua×1 (x:1700)

Intro complexity:3, dialogue:
- "Um drone de vigilância — tem câmeras em todo lado!"
- "Eu comprei um drone igual a este. O meu era mais elegante."

---

## 7. Ficheiros a Criar/Modificar

| # | Ficheiro | Acção |
|---|----------|-------|
| T1 | `src/levels/LevelData.ts` | Adicionar `'exterior' \| 'patio' \| 'telhado'` ao BackgroundTheme |
| T1 | `src/constants.ts` | Adicionar KEYS: BG_EXT_1/2/3, BG_PATIO_1/2/3, BG_TELHADO_1/2/3, BOMB, LASER; MEDAL_THRESHOLDS 2-1/2-2/2-3/2-boss |
| T2 | `src/scenes/BootScene.ts` | Gerar sprites BG_EXT_1/2/3, BG_PATIO_1/2/3, BG_TELHADO_1/2/3, BOMB, LASER |
| T2 | `src/background/ParallaxBackground.ts` | Adicionar THEME_LAYERS para exterior, patio, telhado |
| T3 | `src/levels/World2.ts` | Criar todo o ficheiro: helpers, 4 levels, WORLD2_LEVELS export |
| T4 | `src/entities/enemies/Drone.ts` | Criar boss Drone (3 fases, spawnBomb, spawnLaser) |
| T5 | `src/scenes/GameScene.ts` | Importar WORLD2_LEVELS, ALL_LEVELS, handlers spawnBomb/spawnLaser |
| T5 | `src/scenes/WorldMapScene.ts` | Adicionar Mundo 2 a worlds[], worldStartY[], MAP_NODES |
| T5 | `src/levels/World1.ts` | LEVEL_1_BOSS.nextLevel: null → '2-1' |

---

## 8. MEDAL_THRESHOLDS

```typescript
'2-1':    1900,  // 7 inimigos×50 + 6 ossos×10 + 3 golden×500
'2-2':    2850,  // 11 inimigos×50 + 8 ossos×10 + 4 golden×500
'2-3':    3150,  // 14 inimigos×50 + 9 ossos×10 + 4 golden×500
'2-boss':  500,  // boss Drone apenas
```
