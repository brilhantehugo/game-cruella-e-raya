# Redesenho dos Cenários — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar todos os 10 temas de background do jogo com hierarquia visual clara (L1 dessaturado → L2 silhuetas → L3 detalhe contrastado), eliminando poluição visual.

**Architecture:** Todo o código de geração está em `src/scenes/BootScene.ts`. Cada tema tem 3 camadas geradas proceduralmente via Phaser Graphics na função `gen(key, w, h)`. O tema `rua_noite` actualmente reutiliza as keys do `exterior` — vai receber keys próprias (`BG_RUA_NOITE_1/2/3`) com novos blocos de geração. Os 9 temas restantes apenas têm os seus blocos de drawing reescritos — nenhuma key ou ficheiro extra é alterado.

**Tech Stack:** TypeScript, Phaser 3, npm

**Spec:** `docs/superpowers/specs/2026-04-18-cenarios-redesenho-design.md`

---

## File Map

| Arquivo | Ação | Detalhe |
|---|---|---|
| `src/constants.ts` | Modificar | Adicionar `BG_RUA_NOITE_1/2/3` ao objecto `KEYS` |
| `src/background/ParallaxBackground.ts` | Modificar | Mapear `rua_noite` para as 3 novas keys |
| `src/scenes/BootScene.ts` | Modificar | Reescrever 27 blocos existentes + adicionar 3 blocos novos (`rua_noite`) |

---

## Contexto para todos os subagentes

- Projeto: `/Users/apple/Desktop/github/game-cruella-e-raya`
- `GAME_WIDTH = 800`, `GAME_HEIGHT = 450`
- Em `BootScene.ts`: `g` é um `Phaser.GameObjects.Graphics`; `clr()` limpa o canvas; `gen(key, w, h)` guarda a textura. Cada bloco tem a forma:
  ```
  // bg_xxx_N: descrição
  clr()
  g.fillStyle(0xCOLOR[, alpha]); g.fillRect/fillEllipse/fillCircle/fillTriangle(...)
  ...
  gen(KEYS.BG_XXX_N, largura, altura)
  ```
- `g.fillEllipse(cx, cy, largura, altura)` — ponto central
- `g.fillCircle(cx, cy, raio)`
- `g.fillTriangle(x1, y1, x2, y2, x3, y3)`
- `g.fillStyle(0xCOLOR, alpha)` — alpha é opcional (0.0–1.0)
- Texturas 200×450 para: `rua`, `praca`, `mercado`, `boss`, `apartamento`, `apto_boss`
- Texturas 480×450 para: `exterior`, `patio`, `telhado`, `rua_noite`
- Sem testes unitários (zero lógica — puro visual). 124 testes pré-existentes devem continuar a passar.

---

## Task 1: Infraestrutura `rua_noite` — keys + ParallaxBackground

**Files:**
- Modify: `src/constants.ts`
- Modify: `src/background/ParallaxBackground.ts`

- [ ] **Step 1.1: Adicionar 3 keys ao objecto KEYS em `src/constants.ts`**

Localizar o bloco de keys `BG_TELHADO_*` (perto da linha 117–119) e adicionar logo a seguir:

```typescript
  BG_RUA_NOITE_1: 'bg_rua_noite_1',
  BG_RUA_NOITE_2: 'bg_rua_noite_2',
  BG_RUA_NOITE_3: 'bg_rua_noite_3',
```

---

- [ ] **Step 1.2: Atualizar mapeamento `rua_noite` em `src/background/ParallaxBackground.ts`**

Localizar o bloco `rua_noite` (actualmente usa `BG_EXT_1/2/3`) e substituir por:

```typescript
  rua_noite: [
    { key: KEYS.BG_RUA_NOITE_1, speed: 0.05, y: 0, height: 450 },
    { key: KEYS.BG_RUA_NOITE_2, speed: 0.2,  y: 0, height: 450 },
    { key: KEYS.BG_RUA_NOITE_3, speed: 0.5,  y: 0, height: 450 },
  ],
```

---

- [ ] **Step 1.3: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs`. Se houver erros de "keys not found" em BootScene: normal — os blocos de geração serão adicionados na Task 11.

**Nota:** o build pode falhar com erro tipo `"Cannot find key BG_RUA_NOITE_1"` apenas se `BootScene.ts` referenciar essas keys antes de serem definidas. Se o erro for só `"Property does not exist"` no objecto KEYS, confirme que as keys foram adicionadas correctamente e prossiga — o build completo passará após a Task 11.

---

- [ ] **Step 1.4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/constants.ts src/background/ParallaxBackground.ts && git commit -m "feat(bg): add BG_RUA_NOITE keys and update ParallaxBackground mapping"
```

---

## Task 2: Redesenho tema `apartamento`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_apto_1`, `bg_apto_2`, `bg_apto_3`

- [ ] **Step 2.1: Reescrever bloco `bg_apto_1` (L1 — parede bege)**

Localizar o bloco que começa com `// bg_apto_1:` e substituir desde `clr()` até `gen(KEYS.BG_APTO_1, 200, 450)` inclusive por:

```typescript
    // bg_apto_1: parede bege — gradiente 2 stops
    clr()
    g.fillStyle(0xf5e6c8); g.fillRect(0, 0, 200, 280)
    g.fillStyle(0xe8d4aa); g.fillRect(0, 280, 200, 170)
    gen(KEYS.BG_APTO_1, 200, 450)
```

---

- [ ] **Step 2.2: Reescrever bloco `bg_apto_2` (L2 — quadro + sofá)**

Localizar o bloco que começa com `// bg_apto_2:` e substituir desde `clr()` até `gen(KEYS.BG_APTO_2, 200, 450)` inclusive por:

```typescript
    // bg_apto_2: quadro na parede + sofá
    clr()
    g.fillStyle(0x909080); g.fillRect(48, 190, 44, 56)
    g.fillStyle(0xa8b898); g.fillRect(52, 194, 36, 48)
    g.fillStyle(0xb8a888); g.fillRect(8, 328, 148, 68)
    g.fillStyle(0xa09870); g.fillRect(8, 316, 148, 16)
    g.fillStyle(0xa09870); g.fillRect(150, 316, 14, 84)
    g.fillStyle(0xa09870); g.fillRect(4, 316, 14, 84)
    gen(KEYS.BG_APTO_2, 200, 450)
```

---

- [ ] **Step 2.3: Reescrever bloco `bg_apto_3` (L3 — rodapé + piso de madeira)**

Localizar o bloco que começa com `// bg_apto_3:` e substituir desde `clr()` até `gen(KEYS.BG_APTO_3, 200, 450)` inclusive por:

```typescript
    // bg_apto_3: rodapé + piso de madeira
    clr()
    g.fillStyle(0xe8dcc0); g.fillRect(0, 388, 200, 10)
    g.fillStyle(0x8B6914); g.fillRect(0, 398, 200, 16)
    g.fillStyle(0x7a5c10); g.fillRect(0, 414, 200, 14)
    g.fillStyle(0x8B6914); g.fillRect(0, 428, 200, 12)
    g.fillStyle(0x7a5c10); g.fillRect(0, 440, 200, 10)
    gen(KEYS.BG_APTO_3, 200, 450)
```

---

- [ ] **Step 2.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs`

---

- [ ] **Step 2.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema apartamento — hierarquia L1/L2/L3"
```

---

## Task 3: Redesenho tema `apto_boss`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_apto_boss_1`, `bg_apto_boss_2`, `bg_apto_boss_3`

- [ ] **Step 3.1: Reescrever bloco `bg_apto_boss_1` (L1 — azulejos + luz de janela)**

```typescript
    // bg_apto_boss_1: azulejos brancos + luz de janela
    clr()
    g.fillStyle(0xf0f0f0); g.fillRect(0, 0, 200, 450)
    ;[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420].forEach((y: number) => {
      g.fillStyle(0xdddddd); g.fillRect(0, y, 200, 1)
    })
    ;[30, 60, 90, 120, 150, 180].forEach((x: number) => {
      g.fillStyle(0xdddddd); g.fillRect(x, 0, 1, 450)
    })
    g.fillStyle(0xfffff8, 0.3); g.fillRect(140, 0, 60, 200)
    gen(KEYS.BG_APTO_BOSS_1, 200, 450)
```

---

- [ ] **Step 3.2: Reescrever bloco `bg_apto_boss_2` (L2 — armários de cozinha)**

```typescript
    // bg_apto_boss_2: armários suspensos — cinza frio
    clr()
    g.fillStyle(0x888a8c); g.fillRect(0, 180, 200, 110)
    g.fillStyle(0x777a7c); g.fillRect(0, 180, 200, 4)
    g.fillStyle(0x777a7c); g.fillRect(66, 184, 2, 106)
    g.fillStyle(0x777a7c); g.fillRect(132, 184, 2, 106)
    gen(KEYS.BG_APTO_BOSS_2, 200, 450)
```

---

- [ ] **Step 3.3: Reescrever bloco `bg_apto_boss_3` (L3 — balcão + pia + torneira)**

```typescript
    // bg_apto_boss_3: balcão + pia + torneira
    clr()
    g.fillStyle(0xe8e8e8); g.fillRect(0, 350, 200, 20)
    g.fillStyle(0xd0d0d0); g.fillRect(0, 348, 200, 4)
    g.fillStyle(0xcccccc); g.fillRect(70, 310, 50, 42)
    g.fillStyle(0xaaaaaa); g.fillRect(74, 314, 42, 34)
    g.fillStyle(0x999999); g.fillRect(92, 300, 6, 16)
    g.fillStyle(0x999999); g.fillRect(88, 300, 14, 5)
    gen(KEYS.BG_APTO_BOSS_3, 200, 450)
```

---

- [ ] **Step 3.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 3.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema apto_boss — hierarquia L1/L2/L3"
```

---

## Task 4: Redesenho tema `rua`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_rua_1`, `bg_rua_2`, `bg_rua_3`

- [ ] **Step 4.1: Reescrever bloco `bg_rua_1` (L1 — céu azul + 1 nuvem)**

```typescript
    // bg_rua_1: céu azul — gradiente 2 stops + 1 nuvem
    clr()
    g.fillStyle(0x87ceeb); g.fillRect(0, 0, 200, 320)
    g.fillStyle(0xd4eeff); g.fillRect(0, 320, 200, 130)
    g.fillStyle(0xffffff, 0.7); g.fillEllipse(90, 90, 120, 36)
    gen(KEYS.BG_RUA_1, 200, 450)
```

---

- [ ] **Step 4.2: Reescrever bloco `bg_rua_2` (L2 — 3 prédios dessaturados)**

```typescript
    // bg_rua_2: 3 prédios em silhueta — cinza-azulado
    clr()
    g.fillStyle(0x7a8a99); g.fillRect(0, 150, 60, 300)
    g.fillStyle(0x6a7a88); g.fillRect(70, 200, 70, 250)
    g.fillStyle(0x7a8a99); g.fillRect(150, 240, 50, 210)
    gen(KEYS.BG_RUA_2, 200, 450)
```

---

- [ ] **Step 4.3: Reescrever bloco `bg_rua_3` (L3 — calçada + poste + janela)**

```typescript
    // bg_rua_3: calçada + poste + janela com grade
    clr()
    g.fillStyle(0xaaaaaa); g.fillRect(0, 400, 200, 50)
    g.fillStyle(0x888888); g.fillRect(0, 398, 200, 4)
    g.fillStyle(0x555555); g.fillRect(60, 300, 6, 100)
    g.fillStyle(0x555555); g.fillRect(44, 300, 22, 5)
    g.fillStyle(0x7a8888); g.fillRect(100, 320, 40, 55)
    g.fillStyle(0x555566, 0.5); g.fillRect(104, 324, 32, 47)
    gen(KEYS.BG_RUA_3, 200, 450)
```

---

- [ ] **Step 4.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 4.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema rua — hierarquia L1/L2/L3"
```

---

## Task 5: Redesenho tema `praca`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_praca_1`, `bg_praca_2`, `bg_praca_3`

- [ ] **Step 5.1: Reescrever bloco `bg_praca_1` (L1 — céu azul claro + 1 nuvem)**

```typescript
    // bg_praca_1: céu azul claro — gradiente 2 stops + 1 nuvem
    clr()
    g.fillStyle(0xa8d8ea); g.fillRect(0, 0, 200, 300)
    g.fillStyle(0xd9eeff); g.fillRect(0, 300, 200, 150)
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(80, 70, 100, 30)
    gen(KEYS.BG_PRACA_1, 200, 450)
```

---

- [ ] **Step 5.2: Reescrever bloco `bg_praca_2` (L2 — colinas + 2 árvores)**

```typescript
    // bg_praca_2: colinas + 2 árvores triangulares
    clr()
    g.fillStyle(0x7a9a6a); g.fillEllipse(100, 450, 260, 120)
    g.fillStyle(0x5a3a1a); g.fillRect(38, 280, 6, 100)
    g.fillStyle(0x4a6a3a); g.fillTriangle(20, 282, 41, 220, 62, 282)
    g.fillStyle(0x5a3a1a); g.fillRect(148, 290, 6, 90)
    g.fillStyle(0x4a6a3a); g.fillTriangle(130, 292, 151, 230, 172, 292)
    gen(KEYS.BG_PRACA_2, 200, 450)
```

---

- [ ] **Step 5.3: Reescrever bloco `bg_praca_3` (L3 — gramado + cerca de madeira)**

```typescript
    // bg_praca_3: gramado + cerca de madeira
    clr()
    g.fillStyle(0x5a8a4a); g.fillRect(0, 390, 200, 60)
    g.fillStyle(0x8B6914); g.fillRect(0, 370, 200, 8)
    g.fillStyle(0x8B6914); g.fillRect(0, 384, 200, 8)
    ;[8, 38, 68, 98, 128, 158, 188].forEach((px: number) => {
      g.fillStyle(0x7a5a10); g.fillRect(px, 360, 10, 40)
    })
    gen(KEYS.BG_PRACA_3, 200, 450)
```

---

- [ ] **Step 5.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 5.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema praca — hierarquia L1/L2/L3"
```

---

## Task 6: Redesenho tema `mercado`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_mercado_1`, `bg_mercado_2`, `bg_mercado_3`

- [ ] **Step 6.1: Reescrever bloco `bg_mercado_1` (L1 — pôr do sol dessaturado)**

```typescript
    // bg_mercado_1: pôr do sol — 2 stops dessaturados
    clr()
    g.fillStyle(0xd08840); g.fillRect(0, 0, 200, 200)
    g.fillStyle(0xc8a040); g.fillRect(0, 200, 200, 250)
    gen(KEYS.BG_MERCADO_1, 200, 450)
```

---

- [ ] **Step 6.2: Reescrever bloco `bg_mercado_2` (L2 — 2 galpões)**

```typescript
    // bg_mercado_2: 2 galpões em silhueta
    clr()
    g.fillStyle(0x5a4a3a); g.fillRect(0, 220, 95, 230)
    g.fillStyle(0x4a3a2a); g.fillRect(0, 190, 95, 32)
    g.fillStyle(0x5a4a3a); g.fillRect(105, 260, 95, 190)
    g.fillStyle(0x4a3a2a); g.fillRect(105, 235, 95, 28)
    gen(KEYS.BG_MERCADO_2, 200, 450)
```

---

- [ ] **Step 6.3: Reescrever bloco `bg_mercado_3` (L3 — chão + caixa + toldo)**

```typescript
    // bg_mercado_3: chão + caixa de madeira + toldo
    clr()
    g.fillStyle(0x888888); g.fillRect(0, 400, 200, 50)
    g.fillStyle(0x8B6030); g.fillRect(10, 340, 50, 60)
    g.fillStyle(0x7a5020); g.fillRect(10, 340, 50, 6)
    g.fillStyle(0x7a5020); g.fillRect(10, 360, 50, 4)
    g.fillStyle(0x7a5020); g.fillRect(28, 340, 4, 60)
    g.fillStyle(0xc84b32); g.fillRect(100, 300, 90, 22)
    g.fillStyle(0xaa3a24); g.fillRect(100, 300, 90, 4)
    gen(KEYS.BG_MERCADO_3, 200, 450)
```

---

- [ ] **Step 6.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 6.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema mercado — hierarquia L1/L2/L3"
```

---

## Task 7: Redesenho tema `boss`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `bg_boss_1`, `bg_boss_2`, `bg_boss_3`

**Nota:** `bg_boss_1` e `bg_boss_2` estão juntos (~linhas 688–712). `bg_boss_3` está mais abaixo no ficheiro (~linha 939). Reescrever os 3 nesta task.

- [ ] **Step 7.1: Reescrever bloco `bg_boss_1` (L1 — céu roxo + lua + 3 estrelas)**

```typescript
    // bg_boss_1: céu roxo-escuro + lua crescente + 3 estrelas
    clr()
    g.fillStyle(0x1a0a2e); g.fillRect(0, 0, 200, 280)
    g.fillStyle(0x2d1b4e); g.fillRect(0, 280, 200, 170)
    g.fillStyle(0xf0f0e0, 0.9); g.fillCircle(160, 60, 20)
    g.fillStyle(0x1a0a2e); g.fillCircle(152, 56, 16)
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(30, 40, 2, 2); g.fillRect(80, 25, 2, 2); g.fillRect(50, 90, 2, 2)
    gen(KEYS.BG_BOSS_1, 200, 450)
```

---

- [ ] **Step 7.2: Reescrever bloco `bg_boss_2` (L2 — 2 prédios quase-pretos)**

```typescript
    // bg_boss_2: 2 prédios quase-pretos com borda topo
    clr()
    g.fillStyle(0x1a1a2a); g.fillRect(0, 180, 80, 270)
    g.fillStyle(0x2a2a3a); g.fillRect(0, 178, 80, 4)
    g.fillStyle(0x1a1a2a); g.fillRect(100, 230, 100, 220)
    g.fillStyle(0x2a2a3a); g.fillRect(100, 228, 100, 4)
    gen(KEYS.BG_BOSS_2, 200, 450)
```

---

- [ ] **Step 7.3: Reescrever bloco `bg_boss_3` (L3 — grade metálica + chão)**

```typescript
    // bg_boss_3: grade metálica + chão escuro com reflexo
    clr()
    g.fillStyle(0x2a2a3a); g.fillRect(0, 395, 200, 55)
    g.fillStyle(0x3a3a4a); g.fillRect(0, 393, 200, 4)
    ;[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].forEach((px: number) => {
      g.fillStyle(0x444444); g.fillRect(px, 300, 6, 95)
    })
    g.fillStyle(0x444444); g.fillRect(0, 300, 200, 6)
    gen(KEYS.BG_BOSS_3, 200, 450)
```

---

- [ ] **Step 7.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 7.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema boss — hierarquia L1/L2/L3"
```

---

## Task 8: Redesenho tema `exterior`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `BG_EXT_1`, `BG_EXT_2`, `BG_EXT_3`

*Textura 480×450.*

- [ ] **Step 8.1: Reescrever bloco `BG_EXT_1` (L1 — céu noturno + lua)**

```typescript
    // BG_EXT_1: céu noturno azul-escuro + lua cheia
    clr()
    g.fillStyle(0x0a1628); g.fillRect(0, 0, 480, 280)
    g.fillStyle(0x1a2a44); g.fillRect(0, 280, 480, 170)
    g.fillStyle(0xfffff0, 0.9); g.fillCircle(380, 70, 28)
    gen(KEYS.BG_EXT_1, 480, 450)
```

---

- [ ] **Step 8.2: Reescrever bloco `BG_EXT_2` (L2 — fachada com 6 janelas)**

```typescript
    // BG_EXT_2: fachada de prédio + 6 janelas iluminadas
    clr()
    g.fillStyle(0x404850); g.fillRect(100, 100, 280, 350)
    ;[
      [130, 140], [220, 140], [310, 140],
      [130, 230], [220, 230], [310, 230],
    ].forEach(([wx, wy]: number[]) => {
      g.fillStyle(0xffe8a0, 0.8); g.fillRect(wx, wy, 50, 70)
    })
    gen(KEYS.BG_EXT_2, 480, 450)
```

---

- [ ] **Step 8.3: Reescrever bloco `BG_EXT_3` (L3 — grades + 2 arbustos + calçada)**

```typescript
    // BG_EXT_3: grades + arbustos + calçada
    clr()
    g.fillStyle(0x606060); g.fillRect(0, 400, 480, 50)
    g.fillStyle(0x505050); g.fillRect(0, 398, 480, 4)
    ;[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].forEach((px: number) => {
      g.fillStyle(0x333333); g.fillRect(px, 300, 6, 102)
    })
    g.fillStyle(0x333333); g.fillRect(0, 300, 480, 6)
    g.fillStyle(0x2a3a1a); g.fillEllipse(80, 395, 80, 40)
    g.fillStyle(0x2a3a1a); g.fillEllipse(380, 395, 90, 42)
    gen(KEYS.BG_EXT_3, 480, 450)
```

---

- [ ] **Step 8.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 8.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema exterior — hierarquia L1/L2/L3"
```

---

## Task 9: Redesenho tema `patio`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `BG_PATIO_1`, `BG_PATIO_2`, `BG_PATIO_3`

*Textura 480×450.*

- [ ] **Step 9.1: Reescrever bloco `BG_PATIO_1` (L1 — cinza-azul + 1 nuvem)**

```typescript
    // BG_PATIO_1: céu cinza-azul + 1 nuvem
    clr()
    g.fillStyle(0x5a6a7a); g.fillRect(0, 0, 480, 280)
    g.fillStyle(0x8a9aaa); g.fillRect(0, 280, 480, 170)
    g.fillStyle(0xcccccc, 0.5); g.fillEllipse(200, 80, 120, 32)
    gen(KEYS.BG_PATIO_1, 480, 450)
```

---

- [ ] **Step 9.2: Reescrever bloco `BG_PATIO_2` (L2 — muro de tijolo alternado)**

```typescript
    // BG_PATIO_2: muro de tijolo — fiadas alternadas
    clr()
    const bH = 18, bW = 60, mortH = 3, mortW = 3
    let row = 0
    for (let y = 200; y < 450; y += bH + mortH) {
      const offset = (row % 2 === 0) ? 0 : bW / 2
      for (let x = -offset; x < 480; x += bW + mortW) {
        g.fillStyle(row % 2 === 0 ? 0x7a5a4a : 0x6a4a3a)
        g.fillRect(x, y, bW, bH)
      }
      row++
    }
    gen(KEYS.BG_PATIO_2, 480, 450)
```

---

- [ ] **Step 9.3: Reescrever bloco `BG_PATIO_3` (L3 — paralelepípedo + varal)**

```typescript
    // BG_PATIO_3: paralelepípedo + varal com 2 peças de roupa
    clr()
    g.fillStyle(0x888888); g.fillRect(0, 400, 480, 50)
    ;[0, 48, 92, 140, 192, 240, 290, 340, 388, 438].forEach((px: number) => {
      g.fillStyle(0x666666); g.fillRect(px, 400, 2, 50)
    })
    ;[412, 430].forEach((py: number) => {
      g.fillStyle(0x666666); g.fillRect(0, py, 480, 2)
    })
    g.fillStyle(0x888888); g.fillRect(60, 300, 360, 3)
    g.fillStyle(0x555555); g.fillRect(60, 290, 4, 115)
    g.fillStyle(0x555555); g.fillRect(416, 290, 4, 115)
    g.fillStyle(0x4488cc); g.fillRect(140, 303, 30, 45)
    g.fillStyle(0xcc4444); g.fillRect(290, 303, 25, 40)
    gen(KEYS.BG_PATIO_3, 480, 450)
```

---

- [ ] **Step 9.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 9.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema patio — hierarquia L1/L2/L3"
```

---

## Task 10: Redesenho tema `telhado`

**Files:**
- Modify: `src/scenes/BootScene.ts` — blocos `BG_TELHADO_1`, `BG_TELHADO_2`, `BG_TELHADO_3`

*Textura 480×450.*

- [ ] **Step 10.1: Reescrever bloco `BG_TELHADO_1` (L1 — noturno profundo + lua + 8 estrelas)**

```typescript
    // BG_TELHADO_1: noturno profundo + lua + 8 estrelas
    clr()
    g.fillStyle(0x080818); g.fillRect(0, 0, 480, 300)
    g.fillStyle(0x141428); g.fillRect(0, 300, 480, 150)
    g.fillStyle(0xf0f0e0, 0.9); g.fillCircle(400, 80, 24)
    const tStars: number[][] = [[40,30],[120,60],[200,25],[280,50],[60,100],[160,80],[320,35],[440,65]]
    tStars.forEach(([sx, sy]: number[]) => { g.fillStyle(0xffffff, 0.7); g.fillRect(sx, sy, 2, 2) })
    gen(KEYS.BG_TELHADO_1, 480, 450)
```

---

- [ ] **Step 10.2: Reescrever bloco `BG_TELHADO_2` (L2 — caixa d'água + 2 antenas)**

```typescript
    // BG_TELHADO_2: caixa d'água + 2 antenas de TV
    clr()
    g.fillStyle(0x3a3a4a); g.fillRect(60, 240, 70, 60)
    g.fillStyle(0x2a2a3a); g.fillRect(60, 240, 70, 6)
    g.fillStyle(0x2a2a3a); g.fillRect(88, 220, 14, 22)
    g.fillStyle(0x2a2a2a); g.fillRect(260, 200, 4, 120)
    g.fillStyle(0x2a2a2a); g.fillRect(240, 210, 44, 3)
    g.fillStyle(0x2a2a2a); g.fillRect(360, 220, 4, 100)
    g.fillStyle(0x2a2a2a); g.fillRect(344, 230, 36, 3)
    gen(KEYS.BG_TELHADO_2, 480, 450)
```

---

- [ ] **Step 10.3: Reescrever bloco `BG_TELHADO_3` (L3 — telhas + calha)**

```typescript
    // BG_TELHADO_3: superfície de telhas + calha
    clr()
    ;[0, 1, 2, 3].forEach((i: number) => {
      g.fillStyle(i % 2 === 0 ? 0x4a3a2a : 0x3a2a1a)
      g.fillRect(0, 380 + i * 20, 480, 20)
    })
    g.fillStyle(0x606060); g.fillRect(0, 358, 480, 14)
    g.fillStyle(0x505050); g.fillRect(0, 356, 480, 4)
    ;[0, 60, 120, 180, 240, 300, 360, 420].forEach((px: number) => {
      g.fillStyle(0x2a1a0a, 0.4); g.fillRect(px, 380, 2, 70)
    })
    gen(KEYS.BG_TELHADO_3, 480, 450)
```

---

- [ ] **Step 10.4: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

---

- [ ] **Step 10.5: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): redesenho tema telhado — hierarquia L1/L2/L3"
```

---

## Task 11: Novo tema `rua_noite` — 3 blocos adicionados ao BootScene

**Files:**
- Modify: `src/scenes/BootScene.ts` — adicionar 3 blocos **novos** após o bloco `bg_boss_3`

**Instrução:** localizar a linha `gen(KEYS.BG_BOSS_3, 200, 450)` e inserir imediatamente a seguir (nova linha após o `gen`):

```typescript
    // ── Rua Noite backgrounds (World 3) ────────────────────────────────────────

    // BG_RUA_NOITE_1: céu roxo-azulado noturno + 2 estrelas + luar
    clr()
    g.fillStyle(0x0e0a1e); g.fillRect(0, 0, 480, 300)
    g.fillStyle(0x1a1232); g.fillRect(0, 300, 480, 150)
    g.fillStyle(0x8888cc, 0.15); g.fillEllipse(240, 330, 300, 60)
    g.fillStyle(0xffffff, 0.6); g.fillRect(60, 40, 2, 2); g.fillRect(300, 70, 2, 2)
    gen(KEYS.BG_RUA_NOITE_1, 480, 450)

    // BG_RUA_NOITE_2: prédios escuros com janelas iluminadas tênues
    clr()
    g.fillStyle(0x18141e); g.fillRect(0, 160, 130, 290)
    g.fillStyle(0xffe880, 0.5); g.fillRect(15, 185, 22, 30); g.fillRect(55, 185, 22, 30); g.fillRect(95, 185, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(15, 235, 22, 30); g.fillRect(95, 235, 22, 30)
    g.fillStyle(0x18141e); g.fillRect(150, 200, 150, 250)
    g.fillStyle(0xffe880, 0.5); g.fillRect(165, 225, 22, 30); g.fillRect(220, 225, 22, 30); g.fillRect(275, 225, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(165, 275, 22, 30)
    g.fillStyle(0x18141e); g.fillRect(315, 180, 165, 270)
    g.fillStyle(0xffe880, 0.5); g.fillRect(330, 205, 22, 30); g.fillRect(380, 205, 22, 30); g.fillRect(440, 205, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(330, 255, 22, 30); g.fillRect(440, 255, 22, 30)
    gen(KEYS.BG_RUA_NOITE_2, 480, 450)

    // BG_RUA_NOITE_3: calçada + poste com halo + grade baixa
    clr()
    g.fillStyle(0x4a4a5a); g.fillRect(0, 400, 480, 50)
    g.fillStyle(0x3a3a4a); g.fillRect(0, 398, 480, 4)
    g.fillStyle(0x888888, 0.9); g.fillRect(200, 300, 6, 102)
    g.fillStyle(0x888888, 0.9); g.fillRect(186, 300, 34, 5)
    g.fillStyle(0xffe080, 0.2); g.fillEllipse(220, 295, 70, 40)
    g.fillStyle(0x555565); g.fillRect(0, 380, 480, 6)
    ;[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450].forEach((px: number) => {
      g.fillStyle(0x555565); g.fillRect(px, 355, 5, 32)
    })
    gen(KEYS.BG_RUA_NOITE_3, 480, 450)
```

---

- [ ] **Step 11.2: Build check**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -5
```

Esperado: `✓ built in X.XXs` sem erros.

---

- [ ] **Step 11.3: Executar suite de testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -10
```

Esperado: `Tests 124 passed (124)`

---

- [ ] **Step 11.4: Commit final**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && git add src/scenes/BootScene.ts && git commit -m "feat(bg): adicionar tema rua_noite com layers próprias (BG_RUA_NOITE_1/2/3)"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Princípio L1/L2/L3 aplicado aos 10 temas (Tasks 2–11)
- ✅ Máx. 2 elementos em L1, 3 em L2, 4 em L3 — verificado em cada task
- ✅ `rua_noite` com keys próprias + ParallaxBackground actualizado (Task 1 + 11)
- ✅ Apenas 3 ficheiros modificados (`constants.ts`, `ParallaxBackground.ts`, `BootScene.ts`)
- ✅ Build + testes verificados (Tasks 2-10 verificam build; Task 11 verifica build + 124 testes)
- ✅ Nenhum asset externo — tudo procedural

**Placeholder scan:** nenhum TBD ou "implement later" ✅

**Consistência de types:** todos os `.forEach` usam anotação `: number[]` ou `: number` para evitar erros TypeScript em modo strict ✅
