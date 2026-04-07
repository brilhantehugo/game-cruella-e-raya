import { describe, it, expect, beforeEach } from 'vitest'
import { GameState } from '../src/GameState'

describe('GameState', () => {
  let state: GameState

  beforeEach(() => {
    state = new GameState()
  })

  it('começa com 3 corações e raya ativa', () => {
    expect(state.hearts).toBe(3)
    expect(state.activeDog).toBe('raya')
    expect(state.score).toBe(0)
  })

  it('troca de cachorra e define cooldown', () => {
    const swapped = state.swap(0)
    expect(swapped).toBe(true)
    expect(state.activeDog).toBe('cruella')
    expect(state.canSwap(1000)).toBe(false)
    expect(state.canSwap(1500)).toBe(true)
  })

  it('não troca antes do cooldown expirar', () => {
    state.swap(0)
    const swapped = state.swap(1000)
    expect(swapped).toBe(false)
    expect(state.activeDog).toBe('cruella')
  })

  it('takeDamage reduz coração e retorna true', () => {
    const lost = state.takeDamage(0)
    expect(lost).toBe(true)
    expect(state.hearts).toBe(2)
  })

  it('laço absorve um hit sem perder coração', () => {
    state.equippedAccessory = 'laco'
    const lost = state.takeDamage(0)
    expect(lost).toBe(false)
    expect(state.hearts).toBe(3)
    expect(state.equippedAccessory).toBeNull()
  })

  it('isDead retorna true com 0 corações', () => {
    state.hearts = 0
    expect(state.isDead()).toBe(true)
    state.hearts = 1
    expect(state.isDead()).toBe(false)
  })

  it('bloqueia troca após levar dano', () => {
    state.takeDamage(0)
    expect(state.canSwap(1000)).toBe(false)
    expect(state.canSwap(2000)).toBe(true)
  })

  it('power-up expira após 10s', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('petisco', 5000)).toBe(true)
    expect(state.hasPowerUp('petisco', 10001)).toBe(false)
    expect(state.activePowerUp).toBeNull()
  })

  it('hasPowerUp retorna false para tipo errado', () => {
    state.applyPowerUp('petisco', 0)
    expect(state.hasPowerUp('pipoca', 5000)).toBe(false)
  })

  it('coleta ossos dourados por fase', () => {
    state.collectGoldenBone('1-1', 0)
    state.collectGoldenBone('1-1', 2)
    expect(state.goldenBones['1-1']).toEqual([true, false, true])
  })

  it('addScore acumula pontos', () => {
    state.addScore(10)
    state.addScore(50)
    expect(state.score).toBe(60)
  })

  it('restoreHeart não ultrapassa 3', () => {
    state.restoreHeart()
    expect(state.hearts).toBe(3)
    state.hearts = 2
    state.restoreHeart()
    expect(state.hearts).toBe(3)
  })

  it('reset limpa todo o estado', () => {
    state.hearts = 1
    state.score = 999
    state.activeDog = 'cruella'
    state.collarOfGold = true
    state.reset()
    expect(state.hearts).toBe(3)
    expect(state.score).toBe(0)
    expect(state.activeDog).toBe('raya')
    expect(state.collarOfGold).toBe(false)
  })

  it('setCheckpoint armazena posição', () => {
    state.setCheckpoint(400, 300)
    expect(state.checkpointReached).toBe(true)
    expect(state.checkpointX).toBe(400)
    expect(state.checkpointY).toBe(300)
  })

  describe('resetAtCheckpoint', () => {
    it('restaura corações para 3, limpa power-ups e acessório', () => {
      state.hearts = 0
      state.equippedAccessory = 'laco'
      state.activePowerUp = { type: 'petisco', expiresAt: 99999 }
      state.swapBlockedUntil = 5000
      state.lastHitAt = 1000
      state.resetAtCheckpoint()
      expect(state.hearts).toBe(3)
      expect(state.equippedAccessory).toBeNull()
      expect(state.activePowerUp).toBeNull()
      expect(state.swapBlockedUntil).toBe(0)
      expect(state.lastHitAt).toBe(0)
    })

    it('mantém score, goldenBones e checkpoint', () => {
      state.score = 999
      state.goldenBones = { '1-1': [true, false, true] }
      state.setCheckpoint(400, 300)
      state.hearts = 0
      state.resetAtCheckpoint()
      expect(state.score).toBe(999)
      expect(state.goldenBones['1-1']).toEqual([true, false, true])
      expect(state.checkpointReached).toBe(true)
      expect(state.checkpointX).toBe(400)
      expect(state.checkpointY).toBe(300)
    })
  })

  it('muted começa false', () => {
    expect(state.muted).toBe(false)
  })

  it('muted pode ser alternado', () => {
    state.muted = true
    expect(state.muted).toBe(true)
    state.muted = false
    expect(state.muted).toBe(false)
  })

  describe('resetLevel', () => {
    it('restaura corações, limpa checkpoint e power-ups', () => {
      state.hearts = 0
      state.equippedAccessory = 'bandana'
      state.activePowerUp = { type: 'pipoca', expiresAt: 99999 }
      state.setCheckpoint(200, 100)
      state.resetLevel()
      expect(state.hearts).toBe(3)
      expect(state.equippedAccessory).toBeNull()
      expect(state.activePowerUp).toBeNull()
      expect(state.checkpointReached).toBe(false)
      expect(state.checkpointX).toBe(0)
      expect(state.checkpointY).toBe(0)
    })

    it('mantém score e goldenBones mas limpa checkpoint', () => {
      state.score = 500
      state.goldenBones = { '1-1': [true, true, false] }
      state.setCheckpoint(400, 300)
      state.hearts = 0
      state.resetLevel()
      expect(state.score).toBe(500)
      expect(state.goldenBones['1-1']).toEqual([true, true, false])
      expect(state.checkpointReached).toBe(false)
    })
  })

  describe('contadores de sessão', () => {
    it('começa zerados', () => {
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBe(0)
    })

    it('resetLevel zera contadores e define sessionStartTime', () => {
      state.sessionDeaths = 3
      state.sessionEnemiesKilled = 7
      const before = Date.now()
      state.resetLevel()
      const after = Date.now()
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBeGreaterThanOrEqual(before)
      expect(state.sessionStartTime).toBeLessThanOrEqual(after)
    })

    it('reset zera contadores de sessão', () => {
      state.sessionDeaths = 5
      state.sessionEnemiesKilled = 10
      state.sessionStartTime = 999999
      state.reset()
      expect(state.sessionDeaths).toBe(0)
      expect(state.sessionEnemiesKilled).toBe(0)
      expect(state.sessionStartTime).toBe(0)
    })
  })
})
