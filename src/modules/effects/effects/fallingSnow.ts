import type { EffectDefinition } from '@/types/studio'
import { drawPixelLine } from '../pixelDrawing'

export const fallingSnow: EffectDefinition = {
  id: 'falling-snow',
  name: 'Falling snow',
  description: 'Pixel snowflakes drift down with a light breeze.',
  options: [
    { key: 'count', label: 'Snowflakes', min: 6, max: 32, step: 1 },
    { key: 'speed', label: 'Fall speed', min: 0.2, max: 2.5, step: 0.1 },
    { key: 'wind', label: 'Wind', min: -2, max: 2, step: 0.1 },
    { key: 'size', label: 'Flake size', min: 1, max: 3, step: 1 },
  ],
  defaults: { count: 20, speed: 0.8, wind: 0.2, size: 2 },
  render(context, width, height, time, settings) {
    const count = Number(settings.count ?? 20)
    const speed = Number(settings.speed ?? 0.8)
    const wind = Number(settings.wind ?? 0.2)
    const size = Math.round(Number(settings.size ?? 2))
    const cycle = height + 6

    context.fillStyle = '#000'
    for (let index = 0; index < count; index++) {
      const seed = index * 19.73 + 7.1
      const phase = (time * speed * (4 + (index % 4) * 1.5) + seed * 11) % cycle
      const y = phase - 3
      const baseX = (seed * 13.17) % width
      const drift = baseX + time * wind * 5 + Math.sin(time * 0.8 + seed) * 2.5
      const x = ((drift % width) + width) % width

      if (size === 1) {
        drawPixelLine(context, x, y, x, y)
      } else {
        drawPixelLine(context, x - size, y, x + size, y)
        drawPixelLine(context, x, y - size, x, y + size)
        if (size >= 3) {
          drawPixelLine(context, x - 1, y - 1, x - 2, y - 2)
          drawPixelLine(context, x + 1, y - 1, x + 2, y - 2)
          drawPixelLine(context, x - 1, y + 1, x - 2, y + 2)
          drawPixelLine(context, x + 1, y + 1, x + 2, y + 2)
        }
      }
    }
  },
}
