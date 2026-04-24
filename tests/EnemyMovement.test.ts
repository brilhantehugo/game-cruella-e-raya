import { describe, it, expect } from 'vitest'
import { donoChaseVelocity } from '../src/systems/EnemyMovement'

describe('donoChaseVelocity', () => {
  it('retorna 0 quando não está no chão (previne queda de plataforma)', () => {
    expect(donoChaseVelocity(200, 110, false)).toBe(0)
  })

  it('retorna 0 quando dx negativo e não está no chão', () => {
    expect(donoChaseVelocity(-150, 110, false)).toBe(0)
  })

  it('retorna 0 quando dentro da zona morta (|dx| <= 8) mesmo no chão', () => {
    expect(donoChaseVelocity(5, 110, true)).toBe(0)
  })

  it('retorna 0 quando dx exactamente no limite da zona morta (dx === 8)', () => {
    expect(donoChaseVelocity(8, 110, true)).toBe(0)
  })

  it('retorna velocidade positiva quando alvo está à direita e está no chão', () => {
    expect(donoChaseVelocity(100, 110, true)).toBe(110)
  })

  it('retorna velocidade negativa quando alvo está à esquerda e está no chão', () => {
    expect(donoChaseVelocity(-100, 110, true)).toBe(-110)
  })

  it('usa o speed passado como parâmetro', () => {
    expect(donoChaseVelocity(50, 200, true)).toBe(200)
  })

  it('dx === 9 (um acima do limite) já devolve velocidade', () => {
    expect(donoChaseVelocity(9, 110, true)).toBe(110)
  })
})
