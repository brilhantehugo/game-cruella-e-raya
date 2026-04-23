import Phaser from 'phaser'
import { Enemy } from '../entities/Enemy'
import { GatoMalencarado }  from '../entities/enemies/GatoMalencarado'
import { PomboAgitado }     from '../entities/enemies/PomboAgitado'
import { RatoDeCalcada }    from '../entities/enemies/RatoDeCalcada'
import { DonoNervoso }      from '../entities/enemies/DonoNervoso'
import { Aspirador }        from '../entities/enemies/Aspirador'
import { GatoSelvagem }     from '../entities/enemies/GatoSelvagem'
import { Seguranca }        from '../entities/enemies/Seguranca'
import { Porteiro }         from '../entities/enemies/Porteiro'
import { Zelador }          from '../entities/enemies/Zelador'
import { Morador }          from '../entities/enemies/Morador'
import { Hugo }             from '../entities/npc/Hugo'
import { Hannah }           from '../entities/npc/Hannah'

export class LevelBuilder {
  constructor(private scene: Phaser.Scene) {}

  createEnemy(type: string, x: number, y: number): Enemy | null {
    switch (type) {
      case 'gato':          return new GatoMalencarado(this.scene, x, y)
      case 'pombo':         return new PomboAgitado(this.scene, x, y)
      case 'rato':          return new RatoDeCalcada(this.scene, x, y)
      case 'dono':          return new DonoNervoso(this.scene, x, y)
      case 'aspirador':     return new Aspirador(this.scene, x, y)
      case 'hugo':          return new Hugo(this.scene, x, y)
      case 'hannah':        return new Hannah(this.scene, x, y)
      case 'zelador':       return new Zelador(this.scene, x, y)
      case 'morador':       return new Morador(this.scene, x, y)
      case 'gato_selvagem': return new GatoSelvagem(this.scene, x, y)
      case 'seguranca':     return new Seguranca(this.scene, x, y)
      case 'porteiro':      return new Porteiro(this.scene, x, y)
      default:
        console.warn(`[LevelBuilder] tipo de inimigo desconhecido: "${type}"`)
        return null
    }
  }
}
