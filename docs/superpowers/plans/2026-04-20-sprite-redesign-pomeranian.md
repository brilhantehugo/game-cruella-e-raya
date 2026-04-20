# Pomeranian Sprite Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesenhar os sprites pixel art de Raya (32×32) e Cruella (28×28) em `src/sprites/SpriteData.ts` para que ambas pareçam Lulus da Pomerânia reais — Raya em blue merle, Cruella em parti-color preto/branco.

**Architecture:** Substituir apenas `rP`/`rBase` (Raya) e `cP`/`cBase` (Cruella) em `src/sprites/SpriteData.ts`. Os sistemas `rLegs`/`cLegs`, `compile()`, as exportações e as dimensões permanecem intactos. O char `D` é mantido em ambas as paletas para compatibilidade com os legs existentes.

**Tech Stack:** TypeScript, pixel art row strings (32-char e 28-char), Phaser 3.87, Vitest

---

## File Structure

| Arquivo | Ação | Motivo |
|---|---|---|
| `src/sprites/SpriteData.ts` | Modificar | Substituir `rP`, `rBase`, `cP`, `cBase` com novo design de Lulu |

---

### Task 1: Atualizar sprite da Raya — blue merle

**Files:**
- Modify: `src/sprites/SpriteData.ts:29–61` (seção `rP` e `rBase`)

**Contexto:**
- `rP` é o mapa de paleta: char → cor hex ou null
- `rBase` são as 25 linhas (rows 0–24) da parte superior do sprite (cabeça, corpo, juba)
- `rLegs` permanece intacto — usa chars `B`, `D`, `G` que continuam presentes na nova paleta
- A largura de cada row é exatamente **32 caracteres**
- A juba (rows 10–16) é mais larga que a cabeça/corpo usando chars `W`/`H` nas bordas para simular pelos soltos
- Chars da nova paleta: `B`=preto(outline), `D`=azul-escuro(patch merle), `G`=cinza-azulado(base), `L`=médio, `W`=claro(juba externa), `H`=quase-branco(highlight), `A`=âmbar(olho), `P`=rosa(nariz)

- [ ] **Step 1: Verificar testes antes de editar**

```bash
npm test -- --reporter=verbose 2>&1 | head -20
```
Esperado: 124 passing.

- [ ] **Step 2: Substituir `rP` e `rBase` em `src/sprites/SpriteData.ts`**

Localizar o bloco atual que começa com:
```typescript
const rP: Record<string, string | null> = {
  '.': null, 'B': '#111111', 'D': '#2e2e2e', 'G': '#5f5f5f',
  'L': '#a0a0a0', 'Y': '#ffd700', 'W': '#f0f0f0', 'A': '#cc8800', 'P': '#bb4455',
}
```

Substituir `rP` por:
```typescript
const rP: Record<string, string | null> = {
  '.': null, 'B': '#000000', 'D': '#2b3050', 'G': '#5a6b8a',
  'L': '#8fa3be', 'W': '#ccd8e8', 'H': '#e8eef6', 'A': '#cc8800', 'P': '#bb4455',
}
```

Localizar o bloco `const rBase: string[] = [` até o `]` de fechamento (linhas 35–61) e substituir **todo** o array por:
```typescript
const rBase: string[] = [
  '................................',  // r00 blank
  '...........BB....BB.............',  // r01 ear tips
  '..........BGDB..BGDB............',  // r02 ears
  '..........BGGB..BGGB............',  // r03 ears
  '..........BGGGBBGGGB............',  // r04 ears merge
  '.........BGGLLLLLGGB............',  // r05 head top
  '.........BGGLWALLGPB............',  // r06 eye(W,A) + nose(P)
  '.........BGGLLLLLLGB............',  // r07 face
  '..........BGGLLLGGB.............',  // r08 chin
  '..........BGGGGGGGB.............',  // r09 neck
  '.......WLGGDLLLLDGGLLW..........',  // r10 juba start
  '......HLGGDDLLLLDDGGLH..........',  // r11 juba
  '.....WLGGDDDLLLLDDGGGLLW........',  // r12 juba widest
  '.....HLGGDDLLLLLDDGGLLH.........',  // r13 juba
  '......WLGGGDLLLLDGGGLLW.........',  // r14 juba
  '.......WLGGGLLLLGGGLLW..........',  // r15 juba bottom
  '........WLGGLLLLGGLLW...........',  // r16 juba fades
  '..........BGGLLLGGGB............',  // r17 body top
  '..........BGGLLLLGGB............',  // r18 body
  '..........BGGGLLGGGB............',  // r19 body
  '.........BDGGGLLGGGB............',  // r20 body
  '.........BDGGGLLLGGB............',  // r21 body lower
  '.........BDGGGGGGGB.............',  // r22 body
  '..........BDGGGGGB..............',  // r23 belly
  '...........BDGGGGB..............',  // r24 belly bottom
]
```

- [ ] **Step 3: Verificar contagem de caracteres**

Cada row deve ter exatamente 32 chars. Rodar:
```bash
node -e "
const rows = [
  '................................',
  '...........BB....BB.............',
  '..........BGDB..BGDB............',
  '..........BGGB..BGGB............',
  '..........BGGGBBGGGB............',
  '.........BGGLLLLLGGB............',
  '.........BGGLWALLGPB............',
  '.........BGGLLLLLLGB............',
  '..........BGGLLLGGB.............',
  '..........BGGGGGGGB.............',
  '.......WLGGDLLLLDGGLLW..........',
  '......HLGGDDLLLLDDGGLH..........',
  '.....WLGGDDDLLLLDDGGGLLW........',
  '.....HLGGDDLLLLLDDGGLLH.........',
  '......WLGGGDLLLLDGGGLLW.........',
  '.......WLGGGLLLLGGGLLW..........',
  '........WLGGLLLLGGLLW...........',
  '..........BGGLLLGGGB............',
  '..........BGGLLLLGGB............',
  '..........BGGGLLGGGB............',
  '.........BDGGGLLGGGB............',
  '.........BDGGGLLLGGB............',
  '.........BDGGGGGGGB.............',
  '..........BDGGGGGB..............',
  '...........BDGGGGB..............',
];
rows.forEach((r,i) => { if(r.length !== 32) console.log('ERRO row', i, 'tem', r.length, 'chars'); });
console.log('OK - todas as rows têm 32 chars');
"
```
Esperado: `OK - todas as rows têm 32 chars`

- [ ] **Step 4: Rodar os testes**

```bash
npm test
```
Esperado: 124 passing, 0 failing.

- [ ] **Step 5: Rodar build TypeScript**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/sprites/SpriteData.ts
git commit -m "feat: redesign Raya sprite as blue merle Pomeranian"
```

---

### Task 2: Atualizar sprite da Cruella — parti-color preto/branco

**Files:**
- Modify: `src/sprites/SpriteData.ts:135–164` (seção `cP` e `cBase`)

**Contexto:**
- `cP` é o mapa de paleta para Cruella
- `cBase` são as 22 linhas (rows 0–21) da parte superior
- `cLegs` usa chars `B`, `D`, `G` — o novo `cP` mantém esses três chars para compatibilidade
- A largura de cada row é exatamente **28 caracteres**
- Parti-color: metade esquerda preta (`B`/`K`), metade direita branca (`W`/`S`), centro com `G` (cinza transição)
- A juba (rows 10–15) usa `K` nas bordas esquerdas e `S` nas bordas direitas para pelos soltos
- Chars: `B`=preto(outline+lado esq), `D`=preto muito escuro(legs compat), `K`=cinza muito escuro(sombra lado preto), `W`=branco(lado dir), `S`=cinza claro(sombra lado branco), `G`=cinza médio(transição/nariz), `P`=rosa(nariz)

- [ ] **Step 1: Substituir `cP` e `cBase` em `src/sprites/SpriteData.ts`**

Localizar o bloco atual:
```typescript
const cP: Record<string, string | null> = {
  '.': null, 'B': '#110811', 'D': '#2a1a2a', 'G': '#5a3a5a',
  'L': '#9a7a9a', 'K': '#ff69b4', 'W': '#f0f0f0', 'A': '#cc8800', 'P': '#bb4455',
}
```

Substituir `cP` por:
```typescript
const cP: Record<string, string | null> = {
  '.': null, 'B': '#000000', 'D': '#1a1a1a', 'K': '#2a2a2a',
  'W': '#ffffff', 'S': '#d8d8d8', 'G': '#888888', 'P': '#bb4455',
}
```

Localizar o bloco `const cBase: string[] = [` até o `]` de fechamento (linhas 141–164) e substituir **todo** o array por:
```typescript
const cBase: string[] = [
  '............................',  // r00 blank
  '..........BB..BB............',  // r01 ear tips
  '.........BKDB.BWSB..........',  // r02 ears (left=dark, right=light)
  '.........BKKB.BWWB..........',  // r03 ears
  '.........BKKKBBWWWB.........',  // r04 ears merge
  '........BKKKGGGWWWB.........',  // r05 head (G=center transition)
  '........BKKBGGSWWWB.........',  // r06 eye(B=pupil left, G=iris, S=eye right)
  '........BKKKGPGWWWB.........',  // r07 nose(P) at center
  '........BKKKGGSWWWB.........',  // r08 face lower
  '.........BKKGGGSWWB.........',  // r09 chin
  '......KBKKGGGSSSWWWBS.......',  // r10 juba start (K left tip, S right tip)
  '.....KBKKGGGSSSWWWWBS.......',  // r11 juba grows
  '....KBKKKGGGSSSWWWWWBS......',  // r12 juba widest
  '.....KBKKGGGSSSWWWWBS.......',  // r13 juba
  '......KBKKGGGSWWWBS.........',  // r14 juba shrinks
  '.......BKKKGGSWWWB..........',  // r15 juba fades
  '........BKKGGGWWWB..........',  // r16 body top
  '........BKKKGSWWWB..........',  // r17 body
  '........BKKKGWWWB...........',  // r18 body
  '........BKKGGGWWB...........',  // r19 body lower
  '.........BKKGGWWB...........',  // r20 body
  '.........BKGGGWB............',  // r21 belly bottom
]
```

- [ ] **Step 2: Verificar contagem de caracteres**

```bash
node -e "
const rows = [
  '............................',
  '..........BB..BB............',
  '.........BKDB.BWSB..........',
  '.........BKKB.BWWB..........',
  '.........BKKKBBWWWB.........',
  '........BKKKGGGWWWB.........',
  '........BKKBGGSWWWB.........',
  '........BKKKGPGWWWB.........',
  '........BKKKGGSWWWB.........',
  '.........BKKGGGSWWB.........',
  '......KBKKGGGSSSWWWBS.......',
  '.....KBKKGGGSSSWWWWBS.......',
  '....KBKKKGGGSSSWWWWWBS......',
  '.....KBKKGGGSSSWWWWBS.......',
  '......KBKKGGGSWWWBS.........',
  '.......BKKKGGSWWWB..........',
  '........BKKGGGWWWB..........',
  '........BKKKGSWWWB..........',
  '........BKKKGWWWB...........',
  '........BKKGGGWWB...........',
  '.........BKKGGWWB...........',
  '.........BKGGGWB............',
];
rows.forEach((r,i) => { if(r.length !== 28) console.log('ERRO row', i, 'tem', r.length, 'chars'); });
console.log('OK - todas as rows têm 28 chars');
"
```
Esperado: `OK - todas as rows têm 28 chars`

- [ ] **Step 3: Rodar os testes**

```bash
npm test
```
Esperado: 124 passing, 0 failing.

- [ ] **Step 4: Rodar build TypeScript**

```bash
npm run build
```
Esperado: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/sprites/SpriteData.ts
git commit -m "feat: redesign Cruella sprite as parti-color Pomeranian"
```

---

### Task 3: Verificação final

**Files:**
- Read: `src/sprites/SpriteData.ts` (confirmação visual)

- [ ] **Step 1: Rodar todos os testes**

```bash
npm test
```
Esperado: 124 passing, 0 failing.

- [ ] **Step 2: Build de produção limpo**

```bash
npm run build
```
Esperado: sem erros TypeScript, sem warnings críticos.

- [ ] **Step 3: Verificação manual no browser**

Iniciar o jogo (`npm run dev`), jogar um level. Confirmar:
- Raya tem silhueta com juba larga (rows 10–16 visualmente mais largas que cabeça e corpo)
- Raya tem cores cinza-azuladas com manchas escuras (blue merle)
- Cruella tem metade esquerda preta e metade direita branca
- Ambas têm orelhas triangulares
- Animação de caminhada e pulo funcionam sem glitches
- Nenhum acessório visível (sem bandana, sem laço)
