import { describe, it, expect } from 'vitest'

// Lógica pura da janela de combo extraída para teste
function isComboActive(dashTime: number, swapTime: number, windowMs: number = 600): boolean {
  return swapTime < dashTime + windowMs
}

describe('Combo Dash→Swap window', () => {
  it('ativa combo quando swap ocorre dentro de 600ms do dash', () => {
    expect(isComboActive(1000, 1400)).toBe(true)  // 400ms depois
    expect(isComboActive(1000, 1599)).toBe(true)  // 599ms depois
  })

  it('não ativa combo quando swap ocorre exatamente em 600ms ou depois', () => {
    expect(isComboActive(1000, 1600)).toBe(false) // exatamente 600ms
    expect(isComboActive(1000, 1700)).toBe(false) // 700ms depois
  })

  it('não ativa combo sem dash anterior (dashTime = 0)', () => {
    // swapTime > 0 + 600 = 600, então qualquer swapTime > 600 falha
    expect(isComboActive(0, 800)).toBe(false)
  })
})
