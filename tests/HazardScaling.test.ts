import { describe, it, expect } from 'vitest'
import type { LevelData } from '../src/levels/LevelData'
import { WORLD_DIFFICULTY, type WorldDifficulty } from '../src/constants'

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

describe('Enemy.applyDifficulty (lógica isolada)', () => {
  it('multiplica speed pelo speedMult', () => {
    const baseSpeed = 80
    const diff = WORLD_DIFFICULTY['3']   // speedMult: 1.45
    const newSpeed = baseSpeed * diff.speedMult
    expect(newSpeed).toBeCloseTo(80 * 1.45, 1)
  })

  it('packChase é true para world2 e world3', () => {
    expect(WORLD_DIFFICULTY['2'].packChase).toBe(true)
    expect(WORLD_DIFFICULTY['3'].packChase).toBe(true)
  })

  it('longChase é true apenas para world3', () => {
    expect(WORLD_DIFFICULTY['0'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['1'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['2'].longChase).toBe(false)
    expect(WORLD_DIFFICULTY['3'].longChase).toBe(true)
  })

  it('aggressionMult < 1 para worlds avançados (inimigo mais persistente)', () => {
    expect(WORLD_DIFFICULTY['3'].aggressionMult).toBeLessThan(1)
  })
})

import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

describe('Hazards nos mundos', () => {
  it('fases não-boss têm pelo menos 1 hazard', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    const nonBoss = allLevels.filter(l => !l.isBossLevel)
    nonBoss.forEach(l => {
      expect((l.hazards ?? []).length, `${l.id} sem hazard`).toBeGreaterThan(0)
    })
  })

  it('boss levels não têm hazards', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    allLevels.filter(l => l.isBossLevel).forEach(l => {
      expect((l.hazards ?? []).length, `boss ${l.id} tem hazard`).toBe(0)
    })
  })

  it('spikes têm width > 0', () => {
    const allLevels = [
      ...Object.values(WORLD0_LEVELS), ...Object.values(WORLD1_LEVELS),
      ...Object.values(WORLD2_LEVELS), ...Object.values(WORLD3_LEVELS),
    ]
    allLevels.flatMap(l => l.hazards ?? [])
      .filter(h => h.type === 'spike')
      .forEach(h => expect(h.width, 'spike sem width').toBeGreaterThan(0))
  })
})

// Suprime aviso de import não utilizado — WorldDifficulty é usado como type guard
const _wdTypeCheck: WorldDifficulty = WORLD_DIFFICULTY['0']
void _wdTypeCheck
