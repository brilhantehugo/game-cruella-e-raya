# Pixel Art Sprites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar suporte a sprites PNG reais para Aspirador, Drone, Segurança na Moto e Zelador — substituindo geração procedural (canvas) e tint placeholder — com fallback automático se os PNGs ainda não existirem.

**Architecture:** Dois entregáveis independentes: (1) `docs/sprite-prompts.md` com guia de geração para o usuário; (2) integração no `BootScene.ts` — `preload()` tenta carregar os PNGs reais, e cada bloco `gen()` é envolvido com `if (!this.textures.exists(...))` para fallback automático. `Zelador.ts` passa a usar `KEYS.ZELADOR` em vez de `KEYS.HUGO` + tint.

**Tech Stack:** TypeScript, Phaser 3, Vitest (testes), GPT Image 2.0 + Nano Banana 2 (geração de sprites — feita manualmente pelo usuário)

---

## Estrutura de Arquivos

```
docs/sprite-prompts.md                        ← Criar: guia de geração de sprites
src/scenes/BootScene.ts                       ← Modificar: preload() + guards em gen()
src/entities/enemies/Zelador.ts               ← Modificar: KEYS.ZELADOR + remover tint
tests/ZeladorSprite.test.ts                   ← Criar: verifica que Zelador usa key próprio
```

---

### Task 1: Criar `docs/sprite-prompts.md`

**Files:**
- Create: `docs/sprite-prompts.md`

Este arquivo é o guia prático para o usuário gerar os sprites no ChatGPT. Não há código — apenas documentação e prompts prontos para copiar-colar.

- [ ] **Step 1: Criar o arquivo `docs/sprite-prompts.md`**

```markdown
# Guia de Geração de Sprites — GPT Image 2.0 + Nano Banana 2

## Ferramenta

- **ChatGPT** com modelo GPT-4o (acesso a GPT Image 2.0)
- **Estilo:** Nano Banana 2
  - Clique no ícone de imagem → selecione estilo → procure "Nano Banana 2"
  - Ou inclua `"Nano Banana 2 pixel art style"` no prompt

## Prompt Base

```
true pixel art, [DESCRIÇÃO], [W]x[H] pixel canvas, transparent background,
Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, no blur,
game sprite, side view
```

## Prompts por Personagem

### Aspirador (Wall-E) — 36×20 px → `public/sprites/aspirador.png`

```
true pixel art, robotic vacuum cleaner robot, oval flat disc body viewed from the side,
white-grey body, orange circular LiDAR dome on top-left, small cyan camera eye on right side,
dark grey wheels protruding below, ventilation slits on left edge, grey stripe along middle,
36x20 pixel canvas, transparent background, Nano Banana 2 style, pixel-grid aligned,
no anti-aliasing, game sprite, side view
```

### Drone de Vigilância — 32×18 px → `public/sprites/drone.png`

```
true pixel art, surveillance drone robot, rectangular dark blue-grey body,
large cyan camera lens centered on front face, symmetric propeller rotors on left and right sides,
dark navy color scheme with blue accent outlines, 32x18 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

### Segurança na Moto — 60×50 px → `public/sprites/seguranca-moto.png`

```
true pixel art, security guard riding a dark motorcycle, side view facing left,
dark navy blue motorcycle body with two black wheels, yellow headlight on the left (front),
rider wearing dark navy uniform, black helmet with golden visor, 60x50 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

### Zelador — 48×48 px → `public/sprites/zelador.png`

```
true pixel art, building janitor man, side view patrol pose, grey work uniform with apron,
metal key hanging from belt, holding a mop, angry scowling expression, 48x48 pixel canvas,
transparent background, Nano Banana 2 style, pixel-grid aligned, no anti-aliasing, game sprite, side view
```

## Checklist de Qualidade

Antes de salvar cada PNG:
- [ ] Pixels alinhados em grid (sem pixels "meio-pixel" ou anti-aliasing)
- [ ] Fundo transparente (não branco)
- [ ] Tamanho exato conforme spec acima
- [ ] Personagem reconhecível e lê-se bem em escala 2–2.5×
- [ ] Paleta de cores coerente com o estilo visual urbano do jogo

## Fluxo de Uso

1. Copiar o prompt do personagem desejado
2. Colar no ChatGPT com estilo Nano Banana 2 selecionado
3. Revisar resultado → se aprovado, baixar PNG
4. Salvar em `public/sprites/` com o nome exato indicado
5. `npm run build` → testar no jogo (o sprite aparece automaticamente)

> Deletar o PNG a qualquer momento reverte para o sprite procedural (fallback automático).
```

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

```bash
ls docs/sprite-prompts.md
wc -l docs/sprite-prompts.md
```

Expected: arquivo existe com mais de 50 linhas.

- [ ] **Step 3: Commit**

```bash
git add docs/sprite-prompts.md
git commit -m "docs: add sprite-prompts.md — guia GPT Image 2.0 + Nano Banana 2"
```

---

### Task 2: Integrar carregamento de sprites em `BootScene.ts`

**Context:** `BootScene.ts` tem dois momentos relevantes:
- `preload()` (linhas 9–57): carrega assets reais via `load.image()` / `load.spritesheet()`
- `create()` (a partir da linha ~58): gera sprites procedurais via `gen()`

Os 3 sprites procedurais estão nas linhas:
- Aspirador: bloco completo em `1150–1199` terminando em `gen(KEYS.ASPIRADOR, AW, AH)`
- Drone: bloco em `1201–1209` terminando em `gen(KEYS.DRONE, 32, 18)`
- Segurança Moto: bloco em `1223–1240` terminando em `gen(KEYS.SEGURANCA_MOTO, 60, 50)`

**Files:**
- Modify: `src/scenes/BootScene.ts` (linhas 32 e 1150–1240)

- [ ] **Step 1: Adicionar `load.image()` no final do bloco de preload (após linha 32)**

Localizar esta linha em `preload()`:
```typescript
    this.load.image(KEYS.ZELADOR_BOSS, 'sprites/zelador-boss.png')
```

Adicionar IMEDIATAMENTE após ela:
```typescript
    // Sprites gerados com GPT Image 2.0 — fallback procedural em create() se PNG não existir
    this.load.image(KEYS.ASPIRADOR,      'sprites/aspirador.png')
    this.load.image(KEYS.DRONE,          'sprites/drone.png')
    this.load.image(KEYS.SEGURANCA_MOTO, 'sprites/seguranca-moto.png')
    this.load.image(KEYS.ZELADOR,        'sprites/zelador.png')
```

- [ ] **Step 2: Envolver o bloco do Aspirador com guard**

Localizar o início do bloco (comentário + clr()):
```typescript
    // ── ASPIRADOR: robô aspirador (disco branco, vista lateral) ──────────────
    // Inspirado em robô Xiaomi: corpo oval achatado, sensor LiDAR laranja,
    // câmera ciano, ventilação lateral, rodas embaixo
    clr()
```

Adicionar `if (!this.textures.exists(KEYS.ASPIRADOR)) {` ANTES do comentário, e `}` APÓS `gen(KEYS.ASPIRADOR, AW, AH)`:

```typescript
    if (!this.textures.exists(KEYS.ASPIRADOR)) {
      // ── ASPIRADOR: robô aspirador (disco branco, vista lateral) ──────────────
      // Inspirado em robô Xiaomi: corpo oval achatado, sensor LiDAR laranja,
      // câmera ciano, ventilação lateral, rodas embaixo
      clr()
      const AW = 36, AH = 20
      // Sombra suave embaixo
      g.fillStyle(0xcccccc, 0.4)
      g.fillEllipse(AW / 2 + 1, AH - 1, AW - 4, 5)
      // Corpo principal — oval branco-gelo
      g.fillStyle(0xf4f4f4)
      g.fillEllipse(AW / 2, AH / 2 - 1, AW - 2, AH - 6)
      // Faixa divisória cinza (lateral do disco — vista de lado)
      g.fillStyle(0xbbbbbb)
      g.fillRect(3, AH / 2 + 1, AW - 6, 3)
      // Sensor LiDAR (domo laranja/âmbar — posicionado no terço esquerdo do topo)
      g.fillStyle(0xee7700)
      g.fillCircle(11, 5, 5)
      g.fillStyle(0xffaa22)
      g.fillCircle(10, 4, 3)
      g.fillStyle(0xffcc66)
      g.fillCircle(9, 3, 1)       // reflexo brilhante
      // Base do sensor LiDAR
      g.fillStyle(0xdddddd)
      g.fillRect(7, 8, 8, 2)
      // Câmera/olho (círculo ciano pequeno — lado direito)
      g.fillStyle(0x00ccff)
      g.fillCircle(24, 7, 2)
      g.fillStyle(0x88eeff)
      g.fillCircle(23, 6, 1)      // reflexo
      // Botão power (retângulo arredondado — extremo direito)
      g.fillStyle(0xdddddd)
      g.fillRect(28, 7, 5, 3)
      g.lineStyle(0.5, 0xaaaaaa); g.strokeRect(28, 7, 5, 3)
      // Ventilação (listras escuras — lado esquerdo)
      g.fillStyle(0x999999)
      g.fillRect(2, 10, 4, 1)
      g.fillRect(2, 12, 4, 1)
      g.fillRect(2, 14, 4, 1)
      g.fillRect(2, 16, 3, 1)
      // Rodas (elipses escuras embaixo)
      g.fillStyle(0x444444)
      g.fillEllipse(9,       AH - 2, 8, 4)   // roda esquerda
      g.fillEllipse(AW - 9,  AH - 2, 8, 4)   // roda direita
      g.fillStyle(0x666666)
      g.fillEllipse(9,      AH - 3, 5, 2)    // brilho roda esq
      g.fillEllipse(AW - 9, AH - 3, 5, 2)    // brilho roda dir
      // Contorno suave do corpo
      g.lineStyle(1, 0xaaaaaa, 0.6)
      g.strokeEllipse(AW / 2, AH / 2 - 1, AW - 2, AH - 6)
      gen(KEYS.ASPIRADOR, AW, AH)
    }
```

- [ ] **Step 3: Envolver o bloco do Drone com guard**

Localizar:
```typescript
    // DRONE: robô voador — corpo cinza escuro com câmera ciana 32×18
    clr()
    g.fillStyle(0x333344); g.fillRect(2, 6, 28, 10)
    g.fillStyle(0x444455); g.fillRect(4, 7, 24, 8)
    g.fillStyle(0x22ccff); g.fillRect(13, 8, 6, 6)
    g.fillStyle(0x222233); g.fillRect(0, 4, 6, 4)
    g.fillStyle(0x222233); g.fillRect(26, 4, 6, 4)
    g.lineStyle(1, 0x5555aa); g.strokeRect(2, 6, 28, 10)
    gen(KEYS.DRONE, 32, 18)
```

Substituir por:
```typescript
    if (!this.textures.exists(KEYS.DRONE)) {
      // DRONE: robô voador — corpo cinza escuro com câmera ciana 32×18
      clr()
      g.fillStyle(0x333344); g.fillRect(2, 6, 28, 10)
      g.fillStyle(0x444455); g.fillRect(4, 7, 24, 8)
      g.fillStyle(0x22ccff); g.fillRect(13, 8, 6, 6)
      g.fillStyle(0x222233); g.fillRect(0, 4, 6, 4)
      g.fillStyle(0x222233); g.fillRect(26, 4, 6, 4)
      g.lineStyle(1, 0x5555aa); g.strokeRect(2, 6, 28, 10)
      gen(KEYS.DRONE, 32, 18)
    }
```

- [ ] **Step 4: Envolver o bloco da Segurança na Moto com guard**

Localizar:
```typescript
    // ── VEÍCULO — SEGURANÇA EM MOTO (moto escura + rider + farol) ────────────
    clr()
    // Moto — corpo
    g.fillStyle(0x1a1a2a); g.fillRect(10, 22, 40, 16)     // chassis
    g.fillStyle(0x2a2a3a); g.fillRect(8, 18, 44, 8)       // carenagem
    // Rodas
    g.fillStyle(0x111111); g.fillCircle(18, 38, 10)        // roda traseira
    g.fillStyle(0x111111); g.fillCircle(46, 38, 10)        // roda dianteira
    g.fillStyle(0x333333); g.fillCircle(18, 38, 6)         // jante traseira
    g.fillStyle(0x333333); g.fillCircle(46, 38, 6)         // jante dianteira
    // Farol (frente → esquerda, moto vai para a esquerda)
    g.fillStyle(0xffee44); g.fillEllipse(8, 22, 12, 8)     // farol amarelo
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(7, 21, 6, 4) // brilho
    // Piloto
    g.fillStyle(0x223344); g.fillRect(24, 8, 14, 14)       // torso uniforme
    g.fillStyle(0x111111); g.fillRect(25, 4, 10, 7)        // capacete
    g.fillStyle(0xffcc00); g.fillRect(26, 5, 8, 3)         // visor dourado
    gen(KEYS.SEGURANCA_MOTO, 60, 50)
```

Substituir por:
```typescript
    if (!this.textures.exists(KEYS.SEGURANCA_MOTO)) {
      // ── VEÍCULO — SEGURANÇA EM MOTO (moto escura + rider + farol) ────────────
      clr()
      // Moto — corpo
      g.fillStyle(0x1a1a2a); g.fillRect(10, 22, 40, 16)     // chassis
      g.fillStyle(0x2a2a3a); g.fillRect(8, 18, 44, 8)       // carenagem
      // Rodas
      g.fillStyle(0x111111); g.fillCircle(18, 38, 10)        // roda traseira
      g.fillStyle(0x111111); g.fillCircle(46, 38, 10)        // roda dianteira
      g.fillStyle(0x333333); g.fillCircle(18, 38, 6)         // jante traseira
      g.fillStyle(0x333333); g.fillCircle(46, 38, 6)         // jante dianteira
      // Farol (frente → esquerda, moto vai para a esquerda)
      g.fillStyle(0xffee44); g.fillEllipse(8, 22, 12, 8)     // farol amarelo
      g.fillStyle(0xffffff, 0.6); g.fillEllipse(7, 21, 6, 4) // brilho
      // Piloto
      g.fillStyle(0x223344); g.fillRect(24, 8, 14, 14)       // torso uniforme
      g.fillStyle(0x111111); g.fillRect(25, 4, 10, 7)        // capacete
      g.fillStyle(0xffcc00); g.fillRect(26, 5, 8, 3)         // visor dourado
      gen(KEYS.SEGURANCA_MOTO, 60, 50)
    }
```

- [ ] **Step 5: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Expected: nenhum erro de TypeScript.

- [ ] **Step 6: Commit**

```bash
git add src/scenes/BootScene.ts
git commit -m "feat: load real PNG sprites for Aspirador/Drone/SegurancaMoto/Zelador with procedural fallback"
```

---

### Task 3: Atualizar `Zelador.ts` para usar sprite próprio

**Files:**
- Modify: `src/entities/enemies/Zelador.ts`
- Create: `tests/ZeladorSprite.test.ts`

- [ ] **Step 1: Escrever o teste que vai falhar**

Criar `tests/ZeladorSprite.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { KEYS } from '../src/constants'

describe('Zelador', () => {
  it('source usa KEYS.ZELADOR (não KEYS.HUGO) como texture key', () => {
    const source = readFileSync('src/entities/enemies/Zelador.ts', 'utf-8')
    expect(source).toContain('KEYS.ZELADOR')
    expect(source).not.toContain('KEYS.HUGO')
  })

  it('source não chama setTint (placeholder removido)', () => {
    const source = readFileSync('src/entities/enemies/Zelador.ts', 'utf-8')
    expect(source).not.toContain('setTint')
  })

  it('KEYS.ZELADOR está definido e é distinto de KEYS.HUGO', () => {
    expect(KEYS.ZELADOR).toBeDefined()
    expect(KEYS.ZELADOR).toBe('zelador')
    expect(KEYS.ZELADOR).not.toBe(KEYS.HUGO)
  })
})
```

- [ ] **Step 2: Rodar o teste — verificar que falha**

```bash
npm test -- tests/ZeladorSprite.test.ts
```

Expected: FAIL — `expected 'hugo' to be 'zelador'` (Zelador ainda usa KEYS.HUGO).

- [ ] **Step 3: Atualizar `Zelador.ts`**

Arquivo atual (`src/entities/enemies/Zelador.ts`):
```typescript
import { HumanEnemy, type HumanConfig } from './HumanEnemy';
import { KEYS } from '../../constants';

/**
 * Zelador — guarda rápido com campo de visão amplo.
 * Usa sprite do Hugo com tint cinzento.
 */
export class Zelador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange: 250,
      coneAngle: 80,
      chaseSpeed: 130,
      patrolSpeed: 70,
      attackRange: 40,
      cooldownDuration: 800,
      hearingRadius: 180,
      patrolRange: 220,
    };

    super(scene, x, y, KEYS.HUGO, config);
    this.setTint(0xdddddd);
  }
}
```

Novo conteúdo:
```typescript
import { HumanEnemy, type HumanConfig } from './HumanEnemy';
import { KEYS } from '../../constants';

/**
 * Zelador — guarda rápido com campo de visão amplo.
 * Sprite: public/sprites/zelador.png (48×48, gerado com GPT Image 2.0 + Nano Banana 2).
 * Fallback: BootScene gera sprite procedural se o PNG não existir.
 */
export class Zelador extends HumanEnemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const config: HumanConfig = {
      detectionRange: 250,
      coneAngle: 80,
      chaseSpeed: 130,
      patrolSpeed: 70,
      attackRange: 40,
      cooldownDuration: 800,
      hearingRadius: 180,
      patrolRange: 220,
    };

    super(scene, x, y, KEYS.ZELADOR, config);
  }
}
```

**Nota:** O `gen()` guard para `KEYS.ZELADOR` não é necessário em `BootScene.ts` porque o Zelador não tem sprite procedural — se o PNG não existir, o Phaser exibe uma textura padrão de "missing image" (quadrado roxo). Isso é aceitável como placeholder: indica claramente que o sprite ainda não foi gerado.

- [ ] **Step 4: Rodar o teste — verificar que passa**

```bash
npm test -- tests/ZeladorSprite.test.ts
```

Expected: PASS.

- [ ] **Step 5: Rodar a suíte completa**

```bash
npm test
```

Expected: todos os testes passando (incluindo o novo ZeladorSprite.test.ts).

- [ ] **Step 6: Verificar build TypeScript**

```bash
npx tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add tests/ZeladorSprite.test.ts src/entities/enemies/Zelador.ts
git commit -m "feat: Zelador usa KEYS.ZELADOR com sprite próprio (remove tint placeholder)"
```
