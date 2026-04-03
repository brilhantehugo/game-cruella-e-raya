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
})
