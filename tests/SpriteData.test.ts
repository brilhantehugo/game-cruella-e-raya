import { describe, it, expect } from 'vitest'
import { existsSync, statSync } from 'fs'
import { join } from 'path'

const SPRITES_DIR = join(__dirname, '..', 'public', 'sprites')

describe('Raya spritesheet PNG', () => {
  it('exists at public/sprites/raya.png', () => {
    expect(existsSync(join(SPRITES_DIR, 'raya.png'))).toBe(true)
  })

  it('is a non-empty file (at least 1 KB)', () => {
    const { size } = statSync(join(SPRITES_DIR, 'raya.png'))
    expect(size).toBeGreaterThan(1024)
  })
})

describe('Cruella spritesheet PNG', () => {
  it('exists at public/sprites/cruella.png', () => {
    expect(existsSync(join(SPRITES_DIR, 'cruella.png'))).toBe(true)
  })

  it('is a non-empty file (at least 1 KB)', () => {
    const { size } = statSync(join(SPRITES_DIR, 'cruella.png'))
    expect(size).toBeGreaterThan(1024)
  })
})
