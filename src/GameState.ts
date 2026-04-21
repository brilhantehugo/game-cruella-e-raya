import { PHYSICS } from './constants'

export type DogType = 'raya' | 'cruella'
export type AccessoryType = 'laco' | 'coleira' | 'chapeu' | 'bandana' | null

export interface ActivePowerUp {
  type: string
  expiresAt: number
}

export class GameState {
  hearts: number = 3
  score: number = 0
  activeDog: DogType = 'raya'
  swapBlockedUntil: number = 0
  lastHitAt: number = 0
  equippedAccessory: AccessoryType = null
  activePowerUp: ActivePowerUp | null = null
  collarOfGold: boolean = false
  checkpointReached: boolean = false
  checkpointX: number = 0
  checkpointY: number = 0
  currentLevel: string = '1-1'
  goldenBones: Record<string, boolean[]> = {}
  muted: boolean = false
  abilityUsedAt: number = 0      // timestamp do último uso da habilidade especial
  abilityCooldownMs: number = 800 // duração do cooldown em ms (800 Raya, 1500 Cruella)
  sessionDeaths: number = 0
  sessionEnemiesKilled: number = 0
  sessionStartTime: number = 0
  introSeen: Set<string> = new Set()

  canSwap(now: number): boolean {
    return now >= this.swapBlockedUntil
  }

  swap(now: number): boolean {
    if (!this.canSwap(now)) return false
    this.activeDog = this.activeDog === 'raya' ? 'cruella' : 'raya'
    this.swapBlockedUntil = now + PHYSICS.SWAP_COOLDOWN
    return true
  }

  takeDamage(now: number): boolean {
    if (this.lastHitAt > 0 && now - this.lastHitAt < 1200) return false  // invincibility frames
    if (this.equippedAccessory === 'laco') {
      this.equippedAccessory = null
      this.lastHitAt = now
      this._blockSwap(now)
      return false
    }
    this.hearts--
    this.lastHitAt = now
    this._blockSwap(now)
    return true
  }

  private _blockSwap(now: number): void {
    this.swapBlockedUntil = Math.max(this.swapBlockedUntil, now + 2000)
  }

  isDead(): boolean {
    return this.hearts <= 0
  }

  addScore(points: number): void {
    this.score += points
  }

  collectGoldenBone(level: string, index: number): void {
    if (!this.goldenBones[level]) {
      this.goldenBones[level] = [false, false, false]
    }
    this.goldenBones[level][index] = true
  }

  hasPowerUp(type: string, now: number): boolean {
    if (!this.activePowerUp) return false
    if (this.activePowerUp.type !== type) return false
    if (now >= this.activePowerUp.expiresAt) {
      this.activePowerUp = null
      return false
    }
    return true
  }

  hasAnyPowerUp(now: number): boolean {
    if (!this.activePowerUp) return false
    if (now >= this.activePowerUp.expiresAt) {
      this.activePowerUp = null
      return false
    }
    return true
  }

  applyPowerUp(type: string, now: number): void {
    this.activePowerUp = { type, expiresAt: now + 10000 }
  }

  restoreHeart(): void {
    if (this.hearts < 3) this.hearts++
  }

  equipAccessory(type: AccessoryType): void {
    this.equippedAccessory = type
  }

  setCheckpoint(x: number, y: number): void {
    this.checkpointReached = true
    this.checkpointX = x
    this.checkpointY = y
  }

  reset(): void {
    this.hearts = 3
    this.score = 0
    this.activeDog = 'raya'
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    this.equippedAccessory = null
    this.activePowerUp = null
    this.collarOfGold = false
    this.checkpointReached = false
    this.checkpointX = 0
    this.checkpointY = 0
    this.abilityUsedAt = 0
    this.abilityCooldownMs = 800
    this.introSeen = new Set()
    this.sessionDeaths = 0
    this.sessionEnemiesKilled = 0
    this.sessionStartTime = 0
    // muted é uma preferência de UI — persiste intencionalmente entre partidas
  }

  resetAtCheckpoint(): void {
    this.hearts = 3
    this.equippedAccessory = null
    this.activePowerUp = null
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    // keeps: score, goldenBones, collarOfGold, checkpointReached, checkpointX/Y, currentLevel
  }

  resetLevel(): void {
    this.hearts = 3
    this.equippedAccessory = null
    this.activePowerUp = null
    this.swapBlockedUntil = 0
    this.lastHitAt = 0
    this.checkpointReached = false
    this.checkpointX = 0
    this.checkpointY = 0
    this.sessionDeaths = 0
    this.sessionEnemiesKilled = 0
    this.sessionStartTime = Date.now()
    // keeps: score, goldenBones, collarOfGold, currentLevel
  }
}

export const gameState = new GameState()
