# Spec TD1 — Counter Type-Safe (remover `as any` de tryCounter)

**Data:** 2026-06-05
**Status:** Aprovado

**Goal:** Eliminar os 3 casts `(e as any).tryCounter` declarando `tryCounter` como método opcional no tipo base `Enemy`, dando type-safety ao sistema de counter sem mudar comportamento.

---

## Contexto

3 inimigos (GatoMalencarado, RatoDeCalcada, PomboAgitado — e GatoSelvagem por herança) implementam:
```typescript
tryCounter(character: 'raya' | 'cruella', type: 'bark' | 'dash' | 'jump'): boolean
```

O tipo base `Enemy` não declara o método, então os 3 call sites em `CollisionSetup` usam `(e as any).tryCounter?.(...)` — type debt. Enemies sem counter (NPCs, bosses) simplesmente não têm o método.

---

## Solução

Declarar `tryCounter` como **método concreto com default `return false`** no `Enemy` base. As subclasses sobrescrevem (método-sobre-método, válido).

> **Nota de implementação:** a primeira tentativa (propriedade opcional `tryCounter?: (...) => boolean`) falhou com **TS2425** — TypeScript proíbe uma classe declarar membro como propriedade enquanto a subclasse o define como método. O método concreto default resolve e ainda elimina os `as any` E os `?.`/`?? false` (o método sempre existe).

```typescript
// src/entities/Enemy.ts, antes de `abstract update`:
/**
 * Contra-ataque: subclasses que reagem a bark/dash/jump sobrescrevem este método.
 * Default retorna false (inimigo não tem janela de counter).
 */
tryCounter(_character: 'raya' | 'cruella', _type: 'bark' | 'dash' | 'jump'): boolean {
  return false
}
```

- Enemies sem counter (NPCs, bosses, Aspirador, HumanEnemy) herdam o default `false` — comportamento idêntico ao `(e as any).tryCounter?.(...) ?? false` anterior.
- **Não toca os arquivos de inimigo** — a assinatura dos métodos `tryCounter` deles já bate (override válido).

### Call sites — `src/scenes/CollisionSetup.ts`

Como `tryCounter` agora é sempre definido e retorna boolean, removem-se o cast E o `?.`/`?? false`:

| Linha | Antes | Depois |
|---|---|---|
| 77 | `(e as any).tryCounter?.('raya', 'jump') ?? false` | `e.tryCounter('raya', 'jump')` |
| 169 | `(e as any).tryCounter?.('cruella', 'bark') ?? false` | `e.tryCounter('cruella', 'bark')` |
| 211 | `(e as any).tryCounter?.('raya', 'dash') ?? false` | `e.tryCounter('raya', 'dash')` |

Onde `e` já é tipado como `Enemy` no escopo dos call sites.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/entities/Enemy.ts` | Método concreto `tryCounter()` default `false` |
| `src/scenes/CollisionSetup.ts` | Remover 3 `as any` + `?.`/`?? false` redundantes |

---

## Estratégia de Teste

Sem nova lógica pura — é anotação de tipo + remoção de cast. O **build é a verificação**: se as assinaturas não batessem, `tsc` falharia.

- `npm run build` sem erros TS.
- `npx vitest run` — suíte verde (sem mudança de comportamento).

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Interface `Counterable` + type guard separado | Mais código para ganho igual; propriedade opcional no base é mais enxuta |
| Remover outros `as any` (GameScene, ItemCollectHandler, AchievementsScene) | Casts distintos, contextos diferentes — specs separadas se desejado |
| Extrair tipos `CounterCharacter`/`CounterType` compartilhados | Os inimigos já inlineiam as uniões; extrair tocaria 4+ arquivos sem ganho funcional |
