# Spec ANIM — Animações de Inimigos Dirigidas por Estado

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Fazer os 4 inimigos animados (gato, gato selvagem, rato, pombo) tocarem suas animações `idle`/`walk`/`run` conforme o movimento, em vez de ficarem estáticos ou presos em `idle`.

---

## Contexto

`BootScene` cria animações `idle`/`walk`/`run` para as spritesheets `gato`, `gato_selvagem`, `pombo` e `rato`. Raya e Cruella animam completamente. Mas os inimigos não dirigem essas animações:

- **GatoMalencarado** e **GatoSelvagem**: nunca chamam `play()` — ficam no frame 0. As animações `gato_*` / `gato_selvagem_*` são código morto.
- **RatoDeCalcada** e **PomboAgitado**: chamam `play('rato_idle')` / `play('pombo_idle')` só no construtor; nunca transicionam para walk/run ao se mover.

As spritesheets e animações já existem. Falta apenas dirigi-las pelo estado de movimento — polish visível, baixo risco, sem novos assets.

---

## Arquitetura

### Novo arquivo: `src/entities/enemies/enemyAnimState.ts`

Função pura que mapeia magnitude de velocidade para estado de animação:

```typescript
export type EnemyAnimState = 'idle' | 'walk' | 'run'

const WALK_THRESHOLD = 10   // abaixo disso → idle
const RUN_THRESHOLD  = 150  // a partir disso → run

/** Mapeia magnitude de velocidade (px/s) para estado de animação. */
export function enemyAnimState(speed: number): EnemyAnimState {
  const s = Math.abs(speed)
  if (s < WALK_THRESHOLD) return 'idle'
  if (s < RUN_THRESHOLD)  return 'walk'
  return 'run'
}
```

### Verificação dos limiares

| Estado do inimigo | speed (px/s) | resultado |
|---|---|---|
| CROUCH / CHARGE / HOVER / RECOVERY | 0 | idle |
| Gato PATROL / Selvagem WANDER | 80 | walk |
| Rato PATROL | 60 | walk |
| Pombo PATROL_FLY | 100 | walk |
| Selvagem CHASE | 200 | run |
| Gato LEAP / Rato DASH / Pombo SWOOP | ~400 | run |

A magnitude usa `Math.hypot(vx, vy)` para cobrir o SWOOP vertical do pombo (vx=0, vy=400), que a velocidade horizontal sozinha classificaria errado.

---

## Integração nos 4 inimigos

Cada inimigo, no **fim** do `update()` (após a lógica de estado definir a velocidade), adiciona:

```typescript
const b = this.body as Phaser.Physics.Arcade.Body
this.play(`${PREFIX}_${enemyAnimState(Math.hypot(b.velocity.x, b.velocity.y))}`, true)
```

Onde `PREFIX` é o literal por classe:

| Arquivo | PREFIX |
|---|---|
| `src/entities/enemies/GatoMalencarado.ts` | `gato` |
| `src/entities/enemies/GatoSelvagem.ts` (override próprio de `update()`) | `gato_selvagem` |
| `src/entities/enemies/RatoDeCalcada.ts` | `rato` |
| `src/entities/enemies/PomboAgitado.ts` | `pombo` |

Cada classe importa `enemyAnimState` de `./enemyAnimState`.

### Regras de integração

1. **Early-return em stun preservado:** os 4 fazem `return` cedo quando `isStunned()`. Mantido sem alteração — durante o stun, o tint dourado + ícone 😵 comunicam o estado; a anim anterior persiste. Fora de escopo mexer nesse fluxo.

2. **Spawn idle existente preservado:** Rato e Pombo mantêm `this.play('rato_idle')` / `this.play('pombo_idle')` no construtor (primeiro frame antes do `update()`). Gato e GatoSelvagem passam a animar via `update()`.

3. **`play(key, true)`** é no-op se a anim já está tocando — seguro a cada frame (mesmo padrão de Raya/Cruella).

4. **GatoSelvagem** tem `update()` próprio (override total) — recebe a linha de `play` com prefixo `gato_selvagem` no fim do seu próprio método, não herda do pai.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/entities/enemies/enemyAnimState.ts` | **Criar** — função pura + tipo |
| `tests/enemyAnimState.test.ts` | **Criar** — testes dos limiares |
| `src/entities/enemies/GatoMalencarado.ts` | Import + `play()` no fim de `update()` |
| `src/entities/enemies/GatoSelvagem.ts` | Import + `play()` no fim do `update()` próprio |
| `src/entities/enemies/RatoDeCalcada.ts` | Import + `play()` no fim de `update()` |
| `src/entities/enemies/PomboAgitado.ts` | Import + `play()` no fim de `update()` |

---

## Estratégia de Teste

- `tests/enemyAnimState.test.ts`: cobre os 3 estados + valores de fronteira (9→idle, 10→walk, 149→walk, 150→run, 0→idle, 400→run).
- Build TypeScript sem erros.
- Suite existente continua passando (integração Phaser é visual; sem regressão lógica).

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Animação de stun dedicada para inimigos animais | Spritesheets só têm idle/walk/run; tint + ícone já cobrem |
| Animar bosses (Drone, SeuBigodes, etc.) | Spritesheets/anims diferentes; spec separada se desejado |
| Animar HumanEnemy / Aspirador / Porteiro / Seguranca | Sprites/estrutura distintos; fora do conjunto dos 4 com anims prontas |
| Trocar early-return de stun por anim idle explícita | Comportamento atual aceitável; evita escopo extra |
