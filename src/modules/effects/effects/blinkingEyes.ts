import type { EffectDefinition } from '@/types/studio'

export const blinkingEyes: EffectDefinition = {
  id: 'blinking-eyes',
  name: 'Blinking eyes',
  description: 'A handful of eyes blink at uneven intervals.',
  options: [
    { key: 'count', label: 'Eye count', min: 1, max: 8, step: 1 },
    { key: 'frequency', label: 'Blink rate', min: 0.2, max: 3, step: 0.1 },
    { key: 'duration', label: 'Blink duration', min: 0.08, max: 0.6, step: 0.02 },
  ],
  defaults: { count: 3, frequency: 1.2, duration: 0.2 },
  render(context, width, height, time, settings) {
    const count = Number(settings.count ?? 3)
    const frequency = Number(settings.frequency ?? 1.2)
    const duration = Number(settings.duration ?? 0.2)
    const positions = [
      [0.2, 0.34],
      [0.5, 0.28],
      [0.78, 0.38],
      [0.34, 0.72],
      [0.68, 0.7],
      [0.12, 0.78],
      [0.87, 0.2],
      [0.52, 0.83],
    ]

    for (let index = 0; index < count; index++) {
      const [xRatio, yRatio] = positions[index]!
      const x = xRatio! * width
      const y = yRatio! * height
      const phase = (time * frequency + index * 0.713) % 4
      const closed = phase < duration ? Math.sin((phase / duration) * Math.PI) : 0
      const eyeWidth = 10
      const eyeHeight = Math.max(0.7, 5 * (1 - closed))

      context.fillStyle = '#fff'
      context.beginPath()
      context.ellipse(x, y, eyeWidth / 2, eyeHeight / 2, 0, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = '#111'
      context.lineWidth = 0.8
      context.stroke()
      if (closed < 0.78) {
        context.fillStyle = '#111'
        context.beginPath()
        context.arc(x, y, 1.5, 0, Math.PI * 2)
        context.fill()
      }
    }
  },
}
