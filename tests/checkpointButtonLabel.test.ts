import { describe, it, expect } from 'vitest'
import { checkpointButtonLabel } from '../src/scenes/checkpointButtonLabel'

describe('checkpointButtonLabel', () => {
  it('com checkpoint ativo menciona "checkpoint"', () => {
    expect(checkpointButtonLabel(true)).toContain('checkpoint')
  })
  it('sem checkpoint menciona "início da fase"', () => {
    expect(checkpointButtonLabel(false)).toContain('início da fase')
  })
  it('ambos os labels começam com "[ ENTER"', () => {
    expect(checkpointButtonLabel(true)).toContain('[ ENTER')
    expect(checkpointButtonLabel(false)).toContain('[ ENTER')
  })
})
