import { describe, it, expect } from 'vitest'
import { shouldShake } from '../src/fx/cameraShake'

describe('shouldShake', () => {
  it('permite shake quando movimento normal', () => {
    expect(shouldShake(false)).toBe(true)
  })
  it('bloqueia shake quando reduzir movimento ativo', () => {
    expect(shouldShake(true)).toBe(false)
  })
})
