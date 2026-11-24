import type { DeviceProfile, ImageSettings } from '@/types/studio'

export interface ProcessedImage {
  canvas: HTMLCanvasElement
  pixels: Uint8Array
}

export type ImageRasterSource = HTMLImageElement | HTMLCanvasElement

export const defaultImageSettings: ImageSettings = {
  brightness: 0,
  contrast: 0,
  threshold: 128,
  scale: 0.5,
  cropX: 0,
  cropY: 0,
  dither: false,
  invert: false,
}

export function processImage(
  source: ImageRasterSource,
  device: DeviceProfile,
  settings: ImageSettings,
): ProcessedImage {
  const canvas = document.createElement('canvas')
  canvas.width = device.width
  canvas.height = device.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D context is unavailable')

  const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
  const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height
  if (!sourceWidth || !sourceHeight) throw new Error('The selected image has no dimensions')

  const scale = Math.max(device.width / sourceWidth, device.height / sourceHeight) * settings.scale
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  const offsetX = (device.width - width) * (0.5 + settings.cropX / 200)
  const offsetY = (device.height - height) * (0.5 + settings.cropY / 200)
  context.fillStyle = '#fff'
  context.fillRect(0, 0, device.width, device.height)
  context.drawImage(source, offsetX, offsetY, width, height)

  const image = context.getImageData(0, 0, device.width, device.height)
  const { data } = image
  const pixels = new Uint8Array(device.width * device.height)
  const contrast = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
  const valueAt = (index: number) => {
    const luminance = data[index]! * 0.299 + data[index + 1]! * 0.587 + data[index + 2]! * 0.114
    return Math.max(0, Math.min(255, contrast * (luminance - 128) + 128 + settings.brightness))
  }

  if (settings.dither) {
    const working = new Float32Array(device.width * device.height)
    for (let y = 0; y < device.height; y++) {
      for (let x = 0; x < device.width; x++) {
        const index = y * device.width + x
        working[index] = valueAt(index * 4)
      }
    }

    for (let y = 0; y < device.height; y++) {
      for (let x = 0; x < device.width; x++) {
        const index = y * device.width + x
        const oldValue = working[index]!
        const newValue = oldValue >= settings.threshold ? 255 : 0
        pixels[index] = newValue === 0 ? 1 : 0
        const error = oldValue - newValue
        if (x + 1 < device.width) working[index + 1] = working[index + 1]! + (error * 7) / 16
        if (y + 1 < device.height) {
          if (x > 0) {
            const target = index + device.width - 1
            working[target] = working[target]! + (error * 3) / 16
          }
          const below = index + device.width
          working[below] = working[below]! + (error * 5) / 16
          if (x + 1 < device.width) {
            const target = index + device.width + 1
            working[target] = working[target]! + error / 16
          }
        }
      }
    }
  } else {
    for (let index = 0; index < pixels.length; index++) {
      pixels[index] = valueAt(index * 4) < settings.threshold ? 1 : 0
    }
  }

  for (let index = 0; index < pixels.length; index++) {
    if (settings.invert) pixels[index] = pixels[index] ? 0 : 1
    const color = pixels[index] ? 0 : 255
    const offset = index * 4
    data[offset] = color
    data[offset + 1] = color
    data[offset + 2] = color
    data[offset + 3] = 255
  }
  context.putImageData(image, 0, 0)
  return { canvas, pixels }
}

export function splitPixels(pixels: Uint8Array, device: DeviceProfile): [Uint8Array, Uint8Array] {
  const halfWidth = Math.floor(device.width / 2)
  const left = new Uint8Array(halfWidth * device.height)
  const right = new Uint8Array((device.width - halfWidth) * device.height)

  for (let y = 0; y < device.height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      left[y * halfWidth + x] = pixels[y * device.width + x]!
    }
    for (let x = halfWidth; x < device.width; x++) {
      right[y * (device.width - halfWidth) + x - halfWidth] = pixels[y * device.width + x]!
    }
  }
  return [left, right]
}
