import type { EffectDefinition } from '@/types/studio'
import { drawPixelLine } from '../pixelDrawing'

export const fallingSakura: EffectDefinition = {
  id: 'falling-sakura',
  name: 'Falling sakura',
  description: 'Light petals drift through the frame.',
  options: [
    { key: 'count', label: 'Petals', min: 2, max: 24, step: 1 },
    { key: 'speed', label: 'Fall speed', min: 0.2, max: 2.5, step: 0.1 },
    { key: 'wind', label: 'Wind', min: -2, max: 2, step: 0.1 },
    { key: 'size', label: 'Petal size', min: 1, max: 4, step: 0.5 },
    { key: 'randomness', label: 'Randomness', min: 0, max: 1, step: 0.05 },
  ],
  defaults: { count: 10, speed: 0.8, wind: 0.2, size: 2, randomness: 0.6 },
  render(context, width, height, time, settings) {
    const count = Number(settings.count ?? 10)
    const speed = Number(settings.speed ?? 0.8)
    const wind = Number(settings.wind ?? 0.2)
    const size = Number(settings.size ?? 2)
    const randomness = Number(settings.randomness ?? 0.6)
    const cycle = height + 12

    for (let index = 0; index < count; index++) {
      const seed = index * 37.17
      const variation = 0.55 + ((index % 5) / 5) * randomness
      const phase = (((time * speed * variation + seed) % cycle) + cycle) % cycle
      const sway = Math.sin(time * 1.8 + seed) * 3
      const x =
        ((((seed * 1.73 + phase * wind + sway) % (width + 8)) + width + 8) % (width + 8)) - 4
      const y = phase - 6
      const radius = Math.max(2, Math.floor(size * (0.85 + (index % 3) * 0.22) + 0.5))
      const angle = Math.sin(time * 2 + seed) * 0.8
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      context.fillStyle = '#000'
      for (let row = -radius; row <= radius; row++) {
        const halfWidth = radius * 0.75 * (1 - Math.abs(row) / (radius + 1))
        const x1 = x - halfWidth * cosAngle - row * sinAngle
        const y1 = y - halfWidth * sinAngle + row * cosAngle
        const x2 = x + halfWidth * cosAngle - row * sinAngle
        const y2 = y + halfWidth * sinAngle + row * cosAngle
        drawPixelLine(context, x1, y1, x2, y2)
      }
      context.fillStyle = '#fff'
      drawPixelLine(
        context,
        x + radius * sinAngle,
        y - radius * cosAngle,
        x - radius * sinAngle,
        y + radius * cosAngle,
      )
    }
  },
}
