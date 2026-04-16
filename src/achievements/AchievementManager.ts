import { AchievementDef } from './AchievementDef'
import { ACHIEVEMENTS } from './achievements'

const STORAGE_KEY = 'cruella-achievements'

interface AchievementState {
  unlocked: string[]
  counters: Record<string, number>
  flags: Record<string, boolean>
}

export type NotifyEvent =
  | 'enemy_killed'
  | 'golden_bone'
  | 'item_collected'
  | 'boss_defeated'
  | 'level_complete'
  | 'world_complete'
  | 'ending_seen'
  | 'player_died'

export type NotifyPayload = {
  type?: string
  levelId?: string
  fightDurationMs?: number
  damageTaken?: number
  playerHpFull?: boolean
  usedCheckpoint?: boolean
  timeLeft?: number
  killCount?: number
  world?: string
}

export class AchievementManager {
  private _state: AchievementState
  private readonly _onUnlock: (def: AchievementDef) => void

  constructor(onUnlock: (def: AchievementDef) => void) {
    this._onUnlock = onUnlock
    this._state = this._load()
  }

  notify(event: NotifyEvent, payload: NotifyPayload = {}): void {
    this._applyEvent(event, payload)
    this._evaluateAll()
    this._save()
  }

  getUnlocked(): string[] {
    return [...this._state.unlocked]
  }

  isUnlocked(id: string): boolean {
    return this._state.unlocked.includes(id)
  }

  getCounter(key: string): number {
    return this._state.counters[key] ?? 0
  }

  getProgress(def: AchievementDef): { current: number; total: number } | null {
    if (def.condition.type !== 'counter') return null
    return {
      current: Math.min(this._state.counters[def.condition.key] ?? 0, def.condition.threshold),
      total: def.condition.threshold,
    }
  }

  private _applyEvent(event: NotifyEvent, payload: NotifyPayload): void {
    const s = this._state
    const inc = (key: string, by = 1) => { s.counters[key] = (s.counters[key] ?? 0) + by }
    const flag = (key: string) => { s.flags[key] = true }

    switch (event) {
      case 'enemy_killed':
        inc('enemies_killed')
        break
      case 'golden_bone':
        inc('golden_bones')
        break
      case 'item_collected':
        inc('items_collected')
        if (payload.type === 'pizza') inc('pizzas_collected')
        break
      case 'boss_defeated':
        inc('bosses_defeated')
        if ((payload.fightDurationMs ?? Infinity) < 90_000) flag('speed_kill_achieved')
        if (payload.damageTaken === 0)     flag('no_damage_boss')
        if (payload.playerHpFull === true) flag('full_health_boss')
        break
      case 'level_complete':
        if (payload.killCount === 0)         flag('pacifist_level')
        if ((payload.timeLeft ?? 0) >= 60)   flag('speedrun_level')
        if (!payload.usedCheckpoint)         flag('checkpoint_free_level')
        break
      case 'world_complete':
        if (payload.world) flag(`world_${payload.world}_done`)
        if (this._state.flags['no_death_current_run'] !== false) flag('no_death_world')
        this._state.flags['no_death_current_run'] = true
        break
      case 'ending_seen':
        flag('ending_seen')
        break
      case 'player_died':
        this._state.flags['no_death_current_run'] = false
        break
    }
  }

  private _evaluateAll(): void {
    for (const def of ACHIEVEMENTS) {
      if (this._state.unlocked.includes(def.id)) continue
      if (this._meetsCondition(def)) {
        this._state.unlocked.push(def.id)
        this._onUnlock(def)
      }
    }
  }

  private _meetsCondition(def: AchievementDef): boolean {
    const { condition } = def
    if (condition.type === 'counter') {
      return (this._state.counters[condition.key] ?? 0) >= condition.threshold
    }
    if (condition.type === 'flag') {
      return !!this._state.flags[condition.key]
    }
    return false
  }

  private _load(): AchievementState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AchievementState>
        return {
          unlocked: parsed.unlocked ?? [],
          counters: parsed.counters ?? {},
          flags:    parsed.flags    ?? {},
        }
      }
    } catch { /* ignore corrupt data */ }
    return { unlocked: [], counters: {}, flags: {} }
  }

  private _save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state))
  }
}
