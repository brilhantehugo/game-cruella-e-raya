# Visual Upgrade — Decorações e Densidade das Fases

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar 12 novos tipos de decoração canvas-drawn e aumentar a densidade em todos os 4 mundos, deixando cada fase com decoração a cada ~150–200px de mapa.

**Architecture:** Cada novo tipo tem key em `constants.ts`, geração canvas em `BootScene.create()`, e instâncias nas decorations de cada `WorldN.ts`. Decorações não-blocking usam `{ type, x, y }`, blocking usam `{ type, x, y, blocking: true }`. O `GameScene._buildDecorations()` resolve automaticamente pelo tipo.

**Tech Stack:** Phaser 3, TypeScript, canvas 2D API (via `g.fillStyle / fillRect / fillCircle / fillEllipse`), Vitest

---

## Arquivos modificados

| Arquivo | Operação |
|---|---|
| `src/constants.ts` | Adicionar 12 keys novas no objeto KEYS |
| `src/scenes/BootScene.ts` | Adicionar canvas para 12 novos tipos (após linha 1240) |
| `src/levels/World0.ts` | Adicionar instâncias + novos tipos em 6 níveis |
| `src/levels/World1.ts` | Adicionar instâncias + novos tipos em 5 níveis |
| `src/levels/World2.ts` | Adicionar instâncias + novos tipos em 5 níveis |
| `src/levels/World3.ts` | Adicionar instâncias + novos tipos em 5 níveis |
| `tests/VisualUpgradeDecoracoes.test.ts` | Criar — testa presença dos novos tipos |

---

## Task 1: constants.ts — 12 novas keys

**Files:**
- Modify: `src/constants.ts` (após a linha com `BALCAO: 'balcao'`)

- [ ] **Step 1: Abrir `src/constants.ts` e localizar o bloco de decorações**

Encontrar a linha com `BALCAO: 'balcao',` no objeto KEYS.

- [ ] **Step 2: Adicionar as 12 novas keys logo após `BALCAO`**

```typescript
  // decorações novas — apartamento interior
  QUADRO:   'quadro',
  PLANTA:   'planta',
  TAPETE:   'tapete',
  // decorações novas — estacionamento
  PILAR:    'pilar',
  BARREIRA: 'barreira',
  // decorações novas — rua
  ORELHAO:  'orelhao',
  SEMAFORO: 'semaforo',
  BANCA:    'banca',
  // decorações novas — praça
  FONTE:    'fonte',
  FLOREIRA: 'floreira',
  // decorações novas — noite
  OUTDOOR:  'outdoor',
  BUEIRO:   'bueiro',
```

- [ ] **Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -3
```
Esperado: `✓ built in Xs`

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts
git commit -m "feat(decor): adicionar 12 novas keys de decoração em constants.ts"
```

---

## Task 2: Testes — escrever testes que falham (TDD)

**Files:**
- Create: `tests/VisualUpgradeDecoracoes.test.ts`

- [ ] **Step 1: Criar o arquivo de teste**

```typescript
import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

// ── Novos tipos por mundo ─────────────────────────────────────────────────────

describe('World0 — apartamento tem quadro, planta e tapete', () => {
  it('0-1 tem planta', () => {
    expect(WORLD0_LEVELS['0-1'].decorations.some(d => d.type === 'planta')).toBe(true)
  })
  it('0-1 tem tapete', () => {
    expect(WORLD0_LEVELS['0-1'].decorations.some(d => d.type === 'tapete')).toBe(true)
  })
  it('0-1 tem quadro', () => {
    expect(WORLD0_LEVELS['0-1'].decorations.some(d => d.type === 'quadro')).toBe(true)
  })
})

describe('World0 — estacionamento tem pilar e barreira', () => {
  it('0-3 tem pilar', () => {
    expect(WORLD0_LEVELS['0-3'].decorations.some(d => d.type === 'pilar')).toBe(true)
  })
  it('0-3 tem barreira', () => {
    expect(WORLD0_LEVELS['0-3'].decorations.some(d => d.type === 'barreira')).toBe(true)
  })
  it('0-4 tem pilar', () => {
    expect(WORLD0_LEVELS['0-4'].decorations.some(d => d.type === 'pilar')).toBe(true)
  })
  it('0-5 tem pilar', () => {
    expect(WORLD0_LEVELS['0-5'].decorations.some(d => d.type === 'pilar')).toBe(true)
  })
})

describe('World1 — rua tem orelhao, semaforo e banca', () => {
  const allW1 = Object.values(WORLD1_LEVELS).flatMap(l => l.decorations)
  it('tem orelhao', () => { expect(allW1.some(d => d.type === 'orelhao')).toBe(true) })
  it('tem semaforo', () => { expect(allW1.some(d => d.type === 'semaforo')).toBe(true) })
  it('tem banca', () => { expect(allW1.some(d => d.type === 'banca')).toBe(true) })
})

describe('World2 — praça tem fonte e floreira', () => {
  const allW2 = Object.values(WORLD2_LEVELS).flatMap(l => l.decorations)
  it('tem fonte', () => { expect(allW2.some(d => d.type === 'fonte')).toBe(true) })
  it('tem floreira', () => { expect(allW2.some(d => d.type === 'floreira')).toBe(true) })
})

describe('World3 — noite tem outdoor e bueiro', () => {
  const allW3 = Object.values(WORLD3_LEVELS).flatMap(l => l.decorations)
  it('tem outdoor', () => { expect(allW3.some(d => d.type === 'outdoor')).toBe(true) })
  it('tem bueiro', () => { expect(allW3.some(d => d.type === 'bueiro')).toBe(true) })
})

// ── Densidade mínima ──────────────────────────────────────────────────────────

describe('Densidade mínima de decorações por fase', () => {
  it('0-1 tem pelo menos 18 decorações', () => {
    expect(WORLD0_LEVELS['0-1'].decorations.length).toBeGreaterThanOrEqual(18)
  })
  it('0-2 tem pelo menos 12 decorações', () => {
    expect(WORLD0_LEVELS['0-2'].decorations.length).toBeGreaterThanOrEqual(12)
  })
  it('0-3 tem pelo menos 20 decorações (carros + pilares + barreiras)', () => {
    expect(WORLD0_LEVELS['0-3'].decorations.length).toBeGreaterThanOrEqual(20)
  })
  it('1-1 tem pelo menos 14 decorações', () => {
    expect(WORLD1_LEVELS['1-1'].decorations.length).toBeGreaterThanOrEqual(14)
  })
})
```

- [ ] **Step 2: Rodar testes e verificar que FALHAM**

```bash
npm test -- tests/VisualUpgradeDecoracoes.test.ts 2>&1 | tail -15
```
Esperado: múltiplos FAIL (tipos não existem ainda nos mundos)

- [ ] **Step 3: Commit do arquivo de teste**

```bash
git add tests/VisualUpgradeDecoracoes.test.ts
git commit -m "test(decor): testes TDD para novos tipos e densidade de decorações"
```

---

## Task 3: BootScene — 12 novos tipos canvas-drawn

**Files:**
- Modify: `src/scenes/BootScene.ts` (após linha 1240, depois de `gen(KEYS.SEGURANCA_MOTO, 60, 50)`)

- [ ] **Step 1: Localizar o ponto de inserção**

Abrir `src/scenes/BootScene.ts`, ir para a linha ~1240 (após `gen(KEYS.SEGURANCA_MOTO, 60, 50)`). Adicionar o bloco abaixo imediatamente após.

- [ ] **Step 2: Adicionar os 12 novos canvas**

```typescript
    // ── DECORAÇÕES NOVAS — APARTAMENTO INTERIOR ──────────────────────────────
    // QUADRO: quadro/pintura pendurado na parede (48×36)
    clr()
    g.fillStyle(0x6b3a10); g.fillRect(0, 0, 48, 36)          // moldura marrom
    g.fillStyle(0x8b5a30); g.fillRect(0, 0, 48, 4)           // topo moldura
    g.fillStyle(0x4a8a4a); g.fillRect(4, 4, 40, 28)          // fundo pintura (verde)
    g.fillStyle(0x6abccc); g.fillRect(4, 4, 40, 12)          // céu azul
    g.fillStyle(0x5a7a2a); g.fillRect(4, 16, 40, 10)         // colinas verdes
    g.fillStyle(0x4a6a1a); g.fillRect(4, 22, 40, 10)         // terra / base
    g.fillStyle(0x3a7a3a); g.fillCircle(16, 18, 5)           // árvore esq
    g.fillStyle(0x3a7a3a); g.fillCircle(30, 16, 4)           // árvore dir
    g.fillStyle(0xffee88); g.fillCircle(36, 7, 3)            // sol
    gen(KEYS.QUADRO, 48, 36)

    // PLANTA: vaso com planta grande (32×48)
    clr()
    g.fillStyle(0x8b5c2a); g.fillRect(6, 28, 20, 20)         // vaso
    g.fillStyle(0x6b3c0a); g.fillRect(4, 44, 24, 4)          // base vaso
    g.fillStyle(0xaa7040); g.fillRect(8, 30, 6, 4)           // detalhe vaso
    g.fillStyle(0x1a7a1a); g.fillCircle(16, 20, 14)          // folhagem base
    g.fillStyle(0x2a9a2a); g.fillCircle(11, 12, 9)           // folhagem esq
    g.fillStyle(0x2a9a2a); g.fillCircle(22, 14, 8)           // folhagem dir
    g.fillStyle(0x3aaa3a); g.fillCircle(16, 6, 7)            // topo folhagem
    g.fillStyle(0x55cc55); g.fillCircle(10, 8, 4); g.fillCircle(22, 7, 3) // destaques
    gen(KEYS.PLANTA, 32, 48)

    // TAPETE: tapete listrado no chão (60×12)
    clr()
    g.fillStyle(0xb03020); g.fillRect(0, 0, 60, 12)          // fundo vermelho
    g.fillStyle(0xf0c050); g.fillRect(4, 2, 52, 8)           // área dourada
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 === 0 ? 0xc04030 : 0xe05040)
      g.fillRect(4 + i * 10, 3, 10, 2)                       // listras padrão
    }
    g.fillStyle(0x901010); g.fillRect(0, 0, 4, 12)           // borda esq
    g.fillStyle(0x901010); g.fillRect(56, 0, 4, 12)          // borda dir
    gen(KEYS.TAPETE, 60, 12)

    // ── DECORAÇÕES NOVAS — ESTACIONAMENTO ────────────────────────────────────
    // PILAR: pilar de concreto (24×80)
    clr()
    g.fillStyle(0x787878); g.fillRect(0, 0, 24, 80)          // corpo cinza
    g.fillStyle(0x909090); g.fillRect(2, 0, 4, 80)           // brilho lateral
    g.fillStyle(0x606060); g.fillRect(18, 0, 6, 80)          // sombra lateral
    g.fillStyle(0xffd040)                                      // listras amarelas de segurança
    for (let i = 0; i < 3; i++) {
      g.fillRect(0, i * 6, 24, 3)                             // faixas topo
    }
    g.fillStyle(0x505050); g.fillRect(0, 72, 24, 8)          // base
    gen(KEYS.PILAR, 24, 80)

    // BARREIRA: barreira plástica laranja (48×32)
    clr()
    g.fillStyle(0xff6600); g.fillRect(0, 4, 48, 20)          // corpo laranja
    g.fillStyle(0xffcc00); g.fillRect(0, 4, 48, 5)           // topo amarelo
    g.fillStyle(0x222222)                                      // listras escuras
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(i * 10, 4, i * 10 + 7, 4, i * 10, 12)  // triângulos
    }
    g.fillStyle(0xcc4400); g.fillRect(0, 24, 48, 8)          // base mais escura
    g.fillStyle(0xff8800); g.fillRect(2, 6, 10, 3)           // brilho
    gen(KEYS.BARREIRA, 48, 32)

    // ── DECORAÇÕES NOVAS — RUA ────────────────────────────────────────────────
    // ORELHAO: orelhão azul (24×56)
    clr()
    g.fillStyle(0x1a4a8a); g.fillRect(2, 4, 20, 6)           // arredondamento topo
    g.fillStyle(0x1a5a9a); g.fillRect(4, 8, 16, 44)          // corpo azul
    g.fillStyle(0x2a7add); g.fillRect(6, 10, 12, 36)         // face frontal
    g.fillStyle(0x88ccff); g.fillRect(7, 14, 10, 8)          // visor
    g.fillStyle(0xaaddff); g.fillRect(8, 15, 6, 4)           // reflexo visor
    g.fillStyle(0xffffff); g.fillRect(7, 26, 10, 14)         // teclado fundo
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        g.fillStyle(0x888888); g.fillRect(8 + c * 3, 27 + r * 4, 2, 3) // teclas
      }
    }
    g.fillStyle(0x1a4a8a); g.fillRect(8, 52, 8, 4)           // base
    gen(KEYS.ORELHAO, 24, 56)

    // SEMAFORO: semáforo de rua (16×64)
    clr()
    g.fillStyle(0x333333); g.fillRect(6, 20, 4, 44)          // poste
    g.fillStyle(0x444444); g.fillRect(4, 60, 8, 4)           // base
    g.fillStyle(0x222222); g.fillRect(2, 0, 12, 26)          // caixa luzes
    g.fillStyle(0x333333); g.fillRect(3, 1, 10, 24)          // face caixa
    g.fillStyle(0xff2222); g.fillCircle(8, 6, 4)             // vermelho
    g.fillStyle(0xffaa00); g.fillCircle(8, 13, 4)            // amarelo
    g.fillStyle(0x22cc22); g.fillCircle(8, 20, 4)            // verde
    gen(KEYS.SEMAFORO, 16, 64)

    // BANCA: banca de jornal (60×56)
    clr()
    g.fillStyle(0x8b5c2a); g.fillRect(0, 20, 60, 36)         // corpo madeira
    g.fillStyle(0x7a4e1a); g.fillRect(2, 22, 56, 32)         // face
    for (let i = 0; i < 4; i++) {                             // toldo listrado
      g.fillStyle(i % 2 === 0 ? 0xff2200 : 0xffffff)
      g.fillRect(i * 15, 10, 15, 12)
    }
    g.fillStyle(0xcc1100); g.fillRect(0, 20, 60, 2)          // borda toldo
    g.fillStyle(0xffffff); g.fillRect(4, 26, 52, 22)         // balcão branco
    ;([[6, 28, 0x3366cc], [18, 26, 0xff4422], [30, 28, 0x22aa44], [42, 27, 0xff8800]] as [number,number,number][]).forEach(([x, y, c]) => {
      g.fillStyle(c); g.fillRect(x, y, 10, 18)               // revistas
      g.fillStyle(0xffffff); g.fillRect(x + 1, y + 1, 8, 4) // manchete
    })
    g.fillStyle(0x6b3c0a); g.fillRect(0, 52, 60, 4)          // base
    gen(KEYS.BANCA, 60, 56)

    // ── DECORAÇÕES NOVAS — PRAÇA ──────────────────────────────────────────────
    // FONTE: fonte de praça (64×48)
    clr()
    g.fillStyle(0xaaaaaa); g.fillRect(4, 24, 56, 16)         // borda base
    g.fillStyle(0x999999); g.fillRect(8, 20, 48, 8)          // topo borda
    g.fillStyle(0x4488cc); g.fillRect(10, 22, 44, 12)        // água
    g.fillStyle(0x66aaee); g.fillRect(12, 24, 40, 6)         // reflexo água
    g.fillStyle(0x88ccff); g.fillRect(30, 8, 4, 18)          // jato principal
    g.fillStyle(0x99ddff); g.fillRect(29, 6, 2, 4)           // topo jato
    g.fillStyle(0xaaddff)                                      // spray lateral
    g.fillRect(24, 10, 2, 10); g.fillRect(38, 10, 2, 10)
    g.fillStyle(0x888888); g.fillRect(12, 38, 40, 8)         // plataforma base
    gen(KEYS.FONTE, 64, 48)

    // FLOREIRA: canteiro com flores (56×28)
    clr()
    g.fillStyle(0x8b5c2a); g.fillRect(0, 12, 56, 16)         // canteiro madeira
    g.fillStyle(0x7a4e1a); g.fillRect(0, 24, 56, 4)          // base canteiro
    g.fillStyle(0x5a380a); g.fillRect(2, 14, 52, 2)          // detalhe canteiro
    g.fillStyle(0x4a2a0a); g.fillRect(2, 8, 52, 6)           // terra
    ;([[6,0xffcc00],[14,0xff4444],[22,0xee44ee],[30,0xff8800],[38,0xffffff],[46,0xff44aa]] as [number,number][]).forEach(([x, c]) => {
      g.fillStyle(0x2a8a2a); g.fillRect(x + 2, 4, 2, 8)     // caule
      g.fillStyle(c); g.fillCircle(x + 3, 3, 4)              // flor
    })
    gen(KEYS.FLOREIRA, 56, 28)

    // ── DECORAÇÕES NOVAS — NOITE ──────────────────────────────────────────────
    // OUTDOOR: outdoor iluminado (80×56)
    clr()
    g.fillStyle(0x444444); g.fillRect(34, 36, 6, 20)         // poste central
    g.fillStyle(0x333333); g.fillRect(28, 52, 18, 4)         // base
    g.fillStyle(0x222222); g.fillRect(0, 0, 80, 38)          // moldura escura
    g.fillStyle(0xffffdd); g.fillRect(4, 4, 72, 30)          // painel iluminado
    g.fillStyle(0x3366cc); g.fillRect(6, 6, 24, 26)          // bloco esq (imagem)
    g.fillStyle(0x4488ee); g.fillRect(8, 8, 20, 16)          // foto
    g.fillStyle(0x222222); g.fillRect(34, 8, 38, 8)          // texto linha 1
    g.fillStyle(0x444444); g.fillRect(34, 20, 28, 6)         // texto linha 2
    g.fillStyle(0xff4400); g.fillRect(34, 30, 20, 6)         // destaque vermelho
    gen(KEYS.OUTDOOR, 80, 56)

    // BUEIRO: tampão de bueiro no chão (32×12)
    clr()
    g.fillStyle(0x555555); g.fillEllipse(16, 6, 30, 10)      // tampão oval
    g.fillStyle(0x444444); g.fillEllipse(16, 6, 26, 8)       // face
    g.fillStyle(0x555555); g.fillRect(4, 5, 24, 2)           // grade horizontal
    g.fillStyle(0x555555); g.fillRect(15, 1, 2, 10)          // grade vertical
    g.lineStyle(1, 0x666666); g.strokeEllipse(16, 6, 20, 6)  // anel interno
    gen(KEYS.BUEIRO, 32, 12)
```

- [ ] **Step 3: Build para verificar sem erros TypeScript**

```bash
npm run build 2>&1 | tail -3
```
Esperado: `✓ built in Xs`

- [ ] **Step 4: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat(decor): 12 novos tipos canvas-drawn no BootScene"
```

---

## Task 4: World0 — densidade + novos tipos

**Files:**
- Modify: `src/levels/World0.ts`

- [ ] **Step 1: Adicionar em LEVEL_0_1 (Sala de Estar) — após as decorações existentes**

Adicionar no array `decorations` de `LEVEL_0_1`:

```typescript
    // Novos — densidade + tipo
    { type: 'planta',  x: 530,  y: G },
    { type: 'tapete',  x: 800,  y: G },
    { type: 'quadro',  x: 1000, y: G - 80 },
    { type: 'planta',  x: 1630, y: G },
    { type: 'quadro',  x: 2160, y: G - 80 },
    { type: 'tapete',  x: 2380, y: G },
```

- [ ] **Step 2: Adicionar em LEVEL_0_2 (Corredor)**

Adicionar no array `decorations` de `LEVEL_0_2`:

```typescript
    { type: 'tapete',  x: 260,  y: G },
    { type: 'planta',  x: 500,  y: G },
    { type: 'quadro',  x: 760,  y: G - 80 },
    { type: 'tapete',  x: 1250, y: G },
    { type: 'planta',  x: 1540, y: G },
```

- [ ] **Step 3: Adicionar em LEVEL_0_3 (Estacionamento do Prédio)**

Adicionar no array `decorations` de `LEVEL_0_3`:

```typescript
    { type: 'pilar',    x: 350,  y: G, blocking: true },
    { type: 'barreira', x: 460,  y: G },
    { type: 'pilar',    x: 670,  y: G, blocking: true },
    { type: 'pilar',    x: 1000, y: G, blocking: true },
    { type: 'barreira', x: 1350, y: G },
    { type: 'pilar',    x: 1550, y: G, blocking: true },
    { type: 'pilar',    x: 2350, y: G, blocking: true },
```

- [ ] **Step 4: Adicionar em LEVEL_0_4 (Estacionamento Nível 1)**

```typescript
    { type: 'pilar',    x: 350,  y: G, blocking: true },
    { type: 'barreira', x: 450,  y: G },
    { type: 'pilar',    x: 650,  y: G, blocking: true },
    { type: 'pilar',    x: 1050, y: G, blocking: true },
    { type: 'barreira', x: 1150, y: G },
    { type: 'pilar',    x: 1750, y: G, blocking: true },
    { type: 'pilar',    x: 2100, y: G, blocking: true },
```

- [ ] **Step 5: Adicionar em LEVEL_0_5 (Estacionamento Nível 2)**

```typescript
    { type: 'pilar',    x: 300,  y: G, blocking: true },
    { type: 'barreira', x: 500,  y: G },
    { type: 'pilar',    x: 700,  y: G, blocking: true },
    { type: 'pilar',    x: 1100, y: G, blocking: true },
    { type: 'barreira', x: 1300, y: G },
    { type: 'pilar',    x: 1500, y: G, blocking: true },
    { type: 'pilar',    x: 1900, y: G, blocking: true },
    { type: 'pilar',    x: 2600, y: G, blocking: true },
```

- [ ] **Step 6: Adicionar em LEVEL_0_BOSS (Lobby)**

```typescript
    { type: 'planta',  x: 400,  y: G },
    { type: 'tapete',  x: 600,  y: G },
    { type: 'quadro',  x: 700,  y: G - 80 },
    { type: 'planta',  x: 1000, y: G },
    { type: 'quadro',  x: 1400, y: G - 80 },
```

- [ ] **Step 7: Rodar testes e verificar que passam (World0)**

```bash
npm test -- tests/VisualUpgradeDecoracoes.test.ts 2>&1 | grep -E "PASS|FAIL|✓|✗" | head -20
```
Esperado: testes de World0 passando

- [ ] **Step 8: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World0.ts
git commit -m "feat(decor): World0 — pilar/barreira estacionamento + planta/quadro/tapete apartamento"
```

---

## Task 5: World1 — densidade + novos tipos

**Files:**
- Modify: `src/levels/World1.ts`

- [ ] **Step 1: Adicionar em LEVEL_1_1 (Rua Residencial)**

Adicionar no array `decorations` de `LEVEL_1_1`:

```typescript
    { type: 'orelhao',  x: 820,  y: G },
    { type: 'semaforo', x: 960,  y: G },
    { type: 'banca',    x: 1600, y: G },
    { type: 'orelhao',  x: 2200, y: G },
    { type: 'semaforo', x: 2700, y: G },
```

- [ ] **Step 2: Adicionar em LEVEL_1_2 (Beco Escuro)**

No array `decorations` de `LEVEL_1_2`, adicionar:

```typescript
    { type: 'orelhao',  x: 500,  y: G },
    { type: 'semaforo', x: 1000, y: G },
    { type: 'orelhao',  x: 1800, y: G },
```

- [ ] **Step 3: Adicionar em LEVEL_1_3 (Praça com Jardim)**

```typescript
    { type: 'banca',    x: 600,  y: G },
    { type: 'semaforo', x: 1200, y: G },
    { type: 'orelhao',  x: 2000, y: G },
    { type: 'banca',    x: 2600, y: G },
```

- [ ] **Step 4: Adicionar em LEVEL_1_4 (Parque da Cidade)**

```typescript
    { type: 'orelhao',  x: 400,  y: G },
    { type: 'semaforo', x: 900,  y: G },
    { type: 'banca',    x: 1500, y: G },
    { type: 'semaforo', x: 2200, y: G },
```

- [ ] **Step 5: Adicionar em LEVEL_1_5 (Mercadinho)**

```typescript
    { type: 'orelhao',  x: 350,  y: G },
    { type: 'banca',    x: 800,  y: G },
    { type: 'semaforo', x: 1400, y: G },
    { type: 'banca',    x: 2000, y: G },
```

- [ ] **Step 6: Rodar testes World1 e verificar**

```bash
npm test -- tests/VisualUpgradeDecoracoes.test.ts 2>&1 | grep -E "World1|✓|✗" | head -10
```

- [ ] **Step 7: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World1.ts
git commit -m "feat(decor): World1 — orelhao, semaforo e banca em todos os níveis de rua"
```

---

## Task 6: World2 — densidade + novos tipos

**Files:**
- Modify: `src/levels/World2.ts`

- [ ] **Step 1: Adicionar em LEVEL_2_1 (Passeio Público)**

No array `decorations` de `LEVEL_2_1` (existentes: poste@200, lixeira@450, arvore@700, banco@950, poste@1200, lixeira@1700, arvore@1950, grade@2200, grade@2400), adicionar:

```typescript
    { type: 'fonte',    x: 600,  y: G },
    { type: 'floreira', x: 900,  y: G },
    { type: 'floreira', x: 1500, y: G },
    { type: 'fonte',    x: 2000, y: G },
```

- [ ] **Step 2: Adicionar em LEVEL_2_2 (Pátio Interior)**

```typescript
    { type: 'fonte',    x: 800,  y: G },
    { type: 'floreira', x: 400,  y: G },
    { type: 'floreira', x: 1500, y: G },
    { type: 'fonte',    x: 2400, y: G },
```

- [ ] **Step 3: Adicionar em LEVEL_2_3 (Garagem de Serviço)**

```typescript
    { type: 'floreira', x: 560,  y: G },
    { type: 'floreira', x: 1200, y: G },
    { type: 'floreira', x: 2100, y: G },
```

- [ ] **Step 4: Adicionar em LEVEL_2_4 (Escadas de Emergência)**

```typescript
    { type: 'fonte',    x: 500,  y: G },
    { type: 'floreira', x: 800,  y: G },
    { type: 'floreira', x: 1600, y: G },
```

- [ ] **Step 5: Adicionar em LEVEL_2_5 (Varandas / Fachada)**

```typescript
    { type: 'floreira', x: 400,  y: G },
    { type: 'fonte',    x: 1000, y: G },
    { type: 'floreira', x: 1600, y: G },
    { type: 'floreira', x: 2400, y: G },
```

- [ ] **Step 6: Rodar testes World2 e verificar**

```bash
npm test -- tests/VisualUpgradeDecoracoes.test.ts 2>&1 | grep -E "World2|✓|✗" | head -10
```

- [ ] **Step 7: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World2.ts
git commit -m "feat(decor): World2 — fonte e floreira em todos os níveis de praça"
```

---

## Task 7: World3 — densidade + novos tipos

**Files:**
- Modify: `src/levels/World3.ts`

**Nota:** decorações do World3 usam `y: 388` (não `y: G`). Manter consistência.

- [ ] **Step 1: Adicionar em LEVEL_3_1 (Passeio Nocturno)**

Verificar decorations de `LEVEL_3_1` (existentes: poste, arvore, lixeira, banco, poste, arvore, lixeira, poste, banco, arvore, lixeira, poste) e adicionar:

```typescript
    { type: 'outdoor',  x: 600,  y: 388 },
    { type: 'bueiro',   x: 300,  y: 388 },
    { type: 'bueiro',   x: 750,  y: 388 },
    { type: 'outdoor',  x: 1400, y: 388 },
    { type: 'bueiro',   x: 1100, y: 388 },
    { type: 'bueiro',   x: 1800, y: 388 },
```

- [ ] **Step 2: Adicionar em LEVEL_3_2 (Parque de Noite)**

```typescript
    { type: 'outdoor',  x: 500,  y: 388 },
    { type: 'bueiro',   x: 280,  y: 388 },
    { type: 'bueiro',   x: 680,  y: 388 },
    { type: 'outdoor',  x: 1300, y: 388 },
    { type: 'bueiro',   x: 1050, y: 388 },
    { type: 'bueiro',   x: 1820, y: 388 },
```

- [ ] **Step 3: Adicionar em LEVEL_3_3 (Travessa Escura)**

```typescript
    { type: 'bueiro',   x: 300,  y: 388 },
    { type: 'outdoor',  x: 600,  y: 388 },
    { type: 'bueiro',   x: 900,  y: 388 },
    { type: 'bueiro',   x: 1300, y: 388 },
    { type: 'outdoor',  x: 1600, y: 388 },
    { type: 'bueiro',   x: 1900, y: 388 },
```

- [ ] **Step 4: Adicionar em LEVEL_3_4 (Supermercado 24h)**

```typescript
    { type: 'outdoor',  x: 400,  y: 388 },
    { type: 'bueiro',   x: 650,  y: 388 },
    { type: 'outdoor',  x: 1200, y: 388 },
    { type: 'bueiro',   x: 1500, y: 388 },
```

- [ ] **Step 5: Adicionar em LEVEL_3_5 (Regresso ao Prédio)**

```typescript
    { type: 'bueiro',   x: 250,  y: 388 },
    { type: 'outdoor',  x: 550,  y: 388 },
    { type: 'bueiro',   x: 850,  y: 388 },
    { type: 'outdoor',  x: 1300, y: 388 },
    { type: 'bueiro',   x: 1600, y: 388 },
```

- [ ] **Step 6: Rodar todos os testes e verificar que passam**

```bash
npm test 2>&1 | tail -8
```
Esperado: `Tests 274+ passed` (todos os originais + novos passando)

- [ ] **Step 7: Build + commit**

```bash
npm run build 2>&1 | tail -3
git add src/levels/World3.ts
git commit -m "feat(decor): World3 — outdoor e bueiro em todos os níveis noturnos"
```

---

## Task 8: Pixel Lab — gerar PNGs e substituir canvas (Enhancement)

**Pré-condição:** Tasks 1–7 completas. Esta task é enhancement — se `create_object` falhar, manter canvas.

**Files:**
- Create: `public/sprites/decorations/` (diretório novo)
- Modify: `src/scenes/BootScene.ts` (preload: substituir canvas por load.image para os 10 elementos)

- [ ] **Step 1: Criar diretório**

```bash
mkdir -p /Users/apple/Desktop/github/game-cruella-e-raya/public/sprites/decorations
```

- [ ] **Step 2: Gerar sprites via Pixel Lab `create_object`**

Para cada elemento abaixo, chamar o MCP `mcp__pixellab__create_object` com:
- `description`: texto indicado
- `width` e `height`: dimensões indicadas
- Salvar PNG resultante em `public/sprites/decorations/<nome>.png`

| Elemento | Dimensões | Description |
|---|---|---|
| casa | 96×80 | `residential building facade, side view, 2 floors, door and 4 windows, pixel art, 16-bit style` |
| loja | 80×64 | `small shop front with striped awning, side view, display window with products, pixel art, 16-bit` |
| arvore | 40×80 | `urban tree, thick trunk and round leafy top, green foliage, pixel art side view, 16-bit` |
| poste | 16×80 | `street lamp post, metal pole with light at top, pixel art, 16-bit` |
| banco | 52×32 | `wooden park bench, side view, two legs, pixel art, 16-bit` |
| carro | 80×46 | `parked car, side view, 4 wheels visible, pixel art, 16-bit style` |
| cadeira | 34×48 | `wooden kitchen chair, side view, backrest and four legs, pixel art, 16-bit` |
| mesa | 80×48 | `dining table, side view, two legs and flat top, pixel art, 16-bit` |
| grade | 40×64 | `metal fence with vertical bars, front view, pixel art, 16-bit` |
| fogao | 48×60 | `kitchen stove with 4 burners on top and oven door, front view, pixel art, 16-bit` |

Se algum `create_object` retornar erro, **pular aquele elemento** e manter canvas.

- [ ] **Step 3: Para cada PNG gerado com sucesso, substituir em BootScene preload()**

Localizar em `src/scenes/BootScene.ts` o `preload()` (linha ~9). Adicionar após os `this.load.image` dos NPCs:

```typescript
    // Decorações PNG (geradas pelo Pixel Lab — substitui canvas no create())
    this.load.image(KEYS.CASA,      'sprites/decorations/casa.png')
    this.load.image(KEYS.LOJA,      'sprites/decorations/loja.png')
    this.load.image(KEYS.ARVORE,    'sprites/decorations/arvore.png')
    this.load.image(KEYS.POSTE,     'sprites/decorations/poste.png')
    this.load.image(KEYS.BANCO,     'sprites/decorations/banco.png')
    this.load.image(KEYS.CARRO,     'sprites/decorations/carro.png')
    this.load.image(KEYS.CADEIRA,   'sprites/decorations/cadeira.png')
    this.load.image(KEYS.MESA,      'sprites/decorations/mesa.png')
    this.load.image(KEYS.GRADE,     'sprites/decorations/grade.png')
    this.load.image(KEYS.FOGAO,     'sprites/decorations/fogao.png')
```

**Remover** os blocos `clr() / g.fillStyle... / gen(KEYS.X, w, h)` correspondentes no `create()` para os 10 elementos cujos PNGs foram gerados.

**Não remover** o canvas de elementos cujo Pixel Lab falhou.

- [ ] **Step 4: Build + testes**

```bash
npm run build 2>&1 | tail -3 && npm test 2>&1 | tail -5
```
Esperado: build OK, todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add public/sprites/decorations/ src/scenes/BootScene.ts
git commit -m "feat(decor): substituir canvas-drawn por PNG Pixel Lab para decorações principais"
```

---

## Task 9: Push final

- [ ] **Step 1: Rodar suite completa**

```bash
npm test 2>&1 | tail -5
```
Esperado: todos os testes passando (incluindo os 19 novos de VisualUpgradeDecoracoes)

- [ ] **Step 2: Push para remote**

```bash
git push origin main
```
