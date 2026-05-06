// tests/ItemMessages.test.ts
import { describe, it, expect } from 'vitest'
import { LEVEL_0_1 } from '../src/levels/World0'
import { POWERUP_LABEL } from '../src/constants'

describe('POWERUP_LABEL', () => {
  it('petisco tem texto de velocidade', () => {
    expect(POWERUP_LABEL['petisco'].text).toBe('⚡ +10s vel!')
    expect(POWERUP_LABEL['petisco'].color).toBe('#ff8800')
  })

  it('pipoca tem texto de pulo', () => {
    expect(POWERUP_LABEL['pipoca'].text).toBe('🦘 +10s pulo!')
    expect(POWERUP_LABEL['pipoca'].color).toBe('#ffff00')
  })

  it('churrasco tem texto de carne', () => {
    expect(POWERUP_LABEL['churrasco'].text).toBe('🥩 +10s força!')
    expect(POWERUP_LABEL['churrasco'].color).toBe('#ff4400')
  })

  it('bola e frisbee têm a mesma cor', () => {
    expect(POWERUP_LABEL['bola'].color).toBe('#44ff88')
    expect(POWERUP_LABEL['frisbee'].color).toBe('#44ff88')
  })

  it('tipo desconhecido não está no mapa (fallback no runtime)', () => {
    expect(POWERUP_LABEL['inexistente']).toBeUndefined()
  })
})

describe('Fix porta falsa — World0 fase 0-1', () => {
  it('não tem grade em x=2950', () => {
    const gradeNear = LEVEL_0_1.decorations.find(
      d => d.type === 'grade' && d.x === 2950
    )
    expect(gradeNear).toBeUndefined()
  })

  it('tem balcao em x=2950', () => {
    const balcao = LEVEL_0_1.decorations.find(
      d => d.type === 'balcao' && d.x === 2950
    )
    expect(balcao).toBeDefined()
  })
})
