import { describe, it, expect, vi } from 'vitest'
import { LevelBuilder } from '../src/systems/LevelBuilder'

const mockScene = {
  add: { existing: vi.fn() },
  physics: { add: { existing: vi.fn() } },
  sys: { events: { on: vi.fn(), once: vi.fn(), off: vi.fn() } },
  events: { on: vi.fn(), once: vi.fn() },
} as unknown as Phaser.Scene

describe('LevelBuilder.createEnemy', () => {
  it('retorna null e loga warning para tipo desconhecido', () => {
    const builder = new LevelBuilder(mockScene)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = builder.createEnemy('alienígena', 0, 0)
    expect(result).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('alienígena'))
    warnSpy.mockRestore()
  })
})
