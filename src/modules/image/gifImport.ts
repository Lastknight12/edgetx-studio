import { decompressFrame, parseGIF, type ParsedFrame } from 'gifuct-js'
import type { DeviceProfile, ImageSettings } from '@/types/studio'
import { processImage, type ProcessedImage } from './imageProcessing'

export function isGifFile(file: File): boolean {
  return file.type.toLowerCase() === 'image/gif' || /\.gif$/i.test(file.name)
}

export interface ImportedGifFrame {
  source: HTMLCanvasElement
  thumbnailUrl: string
  duration: number
  processed: ProcessedImage
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function createThumbnail(source: HTMLCanvasElement): Promise<string> {
  const thumbnail = document.createElement('canvas')
  thumbnail.width = 40
  thumbnail.height = 40
  const context = thumbnail.getContext('2d')
  if (!context) throw new Error('Canvas 2D context is unavailable')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, 40, 40)
  const scale = Math.min(40 / source.width, 40 / source.height)
  const width = source.width * scale
  const height = source.height * scale
  context.drawImage(source, (40 - width) / 2, (40 - height) / 2, width, height)

  return new Promise((resolve, reject) => {
    thumbnail.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Unable to create a GIF frame thumbnail'))
        return
      }
      resolve(URL.createObjectURL(blob))
    }, 'image/png')
  })
}

export async function importGifFrames(
  file: File,
  device: DeviceProfile,
  settings: ImageSettings,
  onFrame: (frame: ImportedGifFrame) => void,
  onProgress: (completed: number, total: number) => void,
): Promise<number> {
  const parsed = parseGIF(await file.arrayBuffer())
  const imageFrames = parsed.frames.filter((frame) => 'image' in frame)
  if (!imageFrames.length || !parsed.lsd.width || !parsed.lsd.height) {
    throw new Error(`GIF contains no decodable frames: ${file.name}`)
  }

  const gifCanvas = document.createElement('canvas')
  gifCanvas.width = parsed.lsd.width
  gifCanvas.height = parsed.lsd.height
  const gifContext = gifCanvas.getContext('2d', { willReadFrequently: true })
  if (!gifContext) throw new Error('Canvas 2D context is unavailable')
  gifContext.clearRect(0, 0, gifCanvas.width, gifCanvas.height)
  const patchCanvas = document.createElement('canvas')
  const patchContext = patchCanvas.getContext('2d')
  if (!patchContext) throw new Error('Canvas 2D context is unavailable')

  let previousFrame: ParsedFrame | null = null
  let previousRestore: ImageData | null = null
  let outputCount = 0

  for (let index = 0; index < imageFrames.length; index++) {
    const encodedFrame = imageFrames[index]!
    if (!('image' in encodedFrame)) continue
    const frame = decompressFrame(encodedFrame, parsed.gct, true)
    if (!frame?.patch) continue

    if (previousFrame) {
      if (previousFrame.disposalType === 2) {
        gifContext.clearRect(
          previousFrame.dims.left,
          previousFrame.dims.top,
          previousFrame.dims.width,
          previousFrame.dims.height,
        )
      } else if (previousFrame.disposalType === 3 && previousRestore) {
        gifContext.putImageData(previousRestore, 0, 0)
      }
    }

    previousRestore =
      frame.disposalType === 3
        ? gifContext.getImageData(0, 0, gifCanvas.width, gifCanvas.height)
        : null
    patchCanvas.width = frame.dims.width
    patchCanvas.height = frame.dims.height
    const patch = new Uint8ClampedArray(new ArrayBuffer(frame.patch.byteLength))
    patch.set(frame.patch)
    patchContext.putImageData(new ImageData(patch, frame.dims.width, frame.dims.height), 0, 0)
    // GIF image blocks are often partial rectangles. Draw the patch with normal
    // alpha compositing so transparent pixels retain the previous canvas.
    gifContext.drawImage(patchCanvas, frame.dims.left, frame.dims.top)
    previousFrame = frame

    const source = document.createElement('canvas')
    source.width = device.width
    source.height = device.height
    const sourceContext = source.getContext('2d')
    if (!sourceContext) throw new Error('Canvas 2D context is unavailable')
    sourceContext.drawImage(gifCanvas, 0, 0, device.width, device.height)
    const thumbnailUrl = await createThumbnail(source)
    try {
      const processed = processImage(source, device, settings)
      onFrame({ source, thumbnailUrl, duration: Math.max(20, frame.delay || 100), processed })
    } catch (error) {
      URL.revokeObjectURL(thumbnailUrl)
      throw error
    }
    outputCount++
    onProgress(index + 1, imageFrames.length)
    if (index % 4 === 3 || index === imageFrames.length - 1) await yieldToBrowser()
  }

  if (!outputCount) throw new Error(`Unable to decode GIF frames: ${file.name}`)
  return outputCount
}
