import type { DeviceProfile, EffectInstance } from '@/types/studio'

export interface LuaEffectGenerator {
  type: string
  generate(effect: EffectInstance, device: DeviceProfile, functionName: string): string
}

export function numberSetting(effect: EffectInstance, key: string, fallback: number): number {
  const value = effect.settings[key]
  return typeof value === 'number' ? value : fallback
}
