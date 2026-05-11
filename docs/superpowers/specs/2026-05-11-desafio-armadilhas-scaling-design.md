# Spec H — Armadilhas Ambientais + Scaling de Dificuldade por Mundo

**Data:** 2026-05-11
**Status:** Aprovado

**Goal:** Tornar o jogo mais desafiador através de dois subsistemas independentes: (1) armadilhas ambientais que dão dano ou matam instantaneamente e (2) scaling de dificuldade nos inimigos conforme o mundo avança.

**Architecture:** Abordagem A — dados no LevelData + multiplicador por mundo. Segue o padrão de `movingPlatforms` e `items` já existentes. Sem novos arquivos de classe pesada — modificações cirúrgicas em arquivos existentes.

**Tech Stack:** TypeScript, Phaser 3 Arcade Physics

---

## Referências Históricas

| Jogo | Relevância |
|------|-----------|
| DKC (SNES, 1994) | Fossos = morte instantânea, canos com espinhos = padrão de indústria |
| NSMB Wii (2009) | Hazards temáticos por mundo, scaling natural de velocidade |
| Celeste (2018) | Spikes = morte instantânea, ensina risco-recompensa espacial |
| Kirby's Adventure (NES, 1993) | Inimigos ficam mais agressivos nos mundos finais |

---

## Subsistema 1 — Armadilhas Ambientais

### Novos tipos em `LevelData.ts`

```typescript
type HazardType = 'spike' | 'fall-zone'

interface HazardDef {
  x: number
  y: number
  width: number   // largura em px (height sempre 16 para spike, invisível para fall-zone)
  type: HazardType
}

// Adicionado em LevelDef:
hazards?: HazardDef[]
```

### Comportamento por tipo

**`spike`**
- Sprite estático com textura `KEYS.TILE_SPIKE` (tile de espinho, profundidade 3)
- Corpo de física estático (`staticImage` ou `staticGroup`)
- Overlap com `player.raya` e `player.cruella` → chama `gameState.takeDamage()` → −1 coração com iframes normais (1200ms)
- Visual: sem efeito especial além do flash de dano já existente

**`fall-zone`**
- Zona invisível: faixa horizontal em `y = worldHeight + 64` cobrindo toda a largura do mundo
- Detectada pelo bounds check já existente em `GameScene.update()` (extensão da lógica de out-of-bounds)
- Consequência: **−1 coração + teleporte imediato** ao checkpoint (`gameState.checkpointX/Y`) ou ao `spawnX/Y` da fase se não houver checkpoint. Iframes normais para evitar dano duplo ao respawnar.
- Mais punitivo que spike: o jogador perde vida E perde progresso espacial.
- Não requer novo sprite

### Placement temático por mundo

| Mundo | Tipo de hazard | Exemplo de posição |
|-------|---------------|-------------------|
| World 0 — Apartamento | `spike` (cerca de jardim), `fall-zone` (fosso de elevador) | Grade interna, vão entre andares |
| World 1 — Rua Diurna | `fall-zone` (bueiro aberto), `spike` (grade com ponta) | Calçada com vão, cerca de obra |
| World 2 — Telhado | `fall-zone` (borda sem barreira), `spike` (antena) | Extremidades do telhado, obstáculos metálicos |
| World 3 — Rua Noite | `spike` (espigão de grade), `fall-zone` (vão entre prédios) | Muro, passarela com buracos |

Cada fase recebe 1–3 hazards. Boss levels: sem hazards (foco no boss).

### Nota sobre assets

`KEYS.TILE_SPIKE` precisa existir no `src/constants.ts` e o tile correspondente deve estar carregado no `BootScene`. Se o tile de espinho não existir como asset separado, pode-se usar o tile de plataforma recolorido via `setTint(0xff4444)` como placeholder visual.

### Arquivos modificados

- `src/levels/LevelData.ts` — tipo `HazardType`, interface `HazardDef`, campo opcional em `LevelDef`
- `src/systems/LevelBuilder.ts` — método `_buildHazards()`: itera `hazards[]`, cria spike sprites estáticos, registra overlaps; fall-zone: nenhum sprite necessário
- `src/scenes/GameScene.ts` — overlaps de spike com jogadores + extensão do bounds check para fall-zone −1 coração + teleport
- `src/levels/World0.ts`, `World1.ts`, `World2.ts`, `World3.ts` — dados de hazards por fase

### Comportamento esperado

- Jogador toca spike → flash de dano → perde 1 coração → iframes normais (não morre de novo imediatamente)
- Jogador cai fora da tela → teleporta para checkpoint/spawn sem perder vida
- Inimigos NÃO interagem com hazards (evita complexidade desnecessária)

---

## Subsistema 2 — Scaling de Dificuldade por Mundo

### Tabela de multiplicadores em `src/constants.ts`

```typescript
export const WORLD_DIFFICULTY: Record<string, {
  speedMult:      number   // multiplica patrolSpeed e chaseSpeed do inimigo
  aggressionMult: number   // multiplica alertRange (distância de detecção)
  packChase:      boolean  // inimigos vizinhos (raio 120px) entram em chase juntos
  longChase:      boolean  // range de cancelamento de chase: 200 → 400px
}> = {
  '0': { speedMult: 1.00, aggressionMult: 1.00, packChase: false, longChase: false },
  '1': { speedMult: 1.15, aggressionMult: 1.10, packChase: false, longChase: false },
  '2': { speedMult: 1.30, aggressionMult: 1.25, packChase: true,  longChase: false },
  '3': { speedMult: 1.45, aggressionMult: 1.40, packChase: true,  longChase: true  },
}
```

### Interface em `Enemy.ts`

```typescript
applyDifficulty(diff: typeof WORLD_DIFFICULTY[string]): void {
  this.patrolSpeed  *= diff.speedMult
  this.chaseSpeed   *= diff.speedMult
  this.alertRange   *= diff.aggressionMult
  this._packChase    = diff.packChase
  this._longChase    = diff.longChase
}
```

Campos internos `_packChase` e `_longChase` são flags booleanas lidas pelo `EnemyStateMachine`.

### Aplicação no LevelBuilder

Em `LevelBuilder._spawnEnemies()`, após criar cada inimigo:
```typescript
const worldId = gameState.currentLevel.split('-')[0]
const diff    = WORLD_DIFFICULTY[worldId] ?? WORLD_DIFFICULTY['0']
enemy.applyDifficulty(diff)
```

### packChase — comportamento de grupo

Quando `EnemyStateMachine` entra no estado `chase` e `_packChase === true`:
- Emite evento local via `this.scene.events.emit('enemy:pack-alert', { x: enemy.x, y: enemy.y })`
- `GameScene` escuta o evento e itera os inimigos no grupo; para cada um dentro de 120px que esteja em estado `patrol` ou `idle`, chama `enemy.startChase()`

### longChase — perseguição persistente

No estado `chase` do `EnemyStateMachine`, o range de cancelamento (distância para voltar a patrol) muda:
- Padrão: cancela chase quando jogador está a > 200px
- `longChase === true`: cancela apenas quando jogador está a > 400px

### Arquivos modificados

- `src/constants.ts` — constante `WORLD_DIFFICULTY`
- `src/entities/Enemy.ts` — campos `_packChase`, `_longChase` + método `applyDifficulty()`
- `src/systems/LevelBuilder.ts` — aplica `applyDifficulty()` após spawn
- `src/systems/EnemyMovement.ts` — lógica de `longChase` no range de cancelamento
- `src/scenes/GameScene.ts` — listener `enemy:pack-alert` para ativar packChase

---

## Ordem de Implementação

```
1. LevelData.ts — tipos HazardType + HazardDef + campo em LevelDef
2. LevelBuilder._buildHazards() — spike sprites + overlaps
3. GameScene — overlaps de spike + fall-zone bounds check
4. World0–3.ts — dados de hazards (1–3 por fase, sem boss levels)
5. constants.ts — WORLD_DIFFICULTY
6. Enemy.ts — applyDifficulty() + flags
7. LevelBuilder — aplica diff no spawn
8. EnemyMovement — longChase range
9. GameScene — packChase listener
```

## Fora do Escopo

| Item | Motivo |
|------|--------|
| Inimigos interagindo com hazards | Complexidade sem ganho claro |
| Hazards animados (fogo pulsante) | Polish futuro |
| Dificuldade customizável pelo jogador | Escopo excessivo |
| HP de inimigos aumentando | Usuário escolheu D (velocidade + comportamento) |
| Hazards em boss levels | Foco no boss, não na fase |
