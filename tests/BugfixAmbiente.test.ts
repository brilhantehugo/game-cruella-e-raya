import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { LEVEL_0_1 } from '../src/levels/World0'
import { LEVEL_1_1 } from '../src/levels/World1'

const PARALLAX = readFileSync(
  join(__dirname, '..', 'src', 'background', 'ParallaxBackground.ts'),
  'utf-8'
)

describe('ParallaxBackground', () => {
  it('chama setScrollFactor(0) em cada layer', () => {
    expect(PARALLAX).toContain('setScrollFactor(0)')
  })
})

describe('LEVEL_1_1 decorations', () => {
  it('nenhuma arvore deve estar dentro da faixa visual da casa (x 1100–1900)', () => {
    const casaX = LEVEL_1_1.decorations?.find(d => d.type === 'casa')?.x ?? 0
    const arvores = LEVEL_1_1.decorations?.filter(d => d.type === 'arvore') ?? []
    arvores.forEach(arv => {
      const insideCasa = arv.x > casaX && arv.x < casaX + 800
      expect(insideCasa).toBe(false)
    })
  })
})

describe('LEVEL_0_1 Aspirador miniBoss bugfix', () => {
  it('triggerX deve ser maior que 2300 (perto do final do mapa)', () => {
    expect(LEVEL_0_1.miniBoss!.triggerX).toBeGreaterThan(2300)
  })

  it('spawnX deve ser maior que triggerX', () => {
    expect(LEVEL_0_1.miniBoss!.spawnX).toBeGreaterThan(LEVEL_0_1.miniBoss!.triggerX)
  })

  it('rightBarrierX nao pode exceder 3072 (largura do mapa)', () => {
    expect(LEVEL_0_1.miniBoss!.rightBarrierX).toBeLessThanOrEqual(3072)
  })
})
