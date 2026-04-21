import { describe, it, expect, beforeEach } from 'vitest'
import { ProfileManager } from '../src/storage/ProfileManager'

// Mock localStorage para ambiente Node
const storage: Record<string, string> = {}
const localStorageMock = {
  getItem:    (k: string) => storage[k] ?? null,
  setItem:    (k: string, v: string) => { storage[k] = v },
  removeItem: (k: string) => { delete storage[k] },
  clear:      () => { Object.keys(storage).forEach(k => delete storage[k]) },
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

describe('ProfileManager', () => {
  let pm: ProfileManager

  beforeEach(() => {
    localStorageMock.clear()
    pm = new ProfileManager()
  })

  it('getAll retorna [] sem dados', () => {
    expect(pm.getAll()).toEqual([])
  })

  it('getActive retorna null sem perfil', () => {
    expect(pm.getActive()).toBeNull()
  })

  it('create cria perfil e o torna ativo', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.name).toBe('Hugo')
    expect(p.dog).toBe('raya')
    expect(pm.getActive()?.id).toBe(p.id)
  })

  it('create desbloqueia fases iniciais', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.levels['0-1']).toBeDefined()
    expect(p.levels['1-1']).toBeDefined()
  })

  it('lança erro ao exceder 3 perfis', () => {
    pm.create('A', 'raya')
    pm.create('B', 'cruella')
    pm.create('C', 'raya')
    expect(() => pm.create('D', 'cruella')).toThrow()
  })

  it('delete remove perfil e limpa ativo se necessário', () => {
    const p = pm.create('Hugo', 'raya')
    pm.delete(p.id)
    expect(pm.getAll()).toHaveLength(0)
    expect(pm.getActive()).toBeNull()
  })

  it('isUnlocked retorna false para fase não desbloqueada', () => {
    pm.create('Hugo', 'raya')
    expect(pm.isUnlocked('1-3')).toBe(false)
  })

  it('unlockLevel desbloqueia fase', () => {
    pm.create('Hugo', 'raya')
    pm.unlockLevel('1-3')
    expect(pm.isUnlocked('1-3')).toBe(true)
  })

  it('saveLevel persiste recorde e acumula stats', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 1500, bestTime: 90,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 7, playCount: 1,
    })
    const profile = pm.getActive()!
    expect(profile.levels['1-1'].bestScore).toBe(1500)
    expect(profile.levels['1-1'].medal).toBe('gold')
    expect(profile.levels['1-1'].goldenBones).toEqual([true, true, true])
  })

  it('saveLevel mantém melhor score entre runs', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'bronze', bestScore: 800, bestTime: 120,
      goldenBones: [true, false, false], totalDeaths: 2, totalEnemiesKilled: 3, playCount: 1,
    })
    pm.saveLevel('1-1', {
      completed: true, medal: 'silver', bestScore: 1200, bestTime: 100,
      goldenBones: [false, true, false], totalDeaths: 1, totalEnemiesKilled: 5, playCount: 1,
    })
    const lvl = pm.getActive()!.levels['1-1']
    expect(lvl.bestScore).toBe(1200)
    expect(lvl.medal).toBe('silver')
    expect(lvl.goldenBones).toEqual([true, true, false])
    expect(lvl.totalDeaths).toBe(3)
  })

  it('saveLevel não rebaixa medalha ouro→prata', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 1900, bestTime: 80,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 7, playCount: 1,
    })
    pm.saveLevel('1-1', {
      completed: true, medal: 'silver', bestScore: 1000, bestTime: 150,
      goldenBones: [false, false, false], totalDeaths: 3, totalEnemiesKilled: 3, playCount: 1,
    })
    expect(pm.getActive()!.levels['1-1'].medal).toBe('gold')
  })

  it('getMedal retorna null para fase sem recorde', () => {
    pm.create('Hugo', 'raya')
    expect(pm.getMedal('1-2')).toBeNull()
  })
})

describe('SAVE_VERSION migration', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('perfil legado sem version é descartado no load', () => {
    const legacyProfile = { name: 'Teste', dogType: 'raya', levels: {}, totalScore: 500 }
    localStorage.setItem('rcgame_profiles', JSON.stringify([legacyProfile]))
    localStorage.setItem('rcgame_active_profile', '0')
    const pm = new ProfileManager()
    expect(pm.getAll()).toHaveLength(0)
  })

  it('perfil com version correta é preservado', () => {
    const validProfile = {
      name: 'Valido', dogType: 'cruella', levels: {}, totalScore: 200, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([validProfile]))
    localStorage.setItem('rcgame_active_profile', '0')
    const pm = new ProfileManager()
    expect(pm.getAll()).toHaveLength(1)
    expect(pm.getAll()[0].name).toBe('Valido')
  })

  it('novo perfil gravado inclui version: 2', () => {
    const pm = new ProfileManager()
    pm.create('NovoPerfil', 'raya')
    const raw = JSON.parse(localStorage.getItem('rcgame_profiles') ?? '[]')
    expect(raw[0].version).toBe(2)
  })
})

describe('ProfileManager.calcMedal', () => {
  it('ouro: 3 bones + score≥80% + 0 mortes', () => {
    expect(ProfileManager.calcMedal(1600, [true,true,true], 0, 2000)).toBe('gold')
  })

  it('não ouro se morreu mesmo com bones e score alto', () => {
    expect(ProfileManager.calcMedal(1600, [true,true,true], 1, 2000)).toBe('silver')
  })

  it('prata: 2 bones', () => {
    expect(ProfileManager.calcMedal(400, [true,true,false], 5, 2000)).toBe('silver')
  })

  it('prata: score≥60% e ≤2 mortes', () => {
    expect(ProfileManager.calcMedal(1200, [false,false,false], 2, 2000)).toBe('silver')
  })

  it('não prata: score≥60% mas 3 mortes', () => {
    expect(ProfileManager.calcMedal(1200, [false,false,false], 3, 2000)).toBe('bronze')
  })

  it('bronze: qualquer conclusão', () => {
    expect(ProfileManager.calcMedal(100, [false,false,false], 10, 2000)).toBe('bronze')
  })
})

describe('ProfileManager upgrades', () => {
  let pm: ProfileManager

  beforeEach(() => {
    localStorageMock.clear()
    pm = new ProfileManager()
  })

  it('hasUpgrade retorna false se não comprado', () => {
    pm.create('Hugo', 'raya')
    expect(pm.hasUpgrade('heart_plus')).toBe(false)
  })

  it('saveUpgrade persiste e hasUpgrade retorna true', () => {
    pm.create('Hugo', 'raya')
    pm.saveUpgrade('heart_plus')
    expect(pm.hasUpgrade('heart_plus')).toBe(true)
  })

  it('hasUpgrade retorna false sem perfil ativo', () => {
    expect(pm.hasUpgrade('dash_fast')).toBe(false)
  })

  it('getTotalGoldenBones soma bones coletados em todos os níveis', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 100, bestTime: 60,
      goldenBones: [true, true, false], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    pm.saveLevel('0-1', {
      completed: true, medal: 'bronze', bestScore: 50, bestTime: 90,
      goldenBones: [true, false, false], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    expect(pm.getTotalGoldenBones()).toBe(3)
  })

  it('getTotalGoldenBones retorna 0 sem perfil', () => {
    expect(pm.getTotalGoldenBones()).toBe(0)
  })

  it('getSpentBones soma custos dos upgrades comprados', () => {
    pm.create('Hugo', 'raya')
    pm.saveUpgrade('heart_plus')  // custo 8
    pm.saveUpgrade('dash_fast')   // custo 6
    expect(pm.getSpentBones()).toBe(14)
  })

  it('getSpentBones retorna 0 sem upgrades comprados', () => {
    pm.create('Hugo', 'raya')
    expect(pm.getSpentBones()).toBe(0)
  })

  it('getAvailableBones = total - spent', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('1-1', {
      completed: true, medal: 'gold', bestScore: 100, bestTime: 60,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
    })
    expect(pm.getAvailableBones()).toBe(3)
    pm.saveUpgrade('swap_fast')  // custo 5
    expect(pm.getAvailableBones()).toBe(-2)
  })

  it('novo perfil inicializa upgrades como objeto vazio', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.upgrades).toEqual({})
  })
})
