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

  it('novo perfil gravado inclui version: 3', () => {
    const pm = new ProfileManager()
    pm.create('NovoPerfil', 'raya')
    const raw = JSON.parse(localStorage.getItem('rcgame_profiles') ?? '[]')
    expect(raw[0].version).toBe(3)
  })
})

describe('ProfileManager.calcMedal', () => {
  it('ouro: todos os ossos da fase (2) + score≥80% + 0 mortes', () => {
    expect(ProfileManager.calcMedal(1600, 2, 2, 0, 2000)).toBe('gold')
  })

  it('ouro: fase com 4 ossos coletados todos', () => {
    expect(ProfileManager.calcMedal(1600, 4, 4, 0, 2000)).toBe('gold')
  })

  it('ouro: boss sem ossos (0/0) com score≥80% + 0 mortes', () => {
    expect(ProfileManager.calcMedal(900, 0, 0, 0, 1000)).toBe('gold')
  })

  it('prata (não ouro): faltou osso', () => {
    expect(ProfileManager.calcMedal(1600, 3, 4, 0, 2000)).toBe('silver')
  })

  it('prata (não ouro): morreu mesmo com todos os ossos', () => {
    expect(ProfileManager.calcMedal(1600, 3, 3, 1, 2000)).toBe('silver')
  })

  it('prata: metade dos ossos (2 de 4)', () => {
    expect(ProfileManager.calcMedal(100, 2, 4, 9, 2000)).toBe('silver')
  })

  it('bronze: abaixo de metade dos ossos (1 de 3) e score baixo', () => {
    expect(ProfileManager.calcMedal(100, 1, 3, 9, 2000)).toBe('bronze')
  })

  it('bronze: sem ossos na fase e score abaixo de 60%', () => {
    expect(ProfileManager.calcMedal(500, 0, 0, 3, 1000)).toBe('bronze')
  })

  it('ouro no limite: ratio exatamente 0.8, todos os ossos, 0 mortes', () => {
    expect(ProfileManager.calcMedal(800, 3, 3, 0, 1000)).toBe('gold')
  })

  it('prata no limite: ratio exatamente 0.6 com 2 mortes, fase sem ossos', () => {
    expect(ProfileManager.calcMedal(600, 0, 0, 2, 1000)).toBe('silver')
  })

  it('prata: 2 de 3 ossos (ceil(3/2) = 2) mesmo com score baixo', () => {
    expect(ProfileManager.calcMedal(0, 2, 3, 9, 2000)).toBe('silver')
  })

  it('bronze: maxScore <= 0', () => {
    expect(ProfileManager.calcMedal(500, 0, 0, 0, 0)).toBe('bronze')
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
    // heart_plus custa 8 — 3 níveis × 3 bones = 9 disponíveis
    const fullLevel = { completed: true, medal: 'gold' as const, bestScore: 100, bestTime: 60,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1 }
    pm.saveLevel('1-1', fullLevel)
    pm.saveLevel('1-2', fullLevel)
    pm.saveLevel('1-3', fullLevel)
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
    // heart_plus(8) + dash_fast(6) = 14 — 5 níveis × 3 bones = 15 disponíveis
    const fullLevel = { completed: true, medal: 'gold' as const, bestScore: 100, bestTime: 60,
      goldenBones: [true, true, true], totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1 }
    ;['1-1','1-2','1-3','1-4','1-boss'].forEach(id => pm.saveLevel(id, fullLevel))
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
    pm.saveUpgrade('swap_fast')  // custo 5 > 3 disponíveis — compra rejeitada
    expect(pm.getAvailableBones()).toBe(3)  // saldo não muda
    expect(pm.hasUpgrade('swap_fast')).toBe(false)
  })

  it('novo perfil inicializa upgrades como objeto vazio', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.upgrades).toEqual({})
  })
})

describe('ossos dourados completos + migração v2→v3', () => {
  let pm: ProfileManager
  const rec = (gb: boolean[]) => ({
    completed: true, medal: 'bronze' as const, bestScore: 100, bestTime: 50,
    goldenBones: gb, totalDeaths: 0, totalEnemiesKilled: 0, playCount: 1,
  })

  beforeEach(() => {
    localStorageMock.clear()
    pm = new ProfileManager()
  })

  it('create usa o tamanho real de ossos de cada fase', () => {
    const p = pm.create('Hugo', 'raya')
    expect(p.levels['0-1'].goldenBones.length).toBe(4)
    expect(p.levels['1-1'].goldenBones.length).toBe(3)
  })

  it('saveLevel persiste o 4º osso', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('0-1', rec([false, false, false, true]))
    expect(pm.getActive()!.levels['0-1'].goldenBones).toEqual([false, false, false, true])
  })

  it('saveLevel faz união de ossos entre runs', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('0-1', rec([true, false, false, false]))
    pm.saveLevel('0-1', rec([false, false, false, true]))
    expect(pm.getActive()!.levels['0-1'].goldenBones).toEqual([true, false, false, true])
  })

  it('migra perfil v2 estendendo ossos e persiste em v3', () => {
    const v2 = {
      id: 'p1', name: 'Velho', dog: 'raya', createdAt: 1, lastPlayedAt: 1,
      currentLevel: '0-1', totalScore: 9999,
      levels: { '0-1': { ...rec([true, true, true]), medal: 'silver', bestScore: 9999 } },
      upgrades: { dash_fast: true }, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([v2]))
    localStorage.setItem('rcgame_active_profile', 'p1')
    const p = pm.getAll()[0]
    expect(p.version).toBe(3)
    expect(p.levels['0-1'].goldenBones).toEqual([true, true, true, false])
    expect(p.levels['0-1'].medal).toBe('silver')
    expect(p.levels['0-1'].bestScore).toBe(9999)
    expect(p.upgrades.dash_fast).toBe(true)
    expect(JSON.parse(localStorage.getItem('rcgame_profiles')!)[0].version).toBe(3)
  })

  it('não reescreve o storage quando nada foi migrado', () => {
    pm.create('Hugo', 'raya')
    const before = localStorage.getItem('rcgame_profiles')
    pm.getAll()
    expect(localStorage.getItem('rcgame_profiles')).toBe(before)
  })

  it('perfil version 1 continua filtrado', () => {
    localStorage.setItem('rcgame_profiles', JSON.stringify([{ id: 'x', name: 'Antigo', levels: {}, version: 1 }]))
    expect(pm.getAll()).toHaveLength(0)
  })

  it('getTotalGoldenBones conta o 4º osso', () => {
    pm.create('Hugo', 'raya')
    pm.saveLevel('0-1', rec([true, false, false, true]))
    expect(pm.getTotalGoldenBones()).toBe(2)
  })

  it('v2 com 3 slots numa fase de 2 ossos: migração apara slots extras falsos e 100% fica alcançável', () => {
    const v2 = {
      id: 'p1', name: 'Velho', dog: 'raya', createdAt: 1, lastPlayedAt: 1,
      currentLevel: '0-2', totalScore: 100,
      levels: { '0-2': rec([false, false, false]) },
      upgrades: {}, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([v2]))
    localStorage.setItem('rcgame_active_profile', 'p1')
    expect(pm.getAll()[0].levels['0-2'].goldenBones).toEqual([false, false])
    pm.saveLevel('0-2', rec([true, true]))
    expect(pm.getActive()!.levels['0-2'].goldenBones).toEqual([true, true])
  })

  it('saveLevel apara slots extras falsos já gravados (nunca descarta true)', () => {
    pm.create('Hugo', 'raya')
    const raw = JSON.parse(localStorage.getItem('rcgame_profiles')!)
    raw[0].levels['0-2'] = rec([false, false, false])
    raw[0].levels['1-2'] = rec([false, false, true])
    localStorage.setItem('rcgame_profiles', JSON.stringify(raw))
    pm.saveLevel('0-2', rec([true, true]))
    pm.saveLevel('1-2', rec([true, true]))
    expect(pm.getActive()!.levels['0-2'].goldenBones).toEqual([true, true])
    expect(pm.getActive()!.levels['1-2'].goldenBones).toEqual([true, true, true])
  })

  it('entrada de fase inválida no save v2 não derruba getAll nem apaga o perfil', () => {
    const v2 = {
      id: 'p1', name: 'Velho', dog: 'raya', createdAt: 1, lastPlayedAt: 1,
      currentLevel: '0-1', totalScore: 100,
      levels: {
        '0-2': null,
        '1-1': 7,
        '1-2': { ...rec([]), goldenBones: 'lixo' },
        '0-1': rec([true, false, true]),
      },
      upgrades: { dash_fast: true }, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([v2]))
    localStorage.setItem('rcgame_active_profile', 'p1')
    const all = pm.getAll()
    expect(all).toHaveLength(1)
    const p = all[0]
    expect(p.version).toBe(3)
    expect(p.levels['0-1'].goldenBones).toEqual([true, false, true, false])
    expect(p.levels['0-2']).toBeNull()
    expect(p.levels['1-1']).toBe(7)
    expect(p.levels['1-2'].goldenBones).toEqual([false, false])
    expect(p.upgrades.dash_fast).toBe(true)
  })

  it('migração v2→v3 copia as conquistas legadas para o perfil migrado (uma vez)', () => {
    const legacy = JSON.stringify({ unlocked: ['first_blood'], counters: {}, flags: {} })
    localStorage.setItem('cruella-achievements', legacy)
    const v2 = {
      id: 'p1', name: 'Velho', dog: 'raya', createdAt: 1, lastPlayedAt: 1,
      currentLevel: '0-1', totalScore: 0, levels: {}, upgrades: {}, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([v2]))
    pm.getAll()
    expect(localStorage.getItem('cruella-achievements:p1')).toBe(legacy)
    expect(localStorage.getItem('cruella-achievements')).toBe(legacy)
  })

  it('migração não sobrescreve conquistas próprias já existentes do perfil', () => {
    localStorage.setItem('cruella-achievements', JSON.stringify({ unlocked: ['first_blood'] }))
    const own = JSON.stringify({ unlocked: ['true_ending'], counters: {}, flags: {} })
    localStorage.setItem('cruella-achievements:p1', own)
    const v2 = {
      id: 'p1', name: 'Velho', dog: 'raya', createdAt: 1, lastPlayedAt: 1,
      currentLevel: '0-1', totalScore: 0, levels: {}, upgrades: {}, version: 2,
    }
    localStorage.setItem('rcgame_profiles', JSON.stringify([v2]))
    pm.getAll()
    expect(localStorage.getItem('cruella-achievements:p1')).toBe(own)
  })

  it('perfil criado do zero não recebe a chave de conquistas legada', () => {
    localStorage.setItem('cruella-achievements', JSON.stringify({ unlocked: ['first_blood'] }))
    const p = pm.create('Novo', 'raya')
    pm.getAll()
    expect(localStorage.getItem(`cruella-achievements:${p.id}`)).toBeNull()
  })
})
