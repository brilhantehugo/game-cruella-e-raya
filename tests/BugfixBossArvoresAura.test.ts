// tests/BugfixBossArvoresAura.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_0_BOSS } from '../src/levels/World0'
import { LEVEL_2_2, LEVEL_2_4 } from '../src/levels/World2'

describe('Bug 1 — Boss World 0', () => {
  it('player spawn está em x=256 (não x=64)', () => {
    expect(LEVEL_0_BOSS.spawnX).toBe(256)
  })

  it('nenhum balcao interno tem blocking:true (apenas x:150 e grade x:1820)', () => {
    const blockingBalcaos = LEVEL_0_BOSS.decorations?.filter(
      d => d.type === 'balcao' && d.blocking === true && d.x !== 150
    ) ?? []
    expect(blockingBalcaos).toHaveLength(0)
  })
})

describe('Bug 2 — Árvores indoor World 2', () => {
  it('fase 2-2 (Pátio Interior) não tem árvores', () => {
    const arvores = LEVEL_2_2.decorations?.filter(d => d.type === 'arvore') ?? []
    expect(arvores).toHaveLength(0)
  })

  it('fase 2-4 (Escadas de Emergência) não tem árvores', () => {
    const arvores = LEVEL_2_4.decorations?.filter(d => d.type === 'arvore') ?? []
    expect(arvores).toHaveLength(0)
  })

  it('fase 2-2 tem planta nos locais onde havia árvore (x:1250 e x:2650)', () => {
    const plantas = LEVEL_2_2.decorations?.filter(d => d.type === 'planta') ?? []
    const xs = plantas.map(p => p.x)
    expect(xs).toContain(1250)
    expect(xs).toContain(2650)
  })

  it('fase 2-4 tem lixeira nos locais onde havia árvore (x:750 e x:1800)', () => {
    const lixeiras = LEVEL_2_4.decorations?.filter(d => d.type === 'lixeira') ?? []
    const xs = lixeiras.map(l => l.x)
    expect(xs).toContain(750)
    expect(xs).toContain(1800)
  })
})
