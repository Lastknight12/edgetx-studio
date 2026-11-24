import type { EffectDefinition, EffectInstance } from '@/types/studio'
import { fallingCards } from './effects/fallingCards'
import { fallingSakura } from './effects/fallingSakura'
import { blinkingEyes } from './effects/blinkingEyes'
import { fallingSnow } from './effects/fallingSnow'
import { fireflies } from './effects/fireflies'

export const effectRegistry: EffectDefinition[] = [
  fallingSakura,
  fallingSnow,
  fireflies,
  blinkingEyes,
  fallingCards,
]

export function getEffectDefinition(id: string): EffectDefinition {
  const definition = effectRegistry.find((effect) => effect.id === id)
  if (!definition) throw new Error(`Unknown effect: ${id}`)
  return definition
}

export function createEffectInstance(type: string, order: number): EffectInstance {
  const definition = getEffectDefinition(type)
  return {
    id: `${type}-${crypto.randomUUID()}`,
    type,
    enabled: true,
    order,
    settings: { ...definition.defaults },
  }
}
