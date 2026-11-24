import type { EffectDefinition } from '@/types/studio'
import { drawPixelSpan } from '../pixelDrawing'

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
      const length = Math.max(5, Math.floor(size * 2.1 + 0.5))
      const leafWidth = Math.max(2, Math.floor(size * 1.05 + 0.5))
      const mirror = index % 2 === 0 ? 1 : -1
      const rotation =
        Math.sin(time * 1.2 + seed) * 0.55 + 0.7 * mirror

      context.fillStyle = '#000'
      const cosAngle = Math.cos(rotation)
      const sinAngle = Math.sin(rotation)
      const points: [number, number][] = [
        [-0.18 * length, 0],
        [0.08 * length, -0.34 * leafWidth],
        [0.42 * length, -leafWidth],
        [0.78 * length, -0.82 * leafWidth],
        [length, 0],
        [0.76 * length, 0.74 * leafWidth],
        [0.38 * length, 0.92 * leafWidth],
        [0.06 * length, 0.28 * leafWidth],
        [-0.18 * length, 0],
      ]

      const rotatedPoints = points.map(([localX, localY]) => {
        const rotatedX = x + localX * cosAngle - localY * sinAngle
        const rotatedY = y + localX * sinAngle + localY * cosAngle
        return [Math.floor(rotatedX), Math.floor(rotatedY)] as const
      })
      const top = Math.min(...rotatedPoints.map((point) => point[1]))
      const bottom = Math.max(...rotatedPoints.map((point) => point[1]))
      context.fillStyle = '#000'
      for (let scanY = top; scanY <= bottom; scanY++) {
        const intersections: number[] = []
        for (let edge = 0; edge < rotatedPoints.length - 1; edge++) {
          const [x1, y1] = rotatedPoints[edge]!
          const [x2, y2] = rotatedPoints[edge + 1]!
          if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
            intersections.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1))
          }
        }
        if (intersections.length >= 2) {
          drawPixelSpan(context, Math.min(...intersections), scanY, Math.max(...intersections))
        }
      }
    }
  },
}
