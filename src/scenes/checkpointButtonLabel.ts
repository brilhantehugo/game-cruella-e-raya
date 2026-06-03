/** Texto do botão ENTER no Game Over, conforme haja ou não checkpoint ativo. */
export function checkpointButtonLabel(reached: boolean): string {
  return reached
    ? '[ ENTER — retomar do checkpoint ]'
    : '[ ENTER — recomeçar do início da fase ]'
}
