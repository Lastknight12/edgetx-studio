import type { EffectDefinition } from '@/types/studio'

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
}
