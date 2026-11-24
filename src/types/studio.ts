export interface DeviceProfile {
  id: string
  name: string
  width: number
  height: number
  colorDepth: number
  split: 'vertical'
  notes: string[]
}

export interface ImageSettings {
  brightness: number
  contrast: number
  threshold: number
  scale: number
  cropX: number
  cropY: number
  dither: boolean
  invert: boolean
}

export interface AnimationFrame {
  id: string
  file: File
  url: string
  duration: number
}

export interface EffectOption {
  key: string
  label: string
  min: number
  max: number
  step: number
}

export type EffectSettings = Record<string, number | boolean>

export interface EffectInstance {
  id: string
  type: string
  enabled: boolean
  order: number
  settings: EffectSettings
}

export interface EffectDefinition {
  id: string
  name: string
  description: string
  options: EffectOption[]
  defaults: EffectSettings
}
