import type { DeviceProfile, EffectInstance } from '@/types/studio'
import { getLuaEffectGenerator } from './effects/registry'
import { animationLuaTemplate } from './templates/animation'
import { staticLuaTemplate } from './templates/static'

export function canvasToMonochromePixels(canvas: HTMLCanvasElement): Uint8Array {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D context is unavailable')
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = new Uint8Array(canvas.width * canvas.height)
  for (let pixel = 0; pixel < pixels.length; pixel++) {
    const offset = pixel * 4
    pixels[pixel] = data[offset]! < 128 ? 1 : 0
  }
  return pixels
}

export function generateLua(
  frames: { duration: number }[],
  device: DeviceProfile,
  loop: boolean,
  effects: EffectInstance[],
): string {
  const enabledEffects = effects
    .filter((effect) => effect.enabled)
    .sort((left, right) => left.order - right.order)
  const effectFunctions = enabledEffects
    .map((effect, index) =>
      getLuaEffectGenerator(effect.type).generate(effect, device, `drawEffect${index + 1}`),
    )
    .join('\n')
  const effectCalls = enabledEffects.map((_, index) => `  drawEffect${index + 1}(time)`).join('\n')

  if (frames.length > 1) {
    return animationLuaTemplate(device, frames, loop, effectFunctions, effectCalls)
  }
  return staticLuaTemplate(device, effectFunctions, effectCalls)
}
