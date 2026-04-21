import { DogType } from '../GameState'

export type Medal = 'gold' | 'silver' | 'bronze'

export interface LevelRecord {
  completed: boolean
  medal: Medal | null
  bestScore: number
  bestTime: number          // segundos
  goldenBones: boolean[]    // [bone0, bone1, bone2]
  totalDeaths: number
  totalEnemiesKilled: number
  playCount: number
}

export interface PlayerProfile {
  id: string                // Date.now().toString()
  name: string
  dog: DogType
  createdAt: number
  lastPlayedAt: number
  currentLevel: string
  totalScore: number
  levels: Record<string, LevelRecord>
  upgrades: Record<string, boolean>
  version?: number          // SAVE_VERSION for migrations
}

const STORAGE_KEY        = 'rcgame_profiles'
const ACTIVE_KEY         = 'rcgame_active_profile'
const MAX_PROFILES       = 3
const DEFAULT_LEVEL      = '0-1'
const STARTING_LEVELS    = ['0-1', '1-1']
const SAVE_VERSION       = 2

const UPGRADE_COSTS: Record<string, number> = {
  heart_plus: 8,
  dash_fast:  6,
  bark_wide:  6,
  swap_fast:  5,
  bone_radar: 7,
}

export class ProfileManager {
  // ── Leitura ──────────────────────────────────────────────────────────

  getAll(): PlayerProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const profiles = raw ? (JSON.parse(raw) as PlayerProfile[]) : []
      return profiles.filter(p => (p.version ?? 0) >= SAVE_VERSION)
    } catch {
      return []
    }
  }

  getActive(): PlayerProfile | null {
    try {
      const id = localStorage.getItem(ACTIVE_KEY)
      if (!id) return null
      return this.getAll().find(p => p.id === id) ?? null
    } catch {
      return null
    }
  }

  // ── Gestão de perfis ─────────────────────────────────────────────────

  create(name: string, dog: DogType): PlayerProfile {
    const all = this.getAll()
    if (all.length >= MAX_PROFILES) {
      throw new Error(`Limite de ${MAX_PROFILES} perfis atingido`)
    }
    const profile: PlayerProfile = {
      id: Date.now().toString(),
      name: name.trim() || 'Jogador',
      dog,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      currentLevel: DEFAULT_LEVEL,
      totalScore: 0,
      levels: {},
      upgrades: {},
      version: SAVE_VERSION,
    }
    // Desbloqueia fases iniciais
    STARTING_LEVELS.forEach(lv => {
      profile.levels[lv] = this._emptyRecord()
    })
    all.push(profile)
    this._persist(all)
    this.setActive(profile.id)
    return profile
  }

  setActive(id: string): void {
    try {
      localStorage.setItem(ACTIVE_KEY, id)
    } catch {
      // Silently ignore storage errors
    }
    // Atualiza lastPlayedAt
    const all = this.getAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx !== -1) {
      all[idx].lastPlayedAt = Date.now()
      this._persist(all)
    }
  }

  delete(id: string): void {
    const all = this.getAll().filter(p => p.id !== id)
    this._persist(all)
    // Se era o ativo, limpa
    if (localStorage.getItem(ACTIVE_KEY) === id) {
      try {
        localStorage.removeItem(ACTIVE_KEY)
      } catch {
        // Silently ignore storage errors
      }
    }
  }

  // ── Progresso ────────────────────────────────────────────────────────

  saveLevel(levelId: string, record: LevelRecord): void {
    const all   = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return

    const existing = all[idx].levels[levelId]
    const merged: LevelRecord = {
      completed:          true,
      medal:              this._bestMedal(existing?.medal ?? null, record.medal),
      bestScore:          Math.max(existing?.bestScore ?? 0, record.bestScore),
      bestTime:           existing?.bestTime
                            ? Math.min(existing.bestTime, record.bestTime)
                            : record.bestTime,
      goldenBones:        (existing?.goldenBones ?? [false, false, false]).map(
                            (prev, i) => prev || (record.goldenBones[i] ?? false)
                          ),
      totalDeaths:        (existing?.totalDeaths ?? 0) + record.totalDeaths,
      totalEnemiesKilled: (existing?.totalEnemiesKilled ?? 0) + record.totalEnemiesKilled,
      playCount:          (existing?.playCount ?? 0) + 1,
    }
    all[idx].levels[levelId] = merged
    all[idx].totalScore      = Object.values(all[idx].levels).reduce((sum, l) => sum + l.bestScore, 0)
    all[idx].currentLevel    = levelId
    all[idx].lastPlayedAt    = Date.now()
    this._persist(all)
  }

  unlockLevel(levelId: string): void {
    const all   = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return
    if (!all[idx].levels[levelId]) {
      all[idx].levels[levelId] = this._emptyRecord()
    }
    this._persist(all)
  }

  isUnlocked(levelId: string): boolean {
    const profile = this.getActive()
    if (!profile) return STARTING_LEVELS.includes(levelId)
    return !!profile.levels[levelId]
  }

  getMedal(levelId: string): Medal | null {
    return this.getActive()?.levels[levelId]?.medal ?? null
  }

  // ── Upgrades ─────────────────────────────────────────────────────────

  saveUpgrade(key: string): void {
    const all    = this.getAll()
    const active = localStorage.getItem(ACTIVE_KEY)
    if (!active) return
    const idx = all.findIndex(p => p.id === active)
    if (idx === -1) return
    if (!all[idx].upgrades) all[idx].upgrades = {}
    all[idx].upgrades[key] = true
    this._persist(all)
  }

  hasUpgrade(key: string): boolean {
    return this.getActive()?.upgrades?.[key] ?? false
  }

  getTotalGoldenBones(): number {
    const profile = this.getActive()
    if (!profile) return 0
    return Object.values(profile.levels).reduce((sum, lvl) => {
      return sum + (lvl.goldenBones ?? []).filter(Boolean).length
    }, 0)
  }

  getSpentBones(): number {
    const profile = this.getActive()
    if (!profile) return 0
    return Object.keys(profile.upgrades ?? {})
      .filter(k => profile.upgrades[k])
      .reduce((sum, k) => sum + (UPGRADE_COSTS[k] ?? 0), 0)
  }

  getAvailableBones(): number {
    return this.getTotalGoldenBones() - this.getSpentBones()
  }

  // ── Cálculo de medalha (estático, sem efeito colateral) ──────────────

  static calcMedal(
    score: number,
    bones: boolean[],
    deaths: number,
    maxScore: number,
  ): Medal | null {
    if (maxScore <= 0) return 'bronze'
    const bonesCount = bones.filter(Boolean).length
    const ratio      = score / maxScore

    if (bonesCount === 3 && ratio >= 0.8 && deaths === 0) return 'gold'
    if (bonesCount >= 2 || (ratio >= 0.6 && deaths <= 2))  return 'silver'
    return 'bronze'
  }

  // ── Privados ─────────────────────────────────────────────────────────

  private _emptyRecord(): LevelRecord {
    return {
      completed: false, medal: null, bestScore: 0, bestTime: 0,
      goldenBones: [false, false, false],
      totalDeaths: 0, totalEnemiesKilled: 0, playCount: 0,
    }
  }

  private _bestMedal(a: Medal | null, b: Medal | null): Medal | null {
    const rank: Record<Medal, number> = { gold: 3, silver: 2, bronze: 1 }
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b
  }

  private _persist(profiles: PlayerProfile[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    } catch {
      // Silently ignore storage errors (private browsing, quota exceeded)
    }
  }
}

export const profileManager = new ProfileManager()
