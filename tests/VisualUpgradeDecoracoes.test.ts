import { describe, it, expect } from 'vitest'
import { WORLD0_LEVELS } from '../src/levels/World0'
import { WORLD1_LEVELS } from '../src/levels/World1'
import { WORLD2_LEVELS } from '../src/levels/World2'
import { WORLD3_LEVELS } from '../src/levels/World3'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hasType(levelId: string, levels: Record<string, any>, type: string): boolean {
  const level = levels[levelId]
  if (!level) return false
  return (level.decorations ?? []).some((d: any) => d.type === type)
}

function countDecorations(levelId: string, levels: Record<string, any>): number {
  const level = levels[levelId]
  if (!level) return 0
  return (level.decorations ?? []).length
}

// ---------------------------------------------------------------------------
// World 0 — Apartamento: quadro, planta, tapete
// ---------------------------------------------------------------------------

describe('World0 apartamento — tem quadro, planta e tapete', () => {
  for (const id of ['0-1', '0-2', '0-boss']) {
    it(`${id} tem planta`, () => {
      expect(hasType(id, WORLD0_LEVELS, 'planta')).toBe(true)
    })
    it(`${id} tem quadro`, () => {
      expect(hasType(id, WORLD0_LEVELS, 'quadro')).toBe(true)
    })
    it(`${id} tem tapete`, () => {
      expect(hasType(id, WORLD0_LEVELS, 'tapete')).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// World 0 — Estacionamento: pilar e barreira
// ---------------------------------------------------------------------------

describe('World0 estacionamento — tem pilar e barreira', () => {
  for (const id of ['0-3', '0-4', '0-5']) {
    it(`${id} tem pilar`, () => {
      expect(hasType(id, WORLD0_LEVELS, 'pilar')).toBe(true)
    })
    it(`${id} tem barreira`, () => {
      expect(hasType(id, WORLD0_LEVELS, 'barreira')).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// World 1 — Rua: orelhao, semaforo, banca
// ---------------------------------------------------------------------------

describe('World1 — tem orelhao, semaforo e banca', () => {
  for (const id of ['1-1', '1-2', '1-3', '1-4', '1-5']) {
    it(`${id} tem orelhao`, () => {
      expect(hasType(id, WORLD1_LEVELS, 'orelhao')).toBe(true)
    })
    it(`${id} tem semaforo`, () => {
      expect(hasType(id, WORLD1_LEVELS, 'semaforo')).toBe(true)
    })
    it(`${id} tem banca`, () => {
      expect(hasType(id, WORLD1_LEVELS, 'banca')).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// World 2 — Praça: fonte e floreira
// ---------------------------------------------------------------------------

describe('World2 — tem fonte e floreira', () => {
  for (const id of ['2-1', '2-2', '2-3', '2-4', '2-5']) {
    it(`${id} tem fonte`, () => {
      expect(hasType(id, WORLD2_LEVELS, 'fonte')).toBe(true)
    })
    it(`${id} tem floreira`, () => {
      expect(hasType(id, WORLD2_LEVELS, 'floreira')).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// World 3 — Rua de Noite: outdoor e bueiro
// ---------------------------------------------------------------------------

describe('World3 — tem outdoor e bueiro', () => {
  for (const id of ['3-1', '3-2', '3-3', '3-4', '3-5']) {
    it(`${id} tem outdoor`, () => {
      expect(hasType(id, WORLD3_LEVELS, 'outdoor')).toBe(true)
    })
    it(`${id} tem bueiro`, () => {
      expect(hasType(id, WORLD3_LEVELS, 'bueiro')).toBe(true)
    })
  }
})

// ---------------------------------------------------------------------------
// Densidade mínima por fase
// ---------------------------------------------------------------------------

describe('Densidade mínima de decorações por fase', () => {
  it('0-1 tem ao menos 18 decorações', () => {
    expect(countDecorations('0-1', WORLD0_LEVELS)).toBeGreaterThanOrEqual(18)
  })
  it('0-2 tem ao menos 12 decorações', () => {
    expect(countDecorations('0-2', WORLD0_LEVELS)).toBeGreaterThanOrEqual(12)
  })
  it('0-3 tem ao menos 20 decorações (inclui pilares)', () => {
    expect(countDecorations('0-3', WORLD0_LEVELS)).toBeGreaterThanOrEqual(20)
  })
  it('1-1 tem ao menos 14 decorações', () => {
    expect(countDecorations('1-1', WORLD1_LEVELS)).toBeGreaterThanOrEqual(14)
  })
  it('2-1 tem ao menos 12 decorações', () => {
    expect(countDecorations('2-1', WORLD2_LEVELS)).toBeGreaterThanOrEqual(12)
  })
  it('3-1 tem ao menos 12 decorações', () => {
    expect(countDecorations('3-1', WORLD3_LEVELS)).toBeGreaterThanOrEqual(12)
  })
})
