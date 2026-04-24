/**
 * Computes the horizontal velocity for DonoNervoso chase behaviour.
 * Returns 0 when airborne (prevents walking off platform ledges).
 */
export function donoChaseVelocity(
  dx: number,
  speed: number,
  onFloor: boolean
): number {
  if (!onFloor) return 0
  if (Math.abs(dx) <= 8) return 0
  return Math.sign(dx) * speed
}
