import type { DeviceProfile, EffectInstance } from '@/types/studio'
import { getEffectDefinition } from './registry'

export function renderComposite(
  base: HTMLCanvasElement | null,
  effects: EffectInstance[],
  device: DeviceProfile,
  time: number,
  output?: HTMLCanvasElement,
): HTMLCanvasElement {
  const canvas = output ?? document.createElement('canvas')
  if (canvas.width !== device.width) canvas.width = device.width
  if (canvas.height !== device.height) canvas.height = device.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')
  context.globalCompositeOperation = 'source-over'
  context.globalAlpha = 1
  context.clearRect(0, 0, device.width, device.height)
  context.fillStyle = '#fff'
  context.fillRect(0, 0, device.width, device.height)
  if (base) context.drawImage(base, 0, 0)

  for (const effect of [...effects]
    .filter((item) => item.enabled)
    .sort((a, b) => a.order - b.order)) {
    getEffectDefinition(effect.type).render(
      context,
      device.width,
      device.height,
      time,
      effect.settings,
    )
  }

  // The target LCD is 1-bit, so show the same hard black/white result in the preview.
  const image = context.getImageData(0, 0, device.width, device.height)
  for (let index = 0; index < image.data.length; index += 4) {
    const luminance =
      image.data[index]! * 0.299 + image.data[index + 1]! * 0.587 + image.data[index + 2]! * 0.114
    const level = luminance < 128 ? 0 : 255
    image.data[index] = level
    image.data[index + 1] = level
    image.data[index + 2] = level
    image.data[index + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return canvas
}
