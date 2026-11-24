import type { EffectDefinition } from '@/types/studio'

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

    context.fillStyle = '#111'
    for (let index = 0; index < count; index++) {
      const seed = index * 37.17
      const variation = 0.55 + ((index % 5) / 5) * randomness
      const phase = (((time * speed * variation + seed) % cycle) + cycle) % cycle
      const sway = Math.sin(time * 1.8 + seed) * 3
      const x =
        ((((seed * 1.73 + phase * wind + sway) % (width + 8)) + width + 8) % (width + 8)) - 4
      const y = phase - 6
      const radius = Math.max(2, Math.round(size * (0.85 + (index % 3) * 0.22)))
      context.save()
      context.translate(x, y)
      context.rotate(Math.sin(time * 2 + seed) * 0.8)
      context.beginPath()
      context.moveTo(0, -radius)
      context.quadraticCurveTo(radius * 1.25, -radius * 0.35, 0, radius)
      context.quadraticCurveTo(-radius * 1.2, radius * 0.1, 0, -radius)
      context.fill()
      context.restore()
    }
  },
}
