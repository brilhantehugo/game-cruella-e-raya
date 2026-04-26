# Character Sprite Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir os sprites procedurais de Raya e Cruella por spritesheets PNG de pixel art 16-bit gerados com o Pixel Lab MCP.

**Architecture:** O Pixel Lab MCP gera frames individuais que são montados num spritesheet horizontal com um script Node.js. O `BootScene.preload()` carrega os PNGs com `load.spritesheet()`, e as animações em `Raya.ts`/`Cruella.ts` são actualizadas para os novos índices de frame.

**Tech Stack:** Phaser 3, TypeScript, Pixel Lab MCP, `sharp` (montagem de spritesheets), Vitest

---

## Mapa de Ficheiros

| Ficheiro | Acção | O que muda |
|----------|-------|-----------|
| `public/sprites/raya.png` | Criar | Spritesheet 544×32 px (17 frames) |
| `public/sprites/cruella.png` | Criar | Spritesheet 544×32 px (17 frames) |
| `scripts/assemble-spritesheet.mjs` | Criar | Script que junta frames num PNG |
| `src/scenes/BootScene.ts` | Modificar | `preload()` carrega PNGs; remove `_makePixelSprite` para Raya/Cruella |
| `src/entities/Raya.ts` | Modificar | Índices de frame actualizados para 17 frames |
| `src/entities/Cruella.ts` | Modificar | Idem |
| `src/sprites/SpriteData.ts` | Modificar | Remove `RAYA_SPRITE` e `CRUELLA_SPRITE` |
| `.gitignore` | Modificar | Adiciona `.superpowers/` |

---

## Task 1: Setup inicial

**Files:**
- Modify: `.gitignore`
- Create: `public/sprites/` (directório)
- Create: `scripts/assemble-spritesheet.mjs`

- [ ] **Step 1.1: Adicionar `.superpowers/` ao `.gitignore`**

```bash
echo '.superpowers/' >> /Users/apple/Desktop/github/game-cruella-e-raya/.gitignore
```

Verifica que a linha foi adicionada:
```bash
grep '.superpowers' /Users/apple/Desktop/github/game-cruella-e-raya/.gitignore
```

- [ ] **Step 1.2: Criar directório de sprites**

```bash
mkdir -p /Users/apple/Desktop/github/game-cruella-e-raya/public/sprites
```

- [ ] **Step 1.3: Instalar `sharp`**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm install sharp --save-dev
```

Expected output: `added 1 package` (ou similar, sem erros)

- [ ] **Step 1.4: Instalar Pixel Lab MCP**

Segue as instruções em https://github.com/pixellab-code/pixellab-mcp para adicionar o MCP ao Claude Code. Necessitas de uma API key de https://pixellab.ai.

```bash
# Exemplo genérico — verifica a documentação actual do repo:
claude mcp add pixellab-mcp --env PIXELLAB_API_KEY=<tua-api-key>
```

- [ ] **Step 1.5: Criar script de montagem de spritesheet**

Cria `scripts/assemble-spritesheet.mjs` com o seguinte conteúdo:

```javascript
#!/usr/bin/env node
/**
 * Monta frames individuais num spritesheet horizontal.
 * Uso: node scripts/assemble-spritesheet.mjs <output.png> <frame1.png> [frame2.png ...]
 *
 * Exemplo:
 *   node scripts/assemble-spritesheet.mjs public/sprites/raya.png \
 *     /tmp/raya/idle-0.png /tmp/raya/idle-1.png ...
 */
import sharp from 'sharp'
import { readFileSync } from 'fs'

const [,, output, ...inputs] = process.argv
if (!output || inputs.length === 0) {
  console.error('Usage: assemble-spritesheet.mjs <output.png> <frame1.png> ...')
  process.exit(1)
}

const frames = await Promise.all(
  inputs.map(async (p) => {
    const buf = readFileSync(p)
    const meta = await sharp(buf).metadata()
    return { buf, width: meta.width, height: meta.height }
  })
)

const frameWidth  = frames[0].width
const frameHeight = frames[0].height
const totalWidth  = frameWidth * frames.length

const composites = frames.map((f, i) => ({
  input: f.buf,
  left: i * frameWidth,
  top: 0,
}))

await sharp({
  create: { width: totalWidth, height: frameHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite(composites)
  .png()
  .toFile(output)

console.log(`✓ Spritesheet criado: ${output} (${totalWidth}×${frameHeight}, ${frames.length} frames)`)
```

- [ ] **Step 1.6: Testar script de montagem com placeholders**

Cria dois PNGs de teste (32×32 brancos) e verifica que o script produz um PNG 64×32:

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya

# Cria frames placeholder (script inline ES module)
node --input-type=module <<'EOF'
import sharp from 'sharp'
await sharp({create:{width:32,height:32,channels:4,background:{r:255,g:0,b:0,alpha:255}}}).png().toFile('/tmp/test-a.png')
await sharp({create:{width:32,height:32,channels:4,background:{r:0,g:0,b:255,alpha:255}}}).png().toFile('/tmp/test-b.png')
console.log('frames placeholder criados')
EOF

node scripts/assemble-spritesheet.mjs /tmp/test-out.png /tmp/test-a.png /tmp/test-b.png
```

Expected: `✓ Spritesheet criado: /tmp/test-out.png (64×32, 2 frames)`

- [ ] **Step 1.7: Commit do setup**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add .gitignore scripts/assemble-spritesheet.mjs package.json package-lock.json
git commit -m "chore: setup sprite pipeline (sharp + assemble script + public/sprites dir)"
```

---

## Task 2: Gerar spritesheet da Raya

**Files:**
- Create: `public/sprites/raya.png`

> **Contexto:** Raya é actualmente uma Pomeranian preta/cinzenta com bandana amarela (`SpriteData.ts`, linha 24). O redesign adopta o estilo dourado/âmbar definido no spec. O sprite deve estar virado para a **direita** (facing right) — o código usa `setFlipX(true)` para virar para a esquerda.

- [ ] **Step 2.1: Gerar os 17 frames com Pixel Lab MCP**

Para cada animação, usa o Pixel Lab MCP com o seguinte prompt base. Guarda cada frame em `/tmp/raya/<animacao>-<n>.png`.

**Prompt base:**
```
pixel art, 16-bit SNES platformer style, 32x32 pixels,
small cute golden retriever dog, amber golden fur (#e8b450),
red collar with small gold tag, facing right, side view,
transparent background, no anti-aliasing, clean pixel edges,
no outline around entire sprite
```

**Frames a gerar (17 total):**

| Ficheiro | Pose | Prompt adicional |
|---------|------|-----------------|
| `/tmp/raya/idle-0.png` | idle frame 1 | `standing idle, weight on all four paws, ears up, tail relaxed` |
| `/tmp/raya/idle-1.png` | idle frame 2 | `standing idle, slight body bob down 1px, ears slightly down, tail curled` |
| `/tmp/raya/walk-0.png` | walk frame 1 | `walking right, left front paw forward, right back paw forward` |
| `/tmp/raya/walk-1.png` | walk frame 2 | `walking right, body weight shifted forward` |
| `/tmp/raya/walk-2.png` | walk frame 3 | `walking right, right front paw forward, left back paw forward` |
| `/tmp/raya/walk-3.png` | walk frame 4 | `walking right, body weight shifted back` |
| `/tmp/raya/run-0.png` | run frame 1 | `running right fast, front legs extended forward, back legs extended back, body stretched` |
| `/tmp/raya/run-1.png` | run frame 2 | `running right, gathering phase, all paws under body` |
| `/tmp/raya/run-2.png` | run frame 3 | `running right, push-off phase, back legs extended` |
| `/tmp/raya/run-3.png` | run frame 4 | `running right, airborne briefly, body horizontal` |
| `/tmp/raya/jump-0.png` | jump frame 1 | `jumping, body crouched and compressed, paws tucked` |
| `/tmp/raya/jump-1.png` | jump frame 2 | `in air, body extended upward, ears blown back, paws dangling` |
| `/tmp/raya/bark-0.png` | bark frame 1 | `barking, mouth open wide, body leaning forward, front paws planted` |
| `/tmp/raya/bark-1.png` | bark frame 2 | `barking follow-through, mouth slightly closed, body recoiling slightly` |
| `/tmp/raya/stun-0.png` | stun | `stunned, dizzy, sitting down, eyes as spirals or X, stars floating above head` |
| `/tmp/raya/death-0.png` | death frame 1 | `falling down, paws up, eyes closed, starting to fall sideways` |
| `/tmp/raya/death-1.png` | death frame 2 | `lying on side, paws up, eyes closed, fully fallen` |

- [ ] **Step 2.2: Rever os frames gerados**

Abre cada PNG e verifica:
- Dimensões são exactamente 32×32 px
- Fundo é transparente
- A cão está virada para a direita
- Estilo pixel art 16-bit consistente entre frames
- Coleira vermelha visível

Se algum frame não ficar bem, itera o prompt antes de avançar.

- [ ] **Step 2.3: Montar o spritesheet**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
node scripts/assemble-spritesheet.mjs public/sprites/raya.png \
  /tmp/raya/idle-0.png /tmp/raya/idle-1.png \
  /tmp/raya/walk-0.png /tmp/raya/walk-1.png /tmp/raya/walk-2.png /tmp/raya/walk-3.png \
  /tmp/raya/run-0.png /tmp/raya/run-1.png /tmp/raya/run-2.png /tmp/raya/run-3.png \
  /tmp/raya/jump-0.png /tmp/raya/jump-1.png \
  /tmp/raya/bark-0.png /tmp/raya/bark-1.png \
  /tmp/raya/stun-0.png \
  /tmp/raya/death-0.png /tmp/raya/death-1.png
```

Expected: `✓ Spritesheet criado: public/sprites/raya.png (544×32, 17 frames)`

- [ ] **Step 2.4: Commit do spritesheet**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add public/sprites/raya.png
git commit -m "feat(sprites): add Raya 16-bit spritesheet (17 frames, Pixel Lab MCP)"
```

---

## Task 3: Integrar spritesheet da Raya no jogo

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/entities/Raya.ts`

- [ ] **Step 3.1: Actualizar `BootScene.preload()` para carregar o PNG**

Em `src/scenes/BootScene.ts`, o método `preload()` actualmente só carrega áudio. Adiciona o carregamento do spritesheet:

```typescript
preload(): void {
  // Erros de carregamento de áudio são silenciados — jogo funciona sem BGM
  this.load.on('loaderror', () => { /* arquivo ausente: continua sem BGM */ })
  this.load.audio(KEYS.BGM_MENU,    'audio/bgm_menu.mp3')
  this.load.audio(KEYS.BGM_WORLD1,  'audio/bgm_world1.mp3')
  this.load.audio(KEYS.BGM_BOSS,    'audio/bgm_boss.mp3')
  this.load.audio(KEYS.BGM_FANFARE, 'audio/bgm_fanfare.mp3')

  // Spritesheets PNG (substituem SpriteData procedural progressivamente)
  this.load.spritesheet(KEYS.RAYA, 'sprites/raya.png', { frameWidth: 32, frameHeight: 32 })
}
```

- [ ] **Step 3.2: Remover `_makePixelSprite(KEYS.RAYA, ...)` de `BootScene.create()`**

Em `src/scenes/BootScene.ts`, dentro de `create()`, localiza e **remove** esta linha:

```typescript
this._makePixelSprite(KEYS.RAYA,    RAYA_SPRITE)
```

Não remove ainda a linha de Cruella nem o método `_makePixelSprite` — continuam necessários.

- [ ] **Step 3.3: Actualizar o import de `SpriteData.ts` em `BootScene.ts`**

Localiza o import no topo de `BootScene.ts`:

```typescript
import { CompiledSprite, RAYA_SPRITE, CRUELLA_SPRITE, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'
```

Remove `RAYA_SPRITE` do import (mantém os restantes):

```typescript
import { CompiledSprite, CRUELLA_SPRITE, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'
```

- [ ] **Step 3.4: Verificar compilação TypeScript**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -20
```

Expected: sem erros de TypeScript. Se houver erros de import, corrige.

- [ ] **Step 3.5: Actualizar animações em `Raya.ts`**

Em `src/entities/Raya.ts`, substitui o bloco `if (!scene.anims.exists('raya-idle'))` pelo seguinte:

```typescript
if (!scene.anims.exists('raya-idle')) {
  scene.anims.create({
    key: 'raya-idle',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [0, 1] }),
    frameRate: 2,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-walk',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [2, 3, 4, 5] }),
    frameRate: 8,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-run',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [6, 7, 8, 9] }),
    frameRate: 12,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-jump',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [10, 11] }),
    frameRate: 4,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-bark',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [12, 13] }),
    frameRate: 6,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-stun',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [14] }),
    frameRate: 1,
    repeat: -1,
  })
  scene.anims.create({
    key: 'raya-death',
    frames: scene.anims.generateFrameNumbers(KEYS.RAYA, { frames: [15, 16] }),
    frameRate: 4,
    repeat: 0,
  })
}
```

- [ ] **Step 3.6: Correr os testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -10
```

Expected: `462 passed` (ou mais, se novos testes foram adicionados). Zero falhas.

- [ ] **Step 3.7: Validar no browser**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run dev
```

Abre o jogo, joga o nível 0-1 e verifica:
- [ ] Raya aparece com o novo sprite PNG
- [ ] Animação idle está activa quando parada
- [ ] Animação walk activa ao mover
- [ ] Animação jump activa ao saltar
- [ ] Física (colisão, hitbox) idêntica ao comportamento anterior
- [ ] Sem erros no console do browser

- [ ] **Step 3.8: Commit da integração**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/scenes/BootScene.ts src/entities/Raya.ts
git commit -m "feat(sprites): integrate Raya PNG spritesheet (17 frames, 16-bit style)"
```

---

## Task 4: Gerar spritesheet da Cruella

**Files:**
- Create: `public/sprites/cruella.png`

> **Contexto:** Cruella é um dálmata preto/branco com laço rosa. Mesmos 17 frames que Raya, mesma estrutura de spritesheet.

- [ ] **Step 4.1: Gerar os 17 frames com Pixel Lab MCP**

**Prompt base:**
```
pixel art, 16-bit SNES platformer style, 32x32 pixels,
small cute dalmatian dog, white fur with asymmetric black spots,
pink bow on head, facing right, side view,
transparent background, no anti-aliasing, clean pixel edges
```

**Frames a gerar (17 total):**

| Ficheiro | Pose | Prompt adicional |
|---------|------|-----------------|
| `/tmp/cruella/idle-0.png` | idle frame 1 | `standing idle, weight on all four paws, bow straight, tail relaxed` |
| `/tmp/cruella/idle-1.png` | idle frame 2 | `standing idle, slight body bob down 1px, bow tilted slightly` |
| `/tmp/cruella/walk-0.png` | walk frame 1 | `walking right, left front paw forward, right back paw forward, elegant gait` |
| `/tmp/cruella/walk-1.png` | walk frame 2 | `walking right, body weight shifted forward` |
| `/tmp/cruella/walk-2.png` | walk frame 3 | `walking right, right front paw forward, left back paw forward` |
| `/tmp/cruella/walk-3.png` | walk frame 4 | `walking right, body weight shifted back` |
| `/tmp/cruella/run-0.png` | run frame 1 | `running right fast, front legs extended forward, back legs extended back` |
| `/tmp/cruella/run-1.png` | run frame 2 | `running right, gathering phase, all paws under body` |
| `/tmp/cruella/run-2.png` | run frame 3 | `running right, push-off phase, back legs extended` |
| `/tmp/cruella/run-3.png` | run frame 4 | `running right, airborne briefly, body horizontal` |
| `/tmp/cruella/jump-0.png` | jump frame 1 | `jumping, body crouched and compressed, paws tucked, bow blown up` |
| `/tmp/cruella/jump-1.png` | jump frame 2 | `in air, body extended upward, bow blown back, paws dangling` |
| `/tmp/cruella/bark-0.png` | bark frame 1 | `barking, mouth open wide, body leaning forward, dignified expression` |
| `/tmp/cruella/bark-1.png` | bark frame 2 | `barking follow-through, mouth slightly closed, body recoiling` |
| `/tmp/cruella/stun-0.png` | stun | `stunned dizzy sitting, eyes as spirals, stars above head, bow crooked` |
| `/tmp/cruella/death-0.png` | death frame 1 | `falling down, paws up, eyes closed, starting to fall sideways` |
| `/tmp/cruella/death-1.png` | death frame 2 | `lying on side, paws up, eyes closed, fully fallen, bow on ground` |

- [ ] **Step 4.2: Rever os frames**

Mesmos critérios da Raya: 32×32, fundo transparente, facing right, estilo consistente com Raya.

- [ ] **Step 4.3: Montar o spritesheet**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
node scripts/assemble-spritesheet.mjs public/sprites/cruella.png \
  /tmp/cruella/idle-0.png /tmp/cruella/idle-1.png \
  /tmp/cruella/walk-0.png /tmp/cruella/walk-1.png /tmp/cruella/walk-2.png /tmp/cruella/walk-3.png \
  /tmp/cruella/run-0.png /tmp/cruella/run-1.png /tmp/cruella/run-2.png /tmp/cruella/run-3.png \
  /tmp/cruella/jump-0.png /tmp/cruella/jump-1.png \
  /tmp/cruella/bark-0.png /tmp/cruella/bark-1.png \
  /tmp/cruella/stun-0.png \
  /tmp/cruella/death-0.png /tmp/cruella/death-1.png
```

Expected: `✓ Spritesheet criado: public/sprites/cruella.png (544×32, 17 frames)`

- [ ] **Step 4.4: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add public/sprites/cruella.png
git commit -m "feat(sprites): add Cruella 16-bit spritesheet (17 frames, Pixel Lab MCP)"
```

---

## Task 5: Integrar spritesheet da Cruella no jogo

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Modify: `src/entities/Cruella.ts`

- [ ] **Step 5.1: Adicionar carregamento de Cruella em `BootScene.preload()`**

No bloco de spritesheets PNG que adicionaste na Task 3, acrescenta:

```typescript
this.load.spritesheet(KEYS.CRUELLA, 'sprites/cruella.png', { frameWidth: 32, frameHeight: 32 })
```

- [ ] **Step 5.2: Remover `_makePixelSprite(KEYS.CRUELLA, ...)` de `BootScene.create()`**

Localiza e remove esta linha de `create()`:

```typescript
this._makePixelSprite(KEYS.CRUELLA, CRUELLA_SPRITE)
```

- [ ] **Step 5.3: Remover `CRUELLA_SPRITE` do import em `BootScene.ts`**

Actualiza o import:

```typescript
import { CompiledSprite, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'
```

- [ ] **Step 5.4: Ler o ficheiro `src/entities/Cruella.ts` e localizar o bloco de animações**

Abre `src/entities/Cruella.ts` e encontra o bloco `anims.create()` equivalente ao de Raya. Substitui pelo seguinte (mesmos índices que Raya, chave `'cruella-*'`):

```typescript
if (!scene.anims.exists('cruella-idle')) {
  scene.anims.create({
    key: 'cruella-idle',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [0, 1] }),
    frameRate: 2,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-walk',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [2, 3, 4, 5] }),
    frameRate: 8,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-run',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [6, 7, 8, 9] }),
    frameRate: 12,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-jump',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [10, 11] }),
    frameRate: 4,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-bark',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [12, 13] }),
    frameRate: 6,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-stun',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [14] }),
    frameRate: 1,
    repeat: -1,
  })
  scene.anims.create({
    key: 'cruella-death',
    frames: scene.anims.generateFrameNumbers(KEYS.CRUELLA, { frames: [15, 16] }),
    frameRate: 4,
    repeat: 0,
  })
}
```

- [ ] **Step 5.5: Verificar compilação TypeScript**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm run build 2>&1 | tail -20
```

Expected: zero erros.

- [ ] **Step 5.6: Correr os testes**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya && npm test 2>&1 | tail -10
```

Expected: todos os testes passam.

- [ ] **Step 5.7: Validar Cruella no browser**

```bash
npm run dev
```

Selecciona Cruella na ecrã de selecção de personagem (ou usa TAB para trocar). Verifica:
- [ ] Cruella aparece com o novo sprite dálmata
- [ ] Animações idle/walk/jump activas nos estados correctos
- [ ] Swap entre Raya e Cruella funciona (TAB)
- [ ] Sem erros no console

- [ ] **Step 5.8: Commit**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/scenes/BootScene.ts src/entities/Cruella.ts
git commit -m "feat(sprites): integrate Cruella PNG spritesheet (17 frames, 16-bit style)"
```

---

## Task 6: Limpar SpriteData.ts

**Files:**
- Modify: `src/sprites/SpriteData.ts`

- [ ] **Step 6.1: Remover `RAYA_SPRITE` e `CRUELLA_SPRITE` de `SpriteData.ts`**

Abre `src/sprites/SpriteData.ts`. Localiza e apaga os dois blocos:
- Toda a secção `// ─── Raya ...` (incluindo `const rP`, `const rBase`, e o `export const RAYA_SPRITE`)
- Toda a secção `// ─── Cruella ...`

Mantém as secções de `GATO_SPRITE`, `POMBO_SPRITE`, `RATO_SPRITE`, `DONO_SPRITE`, `BIGODES_SPRITE` e as definições partilhadas (`CompiledSprite`, `compile`).

- [ ] **Step 6.2: Verificar que não há imports órfãos**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
grep -r "RAYA_SPRITE\|CRUELLA_SPRITE" src/
```

Expected: nenhum resultado. Se houver ficheiros a importar estes símbolos, remove os imports.

- [ ] **Step 6.3: Compilar e testar**

```bash
npm run build 2>&1 | tail -10 && npm test 2>&1 | tail -10
```

Expected: zero erros de TypeScript, todos os testes passam.

- [ ] **Step 6.4: Commit final do piloto**

```bash
cd /Users/apple/Desktop/github/game-cruella-e-raya
git add src/sprites/SpriteData.ts
git commit -m "refactor(sprites): remove RAYA_SPRITE and CRUELLA_SPRITE from SpriteData (migrated to PNG)"
```

---

## Critérios de Aceitação do Piloto

Antes de considerar o piloto concluído, verifica:

- [ ] `public/sprites/raya.png` existe e tem 544×32 px (17 frames)
- [ ] `public/sprites/cruella.png` existe e tem 544×32 px (17 frames)
- [ ] `npm run build` — zero erros TypeScript
- [ ] `npm test` — todos os testes passam
- [ ] Jogo corre no browser sem erros de console
- [ ] Raya e Cruella visualmente reconhecíveis e com personalidade clara
- [ ] Animações idle/walk/jump fluidas a 60 fps
- [ ] Swap entre cães (TAB) funciona correctamente
- [ ] Hitbox e física sem regressões (saltar, colidir, stomp em inimigos)

---

## Próximos Passos (Fase 2 — fora deste plano)

Após o piloto validado, repetir o processo para:
1. Hugo e Hannah (NPCs, 20×40 px)
2. Gato, Dono Nervoso, Zelador, Segurança, Porteiro (24×32 px)
3. Bosses: Zelador Boss, Drone, Seu Bigodes, Seg. Moto (48×48 px)
4. Remover `_makePixelSprite()` e o método auxiliar de `BootScene` quando todos os personagens estiverem migrados
5. Avaliar se `SpriteData.ts` pode ser apagado por completo
