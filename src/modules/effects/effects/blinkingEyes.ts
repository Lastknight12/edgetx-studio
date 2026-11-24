import type { EffectDefinition } from '@/types/studio'
import { drawPixelSpan } from '../pixelDrawing'

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
      const x = Math.round(xRatio! * width)
      const y = Math.round(yRatio! * height)
      const phase = (time * frequency + index * 0.713) % 4
      const closed = phase < duration ? Math.sin((phase / duration) * Math.PI) : 0
      const eyeHeight = Math.floor(4 * (1 - closed) + 0.5)
      context.fillStyle = '#000'
      if (eyeHeight <= 1) {
        drawPixelSpan(context, x - 6, y, x + 6)
      } else {
        for (let row = -eyeHeight; row <= eyeHeight; row++) {
          const vertical = row / eyeHeight
          const rowWidth = Math.floor(7 * Math.sqrt(1 - vertical * vertical))
          drawPixelSpan(context, x - rowWidth, y + row, x + rowWidth)
        }
        context.fillStyle = '#fff'
        for (let row = -(eyeHeight - 1); row <= eyeHeight - 1; row++) {
          const vertical = row / (eyeHeight - 1)
          const rowWidth = Math.floor(6 * Math.sqrt(1 - vertical * vertical))
          drawPixelSpan(context, x - rowWidth, y + row, x + rowWidth)
        }
        context.fillStyle = '#000'
        const pupilX = x + (index % 2 === 0 ? -1 : 1)
        for (let row = -2; row <= 2; row++) {
          const vertical = row / 2
          const pupilHalfWidth = Math.floor(Math.sqrt(1 - vertical * vertical))
          drawPixelSpan(context, pupilX - pupilHalfWidth, y + row, pupilX + pupilHalfWidth)
        }
        context.fillStyle = '#fff'
        drawPixelSpan(context, pupilX - 1, y - 1, pupilX - 1)
      }
    }
  },
}
