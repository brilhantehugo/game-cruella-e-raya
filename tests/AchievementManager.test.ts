import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AchievementManager } from '../src/achievements/AchievementManager'

// Mock localStorage
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem:    (k: string) => storage[k] ?? null,
  setItem:    (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear:      () => { Object.keys(storage).forEach(k => delete storage[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('AchievementManager', () => {
  let am: AchievementManager
  const onUnlock = vi.fn()

  beforeEach(() => {
    localStorageMock.clear()
    onUnlock.mockClear()
    am = new AchievementManager(onUnlock)
  })

  it('começa sem conquistas desbloqueadas', () => {
    expect(am.getUnlocked()).toEqual([])
  })

  it('notifica callback ao desbloquear achievement por counter', () => {
    am.notify('enemy_killed')
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_blood' })
    )
  })

  it('não notifica twice para o mesmo achievement', () => {
    am.notify('enemy_killed')
    am.notify('enemy_killed')
    const calls = onUnlock.mock.calls.filter(c => c[0].id === 'first_blood')
    expect(calls).toHaveLength(1)
  })

  it('acumula counter até threshold', () => {
    for (let i = 0; i < 49; i++) am.notify('enemy_killed')
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pest_control' })
    )
    am.notify('enemy_killed') // 50º
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pest_control' })
    )
  })

  it('desbloqueia achievement por flag', () => {
    am.notify('ending_seen')
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'true_ending' })
    )
  })

  it('persiste estado em localStorage', () => {
    am.notify('enemy_killed')
    const saved = JSON.parse(localStorage.getItem('cruella-achievements')!)
    expect(saved.counters.enemies_killed).toBe(1)
    expect(saved.unlocked).toContain('first_blood')
  })

  it('carrega estado persistido ao reiniciar', () => {
    am.notify('enemy_killed')
    const am2 = new AchievementManager(onUnlock)
    expect(am2.getUnlocked()).toContain('first_blood')
  })

  it('não volta a desbloquear achievements já guardados', () => {
    am.notify('enemy_killed')
    onUnlock.mockClear()
    const am2 = new AchievementManager(onUnlock)
    am2.notify('enemy_killed')
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'first_blood' })
    )
  })

  it('boss_defeated incrementa contador e avalia boss_slayer', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 60000, damageTaken: 0, playerHpFull: true })
    expect(am.getCounter('bosses_defeated')).toBe(1)
  })

  it('speed_kill: define flag se fightDurationMs < 90000', () => {
    am.notify('boss_defeated', { levelId: '1-boss', fightDurationMs: 80000, damageTaken: 1, playerHpFull: false })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speed_kill' })
    )
  })

  it('speed_kill: não define flag se fightDurationMs >= 90000', () => {
    am.notify('boss_defeated', { levelId: '1-boss', fightDurationMs: 95000, damageTaken: 1, playerHpFull: false })
    expect(onUnlock).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speed_kill' })
    )
  })

  it('no_damage_boss: define flag se damageTaken === 0', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 120000, damageTaken: 0, playerHpFull: true })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'no_damage_boss' })
    )
  })

  it('full_health_boss: define flag se playerHpFull === true', () => {
    am.notify('boss_defeated', { levelId: '0-boss', fightDurationMs: 120000, damageTaken: 0, playerHpFull: true })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'full_health_boss' })
    )
  })

  it('level_complete: pacifist se killCount === 0', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 100, damageTaken: 0, killCount: 0 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pacifist' })
    )
  })

  it('level_complete: speedrunner se timeLeft >= 60', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 65, damageTaken: 0, killCount: 3 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'speedrunner' })
    )
  })

  it('level_complete: checkpoint_free se usedCheckpoint === false', () => {
    am.notify('level_complete', { usedCheckpoint: false, timeLeft: 10, damageTaken: 1, killCount: 3 })
    expect(onUnlock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'checkpoint_free' })
    )
  })

  it('pizza: item_collected com type pizza incrementa counter', () => {
    am.notify('item_collected', { type: 'pizza' })
    expect(am.getCounter('pizzas_collected')).toBe(1)
    expect(am.getCounter('items_collected')).toBe(1)
  })
})
