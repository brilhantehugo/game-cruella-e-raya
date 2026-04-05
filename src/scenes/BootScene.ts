import Phaser from 'phaser'
import { KEYS, TILE_SIZE } from '../constants'
import { CompiledSprite, RAYA_SPRITE, CRUELLA_SPRITE, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'

export class BootScene extends Phaser.Scene {
  constructor() { super(KEYS.BOOT) }

  preload(): void {
    // Erros de carregamento de áudio são silenciados — jogo funciona sem BGM
    this.load.on('loaderror', () => { /* arquivo ausente: continua sem BGM */ })
    this.load.audio(KEYS.BGM_MENU,    'audio/bgm_menu.mp3')
    this.load.audio(KEYS.BGM_WORLD1,  'audio/bgm_world1.mp3')
    this.load.audio(KEYS.BGM_BOSS,    'audio/bgm_boss.mp3')
    this.load.audio(KEYS.BGM_FANFARE, 'audio/bgm_fanfare.mp3')
  }

  create(): void {
    // ── Pixel sprites ──────────────────────────────────────────────────────────
    this._makePixelSprite(KEYS.RAYA,    RAYA_SPRITE)
    this._makePixelSprite(KEYS.CRUELLA, CRUELLA_SPRITE)
    this._makePixelSprite(KEYS.GATO,    GATO_SPRITE)
    this._makePixelSprite(KEYS.POMBO,   POMBO_SPRITE)
    this._makePixelSprite(KEYS.RATO,    RATO_SPRITE)
    this._makePixelSprite(KEYS.DONO,    DONO_SPRITE)
    this._makePixelSprite(KEYS.BIGODES, BIGODES_SPRITE)

    // ── Graphics textures ──────────────────────────────────────────────────────
    const g = this.make.graphics({ x: 0, y: 0 })
    const gen = (key: string, w: number, h: number) => g.generateTexture(key, w, h)
    const clr = () => g.clear()

    // ── TILES ──────────────────────────────────────────────────────────────────
    // Ground tile: asphalt + edge
    clr()
    g.fillStyle(0x8b5e3c); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.fillStyle(0x7a4e2c); g.fillRect(0, 0, TILE_SIZE, 5)
    g.fillStyle(0x9a6e4c, 0.4)
    g.fillRect(4, 10, 24, 2); g.fillRect(8, 18, 20, 2); g.fillRect(2, 26, 28, 2)
    g.lineStyle(1, 0x5a3a1a); g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE)
    gen(KEYS.TILE_GROUND, TILE_SIZE, TILE_SIZE)

    // Platform tile: grass on top, dirt underneath
    clr()
    g.fillStyle(0x6b7c3a); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE / 2)
    g.fillStyle(0x88a050); g.fillRect(0, 0, TILE_SIZE, 5)
    g.fillStyle(0xa8c068); g.fillRect(2, 1, 4, 3); g.fillRect(10, 0, 3, 3); g.fillRect(20, 1, 4, 2)
    g.lineStyle(1, 0x3a5020); g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE / 2)
    gen(KEYS.TILE_PLATFORM, TILE_SIZE, TILE_SIZE / 2)

    // ── BONE ──────────────────────────────────────────────────────────────────
    const drawBone = (key: string, col: number, dark: number, sz: number) => {
      clr()
      const k = Math.round(sz * 0.22)
      const rodY = Math.round((sz - sz * 0.33) / 2)
      const rodH = Math.round(sz * 0.33)
      g.fillStyle(dark)
      g.fillRect(k, rodY + 1, sz - k * 2, rodH)
      g.fillStyle(col)
      g.fillRect(k, rodY, sz - k * 2, rodH)
      for (const [cx, cy] of [[k, k], [sz - k, k], [k, sz - k], [sz - k, sz - k]] as [number,number][]) {
        g.fillStyle(dark); g.fillCircle(cx + 1, cy + 1, k)
        g.fillStyle(col);  g.fillCircle(cx, cy, k)
      }
      gen(key, sz, sz)
    }
    drawBone(KEYS.BONE,        0xf5f0d8, 0xc0b898, 22)
    drawBone(KEYS.GOLDEN_BONE, 0xffd700, 0xb8900a, 26)

    // ── HEARTS ────────────────────────────────────────────────────────────────
    const drawHeart = (key: string, col: number) => {
      clr()
      g.fillStyle(col)
      g.fillCircle(8, 9, 7); g.fillCircle(16, 9, 7)
      g.fillTriangle(2, 13, 22, 13, 12, 23)
      gen(key, 24, 24)
    }
    drawHeart(KEYS.HEART,       0xff3355)
    drawHeart(KEYS.HEART_EMPTY, 0x444444)

    // ── POWER-UPS ─────────────────────────────────────────────────────────────
    // PETISCO: pedaço de carne (speed)
    clr()
    g.fillStyle(0x8b1a1a); g.fillCircle(12, 11, 10)
    g.fillStyle(0xcd5c5c)
    g.fillCircle(9, 8, 5); g.fillRect(14, 6, 6, 4)
    g.fillStyle(0xff8888); g.fillCircle(8, 7, 2)
    gen(KEYS.PETISCO, 24, 22)

    // PIPOCA: popcorn in striped bucket (super jump)
    clr()
    // bucket
    g.fillStyle(0xff4444); g.fillRect(6, 16, 14, 10)
    g.fillStyle(0xffffff); g.fillRect(8, 16, 3, 10); g.fillRect(14, 16, 3, 10)
    g.lineStyle(1, 0xcc2222); g.strokeRect(6, 16, 14, 10)
    // popcorn blobs
    g.fillStyle(0xfff8dc)
    g.fillCircle(8, 14, 5); g.fillCircle(15, 13, 5); g.fillCircle(11, 10, 5)
    g.fillStyle(0xffee88)
    g.fillCircle(18, 15, 4); g.fillCircle(5, 16, 4)
    gen(KEYS.PIPOCA, 26, 26)

    // PIZZA: fatia de pizza (heal)
    clr()
    g.fillStyle(0xd4891a); g.fillTriangle(13, 0, 0, 24, 26, 24)  // crust
    g.fillStyle(0xff3300); g.fillTriangle(13, 3, 2, 23, 24, 23)  // sauce
    g.fillStyle(0xffdd44)  // cheese
    g.fillCircle(7, 18, 4); g.fillCircle(17, 17, 4); g.fillCircle(12, 11, 3)
    g.fillStyle(0xcc2200); g.fillCircle(9, 15, 2); g.fillCircle(15, 14, 2)  // pepperoni
    gen(KEYS.PIZZA, 26, 26)

    // CHURRASCO: carne na espeto (invincible)
    clr()
    g.fillStyle(0xa0522d); g.fillRect(2, 2, 3, 22)  // espeto (stick)
    g.fillStyle(0x8b0000); g.fillCircle(13, 13, 10)  // meat body
    g.fillStyle(0xcd5c5c); g.fillCircle(11, 10, 5)   // highlight
    g.fillStyle(0x3d1a00); g.fillCircle(15, 16, 3)   // grill marks
    gen(KEYS.CHURRASCO, 26, 26)

    // BOLA: tennis ball
    clr()
    g.fillStyle(0xb8f030); g.fillCircle(12, 12, 12)
    g.fillStyle(0x88c020); g.fillCircle(10, 10, 6)
    g.fillStyle(0xffffff)
    g.fillRect(5, 6, 3, 2); g.fillRect(4, 9, 2, 5); g.fillRect(5, 15, 3, 2)
    g.fillRect(15, 8, 3, 2); g.fillRect(17, 10, 2, 5); g.fillRect(15, 16, 3, 2)
    gen(KEYS.BOLA, 24, 24)

    // FRISBEE: disco voador
    clr()
    g.fillStyle(0x00bcd4); g.fillEllipse(15, 7, 30, 12)
    g.fillStyle(0x0097a7); g.fillEllipse(15, 5, 22, 7)
    g.fillStyle(0x80deea); g.fillEllipse(12, 4, 10, 4)
    g.lineStyle(1, 0x006064); g.strokeEllipse(15, 7, 30, 12)
    gen(KEYS.FRISBEE, 30, 14)

    // ── ACCESSORIES ───────────────────────────────────────────────────────────
    // LACO: laço de fita (bow)
    clr()
    g.fillStyle(0xff69b4)
    g.fillTriangle(0, 0, 10, 8, 0, 16)
    g.fillTriangle(22, 0, 12, 8, 22, 16)
    g.fillStyle(0xff1493); g.fillCircle(11, 8, 4)
    g.fillStyle(0xff8ac4); g.fillCircle(11, 8, 2)
    gen(KEYS.LACO, 22, 16)

    // COLEIRA: dog collar strip + tag
    clr()
    g.fillStyle(0xcd853f); g.fillRect(0, 3, 28, 8)
    g.fillStyle(0xa0652a); g.fillRect(0, 3, 28, 2)
    g.fillStyle(0xffd700); g.fillRect(11, 11, 6, 8)  // tag
    g.lineStyle(1, 0x8b5a1a); g.strokeRect(0, 3, 28, 8); g.strokeRect(11, 11, 6, 8)
    gen(KEYS.COLEIRA, 28, 20)

    // CHAPEU: party hat
    clr()
    g.fillStyle(0xff1493); g.fillTriangle(13, 0, 1, 22, 25, 22)
    g.fillStyle(0xffdd00); g.fillRect(1, 18, 24, 4)  // brim stripe
    g.fillStyle(0xff69b4); g.fillRect(5, 10, 4, 3); g.fillRect(12, 6, 4, 3)  // dots
    g.fillStyle(0xffffff); g.fillCircle(13, 1, 3)  // tip star/ball
    gen(KEYS.CHAPEU, 26, 24)

    // BANDANA
    clr()
    g.fillStyle(0xff4500); g.fillTriangle(0, 0, 26, 0, 13, 13)
    g.fillStyle(0xff7733)
    g.fillCircle(7, 4, 2); g.fillCircle(13, 4, 2); g.fillCircle(19, 4, 2)
    g.fillCircle(10, 8, 2); g.fillCircle(16, 8, 2)
    gen(KEYS.BANDANA, 26, 14)

    // COLLAR_GOLD: golden special collar
    clr()
    g.fillStyle(0xffd700); g.fillRect(0, 2, 28, 9)
    g.fillStyle(0xffec6e)
    g.fillRect(2, 3, 5, 7); g.fillRect(11, 3, 5, 7); g.fillRect(21, 3, 5, 7)
    g.lineStyle(2, 0xb8860b); g.strokeRect(0, 2, 28, 9)
    gen(KEYS.COLLAR_GOLD, 28, 14)

    // ── UI ────────────────────────────────────────────────────────────────────
    // HYDRANT: hidrante vermelho
    clr()
    g.fillStyle(0xff2200)
    g.fillRect(7, 5, 14, 22)   // corpo principal
    g.fillRect(4, 26, 20, 6)   // base
    g.fillRect(9, 1, 10, 6)    // topo
    g.fillStyle(0xcc1100)
    g.fillRect(2, 13, 6, 7)    // valvula esq
    g.fillRect(20, 13, 6, 7)   // valvula dir
    g.fillStyle(0xaaaaaa); g.fillCircle(14, 4, 4)  // tampao cinza
    g.lineStyle(1, 0xaa0000)
    g.strokeRect(7, 5, 14, 22); g.strokeRect(4, 26, 20, 6)
    gen(KEYS.HYDRANT, 28, 34)

    // EXIT_GATE: portao de saida
    clr()
    g.fillStyle(0x7a5c14)
    g.fillRect(0, 6, 10, 64)    // pilar esq
    g.fillRect(46, 6, 10, 64)   // pilar dir
    g.fillRect(0, 0, 56, 10)    // trave
    g.fillStyle(0xffd700)
    g.fillCircle(5, 3, 4); g.fillCircle(51, 3, 4)  // enfeites dourados
    g.fillStyle(0x1a2a4a)
    g.fillRect(10, 10, 36, 60)  // vao do portao
    g.fillStyle(0xffd700)
    g.fillCircle(28, 38, 6)     // estrela central
    g.fillCircle(20, 52, 3); g.fillCircle(36, 52, 3)
    gen(KEYS.EXIT_GATE, 56, 70)

    // SURPRISE_BLOCK: bloco surpresa
    clr()
    g.fillStyle(0xffd700); g.fillRect(0, 0, TILE_SIZE, TILE_SIZE)
    g.fillStyle(0xffee55)
    g.fillRect(2, 2, TILE_SIZE - 4, 4)
    g.fillRect(2, 2, 4, TILE_SIZE - 4)
    g.fillStyle(0xb8860b)
    g.fillRect(0, TILE_SIZE - 4, TILE_SIZE, 4)
    g.fillRect(TILE_SIZE - 4, 0, 4, TILE_SIZE)
    g.fillStyle(0xffffff)
    g.fillRect(12, 8, 8, 5); g.fillRect(14, 13, 4, 6); g.fillRect(14, 21, 4, 4)
    gen(KEYS.SURPRISE_BLOCK, TILE_SIZE, TILE_SIZE)

    // ── DECORAÇÕES ────────────────────────────────────────────────────────────
    // CASA: casa residencial
    clr()
    const cw = 64, ch = 76
    g.fillStyle(0xb03020); g.fillTriangle(0, 30, 32, 0, 64, 30)      // telhado
    g.fillStyle(0xf5deb3); g.fillRect(2, 28, cw - 4, ch - 28)         // paredes
    g.fillStyle(0xf0d090); g.fillRect(2, 28, cw - 4, 4)               // borda telhado
    g.fillStyle(0x7a4e2c); g.fillRect(25, ch - 24, 14, 24)            // porta
    g.fillStyle(0xffd700); g.fillCircle(36, ch - 13, 2)               // macaneta
    g.fillStyle(0x87ceeb)
    g.fillRect(7, 36, 16, 14); g.fillRect(41, 36, 16, 14)             // janelas
    g.fillStyle(0xffffff)
    g.lineBetween(7, 43, 23, 43); g.lineBetween(15, 36, 15, 50)       // cruz janela esq
    g.lineBetween(41, 43, 57, 43); g.lineBetween(49, 36, 49, 50)      // cruz janela dir
    g.lineStyle(1, 0x5a3a1a)
    g.strokeRect(7, 36, 16, 14); g.strokeRect(41, 36, 16, 14)
    g.lineStyle(2, 0x8a2010); g.strokeTriangle(0, 30, 32, 0, 64, 30) // borda telhado
    gen(KEYS.CASA, cw, ch)

    // ARVORE: arvore urbana
    clr()
    g.fillStyle(0x6b4226); g.fillRect(11, 52, 10, 22)                 // tronco
    g.fillStyle(0x8b5c2a); g.fillRect(11, 52, 10, 4)
    g.fillStyle(0x1e7a1e); g.fillCircle(16, 46, 18)                   // copa base
    g.fillStyle(0x26a026); g.fillCircle(16, 35, 15)                   // copa meio
    g.fillStyle(0x3cc03c); g.fillCircle(16, 26, 12)                   // copa topo
    g.fillStyle(0x55d055); g.fillCircle(12, 22, 6); g.fillCircle(20, 24, 5)  // destaques
    gen(KEYS.ARVORE, 32, 74)

    // LOJA: loja de bairro
    clr()
    const lw = 80, lh = 68
    g.fillStyle(0xdce8e8); g.fillRect(0, 18, lw, lh - 18)             // fachada
    // toldo listrado
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 === 0 ? 0xdd2222 : 0xffffff)
      g.fillRect(i * 16, 6, 16, 14)
    }
    g.fillStyle(0xbb1111); g.fillRect(0, 18, lw, 3)                    // borda toldo
    // vitrine
    g.fillStyle(0xb8e4ff); g.fillRect(8, 26, lw - 16, 22)
    g.fillStyle(0x88ccff); g.fillRect(10, 28, lw - 20, 8)             // reflexo vidro
    g.lineStyle(2, 0x4a6a7a); g.strokeRect(8, 26, lw - 16, 22)
    g.lineStyle(1, 0x4a6a7a); g.lineBetween(lw / 2, 26, lw / 2, 48)  // divisor vitrine
    // porta
    g.fillStyle(0x8b6914); g.fillRect(lw / 2 - 8, lh - 22, 16, 22)
    g.fillStyle(0xffd700); g.fillCircle(lw / 2 + 5, lh - 12, 2)      // macaneta
    g.lineStyle(1, 0x888888); g.strokeRect(0, 18, lw, lh - 18)
    gen(KEYS.LOJA, lw, lh)

    // POSTE: poste de luz
    clr()
    g.fillStyle(0x555566); g.fillRect(5, 12, 5, 62)                   // haste
    g.fillStyle(0x444455); g.fillRect(2, 70, 11, 4)                   // base
    g.fillRect(5, 12, 22, 4)                                           // braco horizontal
    g.fillStyle(0xffee88); g.fillEllipse(24, 12, 14, 8)               // lampada
    g.fillStyle(0xffffcc); g.fillEllipse(24, 11, 8, 5)                // brilho central
    g.fillStyle(0x333344); g.fillRect(20, 8, 8, 4)                    // carcaca lampada
    gen(KEYS.POSTE, 38, 74)

    // ── DECORAÇÕES — APARTAMENTO ──────────────────────────────────────────
    // CADEIRA: cadeira simples de sala
    clr()
    g.fillStyle(0x8b5c2a); g.fillRect(8, 30, 16, 28)   // assento
    g.fillStyle(0x7a4e1a); g.fillRect(8, 26, 16, 6)    // encosto
    g.fillRect(6, 18, 4, 44); g.fillRect(22, 18, 4, 44)// pernas traseiras
    g.fillRect(6, 58, 4, 16); g.fillRect(22, 58, 4, 16)// pernas dianteiras
    g.fillRect(26, 18, 4, 44);                          // segundo par
    g.fillStyle(0xd4a05a); g.fillRect(9, 27, 14, 5)    // detalhe encosto
    gen(KEYS.CADEIRA, 34, 74)

    // MESA: mesa de jantar vista de frente
    clr()
    g.fillStyle(0x7a4e1a); g.fillRect(0, 0, 80, 8)     // tampo
    g.fillStyle(0x9a6830); g.fillRect(2, 0, 76, 4)     // brilho tampo
    g.fillStyle(0x7a4e1a)
    g.fillRect(4, 8, 8, 48)                             // perna esq
    g.fillRect(68, 8, 8, 48)                            // perna dir
    g.fillStyle(0x8b5c2a); g.fillRect(4, 26, 72, 4)    // travessa
    gen(KEYS.MESA, 80, 56)

    // GRADE: grade de janela (barras verticais)
    clr()
    g.fillStyle(0x666677)
    g.fillRect(0, 0, 40, 4)                              // barra top
    g.fillRect(0, 60, 40, 4)                             // barra bot
    for (let bx = 4; bx < 38; bx += 9) {
      g.fillRect(bx, 0, 5, 64)                          // barras verticais
    }
    g.fillStyle(0x888899)
    for (let bx = 5; bx < 38; bx += 9) {
      g.fillRect(bx, 2, 2, 60)                          // brilho nas barras
    }
    gen(KEYS.GRADE, 40, 64)

    // VASO: vaso de planta
    clr()
    g.fillStyle(0xc65c28); g.fillRect(10, 30, 30, 28)  // vaso
    g.fillStyle(0xe0701a); g.fillRect(12, 32, 8, 6)    // detalhe
    g.fillStyle(0xaa4818); g.fillRect(8, 52, 34, 6)    // base
    g.fillStyle(0x3a8a2a); g.fillCircle(25, 22, 18)    // folhagem base
    g.fillStyle(0x4aaa3a); g.fillCircle(20, 12, 12); g.fillCircle(30, 15, 11)
    g.fillStyle(0x5acc4a); g.fillCircle(25, 8, 8)
    gen(KEYS.VASO, 50, 58)

    // ESTANTE: estante de livros
    clr()
    g.fillStyle(0x7a4e1a); g.fillRect(0, 0, 72, 68)    // corpo
    g.fillStyle(0x9a6830); g.fillRect(0, 0, 72, 4)     // topo
    g.fillStyle(0x5a3a0a); g.fillRect(0, 32, 72, 4)    // prateleira meio
    g.fillStyle(0x5a3a0a); g.fillRect(0, 64, 72, 4)    // base
    // Livros prateleira superior
    const bkCols1 = [0xd43030, 0x3064d4, 0x30a030, 0xd4a030, 0x8830d4, 0xd47030]
    bkCols1.forEach((c, i) => {
      g.fillStyle(c); g.fillRect(4 + i * 11, 4, 9, 28)
    })
    // Livros prateleira inferior
    const bkCols2 = [0x30d4a0, 0xd43090, 0x606060, 0xd4c030, 0x3090d4, 0xa04010]
    bkCols2.forEach((c, i) => {
      g.fillStyle(c); g.fillRect(4 + i * 11, 36, 9, 28)
    })
    gen(KEYS.ESTANTE, 72, 68)

    // ── PARALLAX BACKGROUNDS ───────────────────────────────────────────────────

    // bg_rua_1: blue sky + clouds
    clr()
    g.fillStyle(0x5b8dd9); g.fillRect(0, 0, 200, 450)
    g.fillStyle(0xffffff)
    g.fillEllipse(40, 80, 80, 30); g.fillEllipse(65, 70, 50, 20); g.fillEllipse(20, 82, 40, 18)
    g.fillEllipse(150, 50, 70, 25); g.fillEllipse(175, 42, 45, 18); g.fillEllipse(130, 55, 35, 14)
    g.fillEllipse(100, 130, 60, 22); g.fillEllipse(120, 124, 40, 16)
    gen(KEYS.BG_RUA_1, 200, 450)

    // bg_rua_2: distant gray buildings (transparent base — layers on top of sky)
    clr()
    g.fillStyle(0x8a8a9a); g.fillRect(0, 180, 50, 270)
    g.fillStyle(0x6a6a7a); g.fillRect(0, 100, 50, 80)
    g.fillStyle(0x7a7a8a); g.fillRect(55, 220, 60, 230)
    g.fillStyle(0x5a5a6a); g.fillRect(55, 130, 60, 90)
    g.fillStyle(0x9a9aaa); g.fillRect(120, 250, 45, 200)
    g.fillStyle(0x6a6a7a); g.fillRect(170, 200, 30, 250)
    g.fillStyle(0xd0d8f0)
    g.fillRect(8, 110, 8, 6);  g.fillRect(20, 110, 8, 6);  g.fillRect(32, 110, 8, 6)
    g.fillRect(8, 125, 8, 6);  g.fillRect(20, 125, 8, 6);  g.fillRect(32, 125, 8, 6)
    g.fillRect(62, 142, 10, 7); g.fillRect(76, 142, 10, 7); g.fillRect(90, 142, 10, 7)
    g.fillRect(62, 158, 10, 7); g.fillRect(76, 158, 10, 7); g.fillRect(90, 158, 10, 7)
    gen(KEYS.BG_RUA_2, 200, 450)

    // bg_rua_3: near houses + tree tops
    clr()
    g.fillStyle(0xd4a57a); g.fillRect(10, 300, 50, 150)
    g.fillStyle(0xc03030); g.fillTriangle(5, 300, 35, 268, 65, 300)
    g.fillStyle(0x87ceeb); g.fillRect(18, 315, 14, 10); g.fillRect(37, 315, 14, 10)
    g.fillStyle(0xe8c090); g.fillRect(80, 320, 60, 130)
    g.fillStyle(0x902020); g.fillTriangle(75, 320, 110, 285, 145, 320)
    g.fillStyle(0x87ceeb); g.fillRect(88, 334, 16, 12); g.fillRect(112, 334, 16, 12)
    g.fillStyle(0x5a3a1a); g.fillRect(155, 310, 8, 100)
    g.fillStyle(0x3a7a2a); g.fillCircle(159, 295, 28)
    g.fillStyle(0x4a9a3a); g.fillCircle(155, 280, 18)
    gen(KEYS.BG_RUA_3, 200, 450)

    // bg_praca_1: light blue sky + soft clouds
    clr()
    g.fillStyle(0x87ceeb); g.fillRect(0, 0, 200, 450)
    g.fillStyle(0xffffff)
    g.fillEllipse(50, 60, 90, 32); g.fillEllipse(80, 52, 55, 22); g.fillEllipse(25, 65, 45, 20)
    g.fillEllipse(160, 100, 75, 28); g.fillEllipse(185, 93, 48, 20)
    gen(KEYS.BG_PRACA_1, 200, 450)

    // bg_praca_2: green hills + tall trees
    clr()
    g.fillStyle(0x5a9a40); g.fillEllipse(60, 430, 180, 130)
    g.fillStyle(0x4a8a30); g.fillEllipse(160, 440, 160, 100)
    g.fillStyle(0x5a3a1a); g.fillRect(20, 240, 8, 120)
    g.fillStyle(0x2a6a20); g.fillCircle(24, 228, 30)
    g.fillStyle(0x3a8030); g.fillCircle(20, 212, 20)
    g.fillStyle(0x5a3a1a); g.fillRect(110, 260, 8, 100)
    g.fillStyle(0x2a6a20); g.fillCircle(114, 248, 28)
    g.fillStyle(0x3a8030); g.fillCircle(110, 234, 18)
    g.fillStyle(0x5a3a1a); g.fillRect(170, 250, 8, 110)
    g.fillStyle(0x2a6a20); g.fillCircle(174, 238, 26)
    gen(KEYS.BG_PRACA_2, 200, 450)

    // bg_praca_3: bushes + wooden fence
    clr()
    g.fillStyle(0xc8a060)
    g.fillRect(0, 350, 200, 8)
    g.fillRect(10, 338, 10, 30); g.fillRect(40, 338, 10, 30)
    g.fillRect(70, 338, 10, 30);  g.fillRect(100, 338, 10, 30)
    g.fillRect(130, 338, 10, 30); g.fillRect(160, 338, 10, 30)
    g.fillRect(190, 338, 10, 30)
    g.fillStyle(0x3a8a2a)
    g.fillEllipse(25, 360, 55, 40); g.fillEllipse(50, 355, 45, 35)
    g.fillEllipse(100, 362, 60, 38); g.fillEllipse(125, 357, 48, 33)
    g.fillEllipse(170, 360, 50, 36); g.fillEllipse(185, 356, 35, 28)
    gen(KEYS.BG_PRACA_3, 200, 450)

    // bg_mercado_1: sunset sky
    clr()
    g.fillStyle(0xff7a20); g.fillRect(0, 0, 200, 200)
    g.fillStyle(0xff9a3c); g.fillRect(0, 200, 200, 150)
    g.fillStyle(0xffd060); g.fillRect(0, 350, 200, 100)
    g.fillStyle(0xffee80); g.fillCircle(150, 200, 60)
    g.fillStyle(0xffcc40); g.fillCircle(150, 200, 40)
    gen(KEYS.BG_MERCADO_1, 200, 450)

    // bg_mercado_2: warehouses + colorful banners
    clr()
    g.fillStyle(0x6a6060); g.fillRect(0, 200, 90, 250)
    g.fillStyle(0x5a5050); g.fillRect(0, 200, 90, 8)
    g.fillStyle(0x7a7070); g.fillRect(100, 240, 100, 210)
    g.fillStyle(0x6a6060); g.fillRect(100, 240, 100, 8)
    g.fillStyle(0xff3333); g.fillRect(10, 220, 60, 12)
    g.fillStyle(0x33cc33); g.fillRect(10, 236, 60, 12)
    g.fillStyle(0x3399ff); g.fillRect(10, 252, 60, 12)
    g.fillStyle(0xffcc00); g.fillRect(110, 258, 70, 12)
    g.fillStyle(0xff6600); g.fillRect(110, 274, 70, 12)
    gen(KEYS.BG_MERCADO_2, 200, 450)

    // bg_mercado_3: market stalls + crates
    clr()
    g.fillStyle(0xff4444); g.fillRect(0, 300, 90, 20)
    g.fillStyle(0xffffff); g.fillRect(10, 300, 12, 20); g.fillRect(34, 300, 12, 20); g.fillRect(58, 300, 12, 20)
    g.fillStyle(0x8b6030); g.fillRect(0, 320, 90, 80)
    g.fillStyle(0x44aaff); g.fillRect(105, 310, 95, 20)
    g.fillStyle(0xffffff); g.fillRect(115, 310, 12, 20); g.fillRect(140, 310, 12, 20); g.fillRect(165, 310, 12, 20)
    g.fillStyle(0x8b6030); g.fillRect(105, 330, 95, 70)
    g.fillStyle(0xc8903a)
    g.fillRect(10, 370, 28, 28); g.fillRect(42, 370, 28, 28)
    g.lineStyle(1, 0x9a6020)
    g.strokeRect(10, 370, 28, 28); g.strokeRect(42, 370, 28, 28)
    g.lineBetween(24, 370, 24, 398); g.lineBetween(10, 384, 38, 384)
    g.lineBetween(56, 370, 56, 398); g.lineBetween(42, 384, 70, 384)
    gen(KEYS.BG_MERCADO_3, 200, 450)

    // bg_boss_1: dark purple sky + crescent moon + stars
    clr()
    g.fillStyle(0x1a0033); g.fillRect(0, 0, 200, 450)
    g.fillStyle(0xd4d0a0); g.fillCircle(150, 80, 30)
    g.fillStyle(0x1a0033); g.fillCircle(162, 72, 24)
    g.fillStyle(0xffffff)
    g.fillRect(20, 30, 2, 2);  g.fillRect(55, 15, 2, 2);  g.fillRect(80, 60, 2, 2)
    g.fillRect(100, 20, 2, 2); g.fillRect(30, 90, 2, 2);  g.fillRect(170, 30, 2, 2)
    g.fillRect(10, 120, 2, 2); g.fillRect(60, 110, 2, 2); g.fillRect(120, 50, 2, 2)
    g.fillRect(185, 70, 2, 2); g.fillRect(40, 140, 2, 2); g.fillRect(95, 130, 2, 2)
    gen(KEYS.BG_BOSS_1, 200, 450)

    // bg_boss_2: dark building silhouettes
    clr()
    g.fillStyle(0x1a1a2a); g.fillRect(0, 180, 45, 270)
    g.fillStyle(0x111120); g.fillRect(0, 100, 45, 80)
    g.fillRect(25, 90, 20, 90)
    g.fillStyle(0x1a1a2a); g.fillRect(50, 220, 70, 230)
    g.fillStyle(0x111120); g.fillRect(70, 150, 30, 70)
    g.fillStyle(0x1a1a2a); g.fillRect(130, 260, 40, 190)
    g.fillStyle(0x111120); g.fillRect(175, 200, 25, 250)
    g.fillStyle(0xffaa00)
    g.fillRect(10, 115, 6, 4); g.fillRect(22, 115, 6, 4)
    g.fillRect(60, 165, 8, 5); g.fillRect(75, 165, 8, 5)
    gen(KEYS.BG_BOSS_2, 200, 450)

    // ── Apartamento backgrounds ──────────────────────────────────────────────

    // bg_apto_1: parede bege com janela + céu externo
    clr()
    g.fillStyle(0xe8d8b0); g.fillRect(0, 0, 200, 450)         // parede bege
    g.fillStyle(0x87ceeb); g.fillRect(60, 40, 80, 100)        // janela — céu
    g.fillStyle(0xffffff)
    g.fillRect(90, 40, 4, 100); g.fillRect(60, 85, 80, 4)    // caixilho
    g.fillStyle(0x666677)                                       // grade
    for (let bx = 64; bx < 136; bx += 10) {
      g.fillRect(bx, 40, 4, 100)
    }
    g.fillStyle(0xd0c090); g.fillRect(55, 140, 90, 6)         // peitoril
    g.fillStyle(0xffffff); g.fillRect(0, 260, 200, 2)         // rodapé
    gen(KEYS.BG_APTO_1, 200, 450)

    // bg_apto_2: móveis ao fundo (sofá, quadro)
    clr()
    g.fillStyle(0x5566aa); g.fillRect(0, 290, 130, 80)        // sofá
    g.fillStyle(0x6677bb); g.fillRect(0, 270, 130, 25)        // encosto sofá
    g.fillStyle(0x778acc); g.fillRect(0, 268, 20, 102)        // braço esq
    g.fillStyle(0x4455aa); g.fillRect(10, 366, 100, 14)       // pés sofá
    g.fillStyle(0xc8b890)                                      // quadro na parede
    g.fillRect(145, 150, 50, 70)
    g.fillStyle(0x5588cc); g.fillRect(150, 155, 40, 60)       // imagem do quadro
    g.fillStyle(0xffe090); g.fillCircle(165, 185, 18)         // sol no quadro
    g.lineStyle(2, 0x8b5c2a); g.strokeRect(145, 150, 50, 70)
    gen(KEYS.BG_APTO_2, 200, 450)

    // bg_apto_3: chão de madeira + tapete + baseboards
    clr()
    g.fillStyle(0xd4a060)
    for (let bx = 0; bx < 200; bx += 40) {
      g.fillRect(bx, 360, 38, 90)                              // tábuas de madeira
    }
    g.fillStyle(0xc09050)
    for (let bx = 0; bx < 200; bx += 40) {
      g.fillRect(bx, 360, 38, 3)                              // separação tábuas
    }
    g.fillStyle(0x882222)                                       // tapete
    g.fillRect(20, 375, 160, 50)
    g.fillStyle(0xaa3333); g.fillRect(25, 380, 150, 40)        // padrão tapete
    g.fillStyle(0xcc5555); g.fillRect(30, 390, 50, 20); g.fillRect(120, 390, 50, 20)
    g.fillStyle(0xffd700); g.fillRect(20, 375, 160, 3)        // borda dourada
    g.fillStyle(0xffd700); g.fillRect(20, 422, 160, 3)
    gen(KEYS.BG_APTO_3, 200, 450)

    // bg_apto_boss_1: cozinha — azulejos brancos + janela
    clr()
    g.fillStyle(0xf0f0f0); g.fillRect(0, 0, 200, 450)         // parede branca
    g.fillStyle(0xe0e0e0)
    for (let ty = 0; ty < 350; ty += 20) {
      for (let tx = 0; tx < 200; tx += 20) {
        g.strokeRect(tx, ty, 20, 20)                           // azulejos
      }
    }
    g.fillStyle(0x87ceeb); g.fillRect(130, 30, 60, 80)        // janela cozinha
    g.fillStyle(0xffffff); g.fillRect(158, 30, 4, 80); g.fillRect(130, 68, 60, 4)
    g.fillStyle(0xd4d4d4); g.fillRect(125, 110, 70, 5)        // peitoril
    gen(KEYS.BG_APTO_BOSS_1, 200, 450)

    // bg_apto_boss_2: armários de cozinha + geladeira
    clr()
    g.fillStyle(0xd4c090); g.fillRect(0, 0, 200, 140)         // armário superior
    g.lineStyle(1, 0xaa8a50)
    for (let cx2 = 0; cx2 < 200; cx2 += 50) {
      g.strokeRect(cx2 + 2, 2, 46, 136)                       // portas armário
      g.fillStyle(0xffd700); g.fillCircle(cx2 + 25, 70, 4)   // puxadores
      g.fillStyle(0xd4c090)
    }
    g.fillStyle(0x888888); g.fillRect(0, 140, 200, 8)         // bancada
    g.fillStyle(0xaaaaaa); g.fillRect(0, 140, 200, 3)
    g.fillStyle(0xf0f0f0); g.fillRect(0, 280, 55, 170)        // geladeira
    g.fillStyle(0xdddddd); g.fillRect(0, 280, 55, 80)         // congelador
    g.lineStyle(1, 0xaaaaaa); g.strokeRect(0, 280, 55, 170)
    g.strokeRect(0, 280, 55, 80)
    g.fillStyle(0xaaaaaa); g.fillCircle(48, 320, 3); g.fillCircle(48, 400, 3) // puxadores
    gen(KEYS.BG_APTO_BOSS_2, 200, 450)

    // bg_apto_boss_3: chão cozinha + rodapé
    clr()
    g.fillStyle(0xe8e0c8)
    for (let ty = 350; ty < 450; ty += 25) {
      for (let tx = 0; tx < 200; tx += 25) {
        g.fillRect(tx, ty, 23, 23)
        g.fillStyle(0xd8d0b8); g.fillRect(tx, ty, 23, 3)      // brilho
        g.fillStyle(0xe8e0c8)
      }
    }
    g.fillStyle(0xc8c0a8)
    for (let tx = 0; tx < 200; tx += 25) {
      g.fillRect(tx, 350, 1, 100); g.fillRect(0, tx + 350, 200, 1)
    }
    g.fillStyle(0xb8b0a0); g.fillRect(0, 350, 200, 4)         // rodapé
    gen(KEYS.BG_APTO_BOSS_3, 200, 450)

    // bg_boss_3: metal fence + spikes
    clr()
    g.fillStyle(0x3a3a4a)
    g.fillRect(0, 330, 200, 8)
    g.fillRect(0, 355, 200, 6)
    for (let bx = 5; bx < 200; bx += 18) {
      g.fillStyle(0x3a3a4a); g.fillRect(bx, 310, 6, 80)
      g.fillStyle(0x505060); g.fillRect(bx + 1, 310, 2, 80)
    }
    g.fillStyle(0x505060)
    for (let sx = 8; sx < 200; sx += 18) {
      g.fillTriangle(sx, 310, sx + 4, 295, sx + 8, 310)
    }
    gen(KEYS.BG_BOSS_3, 200, 450)

    // ── ASPIRADOR: robô aspirador (disco branco, vista lateral) ──────────────
    // Inspirado em robô Xiaomi: corpo oval achatado, sensor LiDAR laranja,
    // câmera ciano, ventilação lateral, rodas embaixo
    clr()
    const AW = 36, AH = 20
    // Sombra suave embaixo
    g.fillStyle(0xcccccc, 0.4)
    g.fillEllipse(AW / 2 + 1, AH - 1, AW - 4, 5)
    // Corpo principal — oval branco-gelo
    g.fillStyle(0xf4f4f4)
    g.fillEllipse(AW / 2, AH / 2 - 1, AW - 2, AH - 6)
    // Faixa divisória cinza (lateral do disco — vista de lado)
    g.fillStyle(0xbbbbbb)
    g.fillRect(3, AH / 2 + 1, AW - 6, 3)
    // Sensor LiDAR (domo laranja/âmbar — posicionado no terço esquerdo do topo)
    g.fillStyle(0xee7700)
    g.fillCircle(11, 5, 5)
    g.fillStyle(0xffaa22)
    g.fillCircle(10, 4, 3)
    g.fillStyle(0xffcc66)
    g.fillCircle(9, 3, 1)       // reflexo brilhante
    // Base do sensor LiDAR
    g.fillStyle(0xdddddd)
    g.fillRect(7, 8, 8, 2)
    // Câmera/olho (círculo ciano pequeno — lado direito)
    g.fillStyle(0x00ccff)
    g.fillCircle(24, 7, 2)
    g.fillStyle(0x88eeff)
    g.fillCircle(23, 6, 1)      // reflexo
    // Botão power (retângulo arredondado — extremo direito)
    g.fillStyle(0xdddddd)
    g.fillRect(28, 7, 5, 3)
    g.lineStyle(0.5, 0xaaaaaa); g.strokeRect(28, 7, 5, 3)
    // Ventilação (listras escuras — lado esquerdo)
    g.fillStyle(0x999999)
    g.fillRect(2, 10, 4, 1)
    g.fillRect(2, 12, 4, 1)
    g.fillRect(2, 14, 4, 1)
    g.fillRect(2, 16, 3, 1)
    // Rodas (elipses escuras embaixo)
    g.fillStyle(0x444444)
    g.fillEllipse(9,       AH - 2, 8, 4)   // roda esquerda
    g.fillEllipse(AW - 9,  AH - 2, 8, 4)   // roda direita
    g.fillStyle(0x666666)
    g.fillEllipse(9,      AH - 3, 5, 2)    // brilho roda esq
    g.fillEllipse(AW - 9, AH - 3, 5, 2)    // brilho roda dir
    // Contorno suave do corpo
    g.lineStyle(1, 0xaaaaaa, 0.6)
    g.strokeEllipse(AW / 2, AH / 2 - 1, AW - 2, AH - 6)
    gen(KEYS.ASPIRADOR, AW, AH)

    // ── NPCs — HUGO (homem, camisa azul) ─────────────────────────────────────
    clr()
    // Cabelo
    g.fillStyle(0x3a2008); g.fillRect(3, 0, 12, 5)
    // Cabeça (pele)
    g.fillStyle(0xf0c090)
    g.fillRect(3, 3, 12, 11)
    // Olhos
    g.fillStyle(0x222222)
    g.fillRect(5, 7, 2, 2); g.fillRect(11, 7, 2, 2)
    // Boca
    g.fillRect(7, 12, 4, 1)
    // Pescoço
    g.fillStyle(0xf0c090); g.fillRect(6, 14, 6, 3)
    // Camisa azul (torso)
    g.fillStyle(0x3060c0); g.fillRect(2, 17, 14, 10)
    g.fillStyle(0x2050b0); g.fillRect(2, 17, 14, 3)  // ombros
    // Braços
    g.fillStyle(0x3060c0); g.fillRect(0, 17, 2, 8)
    g.fillStyle(0xf0c090); g.fillRect(0, 25, 2, 3)   // mão esq
    g.fillStyle(0x3060c0); g.fillRect(16, 17, 2, 8)
    g.fillStyle(0xf0c090); g.fillRect(16, 25, 2, 3)  // mão dir
    // Calça cinza
    g.fillStyle(0x606070); g.fillRect(2, 27, 6, 12)
    g.fillStyle(0x606070); g.fillRect(10, 27, 6, 12)
    g.fillStyle(0x707080); g.fillRect(2, 27, 6, 2)   // cinto
    // Sapatos
    g.fillStyle(0x302010); g.fillRect(1, 39, 7, 3)
    g.fillStyle(0x302010); g.fillRect(10, 39, 7, 3)
    gen(KEYS.HUGO, 18, 42)

    // ── NPCs — HANNAH (mulher, blusa vermelha) ────────────────────────────────
    clr()
    // Cabelo longo (castanho claro)
    g.fillStyle(0x8b4513)
    g.fillRect(2, 0, 12, 4)  // topo
    g.fillRect(1, 4, 3, 14)  // lateral esq
    g.fillRect(12, 4, 3, 14) // lateral dir
    // Cabeça (pele)
    g.fillStyle(0xf0c090)
    g.fillRect(3, 3, 10, 10)
    // Olhos
    g.fillStyle(0x553300)
    g.fillRect(5, 7, 2, 2); g.fillRect(9, 7, 2, 2)
    // Boca (sorriso leve)
    g.fillStyle(0xc05050); g.fillRect(6, 11, 4, 1)
    // Brinco
    g.fillStyle(0xffd700); g.fillRect(3, 10, 1, 2); g.fillRect(12, 10, 1, 2)
    // Pescoço
    g.fillStyle(0xf0c090); g.fillRect(6, 13, 4, 3)
    // Blusa vermelha (torso)
    g.fillStyle(0xcc2233); g.fillRect(2, 16, 12, 10)
    g.fillStyle(0xdd3344); g.fillRect(3, 16, 10, 3)  // gola
    // Braços
    g.fillStyle(0xf0c090); g.fillRect(0, 16, 2, 9)
    g.fillStyle(0xf0c090); g.fillRect(14, 16, 2, 9)
    // Calça escura
    g.fillStyle(0x2a2a4a); g.fillRect(2, 26, 5, 13)
    g.fillStyle(0x2a2a4a); g.fillRect(9, 26, 5, 13)
    g.fillStyle(0x3a3a5a); g.fillRect(2, 26, 12, 2)  // cinto
    // Sapatos
    g.fillStyle(0x3a1a10); g.fillRect(1, 39, 6, 3)
    g.fillStyle(0x3a1a10); g.fillRect(9, 39, 6, 3)
    gen(KEYS.HANNAH, 16, 42)

    g.destroy()
    this.scene.start(KEYS.MENU)
  }

  private _makePixelSprite(key: string, sprite: CompiledSprite): void {
    const { frameWidth, frameHeight, frames } = sprite
    const canvas = document.createElement('canvas')
    canvas.width  = frameWidth * frames.length
    canvas.height = frameHeight
    const ctx = canvas.getContext('2d')!

    frames.forEach((frame, fi) => {
      const offsetX = fi * frameWidth
      frame.forEach((rowPixels, ry) => {
        rowPixels.forEach((color, rx) => {
          if (color === null) return
          ctx.fillStyle = color
          ctx.fillRect(offsetX + rx, ry, 1, 1)
        })
      })
    })

    // Phaser aceita HTMLCanvasElement em runtime, mas os tipos declaram HTMLImageElement
    this.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth, frameHeight })
  }
}
