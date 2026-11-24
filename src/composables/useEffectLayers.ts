import { computed, ref } from 'vue'
import { createEffectInstance, effectRegistry } from '@/modules/effects/registry'
import type { EffectInstance } from '@/types/studio'

export function useEffectLayers() {
  const effects = ref<EffectInstance[]>([])
  const enabledCount = computed(() => effects.value.filter((effect) => effect.enabled).length)

  function addEffect(type: string) {
    effects.value = [...effects.value, createEffectInstance(type, effects.value.length)]
  }

  function updateEffect(id: string, update: (effect: EffectInstance) => EffectInstance) {
    effects.value = effects.value
      .map((effect) => (effect.id === id ? update(effect) : effect))
      .map((effect, order) => ({ ...effect, order }))
  }

  function removeEffect(id: string) {
    effects.value = effects.value
      .filter((effect) => effect.id !== id)
      .map((effect, order) => ({ ...effect, order }))
  }

  function reorderEffect(id: string, direction: -1 | 1) {
    const index = effects.value.findIndex((effect) => effect.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= effects.value.length) return
    const reordered = [...effects.value]
    const [effect] = reordered.splice(index, 1)
    if (effect) reordered.splice(target, 0, effect)
    effects.value = reordered.map((item, order) => ({ ...item, order }))
  }

  function toggleEffect(id: string, enabled: boolean) {
    updateEffect(id, (effect) => ({ ...effect, enabled }))
  }

  function setEffectSetting(id: string, key: string, value: number) {
    updateEffect(id, (effect) => ({
      ...effect,
      settings: { ...effect.settings, [key]: value },
    }))
  }

  return {
    effects,
    definitions: effectRegistry,
    enabledCount,
    addEffect,
    updateEffect,
    removeEffect,
    reorderEffect,
    toggleEffect,
    setEffectSetting,
  }
}
