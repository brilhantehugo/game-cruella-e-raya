import { describe, it, expect } from 'vitest'
import { computeMotoBossPhase } from '../src/entities/enemies/SegurancaMoto'

describe('computeMotoBossPhase', () => {
  it('phase 1 at full HP (9/9)', () => {
    expect(computeMotoBossPhase(9, 9)).toBe(1)
  })

  it('phase 1 just above 66%', () => {
    expect(computeMotoBossPhase(7, 9)).toBe(1)    // 7/9 ≈ 0.78
  })

  it('phase 2 at exactly 66% (6/9)', () => {
    expect(computeMotoBossPhase(6, 9)).toBe(2)    // 6/9 ≈ 0.67
  })

  it('phase 2 between 33% and 66%', () => {
    expect(computeMotoBossPhase(4, 9)).toBe(2)
  })

  it('phase 3 at exactly 33% (3/9)', () => {
    expect(computeMotoBossPhase(3, 9)).toBe(3)
  })

  it('phase 3 at 1 HP', () => {
    expect(computeMotoBossPhase(1, 9)).toBe(3)
  })
})
