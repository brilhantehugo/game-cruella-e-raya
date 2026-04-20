# Spec I — Correção de 3 Bugs (Enter / HumanEnemy / Aspirador)

**Data:** 2026-04-20
**Área:** Gameplay / Physics / UX
**Estado:** Aprovado

---

## 1. Visão Geral

Correção cirúrgica de três bugs identificados por análise estática do código:

| # | Bug | Sintoma | Arquivo |
|---|---|---|---|
| 1 | Enter não inicia o jogo | `WorldMapScene` não tem handler de teclado — só cliques | `src/scenes/WorldMapScene.ts` |
| 2 | Humanos caindo da tela | Colisão com `platformLayer` empurra HumanEnemies para baixo | `src/scenes/GameScene.ts` |
| 3 | Aspirador preso fora da arena | Sem collider entre boss e barreiras — escapa do arena | `src/scenes/GameScene.ts` |

**Nenhum asset externo, nenhuma lógica de gameplay alterada.** Total: 3 linhas adicionadas, 1 linha removida, 1 texto atualizado.

---

## 2. Bug 1 — Enter no WorldMapScene

### Causa raiz
`WorldMapScene` registra `pointerdown` nos nós e `once('keydown-ESC')`, mas nenhum handler de ENTER. O texto de instruções (linha 167) também não menciona ENTER.

### Correção
Após o handler de ESC (linha 172), adicionar:

```typescript
this.input.keyboard!.once('keydown-ENTER', () => {
  const profile = profileManager.getActive()
  const levelId = profile?.currentLevel
  if (levelId && profileManager.isUnlocked(levelId)) {
    this._startLevel(levelId)
  }
})
```

Atualizar texto de instruções:
```typescript
// antes:
'Clique numa fase para jogar  |  ESC — menu'
// depois:
'Clique numa fase para jogar  |  ENTER — iniciar atual  |  ESC — menu'
```

**Por que `profile?.currentLevel`:** o node atual já pulsa visualmente (`isCurrent`), tornando a experiência consistente — ENTER inicia o que está destacado.

---

## 3. Bug 2 — HumanEnemy caindo pelo chão

### Causa raiz
- `Hugo` tem textura `18×42 px`. `Enemy` chama `setScale(2)` **antes** de `physics.add.existing(this)` → body criado com `36×84 px`, `halfHeight=42`.
- `HumanEnemy` chama `setScale(1.6)` **depois**, mas body **não é redimensionado**.
- Com `halfHeight=42`, um Hugo em `y=390` tem `body.top=348`, `body.bottom=432`.
- Plataforma row 11 (`multiPlatRow([50,5])`, tile `32×16`): `body.top=360`, `body.bottom=376`.
- Ambos se sobrepõem verticalmente (16 px overlap) quando o Hugo está perto de `x=1600–1760`.
- `physics.add.collider(enemyGroup, platformLayer)` (linha 658 de `GameScene.ts`) resolve o overlap empurrando o Hugo **para baixo** (centro do Hugo 390 > centro da plataforma 368) — conflito com o push para cima do `groundLayer` → Hugo afunda.

### Correção
Remover linha 658 de `_setupCollisions()`:

```typescript
// REMOVER esta linha:
this.physics.add.collider(this.enemyGroup, this.platformLayer)
```

**Justificativa:** nenhum `HumanEnemy`, `Zelador`, `Morador` ou outro inimigo do `enemyGroup` é spawnado em plataformas elevadas — todos spawnados em `y=390` (ground level). A colisão com `groundLayer` é suficiente. O player continua com platform collider inalterado.

---

## 4. Bug 3 — Aspirador escapando da arena

### Causa raiz
`_startMiniBossEncounter()` cria `_miniBossBarriers` (dois `EXIT_GATE` estáticos em `x=1056` e `x=1984`) e adiciona colliders **apenas para o player**:

```typescript
this.physics.add.collider(this.player.raya,   this._miniBossBarriers)
this.physics.add.collider(this.player.cruella, this._miniBossBarriers)
// ← SEM collider para o boss
```

O Aspirador é adicionado ao `enemyGroup` **após** `_setupCollisions()`, portanto o collider genérico do grupo não o ajuda aqui. Sem collider com as barreiras, `body.blocked.left/right` nunca ativa nas barreiras → o Aspirador atravessa, vagueia pelo level e fica preso em bounds do mundo ou outros objetos.

### Correção
Adicionar após os colliders do player em `_startMiniBossEncounter()`:

```typescript
this.physics.add.collider(boss, this._miniBossBarriers)
```

Isso faz `body.blocked.left/right = true` nas barreiras, ativando o bounce logic já existente no `Aspirador.update()`:
```typescript
if (body.blocked.left)  { this.direction = 1;  this.setVelocityX(this.speed) }
if (body.blocked.right) { this.direction = -1; this.setVelocityX(-this.speed) }
```

---

## 5. Testes

- `npm test`: 124/124 devem continuar passando — nenhuma lógica de gameplay alterada
- `npm run build`: build limpo sem erros TypeScript
- Verificação manual:
  - Na `WorldMapScene`, apertar ENTER deve iniciar o level atual
  - Humanos (Hugo/Hannah/Zelador/Morador) devem ficar no chão em todas as fases
  - O Aspirador mini-boss deve ficar confinado entre as barreiras no level 0-1

---

## 6. Fora de Escopo

- Redesenho dos sprites das personagens (próximo sub-projeto)
- Rebalanceamento de stats dos inimigos
- Navegação por teclado completa no WorldMapScene (setas para mover entre nós)
