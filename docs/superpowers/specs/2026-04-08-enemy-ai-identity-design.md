# Enemy AI Identity — Design Spec
**Data:** 2026-04-08
**Projeto:** Cruella & Raya — Jogo de Plataforma Phaser 3

---

## Objetivo

Transformar os inimigos do jogo de entidades mecanicamente iguais (patrol/stationary) em personagens com identidade comportamental distinta, inspirado no design de inimigos da série Mario. Cada tipo de inimigo passa a representar um *problema de design* único que o jogador aprende a resolver.

---

## Princípio de Design Central

**Cruella previne, Raya esquiva.**

- Cruella (bark) é melhor em *interromper* ataques antes de acontecerem — recompensa leitura antecipada
- Raya (dash/jump) é melhor em *esquivar* de ataques em execução — recompensa reação precisa
- Counter forte: usar o personagem "errado" ainda é possível, mas exige skill significativamente maior
- A troca de personagem torna-se decisão tática, não preferência estética

**Trade-off emergente:** o bark da Cruella que *stuna* animais *alerta* humanos próximos — usar Cruella perto de um gato pode acordar o zelador no mesmo corredor.

---

## Arquitetura

### Hierarquia de Classes

```
Enemy (base existente)
│
├── EnemyStateMachine          ← novo: máquina de estados compartilhada
│
├── HumanEnemy                 ← nova classe base para todos os humanos
│   ├── Hugo      (src/entities/npc/Hugo.ts → extends HumanEnemy)
│   ├── Hannah    (src/entities/npc/Hannah.ts → extends HumanEnemy)
│   ├── Zelador   (novo — src/entities/enemies/Zelador.ts)
│   └── Morador   (novo — src/entities/enemies/Morador.ts, reutilizável)
│
└── Animais (herdam Enemy, sobrescrevem estado de ataque com comportamento único)
    ├── Gato      (redesign — pounce + counter windows)
    ├── Pombo     (redesign — aerial swoop + counter windows)
    └── Rato      (redesign — speed dash + counter windows)
```

### Interface CounterWindow

```typescript
interface CounterWindow {
  character: 'raya' | 'cruella'
  state: string       // qual estado do inimigo abre a janela
  windowMs: number    // duração da janela em ms
  type: 'bark' | 'dash' | 'jump'
}
```

Cada inimigo animal declara um array de `counterWindows`. O método `tryCounter(character, type)` verifica se o estado atual corresponde a uma janela aberta para esse par personagem+tipo.

---

## Sistema 1 — Humanos: Máquina de Estados

### Estados e Transições

```
IDLE/PATROL ──► DETECT (0.5s + "!" ) ──► CHASE
                                              │
                    ◄── player sai do range ──┤
                    │                         │
                  SEARCH (2s no               │ player dentro do
                  último ponto visto)         │ range de ataque
                    │                         ▼
                  COOLDOWN ◄────────── ATTACK (grab/empurrão)
                    │
                    ▼
                  PATROL
```

**DETECT:** pausa de 0.5s com animação de "!" acima da cabeça. Dá ao jogador uma janela para fugir antes do chase começar.

**SEARCH:** ao perder o jogador, o humano vai até o último ponto onde o viu e olha ao redor por 2s antes de retornar ao patrol. Cria tensão mesmo após escapar.

**ATTACK:** não é soco — é *grab/empurrão* temático (humano afasta o cachorro). Causa 1 de dano + knockback lateral de 180px. Telegrafado por 0.5s de animação de alcance.

### Cone de Visão

- Direcional: apenas à frente do personagem baseado no facing
- Ângulo e range configuráveis por tipo (`HumanConfig`)
- Raio de audição separado para detecção de bark

### Configurações por Tipo

| Parâmetro | Hugo/Hannah | Zelador | Morador |
|---|---|---|---|
| `detectionRange` | 180px | 250px | 150px |
| `coneAngle` | 60° | 80° | 50° |
| `chaseSpeed` | 90px/s | 130px/s | 70px/s |
| `attackRange` | 40px | 40px | 40px |
| `cooldownDuration` | 1200ms | 800ms | 1500ms |
| `hearingRadius` | 120px | 180px | 80px |

### Interação com Bark da Cruella

| Situação | Resultado |
|---|---|
| Bark dentro do `hearingRadius` | Humano entra em **Detect** (ouviu algo suspeito) |
| Bark dentro do `attackRange` | Humano vai direto ao **Chase** |
| Bark durante **Cooldown** | Reset para **Patrol** (levou susto, relaxou) |

---

## Sistema 2 — Animais: Comportamento Único + Counter Windows

### 🐱 Gato — Pounce

**Sequência:**
```
[patrol] ──► [CROUCH 400ms] ──► [LEAP 150ms] ──► [recovery 600ms]
                  ↑                   ↑
            JANELA CRUELLA       JANELA RAYA
            bark cancela         dash atravessa
            (400ms inteira)      (150ms, apertado)
```

**Trigger:** player entra em 120px de raio.

**Counter Cruella:** bark durante o agachar → pounce cancelado, gato stunado 2s. Janela generosa (400ms) — recompensa quem lê a animação.

**Counter Raya:** dash horizontal durante o salto → passa pelo gato sem colisão. Janela de 150ms — exige timing preciso.

**Sem counter (ou timing errado):** gato pousa sobre o player, 1 de dano + knockback.

**Visual telegraph:** outline ciano (Cruella) durante o crouch; outline laranja (Raya) durante o leap.

---

### 🐦 Pombo — Aerial Swoop

**Sequência:**
```
[voo altitude 120px] ──► [HOVER 300ms] ──► [SWOOP 250ms] ──► [sobe 800ms]
                               ↑                  ↑
                         JANELA CRUELLA      JANELA RAYA
                         bark cancela        double-jump
                         (300ms inteira)     alcança em altitude
                                             (stomp mata direto)
```

**Trigger:** player passa abaixo do pombo em voo.

**Counter Cruella:** bark durante o hover → swoop cancelado, pombo recuado. Janela mais longa que o gato (300ms).

**Counter Raya:** double-jump para alcançar o pombo *durante o voo em altitude* (antes do mergulho) → stomp elimina diretamente. Recompensa jogadores ofensivos.

**Sem counter:** pombo mergulha, 1 de dano, retorna ao padrão.

**Nota de design:** pombo cria ameaça vertical — força o jogador a pensar em altitude, não só em horizontal.

---

### 🐀 Rato — Speed Dash

**Sequência:**
```
[patrol lento 60px/s] ──► [CHARGE 350ms] ──► [DASH 200ms] ──► [recovery 800ms]
                               ↑                   ↑
                         JANELA CRUELLA        JANELA RAYA
                         bark cancela          pula sobre
                         (350ms inteira)       (200ms, timing justo)
```

**Trigger:** player entra em 150px de raio.

**Counter Cruella:** bark durante a postura de carga → dash cancelado, rato stunado 1.5s. Bark deve chegar *antes* do disparo.

**Counter Raya:** pulo (não dash) por cima durante o dash → rato passa por baixo. Janela de 200ms.

**Sem counter:** rato atravessa o player, 1 de dano, continua no recovery (durante recovery é vulnerável a qualquer ataque).

---

## Distribuição por Fase — Introdução Progressiva

| Fase | Inimigo novo introduzido | Objetivo pedagógico |
|---|---|---|
| **0-1** Sala de Estar | Hugo + Hannah → HumanEnemy | Aprender cone de visão, fuga de humanos |
| **0-2** Estacionamento | Zelador + **Gato** (pounce) | Conhecer pounce em contexto sem buracos |
| **1-1** Rua Residencial | **Rato** (dash) + Moradores | Conhecer speed dash em espaço aberto |
| **1-2** Praça com Jardim | **Pombo** (swoop) + mix | Conhecer swoop com espaço vertical |
| **1-3** Mercadinho | Gato + Pombo + Rato + humanos | Desafio combinado — todos os tipos |
| **Bosses** | Sem alteração | AI própria existente preservada |

**Zona de ensino:** em cada fase introdutória, o novo inimigo aparece primeiro sozinho, em espaço aberto, longe de buracos — o jogador tem espaço para errar e aprender antes da combinação com outros inimigos.

---

## Integração com GameScene

### Bark → Alerta Humanos + Counter Animais

```typescript
this.player.cruella.on('bark', (bx, by) => {
  ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
    if (e instanceof HumanEnemy) {
      const dist = Phaser.Math.Distance.Between(bx, by, e.x, e.y)
      e.onBarkHeard(dist)                     // HumanEnemy decide: detect ou chase
    } else {
      e.stun(2000)                            // animais: stun existente
      e.tryCounter('cruella', 'bark')         // verifica janela de counter
    }
  })
})
```

### Dash da Raya → Counter Check

```typescript
this.player.raya.on('dashed', () => {
  ;(this.enemyGroup.getChildren() as Enemy[]).forEach(e => {
    const dist = Phaser.Math.Distance.Between(
      this.player.raya.x, this.player.raya.y, e.x, e.y
    )
    if (dist <= 80) e.tryCounter('raya', 'dash')
  })
})
```

---

## Feedback Visual das Janelas de Counter

Quando uma janela de counter está aberta:
- **Outline ciano** no inimigo = counter de Cruella disponível (bark)
- **Outline laranja** no inimigo = counter de Raya disponível (dash/jump)

Implementado via `Graphics` overlay com `strokeRect`/`strokeCircle` pulsante — sem nova textura. Jogadores experientes ignoram; iniciantes usam como guia.

Sucesso de counter: `_fx.enemyDeathBurst` potenciado (mais partículas) + `scorePopupBounce` com cor diferenciada.

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/entities/enemies/EnemyStateMachine.ts` | **Criar** |
| `src/entities/enemies/HumanEnemy.ts` | **Criar** |
| `src/entities/enemies/Zelador.ts` | **Criar** |
| `src/entities/enemies/Morador.ts` | **Criar** |
| `src/entities/enemies/Gato.ts` | **Redesign** |
| `src/entities/enemies/Pombo.ts` | **Redesign** |
| `src/entities/enemies/Rato.ts` | **Redesign** |
| `src/entities/npc/Hugo.ts` | **Modificar** → extends HumanEnemy |
| `src/entities/npc/Hannah.ts` | **Modificar** → extends HumanEnemy |
| `src/scenes/GameScene.ts` | **Modificar** — bark + dash dispatch |
| `src/levels/World0.ts` | **Modificar** — inimigos 0-2 |
| `src/levels/World1.ts` | **Modificar** — distribuição 1-1 a 1-3 |
| `tests/EnemyStateMachine.test.ts` | **Criar** |
| `tests/CounterWindow.test.ts` | **Criar** |

---

## Testes

**`EnemyStateMachine.test.ts`** — cobre:
- Transição Patrol → Detect ao entrar no cone
- Transição Detect → Chase após 500ms
- Transição Chase → Search ao sair do range
- Transição Search → Cooldown → Patrol
- Reset para Patrol via `onBarkHeard` durante Cooldown

**`CounterWindow.test.ts`** — cobre:
- `tryCounter` retorna `true` quando estado correto + personagem correto + tipo correto
- `tryCounter` retorna `false` fora da janela de tempo
- `tryCounter` retorna `false` com personagem errado
- Janelas de Gato, Pombo e Rato individualmente

---

## Fora de Escopo

- Novos tipos de inimigos além dos listados
- Modificação dos bosses (Aspirador, Seu Bigodes)
- Sistema de dificuldade adaptativa
- AI de combate cooperativo entre inimigos
- Sons novos (reutiliza assets existentes)
