// tests/CompletudoJogo.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_1_2, LEVEL_1_BOSS } from '../src/levels/World1'
import { LEVEL_2_2, LEVEL_2_BOSS } from '../src/levels/World2'
import { LEVEL_3_1, LEVEL_3_BOSS } from '../src/levels/World3'
import { LEVEL_0_BOSS } from '../src/levels/World0'

describe('Bloco B2 — Heart items no level data', () => {
  it('LEVEL_0_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_0_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_1_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_1_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_2_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_2_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })

  it('LEVEL_3_BOSS tem pelo menos 1 item heart', () => {
    const hearts = LEVEL_3_BOSS.items?.filter(i => i.type === 'heart') ?? []
    expect(hearts.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Bloco C1 — Golden bones estratégicos e inimigos agrupados', () => {
  it('LEVEL_1_2 bone #2 (índice 1) está em y <= 48 — requer dash de Raya', () => {
    const bones = LEVEL_1_2.goldenBones ?? []
    expect(bones[1].y).toBeLessThanOrEqual(48)
  })

  it('LEVEL_2_2 tem inimigos em x:1200, x:1270 e x:1320 — favorece latido de Cruella', () => {
    const enemies = LEVEL_2_2.enemies ?? []
    const xs = enemies.map(e => e.x)
    expect(xs).toContain(1200)
    expect(xs).toContain(1270)
    expect(xs).toContain(1320)
  })

  it('LEVEL_3_1 bone #3 (índice 2) está em x:2350 — além do raio de visão padrão', () => {
    const bones = LEVEL_3_1.goldenBones ?? []
    expect(bones[2].x).toBe(2350)
  })
})
