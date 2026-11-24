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
}
