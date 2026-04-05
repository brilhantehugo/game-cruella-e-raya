import { describe, it, expect } from 'vitest'
import { LEVEL_1_1, LEVEL_1_2, LEVEL_1_3, LEVEL_1_BOSS } from '../src/levels/World1'

describe('LevelData.timeLimit', () => {
  it('fases normais têm timeLimit de 200s', () => {
    expect(LEVEL_1_1.timeLimit).toBe(200)
    expect(LEVEL_1_2.timeLimit).toBe(200)
    expect(LEVEL_1_3.timeLimit).toBe(200)
  })

  it('boss level tem timeLimit 0 (sem limite)', () => {
    expect(LEVEL_1_BOSS.timeLimit).toBe(0)
  })
})

describe('getTimerColor', () => {
  function getTimerColor(remaining: number): string {
    if (remaining <= 10) return 'red'
    if (remaining <= 30) return 'orange'
    return 'white'
  }

  it('retorna white para tempo acima de 30s', () => {
    expect(getTimerColor(200)).toBe('white')
    expect(getTimerColor(31)).toBe('white')
  })

  it('retorna orange entre 11s e 30s', () => {
    expect(getTimerColor(30)).toBe('orange')
    expect(getTimerColor(15)).toBe('orange')
    expect(getTimerColor(11)).toBe('orange')
  })

  it('retorna red com 10s ou menos', () => {
    expect(getTimerColor(10)).toBe('red')
    expect(getTimerColor(1)).toBe('red')
    expect(getTimerColor(0)).toBe('red')
  })
})
