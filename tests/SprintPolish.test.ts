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

describe('Escala de personagens', () => {
  const cruellaTs = readFileSync(join(__dirname, '..', 'src/entities/Cruella.ts'), 'utf-8')
  const rayaTs    = readFileSync(join(__dirname, '..', 'src/entities/Raya.ts'), 'utf-8')

  it('Cruella deve usar setScale(1.4)', () => {
    expect(cruellaTs).toContain('setScale(1.4)')
  })

  it('Raya deve usar setScale(1.4)', () => {
    expect(rayaTs).toContain('setScale(1.4)')
  })

  it('Cruella não deve ter setScale(1.2)', () => {
    expect(cruellaTs).not.toContain('setScale(1.2)')
  })

  it('Raya não deve ter setScale(1.2)', () => {
    expect(rayaTs).not.toContain('setScale(1.2)')
  })
})

describe('Escala de inimigos', () => {
  const gatoTs = readFileSync(join(__dirname, '..', 'src/entities/enemies/GatoMalencarado.ts'), 'utf-8')

  it('GatoMalencarado deve usar setScale(1.6)', () => {
    expect(gatoTs).toContain('setScale(1.6)')
  })
})

describe('Escala dos bosses', () => {
  const bigodes = readFileSync(join(__dirname, '..', 'src/entities/enemies/SeuBigodes.ts'), 'utf-8')
  const zelBoss = readFileSync(join(__dirname, '..', 'src/entities/enemies/ZeladorBoss.ts'), 'utf-8')
  const gameScene = readFileSync(join(__dirname, '..', 'src/scenes/GameScene.ts'), 'utf-8')

  it('SeuBigodes deve usar setScale(2.0)', () => {
    expect(bigodes).toContain('setScale(2.0)')
  })

  it('SeuBigodes não deve ter setScale(1.4)', () => {
    expect(bigodes).not.toContain('setScale(1.4)')
  })

  it('ZeladorBoss deve usar setScale(2.0)', () => {
    expect(zelBoss).toContain('setScale(2.0)')
  })

  it('ZeladorBoss não deve ter setScale(1.4)', () => {
    expect(zelBoss).not.toContain('setScale(1.4)')
  })

  it('ZeladorBoss deve spawnar em y=376 no GameScene', () => {
    expect(gameScene).toContain('new ZeladorBoss(this, mapWidth / 2, 376)')
  })

  it('SeuBigodes deve spawnar em y=376 no GameScene', () => {
    expect(gameScene).toContain('new SeuBigodes(this, 480, 376)')
  })
})
