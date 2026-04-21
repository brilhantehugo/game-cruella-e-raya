import { describe, it, expect } from 'vitest'
import { RAYA_SPRITE, CRUELLA_SPRITE } from '../src/sprites/SpriteData'

describe('RAYA_SPRITE dimensions', () => {
  it('has frameWidth=32 and frameHeight=32', () => {
    expect(RAYA_SPRITE.frameWidth).toBe(32)
    expect(RAYA_SPRITE.frameHeight).toBe(32)
  })

  it('every frame has exactly 32 rows, each with exactly 32 columns', () => {
    RAYA_SPRITE.frames.forEach((frame, fi) => {
      expect(frame.length).toBe(32)
      frame.forEach((row, ri) => {
        expect(row.length).toBe(32)
      })
    })
  })
})

describe('CRUELLA_SPRITE dimensions', () => {
  it('has frameWidth=28 and frameHeight=28', () => {
    expect(CRUELLA_SPRITE.frameWidth).toBe(28)
    expect(CRUELLA_SPRITE.frameHeight).toBe(28)
  })

  it('every frame has exactly 28 rows, each with exactly 28 columns', () => {
    CRUELLA_SPRITE.frames.forEach((frame, fi) => {
      expect(frame.length).toBe(28)
      frame.forEach((row, ri) => {
        expect(row.length).toBe(28)
      })
    })
  })
})
