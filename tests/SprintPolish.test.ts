import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { HUMAN_SPAWN_Y } from '../src/levels/LevelData'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

const HUMAN_TYPES = ['hugo', 'hannah', 'zelador', 'morador', 'dono', 'porteiro'] as const

const ALL_LEVELS = {
  ...WORLD0_LEVELS,
  ...WORLD1_LEVELS,
  ...WORLD2_LEVELS,
  ...WORLD3_LEVELS,
}

describe('HUMAN_SPAWN_Y constant', () => {
  it('deve ser 385 (fórmula: 416 - (44 × 1.4) / 2)', () => {
    expect(HUMAN_SPAWN_Y).toBe(385)
  })
})

describe('Spawn Y de inimigos humanos', () => {
  Object.values(ALL_LEVELS).forEach(level => {
    const humanEnemies = level.enemies.filter(e =>
      (HUMAN_TYPES as readonly string[]).includes(e.type)
    )
    humanEnemies.forEach(enemy => {
      it(`${level.id}: ${enemy.type} @ x=${enemy.x} deve usar HUMAN_SPAWN_Y=${HUMAN_SPAWN_Y}`, () => {
        expect(enemy.y).toBe(HUMAN_SPAWN_Y)
      })
    })
  })
})

describe('Decorações: blocking rules', () => {
  it('LEVEL_0_1: cadeiras não devem ter blocking=true', () => {
    const cadeiras = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'cadeira')
    cadeiras.forEach(c => expect(c.blocking).not.toBe(true))
  })

  it('LEVEL_0_1: mesas não devem ter blocking=true', () => {
    const mesas = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'mesa')
    mesas.forEach(m => expect(m.blocking).not.toBe(true))
  })

  it('LEVEL_0_1: estantes não devem ter blocking=true', () => {
    const estantes = WORLD0_LEVELS['0-1'].decorations.filter(d => d.type === 'estante')
    estantes.forEach(e => expect(e.blocking).not.toBe(true))
  })

  it('LEVEL_0_BOSS: cadeiras e mesas não devem ter blocking=true', () => {
    const moveis = WORLD0_LEVELS['0-boss'].decorations.filter(
      d => d.type === 'cadeira' || d.type === 'mesa'
    )
    moveis.forEach(m => expect(m.blocking).not.toBe(true))
  })
})

describe('Decorações: grades consecutivas em 0-3', () => {
  it('nenhum par de grades consecutivas deve ter espaçamento < 80px', () => {
    const grades = WORLD0_LEVELS['0-3'].decorations
      .filter(d => d.type === 'grade')
      .sort((a, b) => a.x - b.x)
    for (let i = 1; i < grades.length; i++) {
      const spacing = grades[i].x - grades[i - 1].x
      expect(spacing).toBeGreaterThanOrEqual(80)
    }
  })
})

describe('LEVEL_1_1: arvore não deve estar perto da casa', () => {
  it('nenhuma arvore entre x=1800 e x=2300', () => {
    const arvores = WORLD1_LEVELS['1-1'].decorations.filter(d => d.type === 'arvore')
    arvores.forEach(arv => {
      const nearCasa = arv.x >= 1800 && arv.x <= 2300
      expect(nearCasa).toBe(false)
    })
  })
})
