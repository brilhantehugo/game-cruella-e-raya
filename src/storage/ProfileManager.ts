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
}

const STORAGE_KEY        = 'rcgame_profiles'
const ACTIVE_KEY         = 'rcgame_active_profile'
const MAX_PROFILES       = 3
const DEFAULT_LEVEL      = '0-1'
const STARTING_LEVELS    = ['0-1', '1-1']

export class ProfileManager {
  // ── Leitura ──────────────────────────────────────────────────────────

  getAll(): PlayerProfile[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PlayerProfile[]) : []
    } catch {
      return []
    }
  }

  getActive(): PlayerProfile | null {
    const id = localStorage.getItem(ACTIVE_KEY)
    if (!id) return null
    return this.getAll().find(p => p.id === id) ?? null
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
    localStorage.setItem(ACTIVE_KEY, id)
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
      localStorage.removeItem(ACTIVE_KEY)
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
    all[idx].totalScore      = Math.max(all[idx].totalScore, record.bestScore)
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
    const rank: Record<string, number> = { gold: 3, silver: 2, bronze: 1 }
    if (!a && !b) return null
    if (!a) return b
    if (!b) return a
    return (rank[a] ?? 0) >= (rank[b] ?? 0) ? a : b
  }

  private _persist(profiles: PlayerProfile[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  }
}

export const profileManager = new ProfileManager()
