# Spec H1 — Higiene de Testes: Remover Worktree Stale + Blindar Exclude

**Data:** 2026-06-01
**Status:** Aprovado

**Goal:** Eliminar o ruído permanente de "2 testes falhando" removendo uma worktree antiga já mergeada e blindando o `exclude` do vitest contra worktrees futuras.

---

## Contexto

A worktree `.claude/worktrees/thirsty-saha-481e75` (branch `claude/thirsty-saha-481e75` @ `ebfc63d`) é remanescente de uma sessão anterior. O commit já é ancestral de `main` (fully merged). Ela contém seu próprio `tests/e2e/`, e como o `exclude: ['tests/e2e/**']` do vitest é relativo à raiz, o caminho aninhado `.claude/worktrees/.../tests/e2e/` não é excluído — fazendo 2 arquivos e2e Playwright falharem em toda rodada de `vitest run`.

---

## Solução

### 1. Remover a worktree stale

```bash
git worktree remove .claude/worktrees/thirsty-saha-481e75
git worktree prune
git branch -d claude/thirsty-saha-481e75
```

`git branch -d` (não `-D`) confirma que está mergeada antes de deletar — verificado: `ebfc63d` é ancestral de `main`.

### 2. Blindar o exclude do vitest

Em `vite.config.ts`, expandir o `exclude` para prevenir recorrência:

```typescript
exclude: ['tests/e2e/**', '**/.claude/worktrees/**', '**/node_modules/**'],
```

`**/node_modules/**` é o default do vitest — incluído explicitamente para não ser perdido ao sobrescrever `exclude`. `**/.claude/worktrees/**` ignora qualquer worktree futura.

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `.claude/worktrees/thirsty-saha-481e75` | **Remover** — worktree + branch mergeada |
| `vite.config.ts` | Expandir `exclude` |

---

## Estratégia de Teste

- `npx vitest run` — 0 arquivos falhando; apenas os testes reais passando.
- `npm run build` — inalterado.

Nenhum código de jogo é tocado.

---

## Fora do Escopo

| Item | Motivo |
|---|---|
| Ícone de osso no HUD (G1) | Spec separada |
| Converter e2e Playwright para rodar corretamente | Eles rodam via `@playwright/test`, não vitest; o exclude é o comportamento correto |
