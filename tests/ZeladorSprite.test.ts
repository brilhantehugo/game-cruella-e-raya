import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { KEYS } from '../src/constants'

describe('Zelador', () => {
  it('source usa KEYS.ZELADOR (não KEYS.HUGO) como texture key', () => {
    const source = readFileSync('src/entities/enemies/Zelador.ts', 'utf-8')
    expect(source).toContain('KEYS.ZELADOR')
    expect(source).not.toContain('KEYS.HUGO')
  })

  it('source não chama setTint (placeholder removido)', () => {
    const source = readFileSync('src/entities/enemies/Zelador.ts', 'utf-8')
    expect(source).not.toContain('setTint')
  })

  it('KEYS.ZELADOR está definido e é distinto de KEYS.HUGO', () => {
    expect(KEYS.ZELADOR).toBeDefined()
    expect(KEYS.ZELADOR).toBe('zelador')
    expect(KEYS.ZELADOR).not.toBe(KEYS.HUGO)
  })
})
