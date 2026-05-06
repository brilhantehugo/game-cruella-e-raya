# Porta Falsa + Mensagens de Item — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a decoração `grade` que parece a saída da fase 0-1 por `balcao`, e exibir mensagens descritivas ao coletar power-ups e acessórios.

**Architecture:** Duas mudanças cirúrgicas. (1) Uma linha em `World0.ts`. (2) `POWERUP_LABEL` exportado de `GameScene.ts` + casos individuais para acessórios em `_handleItemCollect`. Sem novos sistemas, sem novos assets.

**Tech Stack:** Phaser 3, TypeScript, Vitest

---

## Arquivos

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/levels/World0.ts` | Modificar linha 110 | `grade` → `balcao` em x=2950 |
| `src/constants.ts` | Modificar | Adicionar `POWERUP_LABEL` exportado |
| `tests/ItemMessages.test.ts` | Criar | Testes TDD para labels e fix de porta |
| `src/scenes/GameScene.ts` | Modificar | Usar `POWERUP_LABEL` em `_handleItemCollect` |

> **Por que `constants.ts` e não `GameScene.ts`?** Os testes vitest não podem importar cenas Phaser — elas dependem de APIs de browser (canvas, WebGL). O padrão do projeto é exportar configurações testáveis de `constants.ts` ou dos arquivos de nível.

---

## Task 1: World0.ts — Trocar grade por balcao

**Files:**
- Modify: `src/levels/World0.ts:110`

- [ ] **Step 1: Fazer a troca**

Em `src/levels/World0.ts`, linha 110, alterar:

```typescript
// Antes
{ type: 'grade',  x: 2950, y: G, blocking: true },

// Depois
{ type: 'balcao', x: 2950, y: G, blocking: true },
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/levels/World0.ts
git commit -m "fix(world0): substituir grade por balcao em x=2950 (porta falsa)"
```

---

## Task 2: constants.ts — Adicionar POWERUP_LABEL

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Adicionar o tipo e o mapa em `src/constants.ts`**

Localizar o final de `src/constants.ts` (após `SCORING`, `PHYSICS`, etc.) e adicionar:

```typescript
export interface PowerUpLabel { text: string; color: string }

export const POWERUP_LABEL: Record<string, PowerUpLabel> = {
  petisco:   { text: '⚡ +10s vel!',   color: '#ff8800' },
  pipoca:    { text: '🦘 +10s pulo!',  color: '#ffff00' },
  churrasco: { text: '🥩 +10s força!', color: '#ff4400' },
  bola:      { text: '🎾 bola!',       color: '#44ff88' },
  frisbee:   { text: '🥏 frisbee!',    color: '#44ff88' },
}
```

- [ ] **Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: sem erros TypeScript.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat(constants): adicionar POWERUP_LABEL para mensagens de item"
```

---

## Task 3: Testes TDD — ItemMessages.test.ts

**Files:**
- Create: `tests/ItemMessages.test.ts`

Os testes importam `POWERUP_LABEL` de `constants.ts` (já existe — devem **passar**) e verificam os dados do `World0`.

- [ ] **Step 1: Criar o arquivo de testes**

```typescript
// tests/ItemMessages.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_0_1 } from '../src/levels/World0'
import { POWERUP_LABEL } from '../src/constants'

describe('POWERUP_LABEL', () => {
  it('petisco tem texto de velocidade', () => {
    expect(POWERUP_LABEL['petisco'].text).toBe('⚡ +10s vel!')
    expect(POWERUP_LABEL['petisco'].color).toBe('#ff8800')
  })

  it('pipoca tem texto de pulo', () => {
    expect(POWERUP_LABEL['pipoca'].text).toBe('🦘 +10s pulo!')
    expect(POWERUP_LABEL['pipoca'].color).toBe('#ffff00')
  })

  it('churrasco tem texto de carne', () => {
    expect(POWERUP_LABEL['churrasco'].text).toBe('🥩 +10s força!')
    expect(POWERUP_LABEL['churrasco'].color).toBe('#ff4400')
  })

  it('bola e frisbee têm a mesma cor', () => {
    expect(POWERUP_LABEL['bola'].color).toBe('#44ff88')
    expect(POWERUP_LABEL['frisbee'].color).toBe('#44ff88')
  })

  it('tipo desconhecido não está no mapa (fallback no runtime)', () => {
    expect(POWERUP_LABEL['inexistente']).toBeUndefined()
  })
})

describe('Fix porta falsa — World0 fase 0-1', () => {
  it('não tem grade em x=2950', () => {
    const gradeNear = LEVEL_0_1.decorations.find(
      d => d.type === 'grade' && d.x === 2950
    )
    expect(gradeNear).toBeUndefined()
  })

  it('tem balcao em x=2950', () => {
    const balcao = LEVEL_0_1.decorations.find(
      d => d.type === 'balcao' && d.x === 2950
    )
    expect(balcao).toBeDefined()
  })
})
```

- [ ] **Step 2: Rodar testes — todos devem passar**

```bash
npm test -- tests/ItemMessages.test.ts 2>&1 | tail -15
```

Esperado: 7 testes passando. `POWERUP_LABEL` já existe em `constants.ts` (Task 2 feita). `LEVEL_0_1` já tem `balcao` em x=2950 (Task 1 feita).

- [ ] **Step 3: Commit**

```bash
git add tests/ItemMessages.test.ts
git commit -m "test(items): testes para POWERUP_LABEL e fix porta falsa"
```

---

## Task 4: GameScene.ts — Usar POWERUP_LABEL em _handleItemCollect

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Adicionar import de `POWERUP_LABEL` no topo do arquivo**

Localizar os imports existentes em `src/scenes/GameScene.ts` (ex: `import { KEYS, PHYSICS, SCORING } from '../constants'`) e adicionar `POWERUP_LABEL` à lista:

```typescript
import { KEYS, TILE_SIZE, GAME_WIDTH, GAME_HEIGHT, PHYSICS, SCORING, POWERUP_LABEL } from '../constants'
```

- [ ] **Step 2: Atualizar `_handleItemCollect` — acessórios**

Localizar estas linhas (em torno da linha 923):

```typescript
      case 'laco': case 'coleira': case 'chapeu': case 'bandana':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
        break
```

Substituir por:

```typescript
      case 'laco':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '🎀 laço!',   '#ff88cc')
        break
      case 'coleira':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '📿 coleira!', '#88ccff')
        break
      case 'chapeu':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '🎩 chapéu!', '#ccaa44')
        break
      case 'bandana':
        gameState.equipAccessory(type as any)
        this._spawnScorePopup(item.x, item.y - 16, '🏴 bandana!', '#ff4444')
        break
```

- [ ] **Step 3: Atualizar `_handleItemCollect` — default (power-ups)**

Localizar estas linhas (em torno da linha 927):

```typescript
      default:
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        this._fx.powerUpBurst(this.player.x, this.player.y, type)
        this._spawnScorePopup(item.x, item.y - 16, '✨', '#00ffff')
        this._am?.notify('item_collected', { type })
```

Substituir por:

```typescript
      default: {
        gameState.applyPowerUp(type, now)
        SoundManager.play('powerUp')
        this._fx.powerUpBurst(this.player.x, this.player.y, type)
        const lbl = POWERUP_LABEL[type] ?? { text: '✨', color: '#00ffff' }
        this._spawnScorePopup(item.x, item.y - 16, lbl.text, lbl.color)
        this._am?.notify('item_collected', { type })
      }
```

> **Nota:** O bloco `{ }` ao redor do `default` é necessário quando se declara `const lbl` dentro de um case sem bloco.

- [ ] **Step 4: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Esperado: sem erros TypeScript.

- [ ] **Step 5: Rodar os testes — todos devem passar**

```bash
npm test -- tests/ItemMessages.test.ts 2>&1 | tail -15
```

Esperado: 7 testes passando, 0 falhas.

- [ ] **Step 6: Rodar a suite completa**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando (sem regressões).

- [ ] **Step 7: Commit final**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat(items): mensagens descritivas por power-up e acessório"
```

---

## Task 5: Verificação final

- [ ] **Step 1: Build limpo**

```bash
npm run build 2>&1 | tail -5
```

Esperado: `dist/` gerado sem erros.

- [ ] **Step 2: Suite completa de testes**

```bash
npm test 2>&1 | tail -10
```

Esperado: todos os testes passando.

- [ ] **Step 3: Checklist de comportamento**

Verificar mentalmente:
- ✅ Fase 0-1: `balcao` em x=2950 (não confunde com saída)
- ✅ `petisco` → `⚡ +10s vel!` laranja
- ✅ `pipoca` → `🦘 +10s pulo!` amarelo
- ✅ `churrasco` → `🥩 +10s força!` vermelho
- ✅ `bola` / `frisbee` → popup verde
- ✅ Acessórios → emojis individuais com cores próprias
- ✅ Fallback `✨` preservado para tipos não mapeados
