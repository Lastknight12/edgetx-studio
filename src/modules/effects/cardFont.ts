const glyphs: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'],
  '7': ['111', '001', '010', '010', '010'],
  Q: ['010', '101', '101', '111', '011'],
  '3': ['110', '001', '010', '001', '110'],
  S: ['011', '100', '010', '001', '110'],
  H: ['101', '101', '111', '101', '101'],
  D: ['110', '101', '101', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
}

export function drawCardGlyph(
  context: CanvasRenderingContext2D,
  glyph: string,
  centerX: number,
  centerY: number,
  angle: number,
  offsetX: number,
  offsetY: number,
): void {
  const rows = glyphs[glyph]
  if (!rows) return
  const cosAngle = Math.cos(angle)
  const sinAngle = Math.sin(angle)
  for (let row = 0; row < rows.length; row++) {
    for (let column = 0; column < 3; column++) {
      if (rows[row]![column] === '1') {
        const localX = offsetX + column
        const localY = offsetY + row
        const x = centerX + localX * cosAngle - localY * sinAngle
        const y = centerY + localX * sinAngle + localY * cosAngle
        context.fillRect(Math.floor(x), Math.floor(y), 1, 1)
      }
    }
  }
}

export function drawCardPip(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  angle: number,
): void {
  const cosAngle = Math.cos(angle)
  const sinAngle = Math.sin(angle)
  for (const [localX, localY] of [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]]) {
    const x = centerX + localX! * cosAngle - localY! * sinAngle
    const y = centerY + localX! * sinAngle + localY! * cosAngle
    context.fillRect(Math.floor(x), Math.floor(y), 1, 1)
  }
}
