import { BackgroundTheme } from '../levels/LevelData'

export interface AmbientConfig {
  type: 'rain' | 'dust' | 'leaves' | 'wind' | 'acvent'
  maxCount: number
  intervalMs: number
  colors: number[]
  alphaMin: number
  alphaMax: number
  speedBase: number
}

export function getAmbientConfig(theme: BackgroundTheme): AmbientConfig | null {
  switch (theme) {
    case 'rua_noite':
      return { type: 'rain',   maxCount: 35, intervalMs: 180, colors: [0xaaddff],                     alphaMin: 0.35, alphaMax: 0.55, speedBase: 200 }
    case 'apartamento':
      return { type: 'dust',   maxCount: 18, intervalMs: 350, colors: [0xfff8e7, 0xffe4c4],           alphaMin: 0.20, alphaMax: 0.35, speedBase: 20 }
    case 'apto_boss':
      return { type: 'dust',   maxCount: 14, intervalMs: 400, colors: [0xfff8e7, 0xffe4c4],           alphaMin: 0.20, alphaMax: 0.35, speedBase: 20 }
    case 'rua':
      return { type: 'leaves', maxCount: 12, intervalMs: 500, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.30, alphaMax: 0.55, speedBase: 60 }
    case 'praca':
      return { type: 'leaves', maxCount: 10, intervalMs: 600, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.30, alphaMax: 0.55, speedBase: 60 }
    case 'patio':
      return { type: 'leaves', maxCount: 8,  intervalMs: 700, colors: [0x44aa33, 0xaacc22, 0xffbb44], alphaMin: 0.25, alphaMax: 0.45, speedBase: 60 }
    case 'telhado':
      return { type: 'wind',   maxCount: 15, intervalMs: 300, colors: [0x888888, 0xaaaaaa],           alphaMin: 0.30, alphaMax: 0.50, speedBase: 140 }
    case 'exterior':
      return { type: 'wind',   maxCount: 12, intervalMs: 350, colors: [0x888888, 0xaaaaaa],           alphaMin: 0.30, alphaMax: 0.50, speedBase: 140 }
    case 'mercado':
      return { type: 'acvent', maxCount: 12, intervalMs: 400, colors: [0xcceeff],                     alphaMin: 0.20, alphaMax: 0.35, speedBase: 15 }
    case 'boss':
    default:
      return null
  }
}
