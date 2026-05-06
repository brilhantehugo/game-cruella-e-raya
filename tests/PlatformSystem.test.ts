import { describe, it, expect } from 'vitest'
import type { MovingPlatformSpawn } from '../src/levels/LevelData'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

// ── Interface ──────────────────────────────────────────────────────────────────

describe('MovingPlatformSpawn interface', () => {
  it('plataforma eixo-x é válida', () => {
    const p: MovingPlatformSpawn = { x: 500, y: 300, width: 96, axis: 'x', range: 120, speed: 80 }
    expect(p.axis).toBe('x')
    expect(p.speed).toBeGreaterThan(0)
    expect(p.range).toBeGreaterThan(0)
  })

  it('plataforma eixo-y é válida', () => {
    const p: MovingPlatformSpawn = { x: 800, y: 250, width: 96, axis: 'y', range: 60, speed: 50 }
    expect(p.axis).toBe('y')
    expect(p.width).toBeGreaterThan(0)
  })
})

// ── Presença por mundo ────────────────────────────────────────────────────────

describe('World0 tem movingPlatforms em fases de apartamento', () => {
  it('0-1 tem ao menos 2 plataformas dinâmicas', () => {
    expect((WORLD0_LEVELS['0-1'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
  })
  it('0-2 tem ao menos 2 plataformas dinâmicas', () => {
    expect((WORLD0_LEVELS['0-2'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
  })
  it('0-boss tem ao menos 1 plataforma dinâmica', () => {
    expect((WORLD0_LEVELS['0-boss'].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(1)
  })
})

describe('World1 tem movingPlatforms', () => {
  for (const id of ['1-1', '1-2', '1-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD1_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('World2 tem movingPlatforms', () => {
  for (const id of ['2-1', '2-2', '2-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD2_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

describe('World3 tem movingPlatforms', () => {
  for (const id of ['3-1', '3-2', '3-3']) {
    it(`${id} tem ao menos 2 plataformas dinâmicas`, () => {
      expect((WORLD3_LEVELS[id].movingPlatforms ?? []).length).toBeGreaterThanOrEqual(2)
    })
  }
})

// ── Validação de dados ────────────────────────────────────────────────────────

describe('Dados de movingPlatforms são válidos', () => {
  const allLevels = [
    ...Object.values(WORLD0_LEVELS),
    ...Object.values(WORLD1_LEVELS),
    ...Object.values(WORLD2_LEVELS),
    ...Object.values(WORLD3_LEVELS),
  ]

  it('todas as plataformas dinâmicas têm speed > 0 e range > 0', () => {
    for (const level of allLevels) {
      for (const p of level.movingPlatforms ?? []) {
        expect(p.speed).toBeGreaterThan(0)
        expect(p.range).toBeGreaterThan(0)
        expect(p.width).toBeGreaterThan(0)
      }
    }
  })

  it('axis é sempre x ou y', () => {
    for (const level of allLevels) {
      for (const p of level.movingPlatforms ?? []) {
        expect(['x', 'y']).toContain(p.axis)
      }
    }
  })
})
