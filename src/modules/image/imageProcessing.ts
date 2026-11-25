import type { DeviceProfile, ImageSettings } from '@/types/studio'
import {
  adjustBrightnessAndContrast,
  bitmapPixelToColor,
  calculateContrastFactor,
  calculateCoverScale,
  calculateCropOffset,
  calculateDiffusedError,
  calculateHalfWidth,
  calculateLuminance,
  calculatePixelIndex,
  calculateScaledSize,
  thresholdToBitmapPixel,
  thresholdToMonochrome,
} from '@/modules/math'

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

  const coverScale = calculateCoverScale(device.width, device.height, sourceWidth, sourceHeight)
  const width = calculateScaledSize(sourceWidth, coverScale, settings.scale)
  const height = calculateScaledSize(sourceHeight, coverScale, settings.scale)
  const offsetX = calculateCropOffset(device.width, width, settings.cropX)
  const offsetY = calculateCropOffset(device.height, height, settings.cropY)
  context.fillStyle = '#fff'
  context.fillRect(0, 0, device.width, device.height)
  context.drawImage(source, offsetX, offsetY, width, height)

  const image = context.getImageData(0, 0, device.width, device.height)
  const { data } = image
  const pixels = new Uint8Array(device.width * device.height)
  const contrast = calculateContrastFactor(settings.contrast)
  const valueAt = (index: number) => {
    const luminance = calculateLuminance(data[index]!, data[index + 1]!, data[index + 2]!)
    return adjustBrightnessAndContrast(luminance, contrast, settings.brightness)
  }

  if (settings.dither) {
    const working = new Float32Array(device.width * device.height)
    for (let y = 0; y < device.height; y++) {
      for (let x = 0; x < device.width; x++) {
        const index = calculatePixelIndex(x, y, device.width)
        working[index] = valueAt(index * 4)
      }
    }

    for (let y = 0; y < device.height; y++) {
      for (let x = 0; x < device.width; x++) {
        const index = calculatePixelIndex(x, y, device.width)
        const oldValue = working[index]!
        const newValue = thresholdToMonochrome(oldValue, settings.threshold)
        pixels[index] = thresholdToBitmapPixel(oldValue, settings.threshold)
        const error = oldValue - newValue
        if (x + 1 < device.width) working[index + 1] = working[index + 1]! + calculateDiffusedError(error, 7)
        if (y + 1 < device.height) {
          if (x > 0) {
            const target = index + device.width - 1
            working[target] = working[target]! + calculateDiffusedError(error, 3)
          }
          const below = index + device.width
          working[below] = working[below]! + calculateDiffusedError(error, 5)
          if (x + 1 < device.width) {
            const target = index + device.width + 1
            working[target] = working[target]! + calculateDiffusedError(error, 1)
          }
        }
      }
    }
  } else {
    for (let index = 0; index < pixels.length; index++) {
      pixels[index] = thresholdToBitmapPixel(valueAt(index * 4), settings.threshold)
    }
  }

  for (let index = 0; index < pixels.length; index++) {
    if (settings.invert) pixels[index] = pixels[index] ? 0 : 1
    const color = bitmapPixelToColor(pixels[index]!)
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
  const halfWidth = calculateHalfWidth(device.width)
  const left = new Uint8Array(halfWidth * device.height)
  const right = new Uint8Array((device.width - halfWidth) * device.height)

  for (let y = 0; y < device.height; y++) {
    for (let x = 0; x < halfWidth; x++) {
      left[calculatePixelIndex(x, y, halfWidth)] = pixels[calculatePixelIndex(x, y, device.width)]!
    }
    for (let x = halfWidth; x < device.width; x++) {
      right[calculatePixelIndex(x - halfWidth, y, device.width - halfWidth)] = pixels[
        calculatePixelIndex(x, y, device.width)
      ]!
    }
  }
  return [left, right]
}
