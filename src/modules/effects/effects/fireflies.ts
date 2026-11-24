import type { EffectDefinition } from '@/types/studio'
import { drawPixelLine } from '../pixelDrawing'

export const fireflies: EffectDefinition = {
  id: 'fireflies',
  name: 'Fireflies',
  description: 'Tiny lights drift and blink across the screen.',
  options: [
    { key: 'count', label: 'Fireflies', min: 2, max: 12, step: 1 },
    { key: 'speed', label: 'Twinkle speed', min: 0.2, max: 2.5, step: 0.1 },
    { key: 'size', label: 'Spark size', min: 1, max: 3, step: 1 },
  ],
  defaults: { count: 7, speed: 1, size: 2 },
  render(context, width, height, time, settings) {
    const count = Number(settings.count ?? 7)
    const speed = Number(settings.speed ?? 1)
    const size = Math.round(Number(settings.size ?? 2))

    context.fillStyle = '#000'
    for (let index = 0; index < count; index++) {
      const seed = index * 29.17 + 3.7
      const xBase = 3 + ((seed * 17.31) % Math.max(1, width - 6))
      const yBase = 3 + ((seed * 23.73) % Math.max(1, height - 6))
      const x = Math.floor(xBase + Math.sin(time * speed * 0.55 + seed) * 3)
      const y = Math.floor(yBase + Math.cos(time * speed * 0.7 + seed) * 2)
      const pulse = Math.sin(time * speed * 2 + seed * 1.3)

      if (pulse > -0.65) drawPixelLine(context, x, y, x, y)
      if (pulse > 0.15) {
        const radius = size + (pulse > 0.8 ? 1 : 0)
        drawPixelLine(context, x - radius, y, x + radius, y)
        drawPixelLine(context, x, y - radius, x, y + radius)
        if (pulse > 0.8) {
          drawPixelLine(context, x - 1, y - 1, x + 1, y + 1)
          drawPixelLine(context, x - 1, y + 1, x + 1, y - 1)
        }
      }
    }
  },
}
