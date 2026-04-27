import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

const PARALLAX = readFileSync(
  join(__dirname, '..', 'src', 'background', 'ParallaxBackground.ts'),
  'utf-8'
)

describe('ParallaxBackground', () => {
  it('chama setScrollFactor(0) em cada layer', () => {
    expect(PARALLAX).toContain('setScrollFactor(0)')
  })
})
