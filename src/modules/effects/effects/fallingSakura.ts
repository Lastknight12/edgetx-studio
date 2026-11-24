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
}
