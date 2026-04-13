import Phaser from 'phaser'

// ── Public types ──────────────────────────────────────────────────────────────

export interface LightSource {
  x: number
  y: number
  type: 'circle' | 'cone' | 'rect'
  radius: number
  angle?: number    // degrees — cone center: 0=right, 180=left
  spread?: number   // total cone opening in degrees
  width?: number    // rect only
  height?: number   // rect only
}

// ── Pure helpers (testable without Phaser) ───────────────────────────────────

/**
 * Returns true if the enemy at (ex,ey) is within `checkRadius` of any active
 * light source (player aura or external sources).
 */
export function isNearLight(
  ex: number, ey: number,
  playerX: number, playerY: number,
  playerAuraRadius: number,
  lightSources: LightSource[],
  checkRadius: number,
): boolean {
  const dxP = ex - playerX
  const dyP = ey - playerY
  const combined = playerAuraRadius + checkRadius
  if (dxP * dxP + dyP * dyP <= combined * combined) return true

  for (const src of lightSources) {
    const dxS = ex - src.x
    const dyS = ey - src.y
    const cR = src.radius + checkRadius
    if (dxS * dxS + dyS * dyS <= cR * cR) return true
  }
  return false
}

/**
 * Builds the LightSource descriptor for a Segurança's lanterna.
 * Pure — no Phaser dependency.
 */
export function buildSegurancaLightSource(
  x: number, y: number, facingLeft: boolean,
): LightSource {
  return {
    x,
    y: y - 4,
    type: 'cone',
    radius: 200,
    angle: facingLeft ? 180 : 0,
    spread: 180,
  }
}

// ── Phaser component ─────────────────────────────────────────────────────────

export class SpotlightOverlay {
  private readonly _rt:  Phaser.GameObjects.RenderTexture
  private readonly _gfx: Phaser.GameObjects.Graphics
  private readonly _auraRadius: number

  constructor(scene: Phaser.Scene, playerAuraRadius: number) {
    this._auraRadius = playerAuraRadius ?? 130  // safe default if caller passes undefined
    // Fixed to screen (scrollFactor 0) so it stays in place as camera scrolls
    this._rt = scene.add.renderTexture(0, 0, 800, 450)
      .setOrigin(0, 0)
      .setDepth(50)
      .setScrollFactor(0)
    this._gfx = scene.make.graphics({ x: 0, y: 0 })
  }

  /**
   * Call once per frame from GameScene.update().
   * All coordinates are SCREEN-SPACE (world coords - camera.scroll).
   */
  update(playerScreenX: number, playerScreenY: number, lightSources: LightSource[]): void {
    // 1. Fill dark overlay
    this._rt.clear()
    this._gfx.clear()
    this._gfx.fillStyle(0x000000, 0.82)
    this._gfx.fillRect(0, 0, 800, 450)
    this._rt.draw(this._gfx, 0, 0)

    // 2. Erase player aura
    this._gfx.clear()
    this._gfx.fillStyle(0xffffff)
    this._gfx.fillCircle(playerScreenX, playerScreenY, this._auraRadius)
    this._rt.erase(this._gfx, 0, 0)

    // 3. Erase each external light source
    for (const src of lightSources) {
      this._gfx.clear()
      this._gfx.fillStyle(0xffffff)

      if (src.type === 'circle') {
        this._gfx.fillCircle(src.x, src.y, src.radius)

      } else if (src.type === 'cone' && src.angle !== undefined && src.spread !== undefined) {
        const halfRad   = (src.spread / 2) * (Math.PI / 180)
        const centerRad = src.angle * (Math.PI / 180)
        this._gfx.fillTriangle(
          src.x, src.y,
          src.x + Math.cos(centerRad - halfRad) * src.radius,
          src.y + Math.sin(centerRad - halfRad) * src.radius,
          src.x + Math.cos(centerRad + halfRad) * src.radius,
          src.y + Math.sin(centerRad + halfRad) * src.radius,
        )

      } else if (src.type === 'rect' && src.width !== undefined && src.height !== undefined) {
        this._gfx.fillRect(src.x - src.width / 2, src.y - src.height / 2, src.width, src.height)
      }

      this._rt.erase(this._gfx, 0, 0)
    }
  }

  destroy(): void {
    this._gfx.destroy()
    this._rt.destroy()
  }
}
