import type { EffectDefinition } from '@/types/studio'

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
    const cardWidth = 15 * scale
    const cardHeight = 21 * scale
    const cycle = height + cardHeight + 8

    context.fillStyle = '#000'
    for (let index = 0; index < count; index++) {
      const seed = index * 29.41
      const x = 5 + ((seed * 1.91) % Math.max(1, width - 10))
      const y = ((time * speed * (7 + (index % 3) * 3) + seed * 5) % cycle) - cardHeight
      const rotation = Math.sin(time * (0.8 + index * 0.13) + seed) * 0.7
      const suit = suits[index % suits.length]!
      const rank = ranks[index % ranks.length]!

      context.save()
      context.translate(Math.round(x), Math.round(y))
      context.rotate(rotation)
      context.fillStyle = '#fff'
      context.strokeStyle = '#000'
      context.lineWidth = 1
      context.beginPath()
      context.rect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight)
      context.fill()
      context.stroke()
      context.fillStyle = '#000'
      context.font = `bold ${Math.max(4, Math.round(5 * scale))}px monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(rank, 0, -2 * scale)
      context.font = `bold ${Math.max(5, Math.round(7 * scale))}px monospace`
      context.fillText(suit, 0, 4 * scale)
      context.restore()
    }
  },
}
