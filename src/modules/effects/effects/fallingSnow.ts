import type { EffectDefinition } from '@/types/studio'

export const fallingSnow: EffectDefinition = {
  id: 'falling-snow',
  name: 'Falling snow',
  description: 'Pixel snowflakes drift down with a light breeze.',
  options: [
    { key: 'count', label: 'Snowflakes', min: 6, max: 32, step: 1 },
    { key: 'speed', label: 'Fall speed', min: 0.2, max: 2.5, step: 0.1 },
    { key: 'wind', label: 'Wind', min: -2, max: 2, step: 0.1 },
    { key: 'size', label: 'Flake size', min: 1, max: 3, step: 1 },
  ],
  defaults: { count: 20, speed: 0.8, wind: 0.2, size: 2 },
}
