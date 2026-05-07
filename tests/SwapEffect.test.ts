// tests/SwapEffect.test.ts
import { describe, it, expect } from 'vitest'
import { SWAP_COLORS } from '../src/constants'

describe('SWAP_COLORS', () => {
  it('Raya tem cor azul', () => {
    expect(SWAP_COLORS.raya.hex).toBe(0x44aaff)
    expect(SWAP_COLORS.raya.r).toBe(68)
    expect(SWAP_COLORS.raya.g).toBe(170)
    expect(SWAP_COLORS.raya.b).toBe(255)
  })

  it('Cruella tem cor vermelha', () => {
    expect(SWAP_COLORS.cruella.hex).toBe(0xff4444)
    expect(SWAP_COLORS.cruella.r).toBe(255)
    expect(SWAP_COLORS.cruella.g).toBe(68)
    expect(SWAP_COLORS.cruella.b).toBe(68)
  })

  it('flash duration é 180ms para ambos', () => {
    expect(SWAP_COLORS.raya.flash).toBe(180)
    expect(SWAP_COLORS.cruella.flash).toBe(180)
  })
})
