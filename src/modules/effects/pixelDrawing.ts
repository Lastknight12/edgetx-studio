/** Draws integer LCD pixels without browser antialiasing. Coordinates match Lua math.floor calls. */
export function drawPixelLine(
  context: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  let x = Math.floor(startX)
  let y = Math.floor(startY)
  const targetX = Math.floor(endX)
  const targetY = Math.floor(endY)
  const dx = Math.abs(targetX - x)
  const sx = x < targetX ? 1 : -1
  const dy = -Math.abs(targetY - y)
  const sy = y < targetY ? 1 : -1
  let error = dx + dy

  while (true) {
    context.fillRect(x, y, 1, 1)
    if (x === targetX && y === targetY) break
    const doubledError = 2 * error
    if (doubledError >= dy) {
      error += dy
      x += sx
    }
    if (doubledError <= dx) {
      error += dx
      y += sy
    }
  }
}

export function drawPixelSpan(
  context: CanvasRenderingContext2D,
  startX: number,
  y: number,
  endX: number,
): void {
  const left = Math.floor(Math.min(startX, endX))
  const right = Math.floor(Math.max(startX, endX))
  context.fillRect(left, Math.floor(y), right - left + 1, 1)
}
