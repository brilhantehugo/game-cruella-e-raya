/**
 * Monta spritesheet de 17 frames (48×48 px cada) a partir dos frames east-facing
 * gerados pelo Pixel Lab MCP. Aplica transforms para animações ausentes:
 *
 *   idle(0-1)  walk(2-5)  run(6-9)  jump(10-11)  bark(12-13)  stun(14)  death(15-16)
 *
 * Transforms programáticos (sharp):
 *   jump  → idle frame 0 deslocado 10px para cima (simulação de ar)
 *   stun  → idle frame 0 rotacionado 15° (tontura)
 *   death → walk frame 1 rotacionado 90° (deitado)
 *
 * Uso: node scripts/assemble-mcp-spritesheet.mjs <character> <idleDir> <walkDir> <outFile>
 */
import sharp from 'sharp'
import { join } from 'path'

const [,, character, idleDir, walkDir, outFile] = process.argv
if (!character || !idleDir || !walkDir || !outFile) {
  console.error('Uso: node scripts/assemble-mcp-spritesheet.mjs <character> <idleDir> <walkDir> <outFile>')
  process.exit(1)
}

const TMP    = `/tmp/pixellab-${character}`
const FW     = 48
const FH     = 48
const TRANSP = { r: 0, g: 0, b: 0, alpha: 0 }

const idlePath = (n) => join(TMP, 'animations', idleDir, 'east', `frame_00${n}.png`)
const walkPath = (n) => join(TMP, 'animations', walkDir, 'east', `frame_00${n}.png`)

/** Redimensiona frame para FW×FH e retorna buffer */
async function resized(path) {
  return sharp(path)
    .resize(FW, FH, { fit: 'contain', background: TRANSP })
    .png()
    .toBuffer()
}

const idle = (n) => resized(idlePath(n))
const walk = (n) => resized(walkPath(n))

/** Desloca o conteúdo N pixels para cima (simula salto no ar) */
async function shiftUp(srcBuf, px) {
  return sharp(srcBuf)
    .extract({ left: 0, top: px, width: FW, height: FH - px })
    .extend({ bottom: px, background: TRANSP })
    .png()
    .toBuffer()
}

/** Rotaciona a imagem em graus e retorna buffer (fundo transparente) */
async function rotate(srcBuf, degrees) {
  return sharp(srcBuf)
    .rotate(degrees, { background: TRANSP })
    .resize(FW, FH, { fit: 'contain', background: TRANSP })
    .png()
    .toBuffer()
}

/** Wraps buffer for sharp composite */
const buf  = (b) => ({ input: b })

async function main() {
  console.log(`\n🎨 Montando spritesheet: ${character}`)

  // Pre-load all needed frames as resized buffers
  const [i0, i1, i4, i5, w0, w1, w2, w3] = await Promise.all([
    idle(0), idle(1), idle(4), idle(5),
    walk(0), walk(1), walk(2), walk(3),
  ])

  // Gera frames transformados
  const jump0 = await shiftUp(i0, 10)   // idle deslocado para cima → "no ar"
  const jump1 = await shiftUp(i1, 10)
  const stun0 = await rotate(i0, 15)    // tilted → tontura
  const dead0 = await rotate(w1, 90)    // deitado → morte frame 1
  const dead1 = await rotate(w2, 90)    // deitado → morte frame 2

  const SLOTS = [
    buf(i0), buf(i1),                         // 0-1  idle
    buf(w0), buf(w1), buf(w2), buf(w3),        // 2-5  walk
    buf(w0), buf(w1), buf(w2), buf(w3),        // 6-9  run (walk rápido)
    buf(jump0), buf(jump1),                    // 10-11 jump
    buf(i4), buf(i5),                          // 12-13 bark (idle — parado latindo)
    buf(stun0),                                // 14   stun
    buf(dead0), buf(dead1),                    // 15-16 death
  ]

  const composites = SLOTS.map((src, i) => ({ ...src, left: i * FW, top: 0 }))

  await sharp({
    create: { width: 17 * FW, height: FH, channels: 4, background: TRANSP }
  })
    .composite(composites)
    .png()
    .toFile(outFile)

  console.log(`✅ ${outFile} (${17 * FW}×${FH}, 17 frames)`)
  console.log('   idle(0-1) walk(2-5) run(6-9) jump↑(10-11) bark(12-13) stun⟳(14) death⤵(15-16)')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
