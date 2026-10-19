import { describe, it, expect } from 'vitest'
import { ALL_LEVELS } from '../src/levels'
import { maxLevelScore } from '../src/systems/LevelScoring'
import type { LevelData } from '../src/levels/LevelData'

describe('maxLevelScore World 3', () => {
  it('has a positive max score for every World 3 level', () => {
    for (const id of ['3-1', '3-2', '3-3', '3-4', '3-5', '3-boss']) {
      expect(maxLevelScore(ALL_LEVELS[id])).toBeGreaterThan(0)
    }
  })
})

describe('LevelData.hasSpotlight', () => {
  it('accepts hasSpotlight: true without type error', () => {
    const partial: Partial<LevelData> = { hasSpotlight: true, playerAuraRadius: 130 }
    expect(partial.hasSpotlight).toBe(true)
    expect(partial.playerAuraRadius).toBe(130)
  })

  it('hasSpotlight defaults to undefined when omitted', () => {
    const partial: Partial<LevelData> = {}
    expect(partial.hasSpotlight).toBeUndefined()
  })
})
