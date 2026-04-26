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

const idle = (n) => join(TMP, 'animations', idleDir, 'east', `frame_00${n}.png`)
const walk = (n) => join(TMP, 'animations', walkDir, 'east', `frame_00${n}.png`)

/** Desloca o conteúdo N pixels para cima (simula salto no ar) */
async function shiftUp(srcPath, px) {
  const buf = await sharp(srcPath)
    .extract({ left: 0, top: px, width: FW, height: FH - px })
    .extend({ bottom: px, background: TRANSP })
    .png()
    .toBuffer()
  return buf
}

/** Rotaciona a imagem em graus e retorna buffer (fundo transparente) */
async function rotate(srcPath, degrees) {
  const buf = await sharp(srcPath)
    .rotate(degrees, { background: TRANSP })
    .resize(FW, FH, { fit: 'contain', background: TRANSP })
    .png()
    .toBuffer()
  return buf
}

/** Lê arquivo e retorna buffer raw para composite */
const file = (path) => ({ input: path })
const buf  = (b)    => ({ input: b })

async function main() {
  console.log(`\n🎨 Montando spritesheet: ${character}`)

  // Gera frames transformados
  const jump0 = await shiftUp(idle(0), 10)   // idle deslocado para cima → "no ar"
  const jump1 = await shiftUp(idle(1), 10)
  const stun0 = await rotate(idle(0), 15)    // tilted → tontura
  const dead0 = await rotate(walk(1), 90)    // deitado → morte frame 1
  const dead1 = await rotate(walk(2), 90)    // deitado → morte frame 2

  const SLOTS = [
    file(idle(0)), file(idle(1)),                         // 0-1  idle
    file(walk(0)), file(walk(1)), file(walk(2)), file(walk(3)), // 2-5 walk
    file(walk(0)), file(walk(1)), file(walk(2)), file(walk(3)), // 6-9 run (walk rápido)
    buf(jump0),  buf(jump1),                              // 10-11 jump
    file(idle(4)), file(idle(5)),                         // 12-13 bark (idle — parado latindo)
    buf(stun0),                                           // 14   stun
    buf(dead0),  buf(dead1),                              // 15-16 death
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
