import { describe, it, expect } from 'vitest'
import { ALL_LEVELS } from '../src/levels'
import { maxLevelScore, levelsWithGoldenBones } from '../src/systems/LevelScoring'
import { LevelData } from '../src/levels/LevelData'
import { SCORING } from '../src/constants'
import { readFileSync } from 'fs'
import { join } from 'path'

const p = { x: 0, y: 0 }

describe('ALL_LEVELS', () => {
  it('tem 24 fases', () => {
    expect(Object.keys(ALL_LEVELS)).toHaveLength(24)
  })
})

describe('maxLevelScore', () => {
  it('é positivo para toda fase', () => {
    for (const id of Object.keys(ALL_LEVELS)) {
      expect(maxLevelScore(ALL_LEVELS[id])).toBeGreaterThan(0)
    }
  })

  it('soma inimigos, ossos e ossos dourados', () => {
    const lvl = {
      enemies: [{}, {}],
      items: [{ type: 'bone' }, { type: 'pizza' }],
      goldenBones: [p, p, p],
      isBossLevel: false,
    } as unknown as LevelData
    expect(maxLevelScore(lvl)).toBe(2 * 50 + 1 * 10 + 3 * 500)
  })

  it('soma bônus de chefe', () => {
    const lvl = {
      enemies: [{}, {}],
      items: [],
      goldenBones: [],
      isBossLevel: true,
    } as unknown as LevelData
    expect(maxLevelScore(lvl)).toBe(1000 + 2 * 50)
  })
})

describe('levelsWithGoldenBones', () => {
  it('lista fases do mundo com ossos dourados', () => {
    const w0 = levelsWithGoldenBones('0')
    expect(w0).toContain('0-3')
    expect(w0).not.toContain('0-boss')
    expect(levelsWithGoldenBones('2')).toContain('2-4')
  })
})

describe('recompensa de chefe x pontuação máxima', () => {
  it('em toda fase de chefe, SCORING.BOSS_KILL ≥ 80% do máximo (ouro alcançável)', () => {
    const bossIds = Object.keys(ALL_LEVELS).filter(id => ALL_LEVELS[id].isBossLevel)
    expect(bossIds).toHaveLength(4)
    for (const id of bossIds) {
      expect(SCORING.BOSS_KILL).toBeGreaterThanOrEqual(0.8 * maxLevelScore(ALL_LEVELS[id]))
    }
  })

  it('os quatro handlers died de chefe em BossSetup pagam SCORING.BOSS_KILL', () => {
    const src = readFileSync(join(__dirname, '..', 'src/scenes/BossSetup.ts'), 'utf-8')
    // Primeiro addScore depois de cada boss.on('died', ...)
    const rewards = [...src.matchAll(/boss\.on\('died'[\s\S]*?addScore\(([^)]*)\)/g)].map(m => m[1].trim())
    expect(rewards).toEqual(['SCORING.BOSS_KILL', 'SCORING.BOSS_KILL', 'SCORING.BOSS_KILL', 'SCORING.BOSS_KILL'])
  })
})

describe('LevelCompleteScene: fallback de ossos dourados', () => {
  it('sem dados de ossos usa slots false do tamanho da fase (nunca [] que daria ouro)', () => {
    const src = readFileSync(join(__dirname, '..', 'src/scenes/LevelCompleteScene.ts'), 'utf-8')
    expect(src).not.toMatch(/data\?\.goldenBones\s*\?\?\s*\[\]/)
    expect(src).toMatch(/new Array\(levelData\?\.goldenBones\.length \?\? 0\)\.fill\(false\)/)
  })
})
