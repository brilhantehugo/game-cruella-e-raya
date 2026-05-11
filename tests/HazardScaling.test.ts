import { describe, it, expect } from 'vitest'
import type { LevelData } from '../src/levels/LevelData'

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
