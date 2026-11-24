import type { EffectDefinition } from '@/types/studio'
import { drawPixelLine, drawPixelSpan } from '../pixelDrawing'
import { drawCardGlyph, drawCardPip } from '../cardFont'

const suits = ['S', 'H', 'D', 'C']
const ranks = ['A', '7', 'Q', '3']

export const fallingCards: EffectDefinition = {
  id: 'falling-cards',
  name: 'Falling cards',
  description: 'Monochrome playing cards tumble across the screen.',
  options: [
    { key: 'count', label: 'Cards', min: 1, max: 8, step: 1 },
    { key: 'speed', label: 'Fall speed', min: 0.2, max: 2.5, step: 0.1 },
    { key: 'size', label: 'Card scale', min: 0.45, max: 1.2, step: 0.05 },
  ],
  defaults: { count: 4, speed: 0.7, size: 0.8 },
  render(context, width, height, time, settings) {
    const count = Number(settings.count ?? 4)
    const speed = Number(settings.speed ?? 0.7)
    const scale = Number(settings.size ?? 0.8)
    const cardWidth = Math.max(7, Math.floor(15 * scale + 0.5))
    const cardHeight = Math.max(9, Math.floor(21 * scale + 0.5))
    const cycle = height + cardHeight + 8

    context.fillStyle = '#000'
    for (let index = 0; index < count; index++) {
      const seed = index * 29.41
      const x = 5 + ((seed * 1.91) % Math.max(1, width - 10))
      const y = ((time * speed * (7 + (index % 3) * 3) + seed * 5) % cycle) - cardHeight
      const rotation = Math.sin(time * (0.8 + index * 0.13) + seed) * 0.7
      const suit = suits[index % suits.length]!
      const rank = ranks[index % ranks.length]!

      const halfWidth = cardWidth * 0.5
      const halfHeight = cardHeight * 0.5
      const cosAngle = Math.cos(rotation)
      const sinAngle = Math.sin(rotation)
      const corners = [
        [-halfWidth, -halfHeight],
        [halfWidth, -halfHeight],
        [halfWidth, halfHeight],
        [-halfWidth, halfHeight],
      ].map(([px, py]) => [
        x + px! * cosAngle - py! * sinAngle,
        y + px! * sinAngle + py! * cosAngle,
      ])
      context.fillStyle = '#fff'
      const top = Math.min(...corners.map((point) => point[1]!))
      const bottom = Math.max(...corners.map((point) => point[1]!))
      for (let scanY = Math.floor(top); scanY <= Math.floor(bottom); scanY++) {
        const intersections: number[] = []
        for (let edge = 0; edge < 4; edge++) {
          const next = (edge + 1) % 4
          const x1 = corners[edge]![0]!
          const y1 = corners[edge]![1]!
          const x2 = corners[next]![0]!
          const y2 = corners[next]![1]!
          if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
            intersections.push(x1 + ((scanY - y1) * (x2 - x1)) / (y2 - y1))
          }
        }
        if (intersections.length >= 2) {
          drawPixelSpan(context, Math.min(...intersections), scanY, Math.max(...intersections))
        }
      }
      context.fillStyle = '#000'
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4
        drawPixelLine(
          context,
          corners[edge]![0]!,
          corners[edge]![1]!,
          corners[next]![0]!,
          corners[next]![1]!,
        )
      }

      // Keep the rank, suit, and pip in the card's local coordinates as it rotates.
      context.fillStyle = '#000'
      drawCardGlyph(context, rank, x, y, rotation, -4, -6)
      drawCardGlyph(context, suit, x, y, rotation, 1, 2)
      drawCardPip(context, x, y, rotation)
    }
  },
}
