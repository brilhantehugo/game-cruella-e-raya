import { DogType } from '../GameState'
import { ALL_LEVELS } from '../levels'

export type Medal = 'gold' | 'silver' | 'bronze'

export interface LevelRecord {
  completed: boolean
  medal: Medal | null
  bestScore: number
  bestTime: number          // segundos
  goldenBones: boolean[]    // um slot por osso dourado da fase
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
const SAVE_VERSION       = 3
const MIN_SUPPORTED_VERSION = 2

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
      const parsed = raw ? (JSON.parse(raw) as PlayerProfile[]) : []
      const profiles = parsed.filter(p => (p.version ?? 0) >= MIN_SUPPORTED_VERSION)
      let migrated = false
      for (const p of profiles) {
        if ((p.version ?? 0) < SAVE_VERSION) {
          this._migrateToCurrent(p)
          migrated = true
        }
      }
      if (migrated) this._persist(profiles)
      return profiles
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
      profile.levels[lv] = this._emptyRecord(lv)
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
      goldenBones:        this._unionBones(
                            existing?.goldenBones ?? [],
                            record.goldenBones,
                            this._boneCount(levelId),
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
      all[idx].levels[levelId] = this._emptyRecord(levelId)
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
    if (!(key in UPGRADE_COSTS)) return
    if (this.getAvailableBones() < (UPGRADE_COSTS[key] ?? 0)) return
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

  // Ouro: todos os ossos da fase + score≥80% + 0 mortes (fase sem ossos conta como "todos")
  // Prata: metade dos ossos da fase, ou score≥60% com ≤2 mortes
  static calcMedal(
    score: number,
    bonesCollected: number,
    bonesTotal: number,
    deaths: number,
    maxScore: number,
  ): Medal {
    if (maxScore <= 0) return 'bronze'
    const ratio = score / maxScore

    if (bonesCollected >= bonesTotal && ratio >= 0.8 && deaths === 0) return 'gold'
    if (
      (bonesTotal > 0 && bonesCollected >= Math.ceil(bonesTotal / 2)) ||
      (ratio >= 0.6 && deaths <= 2)
    ) return 'silver'
    return 'bronze'
  }

  // ── Privados ─────────────────────────────────────────────────────────

  private _boneCount(levelId: string): number {
    return ALL_LEVELS[levelId]?.goldenBones.length ?? 0
  }

  // União de ossos: nunca encolhe; tamanho = max(existente, novo, tamanho real da fase)
  private _unionBones(a: boolean[], b: boolean[], levelLen: number): boolean[] {
    const len = Math.max(a.length, b.length, levelLen)
    return Array.from({ length: len }, (_, i) => !!(a[i] || b[i]))
  }

  private _migrateToCurrent(p: PlayerProfile): void {
    for (const [levelId, lvl] of Object.entries(p.levels ?? {})) {
      lvl.goldenBones = this._unionBones(lvl.goldenBones ?? [], [], this._boneCount(levelId))
    }
    p.version = SAVE_VERSION
  }

  private _emptyRecord(levelId: string): LevelRecord {
    return {
      completed: false, medal: null, bestScore: 0, bestTime: 0,
      goldenBones: new Array<boolean>(this._boneCount(levelId)).fill(false),
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
