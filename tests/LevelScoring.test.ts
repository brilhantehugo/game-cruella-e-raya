import { describe, it, expect } from 'vitest'
import { ALL_LEVELS } from '../src/levels'
import { maxLevelScore, levelsWithGoldenBones } from '../src/systems/LevelScoring'
import { LevelData } from '../src/levels/LevelData'

const p = { x: 0, y: 0 }

describe('ALL_LEVELS', () => {
  it('tem 24 fases', () => {
    expect(Object.keys(ALL_LEVELS)).toHaveLength(24)
  })
})

describe('maxLevelScore', () => {
  it('é positivo para toda fase', () => {
    for (const id of Object.keys(ALL_LEVELS)) {
      expect(maxLevelScore(ALL_LEVELS[id])).toBeGreaterThan(0)
    }
  })

  it('soma inimigos, ossos e ossos dourados', () => {
    const lvl = {
      enemies: [{}, {}],
      items: [{ type: 'bone' }, { type: 'pizza' }],
      goldenBones: [p, p, p],
      isBossLevel: false,
    } as unknown as LevelData
    expect(maxLevelScore(lvl)).toBe(2 * 50 + 1 * 10 + 3 * 500)
  })

  it('soma bônus de chefe', () => {
    const lvl = {
      enemies: [{}, {}],
      items: [],
      goldenBones: [],
      isBossLevel: true,
    } as unknown as LevelData
    expect(maxLevelScore(lvl)).toBe(1000 + 2 * 50)
  })
})

describe('levelsWithGoldenBones', () => {
  it('lista fases do mundo com ossos dourados', () => {
    const w0 = levelsWithGoldenBones('0')
    expect(w0).toContain('0-3')
    expect(w0).not.toContain('0-boss')
    expect(levelsWithGoldenBones('2')).toContain('2-4')
  })
})
