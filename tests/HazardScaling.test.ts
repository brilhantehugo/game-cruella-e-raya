import { describe, it, expect } from 'vitest'
import type { LevelData } from '../src/levels/LevelData'
import { WORLD_DIFFICULTY } from '../src/constants'

describe('HazardDef types', () => {
  it('LevelData aceita hazards como campo opcional', () => {
    const partial: Partial<LevelData> = {
      hazards: [
        { type: 'spike',     x: 800,  y: 408, width: 32 },
        { type: 'fall-zone', x: 1200, y: 0,   width: 64 },
      ],
    }
    expect(partial.hazards).toHaveLength(2)
    expect(partial.hazards![0].type).toBe('spike')
    expect(partial.hazards![1].type).toBe('fall-zone')
  })
})

describe('WORLD_DIFFICULTY', () => {
  it('existe para os 4 mundos', () => {
    expect(WORLD_DIFFICULTY['0']).toBeDefined()
    expect(WORLD_DIFFICULTY['1']).toBeDefined()
    expect(WORLD_DIFFICULTY['2']).toBeDefined()
    expect(WORLD_DIFFICULTY['3']).toBeDefined()
  })

  it('world0 tem multiplicadores base 1.0 e flags false', () => {
    const d = WORLD_DIFFICULTY['0']
    expect(d.speedMult).toBe(1.0)
    expect(d.aggressionMult).toBe(1.0)
    expect(d.packChase).toBe(false)
    expect(d.longChase).toBe(false)
  })

  it('world3 tem maior dificuldade', () => {
    const d3 = WORLD_DIFFICULTY['3']
    const d0 = WORLD_DIFFICULTY['0']
    expect(d3.speedMult).toBeGreaterThan(d0.speedMult)
    expect(d3.packChase).toBe(true)
    expect(d3.longChase).toBe(true)
  })

  it('cada mundo tem speedMult crescente', () => {
    const mults = ['0','1','2','3'].map(id => WORLD_DIFFICULTY[id].speedMult)
    for (let i = 1; i < mults.length; i++) {
      expect(mults[i]).toBeGreaterThanOrEqual(mults[i-1])
    }
  })
})
