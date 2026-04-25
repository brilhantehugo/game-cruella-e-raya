import Phaser from 'phaser'
import { KEYS, TILE_SIZE } from '../constants'
import { CompiledSprite, GATO_SPRITE, POMBO_SPRITE, RATO_SPRITE, DONO_SPRITE, BIGODES_SPRITE } from '../sprites/SpriteData'
import { profileManager } from '../storage/ProfileManager'

export class BootScene extends Phaser.Scene {
  constructor() { super(KEYS.BOOT) }

  preload(): void {
    // Erros de carregamento de áudio são silenciados — jogo funciona sem BGM
    this.load.on('loaderror', () => { /* arquivo ausente: continua sem BGM */ })
    this.load.audio(KEYS.BGM_MENU,    'audio/bgm_menu.mp3')
    this.load.audio(KEYS.BGM_WORLD1,  'audio/bgm_world1.mp3')
    this.load.audio(KEYS.BGM_BOSS,    'audio/bgm_boss.mp3')
    this.load.audio(KEYS.BGM_FANFARE, 'audio/bgm_fanfare.mp3')

    // Spritesheets PNG gerados pelo Pixel Lab (substituem _makePixelSprite)
    this.load.spritesheet(KEYS.RAYA,    'sprites/raya.png',    { frameWidth: 32, frameHeight: 32 })
    this.load.spritesheet(KEYS.CRUELLA, 'sprites/cruella.png', { frameWidth: 32, frameHeight: 32 })
  }

  create(): void {
    // ── Pixel sprites ──────────────────────────────────────────────────────────
    // KEYS.RAYA e KEYS.CRUELLA → carregados via preload() como spritesheets PNG
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
    g.fillStyle(0xcc2200); g.fillTriangle(0, 30, 32, 0, 64, 30)      // telhado (brick red)
    g.fillStyle(0xf5deb3); g.fillRect(2, 28, cw - 4, ch - 28)         // paredes
    g.fillStyle(0xf0d090); g.fillRect(2, 28, cw - 4, 4)               // borda telhado
    // chaminé no topo-direito do telhado
    g.fillStyle(0x7a3a1a); g.fillRect(44, 12, 8, 18)                  // chaminé
    g.fillStyle(0x5a2a0a); g.fillRect(42, 10, 12, 4)                  // topo chaminé
    // calçada na base
    g.fillStyle(0xccbbaa); g.fillRect(20, ch - 4, 24, 4)              // caminho/calçada
    g.fillStyle(0x7a4e2c); g.fillRect(25, ch - 24, 14, 24)            // porta
    g.fillStyle(0xddaa22); g.fillCircle(36, ch - 13, 2)               // macaneta dourada
    g.fillStyle(0x87ceeb)
    g.fillRect(7, 36, 16, 14); g.fillRect(41, 36, 16, 14)             // janelas
    // cortinas nas janelas
    g.fillStyle(0xffffcc)
    g.fillRect(7, 36, 4, 14); g.fillRect(19, 36, 4, 14)               // cortinas janela esq
    g.fillRect(41, 36, 4, 14); g.fillRect(53, 36, 4, 14)              // cortinas janela dir
    g.fillStyle(0xffffff)
    g.lineBetween(7, 43, 23, 43); g.lineBetween(15, 36, 15, 50)       // cruz janela esq
    g.lineBetween(41, 43, 57, 43); g.lineBetween(49, 36, 49, 50)      // cruz janela dir
    g.lineStyle(1, 0x5a3a1a)
    g.strokeRect(7, 36, 16, 14); g.strokeRect(41, 36, 16, 14)
    g.lineStyle(2, 0x8a2010); g.strokeTriangle(0, 30, 32, 0, 64, 30) // borda telhado
    gen(KEYS.CASA, cw, ch)

    // ARVORE: arvore urbana
    clr()
    // tronco mais largo na base (efeito triangular)
    g.fillStyle(0x6b4226); g.fillRect(10, 56, 12, 18)                 // tronco base (mais largo)
    g.fillStyle(0x6b4226); g.fillRect(11, 52, 10, 6)                  // tronco superior
    g.fillStyle(0x8b5c2a); g.fillRect(10, 56, 12, 4)                  // brilho tronco
    g.fillStyle(0x1e7a1e); g.fillCircle(16, 46, 18)                   // copa base
    g.fillStyle(0x26a026); g.fillCircle(16, 35, 15)                   // copa meio
    g.fillStyle(0x3cc03c); g.fillCircle(16, 26, 12)                   // copa topo
    g.fillStyle(0x55d055); g.fillCircle(12, 22, 6); g.fillCircle(20, 24, 5)  // destaques
    g.fillStyle(0x6aaa3a); g.fillCircle(10, 38, 5); g.fillCircle(22, 32, 4); g.fillCircle(16, 20, 4)  // highlights camada extra
    gen(KEYS.ARVORE, 32, 74)

    // LOJA: loja de bairro
    clr()
    const lw = 80, lh = 68
    g.fillStyle(0xdce8e8); g.fillRect(0, 18, lw, lh - 18)             // fachada
    // placa acima do toldo
    g.fillStyle(0xffffff); g.fillRect(10, 0, 60, 7)                   // placa fundo branco
    g.lineStyle(2, 0x222222); g.strokeRect(10, 0, 60, 7)              // borda escura placa
    // toldo listrado (mais vívido)
    for (let i = 0; i < 5; i++) {
      g.fillStyle(i % 2 === 0 ? 0xff2200 : 0xffffff)
      g.fillRect(i * 16, 6, 16, 14)
    }
    g.fillStyle(0xcc0000); g.fillRect(0, 18, lw, 3)                    // borda toldo mais escura
    // vitrine
    g.fillStyle(0xb8e4ff); g.fillRect(8, 26, lw - 16, 22)
    g.fillStyle(0x88ccff); g.fillRect(10, 28, lw - 20, 8)             // reflexo vidro
    // produtos na vitrine (3 itens coloridos)
    g.fillStyle(0xff4444); g.fillRect(14, 32, 10, 12)                 // produto 1 (vermelho)
    g.fillStyle(0x44cc44); g.fillRect(34, 34, 8, 10)                  // produto 2 (verde)
    g.fillStyle(0x4488ff); g.fillRect(52, 31, 10, 13)                 // produto 3 (azul)
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

    // ── DECORAÇÕES — APARTAMENTO (COZINHA) ────────────────────────────────────
    // FOGÃO: fogão de 4 bocas visto de frente
    clr()
    g.fillStyle(0x555566); g.fillRect(0, 0, 48, 60)        // corpo cinza
    g.fillStyle(0x444455); g.fillRect(0, 0, 48, 12)        // painel superior
    g.fillStyle(0x777788); g.fillRect(2, 2, 44, 8)         // frente painel
    // 4 bocas do fogão
    ;[[10,6],[30,6],[10,20],[30,20]].forEach(([bx,by]) => {
      g.fillStyle(0x222233); g.fillCircle(bx, by, 5)
      g.fillStyle(0x888899); g.fillCircle(bx, by, 3)
      g.fillStyle(0x444455); g.fillCircle(bx, by, 1)
    })
    // porta do forno
    g.fillStyle(0x333344); g.fillRect(4, 28, 40, 26)
    g.fillStyle(0x555566); g.fillRect(6, 30, 36, 22)
    g.fillStyle(0x222233); g.fillRect(10, 34, 28, 14)      // vidro forno
    g.fillStyle(0x778899); g.fillRect(12, 36, 24, 10)      // reflexo vidro
    g.fillStyle(0x888899); g.fillRect(14, 56, 20, 4)       // pé
    gen(KEYS.FOGAO, 48, 60)

    // GELADEIRA: geladeira vertical com freezer no topo
    clr()
    g.fillStyle(0xdde8ee); g.fillRect(0, 0, 38, 80)        // corpo branco-azulado
    g.fillStyle(0xc8d8e4); g.fillRect(2, 2, 34, 76)        // face frontal
    // separação freezer / geladeira
    g.fillStyle(0x8899aa); g.fillRect(0, 22, 38, 3)
    // alça freezer
    g.fillStyle(0x667788); g.fillRect(28, 8, 4, 10)
    g.fillStyle(0x778899); g.fillRect(29, 9, 2, 8)
    // alça geladeira
    g.fillStyle(0x667788); g.fillRect(28, 32, 4, 18)
    g.fillStyle(0x778899); g.fillRect(29, 33, 2, 16)
    // detalhe logo
    g.fillStyle(0xaabbcc); g.fillRect(6, 50, 16, 6)
    g.fillStyle(0x8899aa); g.fillRect(7, 51, 12, 4)
    // pezinhos
    g.fillStyle(0x778899); g.fillRect(4, 76, 8, 4); g.fillRect(26, 76, 8, 4)
    gen(KEYS.GELADEIRA, 38, 80)

    // BALCÃO: bancada de cozinha com armário abaixo
    clr()
    g.fillStyle(0xf0ede0); g.fillRect(0, 0, 80, 10)        // tampo mármore claro
    g.fillStyle(0xe8e5d0); g.fillRect(0, 2, 78, 4)         // reflexo tampo
    g.fillStyle(0xddcaaa); g.fillRect(0, 0, 80, 2)         // borda frontal tampo
    // armário abaixo do balcão
    g.fillStyle(0xc8a878); g.fillRect(0, 10, 80, 46)       // corpo armário
    g.fillStyle(0xb89868); g.fillRect(2, 12, 76, 42)       // face
    // duas portas
    g.fillStyle(0xa88858); g.fillRect(2, 12, 36, 42)       // porta esq
    g.fillStyle(0xa88858); g.fillRect(42, 12, 36, 42)      // porta dir
    g.fillStyle(0xddbb88); g.fillRect(4, 14, 32, 38); g.fillRect(44, 14, 32, 38)
    // puxadores
    g.fillStyle(0x888877); g.fillRect(28, 30, 8, 4); g.fillRect(44, 30, 8, 4)
    // base/pé
    g.fillStyle(0x998855); g.fillRect(0, 52, 80, 4)
    gen(KEYS.BALCAO, 80, 56)

    // ── DECORAÇÕES — RUA (novos props temáticos) ──────────────────────────────

    // LIXEIRA: lixeira cilíndrica verde-escuro — 28×44
    clr()
    g.fillStyle(0x2d5a1b); g.fillRect(4, 8, 20, 28)           // corpo
    g.fillStyle(0x3d7a2a); g.fillEllipse(14, 8, 28, 12)       // tampa
    g.fillStyle(0x1d4a0b); g.fillRect(2, 34, 24, 4)           // anel base
    g.fillStyle(0xffffff, 0.12)                                // listras
    g.fillRect(4, 14, 20, 2); g.fillRect(4, 20, 20, 2); g.fillRect(4, 26, 20, 2)
    g.fillStyle(0x888888); g.fillRect(2, 11, 3, 4); g.fillRect(23, 11, 3, 4) // alças
    gen(KEYS.LIXEIRA, 28, 44)

    // BANCO: banco de praça de madeira — 52×36
    clr()
    g.fillStyle(0xc8a060); g.fillRect(0, 10, 52, 8)           // assento
    g.fillStyle(0xd4b070); g.fillRect(2, 10, 48, 3)           // brilho assento
    g.fillStyle(0xb89050); g.fillRect(4, 0, 44, 6)            // encosto
    g.fillStyle(0xa07840); g.fillRect(8, 0, 4, 18); g.fillRect(40, 0, 4, 18)  // suportes encosto
    g.fillStyle(0x8a6428)                                      // pernas
    g.fillRect(6, 18, 5, 18); g.fillRect(20, 18, 5, 18)
    g.fillRect(27, 18, 5, 18); g.fillRect(41, 18, 5, 18)
    g.fillStyle(0xa07840); g.fillRect(6, 28, 40, 3)           // travessa
    gen(KEYS.BANCO, 52, 36)

    // CANTEIRO: canteiro de flores — 64×30
    clr()
    g.fillStyle(0x6b4226); g.fillRect(0, 10, 64, 20)          // moldura solo
    g.fillStyle(0x8b5a30); g.fillRect(2, 12, 60, 16)          // terra
    g.fillStyle(0x9b7a4a); g.fillRect(0, 10, 64, 3)           // borda topo
    ;[[8, 0xdd2222, 0xff6600], [20, 0xffdd00, 0xff6600],
      [36, 0xdd2222, 0xffff00], [50, 0xffdd00, 0xff6600]].forEach(([fx, pc, cc]) => {
      g.fillStyle(0x3a7a20); g.fillRect(fx + 2, 8, 2, 8)     // caule
      g.fillStyle(pc);       g.fillCircle(fx + 3, 8, 4)       // pétalas
      g.fillStyle(cc);       g.fillCircle(fx + 3, 8, 2)       // centro
    })
    gen(KEYS.CANTEIRO, 64, 30)

    // BARRACA: barraca de feira com toldo listrado — 80×56
    clr()
    g.fillStyle(0xffffff); g.fillRect(0, 0, 80, 14)           // toldo base branco
    // listras vermelhas a cada 20px
    ;[0, 20, 40, 60].forEach(sx => {
      g.fillStyle(0xdd2222); g.fillRect(sx, 0, 10, 14)
    })
    g.fillStyle(0xbb1111); g.fillRect(0, 12, 80, 4)           // borda inferior toldo
    g.fillStyle(0xc8903a); g.fillRect(0, 14, 80, 10)          // balcão madeira
    g.fillStyle(0xa07020); g.fillRect(0, 22, 80, 4)           // frente balcão
    g.fillStyle(0x8a6020)                                      // pernas
    g.fillRect(4, 26, 8, 30); g.fillRect(36, 26, 8, 30); g.fillRect(68, 26, 8, 30)
    // "mercadorias" no balcão
    const goodColors = [0xff8c00, 0x228b22, 0xcc2200, 0xffd700]
    goodColors.forEach((gc, i) => {
      g.fillStyle(gc); g.fillRect(6 + i * 12, 16, 6, 6)
    })
    gen(KEYS.BARRACA, 80, 56)

    // SACO_LIXO: saco de lixo preto — 32×38
    clr()
    g.fillStyle(0x1a1a1a); g.fillRoundedRect(2, 6, 28, 30, 6) // corpo saco
    g.fillStyle(0x333333); g.fillEllipse(16, 8, 18, 8)        // amarração topo
    g.fillStyle(0x252525)                                       // volumes
    g.fillCircle(10, 20, 8); g.fillCircle(22, 22, 7)
    g.fillStyle(0x3a3a3a); g.fillRect(5, 10, 6, 4)            // brilho
    gen(KEYS.SACO_LIXO, 32, 38)

    // CARRO: carro estacionado, vista lateral — 80×44
    clr()
    // Cabine / teto
    g.fillStyle(0x3355aa); g.fillRect(16, 2, 48, 14)              // teto cabine
    g.fillStyle(0x4466cc); g.fillRect(18, 4, 44, 8)               // brilho teto
    // Janelas
    g.fillStyle(0x99ccff, 0.55)
    g.fillRect(20, 5, 18, 9)    // janela esq
    g.fillRect(42, 5, 18, 9)    // janela dir
    // Carroceria (corpo)
    g.fillStyle(0x2244aa); g.fillRect(6, 14, 68, 18)              // corpo
    g.fillStyle(0x3355bb); g.fillRect(6, 14, 68, 4)               // reflexo lateral
    // Detalhes carroceria
    g.fillStyle(0x7788aa); g.fillRect(6, 28, 68, 4)               // friso inferior
    // Faróis / lanternas
    g.fillStyle(0xffffcc); g.fillRect(4, 17, 6, 7)                // farol frente
    g.fillStyle(0xff3333); g.fillRect(70, 17, 6, 7)               // lanterna traseira
    // Para-choques
    g.fillStyle(0x888899); g.fillRect(4, 24, 4, 8); g.fillRect(72, 24, 4, 8)
    // Rodas (pneu + aro + cubo)
    g.fillStyle(0x1a1a1a); g.fillCircle(20, 37, 9); g.fillCircle(60, 37, 9)  // pneu
    g.fillStyle(0x555566); g.fillCircle(20, 37, 6); g.fillCircle(60, 37, 6)  // aro
    g.fillStyle(0x9999aa); g.fillCircle(20, 37, 2); g.fillCircle(60, 37, 2)  // cubo
    gen(KEYS.CARRO, 80, 46)

    // DIRT_BALL: projétil do Aspirador — torrão de terra 12×12
    clr()
    g.fillStyle(0x5a3a1a); g.fillCircle(6, 6, 6)
    g.fillStyle(0x7a5a2a); g.fillCircle(4, 4, 3)
    g.fillStyle(0x3a2010); g.fillCircle(8, 8, 2)
    gen(KEYS.DIRT_BALL, 12, 12)

    // BLADE: pá giratória do Wall-E — cruz ciana 12×12
    clr()
    g.lineStyle(2.5, 0x22ccff, 1)
    g.beginPath(); g.moveTo(2, 6); g.lineTo(10, 6); g.strokePath()   // linha horizontal
    g.beginPath(); g.moveTo(6, 2); g.lineTo(6, 10);  g.strokePath()  // linha vertical
    g.lineStyle(1, 0x88eeff, 0.7)
    g.beginPath(); g.moveTo(3, 3); g.lineTo(9, 9);   g.strokePath()  // diagonal
    g.beginPath(); g.moveTo(9, 3); g.lineTo(3, 9);   g.strokePath()  // diagonal
    gen(KEYS.BLADE, 12, 12)

    // BOMB: projétil do Drone — círculo preto com faísca laranja 10×10
    clr()
    g.fillStyle(0x111111); g.fillCircle(5, 5, 5)
    g.lineStyle(1, 0x333333); g.strokeCircle(5, 5, 5)
    g.fillStyle(0xff8800); g.fillTriangle(7, 0, 10, 4, 5, 2)
    g.fillStyle(0xffcc00); g.fillTriangle(8, 1, 10, 3, 7, 1)
    gen(KEYS.BOMB, 10, 10)

    // LASER: projétil do Drone — linha vermelha fina 16×4
    clr()
    g.fillStyle(0xff0000); g.fillRect(0, 1, 16, 2)
    g.fillStyle(0xff6666); g.fillRect(0, 1, 4, 2)
    g.fillStyle(0xffaaaa); g.fillRect(0, 1, 2, 2)
    gen(KEYS.LASER, 16, 4)

    // ── PARALLAX BACKGROUNDS ───────────────────────────────────────────────────

    // bg_rua_1: céu azul — gradiente 2 stops + 1 nuvem
    clr()
    g.fillStyle(0x87ceeb); g.fillRect(0, 0, 200, 320)
    g.fillStyle(0xd4eeff); g.fillRect(0, 320, 200, 130)
    g.fillStyle(0xffffff, 0.7); g.fillEllipse(90, 90, 120, 36)
    gen(KEYS.BG_RUA_1, 200, 450)

    // bg_rua_2: 3 prédios em silhueta — cinza-azulado
    clr()
    g.fillStyle(0x7a8a99); g.fillRect(0, 150, 60, 300)
    g.fillStyle(0x6a7a88); g.fillRect(70, 200, 70, 250)
    g.fillStyle(0x7a8a99); g.fillRect(150, 240, 50, 210)
    gen(KEYS.BG_RUA_2, 200, 450)

    // bg_rua_3: calçada + poste + janela com grade
    clr()
    g.fillStyle(0xaaaaaa); g.fillRect(0, 400, 200, 50)
    g.fillStyle(0x888888); g.fillRect(0, 398, 200, 4)
    g.fillStyle(0x555555); g.fillRect(60, 300, 6, 100)
    g.fillStyle(0x555555); g.fillRect(44, 300, 22, 5)
    g.fillStyle(0x7a8888); g.fillRect(100, 320, 40, 55)
    g.fillStyle(0x555566, 0.5); g.fillRect(104, 324, 32, 47)
    gen(KEYS.BG_RUA_3, 200, 450)

    // bg_praca_1: céu azul claro — gradiente 2 stops + 1 nuvem
    clr()
    g.fillStyle(0xa8d8ea); g.fillRect(0, 0, 200, 300)
    g.fillStyle(0xd9eeff); g.fillRect(0, 300, 200, 150)
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(80, 70, 100, 30)
    gen(KEYS.BG_PRACA_1, 200, 450)

    // bg_praca_2: colinas + 2 árvores triangulares
    clr()
    g.fillStyle(0x7a9a6a); g.fillEllipse(100, 450, 260, 120)
    g.fillStyle(0x5a3a1a); g.fillRect(38, 280, 6, 100)
    g.fillStyle(0x4a6a3a); g.fillTriangle(20, 282, 41, 220, 62, 282)
    g.fillStyle(0x5a3a1a); g.fillRect(148, 290, 6, 90)
    g.fillStyle(0x4a6a3a); g.fillTriangle(130, 292, 151, 230, 172, 292)
    gen(KEYS.BG_PRACA_2, 200, 450)

    // bg_praca_3: gramado + cerca de madeira
    clr()
    g.fillStyle(0x5a8a4a); g.fillRect(0, 390, 200, 60)
    g.fillStyle(0x8B6914); g.fillRect(0, 370, 200, 8)
    g.fillStyle(0x8B6914); g.fillRect(0, 384, 200, 8)
    ;[8, 38, 68, 98, 128, 158, 188].forEach((px: number) => {
      g.fillStyle(0x7a5a10); g.fillRect(px, 360, 10, 40)
    })
    gen(KEYS.BG_PRACA_3, 200, 450)

    // bg_mercado_1: pôr do sol — 2 stops dessaturados
    clr()
    g.fillStyle(0xd08840); g.fillRect(0, 0, 200, 200)
    g.fillStyle(0xc8a040); g.fillRect(0, 200, 200, 250)
    gen(KEYS.BG_MERCADO_1, 200, 450)

    // bg_mercado_2: 2 galpões em silhueta
    clr()
    g.fillStyle(0x5a4a3a); g.fillRect(0, 220, 95, 230)
    g.fillStyle(0x4a3a2a); g.fillRect(0, 190, 95, 32)
    g.fillStyle(0x5a4a3a); g.fillRect(105, 260, 95, 190)
    g.fillStyle(0x4a3a2a); g.fillRect(105, 235, 95, 28)
    gen(KEYS.BG_MERCADO_2, 200, 450)

    // bg_mercado_3: chão + caixa de madeira + toldo
    clr()
    g.fillStyle(0x888888); g.fillRect(0, 400, 200, 50)
    g.fillStyle(0x8B6030); g.fillRect(10, 340, 50, 60)
    g.fillStyle(0x7a5020); g.fillRect(10, 340, 50, 6)
    g.fillStyle(0x7a5020); g.fillRect(10, 360, 50, 4)
    g.fillStyle(0x7a5020); g.fillRect(28, 340, 4, 60)
    g.fillStyle(0xc84b32); g.fillRect(100, 300, 90, 22)
    g.fillStyle(0xaa3a24); g.fillRect(100, 300, 90, 4)
    gen(KEYS.BG_MERCADO_3, 200, 450)

    // bg_boss_1: céu roxo-escuro + lua crescente + 3 estrelas
    clr()
    g.fillStyle(0x1a0a2e); g.fillRect(0, 0, 200, 280)
    g.fillStyle(0x2d1b4e); g.fillRect(0, 280, 200, 170)
    g.fillStyle(0xf0f0e0, 0.9); g.fillCircle(160, 60, 20)
    g.fillStyle(0x1a0a2e); g.fillCircle(152, 56, 16)
    g.fillStyle(0xffffff, 0.8)
    g.fillRect(30, 40, 2, 2); g.fillRect(80, 25, 2, 2); g.fillRect(50, 90, 2, 2)
    gen(KEYS.BG_BOSS_1, 200, 450)

    // bg_boss_2: 2 prédios quase-pretos com borda topo
    clr()
    g.fillStyle(0x1a1a2a); g.fillRect(0, 180, 80, 270)
    g.fillStyle(0x2a2a3a); g.fillRect(0, 178, 80, 4)
    g.fillStyle(0x1a1a2a); g.fillRect(100, 230, 100, 220)
    g.fillStyle(0x2a2a3a); g.fillRect(100, 228, 100, 4)
    gen(KEYS.BG_BOSS_2, 200, 450)

    // ── Apartamento backgrounds ──────────────────────────────────────────────

    // bg_apto_1: parede bege — gradiente 2 stops
    clr()
    g.fillStyle(0xf5e6c8); g.fillRect(0, 0, 200, 280)
    g.fillStyle(0xe8d4aa); g.fillRect(0, 280, 200, 170)
    gen(KEYS.BG_APTO_1, 200, 450)

    // bg_apto_2: quadro na parede + sofá
    clr()
    g.fillStyle(0x909080); g.fillRect(48, 190, 44, 56)
    g.fillStyle(0xa8b898); g.fillRect(52, 194, 36, 48)
    g.fillStyle(0xb8a888); g.fillRect(8, 328, 148, 68)
    g.fillStyle(0xa09870); g.fillRect(8, 316, 148, 16)
    g.fillStyle(0xa09870); g.fillRect(150, 316, 14, 84)
    g.fillStyle(0xa09870); g.fillRect(4, 316, 14, 84)
    gen(KEYS.BG_APTO_2, 200, 450)

    // bg_apto_3: rodapé + piso de madeira
    clr()
    g.fillStyle(0xe8dcc0); g.fillRect(0, 388, 200, 10)
    g.fillStyle(0x8B6914); g.fillRect(0, 398, 200, 16)
    g.fillStyle(0x7a5c10); g.fillRect(0, 414, 200, 14)
    g.fillStyle(0x8B6914); g.fillRect(0, 428, 200, 12)
    g.fillStyle(0x7a5c10); g.fillRect(0, 440, 200, 10)
    gen(KEYS.BG_APTO_3, 200, 450)

    // bg_apto_boss_1: azulejos brancos + luz de janela
    clr()
    g.fillStyle(0xf0f0f0); g.fillRect(0, 0, 200, 450)
    ;[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420].forEach((y: number) => {
      g.fillStyle(0xdddddd); g.fillRect(0, y, 200, 1)
    })
    ;[30, 60, 90, 120, 150, 180].forEach((x: number) => {
      g.fillStyle(0xdddddd); g.fillRect(x, 0, 1, 450)
    })
    g.fillStyle(0xfffff8, 0.3); g.fillRect(140, 0, 60, 200)
    gen(KEYS.BG_APTO_BOSS_1, 200, 450)

    // bg_apto_boss_2: armários suspensos — cinza frio
    clr()
    g.fillStyle(0x888a8c); g.fillRect(0, 180, 200, 110)
    g.fillStyle(0x777a7c); g.fillRect(0, 180, 200, 4)
    g.fillStyle(0x777a7c); g.fillRect(66, 184, 2, 106)
    g.fillStyle(0x777a7c); g.fillRect(132, 184, 2, 106)
    gen(KEYS.BG_APTO_BOSS_2, 200, 450)

    // bg_apto_boss_3: balcão + pia + torneira
    clr()
    g.fillStyle(0xe8e8e8); g.fillRect(0, 350, 200, 20)
    g.fillStyle(0xd0d0d0); g.fillRect(0, 348, 200, 4)
    g.fillStyle(0xcccccc); g.fillRect(70, 310, 50, 42)
    g.fillStyle(0xaaaaaa); g.fillRect(74, 314, 42, 34)
    g.fillStyle(0x999999); g.fillRect(92, 300, 6, 16)
    g.fillStyle(0x999999); g.fillRect(88, 300, 14, 5)
    gen(KEYS.BG_APTO_BOSS_3, 200, 450)

    // ── BACKGROUNDS — EXTERIOR DO PRÉDIO ──────────────────────────────────────
    // BG_EXT_1: céu noturno azul-escuro + lua cheia
    clr()
    g.fillStyle(0x0a1628); g.fillRect(0, 0, 480, 280)
    g.fillStyle(0x1a2a44); g.fillRect(0, 280, 480, 170)
    g.fillStyle(0xfffff0, 0.9); g.fillCircle(380, 70, 28)
    gen(KEYS.BG_EXT_1, 480, 450)

    // BG_EXT_2: fachada de prédio + 6 janelas iluminadas
    clr()
    g.fillStyle(0x404850); g.fillRect(100, 100, 280, 350)
    ;[
      [130, 140], [220, 140], [310, 140],
      [130, 230], [220, 230], [310, 230],
    ].forEach(([wx, wy]: number[]) => {
      g.fillStyle(0xffe8a0, 0.8); g.fillRect(wx, wy, 50, 70)
    })
    gen(KEYS.BG_EXT_2, 480, 450)

    // BG_EXT_3: grades + arbustos + calçada
    clr()
    g.fillStyle(0x606060); g.fillRect(0, 400, 480, 50)
    g.fillStyle(0x505050); g.fillRect(0, 398, 480, 4)
    ;[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].forEach((px: number) => {
      g.fillStyle(0x333333); g.fillRect(px, 300, 6, 102)
    })
    g.fillStyle(0x333333); g.fillRect(0, 300, 480, 6)
    g.fillStyle(0x2a3a1a); g.fillEllipse(80, 395, 80, 40)
    g.fillStyle(0x2a3a1a); g.fillEllipse(380, 395, 90, 42)
    gen(KEYS.BG_EXT_3, 480, 450)

    // ── BACKGROUNDS — PÁTIO INTERIOR ─────────────────────────────────────────
    // BG_PATIO_1: céu cinza-azul + 1 nuvem
    clr()
    g.fillStyle(0x5a6a7a); g.fillRect(0, 0, 480, 280)
    g.fillStyle(0x8a9aaa); g.fillRect(0, 280, 480, 170)
    g.fillStyle(0xcccccc, 0.5); g.fillEllipse(200, 80, 120, 32)
    gen(KEYS.BG_PATIO_1, 480, 450)

    // BG_PATIO_2: muro de tijolo — fiadas alternadas
    clr()
    const bH = 18, bW = 60, mortH = 3, mortW = 3
    let row = 0
    for (let y = 200; y < 450; y += bH + mortH) {
      const offset = (row % 2 === 0) ? 0 : bW / 2
      for (let x = -offset; x < 480; x += bW + mortW) {
        g.fillStyle(row % 2 === 0 ? 0x7a5a4a : 0x6a4a3a)
        g.fillRect(x, y, bW, bH)
      }
      row++
    }
    gen(KEYS.BG_PATIO_2, 480, 450)

    // BG_PATIO_3: paralelepípedo + varal com 2 peças de roupa
    clr()
    g.fillStyle(0x888888); g.fillRect(0, 400, 480, 50)
    ;[0, 48, 92, 140, 192, 240, 290, 340, 388, 438].forEach((px: number) => {
      g.fillStyle(0x666666); g.fillRect(px, 400, 2, 50)
    })
    ;[412, 430].forEach((py: number) => {
      g.fillStyle(0x666666); g.fillRect(0, py, 480, 2)
    })
    g.fillStyle(0x888888); g.fillRect(60, 300, 360, 3)
    g.fillStyle(0x555555); g.fillRect(60, 290, 4, 115)
    g.fillStyle(0x555555); g.fillRect(416, 290, 4, 115)
    g.fillStyle(0x4488cc); g.fillRect(140, 303, 30, 45)
    g.fillStyle(0xcc4444); g.fillRect(290, 303, 25, 40)
    gen(KEYS.BG_PATIO_3, 480, 450)

    // ── BACKGROUNDS — TELHADO ────────────────────────────────────────────────
    // BG_TELHADO_1: noturno profundo + lua + 8 estrelas
    clr()
    g.fillStyle(0x080818); g.fillRect(0, 0, 480, 300)
    g.fillStyle(0x141428); g.fillRect(0, 300, 480, 150)
    g.fillStyle(0xf0f0e0, 0.9); g.fillCircle(400, 80, 24)
    const tStars: number[][] = [[40,30],[120,60],[200,25],[280,50],[60,100],[160,80],[320,35],[440,65]]
    tStars.forEach(([sx, sy]: number[]) => { g.fillStyle(0xffffff, 0.7); g.fillRect(sx, sy, 2, 2) })
    gen(KEYS.BG_TELHADO_1, 480, 450)

    // BG_TELHADO_2: caixa d'água + 2 antenas de TV
    clr()
    g.fillStyle(0x3a3a4a); g.fillRect(60, 240, 70, 60)
    g.fillStyle(0x2a2a3a); g.fillRect(60, 240, 70, 6)
    g.fillStyle(0x2a2a3a); g.fillRect(88, 220, 14, 22)
    g.fillStyle(0x2a2a2a); g.fillRect(260, 200, 4, 120)
    g.fillStyle(0x2a2a2a); g.fillRect(240, 210, 44, 3)
    g.fillStyle(0x2a2a2a); g.fillRect(360, 220, 4, 100)
    g.fillStyle(0x2a2a2a); g.fillRect(344, 230, 36, 3)
    gen(KEYS.BG_TELHADO_2, 480, 450)

    // BG_TELHADO_3: superfície de telhas + calha
    clr()
    ;[0, 1, 2, 3].forEach((i: number) => {
      g.fillStyle(i % 2 === 0 ? 0x4a3a2a : 0x3a2a1a)
      g.fillRect(0, 380 + i * 20, 480, 20)
    })
    g.fillStyle(0x606060); g.fillRect(0, 358, 480, 14)
    g.fillStyle(0x505050); g.fillRect(0, 356, 480, 4)
    ;[0, 60, 120, 180, 240, 300, 360, 420].forEach((px: number) => {
      g.fillStyle(0x2a1a0a, 0.4); g.fillRect(px, 380, 2, 70)
    })
    gen(KEYS.BG_TELHADO_3, 480, 450)

    // bg_boss_3: grade metálica + chão escuro com reflexo
    clr()
    g.fillStyle(0x2a2a3a); g.fillRect(0, 395, 200, 55)
    g.fillStyle(0x3a3a4a); g.fillRect(0, 393, 200, 4)
    ;[0, 20, 40, 60, 80, 100, 120, 140, 160, 180].forEach((px: number) => {
      g.fillStyle(0x444444); g.fillRect(px, 300, 6, 95)
    })
    g.fillStyle(0x444444); g.fillRect(0, 300, 200, 6)
    gen(KEYS.BG_BOSS_3, 200, 450)

    // ── Rua Noite backgrounds (World 3) ────────────────────────────────────────

    // BG_RUA_NOITE_1: céu roxo-azulado noturno + 2 estrelas + luar
    clr()
    g.fillStyle(0x0e0a1e); g.fillRect(0, 0, 480, 300)
    g.fillStyle(0x1a1232); g.fillRect(0, 300, 480, 150)
    g.fillStyle(0x8888cc, 0.15); g.fillEllipse(240, 330, 300, 60)
    g.fillStyle(0xffffff, 0.6); g.fillRect(60, 40, 2, 2); g.fillRect(300, 70, 2, 2)
    gen(KEYS.BG_RUA_NOITE_1, 480, 450)

    // BG_RUA_NOITE_2: prédios escuros com janelas iluminadas tênues
    clr()
    g.fillStyle(0x18141e); g.fillRect(0, 160, 130, 290)
    g.fillStyle(0xffe880, 0.5); g.fillRect(15, 185, 22, 30); g.fillRect(55, 185, 22, 30); g.fillRect(95, 185, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(15, 235, 22, 30); g.fillRect(95, 235, 22, 30)
    g.fillStyle(0x18141e); g.fillRect(150, 200, 150, 250)
    g.fillStyle(0xffe880, 0.5); g.fillRect(165, 225, 22, 30); g.fillRect(220, 225, 22, 30); g.fillRect(275, 225, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(165, 275, 22, 30)
    g.fillStyle(0x18141e); g.fillRect(315, 180, 165, 270)
    g.fillStyle(0xffe880, 0.5); g.fillRect(330, 205, 22, 30); g.fillRect(380, 205, 22, 30); g.fillRect(440, 205, 22, 30)
    g.fillStyle(0xffe880, 0.5); g.fillRect(330, 255, 22, 30); g.fillRect(440, 255, 22, 30)
    gen(KEYS.BG_RUA_NOITE_2, 480, 450)

    // BG_RUA_NOITE_3: calçada + poste com halo + grade baixa
    clr()
    g.fillStyle(0x4a4a5a); g.fillRect(0, 400, 480, 50)
    g.fillStyle(0x3a3a4a); g.fillRect(0, 398, 480, 4)
    g.fillStyle(0x888888, 0.9); g.fillRect(200, 300, 6, 102)
    g.fillStyle(0x888888, 0.9); g.fillRect(186, 300, 34, 5)
    g.fillStyle(0xffe080, 0.2); g.fillEllipse(220, 295, 70, 40)
    g.fillStyle(0x555565); g.fillRect(0, 380, 480, 6)
    ;[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 390, 420, 450].forEach((px: number) => {
      g.fillStyle(0x555565); g.fillRect(px, 355, 5, 32)
    })
    gen(KEYS.BG_RUA_NOITE_3, 480, 450)

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

    // DRONE: robô voador — corpo cinza escuro com câmera ciana 32×18
    clr()
    g.fillStyle(0x333344); g.fillRect(2, 6, 28, 10)
    g.fillStyle(0x444455); g.fillRect(4, 7, 24, 8)
    g.fillStyle(0x22ccff); g.fillRect(13, 8, 6, 6)
    g.fillStyle(0x222233); g.fillRect(0, 4, 6, 4)
    g.fillStyle(0x222233); g.fillRect(26, 4, 6, 4)
    g.lineStyle(1, 0x5555aa); g.strokeRect(2, 6, 28, 10)
    gen(KEYS.DRONE, 32, 18)

    // ZELADOR_BOSS — zelador maior, avental azul escuro, vassoura
    clr()
    // corpo principal
    g.fillStyle(0x1a3a6b); g.fillRect(6, 8, 20, 20)        // avental azul escuro
    g.fillStyle(0x8B6914); g.fillRect(10, 2, 12, 8)          // cabeça (castanho)
    g.fillStyle(0xf0c060); g.fillRect(12, 3, 8, 6)            // rosto
    // vassoura
    g.fillStyle(0x8B6914); g.fillRect(24, 4, 3, 24)           // cabo
    g.fillStyle(0xd4a020); g.fillRect(21, 26, 9, 4)           // cabeça da vassoura
    // pernas
    g.fillStyle(0x1a3a6b); g.fillRect(10, 26, 5, 6)           // perna esq
    g.fillStyle(0x1a3a6b); g.fillRect(17, 26, 5, 6)           // perna dir
    gen(KEYS.ZELADOR_BOSS, 32, 32)

    // CHAVE — chave metálica dourada/prata (projéctil do Zelador Boss)
    clr()
    g.fillStyle(0xd4af37); g.fillRect(0, 1, 8, 4)             // cabo da chave
    g.fillStyle(0xd4af37); g.fillRect(8, 0, 4, 6)             // cabeça da chave
    g.fillStyle(0xd4af37); g.fillRect(10, 2, 2, 2)             // dente 1
    g.fillStyle(0xc0c0c0); g.fillRect(1, 2, 6, 2)             // brilho prata no cabo
    gen(KEYS.CHAVE, 12, 6)

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

    // ── NPCs — SEGURANÇA (uniforme escuro, lanterna amarela) ──────────────────
    clr()
    g.fillStyle(0x222222); g.fillRect(3, 0, 12, 5)        // cabelo
    g.fillStyle(0xf0c090); g.fillRect(3, 3, 12, 11)       // cabeça
    g.fillStyle(0x222222); g.fillRect(5, 7, 2, 2); g.fillRect(11, 7, 2, 2) // olhos
    g.fillStyle(0xf0c090); g.fillRect(6, 14, 6, 3)        // pescoço
    g.fillStyle(0x223344); g.fillRect(2, 17, 14, 10)      // uniforme azul-escuro
    g.fillStyle(0x112233); g.fillRect(2, 17, 14, 3)       // ombros
    g.fillStyle(0x223344); g.fillRect(0, 17, 2, 8)        // braço esq
    g.fillStyle(0xf0c090); g.fillRect(0, 25, 2, 3)        // mão esq
    g.fillStyle(0x223344); g.fillRect(16, 17, 2, 8)       // braço dir
    g.fillStyle(0xffee00); g.fillRect(16, 20, 4, 7)       // lanterna amarela
    g.fillStyle(0x111122); g.fillRect(2, 27, 6, 12)       // calça preta
    g.fillStyle(0x111122); g.fillRect(10, 27, 6, 12)
    g.fillStyle(0x110000); g.fillRect(1, 39, 7, 3)        // sapatos
    g.fillStyle(0x110000); g.fillRect(10, 39, 7, 3)
    gen(KEYS.SEGURANCA, 20, 42)

    // ── NPCs — PORTEIRO (colete amarelo, braços cruzados) ────────────────────
    clr()
    g.fillStyle(0x555555); g.fillRect(3, 0, 12, 5)        // cabelo cinza
    g.fillStyle(0xf0c090); g.fillRect(3, 3, 12, 11)       // cabeça
    g.fillStyle(0x222222); g.fillRect(5, 7, 2, 2); g.fillRect(11, 7, 2, 2) // olhos
    g.fillStyle(0xf0c090); g.fillRect(6, 14, 6, 3)        // pescoço
    g.fillStyle(0xffffff); g.fillRect(2, 17, 14, 10)      // camisa branca
    g.fillStyle(0xcc8800); g.fillRect(3, 17, 4, 10)       // colete esq
    g.fillStyle(0xcc8800); g.fillRect(11, 17, 4, 10)      // colete dir
    g.fillStyle(0xffffff); g.fillRect(0, 19, 4, 6)        // braço esq
    g.fillStyle(0xffffff); g.fillRect(14, 19, 4, 6)       // braço dir
    g.fillStyle(0xf0c090); g.fillRect(0, 25, 4, 3)        // mão esq
    g.fillStyle(0xf0c090); g.fillRect(14, 25, 4, 3)       // mão dir
    g.fillStyle(0x444444); g.fillRect(2, 27, 6, 12)       // calça
    g.fillStyle(0x444444); g.fillRect(10, 27, 6, 12)
    g.fillStyle(0x222222); g.fillRect(1, 39, 7, 3)        // sapatos
    g.fillStyle(0x222222); g.fillRect(10, 39, 7, 3)
    gen(KEYS.PORTEIRO, 18, 42)

    // ── VEÍCULO — SEGURANÇA EM MOTO (moto escura + rider + farol) ────────────
    clr()
    // Moto — corpo
    g.fillStyle(0x1a1a2a); g.fillRect(10, 22, 40, 16)     // chassis
    g.fillStyle(0x2a2a3a); g.fillRect(8, 18, 44, 8)       // carenagem
    // Rodas
    g.fillStyle(0x111111); g.fillCircle(18, 38, 10)        // roda traseira
    g.fillStyle(0x111111); g.fillCircle(46, 38, 10)        // roda dianteira
    g.fillStyle(0x333333); g.fillCircle(18, 38, 6)         // jante traseira
    g.fillStyle(0x333333); g.fillCircle(46, 38, 6)         // jante dianteira
    // Farol (frente → esquerda, moto vai para a esquerda)
    g.fillStyle(0xffee44); g.fillEllipse(8, 22, 12, 8)     // farol amarelo
    g.fillStyle(0xffffff, 0.6); g.fillEllipse(7, 21, 6, 4) // brilho
    // Piloto
    g.fillStyle(0x223344); g.fillRect(24, 8, 14, 14)       // torso uniforme
    g.fillStyle(0x111111); g.fillRect(25, 4, 10, 7)        // capacete
    g.fillStyle(0xffcc00); g.fillRect(26, 5, 8, 3)         // visor dourado
    gen(KEYS.SEGURANCA_MOTO, 60, 50)

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
    if (profileManager.getActive() === null) {
      this.scene.start(KEYS.PROFILE_SELECT)
    } else {
      this.scene.start(KEYS.MENU)
    }
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
