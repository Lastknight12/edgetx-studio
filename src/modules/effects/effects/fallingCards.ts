import type { EffectDefinition } from '@/types/studio'

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
}
